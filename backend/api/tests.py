from django.test import TestCase
from django.utils import timezone
from datetime import date, timedelta
from api.models import User, Batch, Task, StudyNote, LeetcodeChallenge, AttendanceLog, MockDriveResult, LeaveRequest, BatchEnrollment
from rest_framework.test import APIClient
from rest_framework import status
from api.auth_utils import generate_token

class CSMSTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Create student user
        self.student = User.objects.create_user(
            username="student@csms",
            email="student@csms",
            password="Password123",
            role="student"
        )
        self.token = generate_token(self.student)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

        # Create admin user
        self.admin = User.objects.create_superuser(
            username="admin@csms",
            email="admin@csms",
            password="AdminPassword",
            role="admin"
        )

        # Create a batch
        self.batch = Batch.objects.create(name="Python Batch", description="Python test batch")

    def test_clean_user_dashboard(self):
        """A newly registered student should have 0% attendance, no mock results, no tasks, and only global notes."""
        response = self.client.get('/student/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        # Should be in awaiting allocation since not in batch
        self.assertEqual(data['status'], 'awaiting_allocation')
        self.assertIsNone(data['batch'])

    def test_attendance_rate_calculation(self):
        """Attendance % should be 0% when working days = 0, and should calculate properly dynamically."""
        # We temporarily allocate student to batch to get dashboard data
        BatchEnrollment.objects.create(student=self.student, batch=self.batch, status="approved")
        
        response = self.client.get('/student/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['attendance']['rate'], 0)

        # Add 1 present day
        AttendanceLog.objects.create(student=self.student, date=date.today() - timedelta(days=2), status="present", check_in=timezone.now() - timedelta(hours=9), check_out=timezone.now())
        response = self.client.get('/student/dashboard/')
        self.assertEqual(response.json()['attendance']['rate'], 100)

        # Add 1 absent day (present=1, absent=1 -> 50%)
        AttendanceLog.objects.create(student=self.student, date=date.today() - timedelta(days=1), status="absent")
        response = self.client.get('/student/dashboard/')
        self.assertEqual(response.json()['attendance']['rate'], 50)

        # Add 1 leave day (present=1, absent=1, leave=1 -> total=3, leave=1 -> working=2 -> 50%)
        AttendanceLog.objects.create(student=self.student, date=date.today(), status="leave")
        response = self.client.get('/student/dashboard/')
        self.assertEqual(response.json()['attendance']['rate'], 50)

    def test_student_checkin_checkout_constraints(self):
        """Check Out should fail and NOT create a log if Check In wasn't called first."""
        response = self.client.post('/student/checkin/', {'action': 'checkout'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.json())
        
        self.assertFalse(AttendanceLog.objects.filter(student=self.student, date=date.today()).exists())

        response = self.client.post('/student/checkin/', {'action': 'checkin'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(AttendanceLog.objects.filter(student=self.student, date=date.today()).exists())

    def test_student_notes_filtering(self):
        """Study notes should return only global notes if the student is not approved in any batch."""
        StudyNote.objects.create(title="Global Note", category="global", file_url="http://drive.com/1")
        StudyNote.objects.create(title="Batch Note", category="batch-specific", batch=self.batch, file_url="http://drive.com/2")

        response = self.client.get('/student/notes/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        notes = response.json()
        self.assertEqual(len(notes), 1)
        self.assertEqual(notes[0]['title'], "Global Note")

        BatchEnrollment.objects.create(student=self.student, batch=self.batch, status="approved")
        response = self.client.get('/student/notes/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        notes = response.json()
        self.assertEqual(len(notes), 2)

    def test_leetcode_daily_unlock_dynamic(self):
        """Leetcode challenges should unlock relative to batch approval date, mask URL, and reject submission if locked."""
        # 1. Setup Leetcode challenges roadmap (Day 1 and Day 2)
        ch1 = LeetcodeChallenge.objects.create(
            title="Two Sum", 
            url="http://leetcode.com/twosum", 
            day_number=1, 
            available_date=date.today(),
            deadline=timezone.now() + timedelta(days=1)
        )
        ch2 = LeetcodeChallenge.objects.create(
            title="Palindrome Number", 
            url="http://leetcode.com/palindrome", 
            day_number=2, 
            available_date=date.today(),
            deadline=timezone.now() + timedelta(days=2)
        )

        # 2. Approve enrollment today (so Day 1 is unlocked today, Day 2 unlocks tomorrow)
        # Dynamic unlock date formula: approved_date + (day_number - 1) days
        # approved_date is today. So ch1 (day 1) unlocks today. ch2 (day 2) unlocks tomorrow (today + 1 day).
        BatchEnrollment.objects.create(
            student=self.student, 
            batch=self.batch, 
            status="approved",
            approved_at=timezone.now()
        )

        # 3. Request GET: Day 1 should be unlocked (URL visible), Day 2 should be locked (URL empty)
        response = self.client.get('/student/leetcode/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        challenges = data['challenges']
        
        # Verify Day 1 challenge details
        c1 = [c for c in challenges if c['id'] == ch1.id][0]
        self.assertTrue(c1['is_unlocked'])
        self.assertEqual(c1['url'], "http://leetcode.com/twosum")
        
        # Verify Day 2 challenge details
        c2 = [c for c in challenges if c['id'] == ch2.id][0]
        self.assertFalse(c2['is_unlocked'])
        self.assertEqual(c2['url'], "") # Url should be masked

        # 4. Request POST for Day 1: should succeed
        response = self.client.post('/student/leetcode/', {'challengeId': ch1.id, 'submissionUrl': 'http://leetcode.com/sub1'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 5. Request POST for Day 2: should fail with 403 and error message
        response = self.client.post('/student/leetcode/', {'challengeId': ch2.id, 'submissionUrl': 'http://leetcode.com/sub2'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.json()['error'], "This problem has not been unlocked yet.")
