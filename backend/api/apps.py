from django.apps import AppConfig
from api.views import start_mqtt_client

class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'
    mqtt_client_started = False

    def ready(self):
        if not ApiConfig.mqtt_client_started:
            try:
                start_mqtt_client()
                ApiConfig.mqtt_client_started = True
            except Exception as e:
                # Use print since logger might not be initialized
                print(f"Failed to start MQTT client: {str(e)}")