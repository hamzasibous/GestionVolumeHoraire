import React, { useState, useEffect } from 'react';
import HolidayCalendar from './HolidayCalendar';

interface TimetableSlot {
  id: string;
  day: string;
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

const initialSlots: TimetableSlot[] = [
  { id: '1', day: 'Lundi', startTime: '08:30', endTime: '10:30', module: 'ARCH ORDIN', room: 'BL8.3', type: 'Cours', totalSessions: 12, color: 'bg-secondary-container/20 border-secondary text-on-secondary-container' },
  { id: '2', day: 'Mardi', startTime: '08:30', endTime: '10:30', module: 'PROG LANG C', room: 'AMPHI E', type: 'TD', totalSessions: 8, color: 'bg-primary-container/10 border-primary text-primary' },
  { id: '3', day: 'Mercredi', startTime: '14:30', endTime: '16:30', module: 'PROG OBJ', room: 'AMPHI H', type: 'TP', totalSessions: 6, color: 'bg-secondary-container/20 border-secondary text-on-secondary-container' },
  { id: '4', day: 'Jeudi', startTime: '10:45', endTime: '12:45', module: 'PROBA STAT', room: 'BL9.4', type: 'Cours', totalSessions: 14, color: 'bg-tertiary-container/20 border-tertiary text-on-tertiary-container' },
];

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

const Timetable: React.FC = () => {
  const [slots, setSlots] = useState<TimetableSlot[]>(initialSlots);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ day: string; time: string; endTime: string } | null>(null);
  
