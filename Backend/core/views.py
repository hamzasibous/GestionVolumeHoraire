from django.shortcuts import render

from .models import Comporte, Departement, Filiere, Module
from rest_framework import serializers


class FiliereSerializer(serializers.ModelSerializer):
    class Meta:
        model = Filiere
        fields = ["nom", "niveaux", "departement", "modules"]


class DepartementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Departement
        fields = ["nom"]


class ModuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Module
        fields = ["nom"]


class ComporteSerlizer(serializers.ModelSerializer):
    class Meta:
        model = Comporte
        fields = ["filiere", "module", "semestre"]


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
