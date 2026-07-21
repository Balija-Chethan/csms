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
            # Default to csms_db database
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
