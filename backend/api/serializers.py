from rest_framework import serializers
from api.models import (
    User, Batch, BatchEnrollment, Task, Submission, 
    LeetcodeChallenge, LeetcodeSubmission, StudyNote, 
    MockDriveResult, AttendanceLog, LeaveRequest, ChatMessage,
    PlacementCompany, PlacementRound, PlacementResource
)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'roll_number', 'phone_number', 'role',
            'github_url', 'linkedin_url', 'portfolio_url', 'hackerrank_url'
        ]
        read_only_fields = ['username', 'email', 'role']


class BatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Batch
        fields = '__all__'


class BatchEnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_email = serializers.CharField(source='student.email', read_only=True)
    student_roll = serializers.CharField(source='student.roll_number', read_only=True)
    batch_name = serializers.CharField(source='batch.name', read_only=True)

    class Meta:
        model = BatchEnrollment
        fields = '__all__'


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = '__all__'


class SubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_roll = serializers.CharField(source='student.roll_number', read_only=True)
    task_title = serializers.CharField(source='task.title', read_only=True)

    class Meta:
        model = Submission
        fields = '__all__'


class LeetcodeChallengeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeetcodeChallenge
        fields = '__all__'


class LeetcodeSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeetcodeSubmission
        fields = '__all__'


class StudyNoteSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)

    class Meta:
        model = StudyNote
        fields = '__all__'


class MockDriveResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = MockDriveResult
        fields = '__all__'


class AttendanceLogSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_roll = serializers.CharField(source='student.roll_number', read_only=True)

    class Meta:
        model = AttendanceLog
        fields = '__all__'


class LeaveRequestSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_roll = serializers.CharField(source='student.roll_number', read_only=True)

    class Meta:
        model = LeaveRequest
        fields = '__all__'


class ChatMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.get_full_name', read_only=True)
    sender_id = serializers.IntegerField(source='sender.id', read_only=True)
    sender_role = serializers.CharField(source='sender.role', read_only=True)

    class Meta:
        model = ChatMessage
        fields = ['id', 'batch', 'sender_id', 'sender_name', 'sender_role', 'content', 'timestamp']


class PlacementResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlacementResource
        fields = '__all__'


class PlacementRoundSerializer(serializers.ModelSerializer):
    resources = PlacementResourceSerializer(many=True, read_only=True)

    class Meta:
        model = PlacementRound
        fields = '__all__'


class PlacementCompanySerializer(serializers.ModelSerializer):
    rounds = PlacementRoundSerializer(many=True, read_only=True)

    class Meta:
        model = PlacementCompany
        fields = '__all__'
