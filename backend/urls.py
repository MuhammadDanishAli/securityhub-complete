from django.contrib import admin
from django.urls import path, include
from django.views.defaults import page_not_found, server_error

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
]

# Define error handlers
handler404 = page_not_found  # Handles 404 errors
handler500 = server_error    # Handles 500 errors
