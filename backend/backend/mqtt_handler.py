import paho.mqtt.client as mqtt
import json
from django.db import transaction
from datetime import datetime
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.conf import settings
from typing import Optional

# Explicitly import api for models
import api

# Type hints for models
Sensor = Optional['api.models.Sensor']
SensorData = Optional['api.models.SensorData']

# Lazy loading functions for runtime
def get_sensor_model():
    from api.models import Sensor
    return Sensor

def get_sensor_data_model():
    from api.models import SensorData
    return SensorData

# Global channel_layer, initialized lazily
channel_layer = None

def on_message(client, userdata, message):
    global channel_layer
    if channel_layer is None:
        channel_layer = get_channel_layer()
    
    try:
        payload = json.loads(message.payload.decode())
        topic = message.topic

        if topic.startswith("security/sensors/"):
            # Handle sensor data
            sensor_id = payload.get('node_id', 'unknown')
            location = payload.get('location', 'unknown')
            sensor_type = payload.get('sensor_type', 'unknown')
            data_type = payload.get('data_type', 'unknown')
            value = payload.get('value', 0)
            unit = payload.get('unit', '')

            # Use lazy-loaded models
            Sensor = get_sensor_model()
            SensorData = get_sensor_data_model()

            # Store data in database
            sensor, created = Sensor.objects.get_or_create(
                node_id=sensor_id,
                defaults={'location': location, 'sensor_type': sensor_type}
            )
            SensorData.objects.create(
                sensor=sensor,
                data_type=data_type,
                value=value,
                unit=unit
            )

            # Send WebSocket alert
            async_to_sync(channel_layer.group_send)(
                "sensors",
                {
                    "type": "sensor_update",
                    "sensor_data": {
                        "node_id": sensor_id,
                        "location": location,
                        "sensor_type": sensor_type,
                        "data_type": data_type,
                        "value": value,
                        "unit": unit
                    }
                }
            )
            print(f"Data stored for sensor {sensor_id}")

            # Update last seen timestamp
            sensor_last_seen[sensor_id] = datetime.now().timestamp()
            check_disconnected_sensors()

        elif topic == "security/mode":
            # Handle mode updates (no database storage needed)
            mode = payload.get('mode', 'unknown')
            if mode in ['Stay', 'Disarm', 'Away']:
                async_to_sync(channel_layer.group_send)(
                    "sensors",
                    {
                        "type": "sensor_update",
                        "sensor_data": {
                            "type": "mode_update",
                            "mode": mode
                        }
                    }
                )
                print(f"Mode update sent: {mode}")

    except json.JSONDecodeError as e:
        print(f"Error decoding MQTT message: {e}")
    except Exception as e:
        print(f"Error processing MQTT message: {e}")

def on_connect(client, userdata, flags, rc):
    global channel_layer
    if rc == 0:
        print("✅ Connected to MQTT broker: localhost")
        client.subscribe("security/sensors/#")
        client.subscribe("security/mode")
        if channel_layer is None:
            channel_layer = get_channel_layer()
    else:
        print(f"⚠ Connection failed with code {rc}")

def check_disconnected_sensors():
    global channel_layer
    if channel_layer is None:
        channel_layer = get_channel_layer()
    current_time = datetime.now().timestamp()
    for sensor_id, last_seen in list(sensor_last_seen.items()):
        if current_time - last_seen > HEARTBEAT_TIMEOUT:
            Sensor = get_sensor_model()
            sensor = Sensor.objects.get(node_id=sensor_id)
            if sensor.status != "inactive":
                sensor.status = "inactive"
                sensor.save()
                async_to_sync(channel_layer.group_send)(
                    "sensors",
                    {
                        "type": "sensor_update",
                        "sensor_data": {"node_id": sensor_id, "status": "disconnected", "timestamp": datetime.now().isoformat()}
                    }
                )
                print(f"⚠ Sensor {sensor_id} marked as disconnected")
            del sensor_last_seen[sensor_id]

def start_mqtt():
    global client, channel_layer
    client.on_connect = on_connect
    client.on_message = on_message
    if not client.is_connected():
        try:
            client.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)
            client.loop_start()
            print("🚀 MQTT service started.")
        except Exception as e:
            print(f"❌ MQTT Connection Error: {e}")
    else:
        print("ℹ️ MQTT client already running.")

def stop_mqtt():
    global client
    client.loop_stop()
    client.disconnect()
    print("🛑 MQTT service stopped.")

MQTT_BROKER = "localhost"
MQTT_PORT = 1883
MQTT_USERNAME = "mqttuser"
MQTT_PASSWORD = "mqttpass123"
HEARTBEAT_TIMEOUT = 60

client = mqtt.Client()
client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
sensor_last_seen = {}