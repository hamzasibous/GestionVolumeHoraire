import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vh_backend.settings')
django.setup()

from users.models import Utilisateur
from core.models import Departement

admin = Utilisateur.objects.get(id=1)
dept = Departement.objects.first()

if admin and dept:
    print(f"Assigning {admin.email} to {dept.nom}")
    admin.departement = dept
    admin.save()
    print("Success.")
else:
    print("Could not find admin or department.")
