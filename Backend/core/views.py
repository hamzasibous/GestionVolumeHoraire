from django.shortcuts import render

from .models import Comporte, Departement, Filiere, Module, Sceance
from rest_framework import serializers
from users.models import Enseignant


class FiliereSerializer(serializers.ModelSerializer):
    class Meta:
        model = Filiere
        fields = ["id", "nom", "description", "niveaux", "departement", "modules"]


class DepartementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Departement
        fields = ["id", "nom"]


class ModuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Module
        fields = ["id", "nom"]


class ComporteSerlizer(serializers.ModelSerializer):
    class Meta:
        model = Comporte
        fields = ["id", "filiere", "module", "semestre"]


class SceanceSerializer(serializers.ModelSerializer):
    enseignant_name = serializers.CharField(source="enseignant.__str__", read_only=True)
    local_name = serializers.CharField(source="local.__str__", read_only=True)
    
    class Meta:
        model = Sceance
        fields = ["id", "type", "duree", "date", "enseignant_name", "local_name"]


class ModuleDetailSerializer(serializers.ModelSerializer):
    seances = SceanceSerializer(many=True, source="sceances", read_only=True)
    total_hours = serializers.SerializerMethodField()
    assigned_hours = serializers.SerializerMethodField()
    
    class Meta:
        model = Module
        fields = ["id", "nom", "seances", "total_hours", "assigned_hours"]

    def get_total_hours(self, obj):
        # Default value since not in model yet
        return 0

    def get_assigned_hours(self, obj):
        return sum(s.duree for s in obj.sceances.all())


class FiliereDetailSerializer(serializers.ModelSerializer):
    modules = ModuleDetailSerializer(many=True, read_only=True)
    niveaux_display = serializers.CharField(source="get_niveaux_display", read_only=True)
    
    class Meta:
        model = Filiere
        fields = ["id", "nom", "description", "niveaux", "niveaux_display", "modules"]


# In your views.py
from rest_framework.generics import CreateAPIView, ListAPIView
from .models import Filiere


class FiliereCreateView(CreateAPIView):
    queryset = Filiere.objects.all()
    serializer_class = FiliereSerializer


class DepartmentCreateView(CreateAPIView):
    queryset = Departement.objects.all()
    serializer_class = DepartementSerializer


class ModuleCreateView(CreateAPIView):
    queryset = Module.objects.all()
    serializer_class = ModuleSerializer


class ComporteCreateView(CreateAPIView):
    queryset = Comporte.objects.all()
    serializer_class = ComporteSerlizer

class FiliereListView(ListAPIView):
    queryset = Filiere.objects.all()
    serializer_class = FiliereSerializer

class DepartmentListView(ListAPIView):
    queryset = Departement.objects.all()
    serializer_class = DepartementSerializer

class ModuleListView(ListAPIView):
    queryset = Module.objects.all()
    serializer_class = ModuleSerializer

class FiliereDetailListView(ListAPIView):
    queryset = Filiere.objects.all()
    serializer_class = FiliereDetailSerializer
