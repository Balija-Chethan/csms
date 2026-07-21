import os
from django.utils import timezone
from datetime import date, datetime, timedelta
from django.contrib.auth import authenticate
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from api.models import (
    User, Batch, BatchEnrollment, Task, Submission, 
    LeetcodeChallenge, LeetcodeSubmission, StudyNote, 
    MockDriveResult, AttendanceLog, LeaveRequest, ChatMessage,
    PlacementCompany, PlacementRound, PlacementResource
)
from api.serializers import (
    UserSerializer, BatchSerializer, BatchEnrollmentSerializer,
    TaskSerializer, SubmissionSerializer, StudyNoteSerializer, 
    MockDriveResultSerializer, AttendanceLogSerializer,
    LeaveRequestSerializer, ChatMessageSerializer,
    PlacementCompanySerializer, LeetcodeSubmissionSerializer
)
from api.auth_utils import JWTAuthentication, generate_token

# Helper function to get student's active batch
def get_student_batch(student):
    enrollment = BatchEnrollment.objects.filter(student=student, status='approved').first()
    return enrollment.batch if enrollment else None

def update_user_last_seen(user):
    if not user or not user.is_authenticated:
        return
    now = timezone.now()
    if not user.last_seen or (now - user.last_seen).total_seconds() > 60:
        user.last_seen = now
        user.save(update_fields=['last_seen'])

def get_online_student_count():
    five_mins_ago = timezone.now() - timedelta(minutes=5)
    return User.objects.filter(role='student', last_seen__gte=five_mins_ago).count()

