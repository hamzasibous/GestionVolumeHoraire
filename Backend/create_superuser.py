import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vh_backend.settings')
django.setup()

from users.models import Utilisateur

email = "admin@edu.umi.ac.ma"
password = "admin_password"
nom = "Admin"
prenom = "System"

if not Utilisateur.objects.filter(email=email).exists():
    Utilisateur.objects.create_superuser(
        email=email,
        password=password,
        nom=nom,
        prenom=prenom
    )
    print(f"Superuser {email} created successfully.")
else:
    print(f"Superuser {email} already exists.")
