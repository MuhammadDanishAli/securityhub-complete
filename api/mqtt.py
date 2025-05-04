import paho.mqtt.client as mqtt
import json
from django.conf import settings

MQTT_BROKER = getattr(settings, "MQTT_BROKER_HOST", "t0923b12.ala.us-east-1.emqx.com")
MQTT_PORT = getattr(settings, "MQTT_BROKER_PORT", 8883)
MQTT_USERNAME = getattr(settings, "MQTT_BROKER_USERNAME", "securityhub_user")
MQTT_PASSWORD = getattr(settings, "MQTT_BROKER_PASSWORD", "securemqtt123")
MQTT_TOPIC = getattr(settings, "MQTT_TOPIC", "security/sensors")

mqtt_client = mqtt.Client()
mqtt_client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
mqtt_client.tls_set()  # Enable TLS for port 8883

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Connected to MQTT Broker!")
        client.subscribe(MQTT_TOPIC)
    else:
        print(f"Failed to connect to MQTT Broker with code: {rc}")

def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        print(f"Received message: {payload} on topic {msg.topic}")
    except Exception as e:
        print(f"Error processing message: {e}")

mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message

def start_mqtt():
    try:
        mqtt_client.connect(MQTT_BROKER, MQTT_PORT)
        mqtt_client.loop_start()
    except Exception as e:
        print(f"Failed to start MQTT client: {e}")