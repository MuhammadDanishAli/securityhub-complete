from django.apps import AppConfig
from api.views import start_mqtt_client

class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    # Class variable to store the MQTT client
    mqtt_client_started = False

    def ready(self):
        # Only start the MQTT client once
        if not ApiConfig.mqtt_client_started:
            start_mqtt_client()
            ApiConfig.mqtt_client_started = True