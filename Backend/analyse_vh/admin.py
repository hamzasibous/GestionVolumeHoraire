from django.contrib import admin
from core.models import Enseignant, Module, Sceance, Departement, Filiere

admin.site.register(Enseignant)
admin.site.register(Module)
admin.site.register(Sceance)
admin.site.register(Departement)
admin.site.register(Filiere)