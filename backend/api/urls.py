from django.urls import path
from api import views

urlpatterns = [
    # Auth & Profile
    path('auth/register/', views.register_student, name='register'),
    path('auth/login/', views.login_student, name='login'),
    path('student/profile/', views.student_profile, name='profile'),
    
    # Student Operations
    path('student/dashboard/', views.student_dashboard, name='dashboard'),
    path('student/checkin/', views.student_checkin, name='checkin'),
    path('student/tasks/', views.student_tasks, name='tasks'),
    path('student/leetcode/', views.student_leetcode, name='leetcode'),
    path('student/notes/', views.student_notes, name='notes'),
    path('student/grades/', views.student_grades, name='grades'),
    path('student/leaderboard/', views.student_leaderboard, name='leaderboard'),
    path('student/leaves/', views.student_leaves, name='leaves'),
    path('student/chat/', views.student_chat, name='chat'),
    path('student/attendance/', views.get_attendance_log, name='attendance_log'),
    path('student/placement-prep/', views.get_placement_prep, name='placement_prep'),

    # Admin Operations
    path('admin/stats/', views.admin_dashboard_stats, name='admin_stats'),
    path('admin/pending-students/', views.admin_pending_students, name='admin_pending_students'),
    path('admin/allocate-batch/', views.admin_allocate_batch, name='admin_allocate_batch'),
    path('admin/create-task/', views.admin_create_task, name='admin_create_task'),
    path('admin/submissions/', views.admin_get_submissions, name='admin_submissions'),
    path('admin/grade-submission/', views.admin_grade_submission, name='admin_grade_submission'),
    path('admin/leaves/', views.admin_get_leaves, name='admin_get_leaves'),
    path('admin/resolve-leave/', views.admin_resolve_leave, name='admin_resolve_leave'),
    path('admin/attendance/', views.admin_get_attendance, name='admin_get_attendance'),
    path('admin/create-leetcode-challenge/', views.admin_create_leetcode_challenge, name='admin_create_leetcode_challenge'),
    path('admin/create-batch/', views.admin_create_batch, name='admin_create_batch'),
]
