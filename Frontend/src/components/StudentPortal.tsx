import React, { useState, useEffect } from 'react';

interface RequestItem {
  id: number;
  type: string;
  date: string;
  status: string;
  details: string;
  studentName?: string;
  studentEmail?: string;
  filiere?: number | null;
}

const StudentPortal: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [todaySessions, setTodaySessions] = useState<any[]>([]);
  const [vacations, setVacations] = useState<any[]>([]);
  const [semesterProgress, setSemesterProgress] = useState(65);
  const [filiereName, setFiliereName] = useState('Master');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  
  // Form fields
  const [certType, setCertType] = useState('Certificat de scolarité');
  const [absenceDate, setAbsenceDate] = useState(new Date().toISOString().split('T')[0]);
  const [absenceReason, setAbsenceReason] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  // Persistent user requests stored in localStorage
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [filiereModules, setFiliereModules] = useState<any[]>([]);
  const [isGradesModalOpen, setIsGradesModalOpen] = useState(false);

  useEffect(() => {
    // Load local storage requests
    const savedRequests = JSON.parse(localStorage.getItem('student_requests') || '[]');
    if (savedRequests.length === 0) {
      const initial = [
        { id: 1, type: 'Certificat', date: '2026-07-01', status: 'Délivré', details: 'Certificat de scolarité' },
        { id: 2, type: 'Absence', date: '2026-07-05', status: 'En attente', details: 'Raison médicale' }
      ];
      localStorage.setItem('student_requests', JSON.stringify(initial));
      setRequests(initial);
    } else {
      setRequests(savedRequests);
    }

    const fetchData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

        // 1. Fetch Profile
        const profileRes = await fetch('http://localhost:8000/api/users/profile/', { headers });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData);
          if (profileData.filiere_name) {
            setFiliereName(profileData.filiere_name);
          }

          // 2. Fetch Today's Sessions for student filiere
          const todayStr = new Date().toISOString().split('T')[0];
          let url = `http://localhost:8000/api/core/sceance/?start_date=${todayStr}&end_date=${todayStr}`;
          if (profileData.filiere) {
            url += `&filiere=${profileData.filiere}`;
          }
          const sessionsRes = await fetch(url, { headers });
          if (sessionsRes.ok) {
            const sessionsData = await sessionsRes.json();
            if (Array.isArray(sessionsData)) {
              setTodaySessions(sessionsData);
            }
          }

          // Fetch filiere modules to map student evaluations
          if (profileData.filiere) {
            const filRes = await fetch('http://localhost:8000/api/core/filiere/details/', { headers });
            if (filRes.ok) {
              const filData = await filRes.json();
              const studentFil = filData.find((f: any) => f.id === profileData.filiere);
              if (studentFil) {
                setFiliereModules(studentFil.modules || []);
              }
            }
          }
        }

        // 3. Fetch vacations / academic calendar
        const vacRes = await fetch('http://localhost:8000/api/core/vacations/', { headers });
        if (vacRes.ok) {
          const vacData = await vacRes.json();
          const todayStr = new Date().toISOString().split('T')[0];
          // Filter to include only ongoing or future vacations, and sort by date_debut ascending
          const sortedUpcoming = (vacData || [])
            .filter((v: any) => v.date_fin >= todayStr)
            .sort((a: any, b: any) => a.date_debut.localeCompare(b.date_debut));
          setVacations(sortedUpcoming);
        }

        // 4. Calculate semester progress dynamically based on SemesterPeriod dates
        const semPeriodsRes = await fetch('http://localhost:8000/api/core/generate-schedule/?check_dates=all', { headers });
        if (semPeriodsRes.ok) {
          const semPeriods = await semPeriodsRes.json();
          if (Array.isArray(semPeriods) && semPeriods.length > 0) {
            const now = new Date();
            const start = new Date(semPeriods[0].date_debut);
            const end = new Date(semPeriods[0].date_fin);
            if (now >= start && now <= end) {
              const totalDays = (end.getTime() - start.getTime()) / (1000 * 3600 * 24);
              const elapsedDays = (now.getTime() - start.getTime()) / (1000 * 3600 * 24);
              setSemesterProgress(Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100))));
            }
          }
        }

      } catch (error) {
        console.error('Error fetching student dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const saveRequests = (newRequests: RequestItem[]) => {
    setRequests(newRequests);
    localStorage.setItem('student_requests', JSON.stringify(newRequests));
  };

  const handleCreateCertificate = (e: React.FormEvent) => {
    e.preventDefault();
    const newReq: RequestItem = {
      id: Date.now(),
      type: 'Certificat',
      date: new Date().toISOString().split('T')[0],
      status: 'En cours',
      details: certType,
      studentName: profile ? `${profile.prenom} ${profile.nom}` : 'Jean Dupont',
      studentEmail: profile?.email || '',
      filiere: profile?.filiere || null
    };
    saveRequests([newReq, ...requests]);
    setIsRequestModalOpen(false);
    alert('Votre demande de certificat a été enregistrée avec succès.');
  };

  const handleReportAbsence = (e: React.FormEvent) => {
    e.preventDefault();
    const newReq: RequestItem = {
      id: Date.now(),
      type: 'Absence',
      date: absenceDate,
      status: 'En attente',
      details: `Absence: ${absenceReason}`,
      studentName: profile ? `${profile.prenom} ${profile.nom}` : 'Jean Dupont',
      studentEmail: profile?.email || '',
      filiere: profile?.filiere || null
    };
    saveRequests([newReq, ...requests]);
    setIsAbsenceModalOpen(false);
    alert('Votre déclaration d\'absence a été soumise au secrétariat.');
  };

  const handleContactAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    const newReq: RequestItem = {
      id: Date.now(),
      type: 'Message Admin',
      date: new Date().toISOString().split('T')[0],
      status: 'Envoyé',
      details: `Sujet: ${contactSubject}`,
      studentName: profile ? `${profile.prenom} ${profile.nom}` : 'Jean Dupont',
      studentEmail: profile?.email || '',
      filiere: profile?.filiere || null
    };
    saveRequests([newReq, ...requests]);
    setIsContactModalOpen(false);
    alert('Votre message a été transmis à l\'administration.');
    setContactSubject('');
    setContactMessage('');
  };

  const calculateStudentGPA = () => {
    if (!profile || filiereModules.length === 0) return { average: 'N/A', count: 0 };

    const savedEvals = JSON.parse(localStorage.getItem('student_evaluations') || '{}');
    let totalGrade = 0;
    let evalCount = 0;

    for (const m of filiereModules) {
      const evalKey = `eval_${m.id}_${profile.id}`;
      const ev = savedEvals[evalKey];
      if (ev && ev.note && !isNaN(parseFloat(ev.note))) {
        totalGrade += parseFloat(ev.note);
        evalCount += 1;
      }
    }

    if (evalCount === 0) {
      return { average: 'N/A', count: 0 };
    }

    return {
      average: (totalGrade / evalCount).toFixed(2),
      count: evalCount
    };
  };

  const gpaInfo = calculateStudentGPA();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="material-symbols-outlined text-4xl text-primary animate-spin">sync</span>
      </div>
    );
  }

  return (
    <div className="text-on-surface max-w-[1400px] mx-auto p-gutter lg:p-lg space-y-lg">
      
      {/* Welcome Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-md">
        <div>
          <p className="font-label-caps text-label-caps text-primary opacity-70 mb-xs uppercase">Espace Étudiant</p>
          <h1 className="font-h1 text-h1 text-on-background">
            Bonjour, {profile ? `${profile.prenom} ${profile.nom}` : 'Jean Dupont'}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
            Voici un aperçu de votre journée académique et de vos ressources.
          </p>
        </div>
        <div className="flex gap-sm">
          <button 
            onClick={() => setIsRequestModalOpen(true)}
            className="flex items-center gap-xs bg-primary text-on-primary px-md py-sm rounded-lg font-label-caps text-label-caps hover:bg-on-primary-fixed-variant transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Nouvelle Requête
          </button>
        </div>
      </section>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-gutter">
        
        {/* Academic Overview (Large) */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest rounded-xl border border-outline-variant p-md bento-item">
          <div className="flex justify-between items-start mb-lg">
            <h3 className="font-h3 text-h3 text-on-surface flex items-center gap-base">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
              Aperçu Académique
            </h3>
            <div className="text-right flex flex-col items-end">
              <span className="font-label-caps text-label-caps text-on-surface-variant">Moyenne Générale</span>
              <p className="font-h1 text-h1 text-primary">
                {gpaInfo.average} <span className="text-h3 font-normal text-on-surface-variant">/ 20</span>
              </p>
              <button 
                onClick={() => setIsGradesModalOpen(true)}
                className="mt-xs text-[11px] font-bold text-primary hover:underline flex items-center gap-xs cursor-pointer bg-transparent border-0"
              >
                <span className="material-symbols-outlined text-[16px]">visibility</span>
                Détails des notes ({gpaInfo.count} évals)
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            <div>
              <div className="flex justify-between mb-xs">
                <span className="font-label-caps text-label-caps">Progression du Semestre</span>
                <span className="font-label-caps text-label-caps text-primary">{semesterProgress}%</span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: `${semesterProgress}%` }}></div>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant mt-base">
                Filière : {filiereName}
              </p>
            </div>
            <div className="flex gap-md border-l border-outline-variant pl-lg">
              <div>
                <span className="font-label-caps text-label-caps text-on-surface-variant">Crédits ECTS</span>
                <p className="font-h2 text-h2 text-on-surface">30 <span className="text-body-md font-normal text-on-surface-variant">/ 30</span></p>
              </div>
              <div>
                <span className="font-label-caps text-label-caps text-on-surface-variant">Absences</span>
                <p className="font-h2 text-h2 text-secondary">00 <span className="text-body-md font-normal text-on-surface-variant">Justifiées</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions (Medium) */}
        <div className="col-span-12 lg:col-span-4 bg-primary text-on-primary rounded-xl p-md bento-item flex flex-col justify-between">
          <h3 className="font-h3 text-h3 mb-md">Actions Rapides</h3>
          <div className="space-y-sm">
            <button 
              onClick={() => setIsRequestModalOpen(true)}
              className="w-full flex items-center justify-between p-sm bg-on-primary-fixed-variant hover:bg-primary-container transition-colors rounded-lg group text-left cursor-pointer"
            >
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined">description</span>
                <span className="font-body-md text-body-md">Demander un certificat</span>
              </div>
              <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
            <button 
              onClick={() => setIsAbsenceModalOpen(true)}
              className="w-full flex items-center justify-between p-sm bg-on-primary-fixed-variant hover:bg-primary-container transition-colors rounded-lg group text-left cursor-pointer"
            >
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined">event_busy</span>
                <span className="font-body-md text-body-md">Signaler une absence</span>
              </div>
              <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
            <button 
              onClick={() => setIsContactModalOpen(true)}
              className="w-full flex items-center justify-between p-sm bg-on-primary-fixed-variant hover:bg-primary-container transition-colors rounded-lg group text-left cursor-pointer"
            >
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined">mail</span>
                <span className="font-body-md text-body-md">Contacter l'administration</span>
              </div>
              <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Today's Schedule (Tall) */}
        <div className="col-span-12 md:col-span-6 lg:col-span-5 bg-surface-container-lowest rounded-xl border border-outline-variant p-md bento-item">
          <div className="flex justify-between items-center mb-md">
            <h3 className="font-h3 text-h3 text-on-surface flex items-center gap-base">
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_today</span>
              Séances d'aujourd'hui
            </h3>
          </div>
          <div className="space-y-md max-h-[300px] overflow-y-auto pr-1">
            {todaySessions.length === 0 ? (
              <div className="text-center py-8 text-on-surface-variant">
                <span className="material-symbols-outlined text-3xl mb-2 text-slate-300">event_available</span>
                <p className="text-xs font-semibold">Aucun cours prévu aujourd'hui</p>
              </div>
            ) : (
              todaySessions.map((s) => (
                <div 
                  key={s.id} 
                  className={`relative pl-base border-l-4 ${
                    s.type === 'CM' ? 'border-primary' : 'border-secondary-container'
                  }`}
                >
                  <p className="font-label-caps text-label-caps text-primary">
                    {s.heure_debut?.substring(0, 5) || 'N/A'} ({(s.duree || 120) / 60}h)
                  </p>
                  <h4 className="font-body-lg text-body-lg font-bold">{s.module_name}</h4>
                  <p className="font-body-md text-body-md text-on-surface-variant flex items-center gap-xs">
                    <span className="material-symbols-outlined text-[16px]">location_on</span>
                    {s.local_name || 'N/A'} • {s.enseignant_name || 'N/A'}
                  </p>
                  <div className="mt-xs flex gap-xs">
                    <span className="px-xs py-[2px] bg-sky-50 text-sky-700 text-[10px] font-bold rounded uppercase">
                      {s.type}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Requests Status & History */}
        <div className="col-span-12 md:col-span-6 lg:col-span-7 bg-surface-container-lowest rounded-xl border border-outline-variant p-md bento-item">
          <div className="flex justify-between items-center mb-md">
            <h3 className="font-h3 text-h3 text-on-surface flex items-center gap-base">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>folder_open</span>
              Suivi des Requêtes
            </h3>
          </div>
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left">
              <thead className="border-b border-outline-variant">
                <tr>
                  <th className="font-label-caps text-label-caps py-base">DATE</th>
                  <th className="font-label-caps text-label-caps py-base">TYPE</th>
                  <th className="font-label-caps text-label-caps py-base">DÉTAILS</th>
                  <th className="font-label-caps text-label-caps py-base text-right">STATUT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-surface-container-low transition-colors group">
                    <td className="py-sm font-table-data text-table-data text-on-surface-variant">{req.date}</td>
                    <td className="py-sm font-table-data text-table-data font-semibold">{req.type}</td>
                    <td className="py-sm font-table-data text-table-data text-on-surface-variant max-w-[200px] truncate">{req.details}</td>
                    <td className="py-sm font-table-data text-table-data text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        req.status === 'Délivré' || req.status === 'Envoyé' ? 'bg-green-50 text-green-700' :
                        req.status === 'En attente' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Secondary Information Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        
        {/* News Widget */}
        <div className="bg-surface-container-low rounded-xl p-md border border-outline-variant border-dashed">
          <h4 className="font-label-caps text-label-caps text-on-surface-variant mb-md flex items-center gap-xs">
            <span className="material-symbols-outlined text-[16px]">campaign</span>
            Actualités Campus
          </h4>
          <p className="font-body-md text-body-md font-bold mb-xs">Ouverture des inscriptions aux sports d'hiver</p>
          <p className="font-body-md text-body-md text-on-surface-variant line-clamp-2">
            Les inscriptions pour les séjours de ski organisés par l'université ouvrent lundi prochain...
          </p>
        </div>

        {/* Vacation alert */}
        <div className="bg-secondary-fixed text-on-secondary-fixed rounded-xl p-md border border-secondary">
          <h4 className="font-label-caps text-label-caps opacity-80 mb-md flex items-center gap-xs">
            <span className="material-symbols-outlined text-[16px]">event_available</span>
            Prochaines Vacances
          </h4>
          {vacations.length === 0 ? (
            <p className="font-body-md text-body-md font-bold mb-xs">Aucune vacance prévue prochainement</p>
          ) : (
            <div>
              <p className="font-body-md text-body-md font-bold mb-xs">{vacations[0].titre}</p>
              <p className="font-body-md text-body-md opacity-90">
                Du {vacations[0].date_debut} au {vacations[0].date_fin}
              </p>
            </div>
          )}
        </div>

        {/* Map/Location Widget */}
        <div className="relative overflow-hidden rounded-xl border border-outline-variant h-[180px] group">
          <div 
            className="absolute inset-0 z-0 grayscale opacity-50 group-hover:grayscale-0 transition-all duration-500 bg-cover bg-center"
            style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBaslObAaH--QZkQiwDAGr6V6fKb-xl79O5pSYar-Kl7HE7q0hXKSGCngncho8_yJX69r8RBDqPvYuBL1Fb3jJdaT0foUZ3xH__Q6qzi7tQSt8GK7oEQrn9Oy_GPdgOgKSQqKcS8QRiChFO8n8WRFCK5-dwifgDIMIxN1Oo0uYjuCBrlWDcoKCKt-hF7Kz_bL0LkENVfy4hLjlzWkeD_IDRtPX8C10WSnoLK3hOEgWFqpcyJKl09UbEM68x-IP4M-zuF5unefL17l4')" }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
          <div className="absolute bottom-md left-md right-md z-20 text-white">
            <h4 className="font-body-lg text-body-lg font-bold">Bibliothèque Centrale</h4>
            <p className="font-body-md text-body-md opacity-80">Affluence actuelle : Basse</p>
          </div>
          <div className="absolute top-md right-md z-20">
            <span className="bg-primary text-white text-[10px] px-sm py-[2px] rounded-full font-bold uppercase">Ouvert</span>
          </div>
        </div>

      </section>

      {/* Request Certificate Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-8 max-w-xl w-full shadow-2xl border border-slate-100 animate-in zoom-in duration-200">
            <h3 className="font-h3 text-h3 text-slate-900 mb-6">Demande de document administratif</h3>
            <form onSubmit={handleCreateCertificate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Type de document</label>
                <select 
                  value={certType} 
                  onChange={(e) => setCertType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option>Certificat de scolarité</option>
                  <option>Relevé de notes</option>
                  <option>Attestation de réussite</option>
                  <option>Convention de stage</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsRequestModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg py-2 text-xs font-bold uppercase tracking-widest cursor-pointer"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-primary hover:bg-on-primary-fixed-variant text-white rounded-lg py-2 text-xs font-bold uppercase tracking-widest cursor-pointer"
                >
                  Soumettre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Absence Modal */}
      {isAbsenceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-8 max-w-xl w-full shadow-2xl border border-slate-100 animate-in zoom-in duration-200">
            <h3 className="font-h3 text-h3 text-slate-900 mb-6">Déclarer une absence</h3>
            <form onSubmit={handleReportAbsence} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Date de l'absence</label>
                <input 
                  type="date"
                  value={absenceDate} 
                  onChange={(e) => setAbsenceDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Motif / Explication</label>
                <textarea 
                  value={absenceReason} 
                  onChange={(e) => setAbsenceReason(e.target.value)}
                  placeholder="Raison de l'absence..."
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsAbsenceModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg py-2 text-xs font-bold uppercase tracking-widest cursor-pointer"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-primary hover:bg-on-primary-fixed-variant text-white rounded-lg py-2 text-xs font-bold uppercase tracking-widest cursor-pointer"
                >
                  Déclarer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contact Admin Modal */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-8 max-w-xl w-full shadow-2xl border border-slate-100 animate-in zoom-in duration-200">
            <h3 className="font-h3 text-h3 text-slate-900 mb-6">Contacter l'administration</h3>
            <form onSubmit={handleContactAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sujet du message</label>
                <input 
                  type="text"
                  placeholder="Ex: Problème d'inscription..."
                  value={contactSubject} 
                  onChange={(e) => setContactSubject(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Message</label>
                <textarea 
                  value={contactMessage} 
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Saisissez votre message ici..."
                  rows={5}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsContactModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg py-2 text-xs font-bold uppercase tracking-widest cursor-pointer"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-primary hover:bg-on-primary-fixed-variant text-white rounded-lg py-2 text-xs font-bold uppercase tracking-widest cursor-pointer"
                >
                  Envoyer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Grades Details Modal */}
      {isGradesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl border border-slate-100 animate-in zoom-in duration-200 text-slate-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-h3 text-h3 text-slate-900 flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">analytics</span>
                Bulletin de Notes & Évaluations
              </h3>
              <button 
                onClick={() => setIsGradesModalOpen(false)}
                className="text-slate-400 hover:text-slate-650 cursor-pointer bg-transparent border-0"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[400px] pr-1">
              {filiereModules.length === 0 ? (
                <p className="text-sm italic text-slate-500 text-center py-8">Aucun module trouvé pour votre filière.</p>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="py-2 text-xs font-bold text-slate-550 uppercase tracking-wider">Module</th>
                      <th className="py-2 text-xs font-bold text-slate-550 uppercase tracking-wider text-center w-[80px]">Note</th>
                      <th className="py-2 text-xs font-bold text-slate-550 uppercase tracking-wider text-center w-[120px]">Statut</th>
                      <th className="py-2 text-xs font-bold text-slate-550 uppercase tracking-wider">Observations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filiereModules.map((m) => {
                      const evalKey = `eval_${m.id}_${profile?.id}`;
                      const evalsObj = JSON.parse(localStorage.getItem('student_evaluations') || '{}');
                      const ev = evalsObj[evalKey] || { note: '--', appreciation: '--', status: 'Non évalué' };

                      return (
                        <tr key={m.id} className="hover:bg-slate-50/50">
                          <td className="py-3">
                            <p className="font-semibold text-slate-800 text-sm">{m.nom}</p>
                          </td>
                          <td className="py-3 text-center font-bold text-primary text-sm">
                            {ev.note || '--'}
                          </td>
                          <td className="py-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              ev.status === 'Acquis' ? 'bg-green-50 text-green-700' :
                              ev.status === 'En cours' ? 'bg-amber-50 text-amber-700' : 
                              ev.status === 'Non acquis' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {ev.status || 'Non évalué'}
                            </span>
                          </td>
                          <td className="py-3 text-sm text-slate-600">
                            {ev.appreciation || '--'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex justify-end pt-6 mt-4 border-t border-slate-150">
              <button 
                onClick={() => setIsGradesModalOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg px-6 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer border-0"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentPortal;
