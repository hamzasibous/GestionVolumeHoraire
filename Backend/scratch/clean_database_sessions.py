import os
import sys
import django

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vh_backend.settings')
django.setup()

from core.models import Sceance
from users.models import Enseignant

# Delete all sessions
sessions_deleted, _ = Sceance.objects.all().delete()
print(f"Deleted {sessions_deleted} sessions from the database.")

# Delete dynamically created vacataires to reset clean
vacataires_deleted, _ = Enseignant.objects.filter(nom__icontains='VACATAIRE').delete()
print(f"Deleted {vacataires_deleted} virtual vacataire profiles from the database.")
