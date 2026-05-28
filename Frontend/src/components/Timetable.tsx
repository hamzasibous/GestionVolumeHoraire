import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import HolidayCalendar from './HolidayCalendar';

interface TimetableSlot {
  id: string;
  day: string;
  date: string; // Added date field
  startTime: string;
  endTime: string;
  module: string;
  room: string;
  room_id?: string;
  type: string;
  totalSessions: number;
  color: string;
}

interface Local {
  id: number;
  name: string;
}

interface Module {
  id: number;
  nom: string;
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

// Helper to get the Monday of the week for a given date
const getMonday = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(date.setDate(diff));
};

// Helper to format date as YYYY-MM-DD (Timezone safe)
const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
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

const Timetable: React.FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const filiereId = queryParams.get('filiereId');

  const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<'Morning' | 'Afternoon'>('Morning');
  const [showCalendar, setShowCalendar] = useState(false);
  const [showNavCalendar, setShowNavCalendar] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ day: string; time: string; endTime: string; date: string } | null>(null);
  
  const [locaux, setLocaux] = useState<Local[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [vacations, setVacations] = useState<any[]>([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    module: '',
    room: '',
    teacher: '',
    type: 'CM',
    customTime: '',
    number_of_sessions: 1,
    startDate: ''
  });

  // Get dates for each day of the current week
  const weekDates = days.map((_, index) => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + index);
    return d;
  });

  const isDateHoliday = (date: Date) => {
    const dateStr = formatDate(date);
    return vacations.some(v => dateStr >= v.date_debut && dateStr <= v.date_fin);
  };

  const getHolidayInfo = (date: Date) => {
    const dateStr = formatDate(date);
    return vacations.find(v => dateStr >= v.date_debut && dateStr <= v.date_fin);
  };

  const fetchSlots = () => {
    // In a real app, you'd fetch slots for the specific week range
    const start = formatDate(weekDates[0]);
    const end = formatDate(weekDates[5]);
    
    let url = `http://localhost:8000/api/core/sceance/?start_date=${start}&end_date=${end}`;
    if (filiereId) {
      url += `&filiere=${filiereId}`;
    }

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
           const mapped = data.map((s: any) => {
             const startTime = s.heure_debut ? s.heure_debut.substring(0, 5) : '08:30';
             const endTime = addMinutes(startTime, s.duree);
             return {
               id: s.id.toString(),
               day: days[new Date(s.date).getDay() - 1] || 'Lundi',
               date: s.date,
               startTime: startTime,
               endTime: endTime,
               module: s.module_name,
               room: s.local_name,
               type: s.type,
               color: s.type === 'CM' ? 'bg-primary-container/10 border-primary text-primary' : 
                      s.type === 'TD' ? 'bg-secondary-container/20 border-secondary text-secondary' :
                      'bg-tertiary-container/20 border-tertiary text-tertiary'
             };
           });
           setSlots(mapped);
        }
      })
      .catch(err => console.error('Error fetching slots:', err));
  };

  useEffect(() => {
    fetch('http://localhost:8000/api/core/local/')
      .then(res => res.json())
      .then(data => setLocaux(data))
      .catch(err => console.error('Error fetching locaux:', err));

    const modulesUrl = filiereId 
      ? `http://localhost:8000/api/core/filiere/details/` // We'll need to filter from the detailed list or have a better endpoint
      : 'http://localhost:8000/api/core/module/';

    if (filiereId) {
      fetch('http://localhost:8000/api/core/filiere/details/')
        .then(res => res.json())
        .then(data => {
          const selectedFiliere = data.find((f: any) => f.id.toString() === filiereId);
          if (selectedFiliere) {
            setModules(selectedFiliere.modules.map((m: any) => ({
              id: m.id,
              nom: m.nom
            })));
          }
        })
        .catch(err => console.error('Error fetching filtered modules:', err));
    } else {
      fetch('http://localhost:8000/api/core/module/')
        .then(res => res.json())
        .then(data => setModules(data))
        .catch(err => console.error('Error fetching modules:', err));
    }

    fetch('http://localhost:8000/api/core/vacations/')
      .then(res => res.json())
      .then(data => setVacations(data))
      .catch(err => console.error('Error fetching vacations:', err));

    fetch('http://localhost:8000/api/users/management/')
      .then(res => res.json())
      .then(data => setTeachers(data.filter((u: any) => u.role === 'ENSEIGNANT')))
      .catch(err => console.error('Error fetching teachers:', err));
  }, []);

  useEffect(() => {
    fetchSlots();
  }, [currentWeekStart]);

  useEffect(() => {
    if (formData.room && formData.startDate && formData.customTime) {
      const timeParts = formData.customTime.split(' - ');
      const startTime = timeParts[0];
      const endTime = timeParts[1];
      
      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);
      const duree = (endH * 60 + endM) - (startH * 60 + startM);

      checkAvailability(formData.room, formData.startDate, startTime, duree);
    } else {
      setAvailabilityError(null);
    }
  }, [formData.room, formData.startDate, formData.customTime]);

  const checkAvailability = (roomId: string, date: string, startTime: string, duree: number) => {
    setIsCheckingAvailability(true);
    fetch(`http://localhost:8000/api/core/sceance/check_availability/?local=${roomId}&date=${date}&heure_debut=${startTime}&duree=${duree}`)
      .then(res => res.json())
      .then(data => {
        if (!data.available) {
          setAvailabilityError(`Attention: Cette salle est déjà occupée à cette date par: ${data.conflicts[0].module_name || 'une autre séance'}`);
        } else {
          setAvailabilityError(null);
        }
        setIsCheckingAvailability(false);
      })
      .catch(err => {
        console.error('Error checking availability:', err);
        setIsCheckingAvailability(false);
      });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    let newDate = new Date(currentWeekStart);
    const step = direction === 'next' ? 7 : -7;
    
    // Attempt to find the next/prev non-holiday Monday
    let attempts = 0;
    do {
      newDate.setDate(newDate.getDate() + step);
      attempts++;
      // Stop searching after 52 weeks to avoid infinite loop if entire year is holiday (unlikely)
    } while (isDateHoliday(newDate) && attempts < 52);

    if (!isDateHoliday(newDate)) {
      setCurrentWeekStart(newDate);
    }
  };

  const handleSlotClick = (slot: any) => {
    // Find matching module and room IDs
    const moduleId = modules.find(m => m.nom === slot.module)?.id || '';
    const roomId = locaux.find(l => l.name === slot.room)?.id || '';
    const teacher = teachers.find(t => `${t.prenom} ${t.nom}` === slot.teacher || `Pr. ${t.nom} ${t.prenom}` === slot.teacher)?.id || '';

    setEditingSessionId(slot.id);
    setTimeFilter(timeToMinutes(slot.startTime) < 780 ? 'Morning' : 'Afternoon'); // 13:00 threshold
    setSelectedCell({ day: slot.day, time: slot.startTime, endTime: slot.endTime, date: slot.date });
    setFormData({
      module: moduleId.toString(),
      room: roomId.toString(),
      teacher: teacher.toString(),
      type: slot.type,
      customTime: `${slot.startTime} - ${slot.endTime}`,
      number_of_sessions: 1,
      startDate: slot.date
    });
    setAvailabilityError(null);
    setIsModalOpen(true);
  };

  const handleCellClick = (day: string, config: TimeConfig, date: string) => {
    setEditingSessionId(null);
    setTimeFilter(timeToMinutes(config.start) < 780 ? 'Morning' : 'Afternoon');
    const defaultTime = `${config.start} - ${config.end}`;
    setSelectedCell({ day, time: config.start, endTime: config.end, date });
    setFormData({ 
      module: '', 
      room: '', 
      teacher: '',
      type: 'CM',
      customTime: defaultTime,
      number_of_sessions: 1,
      startDate: date 
    });
    setAvailabilityError(null);
    setIsModalOpen(true);
    setShowCalendar(false);
  };

  const handleValidate = () => {
    if (!selectedCell || !formData.module || !formData.room || availabilityError) return;

    // Parse customTime to get heure_debut and duree
    const timeParts = formData.customTime.split(' - ');
    const startTime = timeParts[0];
    const endTime = timeParts[1];
    
    // Calculate duration in minutes
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const duree = (endH * 60 + endM) - (startH * 60 + startM);

    const payload = {
      type: formData.type,
      duree: duree,
      date: formData.startDate,
      heure_debut: startTime,
      module: formData.module,
      enseignant: formData.teacher || null,
      local: formData.room,
      number_of_sessions: formData.number_of_sessions
    };

    const method = editingSessionId ? 'PUT' : 'POST';
    const url = editingSessionId 
      ? `http://localhost:8000/api/core/sceance/${editingSessionId}/` 
      : 'http://localhost:8000/api/core/sceance/';

    fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(res => {
      if (res.ok) {
        fetchSlots();
        setIsModalOpen(false);
      } else {
        res.json().then(data => alert(`Erreur: ${JSON.stringify(data)}`));
      }
    })
    .catch(err => console.error('Error saving session:', err));
  };

  const getTimeOptions = () => {
    if (timeFilter === 'Morning') {
      return ['08:30 - 10:30', '10:45 - 12:45', '08:30 - 12:45'];
    } else {
      return ['14:30 - 16:30', '16:45 - 18:45', '14:30 - 18:45'];
    }
  };

  return (
    <div className="flex flex-col h-full relative animate-in fade-in duration-500">
      {/* Top App Bar */}
      <header className="flex justify-between items-center h-16 px-gutter bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-lg">
        <div className="flex items-center gap-md">
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
             <span className="material-symbols-outlined text-sky-400">calendar_view_week</span>
             GESTION DES EMPLOIS
          </h1>
          <div className="hidden lg:flex items-center gap-4 ml-8 bg-slate-800/50 px-4 py-1.5 rounded-full border border-slate-700">
            <span className="text-sky-400 font-bold text-xs uppercase">GINF</span>
            <div className="w-1 h-1 rounded-full bg-slate-600"></div>
            <span className="text-slate-400 font-medium text-xs">Semestre III</span>
          </div>
        </div>
        <div className="flex items-center gap-md">
          <button className="bg-sky-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-sky-400 transition-all uppercase text-[10px] tracking-widest shadow-lg shadow-sky-500/20 active:scale-95">Exporter PDF</button>
        </div>
      </header>

      {/* Week Navigator */}
      <div className="bg-white border-b border-outline-variant px-gutter py-4 flex items-center justify-between shadow-sm relative">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigateWeek('prev')}
            className="w-10 h-10 rounded-full hover:bg-surface-container transition-colors flex items-center justify-center border border-outline-variant text-primary"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <div className="flex flex-col">
            <h2 className="font-h3 text-lg font-bold text-on-surface leading-none">
              Semaine du {weekDates[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
            </h2>
            <p className="text-[11px] font-bold text-outline uppercase tracking-widest mt-1">
              {weekDates[0].getFullYear()} • Navigation Annuelle
            </p>
          </div>
          <button 
            onClick={() => navigateWeek('next')}
            className="w-10 h-10 rounded-full hover:bg-surface-container transition-colors flex items-center justify-center border border-outline-variant text-primary"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>

          {/* New Calendar Navigation Button */}
          <div className="relative ml-2">
            <button 
              onClick={() => setShowNavCalendar(!showNavCalendar)}
              className={`w-10 h-10 rounded-full transition-all flex items-center justify-center border ${
                showNavCalendar ? 'bg-primary text-on-primary border-primary' : 'hover:bg-surface-container border-outline-variant text-primary'
              }`}
              title="Choisir une date"
            >
              <span className="material-symbols-outlined">calendar_month</span>
            </button>
            
            {showNavCalendar && (
              <div className="absolute left-0 top-full mt-2 z-[60] w-72 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <HolidayCalendar 
                  onDateSelect={(date) => {
                    setCurrentWeekStart(getMonday(new Date(date)));
                    setShowNavCalendar(false);
                  }}
                  onClose={() => setShowNavCalendar(false)}
                  allowHolidayClick={false}
                />
              </div>
            )}
          </div>
        </div>
        <button 
          onClick={() => setCurrentWeekStart(getMonday(new Date()))}
          className="px-4 py-2 text-xs font-bold text-primary hover:bg-primary/5 rounded-lg transition-colors border border-primary/20"
        >
          Aujourd'hui
        </button>
      </div>

      {/* Timetable Interface */}
      <section className="flex-1 p-gutter overflow-y-auto pb-24 bg-background">
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-xl overflow-hidden mb-lg">
          <div className="overflow-x-auto">
            <div className="min-w-[1200px] grid grid-cols-[120px_1fr_40px_1fr_60px_1fr_40px_1fr] grid-rows-[auto_repeat(6,100px)] border-collapse bg-white">
              {/* Header */}
              <div className="h-16 border-b border-r border-outline-variant bg-surface-container flex items-center justify-center font-label-caps text-[10px] uppercase font-black text-outline">JOUR / HEURE</div>
              {timeConfig.map((config, i) => (
                <div key={i} className={`border-b border-r border-outline-variant ${config.isBreak ? 'bg-surface-container-low/50 italic' : 'bg-surface-container'} flex flex-col items-center justify-center py-2`}>
                  <span className={`font-black uppercase tracking-tighter ${config.isBreak ? 'text-[10px] text-outline-variant' : 'text-primary text-sm'}`}>{config.label}</span>
                  {!config.isBreak && <span className="text-[10px] text-outline font-bold opacity-60">{config.end}</span>}
                  {config.isBreak && <span className="text-[9px] text-outline font-bold opacity-40">{config.breakDuration}</span>}
                </div>
              ))}

              {/* Rows */}
              {days.map((day, dayIndex) => {
                const dayDate = weekDates[dayIndex];
                const dateStr = formatDate(dayDate);
                const holiday = getHolidayInfo(dayDate);
                
                return (
                  <React.Fragment key={day}>
                    <div className={`border-b border-r border-outline-variant flex flex-col items-center justify-center gap-1 transition-colors ${
                      holiday ? 'bg-error-container/20' : 'bg-surface-container'
                    }`}>
                      <span className={`font-black uppercase text-[12px] tracking-tight ${holiday ? 'text-error' : 'text-on-surface'}`}>{day}</span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        dateStr === formatDate(new Date()) 
                          ? 'bg-primary text-on-primary' 
                          : holiday 
                            ? 'bg-error text-white'
                            : 'text-outline border border-outline-variant bg-white'
                      }`}>
                        {dayDate.getDate()} {dayDate.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')}
                      </span>
                    </div>
                    {timeConfig.map((config, i) => {
                      const slot = slots.find(s => {
                        if (s.date !== dateStr) return false;
                        
                        const sStart = timeToMinutes(s.startTime);
                        const sEnd = timeToMinutes(s.endTime);
                        const cStart = timeToMinutes(config.start);
                        const cEnd = timeToMinutes(config.end);

                        // Numerical overlap check
                        return (sStart < cEnd) && (cStart < sEnd);
                      });
                      
                      if (holiday && !config.isBreak) {
                        return (
                          <div 
                            key={i} 
                            className="border-b border-r border-outline-variant bg-error-container/5 relative overflow-hidden group"
                          >
                             <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(185,28,28,0.03)_10px,rgba(185,28,28,0.03)_20px)]"></div>
                             {/* Only show text in the second slot for cleaner look, or first if preferred */}
                             {i === 0 && (
                               <div className="absolute inset-y-0 left-4 flex items-center gap-2 text-error/40 z-10 pointer-events-none">
                                 <span className="material-symbols-outlined text-sm">event_busy</span>
                                 <span className="font-black text-[10px] uppercase tracking-widest whitespace-nowrap">{holiday.titre || holiday.type_conge}</span>
                               </div>
                             )}
                          </div>
                        );
                      }

                      if (config.isBreak) {
                        return (
                          <div key={i} className="border-b border-r border-outline-variant opacity-30 bg-[repeating-linear-gradient(45deg,#f1f5f9,#f1f5f9_10px,#ffffff_10px,#ffffff_20px)] shadow-inner relative">
                            {slot && (
                              <div className={`absolute inset-0 z-10 opacity-90 ${slot.color} border-l-0 border-r-0`}></div>
                            )}
                          </div>
                        );
                      }

                      return (
                        <div 
                          key={i} 
                          onClick={() => slot ? handleSlotClick(slot) : handleCellClick(day, config, dateStr)}
                          className={`border-b border-r border-outline-variant transition-all ${slot ? 'p-2' : 'hover:bg-primary/5 cursor-pointer bg-white group'}`}
                        >
                          {slot ? (
                            <div className={`h-full border-l-4 p-2 flex flex-col justify-between rounded-lg shadow-md transition-all hover:scale-[1.03] hover:shadow-lg ${slot.color}`}>
                              <span className="text-[10px] font-black uppercase truncate leading-tight">{slot.type} : {slot.module}</span>
                              <div className="flex flex-col">
                                <span className="text-[9px] font-bold opacity-80 flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[12px]">location_on</span>
                                  {slot.room}
                                </span>
                                <span className="text-[8px] font-bold opacity-60 flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[12px]">schedule</span>
                                  {slot.startTime} - {slot.endTime}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                               <span className="material-symbols-outlined text-primary/40 text-2xl">add_circle</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Assignment Modal Overlay */}
      {isModalOpen && selectedCell && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-start justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest w-full max-w-2xl rounded-2xl shadow-2xl border border-outline-variant overflow-hidden animate-in zoom-in-95 duration-300 my-8">
            {/* Modal Header */}
            <div className="bg-slate-900 p-6 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3 text-white">
                <div className="p-2 bg-sky-500/20 rounded-lg">
                   <span className="material-symbols-outlined text-sky-400">add_task</span>
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight">{editingSessionId ? 'Modifier la Séance' : 'Assigner une Séance'}</h3>
                  <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">
                    {editingSessionId ? `Modification de la séance du ${new Date(selectedCell.date).toLocaleDateString('fr-FR')}` : `Planification du ${new Date(selectedCell.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {/* Modal Content */}
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="flex justify-between items-center bg-surface-container-low p-4 rounded-xl border border-outline-variant">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">Période du jour</label>
                    <div className="flex gap-2">
                      {(['Morning', 'Afternoon'] as const).map(p => (
                        <button
                          key={p}
                          onClick={() => setTimeFilter(p)}
                          className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${
                            timeFilter === p 
                            ? 'bg-sky-500 text-white shadow-lg' 
                            : 'bg-white border border-outline-variant text-on-surface-variant'
                          }`}
                        >
                          {p === 'Morning' ? 'Matin' : 'Après-midi'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">Jour</label>
                    <div className="font-black text-primary text-sm uppercase">{selectedCell.day}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">Sélectionner la Plage Horaire (2h ou 4h)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {getTimeOptions().map(option => (
                      <button
                        key={option}
                        onClick={() => setFormData({...formData, customTime: option})}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all gap-1 ${
                          formData.customTime === option 
                          ? 'border-primary bg-primary/5 shadow-md scale-[1.02]' 
                          : 'border-outline-variant hover:border-primary/30 hover:bg-surface-container-low'
                        }`}
                      >
                        <span className={`material-symbols-outlined text-lg ${formData.customTime === option ? 'text-primary' : 'text-outline'}`}>
                          {option.includes('12:45') || option.includes('18:45') && option.length > 13 ? 'history_edu' : 'timer'}
                        </span>
                        <span className={`text-[11px] font-bold ${formData.customTime === option ? 'text-primary' : 'text-on-surface'}`}>
                          {option}
                        </span>
                        <span className="text-[9px] font-black uppercase opacity-40">
                          {option.split(' - ').length === 2 && 
                            (() => {
                              const [s, e] = option.split(' - ');
                              const [sh, sm] = s.split(':').map(Number);
                              const [eh, em] = e.split(':').map(Number);
                              const diff = (eh * 60 + em) - (sh * 60 + sm);
                              return diff > 130 ? 'Double Séance (4h+)' : 'Séance Simple (2h)';
                            })()
                          }
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">Date d'Exécution</label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-surface-container-low px-4 py-3 rounded-xl border border-outline-variant font-black text-primary text-sm shadow-inner flex items-center">
                    <span className="material-symbols-outlined text-sm mr-2 opacity-50">calendar_today</span>
                    {formData.startDate}
                  </div>
                  <button 
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="bg-slate-900 text-white w-12 rounded-xl flex items-center justify-center hover:bg-slate-800 transition-all active:scale-90 shadow-lg"
                  >
                    <span className="material-symbols-outlined">event</span>
                  </button>
                </div>
                
                {showCalendar && (
                  <div className="absolute left-8 right-8 mt-2 z-[110] shadow-2xl">
                    <HolidayCalendar 
                      selectedDate={formData.startDate}
                      onDateSelect={(date) => {
                        setFormData({...formData, startDate: date});
                        setShowCalendar(false);
                      }}
                      onClose={() => setShowCalendar(false)}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">Type de Séance</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['CM', 'TD', 'TP'].map(type => (
                      <button
                        key={type}
                        onClick={() => setFormData({...formData, type})}
                        className={`py-2 rounded-lg text-[10px] font-black uppercase border transition-all ${
                          formData.type === type 
                          ? 'bg-primary text-on-primary border-primary shadow-md' 
                          : 'bg-white text-on-surface-variant border-outline-variant hover:border-primary/50'
                        }`}
                      >
                        {type === 'CM' ? 'Cours' : type}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">Local / Salle</label>
                  <select 
                    value={formData.room}
                    onChange={(e) => setFormData({...formData, room: e.target.value})}
                    className={`w-full bg-white border rounded-xl px-4 py-3 focus:ring-4 outline-none text-sm font-bold shadow-sm transition-all ${
                      availabilityError ? 'border-error ring-error/10 text-error' : 'border-outline-variant focus:ring-primary/10'
                    }`}
                  >
                    <option value="">Sélectionner une salle...</option>
                    {locaux.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">Module Académique</label>
                  <select 
                    value={formData.module}
                    onChange={(e) => setFormData({...formData, module: e.target.value})}
                    className="w-full bg-white border border-outline-variant rounded-xl px-4 py-3 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none text-sm font-bold shadow-sm transition-all cursor-pointer"
                  >
                    <option value="">Sélectionner un module...</option>
                    {modules.map(m => (
                      <option key={m.id} value={m.id}>{m.nom}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">Enseignant (Optionnel)</label>
                  <select 
                    value={formData.teacher}
                    onChange={(e) => setFormData({...formData, teacher: e.target.value})}
                    className="w-full bg-white border border-outline-variant rounded-xl px-4 py-3 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none text-sm font-bold shadow-sm transition-all cursor-pointer"
                  >
                    <option value="">Aucun (Non assigné)</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.prenom} {t.nom}</option>
                    ))}
                  </select>
                </div>
              </div>

              {!editingSessionId && (
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">Nombre de Séances (Hebdomadaires)</label>
                  <input 
                    type="number"
                    min="1"
                    max="20"
                    value={formData.number_of_sessions}
                    onChange={(e) => setFormData({...formData, number_of_sessions: parseInt(e.target.value) || 1})}
                    className="w-full bg-white border border-outline-variant rounded-xl px-4 py-3 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none text-sm font-bold shadow-sm transition-all"
                  />
                  <p className="text-[10px] text-outline italic">Les séances suivantes seront planifiées chaque semaine, en sautant les vacances.</p>
                </div>
              )}

              {availabilityError && (
                <div className="bg-error-container/20 p-4 rounded-xl border border-error/20 flex items-center gap-3 animate-in slide-in-from-top-2">
                  <span className="material-symbols-outlined text-error">warning</span>
                  <p className="text-xs font-bold text-error">{availabilityError}</p>
                </div>
              )}

              <div className="pt-6 border-t border-outline-variant flex justify-between gap-4">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-surface-container-high py-3 rounded-xl font-black text-on-surface-variant hover:bg-outline-variant transition-all uppercase text-[10px] tracking-widest active:scale-95"
                >
                  Annuler
                </button>
                <button 
                  onClick={handleValidate}
                  disabled={!formData.module || !formData.room || !!availabilityError || isCheckingAvailability}
                  className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-black hover:bg-slate-800 shadow-xl shadow-slate-900/20 uppercase text-[10px] tracking-widest active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  {isCheckingAvailability ? 'Vérification...' : (editingSessionId ? 'Mettre à jour la Séance' : 'Valider l\'Assignation')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timetable;
