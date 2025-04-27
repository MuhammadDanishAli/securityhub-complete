from django.shortcuts import render
from rest_framework import viewsets, generics
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.authentication import TokenAuthentication
from rest_framework.views import APIView
from .models import Sensor, SensorData, Alertlog, SystemMode
from .serializers import SensorSerializer, SensorDataSerializer, AlertlogSerializer, SystemModeSerializer
import paho.mqtt.publish as publish
import json
import logging

logger = logging.getLogger('api.views')

class TestAuthView(APIView):
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
    permission_classes = [AllowAny]  # Temporary for FYP demo
    authentication_classes = []

    def perform_create(self, serializer):
        logger.debug(f"Creating sensor with data: {self.request.data}")
        serializer.save()

class SensorDataViewSet(viewsets.ModelViewSet):
    queryset = SensorData.objects.all()
    serializer_class = SensorDataSerializer
    permission_classes = [AllowAny]  # Temporary for FYP demo
    authentication_classes = []

class AlertlogViewSet(viewsets.ModelViewSet):
    queryset = Alertlog.objects.all()
    serializer_class = AlertlogSerializer
    permission_classes = [AllowAny]  # Temporary for FYP demo
    authentication_classes = []

class ModeView(APIView):
    permission_classes = [AllowAny]  # Temporary for FYP demo
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        logger.debug(f"Mode update request: {request.data}")
        mode = request.data.get('mode')
        if mode not in ['Stay', 'Disarm', 'Away']:
            return Response({"error": "Invalid mode"}, status=400)
        system_mode, _ = SystemMode.objects.get_or_create(id=1, defaults={'mode': 'Disarm'})
        system_mode.mode = mode
        system_mode.save()
        publish.single(
            "security/mode",
            payload=json.dumps({"mode": mode}),
            hostname="localhost",
            port=1883,
            auth={"username": "mqttuser", "password": "mqttpass123"}
        )
        logger.info(f"Mode update sent: {mode}")
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

        # Map frontend sensor names to sensor types
        sensor_type_map = {
            'pir': 'PIR',
            'vibration': 'Vibration',
            'dht': 'DHT'
        }
        sensor_type = sensor_type_map.get(sensor)

        # Update sensor state in the database
        sensor_obj, _ = Sensor.objects.get_or_create(
            node_id=f"sensor_{sensor}",
            defaults={'location': f"{sensor.upper()} Location", 'sensor_type': sensor_type}
        )
        sensor_obj.enabled = (state == 'on')
        sensor_obj.save()

        # Publish to MQTT to notify ESP32
        topic = f"security/sensors/{sensor}/control"
        payload = json.dumps({"state": state})
        publish.single(
            topic,
            payload=payload,
            hostname="localhost",
            port=1883,
            auth={"username": "mqttuser", "password": "mqttpass123"}
        )

        return Response({"status": f"{sensor} set to {state}"}, status=200)

class SensorStatusView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        # Initialize the response structure expected by the frontend
        sensors = {
            "pir": {"connected": False, "enabled": False, "value": 0},
            "vibration": {"connected": False, "enabled": False, "value": 0},
            "dht": {"connected": False, "enabled": False, "temperature": 0, "humidity": 0}
        }

        # PIR Sensor
        pir_sensor = Sensor.objects.filter(sensor_type="PIR").first()
        if pir_sensor:
            pir_data = SensorData.objects.filter(sensor=pir_sensor, data_type="motion").order_by('-timestamp').first()
            sensors["pir"]["enabled"] = pir_sensor.enabled
            sensors["pir"]["connected"] = pir_sensor.status == "active"
            sensors["pir"]["value"] = pir_data.value if pir_data else 0

        # Vibration Sensor
        vibration_sensor = Sensor.objects.filter(sensor_type="Vibration").first()
        if vibration_sensor:
            vibration_data = SensorData.objects.filter(sensor=vibration_sensor, data_type="vibration").order_by('-timestamp').first()
            sensors["vibration"]["enabled"] = vibration_sensor.enabled
            sensors["vibration"]["connected"] = vibration_sensor.status == "active"
            sensors["vibration"]["value"] = vibration_data.value if vibration_data else 0

        # DHT Sensor (temperature and humidity)
        dht_sensor = Sensor.objects.filter(sensor_type="DHT").first()
        if dht_sensor:
            temp_data = SensorData.objects.filter(sensor=dht_sensor, data_type="temperature").order_by('-timestamp').first()
            humidity_data = SensorData.objects.filter(sensor=dht_sensor, data_type="humidity").order_by('-timestamp').first()
            sensors["dht"]["enabled"] = dht_sensor.enabled
            sensors["dht"]["connected"] = dht_sensor.status == "active"
            sensors["dht"]["temperature"] = temp_data.value if temp_data else 0
            sensors["dht"]["humidity"] = humidity_data.value if humidity_data else 0

        return Response(sensors, status=200)