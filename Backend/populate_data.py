import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vh_backend.settings')
django.setup()

from core.models import Filiere, Module, Comporte, Departement, Niveaux, Semester, SemesterPeriod, Local
from users.models import Utilisateur, Enseignant
from datetime import date, timedelta

def populate():
    # 1. Ensure Departement exists
    dept, _ = Departement.objects.get_or_create(nom="Département d'Informatique")

    # 1a. Add Locaux (Rooms)
    # Clear existing to avoid confusion
    Local.objects.all().delete()
    
    locaux_data = []
    # Bloc 2: 2.1 to 2.6
    for i in range(1, 7):
        locaux_data.append({"bloc": "2", "numero": f"2.{i}", "capacite": 40})
    
    # Bloc 6: 6.1 to 6.6
    for i in range(1, 7):
        locaux_data.append({"bloc": "6", "numero": f"6.{i}", "capacite": 40})
        
    # Amphis
    locaux_data.append({"bloc": "Amphi", "numero": "H", "capacite": 200})
    locaux_data.append({"bloc": "Amphi", "numero": "I", "capacite": 200})

    for l in locaux_data:
        Local.objects.get_or_create(
            bloc=l["bloc"],
            numero=l["numero"],
            defaults={"capacite": l["capacite"], "departement": dept}
        )
    print(f"Added {Local.objects.count()} locaux.")

    # 1b. Define Semester Periods
    # Odd semesters (S1, S3, S5, M1, M3) start Sep 1
    # Duration: 4 months
    # Exams: 1 month
    # Even semesters (S2, S4, S6, M2, M4) start after exams
    
    start_date_autumn = date(2026, 9, 1)
    # Approx 4 months (122 days)
    end_date_autumn = date(2026, 12, 31)
    
    start_date_spring = date(2027, 2, 1) # Jan is exams
    end_date_spring = date(2027, 5, 31)

    autumn_sems = [Semester.S1, Semester.S3, Semester.S5, Semester.M1, Semester.M3]
    spring_sems = [Semester.S2, Semester.S4, Semester.S6, Semester.M2, Semester.M4]

    for sem in autumn_sems:
        SemesterPeriod.objects.update_or_create(
            semester=sem,
            defaults={'date_debut': start_date_autumn, 'date_fin': end_date_autumn}
        )
    for sem in spring_sems:
        SemesterPeriod.objects.update_or_create(
            semester=sem,
            defaults={'date_debut': start_date_spring, 'date_fin': end_date_spring}
        )

    # 2. Add Filieres
    filieres_data = [
        {"nom": "Génie Informatique", "niveaux": Niveaux.LICENCE_F, "desc": "Licence Fondamentale en Génie Informatique"},
        {"nom": "SDIA", "niveaux": Niveaux.LICENCE_E, "desc": "Licence d'Excellence en Sciences des Données et Intelligence Artificielle"},
        {"nom": "SIRO", "niveaux": Niveaux.LICENCE_E, "desc": "Licence d'Excellence en Systèmes Intelligents et Recherche Opérationnelle"},
        {"nom": "ISOC", "niveaux": Niveaux.LICENCE_E, "desc": "Licence d'Excellence Intelligence et Sécurité des Objets Connectés"},
        {"nom": "Digitalisation", "niveaux": Niveaux.LICENCE_F, "desc": "Licence en Digitalisation"},
        {"nom": "IARO", "niveaux": Niveaux.MASTER_E, "desc": "Master d'Excellence en Intelligence Artificielle et Recherche Opérationnelle"},
        {"nom": "MSDIA", "niveaux": Niveaux.MASTER_E, "desc": "Master d'Excellence en Sciences des Données et Intelligence Artificielle"},
    ]

    filiere_objs = []
    for data in filieres_data:
        obj, _ = Filiere.objects.get_or_create(
            nom=data["nom"],
            defaults={
                "description": data["desc"],
                "niveaux": data["niveaux"],
                "departement": dept
            }
        )
        filiere_objs.append(obj)

    # 3. Create enough modules and distribute them
    # We need 7 modules per semester.
    # Licence: 6 semesters * 7 = 42 modules
    # Master: 4 semesters * 7 = 28 modules
    
    # Clean up old Comporte entries to avoid conflicts
    Comporte.objects.all().delete()

    for f_obj in filiere_objs:
        is_master = f_obj.niveaux.startswith('Master')
        semesters = [Semester.M1, Semester.M2, Semester.M3, Semester.M4] if is_master else [Semester.S1, Semester.S2, Semester.S3, Semester.S4, Semester.S5, Semester.S6]
        
        for sem_choice in semesters:
            for i in range(1, 8): # 7 modules per semester
                m_name = f"{f_obj.nom} - {sem_choice} - M{i}"
                mod, _ = Module.objects.get_or_create(nom=m_name)
                
                # ALL modules now 4h/week (2 sessions/week)
                vh = 4 
                
                Comporte.objects.get_or_create(
                    filiere=f_obj,
                    module=mod,
                    semestre=sem_choice,
                    defaults={'v_h_hebdo': vh}
                )
    
    print(f"Total modules created/linked: {Comporte.objects.count()}")

    # 4. Add more Professors to handle the 4h/week load
    extra_profs = [
        {"prenom": "Ahmed", "nom": "EL ALAMI", "email": "a.elalami@umi.ac.ma"},
        {"prenom": "Youssef", "nom": "BENNANI", "email": "y.bennani@umi.ac.ma"},
        {"prenom": "Meryem", "nom": "IDRISSI", "email": "m.idrissi@umi.ac.ma"},
        {"prenom": "Karim", "nom": "Tazi", "email": "k.tazi@umi.ac.ma"},
        {"prenom": "Sanaa", "nom": "Mansouri", "email": "s.mansouri@umi.ac.ma"},
    ]
    
    for p in extra_profs:
        if not Enseignant.objects.filter(email=p["email"]).exists():
            enseignant = Enseignant.objects.create(
                email=p["email"], prenom=p["prenom"], nom=p["nom"],
                role="ENSEIGNANT", departement=dept
            )
            enseignant.set_password("password123")
            enseignant.save()

    all_profs = list(Enseignant.objects.all())
    all_comporte = list(Comporte.objects.all())
    
    if all_profs:
        import random
        for comp in all_comporte:
            prof = random.choice(all_profs)
            # Add module to prof habilitation if not already there
            prof.modules.add(comp.module)

    print("Population complete with 7 modules per semester!")

if __name__ == "__main__":
    populate()
