import React, { useState, useEffect } from 'react';
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

interface TimetableSlot {
  id: string;
  day: string;
  date: string;
  startTime: string;
  endTime: string;
  module: string;
  room: string;
  type: string;
  color: string;
}

const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

interface TimeConfig {
  label: string;
  start: string;
  end: string;
  isBreak?: boolean;
  breakType?: string;
  breakDuration?: string;
}

const timeConfig: TimeConfig[] = [
  { label: '08:30', start: '08:30', end: '10:30' },
  { label: 'Pause', start: '10:30', end: '10:45', isBreak: true, breakType: 'Pause', breakDuration: '15 min' },
  { label: '10:45', start: '10:45', end: '12:45' },
  { label: 'Midi', start: '12:45', end: '14:30', isBreak: true, breakType: 'Midi', breakDuration: 'Pause' },
  { label: '14:30', start: '14:30', end: '16:30' },
  { label: 'Pause', start: '16:30', end: '16:45', isBreak: true, breakType: 'Pause', breakDuration: '15 min' },
  { label: '16:45', start: '16:45', end: '18:45' },
];

const getMonday = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
};

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addMinutes = (time: string, minutes: number) => {
  const [h, m] = time.split(':').map(Number);
  const totalMinutes = h * 60 + m + minutes;
  const newH = Math.floor(totalMinutes / 60);
  const newM = totalMinutes % 60;
  return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
};

