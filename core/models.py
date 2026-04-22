from django.db import models

# Create your models here.
class Departement(models.Model):
    nom = models.CharField(max_length=100)
    
    def __str__(self):
        return self.nom
    

class Utilisateur(models.Model):
    id=models.AutoField(primary_key=True)
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    tel = models.CharField(max_length=20, blank=True, null=True)
    motDePasse = models.CharField(max_length=128)
    def __str__(self):
        return f"{self.prenom} {self.nom}"

class Local(models.Model):
    id=models.AutoField(primary_key=True)
    bloc=models.CharField(max_length=100)
    numero=models.CharField(max_length=100)
    capacite=models.IntegerField()

    def __str__(self):
        return self.nom
    
class Filiere(models.Model):
    id=models.AutoField(primary_key=True)
    niveau=models.CharField(max_length=100)
    nom=models.CharField(max_length=100)
    def __str__(self):
        return self.nom
class Module(models.Model):
    id=models.AutoField(primary_key=True)
    nom=models.CharField(max_length=100)
    semestre=models.IntegerField()
    def __str__(self):
        return self.nom