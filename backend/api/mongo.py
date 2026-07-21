import os
import pymongo
from django.conf import settings

_mongo_client = None
_mongo_db = None

def get_mongo_db():
    global _mongo_client, _mongo_db
    if _mongo_db is None:
        uri = getattr(settings, 'MONGODB_URI', os.getenv('MONGODB_URI'))
        if not uri:
            uri = "mongodb+srv://nichithasree2006_db_user:nishitha%40223@cluster0.jaxdilz.mongodb.net/csms_db?retryWrites=true&w=majority"
        
        try:
            _mongo_client = pymongo.MongoClient(uri, serverSelectionTimeoutMS=5000)
            _mongo_db = _mongo_client.get_database('csms_db')
            print("[MongoDB] Successfully connected to MongoDB Atlas (csms_db)")
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


def restore_from_mongo():
    """Restore all data from MongoDB Atlas into active Django ORM models on startup/login."""
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
                batch = Batch(name=b_name, description=b.get('description', ''))
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
                    if student and batch and not BatchEnrollment.objects.filter(student=student, batch=batch).exists():
                        enr = BatchEnrollment(student=student, batch=batch, status=e.get('status', 'approved'))
                        if str(raw_id).isdigit():
                            enr.id = int(raw_id)
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

        print(f"[MongoDB Auto-Restore] Verified and restored MongoDB state ({len(mongo_users)} users, {len(mongo_batches)} batches, {len(mongo_tasks)} tasks).")
    except Exception as err:
        print(f"[MongoDB Auto-Restore Error] {err}")
