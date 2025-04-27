from django.db import models

class Sensor(models.Model):
    node_id = models.CharField(max_length=100, unique=True)
    location = models.CharField(max_length=255)
    sensor_type = models.CharField(max_length=50)  # Free-form to allow any type
    status = models.CharField(max_length=50, choices=[("active", "Active"), ("inactive", "Inactive")], default="active")
    enabled = models.BooleanField(default=False)  # Add enabled field
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Sensor {self.node_id} - {self.location} ({self.sensor_type})"

class SensorData(models.Model):
    sensor = models.ForeignKey(Sensor, on_delete=models.CASCADE)
    data_type = models.CharField(max_length=50)
    value = models.FloatField()
    unit = models.CharField(max_length=10, default="C")
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sensor.node_id} - {self.data_type}: {self.value} {self.unit}"

class Alertlog(models.Model):
    sensor = models.ForeignKey(Sensor, on_delete=models.CASCADE)
    alert_type = models.CharField(max_length=100, choices=[("critical", "Critical"), ("warning", "Warning"), ("info", "Info")])
    message = models.TextField()
    is_resolved = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Alert for {self.sensor.node_id} : {self.alert_type} - {self.message}"

class SystemMode(models.Model):
    mode = models.CharField(
        max_length=20,
        choices=[("Stay", "Stay"), ("Disarm", "Disarm"), ("Away", "Away")],
        default="Disarm"
    )
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"System Mode: {self.mode}"