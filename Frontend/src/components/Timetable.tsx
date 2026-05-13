import React, { useState } from 'react';

interface TimetableSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  module: string;
  room: string;
  color: string;
}

const initialSlots: TimetableSlot[] = [
  { id: '1', day: 'Lundi', startTime: '08:30', endTime: '10:30', module: 'ARCH ORDIN', room: 'BL8.3', color: 'bg-secondary-container/20 border-secondary text-on-secondary-container' },
  { id: '2', day: 'Mardi', startTime: '08:30', endTime: '10:30', module: 'PROG LANG C', room: 'AMPHI E', color: 'bg-primary-container/10 border-primary text-primary' },
  { id: '3', day: 'Mercredi', startTime: '14:30', endTime: '16:30', module: 'PROG OBJ', room: 'AMPHI H', color: 'bg-secondary-container/20 border-secondary text-on-secondary-container' },
  { id: '4', day: 'Jeudi', startTime: '10:45', endTime: '12:45', module: 'PROBA STAT', room: 'BL9.4', color: 'bg-tertiary-container/20 border-tertiary text-on-tertiary-container' },
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
  const [selectedCell, setSelectedCell] = useState<{ day: string; time: string; endTime: string } | null>(null);
  
  const [formData, setFormData] = useState({
    module: '',
    room: ''
  });

  const handleCellClick = (day: string, config: TimeConfig) => {
    setSelectedCell({ day, time: config.label, endTime: config.end });
    setFormData({ module: '', room: '' });
    setIsModalOpen(true);
  };

  const handleValidate = () => {
    if (!selectedCell || !formData.module || !formData.room) return;

    const newSlot: TimetableSlot = {
      id: Math.random().toString(36).substr(2, 9),
      day: selectedCell.day,
      startTime: selectedCell.time,
      endTime: selectedCell.endTime,
      module: formData.module,
      room: formData.room,
      color: 'bg-primary-container/10 border-primary text-primary'
    };

    setSlots([...slots, newSlot]);
    setIsModalOpen(false);
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
                    const slot = slots.find(s => s.day === day && s.startTime === config.label);
                    
                    if (config.isBreak) {
                      return <div key={i} className="border-b border-r border-outline-variant opacity-50 bg-[repeating-linear-gradient(45deg,#f1f5f9,#f1f5f9_10px,#ffffff_10px,#ffffff_20px)] shadow-inner"></div>;
                    }

                    return (
                      <div 
                        key={i} 
                        onClick={() => !slot && handleCellClick(day, config)}
                        className={`border-b border-r border-outline-variant transition-all ${slot ? 'p-2' : 'hover:bg-primary/5 cursor-pointer bg-white group'}`}
                      >
                        {slot ? (
                          <div className={`h-full border-l-4 p-1 flex flex-col justify-between rounded-sm shadow-sm transition-transform hover:scale-[1.02] ${slot.color}`}>
                            <span className="text-[10px] font-bold uppercase truncate leading-tight">{slot.module} : {slot.room}</span>
                            <span className="text-[10px] font-medium opacity-80">{slot.startTime} - {slot.endTime}</span>
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
                  <label className="block font-label-caps text-outline mb-xs text-[10px] uppercase font-bold tracking-widest">HORAIRE</label>
                  <div className="bg-surface-container-low p-sm rounded-lg border border-outline-variant font-bold text-primary text-sm shadow-inner">
                    {selectedCell.time} - {selectedCell.endTime}
                  </div>
                </div>
              </div>
              <div className="space-y-sm">
                <div>
                  <label className="block font-label-caps text-outline mb-xs text-[10px] uppercase font-bold tracking-widest">MATIÈRE / MODULE</label>
                  <select 
                    value={formData.module}
                    onChange={(e) => setFormData({...formData, module: e.target.value})}
                    className="w-full bg-white border border-outline-variant rounded-lg px-md py-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm font-medium shadow-sm transition-all"
                  >
                    <option value="">Sélectionner un module...</option>
                    <option value="Algorithmique & C">Algorithmique & C</option>
                    <option value="Architecture des Ordinateurs">Architecture des Ordinateurs</option>
                    <option value="Probabilités & Statistiques">Probabilités & Statistiques</option>
                    <option value="Programmation Web I">Programmation Web I</option>
                  </select>
                </div>
                <div>
                  <label className="block font-label-caps text-outline mb-xs text-[10px] uppercase font-bold tracking-widest">SALLE (LOCAL)</label>
                  <select 
                    value={formData.room}
                    onChange={(e) => setFormData({...formData, room: e.target.value})}
                    className="w-full bg-white border border-outline-variant rounded-lg px-md py-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm font-medium shadow-sm transition-all"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="AMPHI E">AMPHI E</option>
                    <option value="BLOC 8 - Salle 3">BLOC 8 - Salle 3</option>
                    <option value="LABO GINF 2">LABO GINF 2</option>
                  </select>
                </div>
              </div>
              <div className="pt-md border-t border-outline-variant flex justify-between gap-md">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-surface-container py-sm rounded-lg font-bold text-on-surface-variant hover:bg-outline-variant transition-colors uppercase text-[10px] tracking-widest active:scale-95"
                >
                  Effacer
                </button>
                <button 
                  onClick={handleValidate}
                  disabled={!formData.module || !formData.room}
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
              <span className="text-primary font-bold">18h / 24h</span>
            </div>
            <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden shadow-inner">
              <div className="bg-primary h-full transition-all duration-1000" style={{ width: '75%' }}></div>
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
