import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import HolidayCalendar from './HolidayCalendar';
import { useTranslation } from 'react-i18next';

const dayTranslations: { [key: string]: string } = {
  'Lundi': 'days.monday',
  'Mardi': 'days.tuesday',
  'Mercredi': 'days.wednesday',
  'Jeudi': 'days.thursday',
  'Vendredi': 'days.friday',
  'Samedi': 'days.saturday',
};

const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

interface TimeConfig {
  label: string;
  start: string;
  end: string;
  isBreak?: boolean;
}

const timeConfig: TimeConfig[] = [
  { label: '08:30', start: '08:30', end: '10:30' },
  { label: 'Pause', start: '10:30', end: '10:45', isBreak: true },
  { label: '10:45', start: '10:45', end: '12:45' },
  { label: 'Midi', start: '12:45', end: '14:30', isBreak: true },
  { label: '14:30', start: '14:30', end: '16:30' },
  { label: 'Pause', start: '16:30', end: '16:45', isBreak: true },
  { label: '16:45', start: '16:45', end: '18:45' },
];

const getMonday = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
};

const timeToMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const addMinutes = (time: string, minutes: number) => {
  const totalMinutes = timeToMinutes(time) + minutes;
  const newH = Math.floor(totalMinutes / 60);
  const newM = totalMinutes % 60;
  return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
};

