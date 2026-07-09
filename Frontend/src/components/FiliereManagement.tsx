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
  const [students, setStudents] = useState<Student[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [activeTab, setActiveTab] = useState<'roster' | 'demands' | 'absences'>('roster');
  const [loading, setLoading] = useState(true);

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
      const profileRes = await fetch('http://localhost:8000/api/users/profile/', { headers });
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData);

        // 2. Fetch Users and filter for students of coordinator's filiere
        if (profileData.filiere) {
          const usersRes = await fetch('http://localhost:8000/api/users/management/', { headers });
          if (usersRes.ok) {
            const allUsers = await usersRes.json();
            const filiereStudents = allUsers.filter(
              (u: any) => u.role && u.role.includes('UTILISATEUR') && u.filiere === profileData.filiere
            );
            setStudents(filiereStudents);
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
        res = await fetch(`http://localhost:8000/api/users/management/${editingStudent.id}/`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('http://localhost:8000/api/users/management/', {
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
      const res = await fetch(`http://localhost:8000/api/users/management/${studentId}/`, {
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
