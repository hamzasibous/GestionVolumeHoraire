import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vh_backend.settings')
django.setup()

from users.models import Utilisateur, Enseignant

print("--- Utilisateurs ---")
for u in Utilisateur.objects.all():
    print(f"ID: {u.id}, Email: {u.email}, Role: {u.role}, Active: {u.is_active}, Password: {u.password[:20]}...")

print("\n--- Enseignants ---")
for e in Enseignant.objects.all():
    print(f"ID: {e.id}, Email: {e.email}, Dept: {e.departement}")
