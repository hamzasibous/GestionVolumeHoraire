import { API_BASE_URL } from '../config/api';
import React, { useState, useEffect } from 'react';

interface TeacherStat {
  id: string;
  name: string;
  department: string;
  workload: number;
  maxWorkload: number;
  isOverloaded: boolean;
}

interface FiliereDetail {
  id: number;
  nom: string;
  description: string;
  niveaux: string;
  niveaux_display: string;
  modules: {
    id: number;
    nom: string;
    total_hours: number;
    assigned_hours: number;
    semestre: string;
    v_h_hebdo: number;
    seances: {
      id: number;
      type: string;
      duree: number;
      module_name: string;
      enseignant: number;
      enseignant_name: string;
    }[];
  }[];
}

const WorkloadStatistics: React.FC = () => {
  const roundHours = (v: number) => Math.round(v);
  const [loading, setLoading] = useState(true);
  const [faculty, setFaculty] = useState<TeacherStat[]>([]);
  const [filieres, setFilieres] = useState<FiliereDetail[]>([]);

  // Filtering state
  const [filiereFilter, setFiliereFilter] = useState('ALL');
  const [semesterFilter, setSemesterFilter] = useState('ALL');
  const [moduleSearch, setModuleSearch] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('ALL');

  // Active view tab
  const [activeTab, setActiveTab] = useState<'teachers' | 'modules' | 'filieres' | 'semesters'>('teachers');

  // Recalculation state
  const [recalculating, setRecalculating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [recalculateMessage, setRecalculateMessage] = useState<{
    type: 'success' | 'info' | 'error';
    text: string;
    details?: {
      total_teachers: number;
      sessions_updated: number;
      overloaded_count: number;
      average_workload: number;
      new_teachers?: number;
      new_filieres?: number;
      filieres_without_sessions?: string[];
    };
  } | null>(null);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

      // 1. Fetch Faculty list with their workloads
      const facultyRes = await fetch(`${API_BASE_URL}/api/core/faculty-assignments/`, { headers });
      if (facultyRes.ok) {
        const data = await facultyRes.json();
        setFaculty(data);
      }

      // 2. Fetch Filieres with full module details
      const filieresRes = await fetch(`${API_BASE_URL}/api/core/filiere/details/`, { headers });
      if (filieresRes.ok) {
        const data = await filieresRes.json();
        setFilieres(data);
      }

    } catch (error) {
      console.error('Error fetching workload statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRecalculate = async () => {
    setShowConfirmModal(false);
    setRecalculating(true);
    setRecalculateMessage(null);
    try {
      const token = localStorage.getItem('access_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };
      const res = await fetch(`${API_BASE_URL}/api/core/recalculate-workload/`, {
        method: 'POST',
        headers
      });
      const result = await res.json();
      if (res.ok && result.success) {
        // changed=false means the DB had no new professor and no unassigned
        // session: the endpoint deliberately wrote nothing.
        setRecalculateMessage({
          type: result.changed ? 'success' : 'info',
          text: result.message,
          details: {
            total_teachers: result.total_teachers,
            sessions_updated: result.sessions_updated,
            overloaded_count: result.overloaded_count,
            average_workload: result.average_workload,
            new_teachers: result.new_teachers,
            new_filieres: result.new_filieres,
            filieres_without_sessions: result.filieres_without_sessions
          }
        });
        if (result.changed) {
          // Immediately refresh state with updated calculations
          await fetchData();
        }
      } else {
        setRecalculateMessage({
          type: 'error',
          text: result.error || 'Erreur lors du recalcul des volumes horaires.'
        });
      }
    } catch (error) {
      console.error('Error recalculating workload:', error);
      setRecalculateMessage({
        type: 'error',
        text: 'Erreur réseau lors de la communication avec le serveur.'
      });
    } finally {
      setRecalculating(false);
    }
  };



  const getModuleWorkload = (moduleNom: string) => {
    if (moduleNom.toLowerCase().includes('pfe') || moduleNom.toLowerCase().includes('projet de fin')) {
      return { raw: 0, eqtd: 0, cm: 0, td: 0, tp: 0, cm_eq: 0, td_eq: 0, tp_eq: 0 };
    }
    const match = moduleNom.match(/\(S\d+ - (\d+)h\)/);
    const totalRaw = match ? parseFloat(match[1]) : 48.0;

    const base = totalRaw / 3.25;
    const rawCm = Math.round(base * 1.5);
    const rawTd = Math.round(base * 1.0);
    const rawTp = Math.round(base * 0.75);

    const cm_eq = Math.round(base * 1.5);
    const td_eq = Math.round(base * 1.0);
    const tp_eq = Math.round(base * 0.75);

    return {
      raw: rawCm + rawTd + rawTp,
      eqtd: rawCm + rawTd + rawTp,
      cm: rawCm,
      td: rawTd,
      tp: rawTp,
      cm_eq,
      td_eq,
      tp_eq
    };
  };

  // Process raw data into comprehensive statistics
  const getProcessedStats = () => {
    const teacherMap: { [id: string]: { raw: number; eqtd: number; cm: number; td: number; tp: number } } = {};
    const moduleList: any[] = [];
    const filiereMap: { [name: string]: { raw: number; eqtd: number; cm: number; td: number; tp: number } } = {};
    const semesterMap: { [sem: string]: { raw: number; eqtd: number; cm: number; td: number; tp: number } } = {};

    let totalGlobalRaw = 0;
    let totalGlobalEqtd = 0;
    let totalGlobalCm = 0;
    let totalGlobalTd = 0;
    let totalGlobalTp = 0;

    // Traverse filieres and modules
    for (const fil of filieres) {
      if (filiereFilter !== 'ALL' && fil.nom !== filiereFilter) continue;

      if (!filiereMap[fil.nom]) {
        filiereMap[fil.nom] = { raw: 0, eqtd: 0, cm: 0, td: 0, tp: 0 };
      }

      for (const mod of fil.modules) {
        if (semesterFilter !== 'ALL' && mod.semestre !== semesterFilter) continue;
        if (moduleSearch && !mod.nom.toLowerCase().includes(moduleSearch.toLowerCase())) continue;

        const w = getModuleWorkload(mod.nom);

        let modRaw = 0;
        let modEqtd = 0;
        let modCm = 0;
        let modTd = 0;
        let modTp = 0;

        const parts = ['CM', 'TD', 'TP'];
        parts.forEach(part => {
          const typeSessions = (mod.seances || []).filter(s => s.type === part);
          
          if (teacherFilter === 'ALL') {
            const raw = part === 'CM' ? w.cm : (part === 'TD' ? w.td : w.tp);
            const eq = part === 'CM' ? w.cm_eq : (part === 'TD' ? w.td_eq : w.tp_eq);
            
            modRaw += raw;
            modEqtd += eq;
            if (part === 'CM') modCm += raw;
            else if (part === 'TD') modTd += raw;
            else if (part === 'TP') modTp += raw;

            typeSessions.forEach(s => {
              if (s.enseignant_name) {
                if (!teacherMap[s.enseignant_name]) {
                  teacherMap[s.enseignant_name] = { raw: 0, eqtd: 0, cm: 0, td: 0, tp: 0 };
                }
                teacherMap[s.enseignant_name].raw += raw;
                teacherMap[s.enseignant_name].eqtd += eq;
                if (part === 'CM') teacherMap[s.enseignant_name].cm += raw;
                else if (part === 'TD') teacherMap[s.enseignant_name].td += raw;
                else if (part === 'TP') teacherMap[s.enseignant_name].tp += raw;
              }
            });
          } else {
            const matchedSession = typeSessions.find(s => s.enseignant_name === teacherFilter);
            if (matchedSession) {
              const raw = part === 'CM' ? w.cm : (part === 'TD' ? w.td : w.tp);
              const eq = part === 'CM' ? w.cm_eq : (part === 'TD' ? w.td_eq : w.tp_eq);

              modRaw += raw;
              modEqtd += eq;
              if (part === 'CM') modCm += raw;
              else if (part === 'TD') modTd += raw;
              else if (part === 'TP') modTp += raw;

              if (!teacherMap[teacherFilter]) {
                teacherMap[teacherFilter] = { raw: 0, eqtd: 0, cm: 0, td: 0, tp: 0 };
              }
              teacherMap[teacherFilter].raw += raw;
              teacherMap[teacherFilter].eqtd += eq;
              if (part === 'CM') teacherMap[teacherFilter].cm += raw;
              else if (part === 'TD') teacherMap[teacherFilter].td += raw;
              else if (part === 'TP') teacherMap[teacherFilter].tp += raw;
            }
          }
        });

        if (modRaw > 0) {
          moduleList.push({
            id: mod.id,
            nom: mod.nom,
            filiere: fil.nom,
            semestre: mod.semestre || 'N/A',
            raw: modRaw,
            eqtd: modEqtd,
            cm: modCm,
            td: modTd,
            tp: modTp
          });

          filiereMap[fil.nom].raw += modRaw;
          filiereMap[fil.nom].eqtd += modEqtd;
          filiereMap[fil.nom].cm += modCm;
          filiereMap[fil.nom].td += modTd;
          filiereMap[fil.nom].tp += modTp;

          const semKey = mod.semestre || 'N/A';
          if (!semesterMap[semKey]) {
            semesterMap[semKey] = { raw: 0, eqtd: 0, cm: 0, td: 0, tp: 0 };
          }
          semesterMap[semKey].raw += modRaw;
          semesterMap[semKey].eqtd += modEqtd;
          semesterMap[semKey].cm += modCm;
          semesterMap[semKey].td += modTd;
          semesterMap[semKey].tp += modTp;

          totalGlobalRaw += modRaw;
          totalGlobalEqtd += modEqtd;
          totalGlobalCm += modCm;
          totalGlobalTd += modTd;
          totalGlobalTp += modTp;
        }
      }
    }

    return {
      teacherMap,
      moduleList,
      filiereMap,
      semesterMap,
      global: {
        raw: totalGlobalRaw,
        eqtd: totalGlobalEqtd,
        cm: totalGlobalCm,
        td: totalGlobalTd,
        tp: totalGlobalTp
      }
    };
  };

  const stats = getProcessedStats();

  // Teachers status lists
  const teachersAboveSeuil = faculty.filter(t => t.workload > t.maxWorkload);
  const teachersBelowSeuil = faculty.filter(t => t.workload < t.maxWorkload);
  const teachersAtSeuil = faculty.filter(t => t.workload === t.maxWorkload);

  // List of unique filieres and teachers for dropdown filters
  const uniqueFiliereNames = Array.from(new Set(filieres.map(f => f.nom)));

  // Dynamically compute teachers active in the currently filtered filieres and semesters
  const visibleTeacherNames = React.useMemo(() => {
    const activeTeachers = new Set<string>();
    for (const fil of filieres) {
      if (filiereFilter !== 'ALL' && fil.nom !== filiereFilter) continue;
      for (const mod of fil.modules) {
        if (semesterFilter !== 'ALL' && mod.semestre !== semesterFilter) continue;
        for (const s of (mod.seances || [])) {
          if (s.enseignant_name) {
            activeTeachers.add(s.enseignant_name);
          }
        }
      }
    }
    return Array.from(activeTeachers).sort();
  }, [filieres, filiereFilter, semesterFilter]);

  // Auto-reset teacher filter if the selected teacher is no longer active in the selected filters
  useEffect(() => {
    if (teacherFilter !== 'ALL' && !visibleTeacherNames.includes(teacherFilter)) {
      setTeacherFilter('ALL');
    }
  }, [visibleTeacherNames, teacherFilter]);

  const handleExportExcel = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams();
      params.append('export_type', activeTab);
      
      if (filiereFilter !== 'ALL') {
        const found = filieres.find(f => f.nom === filiereFilter);
        if (found) params.append('filiere_id', found.id.toString());
      }
      
      if (semesterFilter !== 'ALL') {
        params.append('semester', semesterFilter);
      }
      
      if (teacherFilter !== 'ALL') {
        const found = faculty.find(f => f.name === teacherFilter);
        if (found) params.append('enseignant_id', found.id);
      }

      const url = `${API_BASE_URL}/api/core/export-workload/?${params.toString()}`;
      
      const response = await fetch(url, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (!response.ok) {
        throw new Error('Failed to export workload');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `Volume_Horaire_Rapport_${activeTab}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error('Error exporting workload Excel:', error);
      alert('Erreur lors de l\'exportation du volume horaire.');
    }
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-base border-b border-outline-variant pb-md">
        <div>
          <p className="font-label-caps text-label-caps text-primary opacity-70 mb-xs uppercase">Espace Administration</p>
          <h1 className="font-h1 text-h1 text-on-background">Gestion des Volumes Horaires & Statistiques</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
            Visualisation globale, répartition par cours, et suivi des seuils statutaires du département.
          </p>
        </div>
        <div className="flex items-center gap-base">
          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={recalculating}
            className="bg-surface-container-lowest hover:bg-surface-container-low text-primary font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-lg shadow-md flex items-center gap-2 transition-all border border-outline-variant cursor-pointer disabled:opacity-60 disabled:cursor-wait"
          >
            <span className={`material-symbols-outlined text-[18px] ${recalculating ? 'animate-spin' : ''}`}>
              {recalculating ? 'progress_activity' : 'calculate'}
            </span>
            {recalculating ? 'Recalcul en cours...' : 'Recalculer les Volumes'}
          </button>
          <button
            onClick={handleExportExcel}
            className="bg-primary hover:bg-primary/95 text-on-primary font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-lg shadow-md flex items-center gap-2 transition-all border-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">download_for_offline</span>
            Exporter Rapport Excel
          </button>
        </div>
      </div>

      {/* Recalculation result banner */}
      {recalculateMessage && (
        <div
          className={`rounded-xl border p-md flex items-start gap-sm shadow-sm ${
            recalculateMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : recalculateMessage.type === 'info'
              ? 'bg-sky-50 border-sky-200 text-sky-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <span className="material-symbols-outlined text-[22px] shrink-0">
            {recalculateMessage.type === 'success'
              ? 'check_circle'
              : recalculateMessage.type === 'info'
              ? 'info'
              : 'error'}
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold">{recalculateMessage.text}</p>
            {recalculateMessage.details && recalculateMessage.type !== 'error' && (
              <div className="flex flex-wrap gap-md mt-xs text-xs opacity-90">
                <span>Enseignants : <strong>{recalculateMessage.details.total_teachers}</strong></span>
                <span>Séances modifiées : <strong>{recalculateMessage.details.sessions_updated}</strong></span>
                <span>Nouveaux enseignants : <strong>{recalculateMessage.details.new_teachers ?? 0}</strong></span>
                <span>Surchargés : <strong>{recalculateMessage.details.overloaded_count}</strong></span>
                <span>Charge moyenne : <strong>{recalculateMessage.details.average_workload}h</strong></span>
              </div>
            )}
          </div>
          <button
            onClick={() => setRecalculateMessage(null)}
            className="text-current opacity-60 hover:opacity-100 transition-opacity cursor-pointer bg-transparent border-0"
            aria-label="Fermer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* Bento Grid: Statistics Cards */}
      <div className="grid grid-cols-12 gap-gutter">
        
        {/* Global Volume Card */}
        <div className="col-span-12 md:col-span-4 bg-surface-container-lowest rounded-xl border border-outline-variant p-md flex flex-col justify-between shadow-sm">
          <div>
            <span className="font-label-caps text-label-caps text-on-surface-variant">Volume Global Département</span>
            <p className="font-h1 text-4xl font-extrabold text-primary mt-sm">
              {roundHours(stats.global.eqtd)} <span className="text-sm font-normal text-on-surface-variant">Heures EqTD</span>
            </p>
          </div>
          <div className="border-t border-outline-variant mt-md pt-sm flex justify-between text-xs text-on-surface-variant">
            <span>Volume Brut: {roundHours(stats.global.raw)}h</span>
            <span>Ratio: {((stats.global.eqtd / (stats.global.raw || 1)) * 100).toFixed(0)}% EqTD</span>
          </div>
        </div>

        {/* Course Part Breakdown Card */}
        <div className="col-span-12 md:col-span-4 bg-surface-container-lowest rounded-xl border border-outline-variant p-md flex flex-col justify-between shadow-sm">
          <div>
            <span className="font-label-caps text-label-caps text-on-surface-variant">Répartition par Type</span>
            <div className="grid grid-cols-3 gap-xs mt-sm text-center">
              <div className="bg-sky-50 border border-sky-100 rounded p-xs">
                <span className="text-[10px] font-bold text-sky-850 uppercase">CM (*1.5)</span>
                <p className="font-semibold text-sm text-sky-900 mt-xs">{roundHours(stats.global.cm)}h</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded p-xs">
                <span className="text-[10px] font-bold text-emerald-850 uppercase">TD (*1.0)</span>
                <p className="font-semibold text-sm text-emerald-900 mt-xs">{roundHours(stats.global.td)}h</p>
              </div>
              <div className="bg-purple-50 border border-purple-100 rounded p-xs">
                <span className="text-[10px] font-bold text-purple-850 uppercase">TP (*0.75)</span>
                <p className="font-semibold text-sm text-purple-900 mt-xs">{roundHours(stats.global.tp)}h</p>
              </div>
            </div>
          </div>
          <div className="text-[10px] text-outline text-center mt-base italic">
            Calculé sur la base de la répartition dynamique 50/50 CM et TD/TP.
          </div>
        </div>

        {/* Teachers Thresholds Card */}
        <div className="col-span-12 md:col-span-4 bg-surface-container-lowest rounded-xl border border-outline-variant p-md flex flex-col justify-between shadow-sm">
          <div>
            <span className="font-label-caps text-label-caps text-on-surface-variant">Suivi des Seuils Enseignants</span>
            <div className="flex justify-around items-center mt-sm">
              <div className="text-center">
                <p className="font-h2 text-h2 text-red-650 font-bold">{teachersAboveSeuil.length}</p>
                <span className="text-[10px] uppercase font-bold text-slate-500">Surchargés</span>
              </div>
              <div className="text-center border-x border-outline-variant px-md">
                <p className="font-h2 text-h2 text-emerald-700 font-bold">{teachersBelowSeuil.length}</p>
                <span className="text-[10px] uppercase font-bold text-slate-500">Sous-seuil</span>
              </div>
              <div className="text-center">
                <p className="font-h2 text-h2 text-slate-700 font-bold">{teachersAtSeuil.length}</p>
                <span className="text-[10px] uppercase font-bold text-slate-500">Au Seuil</span>
              </div>
            </div>
          </div>
          <div className="border-t border-outline-variant mt-md pt-sm text-center text-xs">
            <span className="text-on-surface-variant">Total Professeurs Actifs : </span>
            <strong className="text-primary">{faculty.length}</strong>
          </div>
        </div>

      </div>

      {/* Interactive Filters Bar */}
      <div className="bg-surface-container-low border border-outline-variant rounded-xl p-md flex flex-wrap gap-md items-center shadow-sm">
        <h4 className="font-label-caps text-label-caps text-outline flex items-center gap-xs">
          <span className="material-symbols-outlined text-[18px]">tune</span>
          Filtres
        </h4>

        {/* Filiere Filter */}
        <div className="w-[180px]">
          <select
            value={filiereFilter}
            onChange={(e) => setFiliereFilter(e.target.value)}
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">Toutes les filières</option>
            {uniqueFiliereNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        {/* Semester Filter */}
        <div className="w-[150px]">
          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">Tous les semestres</option>
            {['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10'].map((sem) => (
              <option key={sem} value={sem}>{sem}</option>
            ))}
          </select>
        </div>

        {/* Teacher Filter */}
        <div className="w-[180px]">
          <select
            value={teacherFilter}
            onChange={(e) => setTeacherFilter(e.target.value)}
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">Tous les enseignants</option>
            {visibleTeacherNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        {/* Module Search */}
        <div className="flex-1 min-w-[200px] relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant">search</span>
          <input
            type="text"
            placeholder="Rechercher un module..."
            value={moduleSearch}
            onChange={(e) => setModuleSearch(e.target.value)}
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </div>

        {/* Clear Filters */}
        {(filiereFilter !== 'ALL' || semesterFilter !== 'ALL' || teacherFilter !== 'ALL' || moduleSearch) && (
          <button
            onClick={() => {
              setFiliereFilter('ALL');
              setSemesterFilter('ALL');
              setTeacherFilter('ALL');
              setModuleSearch('');
            }}
            className="text-xs font-bold text-red-650 hover:text-red-800 transition-colors uppercase tracking-wider flex items-center gap-xs cursor-pointer border-0 bg-transparent"
          >
            <span className="material-symbols-outlined text-[16px]">clear_all</span>
            Réinitialiser
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-outline-variant">
        <button
          onClick={() => setActiveTab('teachers')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all border-b-2 bg-transparent cursor-pointer ${
            activeTab === 'teachers' 
              ? 'text-primary border-primary font-bold' 
              : 'text-on-surface-variant border-transparent hover:text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-lg">person</span>
          Par Enseignant
        </button>
        <button
          onClick={() => setActiveTab('modules')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all border-b-2 bg-transparent cursor-pointer ${
            activeTab === 'modules' 
              ? 'text-primary border-primary font-bold' 
              : 'text-on-surface-variant border-transparent hover:text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-lg">book</span>
          Par Module
        </button>
        <button
          onClick={() => setActiveTab('filieres')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all border-b-2 bg-transparent cursor-pointer ${
            activeTab === 'filieres' 
              ? 'text-primary border-primary font-bold' 
              : 'text-on-surface-variant border-transparent hover:text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-lg">account_tree</span>
          Par Filière
        </button>
        <button
          onClick={() => setActiveTab('semesters')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all border-b-2 bg-transparent cursor-pointer ${
            activeTab === 'semesters' 
              ? 'text-primary border-primary font-bold' 
              : 'text-on-surface-variant border-transparent hover:text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-lg">calendar_view_month</span>
          Par Semestre
        </button>
      </div>

      {/* Tab Contents */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-md">
        
        {/* Enseignant Tab */}
        {activeTab === 'teachers' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className="font-label-caps text-label-caps py-base">Nom de l'Enseignant</th>
                  <th className="font-label-caps text-label-caps py-base">Département</th>
                  <th className="font-label-caps text-label-caps py-base text-center">Volume EqTD</th>
                  <th className="font-label-caps text-label-caps py-base text-center">Seuil Statutaire</th>
                  <th className="font-label-caps text-label-caps py-base text-right">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {faculty.filter(t => teacherFilter === 'ALL' || t.name === teacherFilter).map((t) => (
                  <tr key={t.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-sm font-semibold">{t.name}</td>
                    <td className="py-sm text-sm text-on-surface-variant">{t.department}</td>
                    <td className="py-sm text-sm text-center font-bold text-primary">{roundHours(t.workload)}h</td>
                    <td className="py-sm text-sm text-center text-on-surface-variant">{t.maxWorkload}h</td>
                    <td className="py-sm text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        t.workload > t.maxWorkload 
                          ? 'bg-red-50 text-red-700' 
                          : t.workload === t.maxWorkload 
                          ? 'bg-sky-50 text-sky-700' 
                          : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {t.workload > t.maxWorkload ? 'Surchargé' : t.workload === t.maxWorkload ? 'Au Seuil' : 'Sous-seuil'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modules Tab */}
        {activeTab === 'modules' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className="font-label-caps text-label-caps py-base">Module</th>
                  <th className="font-label-caps text-label-caps py-base">Filière</th>
                  <th className="font-label-caps text-label-caps py-base text-center">Semestre</th>
                  <th className="font-label-caps text-label-caps py-base text-center">Brut CM</th>
                  <th className="font-label-caps text-label-caps py-base text-center">Brut TD</th>
                  <th className="font-label-caps text-label-caps py-base text-center">Brut TP</th>
                  <th className="font-label-caps text-label-caps py-base text-center">Volume EqTD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {stats.moduleList.map((m) => (
                  <tr key={m.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-sm font-semibold">{m.nom}</td>
                    <td className="py-sm text-sm text-on-surface-variant">{m.filiere}</td>
                    <td className="py-sm text-sm text-center font-bold">{m.semestre}</td>
                    <td className="py-sm text-sm text-center text-on-surface-variant">{roundHours(m.cm)}h</td>
                    <td className="py-sm text-sm text-center text-on-surface-variant">{roundHours(m.td)}h</td>
                    <td className="py-sm text-sm text-center text-on-surface-variant">{roundHours(m.tp)}h</td>
                    <td className="py-sm text-sm text-center font-bold text-primary">{roundHours(m.eqtd)}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Filières Tab */}
        {activeTab === 'filieres' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className="font-label-caps text-label-caps py-base">Filière</th>
                  <th className="font-label-caps text-label-caps py-base text-center">Volume Brut</th>
                  <th className="font-label-caps text-label-caps py-base text-center">Part CM</th>
                  <th className="font-label-caps text-label-caps py-base text-center">Part TD</th>
                  <th className="font-label-caps text-label-caps py-base text-center">Part TP</th>
                  <th className="font-label-caps text-label-caps py-base text-center">Volume EqTD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {Object.entries(stats.filiereMap).map(([name, data]: [string, any]) => (
                  <tr key={name} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-sm font-semibold">{name}</td>
                    <td className="py-sm text-sm text-center text-on-surface-variant">{roundHours(data.raw)}h</td>
                    <td className="py-sm text-sm text-center text-on-surface-variant">{roundHours(data.cm)}h</td>
                    <td className="py-sm text-sm text-center text-on-surface-variant">{roundHours(data.td)}h</td>
                    <td className="py-sm text-sm text-center text-on-surface-variant">{roundHours(data.tp)}h</td>
                    <td className="py-sm text-sm text-center font-bold text-primary">{roundHours(data.eqtd)}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Semesters Tab */}
        {activeTab === 'semesters' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className="font-label-caps text-label-caps py-base">Semestre</th>
                  <th className="font-label-caps text-label-caps py-base text-center">Volume Brut</th>
                  <th className="font-label-caps text-label-caps py-base text-center">Part CM</th>
                  <th className="font-label-caps text-label-caps py-base text-center">Part TD</th>
                  <th className="font-label-caps text-label-caps py-base text-center">Part TP</th>
                  <th className="font-label-caps text-label-caps py-base text-center">Volume EqTD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {Object.entries(stats.semesterMap)
                  .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))
                  .map(([name, data]: [string, any]) => (
                    <tr key={name} className="hover:bg-surface-container-low transition-colors">
                      <td className="py-sm font-semibold">{name}</td>
                      <td className="py-sm text-sm text-center text-on-surface-variant">{roundHours(data.raw)}h</td>
                      <td className="py-sm text-sm text-center text-on-surface-variant">{roundHours(data.cm)}h</td>
                      <td className="py-sm text-sm text-center text-on-surface-variant">{roundHours(data.td)}h</td>
                      <td className="py-sm text-sm text-center text-on-surface-variant">{roundHours(data.tp)}h</td>
                      <td className="py-sm text-sm text-center font-bold text-primary">{roundHours(data.eqtd)}h</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Recalculation confirmation modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-2xl w-full max-w-2xl p-lg space-y-md">
            <div className="flex items-start gap-sm">
              <span className="material-symbols-outlined text-primary text-[28px]">calculate</span>
              <div>
                <h3 className="font-h3 text-h3 text-on-background">Recalculer les volumes horaires</h3>
                <p className="text-sm text-on-surface-variant mt-xs leading-relaxed">
                  La répartition sera recalculée pour tenir compte des nouveaux enseignants
                  et des modules encore sans attributaire.
                </p>
              </div>
            </div>

            <ul className="text-xs text-on-surface-variant space-y-1 list-disc pl-5">
              <li>Un nouveau professeur déclenche un rééquilibrage complet sous les seuils statutaires.</li>
              <li>Sans nouveau professeur, seules les séances sans enseignant sont attribuées.</li>
              <li>Si la base n'a rien de nouveau, aucun volume horaire n'est modifié.</li>
            </ul>

            <div className="flex justify-end gap-sm pt-sm border-t border-outline-variant">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-on-surface-variant hover:bg-surface-container-low transition-colors cursor-pointer border-0 bg-transparent"
              >
                Annuler
              </button>
              <button
                onClick={handleRecalculate}
                className="bg-primary hover:bg-primary/95 text-on-primary px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border-0 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">done_all</span>
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default WorkloadStatistics;
