from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'sensors', views.SensorViewSet)
router.register(r'sensor-data', views.SensorDataViewSet)
router.register(r'alertlogs', views.AlertlogViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('login/', views.LoginView.as_view(), name='login'),
    path('test-auth/', views.TestAuthView.as_view(), name='test_auth'),
    path('mode/', views.ModeView.as_view(), name='mode'),
    path('sensor-control/', views.SensorControlView.as_view(), name='sensor_control'),
    path('sensor-status/', views.SensorStatusView.as_view(), name='sensor_status'),
]
