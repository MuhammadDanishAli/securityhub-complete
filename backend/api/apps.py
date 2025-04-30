from django.apps import AppConfig

class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'
    mqtt_client_started = False

    def ready(self):
        if not ApiConfig.mqtt_client_started:
            try:
                # Import inside the method to avoid circular dependency
                from api.views import start_mqtt_client
                start_mqtt_client()
                ApiConfig.mqtt_client_started = True
            except Exception as e:
                print(f"Failed to start MQTT client: {str(e)}")