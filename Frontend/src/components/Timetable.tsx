import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import HolidayCalendar from './HolidayCalendar';

interface TimetableSlot {
  id: string;
  day: string;
  date: string; 
  startTime: string;
  endTime: string;
  module: string;
  room: string;
  room_id?: string;
  teacher?: string;
  teacher_id?: number;
  type: string;
  totalSessions?: number;
  color: string;
  isPreview?: boolean;
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

  // 1. State Declarations
  const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadSeason, setUploadSeason] = useState<'Automne' | 'Printemps'>('Automne');
  const [uploadSemester, setUploadSemester] = useState<string>('');
  const [uploadFiliereId, setUploadFiliereId] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState<'upload' | 'review'>('upload');
  const [extractedSessions, setExtractedSessions] = useState<any[]>([]);
  const [reviewMetadata, setReviewMetadata] = useState<{all_profs: any[], all_rooms: any[], available_modules: any[]}>({all_profs: [], all_rooms: [], available_modules: []});
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
  const [semesterPeriods, setSemesterPeriods] = useState<any[]>([]);
  const [isListView, setIsListView] = useState(false);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationMessage, setGenerationMessage] = useState('');
  const [pendingTaskId, setPendingTaskId] = useState<number | null>(null);
  const [previewSlots, setPreviewSlots] = useState<TimetableSlot[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [modalAvailableProfs, setModalAvailableProfs] = useState<any[]>([]);
  const [modalAvailableRooms, setModalAvailableRooms] = useState<any[]>([]);
  const [isModalLoading, setIsModalLoading] = useState(false);

  const [formData, setFormData] = useState({
    module: '',
    room: '',
    teacher: '',
    type: 'CM',
    customTime: '',
    number_of_sessions: 1,
    startDate: ''
  });

  // 2. Helpers
  const weekDates = days.map((_, index) => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + index);
    return d;
  });

  const getHolidayInfo = (date: Date) => {
    const dateStr = formatDate(date);
    return vacations.find(v => {
      const isDateInRange = dateStr >= v.date_debut && dateStr <= v.date_fin;
      if (!isDateInRange) return false;
      
      const title = (v.titre || '').toLowerCase();
      const type = (v.type_conge || '').toLowerCase();

      // Block if:
      // 1. Explicitly global OR has no specific teacher assigned
      // 2. Type is Public/Academic holiday
      // 3. Title contains academic keywords provided by user
      const isGlobalOrAcademic = v.is_global || !v.enseignant || 
             ['public holiday', 'academic holiday', 'calendrier académique', 'vacances'].some(k => type.includes(k));
      
      const hasKeyword = ['examens', 'ratrappage', 'repos', 'préparation', 'grandes vacances', 'preparation', 'fête', 'aid', 'eid'].some(k => title.includes(k));
      
      return isGlobalOrAcademic || hasKeyword;
    });
  };

  const fetchSlots = () => {
    const start = formatDate(weekDates[0]);
    const end = formatDate(weekDates[5]);

    let url = `http://localhost:8000/api/core/sceance/?start_date=${start}&end_date=${end}`;
    if (filiereId) url += `&filiere=${filiereId}`;
    if (selectedSemester) url += `&semester=${selectedSemester}`;

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

           const filteredPreview = previewSlots.filter(ps => ps.date >= start && ps.date <= end);
           setSlots([...mapped, ...filteredPreview]);
        }
      })
      .catch(err => console.error('Error fetching slots:', err));
  };

  const checkAvailability = (roomId: string, date: string, startTime: string, duree: number) => {
    setIsCheckingAvailability(true);
    let url = `http://localhost:8000/api/core/sceance/check_availability/?local=${roomId}&date=${date}&heure_debut=${startTime}&duree=${duree}`;
    if (editingSessionId) url += `&exclude_id=${editingSessionId}`;
    
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (!data.available) {
          setAvailabilityError(`Attention: Cette salle est déjà occupée par: ${data.conflicts[0].module_name || 'une autre séance'}`);
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

  // 3. Effects
  useEffect(() => {
    setSelectedSemester(semesterParam || '');
  }, [semesterParam]);

  useEffect(() => {
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

        if (filiereId) {
          const currentFiliere = filData.find((f: any) => f.id.toString() === filiereId);
          if (currentFiliere) {
            setSelectedFiliere(currentFiliere);
            const filteredModules = selectedSemester 
              ? currentFiliere.modules.filter((m: any) => m.semestre === selectedSemester)
              : currentFiliere.modules;
            setModules(filteredModules.map((m: any) => ({ id: m.id, nom: m.nom })));

            if (selectedSemester) {
              const period = semData.find((p: any) => p.semester === selectedSemester);
              if (period) {
                const startDate = new Date(period.start);
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
    if (!isModalOpen || !formData.startDate || !formData.customTime) return;

    const fetchAvailable = async () => {
      const [startTime, endTime] = formData.customTime.split(' - ');
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      const duration = (eh * 60 + em) - (sh * 60 + sm);

      setIsModalLoading(true);
      try {
        const isNumericId = editingSessionId && /^\d+$/.test(editingSessionId.toString());
        const url = `http://localhost:8000/api/core/sceance/get_available_resources/?date=${formData.startDate}&heure_debut=${startTime}&duree=${duration}&filiere_id=${filiereId}&semester=${selectedSemester}&module_id=${formData.module}${isNumericId ? `&exclude_id=${editingSessionId}` : ''}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setModalAvailableProfs(data.available_profs);
          setModalAvailableRooms(data.available_rooms);
        }
      } catch (err) {
        console.error("Error fetching available resources:", err);
      } finally {
        setIsModalLoading(false);
      }
    };

    const debounce = setTimeout(fetchAvailable, 300);
    return () => clearTimeout(debounce);
  }, [isModalOpen, formData.startDate, formData.customTime, formData.module, filiereId, editingSessionId]);

  useEffect(() => {
    fetchSlots();
  }, [currentWeekStart, filiereId, selectedSemester]);

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

  // 4. Handlers
  const handleFiliereChange = (id: string) => {
    const newParams = new URLSearchParams(location.search);
    newParams.set('filiereId', id);
    newParams.delete('semester'); 
    navigate(`${location.pathname}?${newParams.toString()}`);
  };

  const handleSemesterChange = (sem: string) => {
    const newParams = new URLSearchParams(location.search);
    newParams.set('semester', sem);
    navigate(`${location.pathname}?${newParams.toString()}`);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    let newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    const yearStart = new Date(2026, 8, 1);
    const yearEnd = new Date(2027, 7, 31);
    if (newDate > yearEnd) newDate = getMonday(yearStart);
    else if (newDate < yearStart) newDate = getMonday(yearEnd);
    setCurrentWeekStart(newDate);
  };

  const [currentTaskId, setCurrentTaskId] = useState<number | null>(null);

  const handleCancelGeneration = async () => {
    if (!currentTaskId) return;
    try {
      const response = await fetch('http://localhost:8000/api/core/generate-schedule/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', task_id: currentTaskId })
      });
      if (response.ok) {
        setIsGenerating(false);
        setCurrentTaskId(null);
      }
    } catch (error) {
      console.error("Cancel error:", error);
    }
  };

  const handleGenerate = async () => {
    if (!selectedSemester) { alert("Veuillez d'abord sélectionner un semestre."); return; }
    setIsGenerating(true); setGenerationProgress(0); setGenerationMessage("Démarrage de l'IA...");
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
        setCurrentTaskId(task_id);
        const pollInterval = setInterval(async () => {
          const statusRes = await fetch(`http://localhost:8000/api/core/task-status/${task_id}/`);
          if (statusRes.ok) {
            const task = await statusRes.json();
            setGenerationProgress(task.progress); setGenerationMessage(task.message);
            if (task.status === 'COMPLETED') {
              clearInterval(pollInterval); setPendingTaskId(task.id); setCurrentTaskId(null);
              const mappedPreview: TimetableSlot[] = (task.result_data || [])
                .filter((s: any) => s.filiere_id.toString() === filiereId && s.semester === selectedSemester)
                .map((s: any) => ({
                  id: `preview-${s.module_id}-${s.slot}`,
                  day: days[new Date(s.date).getDay() - 1] || 'Lundi',
                  date: s.date, startTime: s.heure_debut, endTime: addMinutes(s.heure_debut, 120),
                  module: s.module_name, room: s.room_name, teacher: s.teacher_name, teacher_id: s.teacher_id,
                  type: s.type || 'CM', color: 'bg-sky-500/20 border-sky-500 text-sky-700 italic border-dashed border-2', isPreview: true
                }));
              setPreviewSlots(mappedPreview); setIsGenerating(false);
            } else if (task.status === 'FAILED') {
              clearInterval(pollInterval); setIsGenerating(false); setCurrentTaskId(null); alert(`Erreur: ${task.message}`);
            } else if (task.status === 'CANCELLED') {
              clearInterval(pollInterval); setIsGenerating(false); setCurrentTaskId(null);
            }
          }
        }, 1000);
      } else { alert("Erreur lors de la génération"); setIsGenerating(false); }
    } catch (error) { console.error("Generation error:", error); setIsGenerating(false); }
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
        alert("Enregistré !"); setPendingTaskId(null); setPreviewSlots([]); fetchSlots();
      }
    } catch (error) { console.error("Save error:", error); } finally { setIsSaving(false); }
  };

  const handleSlotClick = (slot: TimetableSlot) => {
    // 1. Check if the slot date is a holiday
    const holiday = getHolidayInfo(new Date(slot.date));
    if (holiday) {
      alert(`Impossible de modifier : ce jour est férié/en vacances (${holiday.titre || holiday.type_conge}).`);
      return;
    }

    const moduleId = modules.find(m => m.nom === slot.module)?.id || '';
    const roomId = locaux.find(l => l.name === slot.room)?.id || '';
    const teacher = teachers.find(t => `${t.prenom} ${t.nom}` === slot.teacher || `Pr. ${t.nom} ${t.prenom}` === slot.teacher)?.id || '';
    setEditingSessionId(slot.id);
    setTimeFilter(timeToMinutes(slot.startTime) < 780 ? 'Morning' : 'Afternoon');
    setSelectedCell({ day: slot.day, time: slot.startTime, endTime: slot.endTime, date: slot.date });
    setFormData({ module: moduleId.toString(), room: roomId.toString(), teacher: teacher.toString(), type: slot.type, customTime: `${slot.startTime} - ${slot.endTime}`, number_of_sessions: 1, startDate: slot.date });
    setAvailabilityError(null); setIsModalOpen(true);
  };

  const handleCellClick = (day: string, config: TimeConfig, date: string) => {
    // 1. Check if the date is a holiday
    const holiday = getHolidayInfo(new Date(date));
    if (holiday) {
      alert(`Impossible d'ajouter une séance : ce jour est férié/en vacances (${holiday.titre || holiday.type_conge}).`);
      return;
    }

    setEditingSessionId(null);
    setTimeFilter(timeToMinutes(config.start) < 780 ? 'Morning' : 'Afternoon');
    setSelectedCell({ day, time: config.start, endTime: config.end, date });
    
    // Auto-select first available module and room if they exist
    setFormData({ 
      module: modules.length > 0 ? modules[0].id.toString() : '', 
      room: locaux.length > 0 ? locaux[0].id.toString() : '', 
      teacher: '', 
      type: 'CM', 
      customTime: `${config.start} - ${config.end}`, 
      number_of_sessions: 1, 
      startDate: date 
    });
    setAvailabilityError(null); 
    setIsModalOpen(true); 
    setShowCalendar(false);
  };

  const handleValidate = () => {
    if (!selectedCell || !formData.module || !formData.room || availabilityError) return;
    const [startTime] = formData.customTime.split(' - ');
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = formData.customTime.split(' - ')[1].split(':').map(Number);
    const payload = { type: formData.type, duree: (eh * 60 + em) - (sh * 60 + sm), date: formData.startDate, heure_debut: startTime, module: formData.module, enseignant: formData.teacher || null, local: formData.room, number_of_sessions: formData.number_of_sessions };
    const method = editingSessionId ? 'PUT' : 'POST';
    const url = editingSessionId ? `http://localhost:8000/api/core/sceance/${editingSessionId}/?filiere=${filiereId}` : `http://localhost:8000/api/core/sceance/?filiere=${filiereId}`;
    fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    .then(res => { if (res.ok) { fetchSlots(); setIsModalOpen(false); } else { alert("Erreur lors de l'enregistrement"); } });
  };

  const getTimeOptions = () => timeFilter === 'Morning' ? ['08:30 - 10:30', '10:45 - 12:45', '08:30 - 12:45'] : ['14:30 - 16:30', '16:45 - 18:45', '14:30 - 18:45'];

  const handleExportPDF = () => {
    if (!filiereId || !selectedSemester) {
      alert("Veuillez sélectionner une filière et un semestre.");
      return;
    }
    const url = `http://localhost:8000/api/core/filiere/export-pdf-timetable/?filiere=${filiereId}&semester=${selectedSemester}`;
    window.open(url, '_blank');
  };

  const handleStartImport = async () => {
    if (!selectedFile || !uploadFiliereId || !uploadSemester) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('filiere_id', uploadFiliereId);
    formData.append('semester', uploadSemester);

    try {
      const response = await fetch('http://localhost:8000/api/core/timetable/extract/', {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        const data = await response.json();
        setExtractedSessions(data.sessions);
        setReviewMetadata({
          all_profs: data.all_profs,
          all_rooms: data.all_rooms,
          available_modules: data.available_modules
        });
        setUploadStep('review');
      } else {
        alert("Erreur lors de l'extraction");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Impossible de contacter le serveur.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveExtracted = async () => {
    // For each session, we find the first valid date in the semester period and create 12 sessions
    const period = semesterPeriods.find(p => p.semester === uploadSemester);
    if (!period) {
      alert("Période du semestre non trouvée. Veuillez d'abord configurer les dates du semestre.");
      return;
    }

    setIsUploading(true);
    const daysMap: {[key: string]: number} = {'Lundi': 1, 'Mardi': 2, 'Mercredi': 3, 'Jeudi': 4, 'Vendredi': 5, 'Samedi': 6};
    
    try {
      let firstSession = true;
      for (const session of extractedSessions) {
        if (!session.module_id || !session.room_id) continue;

        // Find the first occurrence of the day in the period
        let startDate = new Date(period.start);
        const targetDay = daysMap[session.day];
        while (startDate.getDay() !== targetDay) {
          startDate.setDate(startDate.getDate() + 1);
        }

        const payload = {
          type: session.type,
          duree: session.duration,
          date: formatDate(startDate),
          heure_debut: session.time,
          module: session.module_id,
          enseignant: session.teacher_id,
          local: session.room_id,
          number_of_sessions: 12,
          replace_existing: firstSession, // Only delete on the very first API call
          filiere: uploadFiliereId,
          semester: uploadSemester
        };

        const response = await fetch('http://localhost:8000/api/core/sceance/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          console.error("Failed to save session:", session);
        }
        firstSession = false; // Disable for subsequent sessions
      }
      alert("Emploi du temps importé avec succès !");
      setIsUploadModalOpen(false);
      setUploadStep('upload');
      setSelectedFile(null);
      fetchSlots();
    } catch (error) {
      console.error("Save extracted error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-full relative animate-in fade-in duration-500">
      <header className="flex justify-between items-center h-20 px-gutter bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-lg">
        <div className="flex items-center gap-md">
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
             <span className="material-symbols-outlined text-sky-400">calendar_view_week</span>
             GESTION DES EMPLOIS
          </h1>
          <div className="hidden lg:flex items-center gap-4 ml-8 bg-slate-800/50 px-4 py-1.5 rounded-full border border-slate-700">
            <div className="flex items-center gap-2">
              <span className="text-sky-400 font-bold text-xs uppercase">{selectedFiliere?.nom || 'SÉLECTIONNER UNE FILIÈRE'}</span>
              <div className="relative group/filiere">
                <button className="text-slate-400 hover:text-white transition-colors flex items-center"><span className="material-symbols-outlined text-sm">arrow_drop_down</span></button>
                <div className="absolute left-0 top-full mt-2 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 py-2 opacity-0 invisible group-hover/filiere:opacity-100 group-hover/filiere:visible transition-all duration-200">
                  {filieres.map((f) => (<button key={f.id} onClick={() => handleFiliereChange(f.id.toString())} className={`w-full text-left px-4 py-2 text-xs transition-colors ${filiereId === f.id.toString() ? 'text-sky-400 bg-slate-700/50 font-bold' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}>{f.nom}</button>))}
                </div>
              </div>
            </div>
            <div className="w-1 h-1 rounded-full bg-slate-600"></div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium text-xs uppercase">{selectedSemester ? `Semestre ${selectedSemester}` : 'CHOISIR SEMESTRE'}</span>
              <div className="relative group/semester">
                <button className="text-slate-400 hover:text-white transition-colors flex items-center"><span className="material-symbols-outlined text-sm">arrow_drop_down</span></button>
                <div className="absolute left-0 top-full mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 py-2 opacity-0 invisible group-hover/semester:opacity-100 group-hover/semester:visible transition-all duration-200">
                  {selectedFiliere && (selectedFiliere.niveaux.startsWith('Master') ? ['M1', 'M2', 'M3', 'M4'] : ['S1', 'S2', 'S3', 'S4', 'S5', 'S6']).map((sem) => (<button key={sem} onClick={() => handleSemesterChange(sem)} className={`w-full text-left px-4 py-2 text-xs transition-colors ${selectedSemester === sem ? 'text-sky-400 bg-slate-700/50 font-bold' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}>{sem}</button>))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-md">
          <button onClick={() => setIsUploadModalOpen(true)} className="bg-slate-800 text-emerald-400 border border-slate-700 px-6 py-2 rounded-lg font-bold hover:bg-slate-700 transition-all uppercase text-[10px] tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">upload_file</span>
            Importer Emploi
          </button>
          <button onClick={handleExportPDF} className="bg-slate-800 text-rose-400 border border-slate-700 px-6 py-2 rounded-lg font-bold hover:bg-slate-700 transition-all uppercase text-[10px] tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
            Exporter PDF
          </button>
          <button onClick={() => setIsListView(!isListView)} className={`px-6 py-2 rounded-lg font-bold transition-all uppercase text-[10px] tracking-widest flex items-center gap-2 border ${isListView ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-lowest text-primary border-outline-variant hover:bg-primary/5'}`}>
            <span className="material-symbols-outlined text-sm">{isListView ? 'grid_view' : 'list_alt'}</span>
            {isListView ? 'Vue Grille' : 'Vue Programme'}
          </button>
          <button onClick={handleGenerate} disabled={isGenerating} className={`bg-slate-800 text-sky-400 border border-slate-700 px-6 py-2 rounded-lg font-bold hover:bg-slate-700 transition-all uppercase text-[10px] tracking-widest flex items-center gap-2 ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <span className="material-symbols-outlined text-sm">{isGenerating ? 'sync' : 'psychology'}</span>
            {isGenerating ? 'Génération...' : 'IA Optimisation'}
          </button>
        </div>
      </header>

      {/* Progress Modal */}
      {isGenerating && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-12 border border-slate-200 animate-in zoom-in duration-300">
            <div className="flex flex-col items-center text-center gap-6">
              <div className="w-16 h-16 rounded-full bg-sky-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-sky-500 text-4xl animate-spin">psychology</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Optimisation IA en cours</h3>
                <p className="text-slate-500 text-sm font-medium">{generationMessage}</p>
              </div>
              
              {/* Progress Bar */}
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
              
              <p className="text-[10px] text-slate-400 italic">Veuillez ne pas fermer cette fenêtre. L'IA résout les conflits...</p>

              <button 
                onClick={handleCancelGeneration}
                className="mt-4 px-6 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">close</span>
                Annuler la génération
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border-b border-outline-variant px-gutter py-4 flex items-center justify-between shadow-sm relative">
        <div className="flex items-center gap-4">
          <button onClick={() => navigateWeek('prev')} className="w-10 h-10 rounded-full hover:bg-surface-container transition-colors flex items-center justify-center border border-outline-variant text-primary"><span className="material-symbols-outlined">chevron_left</span></button>
          <div className="flex flex-col">
            <h2 className="font-h3 text-lg font-bold text-on-surface leading-none">Semaine du {weekDates[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</h2>
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
                    const dateStr = formatDate(localDate);
                    const activeSem = semesterPeriods.find(p => dateStr >= p.start && dateStr <= p.end);
                    if (activeSem && activeSem.semester !== selectedSemester) handleSemesterChange(activeSem.semester);
                    setShowNavCalendar(false);
                  }} onClose={() => setShowNavCalendar(false)} allowHolidayClick={false} />
              </div>
            )}
          </div>
        </div>
        <button onClick={() => setCurrentWeekStart(getMonday(new Date()))} className="px-4 py-2 text-xs font-bold text-primary hover:bg-primary/5 rounded-lg transition-colors border border-primary/20">Aujourd'hui</button>
      </div>

      <section className="flex-1 p-gutter overflow-y-auto pb-24 bg-background">
        {isListView ? (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead><tr className="bg-surface-container border-b border-outline-variant">
                <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-outline">Date / Jour</th>
                <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-outline">Heure</th>
                <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-outline">Module</th>
                <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-outline">Type</th>
                <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-outline">Salle</th>
                <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-outline">Enseignant</th>
              </tr></thead>
              <tbody className="divide-y divide-outline-variant">
                {slots.sort((a,b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)).map(slot => (
                  <tr key={slot.id} className="hover:bg-surface-container-low transition-colors bg-white">
                    <td className="px-6 py-4"><div>{slot.day}</div><div className="text-[11px] text-outline">{slot.date}</div></td>
                    <td className="px-6 py-4 font-black text-primary text-sm">{slot.startTime} - {slot.endTime}</td>
                    <td className="px-6 py-4 font-bold">{slot.module}</td>
                    <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${slot.type === 'CM' ? 'bg-primary-fixed text-on-primary-fixed' : slot.type === 'TD' ? 'bg-secondary-fixed text-on-secondary-fixed' : 'bg-tertiary-fixed text-on-tertiary-fixed'}`}>{slot.type}</span></td>
                    <td className="px-6 py-4">{slot.room}</td>
                    <td className="px-6 py-4"><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black">{slot.teacher?.split(' ').map(n=>n[0]).join('') || '?'}</div><span className="text-sm font-bold">{slot.teacher || 'Non assigné'}</span></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-xl overflow-hidden">
            <div className="overflow-x-auto"><div className="min-w-[1200px] grid grid-cols-[120px_1fr_40px_1fr_60px_1fr_40px_1fr] grid-rows-[auto_repeat(6,100px)] border-collapse bg-white">
              <div className="h-16 border-b border-r border-outline-variant bg-surface-container flex items-center justify-center font-label-caps text-[10px] font-black">JOUR / HEURE</div>
              {timeConfig.map((config, i) => (
                <div key={i} className={`border-b border-r border-outline-variant ${config.isBreak ? 'bg-surface-container-low/50 italic' : 'bg-surface-container'} flex flex-col items-center justify-center py-2`}>
                  <span className={`font-black uppercase tracking-tighter ${config.isBreak ? 'text-[10px] text-outline-variant' : 'text-primary text-sm'}`}>{config.label}</span>
                  {!config.isBreak && <span className="text-[10px] text-outline font-bold opacity-60">{config.end}</span>}
                </div>
              ))}
              {days.map((day, dayIndex) => {
                const dayDate = weekDates[dayIndex]; const dateStr = formatDate(dayDate); const holiday = getHolidayInfo(dayDate);
                return (<React.Fragment key={day}>
                  <div className={`border-b border-r border-outline-variant flex flex-col items-center justify-center gap-1 ${holiday ? 'bg-error-container/20' : 'bg-surface-container'}`}>
                    <span className="font-black uppercase text-[12px]">{day}</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${dateStr === formatDate(new Date()) ? 'bg-primary text-on-primary' : holiday ? 'bg-error text-white' : 'text-outline border border-outline-variant bg-white'}`}>{dayDate.getDate()} {dayDate.toLocaleDateString('fr-FR', { month: 'short' })}</span>
                  </div>
                  {timeConfig.map((config, i) => {
                    const slot = slots.find(s => s.date === dateStr && timeToMinutes(s.startTime) < timeToMinutes(config.end) && timeToMinutes(config.start) < timeToMinutes(s.endTime));
                    
                    if (holiday && !config.isBreak) return (
                      <div key={i} className="border-b border-r border-outline-variant bg-rose-600 flex flex-col items-center justify-center p-2 relative overflow-hidden group shadow-[inset_0_0_20px_rgba(0,0,0,0.2)]">
                        <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,#fff,#fff_10px,transparent_10px,transparent_20px)]"></div>
                        <span className="material-symbols-outlined text-white text-2xl mb-1 drop-shadow-md">block</span>
                        <div className="text-center relative z-10">
                          <span className="block text-[9px] font-black text-white uppercase tracking-tighter leading-tight drop-shadow-sm">
                            {holiday.titre || holiday.type_conge || 'JOUR FÉRIÉ'}
                          </span>
                          <span className="block text-[8px] font-bold text-white/80 uppercase tracking-widest mt-0.5">
                            Interdit
                          </span>
                        </div>
                      </div>
                    );

                    if (config.isBreak) return <div key={i} className="border-b border-r border-outline-variant opacity-30 bg-[repeating-linear-gradient(45deg,#f1f5f9,#f1f5f9_10px,#ffffff_10px,#ffffff_20px)] shadow-inner" />;
                    
                    return (<div key={i} onClick={() => slot ? handleSlotClick(slot) : handleCellClick(day, config, dateStr)} className={`border-b border-r border-outline-variant transition-all ${slot ? 'p-2' : 'hover:bg-primary/5 cursor-pointer bg-white group'}`}>
                      {slot ? (<div className={`h-full border-l-4 p-2 flex flex-col justify-between rounded-lg shadow-md transition-all ${slot.color}`}>
                        <span className="text-[10px] font-black uppercase truncate leading-tight">{slot.type} : {slot.module}</span>
                        <div className="flex flex-col">
                          {slot.teacher && <span className="text-[9px] font-black text-sky-700/80 mb-1 flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">person</span>{slot.teacher}</span>}
                          <span className="text-[9px] font-bold opacity-80 flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">location_on</span>{slot.room}</span>
                        </div></div>) : (<div className="w-full h-full opacity-0 group-hover:opacity-100 flex items-center justify-center"><span className="material-symbols-outlined text-primary/40 text-2xl">add_circle</span></div>)}
                    </div>);
                  })}
                </React.Fragment>);
              })}
            </div></div>
          </div>
        )}
      </section>

      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className={`bg-white w-full ${uploadStep === 'review' ? 'max-w-6xl' : 'max-w-xl'} rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transition-all duration-300`}>
            <div className="bg-slate-900 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <div className="p-2 bg-emerald-500/20 rounded-lg"><span className="material-symbols-outlined text-emerald-400">{uploadStep === 'review' ? 'visibility' : 'upload_file'}</span></div>
                <h3 className="text-lg font-black uppercase tracking-tight">{uploadStep === 'review' ? 'Vérification de l\'importation' : 'Importer un emploi du temps'}</h3>
              </div>
              <button onClick={() => { setIsUploadModalOpen(false); setUploadStep('upload'); setSelectedFile(null); }} className="text-slate-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              {uploadStep === 'upload' ? (
                <>
                  {/* Season Selection */}
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Saison</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => { setUploadSeason('Automne'); setUploadSemester(''); }}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${uploadSeason === 'Automne' ? 'border-sky-500 bg-sky-50' : 'border-slate-100 hover:border-slate-200'}`}
                      >
                        <div className="font-black text-sm uppercase tracking-tight mb-1">Automne</div>
                        <div className="text-[10px] text-slate-500 font-medium">Semestres Impairs</div>
                      </button>
                      <button 
                        onClick={() => { setUploadSeason('Printemps'); setUploadSemester(''); }}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${uploadSeason === 'Printemps' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 hover:border-slate-200'}`}
                      >
                        <div className="font-black text-sm uppercase tracking-tight mb-1">Printemps</div>
                        <div className="text-[10px] text-slate-500 font-medium">Semestres Pairs</div>
                      </button>
                    </div>
                  </div>

                  {/* Filière Selection */}
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Filière</label>
                    <select 
                      value={uploadFiliereId}
                      onChange={(e) => { setUploadFiliereId(e.target.value); setUploadSemester(''); }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                    >
                      <option value="">Sélectionner une filière...</option>
                      {filieres.map(f => (
                        <option key={f.id} value={f.id}>{f.nom}</option>
                      ))}
                    </select>
                  </div>

                  {/* Semester Selection */}
                  {uploadFiliereId && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Semestre</label>
                      <select 
                        value={uploadSemester}
                        onChange={(e) => setUploadSemester(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                      >
                        <option value="">Sélectionner un semestre...</option>
                        {(() => {
                          const filiere = filieres.find(f => f.id.toString() === uploadFiliereId);
                          const isMaster = filiere?.niveaux?.startsWith('Master');
                          
                          if (uploadSeason === 'Automne') {
                            return isMaster ? ['M1', 'M3'] : ['S1', 'S3', 'S5'];
                          } else {
                            return isMaster ? ['M2', 'M4'] : ['S2', 'S4', 'S6'];
                          }
                        })().map(sem => (
                          <option key={sem} value={sem}>{sem}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* File Upload Area */}
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Fichier de l'emploi</label>
                    <div 
                      className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer ${selectedFile ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200 hover:border-sky-400 hover:bg-sky-50/30'}`}
                      onClick={() => document.getElementById('fileInput')?.click()}
                    >
                      <input 
                        type="file" 
                        id="fileInput" 
                        className="hidden" 
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      />
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedFile ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                        <span className="material-symbols-outlined text-3xl">{selectedFile ? 'check_circle' : 'cloud_upload'}</span>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-slate-900">{selectedFile ? selectedFile.name : 'Cliquez pour uploader'}</div>
                        <p className="text-[10px] text-slate-500 font-medium mt-1">PDF, PNG ou JPG supportés</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-6 border-t border-slate-100 flex gap-4">
                    <button 
                      onClick={() => { setIsUploadModalOpen(false); setSelectedFile(null); }}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors"
                    >
                      Annuler
                    </button>
                    <button 
                      onClick={handleStartImport}
                      disabled={!selectedFile || !uploadFiliereId || !uploadSemester || isUploading}
                      className={`flex-1 bg-slate-900 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg ${(!selectedFile || !uploadFiliereId || !uploadSemester || isUploading) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-800'}`}
                    >
                      {isUploading ? 'Analyse en cours...' : 'Lancer l\'importation'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="max-h-[500px] overflow-y-auto border border-slate-100 rounded-xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                          <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-slate-400">Jour / Heure</th>
                          <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-slate-400">Module</th>
                          <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-slate-400">Enseignant</th>
                          <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-slate-400">Salle</th>
                          <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-slate-400">Type</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {extractedSessions.map((session, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-4">
                              <div className="font-bold text-xs">{session.day}</div>
                              <div className="text-primary font-black text-[10px]">{session.time}</div>
                            </td>
                            <td className="px-4 py-4">
                              <select 
                                value={session.module_id || ''}
                                onChange={(e) => {
                                  const newSessions = [...extractedSessions];
                                  newSessions[idx].module_id = e.target.value;
                                  setExtractedSessions(newSessions);
                                }}
                                className={`w-full bg-white border ${!session.module_id ? 'border-rose-300 bg-rose-50' : 'border-slate-200'} rounded-lg px-2 py-1.5 text-xs font-bold`}
                              >
                                <option value="">Choisir...</option>
                                {reviewMetadata.available_modules.map(m => (<option key={m.id} value={m.id}>{m.name}</option>))}
                              </select>
                            </td>
                            <td className="px-4 py-4">
                              <select 
                                value={session.teacher_id || ''}
                                onChange={(e) => {
                                  const newSessions = [...extractedSessions];
                                  newSessions[idx].teacher_id = e.target.value;
                                  setExtractedSessions(newSessions);
                                }}
                                className={`w-full bg-white border ${!session.teacher_id ? 'border-rose-300 bg-rose-50' : 'border-slate-200'} rounded-lg px-2 py-1.5 text-xs font-bold`}
                              >
                                <option value="">Choisir un enseignant disponible...</option>
                                {session.available_profs?.map((p: any) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                              </select>
                            </td>
                            <td className="px-4 py-4">
                              <select 
                                value={session.room_id || ''}
                                onChange={(e) => {
                                  const newSessions = [...extractedSessions];
                                  newSessions[idx].room_id = e.target.value;
                                  setExtractedSessions(newSessions);
                                }}
                                className={`w-full bg-white border ${!session.room_id ? 'border-rose-300 bg-rose-50' : 'border-slate-200'} rounded-lg px-2 py-1.5 text-xs font-bold`}
                              >
                                <option value="">Choisir une salle disponible...</option>
                                {session.available_rooms?.map((r: any) => (<option key={r.id} value={r.id}>{r.name}</option>))}
                              </select>
                            </td>
                            <td className="px-4 py-4">
                              <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-black uppercase">{session.type}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="pt-6 border-t border-slate-100 flex gap-4">
                    <button 
                      onClick={() => setUploadStep('upload')}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors"
                    >
                      Retour
                    </button>
                    <button 
                      onClick={handleSaveExtracted}
                      disabled={isUploading || extractedSessions.some(s => !s.module_id || !s.room_id)}
                      className={`flex-1 bg-emerald-600 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-emerald-700'}`}
                    >
                      {isUploading ? 'Enregistrement...' : 'Confirmer l\'importation'}
                    </button>
                  </div>
                  <p className="text-center text-[10px] text-slate-400 italic">L'importation créera 12 séances hebdomadaires pour chaque ligne validée.</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {isModalOpen && selectedCell && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-start justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest w-full max-w-2xl rounded-2xl shadow-2xl border border-outline-variant overflow-hidden my-8">
            <div className="bg-slate-900 p-6 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3 text-white">
                <div className="p-2 bg-sky-500/20 rounded-lg"><span className="material-symbols-outlined text-sky-400">add_task</span></div>
                <div><h3 className="text-lg font-black uppercase tracking-tight">{editingSessionId ? 'Modifier' : 'Assigner'}</h3></div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="p-8 space-y-6">
               <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">Période</label>
                    <div className="flex gap-2">{(['Morning', 'Afternoon'] as const).map(p => (<button key={p} onClick={() => setTimeFilter(p)} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${timeFilter === p ? 'bg-sky-500 text-white' : 'bg-white border text-on-surface-variant'}`}>{p === 'Morning' ? 'Matin' : 'Après-midi'}</button>))}</div>
                 </div>
                 <div className="text-right"><label className="block text-[10px] font-black uppercase tracking-widest opacity-60">Jour</label><div className="font-black text-primary text-sm uppercase">{selectedCell.day}</div></div>
               </div>
               <div className="space-y-2"><label className="block text-[10px] font-black uppercase tracking-widest opacity-60">Horaire</label><div className="grid grid-cols-3 gap-3">{getTimeOptions().map(option => (<button key={option} onClick={() => setFormData({...formData, customTime: option})} className={`p-3 rounded-xl border-2 transition-all ${formData.customTime === option ? 'border-primary bg-primary/5' : 'border-outline-variant'}`}><span className="text-[11px] font-bold">{option}</span></button>))}</div></div>
               
               <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">Date d'Exécution</label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-surface-container-low px-4 py-3 rounded-xl border border-outline-variant font-black text-primary text-sm flex items-center">
                    {formData.startDate}
                  </div>
                  <button 
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="bg-slate-900 text-white w-12 rounded-xl flex items-center justify-center hover:bg-slate-800 transition-all"
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
                    <label className="block text-[10px] font-black uppercase tracking-widest opacity-60">Module</label>
                    <select 
                      value={formData.module} 
                      onChange={(e) => setFormData({...formData, module: e.target.value})} 
                      className="w-full bg-white border border-outline-variant rounded-xl px-4 py-3 text-sm font-bold"
                    >
                      {modules.length === 0 && <option value="">Choisir un module...</option>}
                      {modules.map(m => (<option key={m.id} value={m.id}>{m.nom}</option>))}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest opacity-60">Salle</label>
                    <select
                      value={formData.room}
                      onChange={(e) => setFormData({...formData, room: e.target.value})}
                      className="w-full bg-white border border-outline-variant rounded-xl px-4 py-3 text-sm font-bold"
                    >
                      <option value="">{isModalLoading ? 'Chargement des salles...' : 'Choisir une salle...'}</option>
                      {/* Merge current room into available rooms list if not present */}
                      {(() => {
                        const currentRoom = locaux.find(l => l.id.toString() === formData.room);
                        const list = [...modalAvailableRooms];
                        if (currentRoom && !list.find(r => r.id === currentRoom.id)) {
                          list.push({ id: currentRoom.id, name: currentRoom.name });
                        }
                        return list.map(r => (<option key={r.id} value={r.id}>{r.name}</option>));
                      })()}
                    </select>
                    </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest opacity-60">Enseignant</label>
                    <select
                      value={formData.teacher}
                      onChange={(e) => setFormData({...formData, teacher: e.target.value})}
                      className="w-full bg-white border border-outline-variant rounded-xl px-4 py-3 text-sm font-bold"
                    >
                      <option value="">{isModalLoading ? 'Chargement des enseignants...' : 'Non assigné'}</option>
                      {/* Categorized and sorted teacher list */}
                      {(() => {
                        const currentProf = teachers.find(t => t.id.toString() === formData.teacher);
                        const list = [...modalAvailableProfs];
                        if (currentProf && !list.find(p => p.id === currentProf.id)) {
                          list.push({ id: currentProf.id, name: `${currentProf.prenom} ${currentProf.nom}`, violates_rule: false });
                        }
                        
                        const recommended = list.filter(p => !p.violates_rule);
                        const others = list.filter(p => p.violates_rule);
                        
                        return (
                          <>
                            {recommended.length > 0 && (
                              <optgroup label="Recommandés (Libre + Nouveau module)">
                                {recommended.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                              </optgroup>
                            )}
                            {others.length > 0 && (
                              <optgroup label="Déjà assigné à un autre module dans cette filière">
                                {others.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                              </optgroup>
                            )}
                          </>
                        );
                      })()}
                    </select>
                    </div>
                 <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest opacity-60">Type</label>
                    <select 
                      value={formData.type} 
                      onChange={(e) => setFormData({...formData, type: e.target.value})} 
                      className="w-full bg-white border border-outline-variant rounded-xl px-4 py-3 text-sm font-bold"
                    >
                      <option value="CM">Cours Magistral (CM)</option>
                      <option value="TD">Travaux Dirigés (TD)</option>
                      <option value="TP">Travaux Pratiques (TP)</option>
                    </select>
                 </div>
               </div>
               <div className="pt-6 border-t border-outline-variant flex justify-between gap-4"><button onClick={() => setIsModalOpen(false)} className="flex-1 bg-surface-container-high py-3 rounded-xl font-black text-[10px] uppercase">Annuler</button><button onClick={handleValidate} className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-black uppercase text-[10px]">Valider</button></div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Save Bar */}
      {pendingTaskId && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl p-6 flex items-center gap-8 animate-in slide-in-from-bottom-10 duration-500 max-w-2xl w-full mx-4">
          <div className="flex-1">
            <h4 className="text-white font-black text-sm uppercase tracking-tight">Emploi du temps prêt !</h4>
            <p className="text-slate-400 text-[11px] font-medium mt-1">L'IA a optimisé le planning. Cliquez sur enregistrer pour l'appliquer définitivement.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => { setPendingTaskId(null); setPreviewSlots([]); }}
              className="px-6 py-2.5 rounded-xl text-slate-400 font-bold text-xs hover:bg-slate-800 transition-colors uppercase tracking-widest"
            >
              Annuler
            </button>
            <button 
              onClick={handleConfirmSave}
              disabled={isSaving}
              className={`bg-sky-500 text-white px-8 py-2.5 rounded-xl font-black text-xs hover:bg-sky-400 transition-all uppercase tracking-widest shadow-lg flex items-center gap-2 ${isSaving ? 'opacity-50' : ''}`}
            >
              <span className="material-symbols-outlined text-sm">{isSaving ? 'sync' : 'save_as'}</span>
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timetable;
