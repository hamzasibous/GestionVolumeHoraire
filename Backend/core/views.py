from django.shortcuts import render
from django.db import models

from .models import Comporte, Departement, Filiere, Module, Sceance, Vacation, Local, SemesterPeriod, ScheduleTask
from rest_framework import serializers, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from users.models import Enseignant
import threading
from .solver import run_genetic_algorithm


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
        fields = ["id", "bloc", "numero", "capacite", "is_amphi", "departement", "departement_name", "name"]


class LocalViewSet(viewsets.ModelViewSet):
    queryset = Local.objects.all()
    serializer_class = LocalSerializer


class SceanceSerializer(serializers.ModelSerializer):
    enseignant_name = serializers.SerializerMethodField()
    local_name = serializers.CharField(source="local.__str__", read_only=True)
    module_name = serializers.CharField(source="module.nom", read_only=True)
    
    class Meta:
        model = Sceance
        fields = ["id", "type", "duree", "date", "heure_debut", "module", "module_name", "enseignant", "enseignant_name", "local", "local_name"]

    def get_enseignant_name(self, obj):
        if obj.enseignant:
            return str(obj.enseignant)
        return ""


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
    total_hours = serializers.SerializerMethodField()
    assigned_hours = serializers.SerializerMethodField()
    semestre = serializers.SerializerMethodField()
    v_h_hebdo = serializers.SerializerMethodField()
    seances = SceanceSerializer(many=True, source="sceances", read_only=True)
    
    class Meta:
        model = Module
        fields = ["id", "nom", "total_hours", "assigned_hours", "semestre", "v_h_hebdo", "seances"]

    def get_total_hours(self, obj):
        # 12 weeks * weekly hours
        vh = self.get_v_h_hebdo(obj)
        return 12 * vh

    def get_assigned_hours(self, obj):
        if hasattr(obj, 'prefetched_assigned_minutes'):
            return obj.prefetched_assigned_minutes / 60
        return sum(s.duree for s in obj.sceances.all()) / 60

    def _get_comporte(self, obj):
        filiere_id = self.context.get('filiere_id')
        if not filiere_id: return None
        if hasattr(obj, 'prefetched_comportes'):
            for c in obj.prefetched_comportes:
                if c.filiere_id == filiere_id: return c
        return Comporte.objects.filter(filiere_id=filiere_id, module=obj).first()

    def get_semestre(self, obj):
        c = self._get_comporte(obj)
        return c.semestre if c else None

    def get_v_h_hebdo(self, obj):
        c = self._get_comporte(obj)
        return c.v_h_hebdo if c else 0

class FiliereDetailSerializer(serializers.ModelSerializer):
    modules = serializers.SerializerMethodField()
    niveaux_display = serializers.CharField(source="get_niveaux_display", read_only=True)
    
    class Meta:
        model = Filiere
        fields = ["id", "nom", "description", "niveaux", "niveaux_display", "modules"]

    def get_modules(self, obj):
        # Use prefetched modules and comporta data
        modules = list(obj.modules.all())
        comportes = list(obj.comporte_set.all())
        for m in modules:
            m.prefetched_comportes = [c for c in comportes if c.module_id == m.id]
            m.prefetched_assigned_minutes = sum(s.duree for s in m.sceances.all())
        return ModuleDetailSerializer(modules, many=True, context={'filiere_id': obj.id}).data


# In your views.py
from rest_framework.generics import CreateAPIView, ListAPIView


from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
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