const TeacherTimetable: React.FC = () => {
  const { t } = useTranslation();
  const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showNavCalendar, setShowNavCalendar] = useState(false);

  const getLocalizedLabel = (lbl: string) => {
    if (lbl === 'Pause') return t('teacher_timetable.break');
    if (lbl === 'Midi') return t('teacher_timetable.noon');
    return lbl;
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetch('http://localhost:8000/api/users/profile/', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setCurrentUser(data))
        .catch(err => console.error(err));
    }
  }, []);

  const fetchSlots = async () => {
    setLoading(true);
    const start = formatDate(currentWeekStart);
    const end = new Date(currentWeekStart);
    end.setDate(end.getDate() + 6);
    const endStr = formatDate(end);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/core/sceance/?start_date=${start}&end_date=${endStr}&mine=true`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      const mapped = data.map((s: any) => ({
        id: s.id.toString(),
        day: days[new Date(s.date).getDay() - 1] || 'Lundi',
        date: s.date,
        startTime: s.heure_debut.slice(0, 5),
        endTime: addMinutes(s.heure_debut, s.duree),
        module: s.module_name,
        room: s.local_name,
        type: s.type,
        color: s.type === 'CM' ? 'bg-primary-fixed text-on-primary-fixed border-primary' : 
               s.type === 'TD' ? 'bg-secondary-fixed text-on-secondary-fixed border-secondary' : 
               'bg-tertiary-fixed text-on-tertiary-fixed border-tertiary'
      }));
      setSlots(mapped);
    } catch (error) {
      console.error('Error fetching teacher slots:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [currentWeekStart]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    let newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeekStart(newDate);
  };

  const getWeekRangeLabel = () => {
    const end = new Date(currentWeekStart);
    end.setDate(end.getDate() + 5);
    return `${currentWeekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  const handleDownloadPDF = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const start = formatDate(currentWeekStart);
      const url = `http://localhost:8000/api/core/teacher/export-pdf-timetable/?week_start=${start}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error("Erreur de téléchargement");
      }
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `emploi_du_temps_${currentUser?.nom || 'prof'}_semaine_${start}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error('Error exporting PDF:', err);
      alert("Erreur lors de l'export du PDF.");
    }
  };

  return (
    <div className="flex flex-col gap-lg animate-in fade-in duration-500 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-outline-variant pb-md">
        <div>
          {currentUser?.role && currentUser.role.includes('UTILISATEUR') ? (
            <div className="flex items-center gap-sm mb-xs">
              <span className="px-2 py-0.5 bg-orange-500 text-white text-[10px] font-black uppercase tracking-wider rounded">
                {currentUser?.filiere_name || "GINF SECTION A"}
              </span>
              <span className="text-on-surface-variant font-body-md text-xs font-semibold">• Semestre d'Automne</span>
            </div>
          ) : (
            <div className="flex items-center gap-sm mb-xs">
              <span className="px-2 py-0.5 bg-sky-500 text-white text-[10px] font-black uppercase tracking-wider rounded">
                {currentUser ? `${currentUser.prenom} ${currentUser.nom}` : "Enseignant"}
              </span>
              <span className="text-on-surface-variant font-body-md text-xs font-semibold">• Espace Académique</span>
            </div>
          )}
          
          <h1 className="font-h1 text-h1 text-on-surface tracking-tight">{t('teacher_timetable.title')}</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Année Académique 2026-2027</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant p-1 rounded-lg shadow-sm">
            <button onClick={() => navigateWeek('prev')} className="p-2 hover:bg-surface-container rounded-md transition-colors text-on-surface-variant">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setShowNavCalendar(!showNavCalendar)}
                className="px-4 py-2 font-h3 text-[14px] text-on-surface hover:bg-surface-container rounded-md transition-colors flex items-center gap-2 min-w-[200px] justify-center"
              >
                <span className="material-symbols-outlined text-primary text-[18px]">calendar_month</span>
                {getWeekRangeLabel()}
              </button>
              {showNavCalendar && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-[60] w-72 shadow-2xl">
                  <HolidayCalendar 
                    onDateSelect={(date) => {
                      const [y, m, d] = date.split('-').map(Number);
                      setCurrentWeekStart(getMonday(new Date(y, m - 1, d)));
                      setShowNavCalendar(false);
                    }}
                    onClose={() => setShowNavCalendar(false)}
                    allowHolidayClick={true}
                  />
                </div>
              )}
            </div>

            <button onClick={() => navigateWeek('next')} className="p-2 hover:bg-surface-container rounded-md transition-colors text-on-surface-variant">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
          
          <button 
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary hover:bg-primary-container rounded-xl font-label-caps text-label-caps uppercase tracking-widest transition-colors font-bold text-[10px] shadow-md"
          >
            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
            Télécharger PDF
          </button>
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse table-fixed min-w-[1000px]">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="w-24 p-4 font-label-caps text-label-caps text-outline uppercase tracking-widest border-r border-outline-variant bg-surface-container-lowest">{t('teacher_timetable.hour')}</th>
                {days.map((day, idx) => {
                  const date = new Date(currentWeekStart);
                  date.setDate(date.getDate() + idx);
                  const isToday = new Date().toDateString() === date.toDateString();
                  return (
                    <th key={day} className={`p-4 border-r border-outline-variant last:border-r-0 ${isToday ? 'bg-primary/5' : ''}`}>
                      <div className="flex flex-col items-center">
                        <span className={`font-label-caps text-label-caps uppercase tracking-widest ${isToday ? 'text-primary font-black' : 'text-on-surface-variant'}`}>{t(dayTranslations[day])}</span>
                        <span className={`text-xl font-black mt-1 ${isToday ? 'text-primary' : 'text-on-surface'}`}>{date.getDate()}</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {timeConfig.map((time, timeIdx) => (
                <tr key={timeIdx} className={`border-b border-outline-variant last:border-b-0 ${time.isBreak ? 'bg-surface-container-lowest/50' : 'h-32'}`}>
                  <td className="p-4 border-r border-outline-variant bg-surface-container-lowest flex flex-col items-center justify-center sticky left-0 z-10 h-full">
                    <span className="font-h3 text-on-surface font-bold">{getLocalizedLabel(time.label)}</span>
                    {!time.isBreak && <span className="text-[10px] text-outline mt-1 font-bold">{time.start} - {time.end}</span>}
                  </td>
                  
                  {days.map((day, dayIdx) => {
                    if (time.isBreak) {
                      return (
                        <td key={dayIdx} className="border-r border-outline-variant last:border-r-0 relative group">
                           <div className="absolute inset-0 flex items-center justify-center opacity-30 group-hover:opacity-100 transition-opacity">
                              <span className="font-label-caps text-[10px] font-black uppercase tracking-[0.2em] text-outline rotate-[-15deg]">{getLocalizedLabel(time.breakType || '')} • {time.breakDuration}</span>
                           </div>
                        </td>
                      );
                    }

                    const dateObj = new Date(currentWeekStart);
                    dateObj.setDate(dateObj.getDate() + dayIdx);
                    const dateStr = formatDate(dateObj);
                    
                    const cellSlots = slots.filter(s => s.day === day && s.startTime === time.start && s.date === dateStr);

                    return (
                      <td key={dayIdx} className="border-r border-outline-variant last:border-r-0 p-2 relative align-top hover:bg-surface-container-lowest/30 transition-colors">
                        {cellSlots.map(slot => (
                          <div key={slot.id} className={`w-full h-full rounded-lg border-l-4 p-3 shadow-md flex flex-col justify-between transition-all hover:scale-[1.02] hover:shadow-lg ${slot.color}`}>
                            <div>
                              <div className="flex justify-between items-start mb-1">
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-70">{slot.type}</span>
                                <span className="material-symbols-outlined text-[16px] opacity-70">school</span>
                              </div>
                              <h4 className="font-h3 text-[13px] leading-tight font-black line-clamp-2 uppercase tracking-tight">{slot.module}</h4>
                            </div>
                            <div className="mt-2 pt-2 border-t border-current/10 flex flex-col gap-1">
                               <div className="flex items-center gap-1.5">
                                 <span className="material-symbols-outlined text-[14px]">location_on</span>
                                 <span className="text-[11px] font-bold">{slot.room}</span>
                               </div>
                            </div>
                          </div>
                        ))}
                        {loading && cellSlots.length === 0 && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-10">
                            <div className="w-4 h-4 border-2 border-primary border-t-transparent animate-spin rounded-full"></div>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {!loading && slots.length === 0 && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-xl flex flex-col items-center justify-center text-center gap-4 shadow-inner">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center">
            <span className="material-symbols-outlined text-outline text-3xl">calendar_today</span>
          </div>
          <div>
            <h3 className="font-h3 text-on-surface">Aucune séance cette semaine</h3>
            <p className="font-body-md text-on-surface-variant max-w-sm mx-auto mt-1">Aucune séance de cours ou de travaux dirigés/pratiques n'est programmée pour cette période.</p>
          </div>
        </div>
      )}

      {/* Bento style auxiliary cards (Mock notes & campus information) */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Notes de Session */}
        <div className="md:col-span-8 bg-surface-container-lowest p-6 border border-outline-variant rounded-xl shadow-sm">
          <h3 className="font-h3 text-h3 text-primary mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">campaign</span>
            Notes de Session
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 bg-surface-container-low rounded-xl">
              <span className="material-symbols-outlined text-orange-500">info</span>
              <div>
                <p className="font-body-md text-body-md font-bold text-on-surface">Changement de Salle</p>
                <p className="font-body-md text-sm text-on-surface-variant">
                  Les cours magistraux et les TP se tiendront dans les salles indiquées sur la grille horaire. Merci de vérifier les locaux avant chaque séance.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-surface-container-low rounded-xl">
              <span className="material-symbols-outlined text-orange-500">event</span>
              <div>
                <p className="font-body-md text-body-md font-bold text-on-surface">Séances de Rattrapage</p>
                <p className="font-body-md text-sm text-on-surface-variant">
                  Les séances de rattrapage éventuelles doivent être planifiées et validées en coordination directe avec l'administration.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quote and Campus Card */}
        <div className="md:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="relative h-48 w-full bg-slate-800">
            <img 
              className="object-cover w-full h-full opacity-80" 
              alt="University campus view"
              src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=600&q=80" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
              <p className="text-white font-label-caps text-[10px] font-black tracking-widest uppercase">Université Moulay Ismaïl</p>
            </div>
          </div>
          <div className="p-4 flex-grow flex items-center justify-center bg-slate-50">
            <p className="font-body-md text-sm text-on-surface-variant italic text-center">
              "Ce planning est définitif pour le premier semestre. Toute modification sera notifiée via l'application."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherTimetable;
