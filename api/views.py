from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import authenticate
from .mqtt import mqtt_client
from rest_framework import status
import json

class LoginView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"message": "Please send a POST request with username and password to log in."})

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(request, username=username, password=password)
        if user:
            token, created = Token.objects.get_or_create(user=user)
            return Response({'token': token.key, 'role': user.is_superuser and 'admin' or 'user'})
        return Response({'error': 'Invalid username or password'}, status=400)

class PublishView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        message = request.data.get('message')
        if message and mqtt_client:
            mqtt_client.publish(message)
            return Response({'status': 'message published'})
        return Response({'error': 'Failed to publish'}, status=400)

    def get(self, request):
        return Response({'error': 'GET method not allowed'}, status=405)

class SensorStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Mock sensor data (replace with actual data from MQTT or database)
        sensors = {
            'pir': {'connected': True, 'enabled': False, 'value': 0},
            'vibration': {'connected': True, 'enabled': False, 'value': 0},
            'dht': {'connected': True, 'enabled': False, 'temperature': 25, 'humidity': 60},
        }
        return Response(sensors)

class ModeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        VALID_MODES = ["stay", "away", "disarm"]
        mode = request.data.get("mode", "").lower()

        if mode not in VALID_MODES:
            return Response({"error": "Invalid mode"}, status=status.HTTP_400_BAD_REQUEST)

        # Publish mode to MQTT
        mqtt_client.publish("security/mode", json.dumps({"mode": mode}))
        return Response({"status": "success", "mode": mode}, status=status.HTTP_200_OK)