class DashboardStatsView(APIView):
    def get(self, request):
        from .models import Filiere, Module, Sceance, Local
        from users.models import Enseignant
        from django.db.models import Sum, Count
        
        total_filieres = Filiere.objects.count()
        total_modules = Module.objects.count()
        total_profs = Enseignant.objects.count()
        total_rooms = Local.objects.count()
        
        # Total volume in hours
        total_minutes = Sceance.objects.aggregate(Sum('duree'))['duree__sum'] or 0
        total_hours = total_minutes // 60
        
        # Breakdown by type
        breakdown = Sceance.objects.values('type').annotate(count=Count('id'))
        total_sceances = sum(item['count'] for item in breakdown)
        
        type_stats = {
            'CM': 0, 'TD': 0, 'TP': 0
        }
        if total_sceances > 0:
            for item in breakdown:
                type_stats[item['type']] = round((item['count'] / total_sceances) * 100)

        # Recent filieres
        filieres_data = []
        for f in Filiere.objects.all()[:5]:
            # Simple aggregation for hours per filiere
            f_minutes = Sceance.objects.filter(module__filieres=f).aggregate(Sum('duree'))['duree__sum'] or 0
            filieres_data.append({
                'name': f.nom,
                'level': f.get_niveaux_display(),
                'totalHours': f_minutes // 60,
                'status': 'Validated' # Placeholder for now
            })

        return Response({
            'total_filieres': total_filieres,
            'total_modules': total_modules,
            'total_profs': total_profs,
            'total_rooms': total_rooms,
            'total_hours': total_hours,
            'type_stats': type_stats,
            'filieres': filieres_data,
            'avg_workload': (total_hours // total_profs) if total_profs > 0 else 0
        })

class MyAssignmentsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from users.models import Utilisateur
        from .models import Sceance
        from django.db.models import Sum

        user = request.user
        # Treat anyone with a department as a teacher for this view
        if not user.departement:
            return Response({'error': 'User is not assigned to a department'}, status=403)
        
        prof = user
        
        # Total assigned hours
        total_minutes = prof.sceances.aggregate(Sum('duree'))['duree__sum'] or 0
        total_hours = total_minutes // 60
        
        # Group assignments by module and type
        assignments = []
        sceances_summary = prof.sceances.values('module__id', 'module__nom', 'type').annotate(total_minutes=Sum('duree'))
        
        for item in sceances_summary:
            mod_id = item['module__id']
            mod_nom = item['module__nom']
            s_type = item['type']
            mod_minutes = item['total_minutes'] or 0
            
            # Find a representative session to get location/students (mocked for now as we don't have students field)
            first_sceance = prof.sceances.filter(module_id=mod_id, type=s_type).first()
            
            if mod_minutes > 0:
                assignments.append({
                    'id': f"m{mod_id}-{s_type}",
                    'code': f"MOD{mod_id}",
                    'name': mod_nom,
                    'type': s_type,
                    'hours': mod_minutes // 60,
                    'students': 'Calculated', # Placeholder
                    'location': str(first_sceance.local) if first_sceance else 'N/A'
                })

        return Response({
            'total_hours': total_hours,
            'statutory_requirement': 192,
            'overload': max(0, total_hours - 192),
            'breakdown': {
                'CM': prof.sceances.filter(type='CM').aggregate(Sum('duree'))['duree__sum'] // 60 if prof.sceances.filter(type='CM').exists() else 0,
                'TD': prof.sceances.filter(type='TD').aggregate(Sum('duree'))['duree__sum'] // 60 if prof.sceances.filter(type='TD').exists() else 0,
                'TP': prof.sceances.filter(type='TP').aggregate(Sum('duree'))['duree__sum'] // 60 if prof.sceances.filter(type='TP').exists() else 0,
            },
            'assignments': assignments
        })

class FacultyAssignmentListView(APIView):
    def get(self, request):
        from users.models import Enseignant
        from .models import Module, Sceance
        from django.db.models import Sum, Count
        
        faculty = Enseignant.objects.all().prefetch_related('modules', 'sceances')
        data = []
        
        for prof in faculty:
            # Total assigned hours
            total_minutes = prof.sceances.aggregate(Sum('duree'))['duree__sum'] or 0
            workload = total_minutes // 60
            
            # Group assignments by module and type
            assignments = []
            sceances_summary = prof.sceances.values('module__id', 'module__nom', 'type').annotate(total_minutes=Sum('duree'))
            
            for item in sceances_summary:
                mod_id = item['module__id']
                mod_nom = item['module__nom']
                s_type = item['type']
                mod_minutes = item['total_minutes'] or 0
                
                if mod_minutes > 0:
                    assignments.append({
                        'id': f"m{mod_id}-{s_type}",
                        'moduleCode': f"MOD{mod_id}",
                        'moduleName': mod_nom,
                        'type': s_type,
                        'hours': mod_minutes // 60
                    })

            data.append({
                'id': str(prof.id),
                'name': str(prof),
                'department': prof.departement.nom if prof.departement else 'N/A',
                'title': 'Professeur',
                'workload': workload,
                'maxWorkload': 336,
                'isOverloaded': workload > 336,
                'assignments': assignments,
                'initials': "".join([n[0] for n in str(prof).split() if n]).upper()[:2]
            })

        return Response(data)

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
        queryset = Sceance.objects.all().select_related('module', 'enseignant', 'local')
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        filiere_id = self.request.query_params.get('filiere')
        semester = self.request.query_params.get('semester')
        mine = self.request.query_params.get('mine')

        if mine == 'true' and self.request.user.is_authenticated:
            queryset = queryset.filter(enseignant=self.request.user)

        if start_date and end_date:
            queryset = queryset.filter(date__range=[start_date, end_date])

        if filiere_id:
            queryset = queryset.filter(module__filieres__id=filiere_id)

        if semester:
            queryset = queryset.filter(module__comporte__semestre=semester, module__comporte__filiere_id=filiere_id)

        return queryset

    def create(self, request, *args, **kwargs):
        module_id = request.data.get('module')
        filiere_id = request.query_params.get('filiere') # Or from elsewhere
        initial_date_str = request.data.get('date')
        
        # Validation: Ensure session date matches module semester period
        if module_id and initial_date_str:
            from .models import SemesterPeriod, Comporte
            from datetime import datetime
            
            # Find the semester for this module in the filiere
            comporte = Comporte.objects.filter(module_id=module_id).first()
            if comporte:
                period = SemesterPeriod.objects.filter(semester=comporte.semestre).first()
                if period:
                    session_date = datetime.strptime(initial_date_str, '%Y-%m-%d').date()
                    if session_date < period.date_debut or session_date > period.date_fin:
                        return Response(
                            {"error": f"Cette date ({initial_date_str}) n'est pas comprise dans la période du {period.get_semester_display()} ({period.date_debut} à {period.date_fin})."},
                            status=status.HTTP_400_BAD_REQUEST
                        )

        number_of_sessions = int(request.data.get('number_of_sessions', 1))
        initial_date_str = request.data.get('date')
        if not initial_date_str:
            return Response({"error": "Date is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        from datetime import datetime, timedelta
        current_date = datetime.strptime(initial_date_str, '%Y-%m-%d').date()
        
        enseignant_id = request.data.get('enseignant')
        local_id = request.data.get('local')
        heure_debut_str = request.data.get('heure_debut')
        duree = int(request.data.get('duree', 0))
        
        if not heure_debut_str:
            return Response({"error": "Start time (heure_debut) is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        heure_debut = datetime.strptime(heure_debut_str, '%H:%M').time()
        
        created_sessions = []
        
        while len(created_sessions) < number_of_sessions:
            # Check for vacations and increment week if necessary
            on_vacation = Vacation.objects.filter(
                (models.Q(is_global=True) | models.Q(enseignant_id=enseignant_id if enseignant_id else None)),
                date_debut__lte=current_date,
                date_fin__gte=current_date
            ).exists()
            
            if on_vacation:
                current_date += timedelta(days=7)
                continue
            
            # Check for local conflicts
            start_dt = datetime.combine(current_date, heure_debut)
            end_dt = start_dt + timedelta(minutes=duree)
            
            # Find overlapping sessions in the same local
            existing_sessions = Sceance.objects.filter(date=current_date, local_id=local_id)
            conflict = False
            for sess in existing_sessions:
                if not sess.heure_debut: continue
                s_start = datetime.combine(sess.date, sess.heure_debut)
                s_end = s_start + timedelta(minutes=sess.duree)
                
                if (start_dt < s_end) and (s_start < end_dt):
                    conflict = True
                    break
            
            if conflict:
                current_date += timedelta(days=7)
                continue 
            
            # Create session
            data = request.data.copy()
            data['date'] = current_date.strftime('%Y-%m-%d')
            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            session = serializer.save()
            created_sessions.append(serializer.data)
            
            # Increment for next session
            current_date += timedelta(days=7)

        return Response(created_sessions, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        date_str = request.data.get('date', instance.date.strftime('%Y-%m-%d'))
        heure_debut_str = request.data.get('heure_debut', instance.heure_debut.strftime('%H:%M') if instance.heure_debut else None)
        duree = int(request.data.get('duree', instance.duree))
        local_id = request.data.get('local', instance.local_id)
        enseignant_id = request.data.get('enseignant', instance.enseignant_id)

        from datetime import datetime, timedelta
        current_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        heure_debut = datetime.strptime(heure_debut_str, '%H:%M').time() if heure_debut_str else None

        # 1. Vacation Check
        vacation_filter = models.Q(is_global=True)
        if enseignant_id:
            vacation_filter |= models.Q(enseignant_id=enseignant_id)
            
        on_vacation = Vacation.objects.filter(
            vacation_filter,
            date_debut__lte=current_date,
            date_fin__gte=current_date
        ).exists()
        
        if on_vacation:
            return Response({"error": "L'enseignant est en congé ou c'est un jour férié à cette date."}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Conflict Check
        if heure_debut:
            start_dt = datetime.combine(current_date, heure_debut)
            end_dt = start_dt + timedelta(minutes=duree)
            
            # Exclude current instance from conflict check
            existing_sessions = Sceance.objects.filter(date=current_date, local_id=local_id).exclude(id=instance.id)
            for sess in existing_sessions:
                if not sess.heure_debut: continue
                s_start = datetime.combine(sess.date, sess.heure_debut)
                s_end = s_start + timedelta(minutes=sess.duree)
                
                if (start_dt < s_end) and (s_start < end_dt):
                    return Response({"error": f"Conflit de salle détecté avec une autre séance à {current_date} {heure_debut}"}, status=status.HTTP_400_BAD_REQUEST)

        return super().update(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def check_availability(self, request):
        local_id = request.query_params.get('local')
        date_str = request.query_params.get('date')
        heure_debut_str = request.query_params.get('heure_debut')
        duree = int(request.query_params.get('duree', 120))
        exclude_id = request.query_params.get('exclude_id')
        
        if not local_id or not date_str:
            return Response({"error": "Missing local or date"}, status=400)
            
        from datetime import datetime, timedelta
        date = datetime.strptime(date_str, '%Y-%m-%d').date()
        
        existing_sessions = Sceance.objects.filter(date=date, local_id=local_id)
        if exclude_id:
            existing_sessions = existing_sessions.exclude(id=exclude_id)
        
        if heure_debut_str:
            heure_debut = datetime.strptime(heure_debut_str, '%H:%M').time()
            start_dt = datetime.combine(date, heure_debut)
            end_dt = start_dt + timedelta(minutes=duree)
            
            conflicts = []
            for sess in existing_sessions:
                if not sess.heure_debut: continue
                s_start = datetime.combine(sess.date, sess.heure_debut)
                s_end = s_start + timedelta(minutes=sess.duree)
                
                if (start_dt < s_end) and (s_start < end_dt):
                    conflicts.append(sess)
            
            return Response({
                "available": len(conflicts) == 0,
                "conflicts": SceanceSerializer(conflicts, many=True).data
            })
            
        return Response({
            "available": not existing_sessions.exists(),
            "conflicts": SceanceSerializer(existing_sessions, many=True).data
        })


class GenerateScheduleView(APIView):
    def get(self, request):
        check_dates = request.query_params.get('check_dates')
        if check_dates == 'all':
            from .models import SemesterPeriod
            periods = SemesterPeriod.objects.all()
            return Response([{
                "semester": p.semester,
                "start": p.date_debut,
                "end": p.date_fin
            } for p in periods])
        return Response({"error": "Method not allowed"}, status=405)

    def post(self, request):
        semesters_str = request.data.get('semesters', '')
        if not semesters_str:
            return Response({"error": "No semesters provided"}, status=status.HTTP_400_BAD_REQUEST)
        
        semester_codes = semesters_str.split(',')
        task = ScheduleTask.objects.create(status='RUNNING', progress=0, message="Démarrage de l'algorithme...")
        
        def bg_solver():
            try:
                success, results = run_genetic_algorithm(semester_codes, task_id=task.id)
                if success:
                    task.status = 'COMPLETED'
                    task.result_data = results
                    task.message = "Génération terminée avec succès. Veuillez confirmer l'aperçu."
                else:
                    task.status = 'FAILED'
                    task.message = results
            except Exception as e:
                task.status = 'FAILED'
                task.message = str(e)
            task.save()

        thread = threading.Thread(target=bg_solver)
        thread.start()
        return Response({"task_id": task.id, "message": "Génération démarrée"}, status=status.HTTP_202_ACCEPTED)


class ConfirmScheduleView(APIView):
    def post(self, request):
        task_id = request.data.get('task_id')
        if not task_id:
            return Response({"error": "Task ID required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            task = ScheduleTask.objects.get(id=task_id, status='COMPLETED')
            schedule = task.result_data
            semester_codes = list(set([s['semester'] for s in schedule]))
            periods = {p.semester: p for p in SemesterPeriod.objects.filter(semester__in=semester_codes)}

            from datetime import timedelta
            days_list = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']
            times = ['08:30', '10:45', '14:30', '16:45']
            days_map = {'Lundi': 0, 'Mardi': 1, 'Mercredi': 2, 'Jeudi': 3, 'Vendredi': 4}

            semester_groups = {}
            for gene in schedule:
                sem = gene['semester']
                if sem not in semester_groups: semester_groups[sem] = []
                semester_groups[sem].append(gene)

            for sem, genes in semester_groups.items():
                if sem not in periods: continue
                period = periods[sem]
                
                # Delete existing sessions in this period for these semesters
                Sceance.objects.filter(module__comporte__semestre=sem, date__range=[period.date_debut, period.date_fin]).delete()

                for gene in genes:
                    slot_idx = gene['slot']
                    day_name = days_list[slot_idx // 4]
                    target_day_of_week = days_map[day_name]
                    
                    # Find the first valid date for this specific session
                    # Start from period.date_debut and find the first occurrence of target_day_of_week
                    curr_date = period.date_debut
                    while curr_date.weekday() != target_day_of_week:
                        curr_date += timedelta(days=1)
                    
                    sessions_created = 0
                    while sessions_created < 12:
                        # Check if the week containing curr_date is blocked
                        # Find the Monday of the week curr_date is in
                        monday_of_week = curr_date - timedelta(days=curr_date.weekday())
                        is_blocked = Vacation.objects.filter(
                            is_global=True, 
                            date_debut__lte=monday_of_week + timedelta(days=6), 
                            date_fin__gte=monday_of_week
                        ).count() >= 3
                        
                        if not is_blocked:
                            Sceance.objects.create(
                                type=gene.get('type', 'CM'), 
                                duree=120, 
                                date=curr_date, 
                                heure_debut=times[slot_idx % 4], 
                                module_id=gene['module_id'], 
                                enseignant_id=gene['teacher_id'], 
                                local_id=gene['room_id']
                            )
                            sessions_created += 1
                        
                        curr_date += timedelta(days=7)

            return Response({"message": "Emploi du temps enregistré avec succès !"}, status=status.HTTP_200_OK)
        except ScheduleTask.DoesNotExist:
            return Response({"error": "Task not found"}, status=status.HTTP_404_NOT_FOUND)


class TaskStatusView(APIView):
    def get(self, request, task_id):
        try:
            task = ScheduleTask.objects.get(id=task_id)
            return Response({
                "id": task.id,
                "status": task.status,
                "progress": task.progress,
                "message": task.message
            }, status=status.HTTP_200_OK)
        except ScheduleTask.DoesNotExist:
            return Response({"error": "Task not found"}, status=status.HTTP_404_NOT_FOUND)


class ModuleListView(ListAPIView):
    queryset = Module.objects.all()
    serializer_class = ModuleSerializer


class FiliereDetailListView(ListAPIView):
    queryset = Filiere.objects.all().prefetch_related(
        'modules__sceances__enseignant',
        'modules__sceances__local',
        'comporte_set'
    )
    serializer_class = FiliereDetailSerializer
