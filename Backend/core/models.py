from django.db import models
from users.models import Enseignant

class ScheduleTask(models.Model):
    status = models.CharField(max_length=20, default='PENDING') # PENDING, RUNNING, COMPLETED, FAILED, CANCELLED
    progress = models.IntegerField(default=0) # 0 to 100
    message = models.TextField(blank=True, null=True)
    result_data = models.JSONField(blank=True, null=True) # Stores the master week schedule
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Task {self.id}: {self.status} ({self.progress}%)"

class Niveaux(models.TextChoices):
    LICENCE_F = "Licence_f", "Licence Fondamontale"
    LICENCE_E = "Licence_e", "Licence Excellence"
    LICENCE_T = "Licence_t", "Licence temps amenagé"
    MASTER_F = "Master_f", "Master Fondamontale"
    MASTER_E = "Master_e", "Master Excellence"
    MASTER_T = "Master_t", "Master temps amenagé"


class TypeSceance(models.TextChoices):
    CM = "CM", "Cours Magistral"
    TD = "TD", "Travaux Dirigés"
    TP = "TP", "Travaux Pratiques"


class Semester(models.TextChoices):
    S1 = "S1", "Semestre 1"
    S2 = "S2", "Semestre 2"
    S3 = "S3", "Semestre 3"
    S4 = "S4", "Semestre 4"
    S5 = "S5", "Semestre 5"
    S6 = "S6", "Semestre 6"
    M1 = "M1", "Semestre 7 (M1)"
    M2 = "M2", "Semestre 8 (M2)"
    M3 = "M3", "Semestre 9 (M3)"
    M4 = "M4", "Semestre 10 (M4)"


class SemesterPeriod(models.Model):
    semester = models.CharField(max_length=10, choices=Semester.choices, unique=True)
    date_debut = models.DateField()
    date_fin = models.DateField()

    def __str__(self):
        return f"{self.get_semester_display()}: {self.date_debut} to {self.date_fin}"


class Departement(models.Model):
    nom = models.CharField(max_length=100)
    chef = models.OneToOneField(
        "users.ChefDepartement",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="departement_gere",
    )

    def __str__(self):
        return self.nom


class Local(models.Model):
    bloc = models.CharField(max_length=100)
    numero = models.CharField(max_length=100)
    capacite = models.IntegerField()
    is_amphi = models.BooleanField(default=False)
    departement = models.ForeignKey(
        Departement,
        on_delete=models.CASCADE,
        related_name="locaux",
        null=True,
        blank=True,
    )

    def __str__(self):
        return f"{self.bloc}.{self.numero}"


class Filiere(models.Model):
    nom = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    niveaux = models.CharField(max_length=20, choices=Niveaux.choices)
    departement = models.ForeignKey(
        Departement, on_delete=models.CASCADE, related_name="filieres"
    )
    modules = models.ManyToManyField(
        "Module", through="Comporte", related_name="filieres"
    )

    def __str__(self):
        return self.nom


class Module(models.Model):
    nom = models.CharField(max_length=100)

    def __str__(self):
        return self.nom


class Comporte(models.Model):
    filiere = models.ForeignKey(Filiere, on_delete=models.CASCADE)
    module = models.ForeignKey(Module, on_delete=models.CASCADE)
    semestre = models.CharField(max_length=50, choices=Semester.choices)
    v_h_hebdo = models.IntegerField(default=2) # Weekly hours (e.g., 2 or 4)

    class Meta:
        unique_together = ("filiere", "module")


class Sceance(models.Model):
    type = models.CharField(max_length=10, choices=TypeSceance.choices)
    duree = models.IntegerField()  # In minutes
    date = models.DateField()
    heure_debut = models.TimeField(null=True, blank=True)
    module = models.ForeignKey(
        Module, on_delete=models.CASCADE, related_name="sceances"
    )
    enseignant = models.ForeignKey(
        "users.Utilisateur", on_delete=models.CASCADE, related_name="sceances",
        null=True, blank=True
    )
    local = models.ForeignKey(Local, on_delete=models.CASCADE, related_name="sceances")

    def __str__(self):
        return f"{self.module} - {self.type} ({self.date})"


class Vacation(models.Model):
    enseignant = models.ForeignKey(
        "users.Utilisateur", on_delete=models.CASCADE, related_name="vacations",
        null=True, blank=True
    )
    titre = models.CharField(max_length=200, blank=True, null=True)
    date_debut = models.DateField()
    date_fin = models.DateField()
    type_conge = models.CharField(max_length=100)
    statut = models.CharField(max_length=20, default="Pending")
    is_global = models.BooleanField(default=False)

    def __str__(self):
        if self.is_global:
            return f"Global Holiday: {self.titre or self.type_conge}"
        return f"Vacation for {self.enseignant} ({self.date_debut} to {self.date_fin})"
