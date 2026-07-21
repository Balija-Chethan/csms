import os
import pymongo
import time
from django.conf import settings

_mongo_client = None
_mongo_db = None
_last_restore_time = 0
RESTORE_THROTTLE_SECONDS = 15

def create_mongo_indexes(db):
    try:
        db['users'].create_index([('email', 1)], unique=True, sparse=True)
        db['users'].create_index([('username', 1)], unique=True)
        db['users'].create_index([('role', 1)])
        db['batch_enrollments'].create_index([('student_id', 1)])
        db['batch_enrollments'].create_index([('batch_id', 1)])
        db['batch_enrollments'].create_index([('status', 1)])
        db['tasks'].create_index([('batch_id', 1)])
        db['tasks'].create_index([('due_date', 1)])
        db['submissions'].create_index([('student_id', 1)])
        db['submissions'].create_index([('task_id', 1)])
        db['leetcode_submissions'].create_index([('student_id', 1)])
        db['leetcode_submissions'].create_index([('challenge_id', 1)])
        db['attendance_logs'].create_index([('student_id', 1)])
        db['attendance_logs'].create_index([('date', 1)])
        db['leave_requests'].create_index([('student_id', 1)])
        db['chat_messages'].create_index([('batch_id', 1)])
        db['chat_messages'].create_index([('timestamp', 1)])
        print("[MongoDB] Indexes verified/created successfully.")
    except Exception as e:
        print(f"[MongoDB Error] Failed to create indexes: {e}")

def get_mongo_db():
    global _mongo_client, _mongo_db
    if _mongo_db is None:
        uri = getattr(settings, 'MONGODB_URI', os.getenv('MONGODB_URI'))
        if not uri:
            uri = "mongodb+srv://balija-chethan:Chethan%402107@cluster0.dvawyze.mongodb.net/csms_db?retryWrites=true&w=majority"
        
        try:
            _mongo_client = pymongo.MongoClient(uri, serverSelectionTimeoutMS=5000)
            _mongo_db = _mongo_client.get_database('csms_db')
            print("[MongoDB] Successfully connected to MongoDB Atlas (csms_db)")
            create_mongo_indexes(_mongo_db)
        except Exception as e:
            print(f"[MongoDB Error] Connection to MongoDB Atlas failed: {e}")
            return None
    return _mongo_db


def sync_to_mongo(collection_name, doc_id, data):
    """Save or update a document in a MongoDB collection."""
    db = get_mongo_db()
    if db is None:
        return
    try:
        data['_id'] = str(doc_id)
        db[collection_name].replace_one({'_id': str(doc_id)}, data, upsert=True)
    except Exception as e:
        print(f"[MongoDB Error] Failed to sync document to {collection_name}: {e}")


def delete_from_mongo(collection_name, doc_id):
    """Delete a document from a MongoDB collection."""
    db = get_mongo_db()
    if db is None:
        return
    try:
        db[collection_name].delete_one({'_id': str(doc_id)})
    except Exception as e:
        print(f"[MongoDB Error] Failed to delete document from {collection_name}: {e}")


def get_all_from_mongo(collection_name):
    """Retrieve all documents from a MongoDB collection."""
    db = get_mongo_db()
    if db is None:
        return []
    try:
        return list(db[collection_name].find({}))
    except Exception as e:
        print(f"[MongoDB Error] Failed to fetch from {collection_name}: {e}")
        return []


