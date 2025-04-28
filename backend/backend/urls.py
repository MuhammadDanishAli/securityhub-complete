from django.urls import path, include
from django.http import JsonResponse

def root_view(request):
    return JsonResponse({"message": "Welcome to SecurityHub Backend", "api": "/api/"})

urlpatterns = [
    path('api/', include('api.urls')),
    path('', root_view, name='home'),
]