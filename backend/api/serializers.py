from rest_framework import serializers
from .models import Sensor, SensorData, Alertlog, SystemMode

class SensorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sensor
        fields = '__all__'

class SensorDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = SensorData
        fields = '__all__'

class AlertlogSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alertlog
        fields = '__all__'

class SystemModeSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemMode
        fields = ['mode']