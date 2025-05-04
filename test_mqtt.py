import paho.mqtt.client as mqtt

def on_connect(client, userdata, flags, rc):
    print(f"Connected with result code {rc}")

client = mqtt.Client()
client.on_connect = on_connect
try:
    client.connect("broker.hivemq.com", 1883, 60)
    client.loop_start()
    import time
    time.sleep(5)
    client.loop_stop()
except Exception as e:
    print(f"Connection failed: {e}")