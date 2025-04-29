#!/bin/bash
echo "Running startmqtt command..."
python backend/manage.py startmqtt
echo "Starting Gunicorn..."
exec gunicorn backend.wsgi:application --bind 0.0.0.0:8080
