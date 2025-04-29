from django.shortcuts import render
from rest_framework import viewsets, generics
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.authentication import TokenAuthentication
from rest_framework.views import APIView
from .models import Sensor, SensorData, Alertlog, SystemMode
from .serializers import SensorSerializer, SensorDataSerializer, AlertlogSerializer, SystemModeSerializer
import paho.mqtt.publish as publish
import paho.mqtt.client as mqtt
import json
import ssl
import logging
from django.conf import settings

logger = logging.getLogger('api.views')

mqtt_client = None

def on_connect(client, userdata, flags, rc, properties=None):
    if rc == 0:
        logger.info("✅ Connected to MQTT broker: %s", settings.MQTT_BROKER_HOST)
        client.subscribe("security/sensors/#")
    else:
        logger.error("❌ Failed to connect to MQTT broker, return code: %d", rc)

def on_message(client, userdata, msg):
    try:
        topic = msg.topic
        payload = json.loads(msg.payload.decode())
        logger.debug(f"Received MQTT message on topic {topic}: {payload}")
        topic_parts = topic.split('/')
        if len(topic_parts) < 3:
            logger.warning(f"Invalid topic format: {topic}")
            return
        sensor_type = topic_parts[2]
        sensor_type_map = {'pir': 'PIR', 'vibration': 'Vibration', 'dht': 'DHT'}
        mapped_sensor_type = sensor_type_map.get(sensor_type)
        if not mapped_sensor_type:
            logger.warning(f"Unknown sensor type: {sensor_type}")
            return
        sensor, _ = Sensor.objects.get_or_create(
            node_id=f"sensor_{sensor_type}",
            defaults={'location': f"{sensor_type.upper()} Location", 'sensor_type': mapped_sensor_type}
        )
        sensor.status = 'active'
        sensor.enabled = True
        sensor.save()
        if sensor_type == 'dht':
            SensorData.objects.create(sensor=sensor, data_type='temperature', value=payload.get('temperature', 0))
            SensorData.objects.create(sensor=sensor, data_type='humidity', value=payload.get('humidity', 0))
        else:
            data_type = 'motion' if sensor_type == 'pir' else sensor_type
            SensorData.objects.create(sensor=sensor, data_type=data_type, value=payload.get('value', 0))
    except Exception as e:
        logger.error(f"Error processing MQTT message: {str(e)}")

def on_disconnect(client, userdata, rc, properties=None):
    logger.warning("Disconnected from MQTT broker. Attempting to reconnect...")
    # Attempt to reconnect
    try:
        client.reconnect()
    except Exception as e:
        logger.error(f"Reconnection failed: {str(e)}")

def start_mqtt_client():
    try:
        logger.info("🚀 MQTT service started.")
        # Create MQTT client (without CallbackAPIVersion for compatibility)
        client = mqtt.Client()
        client.on_connect = on_connect
        client.on_message = on_message

        if settings.MQTT_USE_TLS:
            # Use PROTOCOL_TLS for broader compatibility
            client.tls_set(tls_version=ssl.PROTOCOL_TLS, cert_reqs=ssl.CERT_NONE)
            client.tls_insecure_set(True)  # Skip certificate verification (temporary)

        if settings.MQTT_BROKER_USERNAME and settings.MQTT_BROKER_PASSWORD:
            client.username_pw_set(settings.MQTT_BROKER_USERNAME, settings.MQTT_BROKER_PASSWORD)

        client.connect(settings.MQTT_BROKER_HOST, settings.MQTT_BROKER_PORT, 60)
        client.loop_start()
    except Exception as e:
        logger.error(f"❌ MQTT Connection Error: {str(e)}")
        if mqtt_client:
            mqtt_client.loop_stop()

class TestAuthView(APIView):  # Fixed typo: APIView
    permission_classes = [AllowAny]
    authentication_classes = [TokenAuthentication]

    def get(self, request):
        logger.debug(f"TestAuthView headers: {dict(request.META)}")
        logger.debug(f"Authenticated user: {request.user if request.user.is_authenticated else 'None'}")
        if request.user.is_authenticated:
            return Response({"status": "Authenticated", "user": request.user.username})
        return Response({"status": "Unauthenticated"})

class SensorViewSet(viewsets.ModelViewSet):
    queryset = Sensor.objects.all()
    serializer_class = SensorSerializer
    permission_classes = [AllowAny]
    authentication_classes = []

    def perform_create(self, serializer):
        logger.debug(f"Creating sensor with data: {self.request.data}")
        serializer.save()

class SensorDataViewSet(viewsets.ModelViewSet):
    queryset = SensorData.objects.all()
    serializer_class = SensorDataSerializer
    permission_classes = [AllowAny]
    authentication_classes = []

class AlertlogViewSet(viewsets.ModelViewSet):
    queryset = Alertlog.objects.all()
    serializer_class = AlertlogSerializer
    permission_classes = [AllowAny]
    authentication_classes = []

