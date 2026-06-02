from django.db import models
from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)


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


class Language(models.TextChoices):
    FRENCH = "fr", "Français"
    ENGLISH = "en", "English"


class Utilisateur(AbstractBaseUser, PermissionsMixin):
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    tel = models.CharField(max_length=20, blank=True, null=True)
    role = models.CharField(
        max_length=20, choices=Role.choices, default=Role.ENSEIGNANT
    )
    langue = models.CharField(
        max_length=10, choices=Language.choices, default=Language.FRENCH
    )
    photo = models.ImageField(upload_to="profiles/", null=True, blank=True)
    
    # Consolidate teacher fields into base user to allow dual roles (Admin can also teach)
    departement = models.ForeignKey(
        "core.Departement", on_delete=models.SET_NULL, null=True, blank=True, related_name="users_list"
    )
    modules = models.ManyToManyField(
        "core.Module", related_name="users_habilites", blank=True
    )
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UtilisateurManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["nom", "prenom"]

    def __str__(self):
        # Format with prefix if they have teaching duties
        if self.role == Role.ADMIN and not self.departement:
            return f"{self.prenom} {self.nom}"
        return f"Pr. {self.nom} {self.prenom}"


# Keep these as proxies or light wrappers for backward compatibility if needed, 
# but logic should transition to checking 'role' and fields on Utilisateur.
class Enseignant(Utilisateur):
    class Meta:
        proxy = True

    def __str__(self):
        return f"Pr. {self.nom} {self.prenom}"


class Administrateur(Utilisateur):
    class Meta:
        proxy = True

    def save(self, *args, **kwargs):
        self.role = Role.ADMIN
        self.is_staff = True
        super().save(*args, **kwargs)


class ChefDepartement(Utilisateur):
    class Meta:
        proxy = True

    def save(self, *args, **kwargs):
        self.role = Role.CHEF_DEPARTEMENT
        super().save(*args, **kwargs)
