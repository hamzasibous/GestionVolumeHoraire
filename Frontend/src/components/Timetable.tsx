import React, { useState, useEffect } from 'react';
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
  end: string;
  isBreak?: boolean;
  breakType?: string;
  breakDuration?: string;
}

const timeConfig: TimeConfig[] = [
  { label: '08:30', end: '10:30' },
  { label: 'Pause', end: '', isBreak: true, breakType: 'Pause', breakDuration: '15 min' },
  { label: '10:45', end: '12:45' },
  { label: 'Midi', end: '', isBreak: true, breakType: 'Midi', breakDuration: 'Pause' },
  { label: '14:30', end: '16:30' },
  { label: 'Pause', end: '', isBreak: true, breakType: 'Pause', breakDuration: '15 min' },
  { label: '16:45', end: '18:45' },
];

// Helper to get the Monday of the week for a given date
const getMonday = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(date.setDate(diff));
};

// Helper to format date as YYYY-MM-DD
const formatDate = (date: Date) => date.toISOString().split('T')[0];

const Timetable: React.FC = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showNavCalendar, setShowNavCalendar] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ day: string; time: string; endTime: string; date: string } | null>(null);
  
  const [locaux, setLocaux] = useState<Local[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [vacations, setVacations] = useState<any[]>([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    module: '',
    room: '',
    type: 'Cours',
    customTime: '',
    totalSessions: 18,
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

  const fetchSlots = () => {
    // In a real app, you'd fetch slots for the specific week range
    const start = formatDate(weekDates[0]);
    const end = formatDate(weekDates[5]);
    
    fetch(`http://localhost:8000/api/core/sceance/?start_date=${start}&end_date=${end}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
           const mapped = data.map((s: any) => ({
             id: s.id.toString(),
             day: days[new Date(s.date).getDay() - 1] || 'Lundi',
             date: s.date,
             startTime: s.startTime || '08:30', // Fallback if backend structure differs
             endTime: s.endTime || '10:30',
             module: s.module_name,
             room: s.local_name,
             type: s.type,
             color: s.type === 'Cours' ? 'bg-primary-container/10 border-primary text-primary' : 
                    s.type === 'TD' ? 'bg-secondary-container/20 border-secondary text-on-secondary-container' :
                    'bg-tertiary-container/20 border-tertiary text-on-tertiary-container'
           }));
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

    fetch('http://localhost:8000/api/core/module/')
      .then(res => res.json())
      .then(data => setModules(data))
      .catch(err => console.error('Error fetching modules:', err));

    fetch('http://localhost:8000/api/core/vacations/')
      .then(res => res.json())
      .then(data => setVacations(data))
      .catch(err => console.error('Error fetching vacations:', err));
  }, []);

  useEffect(() => {
    fetchSlots();
  }, [currentWeekStart]);

  useEffect(() => {
    if (formData.room && formData.startDate) {
      checkAvailability(formData.room, formData.startDate);
    } else {
      setAvailabilityError(null);
    }
  }, [formData.room, formData.startDate]);

  const checkAvailability = (roomId: string, date: string) => {
    setIsCheckingAvailability(true);
    fetch(`http://localhost:8000/api/core/sceance/check_availability/?local=${roomId}&date=${date}`)
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

  const handleCellClick = (day: string, config: TimeConfig, date: string) => {
    const defaultTime = `${config.label} - ${config.end}`;
    setSelectedCell({ day, time: config.label, endTime: config.end, date });
    setFormData({ 
      module: '', 
      room: '', 
      type: 'Cours',
      customTime: defaultTime,
      totalSessions: 18,
      startDate: date // Pre-fill with the specific date of the clicked column
    });
    setAvailabilityError(null);
    setIsModalOpen(true);
    setShowCalendar(false);
  };

  const handleValidate = () => {
    if (!selectedCell || !formData.module || !formData.room || availabilityError) return;

    const payload = {
      type: formData.type,
      duree: 120, // 2 hours by default
      date: formData.startDate,
      module: formData.module,
      enseignant: 1, // This should come from the user's session in a full app
      local: formData.room
    };

    fetch('http://localhost:8000/api/core/sceance/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(res => {
      if (res.ok) {
        fetchSlots();
        setIsModalOpen(false);
      } else {
        alert("Erreur lors de l'enregistrement de la séance.");
      }
    })
    .catch(err => console.error('Error saving session:', err));
  };

  const getTimeOptions = () => {
    if (!selectedCell) return [];
    if (['08:30', '10:45'].includes(selectedCell.time)) {
      return ['08:30 - 10:30', '10:45 - 12:45', '08:30 - 12:45'];
    }
    if (['14:30', '16:45'].includes(selectedCell.time)) {
      return ['14:30 - 16:30', '16:45 - 18:45', '14:30 - 18:45'];
    }
    return [`${selectedCell.time} - ${selectedCell.endTime}`];
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
                
                return (
                  <React.Fragment key={day}>
                    <div className="border-b border-r border-outline-variant bg-surface-container flex flex-col items-center justify-center gap-1">
                      <span className="font-black text-on-surface uppercase text-[12px] tracking-tight">{day}</span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        dateStr === formatDate(new Date()) ? 'bg-primary text-on-primary' : 'text-outline border border-outline-variant bg-white'
                      }`}>
                        {dayDate.getDate()} {dayDate.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')}
                      </span>
                    </div>
                    {timeConfig.map((config, i) => {
                      const slot = slots.find(s => {
                        if (s.date !== dateStr) return false;
                        if (config.isBreak) {
                          const prev = timeConfig[i - 1];
                          const next = timeConfig[i + 1];
                          return prev && next && s.startTime <= prev.label && s.endTime >= next.end;
                        }
                        return s.startTime <= config.label && s.endTime >= config.end;
                      });
                      
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
                          onClick={() => !slot && handleCellClick(day, config, dateStr)}
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
                  <h3 className="text-lg font-black uppercase tracking-tight">Assigner une Séance</h3>
                  <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Planification du {new Date(selectedCell.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {/* Modal Content */}
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">Jour de la Semaine</label>
                  <div className="bg-surface-container-low px-4 py-3 rounded-xl border border-outline-variant font-black text-primary text-sm shadow-inner uppercase">{selectedCell.day}</div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">Plage Horaire</label>
                  <select 
                    value={formData.customTime}
                    onChange={(e) => setFormData({...formData, customTime: e.target.value})}
                    className="w-full bg-white border border-outline-variant rounded-xl px-4 py-3 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none text-sm font-bold shadow-sm transition-all cursor-pointer"
                  >
                    {getTimeOptions().map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
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
                    {['Cours', 'TD', 'TP'].map(type => (
                      <button
                        key={type}
                        onClick={() => setFormData({...formData, type})}
                        className={`py-2 rounded-lg text-[10px] font-black uppercase border transition-all ${
                          formData.type === type 
                          ? 'bg-primary text-on-primary border-primary shadow-md' 
                          : 'bg-white text-on-surface-variant border-outline-variant hover:border-primary/50'
                        }`}
                      >
                        {type}
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
                  {isCheckingAvailability ? 'Vérification...' : 'Valider l\'Assignation'}
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
