from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, ProfileView

router = DefaultRouter()
router.register(r'management', UserViewSet, basename='user-management')

urlpatterns = [
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('', include(router.urls)),
]
