from django.urls import path
from .views import LoginView, PublishView, SensorStatusView, ModeView

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('publish/', PublishView.as_view(), name='publish'),
    path('sensor-status/', SensorStatusView.as_view(), name='sensor-status'),
    path('mode/', ModeView.as_view(), name='mode'),
]