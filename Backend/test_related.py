import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vh_backend.settings')
django.setup()

from users.models import Utilisateur, Enseignant
from core.models import Sceance

u = Utilisateur.objects.get(id=3)
print(f"User: {u.email}")
try:
    print(f"Sceances via related name: {u.sceances.count()}")
except AttributeError:
    print("AttributeError: 'Utilisateur' object has no attribute 'sceances'")

e = Enseignant.objects.get(id=3)
print(f"Enseignant Proxy: {e.email}")
print(f"Sceances via proxy related name: {e.sceances.count()}")
