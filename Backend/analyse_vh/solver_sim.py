import random
import copy
from core.models import Filiere, Module, Comporte, Local, Sceance
from users.models import Enseignant
from core.solver import run_genetic_algorithm

class MockObject:
    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)
        if not hasattr(self, 'id'):
            self.id = random.randint(100000, 999999)

    def __str__(self):
        # Teacher naming: Prof 1, Prof 2...
        if hasattr(self, 'email') and 'sim.com' in self.email:
            return f"Prof {self.prenom}"
        # Filiere naming: Filière 1, Filière 2...
        return getattr(self, 'nom', getattr(self, 'name', 'Mock'))

def run_simulation_timetable(sim_params, progress_callback=None):
    """
    Runs a master-week simulation using the GENETIC ALGORITHM.
    Properly integrates all new resources (profs, locals, filieres, courses).
    """
    # 1. Load and Mock Resources
    actual_filieres = list(Filiere.objects.all())
    actual_locaux = list(Local.objects.all())
    actual_teachers = list(Enseignant.objects.all())
    
    sim_teachers = []
    for i in range(sim_params.get('nb_profs_ajoutes', 0)):
        t = MockObject(id=20000+i, nom="Prof", prenom=f"{i+1}", email=f"prof{i+1}@sim.com")
        sim_teachers.append(t)
        
    sim_locaux = []
    for i in range(sim_params.get('nb_locaux_ajoutes', 0)):
        l = MockObject(id=30000+i, bloc="SIM", name=f"Salle Sim {i+1}", numero=f"S{i+1}", is_amphi=False)
        sim_locaux.append(l)
        
    all_teachers = actual_teachers + sim_teachers
    all_locaux = actual_locaux + sim_locaux
    
    # 2. Build Requirements (Comportes)
    virtual_comportes = []
    
    # A. Existing Filieres & Modules
    # We include all semesters for a full departmental view
    real_comportes = Comporte.objects.all()
    for cp in real_comportes:
        # Crucial: Allow NEW profs to take existing classes too
        cp.eligible_teachers = list(cp.module.users_habilites.all()) + sim_teachers
        if not cp.eligible_teachers: cp.eligible_teachers = all_teachers
        virtual_comportes.append(cp)
        
    # B. New Simulated Filieres (6 semesters each)
    for i in range(sim_params.get('nb_filieres_ajoutees', 0)):
        f = MockObject(id=10000+i, nom=f"Filière {i+1}", niveaux="Licence_Sim")
        
        # 6 semesters: S1, S2, S3, S4, S5, S6
        for s_idx in range(1, 7):
            semester_name = f"S{s_idx}"
            
            # 5 modules with 4h (CM + TD/TP)
            for m_idx in range(5):
                m = MockObject(id=40000 + (i*100) + (s_idx*10) + m_idx, nom=f"Module 4h-{m_idx+1} ({f.nom} {semester_name})")
                cp = MockObject(
                    filiere=f, module=m, semestre=semester_name, v_h_hebdo=4,
                    eligible_teachers=all_teachers
                )
                virtual_comportes.append(cp)
            
            # 2 modules with 2h (CM only)
            for m_idx in range(5, 7):
                m = MockObject(id=40000 + (i*100) + (s_idx*10) + m_idx, nom=f"Module 2h-{m_idx-4} ({f.nom} {semester_name})")
                cp = MockObject(
                    filiere=f, module=m, semestre=semester_name, v_h_hebdo=2,
                    eligible_teachers=all_teachers
                )
                virtual_comportes.append(cp)

    # C. Additional Individual Courses
    for i in range(sim_params.get('nb_nouveaux_cours', 0)):
        # Assign these to the first filiere or a generic one
        target_f = actual_filieres[0] if actual_filieres else (sim_filieres[0] if 'sim_filieres' in locals() else None)
        if target_f:
            m = MockObject(id=50000+i, nom=f"Cours Supp {i+1}")
            cp = MockObject(
                filiere=target_f, module=m, semestre='S1', v_h_hebdo=2,
                eligible_teachers=all_teachers
            )
            virtual_comportes.append(cp)
            
    # 3. RUN THE GENETIC ALGORITHM
    # Pass everything to the unified solver
    success, result_data = run_genetic_algorithm(
        semester_codes=['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'M1', 'M2', 'M3', 'M4'], 
        custom_data={
            'filieres': actual_filieres + [c.filiere for c in virtual_comportes if hasattr(c.filiere, 'description') and c.filiere.description == "Simulation"], # simplified
            'locaux': all_locaux,
            'teachers': all_teachers,
            'comportes': virtual_comportes
        },
        progress_callback=progress_callback
    )
    
    return result_data if success else []
