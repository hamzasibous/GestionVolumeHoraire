from django.db import models


class Role(models.TextChoices):
    ADMIN = "ADMIN", "Administrateur"
    CHEF_DEPARTEMENT = "CHEF_DEPARTEMENT", "Chef de Département"
    ENSEIGNANT = "ENSEIGNANT", "Enseignant"


class Utilisateur(models.Model):
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    tel = models.CharField(max_length=20, blank=True, null=True)
    motDePasse = models.CharField(max_length=128)
    role = models.CharField(
        max_length=20, choices=Role.choices, default=Role.ENSEIGNANT
    )

    def __str__(self):
        return f"{self.prenom} {self.nom}"


class Enseignant(Utilisateur):
    departement = models.ForeignKey(
        "core.Departement", on_delete=models.CASCADE, related_name="enseignants_list"
    )
    modules = models.ManyToManyField(
        "core.Module", related_name="enseignants_habilites", blank=True
    )

    def __str__(self):
        return f"Pr. {self.nom} {self.prenom}"


class Administrateur(Utilisateur):
    def save(self, *args, **kwargs):
        self.role = Role.ADMIN
        super().save(*args, **kwargs)


class ChefDepartement(Enseignant):
    def save(self, *args, **kwargs):
        self.role = Role.CHEF_DEPARTEMENT
        super().save(*args, **kwargs)
