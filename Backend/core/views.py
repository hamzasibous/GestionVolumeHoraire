from django.shortcuts import render

from .models import Comporte, Departement, Filiere, Module, Sceance, Vacation, Local
from rest_framework import serializers, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
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


class LocalSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="__str__", read_only=True)
    departement_name = serializers.CharField(source="departement.nom", read_only=True)

    class Meta:
        model = Local
        fields = ["id", "bloc", "numero", "capacite", "departement", "departement_name", "name"]


class LocalViewSet(viewsets.ModelViewSet):
    queryset = Local.objects.all()
    serializer_class = LocalSerializer


class SceanceSerializer(serializers.ModelSerializer):
    enseignant_name = serializers.CharField(source="enseignant.__str__", read_only=True)
    local_name = serializers.CharField(source="local.__str__", read_only=True)
    module_name = serializers.CharField(source="module.nom", read_only=True)
    
    class Meta:
        model = Sceance
        fields = ["id", "type", "duree", "date", "module", "module_name", "enseignant", "enseignant_name", "local", "local_name"]


class VacationSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source="enseignant.__str__", read_only=True)

    class Meta:
        model = Vacation
        fields = ["id", "enseignant", "teacher_name", "titre", "date_debut", "date_fin", "type_conge", "statut", "is_global"]


class VacationViewSet(viewsets.ModelViewSet):
    queryset = Vacation.objects.all()
    serializer_class = VacationSerializer

    def create(self, request, *args, **kwargs):
        is_bulk = request.data.get('enseignant') == 'all' or request.data.get('is_global') == True
        
        if is_bulk:
            data = request.data.copy()
            data['is_global'] = True
            data['enseignant'] = None # Global holiday doesn't need a specific teacher
            if not data.get('titre'):
                data['titre'] = data.get('type_conge', 'Global Holiday')
            
            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return super().create(request, *args, **kwargs)


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


from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from .ai_service import AIService

class ExtractVacationsView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        file_obj = request.data.get('image')
        if not file_obj:
            return Response({"error": "No image provided"}, status=status.HTTP_400_BAD_REQUEST)

        ai_service = AIService()
        results = ai_service.extract_vacations_from_image(file_obj)
        
        if isinstance(results, dict) and "error" in results:
            return Response(results, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        return Response(results, status=status.HTTP_200_OK)


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

class LocalListView(ListAPIView):
    queryset = Local.objects.all()
    serializer_class = LocalSerializer

class SceanceViewSet(viewsets.ModelViewSet):
    queryset = Sceance.objects.all()
    serializer_class = SceanceSerializer

    def get_queryset(self):
        queryset = Sceance.objects.all()
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date and end_date:
            queryset = queryset.filter(date__range=[start_date, end_date])
        return queryset

    @action(detail=False, methods=['get'])
    def check_availability(self, request):
        local_id = request.query_params.get('local')
        date = request.query_params.get('date')
        if not local_id or not date:
            return Response({"error": "Missing local or date"}, status=400)
            
        conflicts = Sceance.objects.filter(local_id=local_id, date=date)
        return Response({
            "available": not conflicts.exists(),
            "conflicts": SceanceSerializer(conflicts, many=True).data
        })

class ModuleListView(ListAPIView):
    queryset = Module.objects.all()
    serializer_class = ModuleSerializer

class FiliereDetailListView(ListAPIView):
    queryset = Filiere.objects.all()
    serializer_class = FiliereDetailSerializer
