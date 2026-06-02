from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SimulationViewSet

router = DefaultRouter()
router.register(r'simulations', SimulationViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
