from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from core.views import (
    ComporteCreateView,
    DepartmentCreateView,
    FiliereCreateView,
    ModuleCreateView,
    FiliereListView,
    FiliereDetailListView,
    DepartmentListView,
    ModuleListView,
    LocalListView,
    SceanceViewSet,
    VacationViewSet,
    ExtractVacationsView,
)

router = DefaultRouter()
router.register(r'vacations', VacationViewSet, basename='vacation')
router.register(r'sceance', SceanceViewSet, basename='sceance')

urlpatterns = [
    path("vacations/extract/", ExtractVacationsView.as_view(), name="vacation-extract"),
    path("", include(router.urls)),
    path("filiere/", FiliereListView.as_view(), name="filiere-list"),
    path("filiere/details/", FiliereDetailListView.as_view(), name="filiere-details"),
    path("departement/", DepartmentListView.as_view(), name="departement-list"),
    path("module/", ModuleListView.as_view(), name="module-list"),
    path("local/", LocalListView.as_view(), name="local-list"),

    path("filiere/create-filiere/", FiliereCreateView.as_view(), name="create_filiere"),
    path(
        "departement/create-departement/",
        DepartmentCreateView.as_view(),
        name="create-departement",
    ),
    path(
        "module/create-module/",
        ModuleCreateView.as_view(),
        name="create-module",
    ),
    path(
        "module/affecter-filiere/",
        ComporteCreateView.as_view(),
        name="affecter-module",
    ),
    path("refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
