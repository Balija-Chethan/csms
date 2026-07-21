from django.apps import AppConfig

class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        import api.signals
        from api.mongo import get_mongo_db, restore_from_mongo
        get_mongo_db()
        restore_from_mongo()
