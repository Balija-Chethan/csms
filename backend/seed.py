import os
import django
from django.utils import timezone
from datetime import date, timedelta, datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ssms_backend.settings')
django.setup()

from api.models import (
    User, Batch, BatchEnrollment, Task, Submission, 
    LeetcodeChallenge, LeetcodeSubmission, StudyNote, 
    MockDriveResult, AttendanceLog, LeaveRequest, ChatMessage,
    PlacementCompany, PlacementRound, PlacementResource
)

def seed_db():
    print("Seeding CSMS Database...")
    
    # 1. Clean existing data
    ChatMessage.objects.all().delete()
    LeaveRequest.objects.all().delete()
    AttendanceLog.objects.all().delete()
    MockDriveResult.objects.all().delete()
    StudyNote.objects.all().delete()
    Submission.objects.all().delete()
    Task.objects.all().delete()
    BatchEnrollment.objects.all().delete()
    Batch.objects.all().delete()
    User.objects.all().delete()

    # 2. Create Users
    admin = User.objects.create_superuser(
        username="chethan@csms",
        email="chethan@csms",
        password="Chethan@21",
        first_name="Chethan",
        last_name="",
        role='admin'
    )

    student = User.objects.create_user(
        username="23691a3340@mits.ac.in",
        email="23691a3340@mits.ac.in",
        password="password123",
        first_name="Nichitha",
        last_name="Sree",
        roll_number="23691A3340",
        phone_number="9908322634",
        role='student',
        github_url="https://github.com/Nishitha322",
        linkedin_url="https://linkedin.com/in/nichitha-sree",
        portfolio_url="https://nichitha.dev",
        hackerrank_url="https://hackerrank.com/nichitha"
    )

    # Peer students (some approved, some pending)
    peers_data = [
        ("charan@mits.ac.in", "Charan Teja", "23691A3341", "approved"),
        ("pavan@mits.ac.in", "Pavan Kumar", "23691A3342", "approved"),
        ("harika@mits.ac.in", "Harika R", "23691A3343", "pending"),
        ("keerthi@mits.ac.in", "Keerthi Priya", "23691A3344", "pending")
    ]
    
    peers = []
    for email, name, roll, enr_status in peers_data:
        parts = name.split()
        first = parts[0]
        last = parts[1] if len(parts) > 1 else ""
        peer = User.objects.create_user(
            username=email,
            email=email,
            password="password123",
            first_name=first,
            last_name=last,
            roll_number=roll,
            role='student'
        )
        peers.append((peer, enr_status))

    # 3. Create Batches & enrollments
    python_batch = Batch.objects.create(
        name="PYTHON-FSD",
        description="MITS Python Full Stack Placement Training"
    )
    
    # Enroll student in Python-FSD (Approved)
    BatchEnrollment.objects.create(student=student, batch=python_batch, status="approved")
    
    for peer, enr_status in peers:
        BatchEnrollment.objects.create(student=peer, batch=python_batch, status=enr_status)

    # 4. Create Tasks
    tasks = [
        Task(batch=python_batch, title="W7S4T2", description="### Task 7.4.2: Full-Stack Integration\nConnect MongoDB with Django and write REST APIs for CRUD operations on dynamic products schema. Host code on GitHub and submit link.", due_date=date.today() + timedelta(days=2)),
        Task(batch=python_batch, title="W7S4T1", description="### Task 7.4.1: Django Middleware\nWrite a custom Django middleware that logs request execution times and blocks blacklisted IPs. Test endpoints locally.", due_date=date.today() - timedelta(days=1)),
        Task(batch=python_batch, title="W7S3T2", description="### Task 7.3.2: MongoDB Aggregations\nWrite aggregation queries for filtering student attendance logs and generating monthly reports.", due_date=date.today() - timedelta(days=4)),
        Task(batch=python_batch, title="W7S3T1", description="### Task 7.3.1: Python REST API basic\nSetup a simple Flask or Django project displaying JSON statistics.", due_date=date.today() - timedelta(days=6)),
    ]
    for t in tasks:
        t.save()

    # 5. Create Submissions
    Submission.objects.create(
        task=tasks[0], student=student, github_url="https://github.com/Nishitha322/W7S4T2",
        grade=None, feedback=None
    )
    Submission.objects.create(
        task=tasks[1], student=student, github_url="https://github.com/Nishitha322/W7S4T1",
        grade="10/10", feedback="Instructor Feedback: Excellent middleware structure. Very clean code.",
        graded_at=timezone.now() - timedelta(hours=5)
    )
    Submission.objects.create(
        task=tasks[2], student=student, github_url="https://github.com/Nishitha322/W7S3T2",
        grade="5/5", feedback="Instructor Feedback: Aggregations work perfectly.",
        graded_at=timezone.now() - timedelta(days=2)
    )

    # 6. Create 10-Day Leetcode Challenges Roadmap & Submissions
    today_date = timezone.now().date()
    leetcode_data = [
        ("1. Two Sum", "https://leetcode.com/problems/two-sum/", -2, 1),
        ("9. Palindrome Number", "https://leetcode.com/problems/palindrome-number/", -1, 2),
        ("46. Permutations", "https://leetcode.com/problems/permutations/description/", 0, 3), # Today (Day 3)
        ("47. Permutations II", "https://leetcode.com/problems/permutations-ii/description/", 1, 4),
        ("53. Maximum Subarray", "https://leetcode.com/problems/maximum-subarray/", 2, 5),
        ("70. Climbing Stairs", "https://leetcode.com/problems/climbing-stairs/", 3, 6),
        ("121. Best Time to Buy and Sell Stock", "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/", 4, 7),
        ("141. Linked List Cycle", "https://leetcode.com/problems/linked-list-cycle/", 5, 8),
        ("206. Reverse Linked List", "https://leetcode.com/problems/reverse-linked-list/", 6, 9),
        ("242. Valid Anagram", "https://leetcode.com/problems/valid-anagram/", 7, 10),
    ]

    challenges = []
    for title, url, day_offset, day_num in leetcode_data:
        avail = today_date + timedelta(days=day_offset)
        dl = timezone.make_aware(datetime.combine(avail, datetime.max.time().replace(microsecond=0)))
        ch = LeetcodeChallenge.objects.create(
            title=title,
            url=url,
            available_date=avail,
            day_number=day_num,
            deadline=dl
        )
        challenges.append(ch)

    # Student completed Day 1 & Day 2
    LeetcodeSubmission.objects.create(challenge=challenges[0], student=student, submission_url="https://leetcode.com/problems/two-sum/submissions/10001", status="completed")
    LeetcodeSubmission.objects.create(challenge=challenges[1], student=student, submission_url="https://leetcode.com/problems/palindrome-number/submissions/10002", status="completed")


    # 7. Study Notes
    StudyNote.objects.create(
        batch=python_batch, title="Django Chapter 8",
        summary="Connecting HTML, CSS & JavaScript with Django & MongoDB Atlas. Focus on Django templates and custom filters.",
        uploaded_by=admin, category="batch-specific",
        file_url="https://drive.google.com/file/d/1demo-django-ch8/view"
    )
    StudyNote.objects.create(
        batch=None, title="Global Python Guidelines",
        summary="Standard formatting rules, clean coding style conventions, PEP 8 requirements, and best practices for writing python programs.",
        uploaded_by=admin, category="global",
        file_url="https://drive.google.com/file/d/1demo-python-global/view"
    )

    # 8. Mock Drive Results
    MockDriveResult.objects.create(
        student=student, test_name="Mock Test 3",
        aptitude_score=107, tech_score=265, coding_score=300, tech_hr_score=35, hr_score=50,
        total_score=757, grade="C", date=date.today() - timedelta(days=11)
    )

    # 9. Attendance Log
    start_date = date.today() - timedelta(days=20)
    for i in range(20):
        curr_date = start_date + timedelta(days=i)
        # Skip Sundays
        if curr_date.weekday() == 6:
            continue
        
        # Leaves
        if i in [5, 12]:
            AttendanceLog.objects.create(
                student=student, date=curr_date, status='leave',
                check_in=None, check_out=None, total_time=None
            )
        else:
            check_in = timezone.make_aware(datetime.combine(curr_date, datetime.strptime("09:00:00", "%H:%M:%S").time()))
            check_out = timezone.make_aware(datetime.combine(curr_date, datetime.strptime("17:05:00", "%H:%M:%S").time()))
            AttendanceLog.objects.create(
                student=student, date=curr_date, status='present',
                check_in=check_in, check_out=check_out, total_time=timedelta(hours=8, minutes=5)
            )

    # 10. Leave Requests
    LeaveRequest.objects.create(
        student=student, leave_type="full", date=date.today() - timedelta(days=4),
        reason="I have to go to temple so kindly grant me permission.", status="approved",
        pdf_url="https://ssms.saranv.in/media/leaves/leave_request_temple.pdf",
        admin_response="Approved by Saran Velmurugan."
    )

    # 11. Chat Messages
    messages = [
        "Welcome to the PYTHON-FSD placement training batch!",
        "Hello everyone! All classes start tomorrow at 9:00 AM sharp.",
        "Please check the Tasks section for your week's assignments.",
    ]
    for i, msg in enumerate(messages):
        ChatMessage.objects.create(
            batch=python_batch, sender=admin, content=msg,
            timestamp=timezone.now() - timedelta(days=5 - i)
        )

    # 12. Create Placement Prep Guides (10 Companies)
    print("Seeding Placement Prep guides...")
    PlacementResource.objects.all().delete()
    PlacementRound.objects.all().delete()
    PlacementCompany.objects.all().delete()

    companies_data = [
        {
            "name": "Accenture",
            "desc": "Accenture plc is a leading global professional services company, providing a broad range of services in strategy and consulting, interactive, technology and operations.",
            "logo": "https://api.dicebear.com/7.x/initials/svg?seed=AC",
            "rounds": [
                {
                    "num": 1, "title": "Cognitive and Technical Assessment",
                    "desc": "90 questions in 90 minutes. Sections include English Ability, Critical Reasoning, Abstract Reasoning, Common Application & MS Office, Pseudocode, and Networking security.",
                    "resource": {
                        "title": "Previous year Pseudocode & Cognitive questions",
                        "url": "https://drive.google.com/file/d/1demo-accenture-r1/view",
                        "questions": "1. What is the output of the following pseudocode?\n   ```python\n   Integer a, b, c\n   Set a = 2, b = 5, c = 4\n   a = (a ^ b) + c\n   Print a + b\n   ```\n   *Answer: 12*\n\n2. In a class of 60 students, 40% passed in English and 70% passed in Math. What is the minimum percentage of students who passed in both?\n   *Answer: 10%*\n\n3. Identify the odd one out: Array, Queue, Tree, Stack.\n   *Answer: Tree (Non-linear data structure)*"
                    }
                },
                {
                    "num": 2, "title": "Technical Coding Round",
                    "desc": "45 minutes. 2 Coding questions in Python, C, C++, or Java. Core focuses are arrays, strings, basic math.",
                    "resource": {
                        "title": "Accenture 2024 Coding Questions & Solutions",
                        "url": "https://drive.google.com/file/d/1demo-accenture-r2/view",
                        "questions": "1. **Find Second Largest Elements**:\n   Write a function to return the second largest element in an integer array.\n   ```python\n   def second_largest(arr):\n       first = second = -float('inf')\n       for n in arr:\n           if n > first:\n               second = first\n               first = n\n           elif n > second and n != first:\n               second = n\n       return second\n   ```\n\n2. **Binary String Operations**:\n   Implement function `evalBinaryString(str)` which performs XOR, AND, OR based on operators in a binary sequence."
                    }
                },
                {
                    "num": 3, "title": "HR & Technical Interview",
                    "desc": "One-on-one virtual interview via MS Teams focusing on final year project, resumes, and behavioral questions.",
                    "resource": {
                        "title": "Behavioral & HR Prep Guide",
                        "url": "https://drive.google.com/file/d/1demo-accenture-r3/view",
                        "questions": "1. Explain the architecture and tech stack of your major/minor project. What was your individual role?\n2. Describe a scenario where you faced a team conflict during a project and how you resolved it.\n3. Why do you want to join Accenture? Tell us about our core values."
                    }
                }
            ]
        },
        {
            "name": "IBM",
            "desc": "International Business Machines Corporation (IBM) is a leading global technology provider specializing in hybrid cloud, AI, and enterprise middleware systems.",
            "logo": "https://api.dicebear.com/7.x/initials/svg?seed=IB",
            "rounds": [
                {
                    "num": 1, "title": "Cognitive Ability Test (IPAT)",
                    "desc": "Game-based cognitive tasks evaluating mental agility, pattern recognition, and numerical logic puzzles.",
                    "resource": {
                        "title": "IBM Cognitive Grid Puzzles Guide",
                        "url": "https://drive.google.com/file/d/1demo-ibm-r1/view",
                        "questions": "- Pattern sequence completion: Find the next matrix in the sequence.\n- Numeric grid balance: Solve missing variables in a balanced weight model.\n- Focus on speed: Practice fast grid calculations."
                    }
                },
                {
                    "num": 2, "title": "Technical Coding & SQL Assessment",
                    "desc": "60 minutes coding test. Replicates real developer challenges including backend algorithms and SQL database query formatting.",
                    "resource": {
                        "title": "IBM Previous Coding & SQL Problems",
                        "url": "https://drive.google.com/file/d/1demo-ibm-r2/view",
                        "questions": "1. **Querying Department Averages**:\n   Write an SQL query to select all departments whose average employee salary is greater than $60,000.\n   ```sql\n   SELECT dept_name, AVG(salary) FROM employees\n   GROUP BY dept_name HAVING AVG(salary) > 60000;\n   ```\n\n2. **Longest Palindromic Substring**:\n   Find the longest palindrome in a given string."
                    }
                },
                {
                    "num": 3, "title": "Technical & HR Panel Interview",
                    "desc": "In-depth technical questioning on Cloud computing, SQL indexing, memory management, and OOP principles.",
                    "resource": {
                        "title": "Technical Interview Questions Bank",
                        "url": "https://drive.google.com/file/d/1demo-ibm-r3/view",
                        "questions": "1. What is the difference between SQL JOIN and UNION? Explain with examples.\n2. How does virtual memory allocation work in operating systems?\n3. Explain the four pillars of Object-Oriented Programming (OOP)."
                    }
                }
            ]
        },
        {
            "name": "CTS (Cognizant)",
            "desc": "Cognizant Technology Solutions is a multinational corporation providing IT, consulting, and business process outsourcing services.",
            "logo": "https://api.dicebear.com/7.x/initials/svg?seed=CT",
            "rounds": [
                {
                    "num": 1, "title": "GenC Aptitude & Technical MCQs",
                    "desc": "Focuses on quantitative aptitude, logical reasoning, verbal ability, and programming concepts (data structures, DB, OS).",
                    "resource": {
                        "title": "GenC Quantitative & Technical MCQs",
                        "url": "https://drive.google.com/file/d/1demo-cts-r1/view",
                        "questions": "1. A train passes a platform in 36 seconds and a man standing on the platform in 20 seconds. If the speed of the train is 54 km/hr, what is the length of the platform?\n   *Answer: 240 meters*\n\n2. What is the time complexity of searching a value in a binary search tree in the worst case?\n   *Answer: O(N)*"
                    }
                },
                {
                    "num": 2, "title": "Technical Interview",
                    "desc": "Interviewer asks coding puzzles, SQL queries, and basic algorithms. Final year project is thoroughly reviewed.",
                    "resource": {
                        "title": "Cognizant Technical Interview Prep",
                        "url": "https://drive.google.com/file/d/1demo-cts-r2/view",
                        "questions": "1. Write a function to reverse a linked list inline (without extra space).\n2. What is normalization in databases? Define 1NF, 2NF, and 3NF.\n3. What is the difference between a process and a thread?"
                    }
                },
                {
                    "num": 3, "title": "HR Interview",
                    "desc": "Review relocation flexibility, career expectations, and document verification checks.",
                    "resource": {
                        "title": "HR Questionnaire & Tips",
                        "url": "https://drive.google.com/file/d/1demo-cts-r3/view",
                        "questions": "1. Are you comfortable relocating to different business centers across India?\n2. Where do you see yourself in 3 years?\n3. How do you handle stressful workloads?"
                    }
                }
            ]
        },
        {
            "name": "LTI (LTIMindtree)",
            "desc": "LTIMindtree is a global technology consulting and digital solutions company, part of the Larsen & Toubro group.",
            "logo": "https://api.dicebear.com/7.x/initials/svg?seed=LT",
            "rounds": [
                {
                    "num": 1, "title": "LTI Technical & Quantitative Exam",
                    "desc": "Sections include quantitative math, logical ability, verbal ability, and programming MCQ core basics.",
                    "resource": {
                        "title": "LTI Previous Verbal & Logic Questions",
                        "url": "https://drive.google.com/file/d/1demo-lti-r1/view",
                        "questions": "1. Choose the correct synonym of 'Prudent': (a) Rash (b) Wise (c) Foolish (d) Reckless\n   *Answer: (b) Wise*\n\n2. Find the missing term in: 2, 6, 12, 20, 30, ?\n   *Answer: 42 (diff increases by +2: +4, +6, +8, +10, +12)*"
                    }
                },
                {
                    "num": 2, "title": "Technical Coding Test",
                    "desc": "2 coding problems focused on dynamic programming, string manipulations, and graph node connections.",
                    "resource": {
                        "title": "LTI Previous Year Coding Solutions",
                        "url": "https://drive.google.com/file/d/1demo-lti-r2/view",
                        "questions": "1. **Fibonacci with Dynamic Programming**:\n   Write a function to return the N-th Fibonacci number using memoization to avoid timeouts.\n   ```python\n   def fib(n, memo={}):\n       if n in memo: return memo[n]\n       if n <= 1: return n\n       memo[n] = fib(n-1, memo) + fib(n-2, memo)\n       return memo[n]\n   ```"
                    }
                },
                {
                    "num": 3, "title": "HR & Behavioral Interview",
                    "desc": "Discussion about background, academic scores, and shift timing flexibility.",
                    "resource": {
                        "title": "HR Prep Guideline",
                        "url": "https://drive.google.com/file/d/1demo-lti-r3/view",
                        "questions": "1. Introduce yourself in 2 minutes highlighting your development skills.\n2. Why did you choose LTI as your starting career goal?\n3. Are you willing to work in night shifts?"
                    }
                }
            ]
        },
        {
            "name": "Deloitte",
            "desc": "Deloitte Touche Tohmatsu Limited is one of the Big Four accounting organizations and the largest professional services network in the world.",
            "logo": "https://api.dicebear.com/7.x/initials/svg?seed=DE",
            "rounds": [
                {
                    "num": 1, "title": "Deloitte Cognitive Assessment",
                    "desc": "Covers critical logical analysis, text summaries analysis, charts reading, and math problem solving.",
                    "resource": {
                        "title": "Deloitte Logic & Chart Reading MCQs",
                        "url": "https://drive.google.com/file/d/1demo-deloitte-r1/view",
                        "questions": "1. Analyze a sales bar chart: If Q1 sales increase by 15% and Q2 sales decrease by 5%, what is the net revenue difference?\n2. Logical syllogisms: All books are pens. Some pens are clocks. Conclusion checking."
                    }
                },
                {
                    "num": 2, "title": "Deloitte Technical & SQL Round",
                    "desc": "Technical evaluation including database normalization, schema design, and algorithms.",
                    "resource": {
                        "title": "Deloitte Previous SQL Questions",
                        "url": "https://drive.google.com/file/d/1demo-deloitte-r2/view",
                        "questions": "1. Write a query to find the second highest salary from Employee table.\n   ```sql\n   SELECT MAX(salary) FROM Employee\n   WHERE salary < (SELECT MAX(salary) FROM Employee);\n   ```\n2. Explain indexes in database tables. How do they optimize retrieval?"
                    }
                },
                {
                    "num": 3, "title": "Managerial & HR Interview",
                    "desc": "Client-facing behavioral scenarios. Assessing problem solving, communication, and consultative thinking.",
                    "resource": {
                        "title": "Managerial Situational Case Studies",
                        "url": "https://drive.google.com/file/d/1demo-deloitte-r3/view",
                        "questions": "1. If a client requests a feature that is out of scope and cannot be delivered in the current timeline, how will you respond?\n2. Talk about a time you led a team to complete a project under a tight deadline."
                    }
                }
            ]
        },
        {
            "name": "TCS",
            "desc": "Tata Consultancy Services is a global leader in IT services, consulting, and business solutions, part of India's largest conglomerate, the Tata Group.",
            "logo": "https://api.dicebear.com/7.x/initials/svg?seed=TC",
            "rounds": [
                {
                    "num": 1, "title": "TCS NQT National Qualifier Test",
                    "desc": "Conducted on TCS iON platform. Aptitude, Verbal, Logic, and 2 advanced coding questions.",
                    "resource": {
                        "title": "TCS NQT Advanced Coding Questions",
                        "url": "https://drive.google.com/file/d/1demo-tcs-r1/view",
                        "questions": "1. **Factorial of large numbers**:\n   Write a function to return the factorial of a large number and print it as a string.\n2. **Array Rotation**:\n   Rotate an array of N integers to the right by K positions."
                    }
                },
                {
                    "num": 2, "title": "Technical Interview",
                    "desc": "Technical panel review. Questions on basic data structures (Stack, Queue, LinkedList, Tree), DBMS, C programming.",
                    "resource": {
                        "title": "TCS Core Technical Questions Bank",
                        "url": "https://drive.google.com/file/d/1demo-tcs-r2/view",
                        "questions": "1. What is the difference between Call by Value and Call by Reference in C?\n2. Explain static variables in Python/Java. How are they allocated memory?\n3. Define ACID properties in database management."
                    }
                },
                {
                    "num": 3, "title": "Managerial & HR Panel",
                    "desc": "Assess integrity, company loyalty, educational history check, and relocation confirmation.",
                    "resource": {
                        "title": "TCS Behavioral & HR Guide",
                        "url": "https://drive.google.com/file/d/1demo-tcs-r3/view",
                        "questions": "1. Who is the founder of the Tata Group? Talk about the philanthropic work of Tata.\n2. Are you ready to sign a service bond agreement if required by the company?"
                    }
                }
            ]
        },
        {
            "name": "Infosys",
            "desc": "Infosys Limited is a global leader in next-generation digital services and consulting, serving clients in over 50 countries.",
            "logo": "https://api.dicebear.com/7.x/initials/svg?seed=IN",
            "rounds": [
                {
                    "num": 1, "title": "Infosys InfyTQ / Online Test",
                    "desc": "Quantitative Aptitude, Cryptarithmetic puzzles, Python/Java coding challenges, and DBMS questions.",
                    "resource": {
                        "title": "Infosys Cryptarithmetic & Math Prep",
                        "url": "https://drive.google.com/file/d/1demo-infosys-r1/view",
                        "questions": "1. **Cryptarithmetic Solve**:\n   SEND + MORE = MONEY. Find the digit value of each letter.\n   *Answer: S=9, E=5, N=6, D=7, M=1, O=0, R=8, Y=2*\n2. Quantitative Logic: Work, Time and Pipes systems calculations."
                    }
                },
                {
                    "num": 2, "title": "Technical Interview",
                    "desc": "Interviewer asks you to write code in a shareable editor. Focuses on string parsing, list queries, OOP syntax.",
                    "resource": {
                        "title": "Infosys Code Editor Prep List",
                        "url": "https://drive.google.com/file/d/1demo-infosys-r2/view",
                        "questions": "1. Write a function to check if two strings are anagrams of each other.\n2. What is abstract class vs interface? Write syntax examples in Java/Python.\n3. Explain primary keys, foreign keys, and unique constraints."
                    }
                },
                {
                    "num": 3, "title": "HR Interview",
                    "desc": "Final communication check, certificates checklist review, and career alignment discussion.",
                    "resource": {
                        "title": "Infosys HR Interview Questions",
                        "url": "https://drive.google.com/file/d/1demo-infosys-r3/view",
                        "questions": "1. Why do you want to start your professional journey with Infosys?\n2. Tell me about your hobbies. What do you do outside academics?"
                    }
                }
            ]
        },
        {
            "name": "Wipro",
            "desc": "Wipro Limited is a leading technology services and consulting company focused on building innovative solutions that address clients' most complex digital transformation needs.",
            "logo": "https://api.dicebear.com/7.x/initials/svg?seed=WI",
            "rounds": [
                {
                    "num": 1, "title": "Wipro Elite National Talent Hunt",
                    "desc": "Aptitude, logical analysis, verbal English grammar, basic coding test, and a business essay writing section.",
                    "resource": {
                        "title": "Wipro Essay Writing & Code Practice",
                        "url": "https://drive.google.com/file/d/1demo-wipro-r1/view",
                        "questions": "- Essay Writing: Write a 200-word essay on 'The impact of AI on job creation'. Checked for grammar, punctuation, and keyword consistency.\n- Coding: Find prime numbers in a given range."
                    }
                },
                {
                    "num": 2, "title": "Technical Interview",
                    "desc": "Review of coding structures, pointer operations, array indexes, and database schemas.",
                    "resource": {
                        "title": "Wipro Technical Panel Questions",
                        "url": "https://drive.google.com/file/d/1demo-wipro-r2/view",
                        "questions": "1. Explain pointer variables in C. What is a dangling pointer?\n2. What is the difference between DELETE and TRUNCATE in SQL?\n3. How do you implement a queue using two stacks?"
                    }
                },
                {
                    "num": 3, "title": "HR Interview",
                    "desc": "Relocation confirmation, shifts agreement review, and basic onboarding queries.",
                    "resource": {
                        "title": "Wipro HR Onboarding Guide",
                        "url": "https://drive.google.com/file/d/1demo-wipro-r3/view",
                        "questions": "1. Are you willing to work in night shifts or rotating shifts?\n2. Tell me about your college achievements."
                    }
                }
            ]
        },
        {
            "name": "Capgemini",
            "desc": "Capgemini is a global leader in partnering with companies to transform and manage their business by harnessing the power of technology.",
            "logo": "https://api.dicebear.com/7.x/initials/svg?seed=CA",
            "rounds": [
                {
                    "num": 1, "title": "Capgemini Game-Based Aptitude & English",
                    "desc": "Interactive cognitive games (Grid challenge, Motion challenge) followed by English grammar questions.",
                    "resource": {
                        "title": "Cognitive Games & Grammar Guides",
                        "url": "https://drive.google.com/file/d/1demo-capgemini-r1/view",
                        "questions": "- Grid memory: Memorize dot locations on blinking grids.\n- Motion logic: Solve ball trajectories to targets with minimum blocks.\n- Grammar: Error spotting and sentence structuring."
                    }
                },
                {
                    "num": 2, "title": "Technical & Coding Interview",
                    "desc": "Focuses on pseudo-code analysis, array sorting, string reversals, and basic OOP functions.",
                    "resource": {
                        "title": "Capgemini Coding & OOP Interview",
                        "url": "https://drive.google.com/file/d/1demo-capgemini-r2/view",
                        "questions": "1. Write a function to check if a number is Armstrong number.\n2. Explain polymorphism. What is method overloading vs method overriding?\n3. Explain different types of database inheritance models."
                    }
                },
                {
                    "num": 3, "title": "HR Interview",
                    "desc": "Discussion about background, certification achievements, and project workflows.",
                    "resource": {
                        "title": "Behavioral Questions List",
                        "url": "https://drive.google.com/file/d/1demo-capgemini-r3/view",
                        "questions": "1. Tell me about your major college project. What difficulties did you face?\n2. Why should Capgemini hire you?"
                    }
                }
            ]
        },
        {
            "name": "HCL",
            "desc": "HCLTech is a global technology company, home to 220,000+ people across 60 countries, delivering industry-leading capabilities centered around digital, engineering, cloud, and AI.",
            "logo": "https://api.dicebear.com/7.x/initials/svg?seed=HC",
            "rounds": [
                {
                    "num": 1, "title": "HCL Aptitude & Technical MCQs",
                    "desc": "Aptitude, reasoning, verbal section, and standard computer science technical MCQs (OS, networks, coding logic).",
                    "resource": {
                        "title": "HCL Previous Quant & Tech Papers",
                        "url": "https://drive.google.com/file/d/1demo-hcl-r1/view",
                        "questions": "1. What is the subnetwork mask for a Class C network with 4 subnets?\n   *Answer: 255.255.255.192*\n\n2. Solve: Find the time taken by a man to run around a square field of side 35 meters at 9 km/hr.\n   *Answer: 56 seconds*"
                    }
                },
                {
                    "num": 2, "title": "Technical Panel Interview",
                    "desc": "Interview covers programming algorithms, database keys, networking layers (OSI model), and system structures.",
                    "resource": {
                        "title": "HCL Core Tech Questions Bank",
                        "url": "https://drive.google.com/file/d/1demo-hcl-r2/view",
                        "questions": "1. Explain all 7 layers of the OSI reference model.\n2. Write a code to swap two integers without using a third variable.\n3. What is a transaction in database? Explain commit, rollback, savepoint."
                    }
                },
                {
                    "num": 3, "title": "HR & Placement Coordinator Review",
                    "desc": "Final documents checks, grades verification, and location allocation preferences discussion.",
                    "resource": {
                        "title": "HCL HR Final Round Guide",
                        "url": "https://drive.google.com/file/d/1demo-hcl-r3/view",
                        "questions": "1. Describe a time you worked outside your comfort zone. What did you learn?\n2. Are you open to relocating to HCL tech parks in Noida, Bangalore, or Chennai?"
                    }
                }
            ]
        }
    ]

    for comp in companies_data:
        company_obj = PlacementCompany.objects.create(
            name=comp["name"],
            description=comp["desc"],
            logo_url=comp["logo"]
        )
        for rnd in comp["rounds"]:
            round_obj = PlacementRound.objects.create(
                company=company_obj,
                round_num=rnd["num"],
                title=rnd["title"],
                description=rnd["desc"]
            )
            PlacementResource.objects.create(
                placement_round=round_obj,
                title=rnd["resource"]["title"],
                file_url=rnd["resource"]["url"],
                sample_questions=rnd["resource"]["questions"]
            )

    print("CSMS Database seeding completed successfully!")

if __name__ == '__main__':
    seed_db()
