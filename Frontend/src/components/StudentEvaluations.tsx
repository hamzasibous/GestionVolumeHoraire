import React, { useState, useEffect } from 'react';

interface Student {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  filiere: number;
  filiere_name: string;
}

interface ModuleAssignment {
  id: string; // e.g. "m448-CM"
  code: string;
  name: string;
  type: string;
  hours: number;
}

interface Evaluation {
  note: string;
  appreciation: string;
  status: string;
}

const StudentEvaluations: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<ModuleAssignment[]>([]);
  const [filieres, setFilieres] = useState<any[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedModule, setSelectedModule] = useState<ModuleAssignment | null>(null);
  
  // Local storage state for evaluations
  // Key format: eval_{moduleId}_{studentId}
  const [evaluations, setEvaluations] = useState<{ [key: string]: Evaluation }>({});

  useEffect(() => {
    // Load evaluations from localStorage
    const savedEvals = JSON.parse(localStorage.getItem('student_evaluations') || '{}');
    setEvaluations(savedEvals);

    const fetchData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

        // 1. Fetch professor's assignments
        const assignmentsRes = await fetch('http://localhost:8000/api/core/my-assignments/', { headers });
        let rawAssignments: ModuleAssignment[] = [];
        if (assignmentsRes.ok) {
          const data = await assignmentsRes.json();
          rawAssignments = data.assignments || [];
          
          // Deduplicate assignments by module name
          const uniqueAssignments: ModuleAssignment[] = [];
          const seenNames = new Set<string>();
          for (const asg of rawAssignments) {
            if (!seenNames.has(asg.name)) {
              seenNames.add(asg.name);
              uniqueAssignments.push(asg);
            }
          }
          setAssignments(uniqueAssignments);
          if (uniqueAssignments.length > 0) {
            setSelectedModule(uniqueAssignments[0]);
          }
        }

        // 2. Fetch all filieres details (to map module to filiere)
        const filieresRes = await fetch('http://localhost:8000/api/core/filiere/details/', { headers });
        if (filieresRes.ok) {
          const data = await filieresRes.json();
          setFilieres(data);
        }

        // 3. Fetch all users and filter for students
        const usersRes = await fetch('http://localhost:8000/api/users/management/', { headers });
        if (usersRes.ok) {
          const data = await usersRes.json();
          const allStudents = data.filter((u: any) => u.role && u.role.includes('UTILISATEUR'));
          setStudents(allStudents);
        }

      } catch (error) {
        console.error('Error fetching evaluations data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Determine which students belong to the selected module
  const getSelectedModuleStudents = () => {
    if (!selectedModule) return [];
    
    // 1. Find which filiere(s) contain this module
    // We match by name or by module ID if we parse it from code
    const modIdStr = selectedModule.code.replace('MOD', '');
    const modId = parseInt(modIdStr);

    const matchingFiliereIds = new Set<number>();
    for (const fil of filieres) {
      if (fil.modules && fil.modules.some((m: any) => m.id === modId)) {
        matchingFiliereIds.add(fil.id);
      }
    }

    // 2. Filter students belonging to these filieres
    return students.filter(s => s.filiere && matchingFiliereIds.has(s.filiere));
  };

  const handleEvaluationChange = (studentId: number, field: keyof Evaluation, value: string) => {
    if (!selectedModule) return;
    const modIdStr = selectedModule.code.replace('MOD', '');
    const evalKey = `eval_${modIdStr}_${studentId}`;

    const newEvals = {
      ...evaluations,
      [evalKey]: {
        ...evaluations[evalKey] || { note: '', appreciation: '', status: 'Non évalué' },
        [field]: value
      }
    };
    setEvaluations(newEvals);
    localStorage.setItem('student_evaluations', JSON.stringify(newEvals));
  };

  const activeStudents = getSelectedModuleStudents();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="material-symbols-outlined text-4xl text-primary animate-spin">sync</span>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto p-gutter lg:p-lg space-y-lg text-on-surface">
      
      {/* Header */}
      <div>
        <p className="font-label-caps text-label-caps text-primary opacity-70 mb-xs uppercase">Espace Enseignant</p>
        <h1 className="font-h1 text-h1 text-on-background">Évaluation des Étudiants</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
          Sélectionnez un module pour évaluer les compétences des étudiants inscrits.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-gutter">
        
        {/* Left Side: Modules List */}
        <div className="col-span-12 md:col-span-4 bg-surface-container-lowest rounded-xl border border-outline-variant p-md space-y-sm">
          <h3 className="font-h3 text-h3 mb-md flex items-center gap-xs">
            <span className="material-symbols-outlined text-primary">book</span>
            Mes Modules
          </h3>
          <div className="space-y-xs">
            {assignments.length === 0 ? (
              <p className="text-sm text-on-surface-variant italic">Aucun module assigné.</p>
            ) : (
              assignments.map((asg) => (
                <button
                  key={asg.id}
                  onClick={() => setSelectedModule(asg)}
                  className={`w-full text-left p-sm rounded-lg border transition-all cursor-pointer ${
                    selectedModule?.id === asg.id
                      ? 'bg-primary-container text-on-primary-container border-primary font-bold shadow-sm'
                      : 'border-outline-variant hover:bg-surface-container-low hover:border-outline'
                  }`}
                >
                  <p className="text-[10px] font-bold uppercase opacity-75">{asg.code}</p>
                  <p className="text-sm font-semibold truncate">{asg.name}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Students Roster & Evaluation Form */}
        <div className="col-span-12 md:col-span-8 bg-surface-container-lowest rounded-xl border border-outline-variant p-md">
          {selectedModule ? (
            <div className="space-y-lg">
              <div className="flex justify-between items-start border-b border-outline-variant pb-md">
                <div>
                  <span className="bg-primary text-white text-[10px] px-sm py-[2px] rounded font-bold uppercase">
                    {selectedModule.code}
                  </span>
                  <h2 className="font-h2 text-h2 mt-xs">{selectedModule.name}</h2>
                </div>
                <div className="text-right">
                  <span className="font-label-caps text-label-caps text-on-surface-variant">Effectif</span>
                  <p className="font-h3 text-h3 text-primary">{activeStudents.length} Étudiants</p>
                </div>
              </div>

              {activeStudents.length === 0 ? (
                <div className="text-center py-12 text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">group_off</span>
                  <p className="text-sm italic">Aucun étudiant inscrit dans la filière de ce module.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-outline-variant">
                        <th className="font-label-caps text-label-caps py-base">Étudiant</th>
                        <th className="font-label-caps text-label-caps py-base w-[100px]">Note (/20)</th>
                        <th className="font-label-caps text-label-caps py-base w-[180px]">Statut</th>
                        <th className="font-label-caps text-label-caps py-base">Appréciation / Observation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container">
                      {activeStudents.map((s) => {
                        const modIdStr = selectedModule.code.replace('MOD', '');
                        const evalKey = `eval_${modIdStr}_${s.id}`;
                        const currentEval = evaluations[evalKey] || { note: '', appreciation: '', status: 'Non évalué' };

                        return (
                          <tr key={s.id} className="hover:bg-surface-container-low transition-colors">
                            <td className="py-sm">
                              <p className="font-body-md text-body-md font-bold">{s.nom} {s.prenom}</p>
                              <p className="text-[11px] text-on-surface-variant">{s.email}</p>
                            </td>
                            <td className="py-sm pr-xs">
                              <input
                                type="text"
                                placeholder="--"
                                value={currentEval.note}
                                onChange={(e) => handleEvaluationChange(s.id, 'note', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white"
                              />
                            </td>
                            <td className="py-sm pr-xs">
                              <select
                                value={currentEval.status}
                                onChange={(e) => handleEvaluationChange(s.id, 'status', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white"
                              >
                                <option>Non évalué</option>
                                <option>Acquis</option>
                                <option>En cours</option>
                                <option>Non acquis</option>
                              </select>
                            </td>
                            <td className="py-sm">
                              <input
                                type="text"
                                placeholder="Ajouter un commentaire..."
                                value={currentEval.appreciation}
                                onChange={(e) => handleEvaluationChange(s.id, 'appreciation', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 text-on-surface-variant">
              <span className="material-symbols-outlined text-5xl text-slate-300 mb-2">library_books</span>
              <p className="text-base italic">Sélectionnez un module dans le panneau de gauche pour commencer l'évaluation.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default StudentEvaluations;
