from django.db import models
from users.models import Enseignant


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
    S1_L = "S1_l"


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
    numero = models.IntegerField()
    capacite = models.IntegerField()
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

    class Meta:
        unique_together = ("filiere", "module")


class Sceance(models.Model):
    type = models.CharField(max_length=10, choices=TypeSceance.choices)
    duree = models.IntegerField()  # In minutes or hours
    date = models.DateField()
    module = models.ForeignKey(
        Module, on_delete=models.CASCADE, related_name="sceances"
    )
    enseignant = models.ForeignKey(
        Enseignant, on_delete=models.CASCADE, related_name="sceances"
    )
    local = models.ForeignKey(Local, on_delete=models.CASCADE, related_name="sceances")

    def __str__(self):
        return f"{self.module} - {self.type} ({self.date})"
