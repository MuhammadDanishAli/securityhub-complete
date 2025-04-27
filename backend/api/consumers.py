from channels.generic.websocket import AsyncWebsocketConsumer
import json
from .models import Sensor, SensorData

class SensorConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add("sensors", self.channel_name)
        await self.accept()
        await self.send(json.dumps({"message": "Connected to sensor updates"}))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("sensors", self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        node_id = data.get('node_id')
        sensor_type = data.get('sensor_type', 'unknown')
        # Save or update sensor dynamically
        sensor, created = Sensor.objects.get_or_create(
            node_id=node_id,
            defaults={'location': data.get('location', 'unknown'), 'sensor_type': sensor_type}
        )
        # Save sensor data
        SensorData.objects.create(
            sensor=sensor,
            data_type=data.get('data_type', sensor_type),
            value=data.get('value', 0.0),
            unit=data.get('unit', '')
        )
        # Broadcast to WebSocket clients
        await self.channel_layer.group_send(
            "sensors",
            {"type": "sensor_update", "message": data}
        )

    async def sensor_update(self, event):
        await self.send(json.dumps({"sensor_data": event["message"]}))