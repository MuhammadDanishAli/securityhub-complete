import paho.mqtt.client as mqtt
from django.conf import settings
import json
from threading import Thread

# Global MQTT client
mqtt_client = None

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print(f"✅ Connected to MQTT broker: {settings.MQTT_BROKER_HOST}")
        client.subscribe("security/sensors/#")  # Subscribe to all sensor topics
    else:
        print(f"❌ Failed to connect to MQTT broker: {rc}")

def on_message(client, userdata, msg):
    try:
        topic = msg.topic
        payload = json.loads(msg.payload.decode())
        logger.debug(f"Received MQTT message on topic {topic}: {payload}")

        # Parse topic to determine sensor type
        topic_parts = topic.split('/')
        if len(topic_parts) < 3:
            return

        sensor_type = topic_parts[2]  # e.g., 'pir', 'vibration', 'dht'
        sensor_type_map = {
            'pir': 'PIR',
            'vibration': 'Vibration',
            'dht': 'DHT'
        }
        mapped_sensor_type = sensor_type_map.get(sensor_type)
        if not mapped_sensor_type:
            return

        # Update sensor status
        sensor, _ = Sensor.objects.get_or_create(
            node_id=f"sensor_{sensor_type}",
            defaults={'location': f"{sensor_type.upper()} Location", 'sensor_type': mapped_sensor_type}
        )
        sensor.status = 'active'
        sensor.enabled = True
        sensor.save()

        # Save sensor data
        if sensor_type == 'dht':
            SensorData.objects.create(
                sensor=sensor,
                data_type='temperature',
                value=payload.get('temperature', 0)
            )
            SensorData.objects.create(
                sensor=sensor,
                data_type='humidity',
                value=payload.get('humidity', 0)
            )
        else:
            SensorData.objects.create(
                sensor=sensor,
                data_type=sensor_type,
                value=payload.get('value', 0)
            )
    except Exception as e:
        logger.error(f"Error processing MQTT message: {str(e)}")

def start_mqtt_client():
    global mqtt_client
    mqtt_client = mqtt.Client()
    mqtt_client.on_connect = on_connect
    mqtt_client.on_message = on_message

    if getattr(settings, 'MQTT_USE_TLS', False):
        mqtt_client.tls_set()
    if settings.MQTT_BROKER_USERNAME and settings.MQTT_BROKER_PASSWORD:
        mqtt_client.username_pw_set(settings.MQTT_BROKER_USERNAME, settings.MQTT_BROKER_PASSWORD)

    try:
        mqtt_client.connect(settings.MQTT_BROKER_HOST, settings.MQTT_BROKER_PORT)
        print("🚀 MQTT service started.")
        mqtt_client.loop_forever()  # Run in a blocking loop
    except Exception as e:
        print(f"❌ MQTT Connection Error: {str(e)}")

# Start MQTT client in a separate thread
Thread(target=start_mqtt_client, daemon=True).start()