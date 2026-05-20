from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from django.urls import path

from core.views import (
    ComporteCreateView,
    DepartmentCreateView,
    FiliereCreateView,
    ModuleCreateView,
    FiliereListView,
    DepartmentListView,
    ModuleListView,

)

urlpatterns = [
    path("filiere/", FiliereListView.as_view(), name="filiere-list"),
    path("departement/", DepartmentListView.as_view(), name="departement-list"),
    path("module/", ModuleListView.as_view(), name="module-list"),

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
