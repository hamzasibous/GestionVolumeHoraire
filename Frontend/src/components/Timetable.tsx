import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  teacher?: string;
  teacher_id?: number;
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
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const filiereId = queryParams.get('filiereId');
  const semesterParam = queryParams.get('semester');

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
  const [filieres, setFilieres] = useState<any[]>([]);
  const [selectedFiliere, setSelectedFiliere] = useState<any>(null);
  const [selectedSemester, setSelectedSemester] = useState<string>(semesterParam || '');

  useEffect(() => {
    setSelectedSemester(semesterParam || '');
  }, [semesterParam]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationMessage, setGenerationMessage] = useState('');
  const [pendingTaskId, setPendingTaskId] = useState<number | null>(null);
  const [previewSlots, setPreviewSlots] = useState<TimetableSlot[]>([]);
  const [isSaving, setIsSaving] = useState(false);
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
    if (selectedSemester) {
      url += `&semester=${selectedSemester}`;
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
               teacher: s.enseignant_name,
               teacher_id: s.enseignant,
               type: s.type,
               color: s.type === 'CM' ? 'bg-primary-container/10 border-primary text-primary' : 
                      s.type === 'TD' ? 'bg-secondary-container/20 border-secondary text-secondary' :
                      'bg-tertiary-container/20 border-tertiary text-tertiary'
             };
           });

           // Filter and merge preview slots for this specific filiere and date range
           const filteredPreview = previewSlots.filter(ps => 
             ps.date >= start && 
             ps.date <= end && 
             // We need to check if the preview belongs to current filiere
             // Let's assume we filter by date for now as the preview is already calculated for Week 1
             true 
           );

           setSlots([...mapped, ...filteredPreview]);
        }
      })
      .catch(err => console.error('Error fetching slots:', err));
  };
  useEffect(() => {
    // 1. Fetch metadata (Locaux, Filieres, Teachers, Vacations, and Semester Periods)
    const fetchMetadata = async () => {
      try {
        const [locRes, filRes, vacRes, teaRes, semRes] = await Promise.all([
          fetch('http://localhost:8000/api/core/local/'),
          fetch('http://localhost:8000/api/core/filiere/details/'),
          fetch('http://localhost:8000/api/core/vacations/'),
          fetch('http://localhost:8000/api/users/management/'),
          fetch('http://localhost:8000/api/core/generate-schedule/?check_dates=all')
        ]);

        const [locData, filData, vacData, teaData, semData] = await Promise.all([
          locRes.json(), filRes.json(), vacRes.json(), teaRes.json(), semRes.json()
        ]);

        setLocaux(locData);
        setFilieres(filData);
        setVacations(vacData);
        setTeachers(teaData.filter((u: any) => u.role === 'ENSEIGNANT'));
        setSemesterPeriods(semData);

        // 2. Handle initial state from URL params
        if (filiereId) {
          const currentFiliere = filData.find((f: any) => f.id.toString() === filiereId);
          if (currentFiliere) {
            setSelectedFiliere(currentFiliere);
            
            // Set modules filtered by semester
            const filteredModules = selectedSemester 
              ? currentFiliere.modules.filter((m: any) => m.semestre === selectedSemester)
              : currentFiliere.modules;
            setModules(filteredModules.map((m: any) => ({ id: m.id, nom: m.nom })));

            // JUMP TO START DATE of selected semester if not already in range
            if (selectedSemester) {
              const period = semData.find((p: any) => p.semester === selectedSemester);
              if (period) {
                const startDate = new Date(period.start);
                // Only jump if the current view is far away (e.g. before the start)
                const current = new Date(currentWeekStart);
                if (current < startDate || current > new Date(period.end)) {
                   setCurrentWeekStart(getMonday(startDate));
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('Error fetching metadata:', err);
      }
    };

    fetchMetadata();
  }, [filiereId, selectedSemester]);

  useEffect(() => {
    fetchSlots();
  }, [currentWeekStart, filiereId, selectedSemester]);

  const handleFiliereChange = (id: string) => {
    const newParams = new URLSearchParams(location.search);
    newParams.set('filiereId', id);
    newParams.delete('semester'); // Clear semester on filiere change
    navigate(`${location.pathname}?${newParams.toString()}`);
  };

  const handleSemesterChange = (sem: string) => {
    const newParams = new URLSearchParams(location.search);
    newParams.set('semester', sem);
    navigate(`${location.pathname}?${newParams.toString()}`);
  };

  const handleGenerate = async () => {
    if (!selectedSemester) {
      alert("Veuillez d'abord sélectionner un semestre.");
      return;
    }
    
    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationMessage("Démarrage de l'IA...");

    const isAutumn = ['S1', 'S3', 'S5', 'M1', 'M3'].includes(selectedSemester);
    const targetSemesters = isAutumn ? 'S1,S3,S5,M1,M3' : 'S2,S4,S6,M2,M4';

    try {
      const response = await fetch('http://localhost:8000/api/core/generate-schedule/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ semesters: targetSemesters })
      });
      
      if (response.ok) {
        const { task_id } = await response.json();
        // Start polling
        const pollInterval = setInterval(async () => {
          try {
            const statusRes = await fetch(`http://localhost:8000/api/core/task-status/${task_id}/`);
            if (statusRes.ok) {
              const task = await statusRes.json();
              setGenerationProgress(task.progress);
              setGenerationMessage(task.message);
              
              if (task.status === 'COMPLETED') {
                clearInterval(pollInterval);
                setPendingTaskId(task.id);

                // Map preview data to TimetableSlot format
                const mappedPreview: TimetableSlot[] = (task.result_data || [])
                  .filter((s: any) => s.filiere_id.toString() === filiereId && s.semester === selectedSemester) // Strict Filter
                  .map((s: any) => ({
                    id: `preview-${s.module_id}-${s.slot}`,
                    day: days[new Date(s.date).getDay() - 1] || 'Lundi',
                    date: s.date,
                    startTime: s.heure_debut,
                    endTime: addMinutes(s.heure_debut, 120),
                    module: s.module_name,
                    room: s.room_name,
                    teacher: s.teacher_name,
                    teacher_id: s.teacher_id,
                    type: 'CM',
                    color: 'bg-sky-500/20 border-sky-500 text-sky-700 italic border-dashed border-2',
                    isPreview: true
                  }));
                setPreviewSlots(mappedPreview);

                setIsGenerating(false);
              } else if (task.status === 'FAILED') {
                clearInterval(pollInterval);
                setIsGenerating(false);
                alert(`Erreur de génération: ${task.message}`);
              }
            }
          } catch (pollError) {
            console.error("Polling error:", pollError);
          }
        }, 1000);
      } else {
        const data = await response.json();
        alert(`Erreur: ${data.error}`);
        setIsGenerating(false);
      }
    } catch (error) {
      console.error("Generation error:", error);
      setIsGenerating(false);
    }
  };

  const handleConfirmSave = async () => {
    if (!pendingTaskId) return;

    setIsSaving(true);
    try {
      const response = await fetch('http://localhost:8000/api/core/confirm-schedule/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: pendingTaskId })
      });

      if (response.ok) {
        alert("Emploi du temps enregistré définitivement dans la base de données !");
        setPendingTaskId(null);
        setPreviewSlots([]); // Clear preview
        fetchSlots();
      } else {
        const data = await response.json();
        alert(`Erreur d'enregistrement: ${data.error}`);
      }
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelPreview = () => {
    setPendingTaskId(null);
    setPreviewSlots([]);
  };

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
    let url = `http://localhost:8000/api/core/sceance/check_availability/?local=${roomId}&date=${date}&heure_debut=${startTime}&duree=${duree}`;
    if (editingSessionId) {
      url += `&exclude_id=${editingSessionId}`;
    }
    
    fetch(url)
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

  const [semesterPeriods, setSemesterPeriods] = useState<any[]>([]);

  useEffect(() => {
    // Fetch Semester Periods to know the boundaries
    fetch('http://localhost:8000/api/core/generate-schedule/?check_dates=all') // We'll need to implement this or similar
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setSemesterPeriods(data);
      })
      .catch(err => console.error('Error fetching semester periods:', err));
  }, []);

  const navigateWeek = (direction: 'prev' | 'next') => {
    let newDate = new Date(currentWeekStart);
    const step = direction === 'next' ? 7 : -7;

    newDate.setDate(newDate.getDate() + step);

    // Academic Year Boundaries (Sept 1 to Aug 31)
    const yearStart = new Date(2026, 8, 1);
    const yearEnd = new Date(2027, 7, 31);

    // Infinite Loop Logic
    if (newDate > yearEnd) {
      newDate = getMonday(yearStart);
    } else if (newDate < yearStart) {
      newDate = getMonday(yearEnd);
    }

    setCurrentWeekStart(newDate);

    // Auto-detect and update semester context based on date
    const dateStr = formatDate(newDate);
    const activeSem = semesterPeriods.find(p => dateStr >= p.start && dateStr <= p.end);
    
    if (activeSem && activeSem.semester !== selectedSemester) {
       // Update URL and state to match the new semester we scrolled into
       const newParams = new URLSearchParams(location.search);
       newParams.set('semester', activeSem.semester);
       navigate(`${location.pathname}?${newParams.toString()}`);
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
      ? `http://localhost:8000/api/core/sceance/${editingSessionId}/?filiere=${filiereId}` 
      : `http://localhost:8000/api/core/sceance/?filiere=${filiereId}`;

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
            <div className="flex items-center gap-2">
              <span className="text-sky-400 font-bold text-xs uppercase">
                {selectedFiliere?.nom || 'SÉLECTIONNER UNE FILIÈRE'}
              </span>
              <div className="relative group/filiere">
                <button className="text-slate-400 hover:text-white transition-colors flex items-center">
                  <span className="material-symbols-outlined text-sm">arrow_drop_down</span>
                </button>
                {/* Filière Selection Dropdown */}
                <div className="absolute left-0 top-full mt-2 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 py-2 opacity-0 invisible group-hover/filiere:opacity-100 group-hover/filiere:visible transition-all duration-200">
                  <div className="px-4 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-700/50 mb-1">
                    Choisir une Filière
                  </div>
                  {filieres.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => handleFiliereChange(f.id.toString())}
                      className={`w-full text-left px-4 py-2 text-xs transition-colors ${
                        filiereId === f.id.toString() 
                          ? 'text-sky-400 bg-slate-700/50 font-bold' 
                          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {f.nom}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="w-1 h-1 rounded-full bg-slate-600"></div>
            
            {/* Semester Selection */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium text-xs uppercase">
                {selectedSemester ? (selectedSemester.startsWith('M') ? `Master - ${selectedSemester}` : `Semestre ${selectedSemester}`) : 'CHOISIR SEMESTRE'}
              </span>
              <div className="relative group/semester">
                <button className="text-slate-400 hover:text-white transition-colors flex items-center">
                  <span className="material-symbols-outlined text-sm">arrow_drop_down</span>
                </button>
                <div className="absolute left-0 top-full mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 py-2 opacity-0 invisible group-hover/semester:opacity-100 group-hover/semester:visible transition-all duration-200">
                  <div className="px-4 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-700/50 mb-1">
                    Semestres
                  </div>
                  {selectedFiliere && (selectedFiliere.niveaux.startsWith('Master') ? ['M1', 'M2', 'M3', 'M4'] : ['S1', 'S2', 'S3', 'S4', 'S5', 'S6']).map((sem) => (
                    <button
                      key={sem}
                      onClick={() => handleSemesterChange(sem)}
                      className={`w-full text-left px-4 py-2 text-xs transition-colors ${
                        selectedSemester === sem
                          ? 'text-sky-400 bg-slate-700/50 font-bold' 
                          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {sem}
                    </button>
                  ))}
                  {!selectedFiliere && (
                    <div className="px-4 py-2 text-xs text-slate-500 italic">Sélectionnez une filière d'abord</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-md">
          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`bg-slate-800 text-sky-400 border border-slate-700 px-6 py-2 rounded-lg font-bold hover:bg-slate-700 transition-all uppercase text-[10px] tracking-widest flex items-center gap-2 ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className="material-symbols-outlined text-sm">{isGenerating ? 'sync' : 'psychology'}</span>
            {isGenerating ? 'Génération en cours...' : 'Générer avec l\'IA'}
          </button>
          <button className="bg-sky-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-sky-400 transition-all uppercase text-[10px] tracking-widest shadow-lg shadow-sky-500/20 active:scale-95">Exporter PDF</button>
        </div>
      </header>

      {/* Week Navigator */}
      <div className="bg-white border-b border-outline-variant px-gutter py-4 flex items-center justify-between shadow-sm relative">
        {/* Progress Modal */}
        {isGenerating && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-10 border border-slate-200 animate-in zoom-in duration-300">
              <div className="flex flex-col items-center text-center gap-6">
                <div className="w-16 h-16 rounded-full bg-sky-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-sky-500 text-4xl animate-spin">psychology</span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Optimisation IA en cours</h3>
                  <p className="text-slate-500 text-sm font-medium">{generationMessage}</p>
                </div>
                
                {/* Progress Bar Container */}
                <div className="w-full space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Progression</span>
                    <span>{generationProgress}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div 
                      className="h-full bg-sky-500 transition-all duration-500 ease-out" 
                      style={{ width: `${generationProgress}%` }}
                    ></div>
                  </div>
                </div>
                
                <p className="text-[10px] text-slate-400 italic">Veuillez ne pas fermer cette fenêtre. L'algorithme résout actuellement les conflits de locaux et d'enseignants...</p>
              </div>
            </div>
          </div>
        )}
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
                                {slot.teacher && (
                                  <span className="text-[9px] font-black text-sky-700/80 mb-1 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[12px]">person</span>
                                    {slot.teacher}
                                  </span>
                                )}
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
      {/* Floating Save Bar */}
      {pendingTaskId && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl p-6 flex items-center gap-8 animate-in slide-in-from-bottom-10 duration-500 max-w-2xl w-full mx-4">
          <div className="flex-1">
            <h4 className="text-white font-black text-sm uppercase tracking-tight">Emploi du temps prêt !</h4>
            <p className="text-slate-400 text-[11px] font-medium leading-relaxed mt-1">L'IA a optimisé le planning. Cliquez sur enregistrer pour l'appliquer définitivement aux 12 semaines du semestre.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleCancelPreview}
              className="px-6 py-2.5 rounded-xl text-slate-400 font-bold text-xs hover:bg-slate-800 transition-colors uppercase tracking-widest"
            >
              Annuler
            </button>
            <button 
              onClick={handleConfirmSave}
              disabled={isSaving}
              className={`bg-sky-500 text-white px-8 py-2.5 rounded-xl font-black text-xs hover:bg-sky-400 transition-all uppercase tracking-widest shadow-lg shadow-sky-500/20 flex items-center gap-2 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="material-symbols-outlined text-sm">{isSaving ? 'sync' : 'save_as'}</span>
              {isSaving ? 'Enregistrement...' : 'Enregistrer dans la DB'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timetable;
