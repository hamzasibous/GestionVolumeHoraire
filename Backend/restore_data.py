import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vh_backend.settings')
django.setup()

from users.models import Utilisateur, Role
from core.models import Departement

# 1. Re-assign everyone to the main department
dept, _ = Departement.objects.get_or_create(nom="Département d'Informatique")
print(f"Using department: {dept.nom}")

users = Utilisateur.objects.all()
count = 0
for u in users:
    if not u.departement:
        u.departement = dept
        u.save()
        count += 1
print(f"Re-assigned {count} users to department.")

# 2. Re-create the Admin if missing
if not Utilisateur.objects.filter(email="admin@edu.umi.ac.ma").exists():
    print("Re-creating Admin account...")
    admin = Utilisateur.objects.create_superuser(
        email="admin@edu.umi.ac.ma",
        password="admin_password",
        nom="Admin",
        prenom="System"
    )
    admin.departement = dept
    admin.save()
    print("Admin recreated and assigned to department.")
else:
    admin = Utilisateur.objects.get(email="admin@edu.umi.ac.ma")
    if not admin.departement:
        admin.departement = dept
        admin.save()
        print("Existing admin assigned to department.")
