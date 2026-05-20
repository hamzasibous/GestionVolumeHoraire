import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface Seance {
  id: string;
  name: string;
  type: 'CM' | 'TD' | 'TP';
  teacher: string;
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/core/filiere/details/');
        const data = await response.json();
        
        const mappedData: Filiere[] = data.map((f: any) => ({
          id: f.id.toString(),
          name: f.nom,
          level: f.niveaux_display,
          description: `Programme de ${f.nom}`,
          modules: f.modules.map((m: any) => ({
            id: m.id.toString(),
            name: m.nom,
            totalHours: m.total_hours || 0,
            assignedHours: m.assigned_hours || 0,
            seances: m.seances.map((s: any) => ({
              id: s.id.toString(),
              name: `${s.type} - ${s.date}`,
              type: s.type,
              teacher: s.enseignant_name,
              room: s.local_name,
              volume: s.duree
            }))
          }))
        }));

        setFilieres(mappedData);
        if (mappedData.length > 0) {
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

    fetchData();
  }, []);

  const selectedFiliere = filieres.find(f => f.id === selectedFiliereId) || filieres[0];
  const selectedModule = selectedFiliere?.modules.find(m => m.id === selectedModuleId) || selectedFiliere?.modules[0];

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
          <Link to="/programs/new-module" className="border border-outline text-on-surface hover:bg-surface-container-high px-6 py-2 rounded-lg font-body-md text-body-md flex items-center gap-2 transition-colors shadow-sm uppercase tracking-wider font-bold">
            <span className="material-symbols-outlined text-[20px]">add</span>
            {t('programs.create_module')}
          </Link>
          <Link to="/programs/new" className="bg-primary hover:bg-primary/90 text-on-primary px-6 py-2 rounded-lg font-body-md text-body-md flex items-center gap-2 transition-colors shadow-sm uppercase tracking-wider font-bold">
            <span className="material-symbols-outlined text-[20px]">add</span>
            {t('programs.add_filiere')}
          </Link>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-12 gap-gutter items-start">
        {/* Left Column: Filières List */}
        <div className="col-span-4 flex flex-col gap-md">
          {/* Search & Filter */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
            <div className="relative focus-within:ring-2 focus-within:ring-primary rounded-lg">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
              <input className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-lg text-sm bg-surface-bright focus:border-transparent focus:ring-0" placeholder={t('programs.search_placeholder')} type="text" />
            </div>
            <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
              <button className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full font-label-caps text-label-caps whitespace-nowrap uppercase tracking-wider">{t('common.all')}</button>
              <button className="px-3 py-1 bg-surface-container border border-outline-variant text-on-surface rounded-full font-label-caps text-label-caps whitespace-nowrap hover:bg-surface-container-high transition-colors uppercase tracking-wider">Licence</button>
              <button className="px-3 py-1 bg-surface-container border border-outline-variant text-on-surface rounded-full font-label-caps text-label-caps whitespace-nowrap hover:bg-surface-container-high transition-colors uppercase tracking-wider">Master</button>
            </div>
          </div>
          {/* List */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
            {filieres.map((filiere) => (
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
                      <span className="bg-primary-fixed text-on-primary-fixed px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider">{filiere.level}</span>
                      <span className="material-symbols-outlined text-outline">expand_more</span>
                    </div>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant text-sm mb-3">{filiere.description}</p>
                  <div className="flex items-center justify-between text-xs text-outline">
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">folder</span> {filiere.modules.length} {t('programs.modules_count')}</span>
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">schedule</span> {filiere.modules.reduce((acc, m) => acc + m.totalHours, 0)}h {t('common.all')}</span>
                  </div>
                </div>
                {/* Nested Modules List */}
                {selectedFiliereId === filiere.id && (
                  <div className="bg-surface-container-lowest py-2 border-t border-outline-variant">
                    {filiere.modules.map((m) => (
                      <div 
                        key={m.id}
                        onClick={() => setSelectedModuleId(m.id)}
                        className={`px-6 py-2 cursor-pointer transition-colors flex items-center justify-between ${
                          selectedModuleId === m.id ? 'bg-primary-container/10 border-l-4 border-primary text-primary font-medium' : 'hover:bg-surface-container-low text-on-surface-variant'
                        }`}
                      >
                        <span className="text-sm">{m.name}</span>
                        {selectedModuleId === m.id && <span className="material-symbols-outlined text-[16px]">chevron_right</span>}
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
                  <Link to="/timetable" className="px-4 py-2 bg-secondary-container text-on-secondary-container rounded-lg hover:bg-secondary-container/90 transition-colors font-body-md text-body-md flex items-center gap-2 shadow-sm uppercase tracking-wider font-bold">
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
                    <div className="font-h2 text-h2 text-on-surface">{selectedModule.seances.length}</div>
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
                            {seance.teacher === 'Unassigned' ? (
                              <span className="px-2 py-1 bg-error-container text-on-error-container text-xs rounded-full font-medium">{t('programs.unassigned')}</span>
                            ) : (
                              <>
                                <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-xs font-bold uppercase">
                                  {seance.teacher.split(' ').map(n => n[0]).join('')}
                                </div>
                                <span className="text-on-surface">{seance.teacher}</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-on-surface">
                          <span className={seance.room === 'Pending' ? 'text-outline italic' : ''}>{seance.room}</span>
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
    </div>
  );
};

export default ProgramsManagement;
