from django.apps import AppConfig

class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        # Import here to avoid circular imports
        from .views import start_mqtt_client
        try:
            start_mqtt_client()
        except Exception as e:
            from logging import getLogger
            logger = getLogger('api.views')
            logger.error(f"Failed to start MQTT client on app startup: {str(e)}")