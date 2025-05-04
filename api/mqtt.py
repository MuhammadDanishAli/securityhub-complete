import paho.mqtt.client as mqtt
from django.conf import settings
import ssl

class MQTTClient:
    def __init__(self):
        self.client = mqtt.Client()
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        if getattr(settings, 'MQTT_BROKER_USERNAME', None) and getattr(settings, 'MQTT_BROKER_PASSWORD', None):
            self.client.username_pw_set(settings.MQTT_BROKER_USERNAME, settings.MQTT_BROKER_PASSWORD)
        if getattr(settings, 'MQTT_USE_TLS', False):
            self.client.tls_set(ca_certs=None, certfile=None, keyfile=None, cert_reqs=ssl.CERT_NONE, tls_version=ssl.PROTOCOL_TLSv1_2)
            self.client.tls_insecure_set(True)  # For testing; remove in production
        self.connected = False
        self.keepalive = getattr(settings, 'MQTT_KEEPALIVE', 60)

    def connect(self):
        if not self.connected:
            try:
                self.client.connect(settings.MQTT_BROKER_HOST, settings.MQTT_BROKER_PORT, self.keepalive)
                self.client.loop_start()
                self.connected = True
                print("Connected to MQTT Broker!")
            except Exception as e:
                print(f"Failed to connect: {e}")

    def on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            print("Connected to MQTT Broker!")
            client.subscribe(settings.MQTT_TOPIC)
        else:
            print(f"Failed to connect, return code {rc}")

    def on_message(self, client, userdata, msg):
        print(f"Received message on topic: {msg.topic} with payload: {msg.payload.decode()}")

    def publish(self, message):
        if not self.connected:
            self.connect()
        result = self.client.publish(settings.MQTT_TOPIC, message)
        if result.rc == mqtt.MQTT_ERR_SUCCESS:
            print(f"Published message to {settings.MQTT_TOPIC}")
        else:
            print(f"Failed to publish message, return code {result.rc}")
        return result

mqtt_client = MQTTClient()