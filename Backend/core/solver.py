import random
import copy
from datetime import timedelta
from django.db.models import Q
from .models import Filiere, Module, Comporte, Local, Enseignant, Sceance, SemesterPeriod, Vacation, ScheduleTask

def get_module_speciality(name):
    name = name.lower()
    name = name.replace("é", "e").replace("è", "e").replace("ê", "e").replace("à", "a").replace("ç", "c").replace("î", "i")
    
    # 1. Transversal / Languages / Soft Skills
    if any(x in name for x in ["langue", "anglais", "francais", "civis", "droit", "personnel", "methodologie", "general", "citoyennete", "skills", "culture", "employabilite", "artistic", "artistiques"]):
        return "LANGUES"
        
    # 2. Math / Research Operationnelle / Optimization
    if any(x in name for x in ["analyse", "algebre", "calcul", "probabilite", "statistique", "mathematique", "optimisation", "stochastique", "variables aleatoires", "recherche operationnelle", "ro ", " ro", "jeux", "decision"]):
        return "MATHEMATIQUES"
        
    # 3. Physics / Engineering / Hardware
    if any(x in name for x in ["electronique", "thermodynamique", "optique", "signal", "image", "mecanique", "materiel", "embarque", "robotique", "electrostat", "magnetostat", "physique"]):
        return "PHYSIQUE"
        
    # 4. Informatique (Explicit keywords or fallback)
    return "INFORMATIQUE"


def get_module_eqtd_hours(module_name, v_h_hebdo):
    import re
    match = re.search(r'\(S\d+ - (\d+)h\)', module_name)
    raw_hours = int(match.group(1)) if match else (12 * v_h_hebdo)
    
    if 'pfe' in module_name.lower() or 'projet de fin' in module_name.lower():
        return 0
        
    if v_h_hebdo >= 4:
        # 50% CM (1.5) and 50% TD (1.0)
        return raw_hours * 1.25
    else:
        # CM only (1.5)
        return raw_hours * 1.5

