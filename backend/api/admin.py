from django.contrib import admin
from .models import Sensor, SensorData, Alertlog, SystemMode

admin.site.register(Sensor)
admin.site.register(SensorData)
admin.site.register(Alertlog)
admin.site.register(SystemMode)
