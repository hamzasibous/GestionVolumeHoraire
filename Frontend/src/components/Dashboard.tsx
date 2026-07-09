import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

interface DashboardStats {
  total_filieres: number;
  total_modules: number;
  total_profs: number;
  total_rooms: number;
  total_hours: number;
  total_students: number;
  avg_workload: number;
  type_stats: {
    CM: number;
    TD: number;
    TP: number;
  };
  filieres: any[];
}

interface TimetableSlot {
  id: string;
  day: string;
  module: string;
  room: string;
  type: string;
  teacher: string;
  time: string;
}

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);

  // Coordinator Notes State
  const [noteText, setNoteText] = useState(() => {
    return localStorage.getItem('coordinator_note') || "Garder un suivi des notes administratives privées et des modifications de programme ici.";
  });
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [tempNote, setTempNote] = useState(noteText);

  const loadDashboardData = async () => {
    const token = localStorage.getItem('access_token');
    const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

    try {
      const statsRes = await fetch('http://localhost:8000/api/core/dashboard-stats/', { headers });
      const statsData = await statsRes.json();
      setStats(statsData);

      const profileRes = await fetch('http://localhost:8000/api/users/profile/', { headers });
      const profileData = await profileRes.json();
      setCurrentUser(profileData);

      // If program coordinator, fetch program timetable slots
      if (profileData.role && profileData.role.includes('RESPONSABLE_FILIERE') && profileData.filiere) {
        const slotsRes = await fetch(`http://localhost:8000/api/core/sceance/?filiere=${profileData.filiere}`, { headers });
        const slotsData = await slotsRes.json();
        
        // Map first 5 slots for summary
        const daysOrder = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        const mapped = slotsData.map((s: any) => {
          const slotDate = new Date(s.date);
          const dayName = daysOrder[slotDate.getDay() - 1] || 'Lundi';
          return {
            id: s.id.toString(),
            day: dayName,
            module: s.module_name,
            room: s.local_name,
            type: s.type,
            teacher: s.enseignant_name || 'Non assigné',
            time: s.heure_debut ? s.heure_debut.slice(0, 5) : '08:30'
          };
        }).slice(0, 8);
        setTimetableSlots(mapped);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleSaveNote = () => {
    localStorage.setItem('coordinator_note', tempNote);
    setNoteText(tempNote);
    setIsEditingNote(false);
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">sync</span>
      </div>
    );
  }

  // --- RENDERING 1: FILIERE COORDINATOR DASHBOARD ---
  if (currentUser?.role && currentUser.role.includes('RESPONSABLE_FILIERE') && !currentUser.role.includes('ADMIN') && !currentUser.role.includes('CHEF_DEPARTEMENT')) {
    return (
      <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-outline-variant pb-md">
          <div>
            <p className="font-label-caps text-secondary font-black uppercase tracking-widest text-[10px] mb-1">Espace Responsable de Filière</p>
            <h1 className="font-h1 text-h1 text-on-surface tracking-tight">{currentUser.filiere_name || "Filière Académique"}</h1>
            <p className="text-on-surface-variant font-body-md text-sm mt-1">Année Académique 2026-2027 • Semestre 1</p>
          </div>
          <div className="flex gap-2">
            <Link 
              to="/timetable"
              className="flex items-center gap-2 bg-white border border-outline-variant px-5 py-2.5 rounded-xl font-label-caps text-on-surface hover:bg-surface-container font-bold text-[10px] uppercase tracking-wider transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">calendar_today</span>
              Gérer l'Emploi
            </Link>
            <Link 
              to="/programs"
              className="flex items-center gap-2 bg-primary text-on-primary hover:bg-primary-container px-5 py-2.5 rounded-xl font-label-caps font-bold text-[10px] uppercase tracking-wider transition-all shadow-md hover:scale-[1.02]"
            >
              <span className="material-symbols-outlined text-[18px]">account_tree</span>
              Voir Modules
            </Link>
          </div>
        </div>

        {/* Key Stats Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-surface-container-lowest p-5 border border-outline-variant rounded-2xl shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 bg-primary-fixed/20 rounded-xl flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>book</span>
            </div>
            <div>
              <h3 className="font-h2 text-2xl font-black text-on-surface">{stats.total_modules}</h3>
              <p className="font-label-caps text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Modules Actifs</p>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-5 border border-outline-variant rounded-2xl shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 bg-secondary-fixed/20 rounded-xl flex items-center justify-center text-secondary-container">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>person_search</span>
            </div>
            <div>
              <h3 className="font-h2 text-2xl font-black text-on-surface">{stats.total_profs}</h3>
              <p className="font-label-caps text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Professeurs</p>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-5 border border-outline-variant rounded-2xl shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 bg-tertiary-fixed/20 rounded-xl flex items-center justify-center text-tertiary-container">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
            </div>
            <div>
              <h3 className="font-h2 text-2xl font-black text-on-surface">{stats.total_students}</h3>
              <p className="font-label-caps text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Étudiants Inscrits</p>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-5 border border-outline-variant rounded-2xl shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-800">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            </div>
            <div>
              <h3 className="font-h2 text-2xl font-black text-emerald-800">01</h3>
              <p className="font-label-caps text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Statut Validé</p>
            </div>
          </div>
        </div>

        {/* Main Layout: Timetable & Faculty Directory */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Full View Timetable Summary (8 Columns) */}
          <section className="lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden flex flex-col shadow-sm">
            <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-slate-50">
              <h3 className="font-h3 text-h3 text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">calendar_today</span>
                Emploi du Temps Global de la Filière
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-outline-variant">
                    <th className="p-4 font-label-caps text-label-caps text-outline uppercase tracking-wider w-24">Heures</th>
                    <th className="p-4 font-label-caps text-label-caps text-outline uppercase tracking-wider w-28">Jour</th>
                    <th className="p-4 font-label-caps text-label-caps text-outline uppercase tracking-wider">Séance / Cours</th>
                    <th className="p-4 font-label-caps text-label-caps text-outline uppercase tracking-wider">Salle</th>
                    <th className="p-4 font-label-caps text-label-caps text-outline uppercase tracking-wider">Enseignant</th>
                  </tr>
                </thead>
                <tbody className="font-table-data text-table-data text-on-surface divide-y divide-slate-100">
                  {timetableSlots.length > 0 ? (
                    timetableSlots.map((slot) => (
                      <tr key={slot.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-bold text-primary">{slot.time}</td>
                        <td className="p-4 font-semibold text-on-surface-variant">{slot.day}</td>
                        <td className="p-4 font-medium">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider mr-2 ${
                            slot.type === 'CM' ? 'bg-primary/10 text-primary' : 'bg-orange-500/10 text-orange-600'
                          }`}>{slot.type}</span>
                          {slot.module}
                        </td>
                        <td className="p-4 font-semibold text-on-surface-variant">{slot.room}</td>
                        <td className="p-4 text-on-surface">{slot.teacher}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-on-surface-variant italic">
                        Aucun cours planifié pour la semaine courante.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-outline-variant flex justify-center bg-slate-50">
              <Link to="/timetable" className="text-primary font-label-caps text-[11px] hover:underline font-bold uppercase tracking-wider flex items-center gap-1">
                Visualiser la semaine complète <span className="material-symbols-outlined text-sm">open_in_full</span>
              </Link>
            </div>
          </section>

          {/* Coordinators Quick Tools (4 Columns) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Coordinator's Notes */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[220px]">
              <div>
                <h3 className="font-h3 text-h3 text-primary mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">clinical_notes</span>
                  Notes du Coordinateur
                </h3>
                {isEditingNote ? (
                  <textarea 
                    value={tempNote}
                    onChange={(e) => setTempNote(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all h-28 resize-none"
                  />
                ) : (
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    "{noteText}"
                  </p>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                {isEditingNote ? (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsEditingNote(false)}
                      className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-colors"
                    >
                      Annuler
                    </button>
                    <button 
                      onClick={handleSaveNote}
                      className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-[10px] uppercase tracking-wider transition-colors"
                    >
                      Enregistrer
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => {
                      setTempNote(noteText);
                      setIsEditingNote(true);
                    }}
                    className="text-primary font-label-caps text-[10px] font-bold border-b border-primary border-dashed hover:text-primary-container uppercase tracking-wider"
                  >
                    Modifier la note
                  </button>
                )}
              </div>
            </div>

            {/* Upcoming Deadlines */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm">
              <h3 className="font-h3 text-h3 text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">assignment</span>
                Échéances Clés
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-red-50 border-l-4 border-red-500 rounded-lg">
                  <span className="material-symbols-outlined text-red-600">event_busy</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">Validation des Emplois</p>
                    <p className="text-[10px] text-slate-500">Sous 48 heures</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-orange-50 border-l-4 border-orange-500 rounded-lg">
                  <span className="material-symbols-outlined text-orange-600">event_note</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">Revue du catalogue de modules</p>
                    <p className="text-[10px] text-slate-500">Avant fin Octobre</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDERING 2: SYSTEM ADMIN & DEPARTMENT HEAD DASHBOARD ---
  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div>
        <h1 className="font-h1 text-h1 text-on-surface mb-xs">{t('dashboard.title')}</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">{t('dashboard.subtitle')}</p>
      </div>

      {/* Bento Grid: Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Hourly Volume */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 flex flex-col justify-between shadow-sm min-h-[140px]">
          <div className="flex justify-between items-start mb-sm">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">{t('dashboard.total_volume')}</span>
            <div className="w-8 h-8 rounded-lg bg-primary-fixed/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
            </div>
          </div>
          <div>
            <div className="font-h2 text-2xl font-black text-on-surface">{stats.total_hours.toLocaleString()} h</div>
            <div className="mt-1 font-body-md text-xs text-primary flex items-center gap-1 font-semibold">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              Volume total EqTD
            </div>
          </div>
        </div>

        {/* Card 2: Avg Workload */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 flex flex-col justify-between shadow-sm min-h-[140px]">
          <div className="flex justify-between items-start mb-sm">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">{t('dashboard.avg_workload')}</span>
            <div className="w-8 h-8 rounded-lg bg-secondary-fixed/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary-container" style={{ fontVariationSettings: "'FILL' 1" }}>assignment_ind</span>
            </div>
          </div>
          <div>
            <div className="font-h2 text-2xl font-black text-on-surface">{stats.avg_workload} h</div>
            <div className="mt-1 font-body-md text-xs text-on-surface-variant">
              Moyenne par enseignant
            </div>
          </div>
        </div>

        {/* Card 3: Faculty Count */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 flex flex-col justify-between shadow-sm min-h-[140px]">
          <div className="flex justify-between items-start mb-sm">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">{t('dashboard.total_faculty')}</span>
            <div className="w-8 h-8 rounded-lg bg-primary-fixed/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
            </div>
          </div>
          <div>
            <div className="font-h2 text-2xl font-black text-on-surface">{stats.total_profs}</div>
            <div className="mt-1 font-body-md text-xs text-secondary-container font-semibold">
              Enseignants actifs
            </div>
          </div>
        </div>

        {/* Card 4: Active Programs */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 flex flex-col justify-between shadow-sm min-h-[140px]">
          <div className="flex justify-between items-start mb-sm">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">{t('dashboard.active_programs')}</span>
            <div className="w-8 h-8 rounded-lg bg-tertiary-fixed/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-tertiary-container" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
            </div>
          </div>
          <div>
            <div className="font-h2 text-2xl font-black text-on-surface">{stats.total_filieres}</div>
            <div className="mt-1 font-body-md text-xs text-on-surface-variant">
              Filières enregistrées
            </div>
          </div>
        </div>
      </div>

      {/* Chart & Data Table Section */}
      <div className="grid grid-cols-12 gap-6">
        {/* Chart Module (Left) */}
        <div className="col-span-12 lg:col-span-5 bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 flex flex-col shadow-sm">
          <div className="mb-4">
            <h3 className="font-h3 text-h3 text-on-surface">{t('dashboard.breakdown_title')}</h3>
            <p className="font-body-md text-xs text-on-surface-variant">{t('dashboard.breakdown_subtitle')}</p>
          </div>
          <div className="flex-1 flex flex-col justify-center py-4">
            <div className="w-full h-8 rounded-full overflow-hidden flex bg-surface-container shadow-inner mb-6 border border-outline-variant/30">
              <div className="bg-primary h-full" style={{ width: `${stats.type_stats.CM}%` }} title={`CM: ${stats.type_stats.CM}%`}></div>
              <div className="bg-secondary-container h-full" style={{ width: `${stats.type_stats.TD}%` }} title={`TD: ${stats.type_stats.TD}%`}></div>
              <div className="bg-tertiary-container h-full" style={{ width: `${stats.type_stats.TP}%` }} title={`TP: ${stats.type_stats.TP}%`}></div>
            </div>
            <div className="flex flex-col gap-3 px-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-primary"></span>
                  <span className="font-body-md text-sm text-on-surface">{t('dashboard.legend_cm')}</span>
                </div>
                <span className="font-h3 text-lg font-black text-on-surface">{stats.type_stats.CM}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-secondary-container"></span>
                  <span className="font-body-md text-sm text-on-surface">{t('dashboard.legend_td')}</span>
                </div>
                <span className="font-h3 text-lg font-black text-on-surface">{stats.type_stats.TD}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-tertiary-container"></span>
                  <span className="font-body-md text-sm text-on-surface">{t('dashboard.legend_tp')}</span>
                </div>
                <span className="font-h3 text-lg font-black text-on-surface">{stats.type_stats.TP}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table Module (Right) */}
        <div className="col-span-12 lg:col-span-7 bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden flex flex-col shadow-sm">
          <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-slate-50">
            <div>
              <h3 className="font-h3 text-h3 text-on-surface">{t('dashboard.table_title')}</h3>
              <p className="font-body-md text-xs text-on-surface-variant">{t('dashboard.table_subtitle')}</p>
            </div>
          </div>
          <div className="overflow-auto flex-1 h-[270px]">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-outline-variant sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="py-3 px-4 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">{t('dashboard.table_col_name')}</th>
                  <th className="py-3 px-4 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">{t('dashboard.table_col_level')}</th>
                  <th className="py-3 px-4 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider text-right">{t('dashboard.table_col_hours')}</th>
                  <th className="py-3 px-4 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider text-center">{t('dashboard.table_col_status')}</th>
                </tr>
              </thead>
              <tbody className="font-table-data text-table-data text-on-surface divide-y divide-slate-100">
                {stats.filieres.map((filiere: any, index: number) => (
                  <tr key={index} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4 font-medium">{filiere.name}</td>
                    <td className="py-4 px-4 text-on-surface-variant">{filiere.level}</td>
                    <td className="py-4 px-4 text-right font-medium">{filiere.totalHours.toLocaleString()}</td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                        filiere.status === 'Validated' ? 'bg-primary-fixed text-on-primary-fixed' :
                        filiere.status === 'In Review' ? 'bg-secondary-fixed text-on-secondary-fixed' :
                        'bg-surface-variant text-on-surface-variant border border-outline-variant'
                      }`}>
                        {filiere.status === 'Validated' ? t('dashboard.status.validated') : 
                         filiere.status === 'In Review' ? t('dashboard.status.review') : 
                         t('dashboard.status.draft')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
