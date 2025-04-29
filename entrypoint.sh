#!/bin/sh
echo "DEBUG: Starting entrypoint.sh"
echo "DEBUG: Current directory: $(pwd)"
echo "DEBUG: Running startmqtt command..."
python backend/manage.py startmqtt
echo "DEBUG: Starting Gunicorn..."
exec gunicorn backend.wsgi:application --bind 0.0.0.0:8080
