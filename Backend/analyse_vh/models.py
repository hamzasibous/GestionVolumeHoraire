from django.db import models
from core.models import TypeSceance, Module, Local
from users.models import Enseignant

class StrategieTraitement(models.TextChoices):
    EQUITE = "EQUITE", "Équité (Charge équilibrée)"
    JUNIOR = "JUNIOR", "Junior (Priorité TD/TP)"
    SENIOR = "SENIOR", "Senior (Priorité CM)"
    ALLEGEMENT = "ALLEGEMENT", "Allégement (Réduction de charge globale)"

class Simulation(models.Model):
    nomScenario = models.CharField(max_length=100)
    anneeCible = models.IntegerField()
    estValide = models.BooleanField(default=False)
    
    # Paramètres de calcul (Toggles)
    utiliser_donnees_actuelles = models.BooleanField(default=True)
    utiliser_moyenne_departement = models.BooleanField(default=False)
    
    # Paramètres d'évolution
    nb_filieres_ajoutees = models.PositiveIntegerField(default=0)
    nb_nouveaux_cours = models.PositiveIntegerField(default=0)
    nb_profs_ajoutes = models.PositiveIntegerField(default=0)
    nb_locaux_ajoutes = models.PositiveIntegerField(default=0)
    croissance_etudiante_pct = models.FloatField(default=0.0)
    
    strategie_traitement = models.CharField(
        max_length=20, 
        choices=StrategieTraitement.choices, 
        default=StrategieTraitement.EQUITE
    )
    
    # Résultats calculés
    volume_actuel = models.IntegerField(default=0)
    volume_total_prevu = models.IntegerField(default=0)
    moyenne_charge_actuelle = models.FloatField(default=0.0)
    moyenne_charge_prevue = models.FloatField(default=0.0)
    deficit_horaire = models.IntegerField(default=0)
    nb_vacataires_estimes = models.FloatField(default=0.0)
    
    # Emploi du temps simulé
    result_data = models.JSONField(blank=True, null=True)
    
    # Suivi de progression
    progress = models.IntegerField(default=0)
    message = models.CharField(max_length=255, default="Prêt")
    status = models.CharField(max_length=20, default='PENDING') # PENDING, RUNNING, COMPLETED, FAILED
    
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    def __str__(self):
        return f"{self.nomScenario} ({self.anneeCible})"

class SceanceSimulee(models.Model):
    simulation = models.ForeignKey(Simulation, on_delete=models.CASCADE, related_name="sceances_simulees")
    type = models.CharField(max_length=10, choices=TypeSceance.choices)
    duree = models.IntegerField()
    date = models.DateField()
    volumeActuel = models.IntegerField()
    volumePrevu = models.IntegerField()
    variation = models.IntegerField()
    
    # Associations from diagram
    enseignant = models.ForeignKey(Enseignant, on_delete=models.CASCADE, related_name="sceances_simulees")
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name="sceances_simulees")
    local = models.ForeignKey(Local, on_delete=models.SET_NULL, null=True, blank=True, related_name="sceances_simulees")

    def __str__(self):
        return f"Sim: {self.module} - {self.type}"
