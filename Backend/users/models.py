from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin


class Role(models.TextChoices):
    ADMIN = "ADMIN", "Administrateur"
    CHEF_DEPARTEMENT = "CHEF_DEPARTEMENT", "Chef de Département"
    ENSEIGNANT = "ENSEIGNANT", "Enseignant"


class UtilisateurManager(BaseUserManager):
    def create_user(self, email, nom, prenom, password=None, **extra_fields):
        if not email:
            raise ValueError("L'adresse email est obligatoire")
        email = self.normalize_email(email)
        user = self.model(email=email, nom=nom, prenom=prenom, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, nom, prenom, password=None, **extra_fields):
        extra_fields.setdefault("role", Role.ADMIN)
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, nom, prenom, password, **extra_fields)


class Utilisateur(AbstractBaseUser, PermissionsMixin):
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    tel = models.CharField(max_length=20, blank=True, null=True)
    role = models.CharField(
        max_length=20, choices=Role.choices, default=Role.ENSEIGNANT
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UtilisateurManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["nom", "prenom"]

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
