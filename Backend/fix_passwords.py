import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vh_backend.settings')
django.setup()

from users.models import Utilisateur

print("Checking for unhashed passwords...")
count = 0
for u in Utilisateur.objects.all():
    # Django hashes typically start with the algorithm name followed by $
    if not u.password.startswith(('pbkdf2_sha256$', 'pbkdf2_sha1$', 'argon2$', 'bcrypt$', 'bcrypt_sha256$', 'crypt$', 'md5$', 'unsalted_md5$', 'unsalted_sha1$', 'pkcs12$')):
        print(f"Hashing password for user: {u.email}")
        raw_password = u.password
        u.set_password(raw_password)
        u.save()
        count += 1

print(f"Finished. Fixed {count} passwords.")
