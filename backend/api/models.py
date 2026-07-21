from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

class User(AbstractUser):
    ROLE_CHOICES = [
        ('student', 'Student'),
        ('admin', 'Admin'),
    ]
    role = models.CharField(max_length=15, choices=ROLE_CHOICES, default='student')
    roll_number = models.CharField(max_length=20, blank=True, null=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    
    github_url = models.URLField(blank=True, null=True)
    linkedin_url = models.URLField(blank=True, null=True)
    portfolio_url = models.URLField(blank=True, null=True)
    hackerrank_url = models.URLField(blank=True, null=True)
    last_seen = models.DateTimeField(blank=True, null=True, db_index=True, help_text="Timestamp of last API activity")


class Batch(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class BatchEnrollment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='enrollments')
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='enrollments')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'batch')

    def __str__(self):
        return f"{self.student.username} in {self.batch.name} ({self.status})"


class Task(models.Model):
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=200)
    description = models.TextField(help_text="Markdown content of the task instructions")
    due_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.batch.name})"


class Submission(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='submissions')
    github_url = models.URLField()
    grade = models.CharField(max_length=10, blank=True, null=True, help_text="e.g. 5/5, 10/10, etc.")
    feedback = models.TextField(blank=True, null=True)
    graded_at = models.DateTimeField(blank=True, null=True)
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('task', 'student')

    def __str__(self):
        return f"{self.student.username} - {self.task.title}"


class LeetcodeChallenge(models.Model):
    title = models.CharField(max_length=200)
    url = models.URLField()
    available_date = models.DateField(default=timezone.now, db_index=True, help_text="Date when this problem unlocks")
    day_number = models.IntegerField(default=1, help_text="Day 1 to 10 designation")
    deadline = models.DateTimeField(db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['available_date', 'day_number']

    def __str__(self):
        return f"Day {self.day_number}: {self.title} ({self.available_date})"


class LeetcodeSubmission(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
    ]
    challenge = models.ForeignKey(LeetcodeChallenge, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='leetcode_submissions')
    submission_url = models.URLField()
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='completed')
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('challenge', 'student')
        indexes = [
            models.Index(fields=['student', 'challenge']),
        ]

    def __str__(self):
        return f"{self.student.username} - {self.challenge.title}"



class StudyNote(models.Model):
    CATEGORY_CHOICES = [
        ('global', 'Global Notes'),
        ('batch-specific', 'Batch Notes'),
    ]
    batch = models.ForeignKey(Batch, on_delete=models.SET_NULL, null=True, blank=True, related_name='notes')
    title = models.CharField(max_length=200)
    summary = models.TextField(blank=True, null=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='global')
    file_url = models.URLField(help_text="Google Drive view URL or file link")
    date_shared = models.DateField(auto_now_add=True)

    def __str__(self):
        return self.title


class MockDriveResult(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mock_results')
    test_name = models.CharField(max_length=150)
    aptitude_score = models.IntegerField(default=0)
    tech_score = models.IntegerField(default=0)
    coding_score = models.IntegerField(default=0)
    tech_hr_score = models.IntegerField(default=0)
    hr_score = models.IntegerField(default=0)
    total_score = models.IntegerField(default=0)
    grade = models.CharField(max_length=2, default='C')
    date = models.DateField()

    def __str__(self):
        return f"{self.student.username} - {self.test_name} ({self.grade})"


class AttendanceLog(models.Model):
    STATUS_CHOICES = [
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('leave', 'Leave'),
    ]
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='attendance_logs')
    date = models.DateField()
    check_in = models.DateTimeField(null=True, blank=True)
    check_out = models.DateTimeField(null=True, blank=True)
    total_time = models.DurationField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='present')

    class Meta:
        unique_together = ('student', 'date')

    def __str__(self):
        return f"{self.student.username} - {self.date} ({self.status})"


class LeaveRequest(models.Model):
    TYPE_CHOICES = [
        ('full', 'Full Day'),
        ('half', 'Half Day'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='leaves')
    leave_type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    date = models.DateField()
    reason = models.TextField()
    pdf_url = models.URLField(blank=True, null=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    admin_response = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student.username} - {self.date} ({self.status})"


class ChatMessage(models.Model):
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender.username}: {self.content[:30]} at {self.timestamp}"


class PlacementCompany(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    logo_url = models.CharField(max_length=500, blank=True, null=True)

    def __str__(self):
        return self.name


class PlacementRound(models.Model):
    company = models.ForeignKey(PlacementCompany, on_delete=models.CASCADE, related_name='rounds')
    round_num = models.IntegerField()
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.company.name} - Round {self.round_num}: {self.title}"


class PlacementResource(models.Model):
    placement_round = models.ForeignKey(PlacementRound, on_delete=models.CASCADE, related_name='resources')
    title = models.CharField(max_length=200)
    file_url = models.URLField(blank=True, null=True)
    sample_questions = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.placement_round.company.name} - {self.title}"
