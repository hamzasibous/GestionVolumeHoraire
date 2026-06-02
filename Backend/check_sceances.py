import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vh_backend.settings')
django.setup()

from core.models import Sceance
from users.models import Utilisateur
from django.db.models import Count, Sum

print("--- Sceance Distribution ---")
sceances = Sceance.objects.all()
print(f"Total Sceances: {sceances.count()}")

assigned = sceances.exclude(enseignant=None)
print(f"Assigned Sceances: {assigned.count()}")

unassigned = sceances.filter(enseignant=None)
print(f"Unassigned Sceances: {unassigned.count()}")

if assigned.exists():
    print("\n--- Top Teachers by Sceance Count ---")
    summary = assigned.values('enseignant__email', 'enseignant__id').annotate(count=Count('id'), total_h=Sum('duree')).order_by('-count')[:10]
    for item in summary:
        print(f"ID: {item['enseignant__id']}, Email: {item['enseignant__email']}, Count: {item['count']}, Total Min: {item['total_h']}")
else:
    print("\nNo sceances are assigned to any teacher!")
