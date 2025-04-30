from django.core.management.base import BaseCommand
from api.views import start_mqtt_client
import time

class Command(BaseCommand):
    help = 'Starts the MQTT client for the SecurityHub backend'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting MQTT client...'))
        start_mqtt_client()
        self.stdout.write(self.style.SUCCESS('MQTT client started successfully.'))
        # Keep the process alive to ensure the MQTT client thread continues running
        while True:
            time.sleep(60)  # Sleep to keep the process alive