def run_genetic_algorithm(semester_codes, task_id=None, custom_data=None, progress_callback=None, cancel_check=None):
    def update_progress(p, msg=None):
        if progress_callback:
            progress_callback(p, msg)
        elif task_id:
            ScheduleTask.objects.filter(id=task_id).update(progress=p, message=msg or "Optimisation en cours...")

    def check_cancelled():
        if cancel_check and cancel_check():
            raise Exception("CANCELLATION_REQUESTED")

    # 1. Initialization
    update_progress(5, "Initialisation des données...")
    check_cancelled()
    
    if custom_data:
        filieres = custom_data.get('filieres')
        locaux = custom_data.get('locaux')
        teachers = custom_data.get('teachers')
        # comportes_list is expected to be a pre-filtered list of Comporte-like objects
        comportes_list = custom_data.get('comportes')
    else:
        filieres = list(Filiere.objects.all())
        locaux = list(Local.objects.all())
        # Filter REAL active professors (excludes users without explicit ENSEIGNANT role)
        teachers = list(Enseignant.objects.filter(
            role__icontains='ENSEIGNANT',
            is_active=True
        ).exclude(email='admin@gmail.com').exclude(nom__icontains='assign'))
        comportes_list = None
    
    days_list = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
    times = ['08:30', '10:45', '14:30', '16:45']
    all_slots = [(d, t) for d in days_list for t in times]
    total_slots = len(all_slots)

    # 2. Gather session requirements and run the greedy Module Pre-Assignment Pass
    requirements = []
    mod_eligible_teachers = {}
    
    # Collect all comportes to schedule
    comportes_to_schedule = []
    if comportes_list is not None:
        for cp in comportes_list:
            name_lower = cp.module.nom.lower()
            if 'pfe' in name_lower or 'projet de fin' in name_lower:
                continue
            comportes_to_schedule.append(cp)
    else:
        for sem in semester_codes:
            update_progress(10, f"Chargement des besoins pour {sem}...")
            check_cancelled()
            for f in filieres:
                comportes = Comporte.objects.filter(filiere=f, semestre=sem)
                for cp in comportes:
                    name_lower = cp.module.nom.lower()
                    if 'pfe' in name_lower or 'projet de fin' in name_lower:
                        continue
                    comportes_to_schedule.append(cp)

    # Greedy Module Pre-Assignment
    prof_load = {t.id: 0.0 for t in teachers}
    prof_seuil = {}
    for t in teachers:
        dept_seuil = 192
        if hasattr(t, 'departement') and t.departement:
            dept_seuil = t.departement.seuil_horaire
        prof_seuil[t.id] = dept_seuil

    module_to_comportes = {}
    for cp in comportes_to_schedule:
        mod_id = cp.module.id
        if mod_id not in module_to_comportes:
            module_to_comportes[mod_id] = []
        module_to_comportes[mod_id].append(cp)

    module_assigned_teacher = {}
    for mod_id, cps in module_to_comportes.items():
        total_module_hours = 0
        first_cp = cps[0]
        for cp in cps:
            total_module_hours += get_module_eqtd_hours(cp.module.nom, cp.v_h_hebdo)

        # Get candidate teachers
        candidates = []
        if hasattr(first_cp, 'eligible_teachers'):
            candidates = first_cp.eligible_teachers
        else:
            candidates = list(first_cp.module.users_habilites.all())

        if not candidates:
            candidates = teachers

        # Keep only active teachers in our list
        valid_ids = set(t.id for t in teachers)
        candidates = [t for t in candidates if t.id in valid_ids]
        if not candidates:
            candidates = teachers

        # Filter candidates by module speciality
        mod_spec = get_module_speciality(first_cp.module.nom)
        spec_candidates = [t for t in candidates if getattr(t, 'specialite', 'INFORMATIQUE') == mod_spec]
        if spec_candidates:
            candidates = spec_candidates

        # Find best teacher under seuil horaire limit
        under_seuil = [t for t in candidates if prof_load[t.id] + total_module_hours <= prof_seuil[t.id]]
        if under_seuil:
            best_teacher = min(under_seuil, key=lambda t: prof_load[t.id])
        else:
            # Enforce work limit: Do NOT assign to any permanent professor who would exceed seuil.
            # Instead, dynamically allocate to a VACATAIRE for this speciality
            vac_index = 1
            best_teacher = None
            while True:
                vac_email = f"vacataire_{mod_spec.lower()}_{vac_index}@umi.ac.ma"
                vac_name = f"VACATAIRE {mod_spec} {vac_index}"
                
                v_t, created = Enseignant.objects.get_or_create(
                    email=vac_email,
                    defaults={
                        'nom': vac_name,
                        'prenom': 'Enseignant',
                        'role': 'ENSEIGNANT',
                        'specialite': mod_spec,
                        'is_active': True,
                        'tel': ''
                    }
                )
                
                # Register in local solver lists
                if v_t.id not in prof_load:
                    teachers.append(v_t)
                    prof_load[v_t.id] = 0.0
                    prof_seuil[v_t.id] = 192.0
                    
                # Check if this vacataire has enough remaining space
                if prof_load[v_t.id] + total_module_hours <= prof_seuil[v_t.id]:
                    best_teacher = v_t
                    break
                
                if vac_index >= 50:
                    best_teacher = v_t
                    break
                    
                vac_index += 1

        module_assigned_teacher[mod_id] = best_teacher
        prof_load[best_teacher.id] += total_module_hours

    # Build the requirements list with strictly pre-assigned teachers
    for cp in comportes_to_schedule:
        assigned_teacher = module_assigned_teacher.get(cp.module.id)
        if not assigned_teacher:
            continue
        
        eligible_teachers = [assigned_teacher]
        mod_eligible_teachers[cp.module.id] = eligible_teachers

        session_types = ['CM', random.choice(['TD', 'TP'])] if cp.v_h_hebdo >= 4 else ['CM']
        for s_type in session_types:
            requirements.append({
                'module': cp.module,
                'filiere': cp.filiere,
                'semester': cp.semestre,
                'eligible_teachers': eligible_teachers,
                'type': s_type
            })

    if not requirements: return False, "Aucun module trouvé pour ces semestres."

    # --- RESOURCE DIAGNOSTIC ---
    total_req_sessions = len(requirements)
    total_prof_capacity = len(teachers) * 18 # 36h = 18 sessions
    total_room_capacity = len(locaux) * total_slots

    print(f"DEBUG: Req={total_req_sessions}, ProfCap={total_prof_capacity}, RoomCap={total_room_capacity}")

    if total_req_sessions > total_prof_capacity:
        msg = f"Pénurie d'enseignants : Vous avez {total_req_sessions} séances à caser, mais vos professeurs n'ont une capacité que de {total_prof_capacity} séances (limite de 30h/semaine). Veuillez ajouter des vacataires ou augmenter la limite."
        print(f"DEBUG ERROR: {msg}")
        return False, msg

    if total_req_sessions > total_room_capacity:
        msg = f"Pénurie de locaux : Vous avez {total_req_sessions} séances, mais vos {len(locaux)} locaux ne peuvent accueillir que {total_room_capacity} créneaux par semaine."
        print(f"DEBUG ERROR: {msg}")
        return False, msg

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
        
        # Round-Robin tracker to force usage of all teachers
        global_teacher_usage = {t.id: 0 for t in teachers}
        
        for (f_id, sem), reqs in groups.items():
            chosen_slots = random.sample(range(len(all_slots)), len(reqs))
            module_teacher_map = {}
            for i, req in enumerate(reqs):
                mod_id = req['module'].id
                if mod_id not in module_teacher_map:
                    # Pick the teacher with the least current assignments from the eligible pool
                    eligible = req['eligible_teachers']
                    # Sort eligible teachers by their current usage to FORCE round-robin
                    eligible.sort(key=lambda t: global_teacher_usage.get(t.id, 0))
                    
                    # Add a little randomness among the top tied candidates
                    min_usage = global_teacher_usage.get(eligible[0].id, 0)
                    tied_candidates = [t for t in eligible if global_teacher_usage.get(t.id, 0) == min_usage]
                    chosen_teacher = random.choice(tied_candidates)
                    
                    module_teacher_map[mod_id] = chosen_teacher
                    global_teacher_usage[chosen_teacher.id] += 1
                
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
        hard_penalty = 0
        soft_penalty = 0
        teacher_slots, room_slots, filiere_slots, teacher_workload = {}, {}, {}, {}
        
        # Tracker for "One module per prof per filiere per semester"
        # (teacher_id, filiere_id, semester) -> module_id
        teacher_module_map = {}

        for gene in individual:
            t_id, r_id, f_id, sem, slot = gene['teacher'].id, gene['room'].id, gene['filiere'].id, gene['semester'], gene['slot']
            mod_id = gene['module'].id

            # 1. Constraint: One module per prof per program per semester
            assigned_mod = teacher_module_map.get((t_id, f_id, sem))
            if assigned_mod and assigned_mod != mod_id:
                hard_penalty += 10000
            teacher_module_map[(t_id, f_id, sem)] = mod_id

            # 2. Constraint: TP/TD should NOT be in Amphi
            if gene['type'] in ['TD', 'TP'] and gene['room'].is_amphi:
                hard_penalty += 10000
            
            # 3. Slot Conflicts
            if (t_id, slot) in teacher_slots: hard_penalty += 5000
            teacher_slots[(t_id, slot)] = 1
            if (r_id, slot) in room_slots: hard_penalty += 5000
            room_slots[(r_id, slot)] = 1
            if (f_id, sem, slot) in filiere_slots: hard_penalty += 5000
            filiere_slots[(f_id, sem, slot)] = 1
            
            # 4. Workload tracking (in EqTD weekly hours, assuming 2 hours per session slot)
            session_hours = 2.0
            if gene['type'] == 'CM':
                eqtd_hours = session_hours * 1.5
            elif gene['type'] == 'TP':
                eqtd_hours = session_hours * 0.75
            else:
                eqtd_hours = session_hours * 1.0
                
            teacher_workload[t_id] = teacher_workload.get(t_id, 0) + eqtd_hours
            if teacher_workload[t_id] > 36.0: hard_penalty += 2000 # 36h EqTD limit

        # Balancing Penalty: Encourage equitable distribution of hours
        if teachers:
            total_eqtd = sum(teacher_workload.values())
            avg_load = total_eqtd / len(teachers)
            for t in teachers:
                load = teacher_workload.get(t.id, 0)
                
                # FATAL PENALTY for 0 hours. We strictly want everyone working.
                if load == 0:
                    hard_penalty += 50000
                else:
                    # Penalize squared difference from average (Aggressive fairness)
                    soft_penalty += int((load - avg_load) ** 2 * 1000)

        # Base fitness to prioritize minimizing hard_penalty first
        return 100000 / (1 + hard_penalty) + 1 / (1 + soft_penalty)

    # 4. Evolution
    population = [create_individual() for _ in range(POPULATION_SIZE)]
    for gen in range(GENERATIONS):
        check_cancelled()
        population = sorted(population, key=calculate_fitness, reverse=True)
        if calculate_fitness(population[0]) >= 100000.0: break
        
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
    check_cancelled()
    best_schedule = population[0]
    
    # Calculate first week dates for each semester
    periods = {p.semester: p for p in SemesterPeriod.objects.filter(semester__in=semester_codes)}
    
    days_map = {'Lundi': 0, 'Mardi': 1, 'Mercredi': 2, 'Jeudi': 3, 'Vendredi': 4, 'Samedi': 5}

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
