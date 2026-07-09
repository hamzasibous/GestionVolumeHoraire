import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface Seance {
  id: string;
  name: string;
  type: 'CM' | 'TD' | 'TP';
  teacher: string;
  teacherEmail?: string;
  teacherTel?: string;
  room: string;
  volume: number;
}

interface Module {
  id: string;
  name: string;
  totalHours: number;
  assignedHours: number;
  seances: Seance[];
}

interface Filiere {
  id: string;
  name: string;
  level: string;
  description: string;
  modules: Module[];
}

const ProgramsManagement: React.FC = () => {
  const { t } = useTranslation();
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [selectedFiliereId, setSelectedFiliereId] = useState<string>('');
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<'All' | 'Licence' | 'Master'>('All');

  const [isFiliereModalOpen, setIsFiliereModalOpen] = useState(false);
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [editingFiliere, setEditingFiliere] = useState<any>(null);
  const [editingModule, setEditingModule] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

      const profileRes = await fetch('http://localhost:8000/api/users/profile/', { headers });
      let profile = null;
      if (profileRes.ok) {
        profile = await profileRes.json();
        setCurrentUser(profile);
      }

      const response = await fetch('http://localhost:8000/api/core/filiere/details/', { headers });
      const data = await response.json();
      
      let mappedData: Filiere[] = data.map((f: any) => ({
        id: f.id.toString(),
        name: f.nom,
        level: f.niveaux,
        levelDisplay: f.niveaux_display,
        description: f.description || `Programme de ${f.nom}`,
        departement: f.departement,
        modules: f.modules.map((m: any) => {
          const aggregatedSeancesMap = m.seances.reduce((acc: any, s: any) => {
            const key = s.type;
            const teacherName = (s.enseignant_name && !s.enseignant_name.includes('NoneType')) ? s.enseignant_name : null;

            if (!acc[key]) {
              acc[key] = {
                id: `${m.id}-${s.type}`,
                name: `${s.type} - ${m.nom}`,
                type: s.type,
                teacher: teacherName,
                teacherEmail: s.enseignant_email,
                teacherTel: s.enseignant_tel,
                room: s.local_name,
                volume: 0,
              };
            }
            
            let equivDuree = s.duree;
            if (s.type === 'CM') {
              equivDuree = s.duree * 1.5;
            } else if (s.type === 'TP') {
              equivDuree = s.duree * 0.75;
            }
            acc[key].volume += equivDuree;
            return acc;
          }, {});

          const totalMinutes = m.seances.reduce((acc: number, s: any) => {
            let equivDuree = s.duree;
            if (s.type === 'CM') {
              equivDuree = s.duree * 1.5;
            } else if (s.type === 'TP') {
              equivDuree = s.duree * 0.75;
            }
            return acc + equivDuree;
          }, 0);

          return {
            id: m.id.toString(),
            name: m.nom,
            totalHours: m.total_hours || 0,
            assignedHours: totalMinutes / 60,
            seancesCount: m.seances.length,
            seances: Object.values(aggregatedSeancesMap).map((s: any) => ({
              ...s,
              volume: s.volume / 60, // Convert minutes to hours
            }))
          };
        })
      }));

      const isScoped = profile && (profile.role.includes('RESPONSABLE_FILIERE') || profile.role.includes('UTILISATEUR')) && !profile.role.includes('ADMIN') && !profile.role.includes('CHEF_DEPARTEMENT');
      if (isScoped && profile.filiere) {
        mappedData = mappedData.filter((f: any) => f.id === profile.filiere.toString());
      }

      setFilieres(mappedData);
      if (mappedData.length > 0 && !selectedFiliereId) {
        setSelectedFiliereId(mappedData[0].id);
        if (mappedData[0].modules.length > 0) {
          setSelectedModuleId(mappedData[0].modules[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Fetch departments
    fetch('http://localhost:8000/api/core/departement/')
      .then(res => res.json())
      .then(data => setDepartments(data))
      .catch(err => console.error('Error fetching departments:', err));
  }, []);

  const filteredFilieres = filieres.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          f.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = levelFilter === 'All' || f.level.startsWith(levelFilter);
    return matchesSearch && matchesLevel;
  });

  const selectedFiliere = filieres.find(f => f.id === selectedFiliereId) || filteredFilieres[0] || filieres[0];
  const selectedModule = selectedFiliere?.modules.find(m => m.id === selectedModuleId) || selectedFiliere?.modules[0];

  const handleDeleteFiliere = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette filière ? Tous les modules et séances associés seront également supprimés.")) return;
    try {
      const response = await fetch(`http://localhost:8000/api/core/filiere/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
      if (response.ok) {
        setFilieres(prev => prev.filter(f => f.id !== id));
        if (selectedFiliereId === id) {
          const remaining = filieres.filter(f => f.id !== id);
          setSelectedFiliereId(remaining[0]?.id || '');
        }
      } else {
        alert("Erreur lors de la suppression de la filière.");
      }
    } catch (error) {
      console.error("Delete filiere error:", error);
    }
  };

  const handleDeleteModule = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce module ?")) return;
    try {
      const response = await fetch(`http://localhost:8000/api/core/module/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
      if (response.ok) {
        setFilieres(prev => prev.map(f => ({
          ...f,
          modules: f.modules.filter(m => m.id !== id)
        })));
        if (selectedModuleId === id) {
          const updatedFiliere = filieres.find(f => f.modules.some(m => m.id === id));
          const remainingModules = updatedFiliere?.modules.filter(m => m.id !== id);
          setSelectedModuleId(remainingModules?.[0]?.id || '');
        }
      } else {
        alert("Erreur lors de la suppression du module.");
      }
    } catch (error) {
      console.error("Delete module error:", error);
    }
  };

  const handleExportAll = () => {
    window.open('http://localhost:8000/api/core/filiere/export-all-timetables-zip/', '_blank');
  };

  const handleSubmitFiliere = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      nom: formData.get('nom'),
      description: formData.get('description'),
      niveaux: formData.get('niveaux'),
      departement: parseInt(formData.get('departement') as string),
    };

    const url = editingFiliere 
      ? `http://localhost:8000/api/core/filiere/${editingFiliere.id}/` 
      : 'http://localhost:8000/api/core/filiere/create-filiere/';
    
    try {
      const response = await fetch(url, {
        method: editingFiliere ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setIsFiliereModalOpen(false);
        setEditingFiliere(null);
        loadData();
      } else {
        alert("Erreur lors de l'enregistrement de la filière.");
      }
    } catch (error) {
      console.error("Filiere save error:", error);
    }
  };

  const handleSubmitModule = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      nom: formData.get('nom'),
    };

    const url = editingModule 
      ? `http://localhost:8000/api/core/module/${editingModule.id}/` 
      : 'http://localhost:8000/api/core/module/create-module/';
    
    try {
      const response = await fetch(url, {
        method: editingModule ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        
        // If creating and a filiere is selected, affect it
        const targetFiliere = formData.get('filiere_id');
        const targetSemester = formData.get('semester');
        if (!editingModule && targetFiliere && targetSemester) {
          await fetch('http://localhost:8000/api/core/module/affecter-filiere/', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: JSON.stringify({
              filiere: targetFiliere,
              module: data.id,
              semestre: targetSemester,
            }),
          });
        }

        setIsModuleModalOpen(false);
        setEditingModule(null);
        loadData();
      } else {
        alert("Erreur lors de l'enregistrement du module.");
      }
    } catch (error) {
      console.error("Module save error:", error);
    }
  };

  const isAdmin = currentUser?.role ? (currentUser.role.includes('ADMIN') || currentUser.role.includes('CHEF_DEPARTEMENT')) : false;

  if (loading) {
    return <div className="flex items-center justify-center h-full">{t('common.loading')}</div>;
  }

  if (filieres.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-on-surface-variant">No programs found.</p>
        <Link to="/programs/new" className="bg-primary text-on-primary px-6 py-2 rounded-lg">
          {t('programs.add_filiere')}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-lg">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-h1 text-h1 text-on-surface">{t('programs.title')}</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">{t('programs.description')}</p>
        </div>
        <div className="flex gap-3">
          {isAdmin && (
            <>
              <button onClick={handleExportAll} className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-2 rounded-lg font-body-md text-body-md flex items-center gap-2 transition-colors shadow-sm uppercase tracking-wider font-bold">
                <span className="material-symbols-outlined text-[20px]">folder_zip</span>
                Tout Exporter (ZIP)
              </button>
              <button 
                onClick={() => { setEditingModule(null); setIsModuleModalOpen(true); }}
                className="border border-outline text-on-surface hover:bg-surface-container-high px-6 py-2 rounded-lg font-body-md text-body-md flex items-center gap-2 transition-colors shadow-sm uppercase tracking-wider font-bold"
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
                {t('programs.create_module')}
              </button>
              <button 
                onClick={() => { setEditingFiliere(null); setIsFiliereModalOpen(true); }}
                className="bg-primary hover:bg-primary/90 text-on-primary px-6 py-2 rounded-lg font-body-md text-body-md flex items-center gap-2 transition-colors shadow-sm uppercase tracking-wider font-bold"
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
                {t('programs.add_filiere')}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-12 gap-gutter items-start">
        {/* Left Column: Filières List */}
        <div className="col-span-4 flex flex-col gap-md">
          {/* Search & Filter */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold uppercase tracking-widest text-[10px] text-outline">Filières</h3>
              {isAdmin && (
                <button 
                  onClick={() => { setEditingFiliere(null); setIsFiliereModalOpen(true); }}
                  className="text-primary hover:text-primary/80 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  Ajouter
                </button>
              )}
            </div>
            <div className="relative focus-within:ring-2 focus-within:ring-primary rounded-lg">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
              <input 
                className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-lg text-sm bg-surface-bright focus:border-transparent focus:ring-0" 
                placeholder={t('programs.search_placeholder')} 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
              <button 
                onClick={() => setLevelFilter('All')}
                className={`px-3 py-1 rounded-full font-label-caps text-label-caps whitespace-nowrap uppercase tracking-wider transition-colors ${levelFilter === 'All' ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container border border-outline-variant text-on-surface hover:bg-surface-container-high'}`}
              >
                {t('common.all')}
              </button>
              <button 
                onClick={() => setLevelFilter('Licence')}
                className={`px-3 py-1 rounded-full font-label-caps text-label-caps whitespace-nowrap uppercase tracking-wider transition-colors ${levelFilter === 'Licence' ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container border border-outline-variant text-on-surface hover:bg-surface-container-high'}`}
              >
                Licence
              </button>
              <button 
                onClick={() => setLevelFilter('Master')}
                className={`px-3 py-1 rounded-full font-label-caps text-label-caps whitespace-nowrap uppercase tracking-wider transition-colors ${levelFilter === 'Master' ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container border border-outline-variant text-on-surface hover:bg-surface-container-high'}`}
              >
                Master
              </button>
            </div>
          </div>
          {/* List */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
            {filteredFilieres.map((filiere) => (
              <div key={filiere.id} className="border-b border-outline-variant">
                <div 
                  onClick={() => {
                    setSelectedFiliereId(filiere.id);
                    setSelectedModuleId(filiere.modules[0]?.id || '');
                  }}
                  className={`p-4 border-l-4 cursor-pointer hover:bg-surface-container transition-colors ${
                    selectedFiliereId === filiere.id ? 'border-secondary-container bg-surface-container-low' : 'border-transparent'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-h3 text-h3 text-on-surface">{filiere.name}</h3>
                    <div className="flex items-center gap-1">
                      {isAdmin && (
                        <>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingFiliere(filiere);
                              setIsFiliereModalOpen(true);
                            }}
                            className="p-1 text-outline hover:text-primary transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFiliere(filiere.id);
                            }}
                            className="p-1 text-outline hover:text-error transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </>
                      )}
                      <span className="bg-primary-fixed text-on-primary-fixed px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider">{filiere.level}</span>
                    </div>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant text-sm mb-3">{filiere.description}</p>
                  <div className="flex items-center justify-between text-xs text-outline">
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">folder</span> {filiere.modules.length} {t('programs.modules_count')}</span>
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">schedule</span> {filiere.modules.reduce((acc, m) => acc + m.assignedHours, 0)}h {t('common.all')}</span>
                  </div>
                </div>
                {/* Nested Modules List */}
                {selectedFiliereId === filiere.id && (
                  <div className="bg-surface-container-lowest py-2 border-t border-outline-variant">
                    {filiere.modules.map((m) => (
                      <div 
                        key={m.id}
                        onClick={() => setSelectedModuleId(m.id)}
                        className={`px-6 py-2 cursor-pointer transition-colors flex items-center justify-between group ${
                          selectedModuleId === m.id ? 'bg-primary-container/10 border-l-4 border-primary text-primary font-medium' : 'hover:bg-surface-container-low text-on-surface-variant'
                        }`}
                      >
                        <span className="text-sm">{m.name}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isAdmin && (
                            <>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingModule(m);
                                  setIsModuleModalOpen(true);
                                }}
                                className="p-1 text-outline hover:text-primary transition-colors"
                              >
                                <span className="material-symbols-outlined text-xs">edit</span>
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteModule(m.id);
                                }}
                                className="p-1 text-outline hover:text-error transition-colors"
                              >
                                <span className="material-symbols-outlined text-xs">delete</span>
                              </button>
                            </>
                          )}
                          {selectedModuleId === m.id && <span className="material-symbols-outlined text-[16px]">chevron_right</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Detail View */}
        <div className="col-span-8 flex flex-col gap-md">
          {/* Module Header */}
          {selectedFiliere && (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm flex flex-col gap-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-primary-fixed text-on-primary-fixed px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">{selectedFiliere.level}</span>
                    <span className="text-outline font-label-caps text-label-caps uppercase tracking-wider">{selectedFiliere.name}</span>
                  </div>
                  <h2 className="font-h2 text-h2 text-on-surface tracking-tight font-bold">{selectedFiliere.name}</h2>
                  <p className="text-on-surface-variant text-sm mt-1 italic leading-relaxed">"{selectedFiliere.description}"</p>
                  <div className="mt-4 border-t border-outline-variant/30 pt-4">
                    <h3 className="text-primary font-h3 text-sm font-bold uppercase tracking-widest">{t('programs.active_module')}: {selectedModule?.name || t('common.none')}</h3>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Link to={`/timetable?filiereId=${selectedFiliere.id}`} className="px-4 py-2 bg-secondary-container text-on-secondary-container rounded-lg hover:bg-secondary-container/90 transition-colors font-body-md text-body-md flex items-center gap-2 shadow-sm uppercase tracking-wider font-bold">
                    <span className="material-symbols-outlined text-[18px]">add_box</span>
                    {t('programs.add_edit_seance')}
                  </Link>
                </div>
              </div>
              {/* Progress/Stats */}
              {selectedModule && (
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-4 bg-surface-bright border border-surface-variant rounded-lg">
                    <div className="text-outline font-label-caps text-label-caps mb-1 uppercase tracking-wider">{t('programs.assigned_hours')}</div>
                    <div className="font-h2 text-h2 text-on-surface">{selectedModule.assignedHours}<span className="text-sm font-normal text-outline">/{selectedModule.totalHours}</span></div>
                    <div className="w-full bg-surface-container-high h-2 rounded-full mt-3">
                      <div className="bg-primary h-2 rounded-full" style={{ width: `${selectedModule.totalHours > 0 ? (selectedModule.assignedHours / selectedModule.totalHours) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                  <div className="p-4 bg-surface-bright border border-surface-variant rounded-lg">
                    <div className="text-outline font-label-caps text-label-caps mb-1 uppercase tracking-wider">Séances</div>
                    <div className="font-h2 text-h2 text-on-surface">{(selectedModule as any).seancesCount}</div>
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Séances Table */}
          {selectedModule && (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-outline-variant bg-surface-bright flex justify-between items-center">
                <h3 className="font-h3 text-h3 text-on-surface">{t('programs.seances_allocation')}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-lowest border-b border-outline-variant">
                      <th className="px-6 py-3 font-label-caps text-label-caps text-outline uppercase tracking-wider">{t('programs.seance_name')}</th>
                      <th className="px-6 py-3 font-label-caps text-label-caps text-outline uppercase tracking-wider">{t('programs.teacher')}</th>
                      <th className="px-6 py-3 font-label-caps text-label-caps text-outline uppercase tracking-wider">{t('programs.room')}</th>
                      <th className="px-6 py-3 font-label-caps text-label-caps text-outline uppercase tracking-wider">{t('programs.volume')}</th>
                      <th className="px-6 py-3 font-label-caps text-label-caps text-outline uppercase tracking-wider text-right">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="font-table-data text-table-data divide-y divide-surface-variant">
                    {selectedModule.seances.length > 0 ? selectedModule.seances.map((seance) => (
                      <tr key={seance.id} className="hover:bg-surface-container-lowest/50 transition-colors bg-white">
                        <td className="px-6 py-4">
                          <div className="font-medium text-on-surface">{seance.name}</div>
                          <div className="text-xs text-outline mt-1">{seance.type}: {seance.type === 'CM' ? 'Lecture' : seance.type === 'TD' ? 'Tutorial' : 'Practical Work'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {!seance.teacher || seance.teacher === 'Unassigned' ? (
                              <span className="px-2 py-1 bg-surface-container-high text-outline text-xs rounded-full font-medium uppercase tracking-widest">{t('common.none')}</span>
                            ) : (
                              <>
                                <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-xs font-bold uppercase">
                                  {seance.teacher.split(' ').filter(Boolean).map((n: string) => n[0]).join('')}
                                </div>
                                <span className="text-on-surface">{seance.teacher}</span>
                                {seance.teacherEmail && (
                                  <a 
                                    href={`mailto:${seance.teacherEmail}`}
                                    className="p-1 text-slate-400 hover:text-sky-500 transition-colors ml-1 inline-flex items-center"
                                    title={`Contacter par email: ${seance.teacherEmail}`}
                                  >
                                    <span className="material-symbols-outlined text-[16px]">mail</span>
                                  </a>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-on-surface">
                          <span className={!seance.room || seance.room === 'Pending' ? 'text-outline italic' : ''}>{seance.room || t('common.n_a')}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-surface-container-high rounded text-xs font-medium text-on-surface-variant">{seance.volume}h</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-outline hover:text-primary transition-colors p-1">
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant opacity-60">
                          {t('programs.no_seances')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filiere Modal */}
      {isFiliereModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <div className="p-2 bg-primary/20 rounded-lg"><span className="material-symbols-outlined text-primary-fixed">{editingFiliere ? 'edit' : 'add'}</span></div>
                <h3 className="text-lg font-black uppercase tracking-tight">{editingFiliere ? 'Modifier la Filière' : 'Ajouter une Filière'}</h3>
              </div>
              <button onClick={() => { setIsFiliereModalOpen(false); setEditingFiliere(null); }} className="text-slate-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmitFiliere} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Nom de la Filière</label>
                <input name="nom" defaultValue={editingFiliere?.name || ''} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder="Ex: SDIA" />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Description</label>
                <textarea name="description" defaultValue={editingFiliere?.description || ''} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all h-24" placeholder="Description de la filière..." />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Niveau</label>
                  <select name="niveaux" defaultValue={editingFiliere?.level || 'Licence_f'} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all">
                    <option value="Licence_f">Licence Fondamentale</option>
                    <option value="Licence_e">Licence Excellence</option>
                    <option value="Master_f">Master Fondamental</option>
                    <option value="Master_e">Master Excellence</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Département</label>
                  <select name="departement" defaultValue={editingFiliere?.departement || ''} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all">
                    <option value="">Sélectionner...</option>
                    {departments.map(d => (<option key={d.id} value={d.id}>{d.nom}</option>))}
                  </select>
                </div>
              </div>
              <div className="pt-6 border-t border-slate-100 flex gap-4">
                <button type="button" onClick={() => { setIsFiliereModalOpen(false); setEditingFiliere(null); }} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors">Annuler</button>
                <button type="submit" className="flex-1 bg-slate-900 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg hover:bg-slate-800">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Module Modal */}
      {isModuleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <div className="p-2 bg-primary/20 rounded-lg"><span className="material-symbols-outlined text-primary-fixed">{editingModule ? 'edit' : 'add'}</span></div>
                <h3 className="text-lg font-black uppercase tracking-tight">{editingModule ? 'Modifier le Module' : 'Créer un Module'}</h3>
              </div>
              <button onClick={() => { setIsModuleModalOpen(false); setEditingModule(null); }} className="text-slate-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmitModule} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Nom du Module</label>
                <input name="nom" defaultValue={editingModule?.name || ''} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder="Ex: Algèbre" />
              </div>
              
              {!editingModule && (
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 space-y-4">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Affectation immédiate (Optionnel)</h4>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[9px] font-bold uppercase text-slate-400">Filière</label>
                        <select name="filiere_id" defaultValue={selectedFiliereId} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none">
                          <option value="">Aucune</option>
                          {filieres.map(f => (<option key={f.id} value={f.id}>{f.name}</option>))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[9px] font-bold uppercase text-slate-400">Semestre</label>
                        <select name="semester" defaultValue="S1_l" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none">
                          <option value="S1_l">S1</option><option value="S2_l">S2</option><option value="S3_l">S3</option>
                          <option value="S4_l">S4</option><option value="S5_l">S5</option><option value="S6_l">S6</option>
                        </select>
                      </div>
                   </div>
                </div>
              )}

              <div className="pt-6 border-t border-slate-100 flex gap-4">
                <button type="button" onClick={() => { setIsModuleModalOpen(false); setEditingModule(null); }} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors">Annuler</button>
                <button type="submit" className="flex-1 bg-slate-900 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg hover:bg-slate-800">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgramsManagement;