  const [locaux, setLocaux] = useState<Local[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
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

  useEffect(() => {
    // Fetch Locaux
    fetch('http://localhost:8000/api/core/local/')
      .then(res => res.json())
      .then(data => setLocaux(data))
      .catch(err => console.error('Error fetching locaux:', err));

    // Fetch Modules
    fetch('http://localhost:8000/api/core/module/')
      .then(res => res.json())
      .then(data => setModules(data))
      .catch(err => console.error('Error fetching modules:', err));
  }, []);

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

  const totalPlannedHours = slots.length * 2; 

  const handleCellClick = (day: string, config: TimeConfig) => {
    const defaultTime = `${config.label} - ${config.end}`;
    setSelectedCell({ day, time: config.label, endTime: config.end });
    setFormData({ 
      module: '', 
      room: '', 
      type: 'Cours',
      customTime: defaultTime,
      totalSessions: 18,
      startDate: ''
    });
    setAvailabilityError(null);
    setIsModalOpen(true);
    setShowCalendar(false);
  };

  const handleValidate = () => {
    if (!selectedCell || !formData.module || !formData.room || availabilityError) return;

    const [start, end] = formData.customTime.split(' - ');
    const selectedRoom = locaux.find(l => l.id.toString() === formData.room);
    const selectedModule = modules.find(m => m.id.toString() === formData.module);

    const newSlot: TimetableSlot = {
      id: Math.random().toString(36).substr(2, 9),
      day: selectedCell.day,
      startTime: start,
      endTime: end,
      module: selectedModule?.nom || 'Inconnu',
      room: selectedRoom?.name || 'Inconnu',
      room_id: formData.room,
      type: formData.type,
      totalSessions: formData.totalSessions,
      color: formData.type === 'Cours' ? 'bg-primary-container/10 border-primary text-primary' : 
             formData.type === 'TD' ? 'bg-secondary-container/20 border-secondary text-on-secondary-container' :
             'bg-tertiary-container/20 border-tertiary text-on-tertiary-container'
    };

    setSlots([...slots, newSlot]);
    setIsModalOpen(false);
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
      <header className="flex justify-between items-center h-16 px-gutter bg-surface border-b border-outline-variant sticky top-0 z-40">
        <div className="flex items-center gap-md">
          <h1 className="font-h3 text-h3 font-bold text-primary tracking-tight">Gestion des Emplois du Temps</h1>
          <div className="hidden md:flex gap-md">
            <span className="text-on-surface-variant font-medium border-b-2 border-transparent">Semestre d'Automne</span>
            <span className="text-primary font-bold border-b-2 border-primary">Filière GINF</span>
            <span className="text-on-surface-variant font-medium border-b-2 border-transparent">Section A</span>
          </div>
        </div>
        <div className="flex items-center gap-md">
          <button className="bg-primary text-on-primary px-md py-sm rounded-lg font-bold hover:opacity-80 transition-opacity uppercase text-[10px] tracking-widest shadow-md">Exporter PDF</button>
        </div>
      </header>

      {/* Timetable Interface */}
      <section className="flex-1 p-gutter overflow-y-auto pb-24 bg-background">
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden mb-lg">
          <div className="p-md border-b border-outline-variant flex justify-between items-center bg-white">
            <div>
              <h2 className="font-h2 text-h2 text-primary font-bold tracking-tight">Emploi du Temps : Filière GINF - Semestre III</h2>
              <p className="text-on-surface-variant text-sm mt-1">Cliquez sur un créneau libre pour ajouter une séance</p>
            </div>
            <div className="flex items-center gap-md">
              <div className="flex items-center gap-xs">
                <span className="w-3 h-3 rounded-full bg-secondary-container"></span>
                <span className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">Occupé</span>
              </div>
              <div className="flex items-center gap-xs">
                <span className="w-3 h-3 rounded-full bg-surface-container"></span>
                <span className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">Pause</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[1000px] grid grid-cols-[100px_1fr_40px_1fr_60px_1fr_40px_1fr] grid-rows-[auto_repeat(6,80px)] border-collapse bg-white">
              {/* Header */}
              <div className="h-12 border-b border-r border-outline-variant bg-surface-container flex items-center justify-center font-label-caps text-[10px] uppercase font-bold text-outline">Jour / Heure</div>
              {timeConfig.map((config, i) => (
                <div key={i} className={`border-b border-r border-outline-variant ${config.isBreak ? 'bg-surface-container-low italic' : 'bg-surface-container'} flex flex-col items-center justify-center py-1`}>
                  <span className={`font-bold uppercase tracking-tighter ${config.isBreak ? 'text-[10px] text-outline-variant' : 'text-primary text-sm'}`}>{config.label}</span>
                  {!config.isBreak && <span className="text-[10px] text-outline font-medium">{config.end}</span>}
                  {config.isBreak && <span className="text-[10px] text-outline font-medium">{config.breakDuration}</span>}
                </div>
              ))}

              {/* Rows */}
              {days.map((day) => (
                <React.Fragment key={day}>
                  <div className="border-b border-r border-outline-variant font-bold text-on-surface bg-surface-container flex items-center justify-center uppercase text-[11px] tracking-widest">{day}</div>
                  {timeConfig.map((config, i) => {
                    const slot = slots.find(s => {
                      if (s.day !== day) return false;
                      if (config.isBreak) {
                        const prev = timeConfig[i - 1];
                        const next = timeConfig[i + 1];
                        return prev && next && s.startTime <= prev.label && s.endTime >= next.end;
                      }
                      return s.startTime <= config.label && s.endTime >= config.end;
                    });
                    
                    if (config.isBreak) {
                      return (
                        <div key={i} className="border-b border-r border-outline-variant opacity-50 bg-[repeating-linear-gradient(45deg,#f1f5f9,#f1f5f9_10px,#ffffff_10px,#ffffff_20px)] shadow-inner relative">
                          {slot && (
                            <div className={`absolute inset-0 z-10 opacity-90 ${slot.color} border-l-0 border-r-0`}></div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div 
                        key={i} 
                        onClick={() => !slot && handleCellClick(day, config)}
                        className={`border-b border-r border-outline-variant transition-all ${slot ? 'p-1' : 'hover:bg-primary/5 cursor-pointer bg-white group'}`}
                      >
                        {slot ? (
                          <div className={`h-full border-l-4 p-1 flex flex-col justify-between rounded-sm shadow-sm transition-transform hover:scale-[1.02] ${slot.color}`}>
                            <span className="text-[9px] font-bold uppercase truncate leading-tight">{slot.type} : {slot.module}</span>
                            <span className="text-[9px] font-medium opacity-90">{slot.room}</span>
                            <span className="text-[8px] font-medium opacity-70">{slot.startTime} - {slot.endTime}</span>
                          </div>
                        ) : (
                          <div className="w-full h-full opacity-0 group-hover:opacity-100 flex items-center justify-center">
                             <span className="material-symbols-outlined text-primary/30 text-lg">add_circle</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-md">
          <button className="px-lg py-sm rounded-lg border border-outline text-on-surface-variant font-bold hover:bg-surface-container transition-colors uppercase text-[10px] tracking-widest active:scale-95">Annuler les modifications</button>
          <button className="px-lg py-sm rounded-lg bg-primary text-on-primary font-bold shadow-lg hover:shadow-primary/20 transition-all uppercase text-[10px] tracking-widest active:scale-95">Enregistrer l'Emploi du Temps</button>
        </div>
      </section>

      {/* Assignment Modal Overlay */}
      {isModalOpen && selectedCell && (
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-[100] flex items-start justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest w-full max-w-2xl rounded-xl shadow-2xl border border-outline-variant overflow-hidden animate-in zoom-in duration-300 my-8">
            {/* Modal Header */}
            <div className="bg-primary p-md flex items-center justify-between">
              <div className="flex items-center gap-sm text-on-primary">
                <span className="material-symbols-outlined text-2xl">add_task</span>
                <h3 className="font-h3 text-h3 font-bold uppercase tracking-tight text-sm">Assigner une Nouvelle Séance</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-on-primary/60 hover:text-on-primary transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {/* Modal Content */}
            <div className="p-lg space-y-md">
              <div className="grid grid-cols-2 gap-md">
                <div>
                  <label className="block font-label-caps text-outline mb-xs text-[10px] uppercase font-bold tracking-widest">JOUR</label>
                  <div className="bg-surface-container-low p-sm rounded-lg border border-outline-variant font-bold text-primary text-sm shadow-inner">{selectedCell.day}</div>
                </div>
                <div>
                  <label className="block font-label-caps text-outline mb-xs text-[10px] uppercase font-bold tracking-widest">PLAGE HORAIRE</label>
                  <select 
                    value={formData.customTime}
                    onChange={(e) => setFormData({...formData, customTime: e.target.value})}
                    className="w-full bg-white border border-outline-variant rounded-lg px-md py-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm font-medium shadow-sm transition-all"
                  >
                    {getTimeOptions().map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="relative">
                <label className="block font-label-caps text-outline mb-xs text-[10px] uppercase font-bold tracking-widest">DATE DE DÉBUT (VÉRIFIER LES JOURS FÉRIÉS)</label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-surface-container-low p-sm rounded-lg border border-outline-variant font-bold text-primary text-sm shadow-inner min-h-[40px] flex items-center px-4">
                    {formData.startDate || "Choisir une date..."}
                  </div>
                  <button 
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="bg-primary text-on-primary px-4 rounded-lg flex items-center justify-center hover:bg-primary/90 transition-all active:scale-95 shadow-md"
                  >
                    <span className="material-symbols-outlined">calendar_month</span>
                  </button>
                </div>
                
                {showCalendar && (
                  <div className="absolute left-0 right-0 top-full mt-2 z-[110]">
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

              <div className="space-y-sm">
                <div className="grid grid-cols-1 gap-md">
                  <div>
                    <label className="block font-label-caps text-outline mb-xs text-[10px] uppercase font-bold tracking-widest">TYPE DE SÉANCE</label>
                    <select 
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="w-full bg-white border border-outline-variant rounded-lg px-md py-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm font-medium shadow-sm transition-all"
                    >
                      <option value="Cours">Cours</option>
                      <option value="TD">TD</option>
                      <option value="TP">TP</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-md">
                  <div>
                    <label className="block font-label-caps text-outline mb-xs text-[10px] uppercase font-bold tracking-widest">SALLE (LOCAL)</label>
                    <select 
                      value={formData.room}
                      onChange={(e) => setFormData({...formData, room: e.target.value})}
                      className={`w-full bg-white border rounded-lg px-md py-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm font-medium shadow-sm transition-all ${availabilityError ? 'border-error ring-error/20' : 'border-outline-variant'}`}
                    >
                      <option value="">Sélectionner...</option>
                      {locaux.map(l => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                    {isCheckingAvailability && <p className="text-[10px] text-primary mt-1 animate-pulse italic">Vérification de la disponibilité...</p>}
                    {availabilityError && <p className="text-[10px] text-error mt-1 font-bold">{availabilityError}</p>}
                  </div>
                </div>
                <div>
                  <label className="block font-label-caps text-outline mb-xs text-[10px] uppercase font-bold tracking-widest">MATIÈRE / MODULE</label>
                  <select 
                    value={formData.module}
                    onChange={(e) => setFormData({...formData, module: e.target.value})}
                    className="w-full bg-white border border-outline-variant rounded-lg px-md py-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm font-medium shadow-sm transition-all"
                  >
                    <option value="">Sélectionner un module...</option>
                    {modules.map(m => (
                      <option key={m.id} value={m.id}>{m.nom}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="pt-md border-t border-outline-variant flex justify-between gap-md">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-surface-container py-sm rounded-lg font-bold text-on-surface-variant hover:bg-outline-variant transition-colors uppercase text-[10px] tracking-widest active:scale-95"
                >
                  Annuler
                </button>
                <button 
                  onClick={handleValidate}
                  disabled={!formData.module || !formData.room || !!availabilityError || isCheckingAvailability}
                  className="flex-1 bg-secondary text-on-secondary py-sm rounded-lg font-bold hover:opacity-90 shadow-md uppercase text-[10px] tracking-widest active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  Valider l'Assignation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Info Card */}
      <div className="fixed bottom-gutter right-gutter w-72 bg-white rounded-xl border border-outline-variant shadow-xl p-md hidden lg:block z-30 animate-in slide-in-from-right-4 duration-500">
        <div className="flex items-center gap-sm mb-sm border-b border-outline-variant/30 pb-2">
          <div className="p-1 bg-tertiary-fixed-dim rounded-lg">
            <span className="material-symbols-outlined text-on-tertiary-fixed text-lg">info</span>
          </div>
          <h4 className="font-bold text-xs uppercase tracking-widest text-primary">Statistiques de Charge</h4>
        </div>
        <div className="space-y-sm">
          <div>
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-1">
              <span className="text-on-surface-variant">Heures Planifiées</span>
              <span className="text-primary font-bold">{totalPlannedHours}h / 24h</span>
            </div>
            <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden shadow-inner">
              <div className="bg-primary h-full transition-all duration-1000" style={{ width: `${(totalPlannedHours / 24) * 100}%` }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-1">
              <span className="text-on-surface-variant">Disponibilité Salles</span>
              <span className="text-secondary font-bold">62%</span>
            </div>
            <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden shadow-inner">
              <div className="bg-secondary h-full transition-all duration-1000" style={{ width: '62%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timetable;
