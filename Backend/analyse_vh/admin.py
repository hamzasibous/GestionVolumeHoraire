from django.contrib import admin
from .models import Enseignant, Module, Sceance, Departement, Filiere # Use the names from your models.py

admin.site.register(Enseignant)
admin.site.register(Module)
admin.site.register(Sceance)
admin.site.register(Departement)
admin.site.register(Filiere)