def restore_from_mongo(force=False):
    """Restore all data from MongoDB Atlas into active Django ORM models on startup/login."""
    global _last_restore_time
    now = time.time()
    if not force and (now - _last_restore_time) < RESTORE_THROTTLE_SECONDS:
        return
    _last_restore_time = now

    db = get_mongo_db()
    if db is None:
        return
    
    try:
        from api.models import (
            User, Batch, BatchEnrollment, Task, Submission,
            LeetcodeChallenge, LeetcodeSubmission, StudyNote,
            MockDriveResult, AttendanceLog, LeaveRequest, ChatMessage,
            PlacementCompany, PlacementRound, PlacementResource
        )
        from datetime import datetime, date

        # 1. Restore Users
        mongo_users = list(db['users'].find({}))
        for u in mongo_users:
            raw_id = u.get('_id') or u.get('id')
            email = u.get('email') or u.get('username')
            username = u.get('username') or email
            if not username:
                continue
            
            existing = User.objects.filter(username=username).first() or User.objects.filter(email=email).first()
            if not existing:
                user = User(
                    username=username,
                    email=email,
                    first_name=u.get('first_name', ''),
                    last_name=u.get('last_name', ''),
                    roll_number=u.get('roll_number', ''),
                    phone_number=u.get('phone_number', ''),
                    role=u.get('role', 'student'),
                    github_url=u.get('github_url', ''),
                    linkedin_url=u.get('linkedin_url', ''),
                    portfolio_url=u.get('portfolio_url', ''),
                    hackerrank_url=u.get('hackerrank_url', '')
                )
                if str(raw_id).isdigit():
                    user.id = int(raw_id)
                if u.get('password'):
                    user.password = u['password']
                else:
                    user.set_password('password123')
                user.save()
            else:
                if u.get('password') and existing.password != u['password']:
                    existing.password = u['password']
                    existing.save(update_fields=['password'])

        # 2. Restore Batches
        mongo_batches = list(db['batches'].find({}))
        for b in mongo_batches:
            raw_id = b.get('_id') or b.get('id')
            b_name = b.get('name')
            if not b_name:
                continue
            existing = Batch.objects.filter(name=b_name).first()
            if not existing:
                batch = Batch(
                    name=b_name,
                    description=b.get('description', ''),
                    trainer_name=b.get('trainer_name', 'Senior Instructor'),
                    max_seats=b.get('max_seats', 60)
                )
                if str(raw_id).isdigit():
                    batch.id = int(raw_id)
                batch.save()

        # 3. Restore BatchEnrollments
        mongo_enrollments = list(db['batch_enrollments'].find({}))
        for e in mongo_enrollments:
            raw_id = e.get('_id') or e.get('id')
            student_id = e.get('student_id')
            batch_id = e.get('batch_id')
            if student_id and batch_id:
                try:
                    student = User.objects.filter(id=student_id).first()
                    batch = Batch.objects.filter(id=batch_id).first()
                    if student and batch:
                        enr = BatchEnrollment.objects.filter(student=student, batch=batch).first()
                        if not enr:
                            enr = BatchEnrollment(
                                student=student,
                                batch=batch,
                                status=e.get('status', 'pending')
                            )
                            if str(raw_id).isdigit():
                                enr.id = int(raw_id)
                        else:
                            enr.status = e.get('status', 'pending')
                        
                        if e.get('approved_by_id'):
                            approved_by_user = User.objects.filter(id=e.get('approved_by_id')).first()
                            if approved_by_user:
                                enr.approved_by = approved_by_user
                        enr.save()
                except Exception:
                    pass

        # 4. Restore Tasks
        mongo_tasks = list(db['tasks'].find({}))
        for t in mongo_tasks:
            raw_id = t.get('_id') or t.get('id')
            batch_id = t.get('batch_id')
            title = t.get('title')
            if batch_id and title:
                try:
                    batch = Batch.objects.filter(id=batch_id).first()
                    if batch and not Task.objects.filter(batch=batch, title=title).exists():
                        due_str = t.get('due_date', str(date.today()))
                        try:
                            parsed_due = datetime.strptime(due_str.split(' ')[0], "%Y-%m-%d").date()
                        except Exception:
                            parsed_due = date.today()
                        task = Task(batch=batch, title=title, description=t.get('description', ''), due_date=parsed_due)
                        if str(raw_id).isdigit():
                            task.id = int(raw_id)
                        task.save()
                except Exception:
                    pass

        # 5. Restore LeetcodeChallenges
        mongo_challenges = list(db['leetcode_challenges'].find({}))
        for lc in mongo_challenges:
            raw_id = lc.get('_id') or lc.get('id')
            title = lc.get('title')
            url = lc.get('url')
            if title and url:
                try:
                    if not LeetcodeChallenge.objects.filter(title=title).exists():
                        avail_str = lc.get('available_date', str(date.today()))
                        dead_str = lc.get('deadline', str(date.today() + timedelta(days=7)))
                        try:
                            parsed_avail = datetime.strptime(avail_str.split(' ')[0], "%Y-%m-%d").date()
                        except Exception:
                            parsed_avail = date.today()

                        try:
                            parsed_dead = timezone.make_aware(datetime.strptime(dead_str.split(' ')[0], "%Y-%m-%d").replace(hour=23, minute=59, second=59))
                        except Exception:
                            parsed_dead = timezone.now() + timedelta(days=7)

                        ch = LeetcodeChallenge(
                            title=title,
                            url=url,
                            day_number=lc.get('day_number', 1),
                            available_date=parsed_avail,
                            deadline=parsed_dead
                        )
                        if str(raw_id).isdigit():
                            ch.id = int(raw_id)
                        ch.save()
                except Exception:
                    pass

        # 6. Restore StudyNotes
        mongo_notes = list(db['study_notes'].find({}))
        for n in mongo_notes:
            raw_id = n.get('_id') or n.get('id')
            title = n.get('title')
            if title and not StudyNote.objects.filter(title=title).exists():
                try:
                    batch_id = n.get('batch_id')
                    batch_obj = Batch.objects.filter(id=batch_id).first() if batch_id else None
                    uploaded_by_id = n.get('uploaded_by_id')
                    uploader = User.objects.filter(id=uploaded_by_id).first() if uploaded_by_id else None
                    note = StudyNote(
                        batch=batch_obj,
                        title=title,
                        summary=n.get('summary', ''),
                        uploaded_by=uploader,
                        category=n.get('category', 'global'),
                        file_url=n.get('file_url', '')
                    )
                    if str(raw_id).isdigit():
                        note.id = int(raw_id)
                    note.save()
                except Exception:
                    pass

        # 7. Restore Placement Prep (Companies, Rounds, Resources)
        mongo_companies = list(db['placement_companies'].find({}))
        for c in mongo_companies:
            comp_name = c.get('name')
            raw_c_id = c.get('_id') or c.get('id')
            if comp_name:
                company_obj = PlacementCompany.objects.filter(name=comp_name).first()
                if not company_obj:
                    company_obj = PlacementCompany(
                        name=comp_name,
                        description=c.get('description', ''),
                        logo_url=c.get('logo_url', '')
                    )
                    if str(raw_c_id).isdigit():
                        company_obj.id = int(raw_c_id)
                    company_obj.save()

        mongo_rounds = list(db['placement_rounds'].find({}))
        for r in mongo_rounds:
            raw_r_id = r.get('_id') or r.get('id')
            company_id = r.get('company_id')
            round_num = r.get('round_num', 1)
            title = r.get('title', '')
            if company_id and title:
                company_obj = PlacementCompany.objects.filter(id=company_id).first()
                if company_obj and not PlacementRound.objects.filter(company=company_obj, round_num=round_num).exists():
                    r_obj = PlacementRound(
                        company=company_obj,
                        round_num=round_num,
                        title=title,
                        description=r.get('description', '')
                    )
                    if str(raw_r_id).isdigit():
                        r_obj.id = int(raw_r_id)
                    r_obj.save()

        mongo_resources = list(db['placement_resources'].find({}))
        for res in mongo_resources:
            raw_res_id = res.get('_id') or res.get('id')
            placement_round_id = res.get('placement_round_id')
            title = res.get('title', '')
            if placement_round_id and title:
                p_round = PlacementRound.objects.filter(id=placement_round_id).first()
                if p_round and not PlacementResource.objects.filter(placement_round=p_round, title=title).exists():
                    res_obj = PlacementResource(
                        placement_round=p_round,
                        title=title,
                        file_url=res.get('file_url', ''),
                        sample_questions=res.get('sample_questions', '')
                    )
                    if str(raw_res_id).isdigit():
                        res_obj.id = int(raw_res_id)
                    res_obj.save()

        print(f"[MongoDB Auto-Restore] Verified state ({len(mongo_users)} users, {len(mongo_batches)} batches, {len(mongo_notes)} study notes, {len(mongo_companies)} placement companies).")
    except Exception as err:
        print(f"[MongoDB Auto-Restore Error] {err}")