class ModeView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        logger.debug(f"Mode update request: {request.data}")
        mode = request.data.get('mode')
        if mode not in ['Stay', 'Disarm', 'Away']:
            return Response({"error": "Invalid mode"}, status=400)
        system_mode, _ = SystemMode.objects.get_or_create(id=1, defaults={'mode': 'Disarm'})
        system_mode.mode = mode
        system_mode.save()
        try:
            auth = None
            if settings.MQTT_BROKER_USERNAME and settings.MQTT_BROKER_PASSWORD:
                auth = {"username": settings.MQTT_BROKER_USERNAME, "password": settings.MQTT_BROKER_PASSWORD}
            # Use consistent TLS settings for publishing
            tls_config = {'tls_version': ssl.PROTOCOL_TLSv1_2, 'cert_reqs': ssl.CERT_NONE} if getattr(settings, 'MQTT_USE_TLS', False) else None
            publish.single(
                "security/mode",
                payload=json.dumps({"mode": mode}),
                hostname=settings.MQTT_BROKER_HOST,
                port=settings.MQTT_BROKER_PORT,
                auth=auth,
                tls=tls_config,
                protocol=mqtt.MQTTv311
            )
            logger.info(f"Mode update sent: {mode}")
        except Exception as e:
            logger.error(f"Failed to publish mode update to MQTT: {str(e)}")
            return Response({"error": "Failed to publish mode update to MQTT"}, status=500)
        return Response({"status": "Mode set", "mode": mode})

class SensorControlView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        sensor = request.data.get('sensor')
        state = request.data.get('state')
        if sensor not in ['pir', 'vibration', 'dht']:
            return Response({"error": "Invalid sensor"}, status=400)
        if state not in ['on', 'off']:
            return Response({"error": "Invalid state"}, status=400)
        sensor_type_map = {'pir': 'PIR', 'vibration': 'Vibration', 'dht': 'DHT'}
        sensor_type = sensor_type_map.get(sensor)
        sensor_obj, _ = Sensor.objects.get_or_create(
            node_id=f"sensor_{sensor}",
            defaults={'location': f"{sensor.upper()} Location", 'sensor_type': sensor_type}
        )
        sensor_obj.enabled = (state == 'on')
        sensor_obj.save()
        topic = f"security/sensors/{sensor}/control"
        payload = json.dumps({"state": state})
        try:
            auth = None
            if settings.MQTT_BROKER_USERNAME and settings.MQTT_BROKER_PASSWORD:
                auth = {"username": settings.MQTT_BROKER_USERNAME, "password": settings.MQTT_BROKER_PASSWORD}
            # Use consistent TLS settings for publishing
            tls_config = {'tls_version': ssl.PROTOCOL_TLSv1_2, 'cert_reqs': ssl.CERT_NONE} if getattr(settings, 'MQTT_USE_TLS', False) else None
            publish.single(
                topic,
                payload=payload,
                hostname=settings.MQTT_BROKER_HOST,
                port=settings.MQTT_BROKER_PORT,
                auth=auth,
                tls=tls_config,
                protocol=mqtt.MQTTv311
            )
            logger.info(f"Published sensor control: {sensor} set to {state}")
        except Exception as e:
            logger.error(f"Failed to publish sensor control to MQTT: {str(e)}")
            return Response({"error": "Failed to publish sensor control to MQTT"}, status=500)
        return Response({"status": f"{sensor} set to {state}"}, status=200)

class SensorStatusView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        sensors = {
            "pir": {"connected": False, "enabled": False, "value": 0},
            "vibration": {"connected": False, "enabled": False, "value": 0},
            "dht": {"connected": False, "enabled": False, "temperature": 0, "humidity": 0}
        }
        pir_sensor = Sensor.objects.filter(sensor_type="PIR").first()
        if pir_sensor:
            pir_data = SensorData.objects.filter(sensor=pir_sensor, data_type="motion").order_by('-timestamp').first()
            sensors["pir"]["enabled"] = pir_sensor.enabled
            sensors["pir"]["connected"] = pir_sensor.status == "active"
            sensors["pir"]["value"] = pir_data.value if pir_data else 0
        vibration_sensor = Sensor.objects.filter(sensor_type="Vibration").first()
        if vibration_sensor:
            vibration_data = SensorData.objects.filter(sensor=vibration_sensor, data_type="vibration").order_by('-timestamp').first()
            sensors["vibration"]["enabled"] = vibration_sensor.enabled
            sensors["vibration"]["connected"] = vibration_sensor.status == "active"
            sensors["vibration"]["value"] = vibration_data.value if vibration_data else 0
        dht_sensor = Sensor.objects.filter(sensor_type="DHT").first()
        if dht_sensor:
            temp_data = SensorData.objects.filter(sensor=dht_sensor, data_type="temperature").order_by('-timestamp').first()
            humidity_data = SensorData.objects.filter(sensor=dht_sensor, data_type="humidity").order_by('-timestamp').first()
            sensors["dht"]["enabled"] = dht_sensor.enabled
            sensors["dht"]["connected"] = dht_sensor.status == "active"
            sensors["dht"]["temperature"] = temp_data.value if temp_data else 0
            sensors["dht"]["humidity"] = humidity_data.value if humidity_data else 0
        return Response(sensors, status=200)