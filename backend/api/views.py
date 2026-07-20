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

    if User.objects.filter(username=email).exists():
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
    
    # Students are NOT automatically enrolled in a batch (Admin must allocate them)
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

    user = authenticate(username=email, password=password)
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
    
    if request.method == 'GET':
        challenges = LeetcodeChallenge.objects.all().order_by('-deadline')
        serialized = []
        for ch in challenges:
            sub = LeetcodeSubmission.objects.filter(challenge=ch, student=user).first()
            serialized.append({
                'id': ch.id,
                'title': ch.title,
                'url': ch.url,
                'deadline': ch.deadline,
                'submission': LeetcodeSubmissionSerializer(sub).data if sub else None
            })
        return Response({
            'challenges': serialized,
            'streak': 12, # Static placeholder for student metrics
            'solved': LeetcodeSubmission.objects.filter(student=user).count()
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

        sub, created = LeetcodeSubmission.objects.get_or_create(challenge=ch, student=user, defaults={'submission_url': submission_url})
        if not created:
            sub.submission_url = submission_url
            sub.save()

        return Response(LeetcodeSubmissionSerializer(sub).data)


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
    pending_enrollments = BatchEnrollment.objects.filter(status='pending')
    
    # Also fetch all students who have NO enrollment at all
    students_with_enr = BatchEnrollment.objects.all().values_list('student_id', flat=True)
    unassigned_students = User.objects.filter(role='student').exclude(id__in=students_with_enr)

    unassigned_data = []
    for s in unassigned_students:
        unassigned_data.append({
            'id': s.id,
            'student_name': s.get_full_name() or s.username,
            'student_email': s.email,
            'student_roll': s.roll_number,
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

    enrollment, created = BatchEnrollment.objects.get_or_create(
        student=student, 
        batch=batch, 
        defaults={'status': action}
    )
    if not created:
        enrollment.status = action
        enrollment.save()

    return Response({'status': f'Student allocated to {batch.name} successfully.'})


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

    return Response({
        'totalStudents': total_students,
        'activeBatches': active_batches,
        'pendingLeaves': pending_leaves,
        'pendingGrades': pending_grades
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

    if not title or not url or not deadline:
        return Response({'error': 'Title, URL, and deadline are required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        parsed_date = datetime.strptime(deadline, "%Y-%m-%d")
        aware_deadline = timezone.make_aware(parsed_date.replace(hour=23, minute=59, second=59))
    except ValueError:
        return Response({'error': 'Invalid date format, use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)

    challenge = LeetcodeChallenge.objects.create(
        title=title,
        url=url,
        deadline=aware_deadline
    )

    return Response({'status': 'Leetcode challenge created successfully', 'id': challenge.id})


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

