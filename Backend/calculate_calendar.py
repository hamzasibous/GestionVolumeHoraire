import os
import django
from datetime import date, timedelta

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vh_backend.settings')
django.setup()

from core.models import Semester, SemesterPeriod, Vacation

def is_week_blocked(start_date):
    end_date = start_date + timedelta(days=6)
    vacations = Vacation.objects.filter(is_global=True, date_debut__lte=end_date, date_fin__gte=start_date)
    
    total_blocked_days = 0
    for v in vacations:
        overlap_start = max(start_date, v.date_debut)
        overlap_end = min(end_date, v.date_fin)
        total_blocked_days += (overlap_end - overlap_start).days + 1
    
    return total_blocked_days >= 3 

def run():
    # Semester 1 starts 01/09/2026
    start_year = 2026
    start_date = date(start_year, 9, 1)
    
    # Clear auto-generated vacations to avoid duplicates
    Vacation.objects.filter(titre__in=["Préparation", "Examens", "Repos", "Ratrappage", "Grandes Vacances"]).delete()

    def create_vacation(name, start, end):
        Vacation.objects.get_or_create(
            titre=name,
            date_debut=start,
            date_fin=end,
            defaults={'type_conge': 'Calendrier Académique', 'is_global': True, 'statut': 'Approved'}
        )

    print("Calculating Autumn Cycle...")
    current_date = start_date
    
    # 1. Autumn Teaching
    teaching_start_a = current_date
    weeks_counted = 0
    while weeks_counted < 12:
        if not is_week_blocked(current_date):
            weeks_counted += 1
        else:
            print(f"  Skipping week starting {current_date} due to holidays")
        current_date += timedelta(days=7)
    teaching_end_a = current_date - timedelta(days=1)
    print(f"  Autumn teaching period: {teaching_start_a} to {teaching_end_a} ({weeks_counted} weeks)")
    
    # Save Autumn Semester Periods
    for sem in [Semester.S1, Semester.S3, Semester.S5, Semester.M1, Semester.M3]:
        SemesterPeriod.objects.update_or_create(
            semester=sem,
            defaults={'date_debut': teaching_start_a, 'date_fin': teaching_end_a}
        )
    
    # 2. Autumn Post-Study
    create_vacation("Préparation", current_date, current_date + timedelta(days=14))
    current_date += timedelta(days=15)
    
    create_vacation("Examens", current_date, current_date + timedelta(days=6))
    current_date += timedelta(days=7)
    
    create_vacation("Repos", current_date, current_date + timedelta(days=6))
    current_date += timedelta(days=7)
    
    create_vacation("Ratrappage", current_date, current_date + timedelta(days=6))
    current_date += timedelta(days=7)

    print("\nCalculating Spring Cycle...")
    # 3. Spring Teaching
    teaching_start_s = current_date
    weeks_counted = 0
    while weeks_counted < 12:
        if not is_week_blocked(current_date):
            weeks_counted += 1
        else:
            print(f"  Skipping week starting {current_date} due to holidays")
        current_date += timedelta(days=7)
    teaching_end_s = current_date - timedelta(days=1)
    print(f"  Spring teaching period: {teaching_start_s} to {teaching_end_s} ({weeks_counted} weeks)")
    
    # Save Spring Semester Periods
    for sem in [Semester.S2, Semester.S4, Semester.S6, Semester.M2, Semester.M4]:
        SemesterPeriod.objects.update_or_create(
            semester=sem,
            defaults={'date_debut': teaching_start_s, 'date_fin': teaching_end_s}
        )

    # 4. Spring Post-Study
    create_vacation("Préparation", current_date, current_date + timedelta(days=14))
    current_date += timedelta(days=15)
    
    create_vacation("Examens", current_date, current_date + timedelta(days=6))
    current_date += timedelta(days=7)
    
    create_vacation("Repos", current_date, current_date + timedelta(days=6))
    current_date += timedelta(days=7)
    
    create_vacation("Ratrappage", current_date, current_date + timedelta(days=6))
    current_date += timedelta(days=7)
    
    # 5. Summer Vacation
    create_vacation("Grandes Vacances", current_date, date(start_year + 1, 8, 31))
    
    print("\nCalendar and Vacations updated successfully!")

if __name__ == "__main__":
    run()
