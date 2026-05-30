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
    DashboardStatsView,
    FacultyAssignmentListView,
    DepartmentListView,
    ModuleListView,
    LocalListView,
    GenerateScheduleView,
    ConfirmScheduleView,
    TaskStatusView,
    LocalViewSet,
    SceanceViewSet,
    VacationViewSet,
    ExtractVacationsView,
)

router = DefaultRouter()
router.register(r'vacations', VacationViewSet, basename='vacation')
router.register(r'sceance', SceanceViewSet, basename='sceance')
router.register(r'local', LocalViewSet, basename='local')

urlpatterns = [
    path("vacations/extract/", ExtractVacationsView.as_view(), name="vacation-extract"),
    path("", include(router.urls)),
    path("filiere/", FiliereListView.as_view(), name="filiere-list"),
    path("filiere/details/", FiliereDetailListView.as_view(), name="filiere-details"),
    path("dashboard-stats/", DashboardStatsView.as_view(), name="dashboard-stats"),
    path("faculty-assignments/", FacultyAssignmentListView.as_view(), name="faculty-assignments"),
    path("generate-schedule/", GenerateScheduleView.as_view(), name="generate-schedule"),
    path("task-status/<int:task_id>/", TaskStatusView.as_view(), name="task-status"),
    path("confirm-schedule/", ConfirmScheduleView.as_view(), name="confirm-schedule"),
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
