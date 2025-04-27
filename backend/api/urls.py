from django.urls import path, include
from rest_framework import routers
from .views import (
    SensorViewSet, SensorDataViewSet, AlertlogViewSet,
    ModeView, SensorControlView, SensorStatusView, TestAuthView
)

router = routers.DefaultRouter()
router.register(r'sensors', SensorViewSet)
router.register(r'sensor-data', SensorDataViewSet)
router.register(r'alertlogs', AlertlogViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('test-auth/', TestAuthView.as_view(), name='test-auth'),
    path('mode/', ModeView.as_view(), name='mode'),
    path('sensor/', SensorControlView.as_view(), name='sensor-control'),
    path('sensor-status/', SensorStatusView.as_view(), name='sensor-status'),
]