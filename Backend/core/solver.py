import random
import copy
from datetime import timedelta
from .models import Filiere, Module, Comporte, Local, Enseignant, Sceance, SemesterPeriod, Vacation, ScheduleTask
from scipy.optimize import linear_sum_assignment
import numpy as np

def run_hungarian_algorithm(semester_codes, task_id=None, custom_data=None, progress_callback=None, cancel_check=None):
    def update_progress(p, msg=None):
        if progress_callback:
            progress_callback(p, msg)
        elif task_id:
            ScheduleTask.objects.filter(id=task_id).update(progress=p, message=msg or "Optimisation (Hungarian) en cours...")

    def check_cancelled():
        if cancel_check and cancel_check():
            raise Exception("CANCELLATION_REQUESTED")

    # 1. Initialization
    update_progress(5, "Initialisation des données...")
    
    if custom_data:
        filieres = custom_data.get('filieres')
        locaux = custom_data.get('locaux')
        teachers = custom_data.get('teachers')
        comportes_list = custom_data.get('comportes')
    else:
        filieres = list(Filiere.objects.all())
        locaux = list(Local.objects.all())
        # CRITICAL FIX: Only include REAL active professors, exclude admin/unassigned
        teachers = list(Enseignant.objects.filter(
            is_active=True, 
            role__in=['ENSEIGNANT', 'CHEF_DEPARTEMENT']
        ).exclude(email__icontains='admin').exclude(nom__icontains='assign'))
        comportes_list = None
    
    days_list = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
    times = ['08:30', '10:45', '14:30', '16:45']
    all_slots = [(d, t) for d in days_list for t in times]

    # 2. Gather session requirements (Target 14 per semester)
    requirements = []
    if comportes_list is not None:
        for cp in comportes_list:
            eligible_teachers = cp.eligible_teachers if hasattr(cp, 'eligible_teachers') else teachers
            session_types = ['CM', 'TD'] # Default to split for simulation
            for s_type in session_types:
                requirements.append({
                    'module': cp.module,
                    'filiere': cp.filiere,
                    'semester': cp.semestre,
                    'eligible_teachers': eligible_teachers,
                    'type': s_type,
                    'id': f"{cp.module.id}-{s_type}-{random.random()}"
                })
    else:
        for sem in semester_codes:
            for f in filieres:
                comportes = list(Comporte.objects.filter(filiere=f, semestre=sem))[:7]
                for idx, cp in enumerate(comportes):
                    eligible_teachers = list(cp.module.users_habilites.all())
                    # Filter eligible teachers too
                    eligible_teachers = [t for t in eligible_teachers if t.role in ['ENSEIGNANT', 'CHEF_DEPARTEMENT'] and 'admin' not in t.email.lower()]
                    if not eligible_teachers: eligible_teachers = teachers
                    
                    requirements.append({
                        'module': cp.module, 'filiere': f, 'semester': sem,
                        'eligible_teachers': eligible_teachers, 'type': 'CM', 'id': f"{cp.id}-CM-{idx}"
                    })
                    s_type = random.choice(['TD', 'TP'])
                    requirements.append({
                        'module': cp.module, 'filiere': f, 'semester': sem,
                        'eligible_teachers': eligible_teachers, 'type': s_type, 'id': f"{cp.id}-{s_type}-{idx}"
                    })

    if not requirements: return False, "Aucun module trouvé."

    # 3. Hungarian Assignment with Multi-Pass / Retry Logic
    best_schedule = []
    max_retries = 5
    target_count = len(requirements)

    for attempt in range(max_retries):
        check_cancelled()
        update_progress(10 + (attempt * 5), f"Tentative de génération {attempt+1}/{max_retries}...")
        
        current_schedule = []
        remaining_reqs = list(requirements)
        random.shuffle(remaining_reqs)

        teacher_busy = {t.id: set() for t in teachers}
        teacher_total_hours = {t.id: 0 for t in teachers}
        MAX_HOURS_PER_WEEK = 14
        
        group_busy = {} # (filiere_id, semester) -> set(slots)
        room_busy = {r.id: set() for r in locaux}
        teacher_module_map = {} 

        for slot_idx, (day, time_str) in enumerate(all_slots):
            candidates = []
            for req in remaining_reqs:
                group_key = (req['filiere'].id, req['semester'])
                if slot_idx not in group_busy.get(group_key, set()):
                    eligible_and_available = []
                    for t in req['eligible_teachers']:
                        if slot_idx not in teacher_busy.get(t.id, set()) and teacher_total_hours.get(t.id, 0) < MAX_HOURS_PER_WEEK:
                            assigned_mod = teacher_module_map.get((t.id, req['filiere'].id, req['semester']))
                            if assigned_mod is None or assigned_mod == req['module'].id:
                                eligible_and_available.append(t)
                    if eligible_and_available:
                        candidates.append(req)
            
            if not candidates: continue
            available_rooms = [r for r in locaux if slot_idx not in room_busy.get(r.id, set())]
            if not available_rooms: continue

            num_rows, num_cols = len(candidates), len(available_rooms)
            cost_matrix = np.full((num_rows, num_cols), 1000.0)

            for i, req in enumerate(candidates):
                for j, room in enumerate(available_rooms):
                    cost = 10.0
                    if req['type'] == 'CM' and room.is_amphi: cost = 0.0
                    if req['type'] in ['TD', 'TP'] and not room.is_amphi: cost = 0.0
                    
                    free_teachers = [t for t in req['eligible_teachers'] if slot_idx not in teacher_busy.get(t.id, set()) and teacher_total_hours.get(t.id, 0) < MAX_HOURS_PER_WEEK]
                    if not free_teachers: cost = 1000000.0
                    else:
                        min_global_load = min(teacher_total_hours[t.id] for t in free_teachers)
                        cost += (min_global_load ** 2) * 5.0 
                    cost_matrix[i, j] = cost

            row_ind, col_ind = linear_sum_assignment(cost_matrix)
            assigned_in_this_slot = []
            already_assigned_groups_in_this_slot = set()
            
            for r_idx, c_idx in zip(row_ind, col_ind):
                if cost_matrix[r_idx, c_idx] < 1000000.0:
                    req = candidates[r_idx]
                    group_key = (req['filiere'].id, req['semester'])
                    if group_key in already_assigned_groups_in_this_slot: continue
                    room = available_rooms[c_idx]
                    free_teachers = [t for t in req['eligible_teachers'] if slot_idx not in teacher_busy.get(t.id, set()) and teacher_total_hours.get(t.id, 0) < MAX_HOURS_PER_WEEK]
                    if not free_teachers: continue 
                    teacher = min(free_teachers, key=lambda t: teacher_total_hours[t.id])

                    current_schedule.append({
                        'module': req['module'], 'teacher': teacher, 'filiere': req['filiere'],
                        'semester': req['semester'], 'slot': slot_idx, 'room': room, 'type': req['type']
                    })
                    teacher_busy[teacher.id].add(slot_idx)
                    teacher_total_hours[teacher.id] += 2
                    room_busy[room.id].add(slot_idx)
                    if group_key not in group_busy: group_busy[group_key] = set()
                    group_busy[group_key].add(slot_idx)
                    already_assigned_groups_in_this_slot.add(group_key)
                    assigned_in_this_slot.append(req['id'])
                    teacher_module_map[(teacher.id, req['filiere'].id, req['semester'])] = req['module'].id

            remaining_reqs = [r for r in remaining_reqs if r['id'] not in assigned_in_this_slot]

        if len(current_schedule) > len(best_schedule): best_schedule = current_schedule
        if len(current_schedule) == target_count: break

    if len(best_schedule) < target_count:
        msg = f"Impossible de trouver une solution complète avec la limite de 14h/semaine. Seulement {len(best_schedule)}/{target_count} séances placées."
        return False, msg

    # 4. Prepare Results
    update_progress(95, "Finalisation...")
    periods = {p.semester: p for p in SemesterPeriod.objects.filter(semester__in=semester_codes)}
    days_map_idx = {'Lundi': 0, 'Mardi': 1, 'Mercredi': 2, 'Jeudi': 3, 'Vendredi': 4, 'Samedi': 5}

    serializable_schedule = []
    for gene in best_schedule:
        sem, slot_idx = gene['semester'], gene['slot']
        day_name = days_list[slot_idx // 4]
        period, preview_date = periods.get(sem), None
        if period:
            target_day = days_map_idx[day_name]
            preview_date = period.date_debut
            while preview_date.weekday() != target_day: preview_date += timedelta(days=1)

        serializable_schedule.append({
            'module_id': gene['module'].id, 'module_name': gene['module'].nom,
            'teacher_id': gene['teacher'].id, 'teacher_name': str(gene['teacher']),
            'filiere_id': gene['filiere'].id, 'filiere_name': str(gene['filiere']),
            'semester': sem, 'slot': slot_idx, 'day': day_name,
            'room_id': gene['room'].id, 'room_name': str(gene['room']),
            'date': preview_date.strftime('%Y-%m-%d') if preview_date else None,
            'startTime': times[slot_idx % 4], 'type': gene['type']
        })
    
    update_progress(100, "Génération terminée !")
    return True, serializable_schedule

def run_genetic_algorithm(semester_codes, task_id=None, custom_data=None, progress_callback=None, cancel_check=None):
    # Keeping old GA for forecasting as requested
    def update_progress(p, msg=None):
        if progress_callback: progress_callback(p, msg)
        elif task_id: ScheduleTask.objects.filter(id=task_id).update(progress=p, message=msg or "Optimisation en cours...")

    def check_cancelled():
        if cancel_check and cancel_check(): raise Exception("CANCELLATION_REQUESTED")

    update_progress(5, "Initialisation GA...")
    
    if custom_data:
        filieres, locaux, teachers, comportes_list = custom_data.get('filieres'), custom_data.get('locaux'), custom_data.get('teachers'), custom_data.get('comportes')
    else:
        filieres, locaux = list(Filiere.objects.all()), list(Local.objects.all())
        teachers = list(Enseignant.objects.filter(is_active=True, role__in=['ENSEIGNANT', 'CHEF_DEPARTEMENT']).exclude(email__icontains='admin'))
        comportes_list = None
    
    days_list = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
    times = ['08:30', '10:45', '14:30', '16:45']
    all_slots = [(d, t) for d in days_list for t in times]

    requirements = []
    if comportes_list is not None:
        for cp in comportes_list:
            eligible_teachers = cp.eligible_teachers if hasattr(cp, 'eligible_teachers') else teachers
            session_types = ['CM', random.choice(['TD', 'TP'])] if cp.v_h_hebdo >= 4 else ['CM']
            for s_type in session_types:
                requirements.append({'module': cp.module, 'filiere': cp.filiere, 'semester': cp.semestre, 'eligible_teachers': eligible_teachers, 'type': s_type})
    else:
        for sem in semester_codes:
            for f in filieres:
                comportes = Comporte.objects.filter(filiere=f, semestre=sem)
                for cp in comportes:
                    eligible_teachers = list(cp.module.users_habilites.all())
                    if not eligible_teachers: eligible_teachers = teachers
                    session_types = ['CM', random.choice(['TD', 'TP'])] if cp.v_h_hebdo == 4 else ['CM']
                    for s_type in session_types:
                        requirements.append({'module': cp.module, 'filiere': f, 'semester': sem, 'eligible_teachers': eligible_teachers, 'type': s_type})

    if not requirements: return False, "Aucun module trouvé."

    # GA Evolution logic (simplified for restoration)
    # ... (Keeping the original structure for Prevision)
    # Since the user requested keeping GA for prevision, I'll keep the full logic here
    POPULATION_SIZE, GENERATIONS, MUTATION_RATE = 50, 100, 0.1
    amphis = [r for r in locaux if r.is_amphi]
    classrooms = [r for r in locaux if not r.is_amphi]

    def create_individual():
        ind = []
        for req in requirements:
            room = random.choice(amphis if req['type'] == 'CM' and amphis else locaux)
            ind.append({'module': req['module'], 'teacher': random.choice(req['eligible_teachers']), 'filiere': req['filiere'], 'semester': req['semester'], 'slot': random.randint(0, len(all_slots)-1), 'room': room, 'type': req['type']})
        return ind

    def calc_fitness(ind):
        penalty, t_slots, r_slots, g_slots = 0, {}, {}, {}
        for g in ind:
            key_t, key_r, key_g = (g['teacher'].id, g['slot']), (g['room'].id, g['slot']), (g['filiere'].id, g['semester'], g['slot'])
            if key_t in t_slots: penalty += 1000
            t_slots[key_t] = 1
            if key_r in r_slots: penalty += 1000
            r_slots[key_r] = 1
            if key_g in g_slots: penalty += 1000
            g_slots[key_g] = 1
        return 1/(1+penalty)

    pop = [create_individual() for _ in range(POPULATION_SIZE)]
    for gen in range(GENERATIONS):
        check_cancelled()
        pop = sorted(pop, key=calc_fitness, reverse=True)
        if calc_fitness(pop[0]) == 1.0: break
        new_pop = pop[:10]
        while len(new_pop) < POPULATION_SIZE:
            p1, p2 = random.sample(pop[:20], 2)
            split = random.randint(0, len(p1)-1)
            child = p1[:split] + p2[split:]
            if random.random() < MUTATION_RATE:
                idx = random.randint(0, len(child)-1)
                child[idx]['slot'] = random.randint(0, len(all_slots)-1)
            new_pop.append(child)
        pop = new_pop

    best = pop[0]
    periods = {p.semester: p for p in SemesterPeriod.objects.filter(semester__in=semester_codes)}
    days_map_idx = {'Lundi': 0, 'Mardi': 1, 'Mercredi': 2, 'Jeudi': 3, 'Vendredi': 4, 'Samedi': 5}
    res = []
    for g in best:
        sem, slot_idx = g['semester'], g['slot']
        day_name = days_list[slot_idx // 4]
        period, preview_date = periods.get(sem), None
        if period:
            target_day = days_map_idx[day_name]
            preview_date = period.date_debut
            while preview_date.weekday() != target_day: preview_date += timedelta(days=1)
        res.append({
            'module_id': g['module'].id, 'module_name': g['module'].nom,
            'teacher_id': g['teacher'].id, 'teacher_name': str(g['teacher']),
            'filiere_id': g['filiere'].id, 'filiere_name': str(g['filiere']),
            'semester': sem, 'slot': slot_idx, 'day': day_name,
            'room_id': g['room'].id, 'room_name': str(g['room']),
            'date': preview_date.strftime('%Y-%m-%d') if preview_date else None,
            'startTime': times[slot_idx % 4], 'type': g['type']
        })
    update_progress(100, "Génération terminée !")
    return True, res
