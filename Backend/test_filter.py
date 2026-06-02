import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vh_backend.settings')
django.setup()

from users.models import Utilisateur, Enseignant
from core.models import Sceance

u = Utilisateur.objects.get(id=3)
print(f"User: {u.email}")

# Filter Sceance by Utilisateur instance
count = Sceance.objects.filter(enseignant=u).count()
print(f"Sceances for this user: {count}")

# Filter Sceance by ID
count_id = Sceance.objects.filter(enseignant_id=u.id).count()
print(f"Sceances for this user ID: {count_id}")
