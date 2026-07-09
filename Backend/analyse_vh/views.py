import threading
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Sum, Avg
from .models import Simulation, SceanceSimulee, StrategieTraitement
from .serializers import SimulationSerializer
from .solver_sim import run_simulation_timetable
from core.models import Sceance, Filiere, Module, Comporte
from users.models import Enseignant

class SimulationViewSet(viewsets.ModelViewSet):
    queryset = Simulation.objects.all().order_by('-created_at')
    serializer_class = SimulationSerializer

    @action(detail=False, methods=['get'])
    def get_personal_forecast(self, request):
        # 1. Get current user's teacher record
        teacher_id = request.user.id
        
        # 2. Find latest completed simulation
        latest_sim = Simulation.objects.filter(status='COMPLETED').order_by('-created_at').first()
        
        if not latest_sim:
            return Response({
                "forecasted_hours": 0, 
                "completed": False,
                "message": "Aucune simulation disponible."
            })

        if not latest_sim.result_data:
            return Response({
                "forecasted_hours": 0, 
                "completed": False,
                "message": "Simulation incomplète."
            })

        # 3. Calculate hours from result_data
        # result_data is a list of sessions for ONE master week
        personal_sessions = [s for s in latest_sim.result_data if s.get('teacher_id') == teacher_id]
        
        # Calculation: (Number of 2h sessions) * 2h * 14 weeks = Total Semester Volume
        forecasted_hours = len(personal_sessions) * 2 * 14

        return Response({
            "forecasted_hours": forecasted_hours,
            "target_year": latest_sim.anneeCible,
            "scenario": latest_sim.nomScenario,
            "completed": True,
            "session_count": len(personal_sessions)
        })

    def perform_create(self, serializer):
        instance = serializer.save()
        # Start simulation in a background thread
        thread = threading.Thread(target=self._run_simulation_thread, args=(instance.id,))
        thread.start()

    @action(detail=True, methods=['post'])
    def run(self, request, pk=None):
        simulation = self.get_object()
        simulation.status = 'PENDING'
        simulation.progress = 0
        simulation.message = "Redémarrage de la simulation..."
        simulation.save()
        thread = threading.Thread(target=self._run_simulation_thread, args=(simulation.id,))
        thread.start()
        return Response(SimulationSerializer(simulation).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        simulation = self.get_object()
        if simulation.status == 'RUNNING':
            simulation.status = 'CANCELLED'
            simulation.message = "Annulation demandée..."
            simulation.save()
            return Response({"message": "Simulation annulée"}, status=status.HTTP_200_OK)
        return Response({"error": "Simulation non active"}, status=status.HTTP_400_BAD_REQUEST)

    def _run_simulation_thread(self, sim_id):
        from .models import Simulation
        from django import db
        sim = Simulation.objects.get(id=sim_id)
        sim.status = 'RUNNING'
        sim.save()
        
        try:
            self._run_simulation_logic(sim)
            # Re-check status because it might have been cancelled during logic
            sim.refresh_from_db()
            if sim.status != 'CANCELLED':
                sim.status = 'COMPLETED'
                sim.message = "Simulation terminée avec succès !"
                sim.progress = 100
                sim.save()
        except Exception as e:
            import traceback
            traceback.print_exc() # Print to docker logs
            if str(e) == "CANCELLATION_REQUESTED":
                sim.status = 'CANCELLED'
                sim.message = "Simulation annulée par l'utilisateur."
            else:
                sim.status = 'FAILED'
                sim.message = f"Erreur: {str(e)}"
            sim.save()
        finally:
            db.connections.close_all() # Ensure connections are released

    def _run_simulation_logic(self, sim):
        from .models import Simulation
        # 1. Base Volume (Current year)
        if sim.utiliser_donnees_actuelles:
            total_eqtd_minutes = 0
            # Exclude PFE from calculation
            for s in Sceance.objects.exclude(module__nom__icontains='pfe').exclude(module__nom__icontains='projet de fin').only('type', 'duree'):
                if s.type == 'CM':
                    total_eqtd_minutes += s.duree * 1.5
                elif s.type == 'TP':
                    total_eqtd_minutes += s.duree * 0.75
                else:
                    total_eqtd_minutes += s.duree * 1.0
            base_hours = total_eqtd_minutes / 60.0
        else:
            programmed_eqtd = 0
            # Exclude PFE from calculation
            for cp in Comporte.objects.exclude(module__nom__icontains='pfe').exclude(module__nom__icontains='projet de fin').only('v_h_hebdo'):
                if cp.v_h_hebdo >= 4:
                    programmed_eqtd += 4.75
                else:
                    programmed_eqtd += 3.0
            base_hours = programmed_eqtd * 14.0
        
        # 2. Current Capacity & Averages
        existing_profs = Enseignant.objects.all()
        existing_count = existing_profs.count()
        avg_current = base_hours / existing_count if existing_count > 0 else 0

        # 3. Future Needs Estimation
        # Each semester: (5 mod * 4h) + (2 mod * 2h) = 24h weekly
        # Total per semester: 24h * 14 weeks = 336h
        # Total per new filiere (6 semesters): 336h * 6 = 2016h
        new_filieres_vol = sim.nb_filieres_ajoutees * 2016
        new_courses_vol = sim.nb_nouveaux_cours * 48
        growth_impact = base_hours * 0.7 * (sim.croissance_etudiante_pct / 100.0)
        total_prevu = base_hours + new_filieres_vol + new_courses_vol + growth_impact

        # 4. New Redistribution Simulation (Capacity)
        total_profs_count = existing_count + sim.nb_profs_ajoutes
        avg_prevu = total_prevu / total_profs_count if total_profs_count > 0 else 0

        # 5. Department Averages Logic
        statutory_load = 192
        total_capacity = total_profs_count * statutory_load
        if sim.strategie_traitement == StrategieTraitement.ALLEGEMENT:
            total_capacity = total_capacity * 0.9
        
        deficit = max(0, total_prevu - total_capacity)
        vacataires = deficit / statutory_load

        # 6. Update global metrics (Save first results)
        Simulation.objects.filter(id=sim.id).update(
            volume_actuel=int(base_hours),
            volume_total_prevu=int(total_prevu),
            moyenne_charge_actuelle=round(avg_current, 2),
            moyenne_charge_prevue=round(avg_prevu, 2),
            deficit_horaire=int(deficit),
            nb_vacataires_estimes=round(vacataires, 2)
        )
        
        # 7. Generate Simulated Timetable using Progress Callback
        # Use update() inside callback to avoid overwriting fields
        def progress_callback(p, msg):
            Simulation.objects.filter(id=sim.id).update(progress=p, message=msg)

        def cancel_check():
            sim.refresh_from_db()
            return sim.status == 'CANCELLED'

        sim_results = run_simulation_timetable({
            'nb_filieres_ajoutees': sim.nb_filieres_ajoutees,
            'nb_nouveaux_cours': sim.nb_nouveaux_cours,
            'nb_profs_ajoutes': sim.nb_profs_ajoutes,
            'nb_locaux_ajoutes': sim.nb_locaux_ajoutes
        }, progress_callback=progress_callback, cancel_check=cancel_check, semester_period=sim.periode)
        
        # Final save for the result data
        sim.refresh_from_db()
        sim.result_data = sim_results
        sim.save()
