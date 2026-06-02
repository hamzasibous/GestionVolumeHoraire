from rest_framework import serializers
from .models import Simulation, SceanceSimulee

class SimulationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Simulation
        fields = [
            'id', 'nomScenario', 'anneeCible', 'estValide', 
            'utiliser_donnees_actuelles', 'utiliser_moyenne_departement',
            'nb_filieres_ajoutees', 'nb_nouveaux_cours', 'nb_profs_ajoutes', 
            'nb_locaux_ajoutes', 'croissance_etudiante_pct', 'strategie_traitement',
            'volume_actuel', 'volume_total_prevu', 'moyenne_charge_actuelle', 
            'moyenne_charge_prevue', 'deficit_horaire', 'nb_vacataires_estimes',
            'result_data', 'progress', 'message', 'status', 'created_at'
        ]

class SceanceSimuleeSerializer(serializers.ModelSerializer):
    class Meta:
        model = SceanceSimulee
        fields = '__all__'
