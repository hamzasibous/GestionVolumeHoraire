import random
import copy
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from core.models import Filiere, Module, Comporte, Local, Enseignant, Sceance, SemesterPeriod, Vacation, Semester

class Command(BaseCommand):
    help = 'Generate an optimized timetable for multiple semesters using a Genetic Algorithm'

    def add_arguments(self, parser):
        parser.add_argument('--semesters', type=str, required=True, help='Comma-separated semesters to schedule (e.g., S1,S3,S5)')

    def handle(self, *args, **options):
        selected_semesters = options['semesters'].split(',')
        self.stdout.write(f"Starting Genetic Algorithm for concurrent semesters: {selected_semesters}...")

        # 1. Initialization
        filieres = list(Filiere.objects.all())
        locaux = list(Local.objects.all())
        teachers = list(Enseignant.objects.all())
        
        # Define slots (5 days, 4 slots/day)
        days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']
        times = ['08:30', '10:45', '14:30', '16:45']
        all_slots = [(d, t) for d in days for t in times]

        # 2. Gather session requirements for ALL selected semesters
        requirements = []
        for sem in selected_semesters:
            for f in filieres:
                comportes = Comporte.objects.filter(filiere=f, semestre=sem)
                for cp in comportes:
                    num_sessions = 2 if cp.v_h_hebdo == 4 else 1
                    eligible_teachers = list(cp.module.enseignants_habilites.all())
                    if not eligible_teachers:
                        eligible_teachers = teachers
                    
                    for _ in range(num_sessions):
                        requirements.append({
                            'module': cp.module,
                            'filiere': f,
                            'semester': sem,
                            'eligible_teachers': eligible_teachers
                        })

        if not requirements:
            self.stdout.write(self.style.ERROR("No requirements found for these semesters."))
            return

        # 3. GA Parameters
        POPULATION_SIZE = 60
        GENERATIONS = 300
        MUTATION_RATE = 0.15

        # 4. GA Components
        def create_individual():
            individual = []
            filiere_track = {} # (filiere_id, semester) -> used_slots
            
            for req in requirements:
                key = (req['filiere'].id, req['semester'])
                if key not in filiere_track:
                    filiere_track[key] = set()
                
                available_slots = [i for i in range(len(all_slots)) if i not in filiere_track[key]]
                slot = random.choice(available_slots) if available_slots else random.randint(0, len(all_slots) - 1)
                filiere_track[key].add(slot)
                
                individual.append({
                    'module': req['module'],
                    'teacher': random.choice(req['eligible_teachers']),
                    'filiere': req['filiere'],
                    'semester': req['semester'],
                    'slot': slot,
                    'room': random.choice(locaux)
                })
            return individual

        def calculate_fitness(individual):
            penalty = 0
            teacher_slots = {}
            room_slots = {}
            filiere_slots = {}
            teacher_workload = {}

            for gene in individual:
                t_id = gene['teacher'].id
                r_id = gene['room'].id
                f_id = gene['filiere'].id
                sem = gene['semester']
                slot = gene['slot']

                # Teacher Conflict
                if (t_id, slot) in teacher_slots: penalty += 1000
                teacher_slots[(t_id, slot)] = teacher_slots.get((t_id, slot), 0) + 1

                # Room Conflict
                if (r_id, slot) in room_slots: penalty += 1000
                room_slots[(r_id, slot)] = room_slots.get((r_id, slot), 0) + 1

                # Filiere group conflict
                if (f_id, sem, slot) in filiere_slots: penalty += 1000
                filiere_slots[(f_id, sem, slot)] = filiere_slots.get((f_id, sem, slot), 0) + 1

                # Teacher Workload
                teacher_workload[t_id] = teacher_workload.get(t_id, 0) + 1
                if teacher_workload[t_id] > 7: penalty += 500

            return 1 / (1 + penalty)

        # 5. Evolution Loop
        population = [create_individual() for _ in range(POPULATION_SIZE)]

        for gen in range(GENERATIONS):
            population = sorted(population, key=calculate_fitness, reverse=True)
            best_fitness = calculate_fitness(population[0])
            
            if best_fitness == 1.0:
                self.stdout.write(self.style.SUCCESS(f"Perfect solution found at generation {gen}!"))
                break
            
            if gen % 20 == 0:
                self.stdout.write(f"Generation {gen}: Best Fitness = {best_fitness:.6f}")

            new_population = population[:10] # Elitism
            while len(new_population) < POPULATION_SIZE:
                p1, p2 = random.sample(population[:20], 2)
                split = random.randint(0, len(p1) - 1)
                child = copy.deepcopy(p1[:split]) + copy.deepcopy(p2[split:])
                
                if random.random() < MUTATION_RATE:
                    idx = random.randint(0, len(child) - 1)
                    child[idx]['slot'] = random.randint(0, len(all_slots) - 1)
                    child[idx]['room'] = random.choice(locaux)
                    child[idx]['teacher'] = random.choice(requirements[idx]['eligible_teachers'])
                
                new_population.append(child)
            population = new_population

        # 6. Persistence
        self.save_multi_to_db(population[0], selected_semesters)

    def save_multi_to_db(self, schedule, semester_codes):
        periods = {p.semester: p for p in SemesterPeriod.objects.filter(semester__in=semester_codes)}
        
        for code in semester_codes:
            if code in periods:
                p = periods[code]
                Sceance.objects.filter(module__comporte__semestre=code, date__range=[p.date_debut, p.date_fin]).delete()

        days_map = {'Lundi': 0, 'Mardi': 1, 'Mercredi': 2, 'Jeudi': 3, 'Vendredi': 4}
        times = ['08:30', '10:45', '14:30', '16:45']
        days_list = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']

        semester_groups = {}
        for gene in schedule:
            sem = gene['semester']
            if sem not in semester_groups: semester_groups[sem] = []
            semester_groups[sem].append(gene)

        for sem, genes in semester_groups.items():
            if sem not in periods: continue
            period = periods[sem]
            teaching_weeks = 0
            current_monday = period.date_debut
            while current_monday.weekday() != 0: current_monday += timedelta(days=1)

            while teaching_weeks < 12 and current_monday <= period.date_fin:
                is_blocked = Vacation.objects.filter(is_global=True, date_debut__lte=current_monday + timedelta(days=6), date_fin__gte=current_monday).count() >= 3
                if not is_blocked:
                    for gene in genes:
                        slot_idx = gene['slot']
                        day_name = days_list[slot_idx // 4]
                        time_str = times[slot_idx % 4]
                        session_date = current_monday + timedelta(days=days_map[day_name])
                        Sceance.objects.create(type='CM', duree=120, date=session_date, heure_debut=time_str, module=gene['module'], enseignant=gene['teacher'], local=gene['room'])
                    teaching_weeks += 1
                current_monday += timedelta(days=7)
            self.stdout.write(self.style.SUCCESS(f"Saved 12 weeks for semester {sem}."))
