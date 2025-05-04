import ssl
  import paho.mqtt.client as mqtt
  from django.conf import settings

  class MQTTClient:
      def __init__(self):
          self.client = mqtt.Client(client_id="django_backend")
          self.client.on_connect = self.on_connect
          self.client.on_message = self.on_message
          self.client.username_pw_set(settings.MQTT_BROKER_USERNAME, settings.MQTT_BROKER_PASSWORD)
          if settings.MQTT_USE_TLS:
              self.client.tls_set(tls_version=ssl.PROTOCOL_TLS)
          self.client.connect(settings.MQTT_BROKER_HOST, settings.MQTT_BROKER_PORT, settings.MQTT_KEEPALIVE)
          self.client.loop_start()

      def on_connect(self, client, userdata, flags, rc):
          if rc == 0:
              print("Connected to MQTT Broker!")
              self.client.subscribe(settings.MQTT_TOPIC)
          else:
              print(f"Failed to connect, return code {rc}")

      def on_message(self, client, userdata, msg):
          print(f"Received message: {msg.payload.decode()} on topic {msg.topic}")

      def publish(self, message):
          result = self.client.publish(settings.MQTT_TOPIC, message)
          if result.rc == mqtt.MQTT_ERR_SUCCESS:
              print(f"Message published: {message}")
          else:
              print("Failed to publish message")

      def __del__(self):
          self.client.loop_stop()
          self.client.disconnect()

  mqtt_client = None
  try:
      mqtt_client = MQTTClient()
  except Exception as e:
      print(f"Failed to initialize MQTT client: {e}")