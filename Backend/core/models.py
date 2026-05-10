from django.db import models

from users.models import Utilisateur

# the core models of the application


class Departement(models.Model):
    nom = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.nom}"


class Local(models.Model):
    bloc = models.CharField(max_length=100)
    numero = models.IntegerField()
    capacite = models.IntegerField()

    def __str__(self):
        return f"{self.numero}.{self.numero}"


class Filiere(models.Model):
    class niveaux(models.TextChoices):
        COURS = "License"
        TD = "Master"
        TP = "Doctorat"

    niveau = models.CharField(max_length=10, choices=niveaux.choices)
    nom = models.CharField(max_length=100)
    departement = models.ForeignKey(Departement, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.nom}"

    def get_modules(self):
        return self.modules.all()

    def getDepartement(self):
        return self.departement


class Module(models.Model):
    nom = models.CharField(max_length=100)
    semestre = models.IntegerField()
    filiere = models.ForeignKey(
        Filiere, on_delete=models.CASCADE, related_name="modules"
    )

    def __str__(self):
        return f"{self.nom}"


class Enseignant(Utilisateur):
    departement = models.ForeignKey(
        Departement, on_delete=models.CASCADE, related_name="enseignants"
    )
    is_chef_departement = models.BooleanField(default=False)

    def __str__(self) -> str:
        return f"{self.departement} / Pr.{self.nom}"


class Sceance(models.Model):

    class Type(models.TextChoices):
        COURS = "CM", "Cours"
        TD = "TD", "TD"
        TP = "TP", "TP"

    type = models.CharField(max_length=50, choices=Type.choices)
    duration = models.IntegerField()
    nombre_sceances = models.IntegerField()
    module = models.ForeignKey(
        Module, on_delete=models.CASCADE, related_name="sceances"
    )
    local = models.ForeignKey(Local, on_delete=models.CASCADE, related_name="sceances")
    enseignant = models.ForeignKey(
        Enseignant, on_delete=models.CASCADE, related_name="sceances"
    )

    def __str__(self) -> str:
        return f"{self.module}/{self.type}"
