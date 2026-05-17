from django.db import models
from core.models import TypeSceance, Module, Local
from users.models import Enseignant

class Simulation(models.Model):
    nomScenario = models.CharField(max_length=100)
    anneeCible = models.IntegerField()
    estValide = models.BooleanField(default=False)
    utiliserVolumesActuels = models.BooleanField(default=True)
    utiliserMoyenneDepartement = models.BooleanField(default=False)
    inclureNouvellesFilieres = models.BooleanField(default=False)
    inclureNouveauxModules = models.BooleanField(default=False)
    volumeTotalPrevu = models.IntegerField(default=0)
    tauxEvolutionGlobal = models.FloatField(default=0.0)

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
