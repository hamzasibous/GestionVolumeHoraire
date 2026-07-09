import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface Assignment {
  id: string;
  moduleCode: string;
  moduleName: string;
  type: string;
  hours: number;
}

interface FacultyMember {
  id: string;
  name: string;
  department: string;
  title: string;
  avatar?: string;
  initials?: string;
  workload: number;
  maxWorkload: number;
  assignments: Assignment[];
  isOverloaded?: boolean;
}

const FacultyAssignments: React.FC = () => {
  const { t } = useTranslation();
  const [faculty, setFaculty] = useState<FacultyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  const [seuilFilter, setSeuilFilter] = useState<'all' | 'overloaded' | 'underloaded'>('all');
  const [availableModules, setAvailableModules] = useState<any[]>([]);
  const [modulesSearchTerm, setModulesSearchTerm] = useState('');

  // Threshold Configuration State
  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState(false);
  const [thresholdValue, setThresholdValue] = useState<number>(192);

  // Export State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [filieresList, setFilieresList] = useState<any[]>([]);
  const [exportFiliere, setExportFiliere] = useState<string>('');
  const [exportSemester, setExportSemester] = useState<string>('');

  useEffect(() => {
    setDepartmentFilter(t('faculty_assignments.all_departments'));
  }, [t]);

  const loadFacultyData = () => {
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};

    const fetchFaculty = fetch('http://localhost:8000/api/core/faculty-assignments/', { headers }).then(res => res.json());
    const fetchModules = fetch('http://localhost:8000/api/core/module/', { headers }).then(res => res.json());
    const fetchFilieres = fetch('http://localhost:8000/api/core/filiere/', { headers }).then(res => res.json());

    Promise.all([fetchFaculty, fetchModules, fetchFilieres])
      .then(([facultyData, modulesData, filieresData]) => {
        setFaculty(facultyData);
        setAvailableModules(modulesData);
        setFilieresList(filieresData);
        if (facultyData.length > 0 && !selectedFacultyId) {
          setSelectedFacultyId(facultyData[0].id);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching data:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadFacultyData();
  }, []);

  const fetchThreshold = () => {
    const token = localStorage.getItem('access_token');
    const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};
    fetch('http://localhost:8000/api/core/seuil-horaire/', { headers })
      .then(res => res.json())
      .then(data => {
        setThresholdValue(data.seuil_horaire || 192);
        setIsThresholdModalOpen(true);
      })
      .catch(err => console.error(err));
  };

  const handleSaveThreshold = () => {
    const token = localStorage.getItem('access_token');
    const headers: HeadersInit = token ? { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    } : {
      'Content-Type': 'application/json'
    };
    fetch('http://localhost:8000/api/core/seuil-horaire/', { 
      method: 'PUT',
      headers,
      body: JSON.stringify({ seuil_horaire: thresholdValue })
    })
      .then(res => res.json())
      .then(() => {
        setIsThresholdModalOpen(false);
        loadFacultyData();
      })
      .catch(err => console.error(err));
  };

  const handleExportExcel = () => {
    let url = 'http://localhost:8000/api/core/export-workload/?';
    if (exportFiliere) url += `filiere_id=${exportFiliere}&`;
    if (exportSemester) url += `semester=${exportSemester}&`;
    
    const token = localStorage.getItem('access_token');
    const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};
    
    fetch(url, { headers })
      .then(res => {
        if (!res.ok) {
          throw new Error('Export failed');
        }
        return res.blob();
      })
      .then(blob => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = 'Charges_Enseignants.xlsx';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setIsExportModalOpen(false);
      })
      .catch(err => {
        console.error('Error exporting workload:', err);
        alert('Erreur lors de l\'export du fichier Excel.');
      });
  };

  const filteredFaculty = faculty.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = departmentFilter === t('faculty_assignments.all_departments') || member.department === departmentFilter;
    
    let matchesSeuil = true;
    if (seuilFilter === 'overloaded') {
      matchesSeuil = member.workload > member.maxWorkload;
    } else if (seuilFilter === 'underloaded') {
      matchesSeuil = member.workload <= member.maxWorkload;
    }
    
    return matchesSearch && matchesDept && matchesSeuil;
  });

  const filteredAvailableModules = availableModules.filter(module =>
    module.nom.toLowerCase().includes(modulesSearchTerm.toLowerCase())
  );

  const selectedFaculty = faculty.find(f => f.id === selectedFacultyId) || faculty[0];

  const totalFaculty = faculty.length;
  const avgWorkload = faculty.length > 0 
    ? Math.round(faculty.reduce((acc, curr) => acc + curr.workload, 0) / faculty.length) 
    : 0;
  const overloadCount = faculty.filter(f => f.workload > f.maxWorkload).length;

  const departments = Array.from(new Set(faculty.map(f => f.department)));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">sync</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-lg">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="font-h1 text-h1 text-on-surface tracking-tight">{t('faculty_assignments.title')}</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">{t('faculty_assignments.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 border border-outline hover:bg-surface-container rounded-xl font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest transition-colors font-bold text-[10px]"
          >
            <span className="material-symbols-outlined text-[18px]">download_for_offline</span>
            {t('faculty_assignments.export')}
          </button>
          <button 
            onClick={fetchThreshold}
            className="flex items-center gap-2 px-5 py-3 bg-primary text-on-primary hover:bg-primary-container rounded-xl font-label-caps text-label-caps uppercase tracking-widest transition-all font-bold text-[10px] shadow-md hover:scale-[1.02]"
          >
            <span className="material-symbols-outlined text-[18px]">settings</span>
            Seuil Horaire
          </button>
        </div>
      </div>

      {/* Statistical Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        <div className="bg-surface-container-lowest p-md border border-outline-variant rounded-lg shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-on-primary-fixed text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
          </div>
          <div>
            <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider mb-1">{t('faculty_assignments.total_faculty')}</h3>
            <p className="font-h1 text-h1 text-on-surface">{totalFaculty}</p>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-md border border-outline-variant rounded-lg shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-secondary-fixed flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-on-secondary-fixed text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>balance</span>
          </div>
          <div>
            <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider mb-1 text-xs">{t('faculty_assignments.avg_workload')}</h3>
            <p className="font-h1 text-h1 text-on-surface">{avgWorkload} <span className="font-body-md text-body-md text-on-surface-variant font-normal">EqTD</span></p>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-md border border-outline-variant rounded-lg shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-on-error-container text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
          </div>
          <div>
            <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider mb-1">{t('faculty_assignments.workload_alerts')}</h3>
            <p className="font-h1 text-h1 text-error">{overloadCount} <span className="font-body-md text-body-md text-on-surface-variant font-normal">{t('faculty_assignments.over_capacity')}</span></p>
          </div>
        </div>
      </div>

      {/* Dual-Pane Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter min-h-[600px]">
        {/* Left Pane: Faculty Directory */}
        <div className="xl:col-span-4 flex flex-col bg-surface border border-outline-variant rounded-lg shadow-sm overflow-hidden">
          {/* Directory Header / Search */}
          <div className="p-4 border-b border-outline-variant bg-surface-container-lowest space-y-3">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
              <input 
                className="w-full pl-10 pr-4 py-2.5 bg-surface-bright border border-outline-variant rounded focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md transition-colors" 
                placeholder={t('faculty_assignments.search_placeholder')} 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <select 
                className="w-full sm:w-1/2 px-3 py-2 bg-surface-bright border border-outline-variant rounded font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                <option value={t('faculty_assignments.all_departments')}>{t('faculty_assignments.all_departments')}</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              <select 
                className="w-full sm:w-1/2 px-3 py-2 bg-surface-bright border border-outline-variant rounded font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
                value={seuilFilter}
                onChange={(e) => setSeuilFilter(e.target.value as any)}
              >
                <option value="all">Tous les profs</option>
                <option value="overloaded">Surchargés (&gt; Seuil)</option>
                <option value="underloaded">Sous le seuil (&le; Seuil)</option>
              </select>
            </div>
          </div>
          {/* Faculty List */}
          <div className="flex-1 overflow-y-auto">
            {filteredFaculty.map((member) => (
              <div 
                key={member.id}
                onClick={() => setSelectedFacultyId(member.id)}
                className={`p-4 border-b border-outline-variant cursor-pointer hover:bg-surface-container transition-colors relative ${
                  selectedFacultyId === member.id ? 'bg-surface-container-low' : ''
                }`}
              >
                {selectedFacultyId === member.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-surface-variant overflow-hidden shrink-0 flex items-center justify-center">
                    {member.avatar ? (
                      <img alt={member.name} className="w-full h-full object-cover" src={member.avatar} />
                    ) : (
                      <span className="font-h3 text-on-surface-variant bg-surface-container-high w-full h-full flex items-center justify-center uppercase tracking-wider">{member.initials}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-h3 text-h3 text-on-surface truncate tracking-tight">{member.name}</h4>
                      {member.workload > member.maxWorkload && <span className="material-symbols-outlined text-error text-[18px]" title={t('faculty_assignments.over_capacity')}>error</span>}
                    </div>
                    <p className="font-body-md text-[13px] text-on-surface-variant truncate">{member.department} • {member.title}</p>
                  </div>
                </div>
                {/* Workload Meter */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">{t('faculty_assignments.workload_label')}</span>
                    <span className={`font-table-data text-table-data font-semibold ${member.workload > member.maxWorkload ? 'text-error' : 'text-on-surface'}`}>
                      {member.workload} / {member.maxWorkload} EqTD
                    </span>
                  </div>
                  <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${member.workload > member.maxWorkload ? 'bg-secondary-container' : 'bg-primary'}`} 
                      style={{ width: `${Math.min((member.workload / member.maxWorkload) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Pane: Assignment Canvas */}
        {selectedFaculty && (
          <div className="xl:col-span-8 flex flex-col bg-surface border border-outline-variant rounded-lg shadow-sm overflow-hidden">
            {/* Canvas Header */}
            <div className="p-6 border-b border-outline-variant bg-surface-bright flex flex-col sm:flex-row items-center justify-between shrink-0 gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-surface-variant overflow-hidden shrink-0 flex items-center justify-center border border-outline-variant">
                  {selectedFaculty.avatar ? (
                    <img alt={selectedFaculty.name} className="w-full h-full object-cover" src={selectedFaculty.avatar} />
                  ) : (
                    <span className="font-h2 text-h2 text-on-surface-variant uppercase tracking-wider">{selectedFaculty.initials}</span>
                  )}
                </div>
                <div>
                  <h3 className="font-h2 text-h2 text-on-surface tracking-tight">{selectedFaculty.name}</h3>
                  <div className="flex flex-wrap items-center gap-4 font-body-md text-sm text-on-surface-variant">
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">school</span> {selectedFaculty.department}</span>
                    <span className={`flex items-center gap-1 ${selectedFaculty.workload > selectedFaculty.maxWorkload ? 'text-error' : 'text-primary'}`}>
                      <span className="material-symbols-outlined text-[16px]">{selectedFaculty.workload > selectedFaculty.maxWorkload ? 'trending_up' : 'check_circle'}</span> 
                      {selectedFaculty.workload} {t('faculty_assignments.hours_per_year').split('/')[0]} EqTD {selectedFaculty.workload > selectedFaculty.maxWorkload ? `(${t('faculty_assignments.over_capacity')})` : `(${t('faculty_assignments.normal_capacity')})`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* Canvas Body */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-surface-container-lowest">
              {/* Current Assignments Table */}
              <div className="flex-1 border-r border-outline-variant flex flex-col min-w-0">
                <div className="p-4 border-b border-outline-variant bg-surface flex items-center justify-between shrink-0">
                  <h4 className="font-h3 text-[16px] font-semibold text-on-surface tracking-tight uppercase tracking-wider text-xs">{t('faculty_assignments.assigned_modules')}</h4>
                  <span className="px-2 py-1 bg-surface-container-high rounded text-xs font-semibold text-on-surface-variant">{selectedFaculty.assignments.length} {t('common.programs').split(' ')[0]}</span>
                </div>
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-left border-collapse min-w-[400px]">
                    <thead className="sticky top-0 bg-surface z-10 shadow-sm border-b border-outline-variant">
                      <tr>
                        <th className="p-base px-4 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">{t('faculty_assignments.table_module')}</th>
                        <th className="p-base px-4 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider w-20">{t('faculty_assignments.table_type')}</th>
                        <th className="p-base px-4 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider text-right w-24">{t('faculty_assignments.table_hours')}</th>
                        <th className="p-base px-4 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="font-table-data text-table-data text-on-surface divide-y divide-surface-variant">
                      {selectedFaculty.assignments.map((assignment) => (
                        <tr key={assignment.id} className="hover:bg-surface-container transition-colors h-[48px]">
                          <td className="p-base px-4 font-medium">{assignment.moduleCode} - {assignment.moduleName}</td>
                          <td className="p-base px-4 text-on-surface-variant">{assignment.type}</td>
                          <td className="p-base px-4 text-right">{assignment.hours} EqTD</td>
                          <td className="p-base px-4 text-right">
                            <button className="text-outline hover:text-error transition-colors p-1" title={t('faculty_assignments.unassign')}>
                              <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t-2 border-outline-variant bg-surface-bright font-semibold sticky bottom-0">
                      <tr>
                        <td className="p-base px-4 text-right font-label-caps text-on-surface-variant uppercase tracking-wider" colSpan={2}>{t('faculty_assignments.total_assigned')}</td>
                        <td className={`p-base px-4 text-right ${selectedFaculty.workload > selectedFaculty.maxWorkload ? 'text-error' : 'text-primary'}`}>{selectedFaculty.workload} EqTD</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
              {/* Available Modules List */}
              <div className="w-full md:w-[340px] flex flex-col bg-surface shrink-0">
                <div className="p-4 border-b border-outline-variant bg-surface flex flex-col gap-3 shrink-0">
                  <h4 className="font-h3 text-[16px] font-semibold text-on-surface tracking-tight uppercase tracking-wider text-xs">{t('faculty_assignments.available_modules')}</h4>
                  <div className="relative w-full">
                    <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
                    <input 
                      className="w-full pl-8 pr-3 py-1.5 text-sm bg-surface-bright border border-outline-variant rounded focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-body-md transition-colors" 
                      placeholder={t('faculty_assignments.filter_modules')} 
                      type="text" 
                      value={modulesSearchTerm}
                      onChange={(e) => setModulesSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-surface-container-lowest">
                  {filteredAvailableModules.length > 0 ? (
                    filteredAvailableModules.map((module) => (
                      <div key={module.id} className="p-3 bg-surface border border-outline-variant rounded-lg flex items-center justify-between group">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-on-surface truncate">{module.nom}</p>
                          <p className="text-[11px] text-on-surface-variant">Code: MOD{module.id}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-on-surface-variant text-sm italic">
                      {modulesSearchTerm ? "Aucun module trouvé" : t('faculty_assignments.search_modules_hint')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Threshold Modal */}
      {isThresholdModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <span className="material-symbols-outlined text-sky-400">tune</span>
                <h3 className="text-lg font-black uppercase tracking-tight">Seuil Horaire</h3>
              </div>
              <button onClick={() => setIsThresholdModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <p className="text-slate-600 text-sm">
                Définissez le seuil statutaire d'heures (Équivalent TD) par semestre pour ce département. Les enseignants dépassant ce seuil seront signalés en alerte.
              </p>
              
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Heures statutaires (EqTD)</label>
                <input 
                  type="number" 
                  value={thresholdValue}
                  onChange={(e) => setThresholdValue(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                  min="0"
                />
              </div>

              <div className="pt-6 border-t border-slate-100 flex gap-4">
                <button 
                  onClick={() => setIsThresholdModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors"
                >
                  Annuler
                </button>
                <button 
                  onClick={handleSaveThreshold}
                  className="flex-1 bg-slate-900 text-white hover:bg-slate-800 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <span className="material-symbols-outlined text-sky-400">download_for_offline</span>
                <h3 className="text-lg font-black uppercase tracking-tight">Exporter en Excel</h3>
              </div>
              <button onClick={() => setIsExportModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <p className="text-slate-600 text-sm">
                Sélectionnez les critères d'exportation pour le volume horaire du département.
              </p>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Filtrer par Filière</label>
                  <select 
                    value={exportFiliere}
                    onChange={(e) => setExportFiliere(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all cursor-pointer"
                  >
                    <option value="">Toutes les filières</option>
                    {filieresList.map(f => (
                      <option key={f.id} value={f.id}>{f.nom}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Filtrer par Semestre</label>
                  <select 
                    value={exportSemester}
                    onChange={(e) => setExportSemester(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all cursor-pointer"
                  >
                    <option value="">Tous les semestres</option>
                    <option value="S1">Semestre 1</option>
                    <option value="S2">Semestre 2</option>
                    <option value="S3">Semestre 3</option>
                    <option value="S4">Semestre 4</option>
                    <option value="S5">Semestre 5</option>
                    <option value="S6">Semestre 6</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex gap-4">
                <button 
                  onClick={() => setIsExportModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors"
                >
                  Fermer
                </button>
                <button 
                  onClick={handleExportExcel}
                  className="flex-1 bg-slate-900 text-white hover:bg-slate-800 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  Télécharger
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyAssignments;