const SimulatedTimetable: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { simulationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  
  const [simulation, setSimulation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const getLocalizedLabel = (lbl: string) => {
    if (lbl === 'Pause') return t('teacher_timetable.break');
    if (lbl === 'Midi') return t('teacher_timetable.noon');
    return lbl;
  };
  
  // Navigation & Filtering (Matching Timetable.tsx)
  const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));
  const [selectedFiliereId, setSelectedFiliereId] = useState<string>(queryParams.get('filiereId') || '');
  const [selectedSemester, setSelectedSemester] = useState<string>(queryParams.get('semester') || '');
  const [showNavCalendar, setShowNavCalendar] = useState(false);
  const [isListView, setIsListView] = useState(false);
  
  // Metadata for dropdowns
  const [uniqueFilieres, setUniqueFilieres] = useState<any[]>([]);

  useEffect(() => {
    fetch(`http://localhost:8000/api/analyse/simulations/${simulationId}/`)
      .then(res => res.json())
      .then(data => {
        setSimulation(data);
        if (data.result_data) {
          const filieresMap: Record<number, any> = {};
          data.result_data.forEach((s: any) => {
            if (!filieresMap[s.filiere_id]) {
                filieresMap[s.filiere_id] = { id: s.filiere_id, nom: s.filiere_name || s.filiere || `Filière ${s.filiere_id}` };
            }
          });
          setUniqueFilieres(Object.values(filieresMap));
        }
        
        if (data.anneeCible) {
            const targetDate = new Date(data.anneeCible, 8, 15);
            setCurrentWeekStart(getMonday(targetDate));
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching simulation:", err);
        setLoading(false);
      });
  }, [simulationId]);

  const weekDates = days.map((_, index) => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + index);
    return d;
  });

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeekStart(newDate);
  };

  const handleFiliereChange = (id: string) => {
    setSelectedFiliereId(id);
    const newParams = new URLSearchParams(location.search);
    if (id) newParams.set('filiereId', id); else newParams.delete('filiereId');
    navigate(`${location.pathname}?${newParams.toString()}`, { replace: true });
  };

  const handleSemesterChange = (sem: string) => {
    setSelectedSemester(sem);
    const newParams = new URLSearchParams(location.search);
    if (sem) newParams.set('semester', sem); else newParams.delete('semester');
    navigate(`${location.pathname}?${newParams.toString()}`, { replace: true });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">sync</span>
        <p className="font-bold text-outline animate-pulse uppercase tracking-widest text-xs">{t('forecasting.loading_simulation')}</p>
      </div>
    );
  }

  if (!simulation || !simulation.result_data) {
    return <div className="p-10 text-center text-outline">{t('forecasting.simulation_not_found')}</div>;
  }

  const filteredData = simulation.result_data.filter((s: any) => {
    const matchFiliere = !selectedFiliereId || s.filiere_id.toString() === selectedFiliereId;
    const matchSemester = !selectedSemester || s.semester === selectedSemester;
    return matchFiliere && matchSemester;
  }).map((s: any) => ({
      ...s,
      endTime: addMinutes(s.startTime, 120),
      color: s.type === 'CM' ? 'bg-primary-container/10 border-primary text-primary' : 
             s.type === 'TD' ? 'bg-secondary-container/20 border-secondary text-secondary' :
             'bg-tertiary-container/20 border-tertiary text-tertiary'
  }));

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-in fade-in duration-500">
      <header className="flex justify-between items-center h-16 px-gutter bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-lg">
        <div className="flex items-center gap-md">
          <button onClick={() => navigate('/forecasting')} className="text-slate-400 hover:text-white mr-2"><span className="material-symbols-outlined">arrow_back</span></button>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
             <span className="material-symbols-outlined text-sky-400">auto_awesome</span>
             {t('forecasting.simulation_year', { year: simulation.anneeCible })}
          </h1>
          <div className="hidden lg:flex items-center gap-4 ml-8 bg-slate-800/50 px-4 py-1.5 rounded-full border border-slate-700">
            <div className="flex items-center gap-2">
              <span className="text-sky-400 font-bold text-xs uppercase">{uniqueFilieres.find(f => f.id.toString() === selectedFiliereId)?.nom || t('forecasting.select_filiere')}</span>
              <div className="relative group/filiere">
                <button className="text-slate-400 hover:text-white transition-colors flex items-center"><span className="material-symbols-outlined text-sm">arrow_drop_down</span></button>
                <div className="absolute left-0 top-full mt-2 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 py-2 opacity-0 invisible group-hover/filiere:opacity-100 group-hover/filiere:visible transition-all duration-200">
                  <button onClick={() => handleFiliereChange('')} className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white">{t('forecasting.all_filieres')}</button>
                  {uniqueFilieres.map((f) => (<button key={f.id} onClick={() => handleFiliereChange(f.id.toString())} className={`w-full text-left px-4 py-2 text-xs transition-colors ${selectedFiliereId === f.id.toString() ? 'text-sky-400 bg-slate-700/50 font-bold' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}>{f.nom}</button>))}
                </div>
              </div>
            </div>
            <div className="w-1 h-1 rounded-full bg-slate-600"></div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium text-xs uppercase">{selectedSemester ? `Semestre ${selectedSemester}` : t('forecasting.choose_semester')}</span>
              <div className="relative group/semester">
                <button className="text-slate-400 hover:text-white transition-colors flex items-center"><span className="material-symbols-outlined text-sm">arrow_drop_down</span></button>
                <div className="absolute left-0 top-full mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 py-2 opacity-0 invisible group-hover/semester:opacity-100 group-hover/semester:visible transition-all duration-200">
                  <button onClick={() => handleSemesterChange('')} className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white">{t('forecasting.all_semesters')}</button>
                  {['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10'].map((sem) => (<button key={sem} onClick={() => handleSemesterChange(sem)} className={`w-full text-left px-4 py-2 text-xs transition-colors ${selectedSemester === sem ? 'text-sky-400 bg-slate-700/50 font-bold' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}>{sem}</button>))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-md">
          <button onClick={() => setIsListView(!isListView)} className={`px-6 py-2 rounded-lg font-bold transition-all uppercase text-[10px] tracking-widest flex items-center gap-2 border ${isListView ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-lowest text-primary border-outline-variant hover:bg-primary/5'}`}>
            <span className="material-symbols-outlined text-sm">{isListView ? 'grid_view' : 'list_alt'}</span>
            {isListView ? t('forecasting.view_grid') : t('forecasting.view_program')}
          </button>
        </div>
      </header>

      <div className="bg-white border-b border-outline-variant px-gutter py-4 flex items-center justify-between shadow-sm relative">
        <div className="flex items-center gap-4">
          <button onClick={() => navigateWeek('prev')} className="w-10 h-10 rounded-full hover:bg-surface-container transition-colors flex items-center justify-center border border-outline-variant text-primary"><span className="material-symbols-outlined">chevron_left</span></button>
          <div className="flex flex-col">
            <h2 className="font-h3 text-lg font-bold text-on-surface leading-none">{t('forecasting.week_of')} {weekDates[0].toLocaleDateString(i18n.language.startsWith('fr') ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long' })}</h2>
            <p className="text-[11px] font-bold text-outline uppercase tracking-widest mt-1">{weekDates[0].getFullYear()}</p>
          </div>
          <button onClick={() => navigateWeek('next')} className="w-10 h-10 rounded-full hover:bg-surface-container transition-colors flex items-center justify-center border border-outline-variant text-primary"><span className="material-symbols-outlined">chevron_right</span></button>
          <div className="relative ml-2">
            <button onClick={() => setShowNavCalendar(!showNavCalendar)} className={`w-10 h-10 rounded-full transition-all flex items-center justify-center border ${showNavCalendar ? 'bg-primary text-on-primary border-primary' : 'hover:bg-surface-container border-outline-variant text-primary'}`}><span className="material-symbols-outlined">calendar_month</span></button>
            {showNavCalendar && (
              <div className="absolute left-0 top-full mt-2 z-[60] w-72 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <HolidayCalendar onDateSelect={(date) => {
                    const [year, month, day] = date.split('-').map(Number);
                    const localDate = new Date(year, month - 1, day);
                    setCurrentWeekStart(getMonday(localDate));
                    setShowNavCalendar(false);
                  }} onClose={() => setShowNavCalendar(false)} allowHolidayClick={false} />
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-8">
            <div className="flex flex-col items-end">
                <span className="text-[9px] font-black text-outline uppercase">{t('forecasting.avg_projected_load')}</span>
                <span className="text-sm font-black text-primary">{simulation.moyenne_charge_prevue}h / prof</span>
            </div>
            <button onClick={() => setCurrentWeekStart(getMonday(new Date()))} className="px-4 py-2 text-xs font-bold text-primary hover:bg-primary/5 rounded-lg transition-colors border border-primary/20">{t('forecasting.today')}</button>
        </div>
      </div>

      <section className="flex-1 p-gutter overflow-y-auto pb-24 bg-background">
        {isListView ? (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead><tr className="bg-surface-container border-b border-outline-variant">
                <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-outline">{t('forecasting.date_day_col')}</th>
                <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-outline">{t('forecasting.time_col')}</th>
                <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-outline">{t('forecasting.module_col')}</th>
                <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-outline">{t('forecasting.type_col')}</th>
                <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-outline">{t('forecasting.room_col')}</th>
                <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-outline">{t('forecasting.teacher_col')}</th>
              </tr></thead>
              <tbody className="divide-y divide-outline-variant">
                {filteredData.sort((a: any, b: any) => a.day.localeCompare(b.day) || a.startTime.localeCompare(b.startTime)).map((slot: any) => (
                  <tr key={slot.id} className="hover:bg-surface-container-low transition-colors bg-white">
                    <td className="px-6 py-4"><div>{t(dayTranslations[slot.day])}</div><div className="text-[11px] text-outline">{weekDates[days.indexOf(slot.day)]?.toLocaleDateString(i18n.language.startsWith('fr') ? 'fr-FR' : 'en-US') || 'N/A'}</div></td>
                    <td className="px-6 py-4 font-black text-primary text-sm">{slot.startTime} - {slot.endTime}</td>
                    <td className="px-6 py-4 font-bold">{slot.module_name || slot.module}</td>
                    <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${slot.type === 'CM' ? 'bg-primary-fixed text-on-primary-fixed' : slot.type === 'TD' ? 'bg-secondary-fixed text-on-secondary-fixed' : 'bg-tertiary-fixed text-on-tertiary-fixed'}`}>{slot.type}</span></td>
                    <td className="px-6 py-4">{slot.room_name || slot.room}</td>
                    <td className="px-6 py-4"><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black uppercase shrink-0">{ (slot.teacher_name || slot.teacher)?.split(' ').map((n:any)=>n[0]).join('') || '?'}</div><span className="text-sm font-bold">{slot.teacher_name || slot.teacher || t('forecasting.not_assigned')}</span></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-xl overflow-hidden">
            <div className="overflow-x-auto"><div className="min-w-[1200px] grid grid-cols-[120px_1fr_40px_1fr_60px_1fr_40px_1fr] grid-rows-[auto_repeat(6,100px)] border-collapse bg-white">
              <div className="h-16 border-b border-r border-outline-variant bg-surface-container flex items-center justify-center font-label-caps text-[10px] font-black uppercase text-outline">{t('forecasting.day_time_header')}</div>
              {timeConfig.map((config, i) => (
                <div key={`header-${i}`} className={`border-b border-r border-outline-variant ${config.isBreak ? 'bg-surface-container-low/50 italic' : 'bg-surface-container'} flex flex-col items-center justify-center py-2`}>
                  <span className={`font-black uppercase tracking-tighter ${config.isBreak ? 'text-[10px] text-outline-variant' : 'text-primary text-sm'}`}>{getLocalizedLabel(config.label)}</span>
                </div>
              ))}
              
              {days.map((day) => {
                const dayDate = weekDates[days.indexOf(day)];
                return (<React.Fragment key={day}>
                  <div className="border-b border-r border-outline-variant flex flex-col items-center justify-center gap-1 bg-surface-container">
                    <span className="font-black uppercase text-[12px]">{t(dayTranslations[day])}</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full text-outline border border-outline-variant bg-white`}>{dayDate.getDate()} {dayDate.toLocaleDateString(i18n.language.startsWith('fr') ? 'fr-FR' : 'en-US', { month: 'short' })}</span>
                  </div>
                  {timeConfig.map((config, i) => {
                    if (config.isBreak) return <div key={`break-${day}-${i}`} className="border-b border-r border-outline-variant opacity-30 bg-[repeating-linear-gradient(45deg,#f1f5f9,#f1f5f9_10px,#ffffff_10px,#ffffff_20px)] shadow-inner" />;
                    const slot = filteredData.find((s: any) => s.day === day && s.startTime === config.start);
                    return (<div key={`cell-${day}-${i}`} className="border-b border-r border-outline-variant transition-all bg-white p-2">
                      {slot ? (
                        <div className={`h-full border-l-4 p-2 flex flex-col justify-between rounded-lg shadow-md transition-all ${slot.color}`}>
                          <span className="text-[10px] font-black uppercase truncate leading-tight">{slot.type} : {slot.module_name || slot.module}</span>
                          <div className="flex flex-col">
                            <span className="text-[8px] font-bold text-slate-400 block truncate uppercase">{slot.filiere_name || slot.filiere}</span>
                            <span className="text-[9px] font-black text-sky-700/80 mb-1 flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">person</span>{slot.teacher_name || slot.teacher}</span>
                            <span className="text-[9px] font-bold opacity-80 flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">location_on</span>{slot.room_name || slot.room}</span>
                          </div>
                        </div>
                      ) : null}
                    </div>);
                  })}
                </React.Fragment>);
              })}
            </div></div>
          </div>
        )}
      </section>
      
      <div className="fixed bottom-6 right-6 bg-slate-900/90 text-white px-4 py-3 rounded-2xl border border-slate-700 shadow-2xl backdrop-blur-md flex flex-col gap-1 max-w-xs animate-in slide-in-from-right-10 duration-700">
          <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sky-400 text-sm">auto_awesome</span>
              <span className="text-[10px] font-black uppercase tracking-wider">{t('forecasting.forecast_preview')}</span>
          </div>
          <p className="text-[9px] text-slate-400 font-medium leading-relaxed">
              {t('forecasting.forecast_preview_desc', { year: simulation.anneeCible })}
          </p>
      </div>
    </div>
  );
};

export default SimulatedTimetable;
