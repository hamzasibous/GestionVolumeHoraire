import random
import copy
from datetime import timedelta
from .models import Filiere, Module, Comporte, Local, Enseignant, Sceance, SemesterPeriod, Vacation, ScheduleTask

def run_genetic_algorithm(semester_codes, task_id=None, custom_data=None, progress_callback=None):
    def update_progress(p, msg=None):
        if progress_callback:
            progress_callback(p, msg)
        elif task_id:
            ScheduleTask.objects.filter(id=task_id).update(progress=p, message=msg or "Optimisation en cours...")

    # 1. Initialization
    update_progress(5, "Initialisation des données...")
    
    if custom_data:
        filieres = custom_data.get('filieres')
        locaux = custom_data.get('locaux')
        teachers = custom_data.get('teachers')
        # comportes_list is expected to be a pre-filtered list of Comporte-like objects
        comportes_list = custom_data.get('comportes')
    else:
        filieres = list(Filiere.objects.all())
        locaux = list(Local.objects.all())
        teachers = list(Enseignant.objects.all())
        comportes_list = None
    
    days_list = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']
    times = ['08:30', '10:45', '14:30', '16:45']
    all_slots = [(d, t) for d in days_list for t in times]
    total_slots = len(all_slots)

    # 2. Gather session requirements
    requirements = []
    
    if comportes_list is not None:
        # Use provided requirements (Simulation mode)
        for cp in comportes_list:
            eligible_teachers = cp.eligible_teachers if hasattr(cp, 'eligible_teachers') else teachers
            session_types = ['CM', random.choice(['TD', 'TP'])] if cp.v_h_hebdo >= 4 else ['CM']
            for s_type in session_types:
                requirements.append({
                    'module': cp.module,
                    'filiere': cp.filiere,
                    'semester': cp.semestre,
                    'eligible_teachers': eligible_teachers,
                    'type': s_type
                })
    else:
        # DB mode
        for sem in semester_codes:
            update_progress(10, f"Chargement des besoins pour {sem}...")
            for f in filieres:
                comportes = Comporte.objects.filter(filiere=f, semestre=sem)
                for cp in comportes:
                    eligible_teachers = list(cp.module.users_habilites.all())
                    if not eligible_teachers: eligible_teachers = teachers

                    session_types = ['CM', random.choice(['TD', 'TP'])] if cp.v_h_hebdo == 4 else ['CM']

                    for s_type in session_types:
                        requirements.append({
                            'module': cp.module,
                            'filiere': f,
                            'semester': sem,
                            'eligible_teachers': eligible_teachers,
                            'type': s_type
                        })

    if not requirements: return False, "Aucun module trouvé pour ces semestres."

    # --- RESOURCE DIAGNOSTIC ---
    total_req_sessions = len(requirements)
    total_prof_capacity = len(teachers) * 18 # 36h = 18 sessions
    total_room_capacity = len(locaux) * total_slots

    if total_req_sessions > total_prof_capacity:
        return False, f"Pénurie d'enseignants : Vous avez {total_req_sessions} séances à caser, mais vos professeurs n'ont une capacité que de {total_prof_capacity} séances (limite de 30h/semaine). Veuillez ajouter des vacataires ou augmenter la limite."

    if total_req_sessions > total_room_capacity:
        return False, f"Pénurie de locaux : Vous avez {total_req_sessions} séances, mais vos {len(locaux)} locaux ne peuvent accueillir que {total_room_capacity} créneaux par semaine."

    # 3. GA Parameters
    POPULATION_SIZE = 80
    GENERATIONS = 300 
    MUTATION_RATE = 0.2

    amphis = [r for r in locaux if r.is_amphi]
    classrooms = [r for r in locaux if not r.is_amphi]

    def create_individual():
        individual = []
        groups = {}
        for req in requirements:
            key = (req['filiere'].id, req['semester'])
            if key not in groups: groups[key] = []
            groups[key].append(req)
        
        for (f_id, sem), reqs in groups.items():
            chosen_slots = random.sample(range(len(all_slots)), len(reqs))
            module_teacher_map = {}
            for i, req in enumerate(reqs):
                mod_id = req['module'].id
                if mod_id not in module_teacher_map:
                    module_teacher_map[mod_id] = random.choice(req['eligible_teachers'])
                
                # Pick room based on type
                if req['type'] in ['TD', 'TP']:
                    room = random.choice(classrooms) if classrooms else random.choice(locaux)
                else: # CM
                    room = random.choice(amphis) if amphis else random.choice(locaux)

                individual.append({
                    'module': req['module'],
                    'teacher': module_teacher_map[mod_id],
                    'filiere': req['filiere'],
                    'semester': req['semester'],
                    'slot': chosen_slots[i],
                    'room': room,
                    'type': req['type']
                })
        return individual

    def calculate_fitness(individual):
        penalty = 0
        teacher_slots, room_slots, filiere_slots, teacher_workload = {}, {}, {}, {}
        for gene in individual:
            t_id, r_id, f_id, sem, slot = gene['teacher'].id, gene['room'].id, gene['filiere'].id, gene['semester'], gene['slot']
            
            # Constraint: TP/TD should NOT be in Amphi
            if gene['type'] in ['TD', 'TP'] and gene['room'].is_amphi:
                penalty += 10000
            
            if (t_id, slot) in teacher_slots: penalty += 5000
            teacher_slots[(t_id, slot)] = 1
            if (r_id, slot) in room_slots: penalty += 5000
            room_slots[(r_id, slot)] = 1
            if (f_id, sem, slot) in filiere_slots: penalty += 5000
            filiere_slots[(f_id, sem, slot)] = 1
            teacher_workload[t_id] = teacher_workload.get(t_id, 0) + 1
            if teacher_workload[t_id] > 18: penalty += 1000
        return 1 / (1 + penalty)

    # 4. Evolution
    population = [create_individual() for _ in range(POPULATION_SIZE)]
    for gen in range(GENERATIONS):
        population = sorted(population, key=calculate_fitness, reverse=True)
        if calculate_fitness(population[0]) == 1.0: break
        
        if gen % 10 == 0:
            prog = 15 + int((gen / GENERATIONS) * 60)
            update_progress(prog, f"Evolution : Génération {gen}/{GENERATIONS}")

        new_population = population[:10]
        while len(new_population) < POPULATION_SIZE:
            p1, p2 = random.sample(population[:20], 2)
            split = random.randint(0, len(p1) - 1)
            child = copy.deepcopy(p1[:split]) + copy.deepcopy(p2[split:])
            if random.random() < MUTATION_RATE:
                idx = random.randint(0, len(child) - 1)
                child[idx]['slot'] = random.randint(0, len(all_slots) - 1)
                
                # Re-pick room based on type during mutation
                if child[idx]['type'] in ['TD', 'TP']:
                    child[idx]['room'] = random.choice(classrooms) if classrooms else random.choice(locaux)
                else:
                    child[idx]['room'] = random.choice(amphis) if amphis else random.choice(locaux)

            new_population.append(child)
        population = new_population

    # 5. Prepare Results for Return
    update_progress(90, "Préparation de l'aperçu...")
    best_schedule = population[0]
    
    # Calculate first week dates for each semester
    periods = {p.semester: p for p in SemesterPeriod.objects.filter(semester__in=semester_codes)}
    
    days_map = {'Lundi': 0, 'Mardi': 1, 'Mercredi': 2, 'Jeudi': 3, 'Vendredi': 4}

    # Map objects to IDs for serialization
    serializable_schedule = []
    for gene in best_schedule:
        sem = gene['semester']
        slot_idx = gene['slot']
        day_name = days_list[slot_idx // 4]
        
        # Calculate preview date (The very first occurrence of this session)
        period = periods.get(sem)
        if period:
            target_day_of_week = days_map[day_name]
            
            # Start from period.date_debut and find the first occurrence of target_day_of_week
            preview_date = period.date_debut
            while preview_date.weekday() != target_day_of_week:
                preview_date += timedelta(days=1)
        else:
            preview_date = None

        serializable_schedule.append({
            'module_id': gene['module'].id,
            'module_name': gene['module'].nom,
            'teacher_id': gene['teacher'].id,
            'teacher_name': str(gene['teacher']),
            'filiere_id': gene['filiere'].id,
            'filiere_name': str(gene['filiere']),
            'semester': sem,
            'slot': slot_idx,
            'day': day_name,
            'room_id': gene['room'].id,
            'room_name': str(gene['room']),
            'date': preview_date.strftime('%Y-%m-%d') if preview_date else None,
            'startTime': times[slot_idx % 4],
            'type': gene.get('type', 'CM')
        })
    
    update_progress(100, "Génération terminée !")
    return True, serializable_schedule
