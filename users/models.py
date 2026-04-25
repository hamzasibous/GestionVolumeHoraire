from django.db import models


class Utilisateur(models.Model):
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    tel = models.CharField(max_length=20, blank=True, null=True)
    motDePasse = models.CharField(max_length=128)

    def __str__(self):
        return f"{self.prenom} {self.nom}"

    def connecter(self, email, motDePasse):
        return ""
