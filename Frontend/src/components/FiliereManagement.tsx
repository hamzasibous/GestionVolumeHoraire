import { API_BASE_URL } from '../config/api';
import React, { useState, useEffect } from 'react';

interface Student {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  tel: string;
  role: string;
  filiere: number;
  filiere_name: string;
  is_active: boolean;
}

interface RequestItem {
  id: number;
  type: string;
  date: string;
  status: string;
  details: string;
  studentName?: string;
  studentEmail?: string;
  filiere?: number | null;
}

const FiliereManagement: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [filiereDetails, setFiliereDetails] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [activeTab, setActiveTab] = useState<'roster' | 'demands' | 'absences' | 'workload'>('roster');
  const [loading, setLoading] = useState(true);
  const [workloadSearch, setWorkloadSearch] = useState('');
  const [workloadSemester, setWorkloadSemester] = useState('ALL');
  const [allTeachers, setAllTeachers] = useState<any[]>([]);

  // Student Modals
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentForm, setStudentForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    tel: ''
  });

  const token = localStorage.getItem('access_token');
  const headers: HeadersInit = token ? {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  } : {};

  const fetchData = async () => {
    try {
      // 1. Fetch Profile
      const profileRes = await fetch(`${API_BASE_URL}/api/users/profile/`, { headers });
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData);

        // 2. Fetch Users and filter for students of coordinator's filiere
        if (profileData.filiere) {
          const usersRes = await fetch(`${API_BASE_URL}/api/users/management/`, { headers });
          if (usersRes.ok) {
            const allUsers = await usersRes.json();
            const filiereStudents = allUsers.filter(
              (u: any) => u.role && u.role.includes('UTILISATEUR') && u.filiere === profileData.filiere
            );
            setStudents(filiereStudents);

            const teachers = allUsers.filter(
              (u: any) => u.role && u.role.includes('ENSEIGNANT') && !u.email.includes('admin')
            );
            setAllTeachers(teachers);
          }

          // Fetch Filiere details
          const detailsRes = await fetch(`${API_BASE_URL}/api/core/filiere/details/`, { headers });
          if (detailsRes.ok) {
            const detailsList = await detailsRes.json();
            const myFiliere = detailsList.find((f: any) => f.id === profileData.filiere);
            setFiliereDetails(myFiliere);
          }

        }
      }

      // 3. Load student requests from localStorage
      const savedRequests = JSON.parse(localStorage.getItem('student_requests') || '[]');
      setRequests(savedRequests);

    } catch (error) {
      console.error('Error fetching filiere management data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter requests by coordinator's filiere
  const getFiliereDemands = () => {
    if (!profile) return [];
    return requests.filter(r => r.type !== 'Absence' && r.filiere === profile.filiere);
  };

  const getFiliereAbsences = () => {
    if (!profile) return [];
    return requests.filter(r => r.type === 'Absence' && r.filiere === profile.filiere);
  };

  // Manage Request Status
  const handleUpdateStatus = (requestId: number, newStatus: string) => {
    const updated = requests.map(r => r.id === requestId ? { ...r, status: newStatus } : r);
    setRequests(updated);
    localStorage.setItem('student_requests', JSON.stringify(updated));
  };

  // Add or Edit Student
  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.filiere) return;

    try {
      const payload = {
        nom: studentForm.nom,
        prenom: studentForm.prenom,
        email: studentForm.email,
        tel: studentForm.tel,
        role: 'UTILISATEUR',
        filiere: profile.filiere,
        departement: profile.departement || 1,
        specialite: 'INFORMATIQUE',
        is_active: true
      };

      let res;
      if (editingStudent) {
        res = await fetch(`${API_BASE_URL}/api/users/management/${editingStudent.id}/`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_BASE_URL}/api/users/management/`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ ...payload, password: 'Umi2024!' })
        });
      }

      if (res.ok) {
        setIsStudentModalOpen(false);
        setStudentForm({ nom: '', prenom: '', email: '', tel: '' });
        setEditingStudent(null);
        await fetchData();
      } else {
        const err = await res.json();
        alert(`Erreur: ${JSON.stringify(err)}`);
      }
    } catch (error) {
      console.error('Error submitting student:', error);
    }
  };

  // Delete Student
  const handleDeleteStudent = async (studentId: number) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cet étudiant ?')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/management/${studentId}/`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error deleting student:', error);
    }
  };

  const openAddModal = () => {
    setEditingStudent(null);
    setStudentForm({ nom: '', prenom: '', email: '', tel: '' });
    setIsStudentModalOpen(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setStudentForm({
      nom: student.nom,
      prenom: student.prenom,
      email: student.email,
      tel: student.tel
    });
    setIsStudentModalOpen(true);
  };
  const getModuleVolumes = (moduleName: string) => {
    let totalRaw = 50;
    const match = moduleName.match(/\((\w+)\s*-\s*(\d+)h\)/);
    if (match) {
      totalRaw = parseInt(match[2]);
    } else {
      const matchSimple = moduleName.match(/- (\d+)h/);
      if (matchSimple) {
        totalRaw = parseInt(matchSimple[1]);
      }
    }
    
    // Split formulas:
    // CM = (TotalRaw / 3.25) * 1.5
    // TD = (TotalRaw / 3.25) * 1.0
    // TP = (TotalRaw / 3.25) * 0.75
    const base = totalRaw / 3.25;
    const cm = Math.round(base * 1.5);
    const td = Math.round(base * 1.0);
    const tp = Math.round(base * 0.75);
    const eqtd = cm + td + tp;
    
    return { cm, td, tp, eqtd };
  };

  const formatTeacherDisplayName = (fullName: string) => {
    if (!fullName) return '';
    const clean = fullName.trim();
    if (clean.toLowerCase().startsWith('pr.') || clean.toLowerCase().startsWith('pr ')) {
      return clean;
    }
    return `Pr. ${clean}`;
  };

  const getTeachersWorkloads = () => {
    if (!filiereDetails || !filiereDetails.modules) return [];
    
    const teacherMap: Record<string, {
      nom: string;
      specialite: string;
      cm: number;
      td: number;
      tp: number;
      eqtd: number;
      modules: Set<string>;
    }> = {};
    
    // Initialize with all database teachers
    allTeachers.forEach((t: any) => {
      const displayName = `${t.prenom} ${t.nom}`;
      teacherMap[displayName] = {
        nom: formatTeacherDisplayName(displayName),
        specialite: t.specialite || 'INFORMATIQUE',
        cm: 0,
        td: 0,
        tp: 0,
        eqtd: 0,
        modules: new Set<string>()
      };
    });

    filiereDetails.modules.forEach((mod: any) => {
      if (workloadSemester !== 'ALL' && mod.semestre !== workloadSemester) return;

      const vols = getModuleVolumes(mod.nom);
      const seances = mod.seances || [];
      
      let cmTeacherName: string | null = null;
      let tdTeacherName: string | null = null;
      let tpTeacherName: string | null = null;
      
      const teacherInfoMap: Record<string, { email: string; specialite: string }> = {};

      seances.forEach((s: any) => {
        if (!s.enseignant) return;
        const tName = s.enseignant_name || 'Enseignant';
        teacherInfoMap[tName] = {
          email: s.enseignant_email || '',
          specialite: s.enseignant_email ? (s.enseignant_email.includes('admin') ? 'ADMIN' : 'INFORMATIQUE') : 'INFORMATIQUE'
        };
        
        if (s.type === 'CM') cmTeacherName = tName;
        else if (s.type === 'TD') tdTeacherName = tName;
        else if (s.type === 'TP') tpTeacherName = tName;
      });

      if (!cmTeacherName && !tdTeacherName && !tpTeacherName) return;

      const primaryTeacherName = cmTeacherName || tdTeacherName || tpTeacherName;
      if (!primaryTeacherName) return;

      const getOrInitTeacher = (tName: string) => {
        let matchedKey = Object.keys(teacherMap).find(k => 
          k.toLowerCase().includes(tName.toLowerCase()) || 
          tName.toLowerCase().includes(k.toLowerCase())
        ) || '';
        
        if (!matchedKey || !teacherMap[matchedKey]) {
          const info = teacherInfoMap[tName] || { email: '', specialite: 'INFORMATIQUE' };
          teacherMap[tName] = {
            nom: formatTeacherDisplayName(tName),
            specialite: info.specialite,
            cm: 0,
            td: 0,
            tp: 0,
            eqtd: 0,
            modules: new Set<string>()
          };
          matchedKey = tName;
        }
        teacherMap[matchedKey].modules.add(mod.nom);
        return teacherMap[matchedKey];
      };

      const cmTarget = cmTeacherName || primaryTeacherName;
      getOrInitTeacher(cmTarget).cm += vols.cm;

      const tdTarget = tdTeacherName || primaryTeacherName;
      getOrInitTeacher(tdTarget).td += vols.td;

      const tpTarget = tpTeacherName || primaryTeacherName;
      getOrInitTeacher(tpTarget).tp += vols.tp;
    });
    
    let list = Object.values(teacherMap).map((t, idx) => {
      t.eqtd = t.cm + t.td + t.tp;
      return {
        id: `t-${idx}`,
        nom: t.nom,
        specialite: t.specialite,
        cm: t.cm,
        td: t.td,
        tp: t.tp,
        eqtd: t.eqtd,
        modulesList: Array.from(t.modules).join(', ')
      };
    });

    if (workloadSemester !== 'ALL') {
      list = list.filter(t => t.eqtd > 0);
    } else {
      list = list.sort((a, b) => {
        if (a.eqtd > 0 && b.eqtd === 0) return -1;
        if (a.eqtd === 0 && b.eqtd > 0) return 1;
        return a.nom.localeCompare(b.nom);
      });
    }

    if (workloadSearch) {
      const q = workloadSearch.toLowerCase();
      list = list.filter(t => 
        t.nom.toLowerCase().includes(q) || 
        t.modulesList.toLowerCase().includes(q)
      );
    }

    return list;
  };

  const handleExportCSV = () => {
    if (!filiereDetails) return;
    
    let csvContent = "\uFEFF"; // BOM for UTF-8 Excel support
    
    csvContent += "VOLUME HORAIRE DES MODULES\n";
    csvContent += "Semestre,Module,CM (EqTD),TD (EqTD),TP (EqTD),Total (EqTD),Enseignants affectes\n";
    
    let filteredMods = filiereDetails.modules || [];
    if (workloadSemester !== 'ALL') {
      filteredMods = filteredMods.filter((m: any) => m.semestre === workloadSemester);
    }
    if (workloadSearch) {
      const q = workloadSearch.toLowerCase();
      filteredMods = filteredMods.filter((m: any) => m.nom.toLowerCase().includes(q));
    }
    
    filteredMods.forEach((mod: any) => {
      const vols = getModuleVolumes(mod.nom);
      const semester = mod.semestre || 'N/A';
      const teacherNames = Array.from(new Set(
        (mod.seances || [])
          .filter((s: any) => s.enseignant)
          .map((s: any) => `Pr. ${s.enseignant_name} (${s.type})`)
      )).join('; ');
      
      csvContent += `"${semester}","${mod.nom.replace(/"/g, '""')}",${vols.cm},${vols.td},${vols.tp},${vols.eqtd},"${teacherNames.replace(/"/g, '""')}"\n`;
    });
    
    // Removed teacher workloads section
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Volume_Horaire_Filiere_${profile?.filiere_name || 'Filiere'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-md">
        <div>
          <p className="font-label-caps text-label-caps text-primary opacity-70 mb-xs uppercase">Espace Coordinateur</p>
          <h1 className="font-h1 text-h1 text-on-background">Gestion de la filière {profile?.filiere_name || 'N/A'}</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
            Gérez les inscriptions des étudiants, les demandes administratives et le suivi des absences.
          </p>
        </div>
        
        {activeTab === 'roster' && (
          <button 
            onClick={openAddModal}
            className="flex items-center gap-xs bg-primary text-on-primary px-md py-sm rounded-lg font-label-caps text-label-caps hover:bg-on-primary-fixed-variant transition-all cursor-pointer border-0"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Inscrire un Étudiant
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-outline-variant">
        <button
          onClick={() => setActiveTab('roster')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all border-b-2 bg-transparent cursor-pointer ${
            activeTab === 'roster' 
              ? 'text-primary border-primary font-bold' 
              : 'text-on-surface-variant border-transparent hover:text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-lg">groups</span>
          Roster Étudiants ({students.length})
        </button>
        <button
          onClick={() => setActiveTab('demands')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all border-b-2 bg-transparent cursor-pointer ${
            activeTab === 'demands' 
              ? 'text-primary border-primary font-bold' 
              : 'text-on-surface-variant border-transparent hover:text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-lg">description</span>
          Demandes Documents ({getFiliereDemands().length})
        </button>
        <button
          onClick={() => setActiveTab('absences')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all border-b-2 bg-transparent cursor-pointer ${
            activeTab === 'absences' 
              ? 'text-primary border-primary font-bold' 
              : 'text-on-surface-variant border-transparent hover:text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-lg">assignment_late</span>
          Absences déclarées ({getFiliereAbsences().length})
        </button>
        <button
          onClick={() => setActiveTab('workload')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all border-b-2 bg-transparent cursor-pointer ${
            activeTab === 'workload' 
              ? 'text-primary border-primary font-bold' 
              : 'text-on-surface-variant border-transparent hover:text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-lg">monitoring</span>
          Volume Horaire
        </button>
      </div>

      {/* Roster Tab */}
      {activeTab === 'roster' && (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-md">
          {students.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl text-slate-350 mb-2">person_off</span>
              <p className="text-sm italic">Aucun étudiant inscrit dans cette filière.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant">
                    <th className="font-label-caps text-label-caps py-base">Nom Complet</th>
                    <th className="font-label-caps text-label-caps py-base">Email</th>
                    <th className="font-label-caps text-label-caps py-base">Téléphone</th>
                    <th className="font-label-caps text-label-caps py-base text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="py-sm font-semibold">{student.nom} {student.prenom}</td>
                      <td className="py-sm text-sm text-on-surface-variant">{student.email}</td>
                      <td className="py-sm text-sm text-on-surface-variant">{student.tel || 'Non renseigné'}</td>
                      <td className="py-sm text-right flex justify-end gap-sm">
                        <button 
                          onClick={() => openEditModal(student)}
                          className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline bg-transparent border-0 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]">edit</span>
                          Modifier
                        </button>
                        <button 
                          onClick={() => handleDeleteStudent(student.id)}
                          className="flex items-center gap-1 text-[11px] font-bold text-red-650 hover:underline bg-transparent border-0 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Demands Tab */}
      {activeTab === 'demands' && (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-md">
          {getFiliereDemands().length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl text-slate-350 mb-2">drafts</span>
              <p className="text-sm italic">Aucune demande administrative en attente.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant">
                    <th className="font-label-caps text-label-caps py-base">Étudiant</th>
                    <th className="font-label-caps text-label-caps py-base">Type</th>
                    <th className="font-label-caps text-label-caps py-base">Détails</th>
                    <th className="font-label-caps text-label-caps py-base">Statut actuel</th>
                    <th className="font-label-caps text-label-caps py-base text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container">
                  {getFiliereDemands().map((req) => (
                    <tr key={req.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="py-sm">
                        <p className="font-semibold text-sm">{req.studentName || 'Nom inconnu'}</p>
                        <p className="text-[11px] text-on-surface-variant">{req.studentEmail}</p>
                      </td>
                      <td className="py-sm text-sm font-semibold">{req.type}</td>
                      <td className="py-sm text-sm text-on-surface-variant">{req.details}</td>
                      <td className="py-sm">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          req.status === 'Délivré' ? 'bg-green-50 text-green-700' :
                          req.status === 'Refusé' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="py-sm text-right flex justify-end gap-sm">
                        {req.status === 'En cours' && (
                          <>
                            <button 
                              onClick={() => handleUpdateStatus(req.id, 'Délivré')}
                              className="text-[11px] font-bold text-green-700 hover:underline bg-transparent border-0 cursor-pointer"
                            >
                              Délivrer
                            </button>
                            <button 
                              onClick={() => handleUpdateStatus(req.id, 'Refusé')}
                              className="text-[11px] font-bold text-red-650 hover:underline bg-transparent border-0 cursor-pointer"
                            >
                              Refuser
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Absences Tab */}
      {activeTab === 'absences' && (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-md">
          {getFiliereAbsences().length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl text-slate-350 mb-2">check_circle</span>
              <p className="text-sm italic">Aucune absence déclarée.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant">
                    <th className="font-label-caps text-label-caps py-base">Étudiant</th>
                    <th className="font-label-caps text-label-caps py-base">Date</th>
                    <th className="font-label-caps text-label-caps py-base">Motif</th>
                    <th className="font-label-caps text-label-caps py-base">Statut actuel</th>
                    <th className="font-label-caps text-label-caps py-base text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container">
                  {getFiliereAbsences().map((req) => (
                    <tr key={req.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="py-sm">
                        <p className="font-semibold text-sm">{req.studentName || 'Nom inconnu'}</p>
                        <p className="text-[11px] text-on-surface-variant">{req.studentEmail}</p>
                      </td>
                      <td className="py-sm text-sm">{req.date}</td>
                      <td className="py-sm text-sm text-on-surface-variant">{req.details}</td>
                      <td className="py-sm">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          req.status === 'Justifiée' ? 'bg-green-50 text-green-700' :
                          req.status === 'Non justifiée' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="py-sm text-right flex justify-end gap-sm">
                        {req.status === 'En attente' && (
                          <>
                            <button 
                              onClick={() => handleUpdateStatus(req.id, 'Justifiée')}
                              className="text-[11px] font-bold text-green-700 hover:underline bg-transparent border-0 cursor-pointer"
                            >
                              Justifier
                            </button>
                            <button 
                              onClick={() => handleUpdateStatus(req.id, 'Non justifiée')}
                              className="text-[11px] font-bold text-red-650 hover:underline bg-transparent border-0 cursor-pointer"
                            >
                              Rejeter
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Workload Tab */}
      {activeTab === 'workload' && (
        <div className="space-y-6">
          {/* Controls Bar: Filters & Export */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-800">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              {/* Search Bar */}
              <div className="relative flex-1 sm:flex-initial min-w-[240px]">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                <input 
                  type="text"
                  value={workloadSearch}
                  onChange={e => setWorkloadSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                  placeholder="Rechercher un module ou enseignant..." 
                />
              </div>

              {/* Semester Dropdown */}
              <select
                value={workloadSemester}
                onChange={e => setWorkloadSemester(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer"
              >
                <option value="ALL">Tous les semestres</option>
                <option value="S1">Semestre 1</option>
                <option value="S2">Semestre 2</option>
                <option value="S3">Semestre 3</option>
                <option value="S4">Semestre 4</option>
                <option value="S5">Semestre 5</option>
                <option value="S6">Semestre 6</option>
              </select>
            </div>

            {/* Export Button */}
            <button
              onClick={handleExportCSV}
              className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-emerald-700 transition-all cursor-pointer border-0 w-full sm:w-auto shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Exporter (CSV)
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-800">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-sky-500/10 text-sky-600 rounded-xl">
                <span className="material-symbols-outlined text-2xl">menu_book</span>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Modules de la Filière</p>
                <p className="text-2xl font-black text-slate-800">
                  {filiereDetails?.modules?.filter((m: any) => {
                    const matchesSem = workloadSemester === 'ALL' || m.semestre === workloadSemester;
                    const matchesSearch = !workloadSearch || m.nom.toLowerCase().includes(workloadSearch.toLowerCase());
                    return matchesSem && matchesSearch;
                  }).length || 0}
                </p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
                <span className="material-symbols-outlined text-2xl">schedule</span>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Volume Horaire Global (EqTD)</p>
                <p className="text-2xl font-black text-slate-800">
                  {filiereDetails?.modules?.filter((m: any) => {
                    const matchesSem = workloadSemester === 'ALL' || m.semestre === workloadSemester;
                    const matchesSearch = !workloadSearch || m.nom.toLowerCase().includes(workloadSearch.toLowerCase());
                    return matchesSem && matchesSearch;
                  }).reduce((acc: number, mod: any) => acc + getModuleVolumes(mod.nom).eqtd, 0) || 0}h
                </p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-xl">
                <span className="material-symbols-outlined text-2xl">supervisor_account</span>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Enseignants Intervenants</p>
                <p className="text-2xl font-black text-slate-800">{getTeachersWorkloads().length}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 text-slate-800">
            {/* Table 1: Volume Horaire des Modules */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <h3 className="font-h3 text-base font-black text-slate-800 uppercase tracking-tight">Volume Horaire des Modules</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                      <th className="py-3 px-4">Semestre</th>
                      <th className="py-3 px-4">Module</th>
                      <th className="py-3 px-4 text-center">CM (EqTD)</th>
                      <th className="py-3 px-4 text-center">TD (EqTD)</th>
                      <th className="py-3 px-4 text-center">TP (EqTD)</th>
                      <th className="py-3 px-4 text-center font-black text-slate-700">Total (EqTD)</th>
                      <th className="py-3 px-4">Enseignants</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                    {filiereDetails?.modules?.filter((mod: any) => {
                      const matchesSem = workloadSemester === 'ALL' || mod.semestre === workloadSemester;
                      const matchesSearch = !workloadSearch || mod.nom.toLowerCase().includes(workloadSearch.toLowerCase());
                      return matchesSem && matchesSearch;
                    }).map((mod: any) => {
                      const vols = getModuleVolumes(mod.nom);
                      const semester = mod.semestre || 'N/A';
                      const teacherNames = Array.from(new Set(
                        (mod.seances || [])
                          .filter((s: any) => s.enseignant)
                          .map((s: any) => `${formatTeacherDisplayName(s.enseignant_name)} (${s.type})`)
                      )).join(', ');

                      return (
                        <tr key={mod.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-primary">{semester}</td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800">{mod.nom}</td>
                          <td className="py-3.5 px-4 text-center font-medium">{vols.cm}h</td>
                          <td className="py-3.5 px-4 text-center font-medium">{vols.td}h</td>
                          <td className="py-3.5 px-4 text-center font-medium">{vols.tp}h</td>
                          <td className="py-3.5 px-4 text-center font-black text-slate-800 bg-slate-50/50">{vols.eqtd}h</td>
                          <td className="py-3.5 px-4 text-slate-500 italic font-medium">{teacherNames || 'Aucun enseignant affecté'}</td>
                        </tr>
                      );
                    })}
                    {(!filiereDetails?.modules || filiereDetails.modules.length === 0) && (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-slate-400 italic">
                          Aucun module trouvé.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Student Modal */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-8 max-w-xl w-full shadow-2xl border border-slate-100 animate-in zoom-in duration-200 text-slate-800">
            <h3 className="font-h3 text-h3 text-slate-900 mb-6">
              {editingStudent ? 'Modifier l\'Étudiant' : 'Inscrire un nouvel Étudiant'}
            </h3>
            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nom</label>
                  <input 
                    type="text"
                    required
                    value={studentForm.nom}
                    onChange={(e) => setStudentForm({ ...studentForm, nom: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Prénom</label>
                  <input 
                    type="text"
                    required
                    value={studentForm.prenom}
                    onChange={(e) => setStudentForm({ ...studentForm, prenom: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email</label>
                <input 
                  type="email"
                  required
                  value={studentForm.email}
                  onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Téléphone</label>
                <input 
                  type="text"
                  value={studentForm.tel}
                  onChange={(e) => setStudentForm({ ...studentForm, tel: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              
              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsStudentModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg py-2 text-xs font-bold uppercase tracking-widest cursor-pointer border-0"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-primary hover:bg-on-primary-fixed-variant text-white rounded-lg py-2 text-xs font-bold uppercase tracking-widest cursor-pointer border-0"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default FiliereManagement;