@api_view(['POST'])
@permission_classes([AllowAny])
def register_student(request):
    data = request.data
    email = data.get('email')
    password = data.get('password')
    first_name = data.get('firstName', '')
    last_name = data.get('lastName', '')
    roll_number = data.get('rollNumber', '')
    phone_number = data.get('phoneNumber', '')

    if not email or not password:
        return Response({'error': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)

    # Restore from mongo first to check existing accounts
    from api.mongo import get_mongo_db, restore_from_mongo, sync_to_mongo
    restore_from_mongo()

    if User.objects.filter(username=email).exists() or User.objects.filter(email=email).exists():
        return Response({'error': 'A user with this email already exists'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(
        username=email,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
        roll_number=roll_number,
        phone_number=phone_number,
        role='student'
    )
    
    # Sync immediately to MongoDB Atlas
    user_data = {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'password': user.password,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'roll_number': user.roll_number,
        'phone_number': user.phone_number,
        'role': user.role
    }
    sync_to_mongo('users', user.id, user_data)

    token = generate_token(user)
    return Response({
        'token': token,
        'user': UserSerializer(user).data
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_student(request):
    email = request.data.get('email')
    password = request.data.get('password')

    if not email or not password:
        return Response({'error': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)

    from api.mongo import restore_from_mongo
    restore_from_mongo()

    user = authenticate(username=email, password=password)
    if not user:
        # Check by email in case username differs
        existing = User.objects.filter(email=email).first()
        if existing and existing.check_password(password):
            user = existing

    if not user:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

    token = generate_token(user)
    return Response({
        'token': token,
        'user': UserSerializer(user).data
    }, status=status.HTTP_200_OK)



@api_view(['GET', 'PUT'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def student_profile(request):
    user = request.user
    if request.method == 'GET':
        return Response(UserSerializer(user).data)
    
    elif request.method == 'PUT':
        data = request.data
        user.first_name = data.get('firstName', user.first_name)
        user.last_name = data.get('lastName', user.last_name)
        user.phone_number = data.get('phoneNumber', user.phone_number)
        user.github_url = data.get('githubUrl', user.github_url)
        user.linkedin_url = data.get('linkedinUrl', user.linkedin_url)
        user.portfolio_url = data.get('portfolioUrl', user.portfolio_url)
        user.hackerrank_url = data.get('hackerrankUrl', user.hackerrank_url)
        
        password = data.get('password')
        if password:
            user.set_password(password)

        user.save()
        return Response(UserSerializer(user).data)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def student_dashboard(request):
    user = request.user
    batch = get_student_batch(user)
    
    if not batch:
        return Response({
            'student': UserSerializer(user).data,
            'batch': None,
            'status': 'awaiting_allocation'
        })

    # 1. Tasks Completion Summary
    tasks = Task.objects.filter(batch=batch)
    total_tasks = tasks.count()
    completed_submissions = Submission.objects.filter(student=user, task__batch=batch, grade__isnull=False).count()
    pending_submissions = Submission.objects.filter(student=user, task__batch=batch, grade__isnull=True).count()
    not_submitted = total_tasks - completed_submissions - pending_submissions
    completion_rate = round((completed_submissions / total_tasks) * 100) if total_tasks > 0 else 0

    # 2. Leaderboard Rank
    students_in_batch = User.objects.filter(enrollments__batch=batch, enrollments__status='approved')
    rankings = []
    for s in students_in_batch:
        tasks_score = Submission.objects.filter(student=s, grade__isnull=False).count() * 100
        mock_score = sum([m.total_score for m in MockDriveResult.objects.filter(student=s)])
        total_score = tasks_score + mock_score
        rankings.append((s.id, total_score))
    
    rankings.sort(key=lambda x: x[1], reverse=True)
    my_rank = 1
    for r in rankings:
        if r[0] == user.id:
            break
        my_rank += 1

    # 3. Attendance Summary
    logs = AttendanceLog.objects.filter(student=user)
    total_days = logs.count()
    present_days = logs.filter(status='present').count()
    absent_days = logs.filter(status='absent').count()
    leave_days = logs.filter(status='leave').count()
    attendance_rate = round((present_days / (total_days - leave_days)) * 100) if (total_days - leave_days) > 0 else 100

    # 4. Checkin Status Today
    today = date.today()
    today_log = AttendanceLog.objects.filter(student=user, date=today).first()
    checked_in = today_log is not None and today_log.check_in is not None
    checked_out = today_log is not None and today_log.check_out is not None
    
    session_duration = 0
    if checked_in and not checked_out:
        session_duration = int((timezone.now() - today_log.check_in).total_seconds())
    elif checked_in and checked_out:
        session_duration = int(today_log.total_time.total_seconds())

    # 5. Recent Activity Feed
    recent_activities = []
    for sub in Submission.objects.filter(student=user).order_by('-submitted_at')[:5]:
        if sub.grade:
            recent_activities.append({
                'type': 'task_graded',
                'title': f"Task Graded: {sub.task.title}",
                'detail': f"Grade: {sub.grade} - {sub.feedback or ''}",
                'timestamp': sub.graded_at or sub.submitted_at
            })
        else:
            recent_activities.append({
                'type': 'task_submitted',
                'title': f"Task Submitted: {sub.task.title}",
                'detail': "Awaiting review",
                'timestamp': sub.submitted_at
            })
    
    recent_activities.sort(key=lambda x: x['timestamp'], reverse=True)

    return Response({
        'student': UserSerializer(user).data,
        'batch': BatchSerializer(batch).data,
        'status': 'allocated',
        'taskCompletion': {
            'doneRate': completion_rate,
            'completed': completed_submissions,
            'pending': pending_submissions,
            'notSubmitted': not_submitted
        },
        'leaderboard': {
            'rank': my_rank,
            'totalPeers': len(rankings)
        },
        'attendance': {
            'rate': attendance_rate,
            'totalDays': total_days,
            'present': present_days,
            'absent': absent_days,
            'leave': leave_days
        },
        'checkInState': {
            'isCheckedIn': checked_in,
            'isCheckedOut': checked_out,
            'sessionDuration': session_duration,
            'logDate': today.strftime("%Y-%m-%d")
        },
        'recentActivities': recent_activities[:5]
    })


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def student_checkin(request):
    user = request.user
    today = date.today()
    action = request.data.get('action') # 'checkin' or 'checkout'

    log, created = AttendanceLog.objects.get_or_create(student=user, date=today)

    if action == 'checkin':
        if log.check_in and log.check_out:
            log.check_in = timezone.now()
            log.check_out = None
            log.total_time = None
            log.status = 'present'
            log.save()
            return Response({'status': 'New check-in session started successfully.', 'time': log.check_in})

        if log.check_in:
            return Response({'error': 'Already checked in today'}, status=status.HTTP_400_BAD_REQUEST)
        log.check_in = timezone.now()
        log.status = 'present'
        log.save()
        return Response({'status': 'Checked in successfully', 'time': log.check_in})
        
    elif action == 'checkout':
        if not log.check_in:
            return Response({'error': 'You must check in first before checking out'}, status=status.HTTP_400_BAD_REQUEST)
        if log.check_out:
            return Response({'error': 'Already checked out today'}, status=status.HTTP_400_BAD_REQUEST)
        
        log.check_out = timezone.now()
        log.total_time = log.check_out - log.check_in
        
        hours_logged = log.total_time.total_seconds() / 3600.0
        if 8.0 <= hours_logged <= 10.0:
            log.status = 'present'
        else:
            log.status = 'absent'
            
        log.save()
        
        return Response({
            'status': f'Checked out successfully. Logged {hours_logged:.2f} hours. Marked as {log.status.upper()}.', 
            'time': log.check_out,
            'duration': int(log.total_time.total_seconds()),
            'attendance_status': log.status
        })

    return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def student_tasks(request):
    user = request.user
    batch = get_student_batch(user)
    
    if not batch:
        return Response({'error': 'No batch active'}, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'GET':
        tasks = Task.objects.filter(batch=batch).order_by('-due_date')
        serialized_tasks = []
        for task in tasks:
            sub = Submission.objects.filter(task=task, student=user).first()
            serialized_tasks.append({
                'id': task.id,
                'title': task.title,
                'description': task.description,
                'due_date': task.due_date,
                'submission': SubmissionSerializer(sub).data if sub else None
            })
        return Response(serialized_tasks)

    elif request.method == 'POST':
        task_id = request.data.get('taskId')
        github_url = request.data.get('githubUrl')

        if not task_id or not github_url:
            return Response({'error': 'Task ID and GitHub URL are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            task = Task.objects.get(id=task_id, batch=batch)
        except Task.DoesNotExist:
            return Response({'error': 'Task not found in this batch'}, status=status.HTTP_404_NOT_FOUND)

        sub, created = Submission.objects.get_or_create(task=task, student=user, defaults={'github_url': github_url})
        if not created:
            sub.github_url = github_url
            sub.save()

        return Response(SubmissionSerializer(sub).data)


@api_view(['GET', 'POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def student_leetcode(request):
    user = request.user
    update_user_last_seen(user)
    
    # Calculate active challenge date based on Asia/Kolkata (IST) 9 AM boundary (9 AM to 9 AM next day)
    try:
        from zoneinfo import ZoneInfo
        local_now = timezone.now().astimezone(ZoneInfo('Asia/Kolkata'))
    except Exception:
        # Fallback to manual IST offset (+5.5 hours) if ZoneInfo is not supported
        local_now = timezone.now() + timedelta(hours=5.5)
        
    active_time = local_now - timedelta(hours=9)
    active_date = active_time.date()

    
    if request.method == 'GET':
        challenges = LeetcodeChallenge.objects.all().order_by('available_date', 'day_number')
        challenge_ids = [ch.id for ch in challenges]
        
        # Single query lookup for all student submissions (Scalable for 200+ users)
        submissions_dict = {
            sub.challenge_id: sub 
            for sub in LeetcodeSubmission.objects.filter(student=user, challenge_id__in=challenge_ids)
        }
        
        # Calculate streak dynamically
        # Retrieve all challenges released up to the current active_date
        past_challenges = [ch for ch in challenges if ch.available_date <= active_date]
        past_challenges.reverse()  # Go backwards in time
        
        streak = 0
        for ch in past_challenges:
            sub = submissions_dict.get(ch.id)
            has_solved = sub and sub.status == 'completed'
            
            if ch.available_date == active_date:
                # If active challenge is solved, increment streak
                # If not solved yet, do not break the streak since the day's window is still open
                if has_solved:
                    streak += 1
            else:
                # If past challenge was solved, increment streak
                if has_solved:
                    streak += 1
                else:
                    # Missed past challenge = Streak is broken!
                    break
        
        serialized = []
        solved_count = 0
        for ch in challenges:
            sub = submissions_dict.get(ch.id)
            has_solved = sub and sub.status == 'completed'
            
            # Visibility: 
            # 1. Today's active challenge is visible.
            # 2. Older challenges are ONLY visible if they were successfully solved.
            # 3. Future challenges are locked and hidden.
            is_active = ch.available_date == active_date
            is_past = ch.available_date < active_date
            
            if is_active:
                is_unlocked = True
                visible = True
            elif is_past:
                is_unlocked = True
                visible = has_solved  # Hidden if missed/unsolved
            else:
                is_unlocked = False
                visible = False
            
            if visible:
                if has_solved:
                    solved_count += 1
                
                # Deadline is 9:00 AM of the day after available_date
                deadline_dt = timezone.make_aware(
                    datetime.combine(ch.available_date + timedelta(days=1), datetime.min.time().replace(hour=9))
                )
                
                serialized.append({
                    'id': ch.id,
                    'title': ch.title,
                    'url': ch.url,
                    'available_date': ch.available_date,
                    'day_number': ch.day_number,
                    'deadline': deadline_dt,
                    'is_unlocked': is_unlocked,
                    'is_today': is_active,
                    'submission': LeetcodeSubmissionSerializer(sub).data if sub else None
                })
        
        return Response({
            'challenges': serialized,
            'streak': streak,
            'solved': solved_count,
            'onlineStudents': get_online_student_count()
        })

    elif request.method == 'POST':
        challenge_id = request.data.get('challengeId')
        submission_url = request.data.get('submissionUrl')

        if not challenge_id or not submission_url:
            return Response({'error': 'Challenge ID and submission URL are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            ch = LeetcodeChallenge.objects.get(id=challenge_id)
        except LeetcodeChallenge.DoesNotExist:
            return Response({'error': 'Challenge not found'}, status=status.HTTP_404_NOT_FOUND)

        # Enforce active submission window: must be the current active challenge
        try:
            from zoneinfo import ZoneInfo
            local_now = timezone.now().astimezone(ZoneInfo('Asia/Kolkata'))
        except Exception:
            local_now = timezone.now() + timedelta(hours=5.5)

        active_time = local_now - timedelta(hours=9)
        active_date = active_time.date()

        if ch.available_date != active_date:
            return Response({'error': 'This challenge window is closed. You can only submit today\'s active challenge.'}, status=status.HTTP_403_FORBIDDEN)


        sub, created = LeetcodeSubmission.objects.get_or_create(challenge=ch, student=user, defaults={'submission_url': submission_url})
        if not created:
            sub.submission_url = submission_url
            sub.save()

        return Response(LeetcodeSubmissionSerializer(sub).data)



@api_view(['GET', 'POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def student_heartbeat(request):
    update_user_last_seen(request.user)
    return Response({
        'onlineStudents': get_online_student_count(),
        'status': 'active'
    })



@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def student_notes(request):
    user = request.user
    batch = get_student_batch(user)
    notes = StudyNote.objects.filter(models.Q(batch=batch) | models.Q(category='global')).order_by('-date_shared')
    return Response(StudyNoteSerializer(notes, many=True).data)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def student_grades(request):
    user = request.user
    submissions = Submission.objects.filter(student=user, grade__isnull=False).order_by('-graded_at')
    mock_drives = MockDriveResult.objects.filter(student=user).order_by('-date')

    return Response({
        'grades': SubmissionSerializer(submissions, many=True).data,
        'mockDrives': MockDriveResultSerializer(mock_drives, many=True).data
    })


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def student_leaderboard(request):
    user = request.user
    batch = get_student_batch(user)
    
    if not batch:
        return Response([])

    students = User.objects.filter(enrollments__batch=batch, enrollments__status='approved')
    leaderboard_data = []
    
    for s in students:
        tasks_score = Submission.objects.filter(student=s, grade__isnull=False).count() * 100
        mock_score = sum([m.total_score for m in MockDriveResult.objects.filter(student=s)])
        total_score = tasks_score + mock_score
        
        leaderboard_data.append({
            'id': s.id,
            'name': s.get_full_name() or s.username,
            'tasksScore': tasks_score,
            'mocksScore': mock_score,
            'overallScore': total_score,
            'is_me': s.id == user.id
        })

    leaderboard_data.sort(key=lambda x: x['overallScore'], reverse=True)
    for idx, entry in enumerate(leaderboard_data):
        entry['rank'] = idx + 1
        
    return Response(leaderboard_data)


@api_view(['GET', 'POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def student_leaves(request):
    user = request.user
    if request.method == 'GET':
        leaves = LeaveRequest.objects.filter(student=user).order_by('-date')
        return Response(LeaveRequestSerializer(leaves, many=True).data)
        
    elif request.method == 'POST':
        leave_type = request.data.get('leave_type')
        date_str = request.data.get('date')
        reason = request.data.get('reason')
        pdf_url = request.data.get('pdf_url', '')

        if not leave_type or not date_str or not reason:
            return Response({'error': 'Missing required fields'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            leave_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            return Response({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)

        leave = LeaveRequest.objects.create(
            student=user,
            leave_type=leave_type,
            date=leave_date,
            reason=reason,
            pdf_url=pdf_url,
            status='pending'
        )
        
        # Mark attendance log status to Leave
        AttendanceLog.objects.update_or_create(
            student=user, date=leave_date,
            defaults={'status': 'leave', 'check_in': None, 'check_out': None, 'total_time': None}
        )

        return Response(LeaveRequestSerializer(leave).data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def student_chat(request):
    user = request.user
    batch = get_student_batch(user)
    
    if not batch:
        return Response({'error': 'No active batch group chat'}, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'GET':
        messages = ChatMessage.objects.filter(batch=batch).order_by('timestamp')
        return Response(ChatMessageSerializer(messages, many=True).data)

    elif request.method == 'POST':
        content = request.data.get('content')
        if not content:
            return Response({'error': 'Message content is empty'}, status=status.HTTP_400_BAD_REQUEST)

        msg = ChatMessage.objects.create(
            batch=batch,
            sender=user,
            content=content
        )
        return Response(ChatMessageSerializer(msg).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_attendance_log(request):
    user = request.user
    logs = AttendanceLog.objects.filter(student=user).order_by('-date')
    return Response(AttendanceLogSerializer(logs, many=True).data)


# ==========================================
# ADMIN ENDPOINTS (Phase 2 Views Refactoring)
# ==========================================

def verify_admin(user):
    if user.role != 'admin' and not user.is_staff and not user.is_superuser:
        raise PermissionError("Access Denied: Admin role required")

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_pending_students(request):
    try:
        verify_admin(request.user)
    except PermissionError as e:
        return Response({'error': str(e)}, status=status.HTTP_403_FORBIDDEN)

    # Fetch batch enrollments that are pending
    pending_enrollments = BatchEnrollment.objects.filter(status='pending').select_related('student', 'batch')
    
    # Students who have NO approved or pending enrollment
    active_student_ids = BatchEnrollment.objects.filter(status__in=['approved', 'pending']).values_list('student_id', flat=True)
    unassigned_students = User.objects.filter(role='student').exclude(id__in=active_student_ids)

    unassigned_data = []
    for s in unassigned_students:
        full_name = s.get_full_name().strip() if s.get_full_name() else s.username
        unassigned_data.append({
            'id': s.id,
            'student': s.id,
            'student_name': full_name or s.username,
            'student_email': s.email,
            'student_roll': s.roll_number or 'N/A',
            'status': 'unassigned',
            'batch_name': 'None Allocated'
        })

    serialized_pending = BatchEnrollmentSerializer(pending_enrollments, many=True).data
    
    return Response({
        'pending': serialized_pending,
        'unassigned': unassigned_data,
        'batches': BatchSerializer(Batch.objects.all(), many=True).data
    })


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_allocate_batch(request):
    try:
        verify_admin(request.user)
    except PermissionError as e:
        return Response({'error': str(e)}, status=status.HTTP_403_FORBIDDEN)

    student_id = request.data.get('studentId')
    batch_id = request.data.get('batchId')
    action = request.data.get('action', 'approved') # 'approved' or 'rejected'

    if not student_id or not batch_id:
        return Response({'error': 'Student ID and Batch ID are required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        student = User.objects.get(id=student_id, role='student')
        batch = Batch.objects.get(id=batch_id)
    except (User.DoesNotExist, Batch.DoesNotExist):
        return Response({'error': 'Student or Batch not found'}, status=status.HTTP_404_NOT_FOUND)

    # Clean up existing non-matching enrollments for student
    BatchEnrollment.objects.filter(student=student).exclude(batch=batch).delete()

    enrollment, created = BatchEnrollment.objects.get_or_create(
        student=student, 
        batch=batch, 
        defaults={'status': action}
    )
    if not created:
        enrollment.status = action
        enrollment.save()

    status_msg = f'Student {student.get_full_name() or student.username} allocated to {batch.name} successfully ({action}).'
    return Response({'status': status_msg})



@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_create_task(request):
    try:
        verify_admin(request.user)
    except PermissionError as e:
        return Response({'error': str(e)}, status=status.HTTP_403_FORBIDDEN)

    batch_id = request.data.get('batchId')
    title = request.data.get('title')
    description = request.data.get('description')
    due_date_str = request.data.get('dueDate')

    if not batch_id or not title or not due_date_str:
        return Response({'error': 'Missing required fields'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        batch = Batch.objects.get(id=batch_id)
        due_date = datetime.strptime(due_date_str, "%Y-%m-%d").date()
    except Batch.DoesNotExist:
        return Response({'error': 'Batch not found'}, status=status.HTTP_404_NOT_FOUND)
    except ValueError:
        return Response({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)

    task = Task.objects.create(
        batch=batch,
        title=title,
        description=description,
        due_date=due_date
    )
    return Response(TaskSerializer(task).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_get_submissions(request):
    try:
        verify_admin(request.user)
    except PermissionError as e:
        return Response({'error': str(e)}, status=status.HTTP_403_FORBIDDEN)

    submissions = Submission.objects.all().order_by('-submitted_at')
    return Response(SubmissionSerializer(submissions, many=True).data)


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_grade_submission(request):
    try:
        verify_admin(request.user)
    except PermissionError as e:
        return Response({'error': str(e)}, status=status.HTTP_403_FORBIDDEN)

    sub_id = request.data.get('submissionId')
    grade = request.data.get('grade')
    feedback = request.data.get('feedback', '')

    if not sub_id or not grade:
        return Response({'error': 'Submission ID and Grade are required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        sub = Submission.objects.get(id=sub_id)
    except Submission.DoesNotExist:
        return Response({'error': 'Submission not found'}, status=status.HTTP_404_NOT_FOUND)

    sub.grade = grade
    sub.feedback = feedback
    sub.graded_at = timezone.now()
    sub.save()

    return Response(SubmissionSerializer(sub).data)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_get_leaves(request):
    try:
        verify_admin(request.user)
    except PermissionError as e:
        return Response({'error': str(e)}, status=status.HTTP_403_FORBIDDEN)

    leaves = LeaveRequest.objects.all().order_by('-created_at')
    return Response(LeaveRequestSerializer(leaves, many=True).data)


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_resolve_leave(request):
    try:
        verify_admin(request.user)
    except PermissionError as e:
        return Response({'error': str(e)}, status=status.HTTP_403_FORBIDDEN)

    leave_id = request.data.get('leaveId')
    status_action = request.data.get('status') # 'approved' or 'rejected'
    admin_response = request.data.get('adminResponse', '')

    if not leave_id or not status_action:
        return Response({'error': 'Leave ID and Action status are required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        leave = LeaveRequest.objects.get(id=leave_id)
    except LeaveRequest.DoesNotExist:
        return Response({'error': 'Leave request not found'}, status=status.HTTP_404_NOT_FOUND)

    leave.status = status_action
    leave.admin_response = admin_response
    leave.save()

    # Update corresponding AttendanceLog status
    AttendanceLog.objects.filter(student=leave.student, date=leave.date).update(
        status='leave' if status_action == 'approved' else 'absent'
    )

    return Response(LeaveRequestSerializer(leave).data)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_get_attendance(request):
    try:
        verify_admin(request.user)
    except PermissionError as e:
        return Response({'error': str(e)}, status=status.HTTP_403_FORBIDDEN)

    logs = AttendanceLog.objects.all().order_by('-date', 'student__username')
    return Response(AttendanceLogSerializer(logs, many=True).data)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_dashboard_stats(request):
    try:
        verify_admin(request.user)
    except PermissionError as e:
        return Response({'error': str(e)}, status=status.HTTP_403_FORBIDDEN)

    total_students = User.objects.filter(role='student').count()
    active_batches = Batch.objects.count()
    pending_leaves = LeaveRequest.objects.filter(status='pending').count()
    pending_grades = Submission.objects.filter(grade__isnull=True).count()
    online_students = get_online_student_count()

    return Response({
        'totalStudents': total_students,
        'activeBatches': active_batches,
        'pendingLeaves': pending_leaves,
        'pendingGrades': pending_grades,
        'onlineStudents': online_students
    })


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_placement_prep(request):
    companies = PlacementCompany.objects.all().order_by('name')
    return Response(PlacementCompanySerializer(companies, many=True).data)


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_create_leetcode_challenge(request):
    try:
        verify_admin(request.user)
    except PermissionError as e:
        return Response({'error': str(e)}, status=status.HTTP_403_FORBIDDEN)

    title = request.data.get('title')
    url = request.data.get('url')
    deadline = request.data.get('deadline')
    day_number = request.data.get('dayNumber', 1)
    available_date_str = request.data.get('availableDate')

    if not title or not url or not deadline:
        return Response({'error': 'Title, URL, and deadline are required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        parsed_date = datetime.strptime(deadline, "%Y-%m-%d")
        aware_deadline = timezone.make_aware(parsed_date.replace(hour=23, minute=59, second=59))
        avail_date = datetime.strptime(available_date_str, "%Y-%m-%d").date() if available_date_str else timezone.now().date()
    except ValueError:
        return Response({'error': 'Invalid date format, use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)

    challenge = LeetcodeChallenge.objects.create(
        title=title,
        url=url,
        day_number=day_number,
        available_date=avail_date,
        deadline=aware_deadline
    )

    return Response({'status': 'Leetcode challenge created successfully', 'id': challenge.id})


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_bulk_create_leetcode(request):
    try:
        verify_admin(request.user)
    except PermissionError as e:
        return Response({'error': str(e)}, status=status.HTTP_403_FORBIDDEN)

    challenges_data = request.data.get('challenges', [])
    start_date_str = request.data.get('startDate')

    if not challenges_data:
        return Response({'error': 'No challenges provided for 10-day bulk schedule.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        base_start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date() if start_date_str else timezone.now().date()
    except ValueError:
        base_start_date = timezone.now().date()

    created_ids = []
    for idx, item in enumerate(challenges_data):
        title = item.get('title')
        url = item.get('url')
        day_num = item.get('dayNumber') or (idx + 1)
        
        if not title or not url:
            continue

        avail_date = base_start_date + timedelta(days=idx)
        deadline_date = timezone.make_aware(datetime.combine(avail_date, datetime.max.time().replace(microsecond=0)))

        ch = LeetcodeChallenge.objects.create(
            title=title,
            url=url,
            day_number=day_num,
            available_date=avail_date,
            deadline=deadline_date
        )
        created_ids.append(ch.id)

    return Response({
        'status': f'Successfully scheduled {len(created_ids)} LeetCode challenges for 10-day release cycle.',
        'count': len(created_ids)
    }, status=status.HTTP_201_CREATED)



@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_create_batch(request):
    try:
        verify_admin(request.user)
    except PermissionError as e:
        return Response({'error': str(e)}, status=status.HTTP_403_FORBIDDEN)

    name = request.data.get('name')
    description = request.data.get('description', '')

    if not name:
        return Response({'error': 'Batch name is required'}, status=status.HTTP_400_BAD_REQUEST)

    if Batch.objects.filter(name__iexact=name).exists():
        return Response({'error': 'A batch with this name already exists'}, status=status.HTTP_400_BAD_REQUEST)

    batch = Batch.objects.create(name=name, description=description)
    return Response({
        'status': 'Batch created successfully.',
        'batch': BatchSerializer(batch).data
    }, status=status.HTTP_201_CREATED)


# ==========================================
# ADMIN EXTENDED CRUD ENDPOINTS
# ==========================================

@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_create_study_note(request):
    try:
        verify_admin(request.user)
    except PermissionError as e:
        return Response({'error': str(e)}, status=status.HTTP_403_FORBIDDEN)

    title = request.data.get('title')
    summary = request.data.get('summary', '')
    category = request.data.get('category', 'global')
    file_url = request.data.get('fileUrl')
    batch_id = request.data.get('batchId')

    if not title or not file_url:
        return Response({'error': 'Title and File URL are required'}, status=status.HTTP_400_BAD_REQUEST)

    batch = None
    if category == 'batch-specific' and batch_id:
        try:
            batch = Batch.objects.get(id=batch_id)
        except Batch.DoesNotExist:
            return Response({'error': 'Batch not found'}, status=status.HTTP_404_NOT_FOUND)

    note = StudyNote.objects.create(
        title=title,
        summary=summary,
        category=category,
        file_url=file_url,
        batch=batch,
        uploaded_by=request.user
    )
    return Response(StudyNoteSerializer(note).data, status=status.HTTP_201_CREATED)


@api_view(['POST', 'DELETE'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_delete_study_note(request):
    try:
        verify_admin(request.user)
    except PermissionError as e:
        return Response({'error': str(e)}, status=status.HTTP_403_FORBIDDEN)

    note_id = request.data.get('noteId')
    if not note_id:
        return Response({'error': 'Note ID is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        note = StudyNote.objects.get(id=note_id)
        note.delete()
        return Response({'status': 'Study note deleted successfully'})
    except StudyNote.DoesNotExist:
        return Response({'error': 'Study note not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_get_mock_results(request):
    try:
        verify_admin(request.user)
    except PermissionError as e:
        return Response({'error': str(e)}, status=status.HTTP_403_FORBIDDEN)

    results = MockDriveResult.objects.all().select_related('student').order_by('-date')
    serialized = []
    for r in results:
        serialized.append({
            'id': r.id,
            'student_id': r.student.id,
            'student_name': r.student.get_full_name() or r.student.username,
            'student_roll': r.student.roll_number or 'N/A',
            'test_name': r.test_name,
            'aptitude_score': r.aptitude_score,
            'tech_score': r.tech_score,
            'coding_score': r.coding_score,
            'tech_hr_score': r.tech_hr_score,
            'hr_score': r.hr_score,
            'total_score': r.total_score,
            'grade': r.grade,
            'date': r.date
        })
    return Response(serialized)


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_create_mock_result(request):
    try:
        verify_admin(request.user)
    except PermissionError as e:
        return Response({'error': str(e)}, status=status.HTTP_403_FORBIDDEN)

    student_id = request.data.get('studentId')
    test_name = request.data.get('testName')
    apt = int(request.data.get('aptitudeScore', 0))
    tech = int(request.data.get('techScore', 0))
    coding = int(request.data.get('codingScore', 0))
    tech_hr = int(request.data.get('techHrScore', 0))
    hr = int(request.data.get('hrScore', 0))
    grade = request.data.get('grade', 'B')
    test_date_str = request.data.get('date')

    if not student_id or not test_name:
        return Response({'error': 'Student ID and Test Name are required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        student = User.objects.get(id=student_id)
        test_date = datetime.strptime(test_date_str, "%Y-%m-%d").date() if test_date_str else timezone.now().date()
    except User.DoesNotExist:
        return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
    except ValueError:
        return Response({'error': 'Invalid date format, use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)

    total = apt + tech + coding + tech_hr + hr
    res = MockDriveResult.objects.create(
        student=student,
        test_name=test_name,
        aptitude_score=apt,
        tech_score=tech,
        coding_score=coding,
        tech_hr_score=tech_hr,
        hr_score=hr,
        total_score=total,
        grade=grade,
        date=test_date
    )
    return Response({'status': 'Mock Drive Result created successfully', 'id': res.id}, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_create_company(request):
    try:
        verify_admin(request.user)
    except PermissionError as e:
        return Response({'error': str(e)}, status=status.HTTP_403_FORBIDDEN)

    name = request.data.get('name')
    description = request.data.get('description', '')
    logo_url = request.data.get('logoUrl', '')

    if not name:
        return Response({'error': 'Company name is required'}, status=status.HTTP_400_BAD_REQUEST)

    company = PlacementCompany.objects.create(name=name, description=description, logo_url=logo_url)
    return Response(PlacementCompanySerializer(company).data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_create_placement_round(request):
    try:
        verify_admin(request.user)
    except PermissionError as e:
        return Response({'error': str(e)}, status=status.HTTP_403_FORBIDDEN)

    company_id = request.data.get('companyId')
    title = request.data.get('title')
    round_num = request.data.get('roundNum', 1)
    description = request.data.get('description', '')

    if not company_id or not title:
        return Response({'error': 'Company ID and Round Title are required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        company = PlacementCompany.objects.get(id=company_id)
    except PlacementCompany.DoesNotExist:
        return Response({'error': 'Placement Company not found'}, status=status.HTTP_404_NOT_FOUND)

    p_round = PlacementRound.objects.create(company=company, round_num=round_num, title=title, description=description)
    return Response(PlacementRoundSerializer(p_round).data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_create_placement_resource(request):
    try:
        verify_admin(request.user)
    except PermissionError as e:
        return Response({'error': str(e)}, status=status.HTTP_403_FORBIDDEN)

    round_id = request.data.get('roundId')
    title = request.data.get('title')
    file_url = request.data.get('fileUrl', '')
    sample_questions = request.data.get('sampleQuestions', '')

    if not round_id or not title:
        return Response({'error': 'Round ID and Resource Title are required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        p_round = PlacementRound.objects.get(id=round_id)
    except PlacementRound.DoesNotExist:
        return Response({'error': 'Placement Round not found'}, status=status.HTTP_404_NOT_FOUND)

    resource = PlacementResource.objects.create(placement_round=p_round, title=title, file_url=file_url, sample_questions=sample_questions)
    return Response(PlacementResourceSerializer(resource).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_get_users(request):
    try:
        verify_admin(request.user)
    except PermissionError as e:
        return Response({'error': str(e)}, status=status.HTTP_403_FORBIDDEN)

    users = User.objects.all().order_by('-date_joined')
    serialized = []
    for u in users:
        batch = get_student_batch(u)
        serialized.append({
            'id': u.id,
            'username': u.username,
            'email': u.email,
            'full_name': u.get_full_name() or u.username,
            'roll_number': u.roll_number or 'N/A',
            'phone_number': u.phone_number or 'N/A',
            'role': u.role,
            'batch': batch.name if batch else 'Unassigned',
            'last_seen': u.last_seen
        })
    return Response(serialized)


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_create_student(request):
    try:
        verify_admin(request.user)
    except PermissionError as e:
        return Response({'error': str(e)}, status=status.HTTP_403_FORBIDDEN)

    email = request.data.get('email')
    password = request.data.get('password', 'password123')
    first_name = request.data.get('firstName', '')
    last_name = request.data.get('lastName', '')
    roll_number = request.data.get('rollNumber', '')
    phone_number = request.data.get('phoneNumber', '')
    role = request.data.get('role', 'student')
    batch_id = request.data.get('batchId')

    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=email).exists():
        return Response({'error': 'User with this email already exists'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(
        username=email,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
        roll_number=roll_number,
        phone_number=phone_number,
        role=role
    )

    if batch_id and role == 'student':
        try:
            batch = Batch.objects.get(id=batch_id)
            BatchEnrollment.objects.create(student=user, batch=batch, status='approved')
        except Batch.DoesNotExist:
            pass

    return Response({
        'status': f'User {email} created successfully.',
        'user': UserSerializer(user).data
    }, status=status.HTTP_201_CREATED)


@api_view(['PUT', 'DELETE'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_manage_batch(request, batch_id):
    try:
        verify_admin(request.user)
    except PermissionError as e:
        return Response({'error': str(e)}, status=status.HTTP_403_FORBIDDEN)

    try:
        batch = Batch.objects.get(id=batch_id)
    except Batch.DoesNotExist:
        return Response({'error': 'Batch not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        batch_name = batch.name
        batch.delete()
        return Response({'status': f'Batch {batch_name} deleted successfully'})

    elif request.method == 'PUT':
        name = request.data.get('name')
        description = request.data.get('description', batch.description)
        if name:
            batch.name = name
        batch.description = description
        batch.save()
        return Response({'status': 'Batch updated successfully', 'batch': BatchSerializer(batch).data})


@api_view(['PUT', 'DELETE'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_manage_user(request, user_id):
    try:
        verify_admin(request.user)
    except PermissionError as e:
        return Response({'error': str(e)}, status=status.HTTP_403_FORBIDDEN)

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        username = user.username
        user.delete()
        return Response({'status': f'User {username} deleted successfully'})

    elif request.method == 'PUT':
        user.first_name = request.data.get('firstName', user.first_name)
        user.last_name = request.data.get('lastName', user.last_name)
        user.roll_number = request.data.get('rollNumber', user.roll_number)
        user.phone_number = request.data.get('phoneNumber', user.phone_number)
        if 'role' in request.data:
            user.role = request.data['role']
        if 'password' in request.data and request.data['password']:
            user.set_password(request.data['password'])
        user.save()

        batch_id = request.data.get('batchId')
        if batch_id:
            try:
                batch = Batch.objects.get(id=batch_id)
                BatchEnrollment.objects.filter(student=user).delete()
                BatchEnrollment.objects.create(student=user, batch=batch, status='approved')
            except Batch.DoesNotExist:
                pass

        return Response({'status': 'User profile updated successfully', 'user': UserSerializer(user).data})


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_remove_student_batch(request):
    try:
        verify_admin(request.user)
    except PermissionError as e:
        return Response({'error': str(e)}, status=status.HTTP_403_FORBIDDEN)

    student_id = request.data.get('studentId')
    if not student_id:
        return Response({'error': 'Student ID is required'}, status=status.HTTP_400_BAD_REQUEST)

    deleted_count, _ = BatchEnrollment.objects.filter(student_id=student_id).delete()
    return Response({'status': f'Student enrollment removed from batch ({deleted_count} record removed).'})


@api_view(['PUT', 'DELETE'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_manage_task(request, task_id):
    try:
        verify_admin(request.user)
    except PermissionError as e:
        return Response({'error': str(e)}, status=status.HTTP_403_FORBIDDEN)

    try:
        task = Task.objects.get(id=task_id)
    except Task.DoesNotExist:
        return Response({'error': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        title = task.title
        task.delete()
        return Response({'status': f'Task "{title}" deleted successfully'})

    elif request.method == 'PUT':
        task.title = request.data.get('title', task.title)
        task.description = request.data.get('description', task.description)
        due_date_str = request.data.get('dueDate')
        if due_date_str:
            try:
                task.due_date = datetime.strptime(due_date_str, "%Y-%m-%d").date()
            except ValueError:
                pass
        task.save()
        return Response({'status': 'Task updated successfully', 'task': TaskSerializer(task).data})



