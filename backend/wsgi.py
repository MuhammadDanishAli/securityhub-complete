import os
import sys

# Activate virtualenv
activate_this = '/home/MuhammadDanish/securityhub/venv/bin/activate_this.py'
with open(activate_this) as file_:
    exec(file_.read(), dict(__file__=activate_this))

# Add the project directory to the sys.path
path = '/home/MuhammadDanish/securityhub'
if path not in sys.path:
    sys.path.append(path)

# Set the Django settings module
os.environ['DJANGO_SETTINGS_MODULE'] = 'backend.settings'

# Import and get the WSGI application
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
