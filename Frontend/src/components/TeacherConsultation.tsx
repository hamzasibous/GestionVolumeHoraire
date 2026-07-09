import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface AssignedCourse {
  id: string;
  code: string;
  name: string;
  type: string;
  students: number | string;
  location: string;
  hours: number;
}

interface MyWorkloadData {
  total_hours: number;
  statutory_requirement: number;
  overload: number;
  breakdown: {
    CM: number;
    TD: number;
    TP: number;
  };
  assignments: AssignedCourse[];
}

const TeacherConsultation: React.FC = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<MyWorkloadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [forecast, setForecast] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    
    // Fetch Profile
    const fetchProfile = fetch('http://localhost:8000/api/users/profile/', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => res.json());

    // Fetch Current Data
    const fetchCurrent = fetch('http://localhost:8000/api/core/my-assignments/', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => res.json());

    // Fetch Forecast Data
    const fetchForecast = fetch('http://localhost:8000/api/analyse/simulations/get_personal_forecast/', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => res.json());

    Promise.all([fetchProfile, fetchCurrent, fetchForecast])
      .then(([profileData, currentData, forecastData]) => {
        setUserProfile(profileData);
        setData(currentData);
        setForecast(forecastData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching data:', err);
        setLoading(false);
      });
  }, []);

  const handleDownloadReport = () => {
    if (!data) return;

    const teacherName = userProfile ? `Pr. ${userProfile.nom} ${userProfile.prenom}` : "Enseignant";
    const deptName = userProfile?.departement_name || "Département d'Informatique";
    const email = userProfile?.email || "";

    let report = `========================================================
RAPPORT DE CHARGE DE TRAVAIL - ANNEE ACADEMIQUE 2026-2027
========================================================

ENSEIGNANT:
- Nom: ${teacherName}
- Département: ${deptName}
${email ? `- Contact: ${email}\n` : ""}
RÉSUMÉ DE LA CHARGE:
- Volume Horaire Total Assuré: ${data.total_hours} h
- Exigence Statutaire: ${data.statutory_requirement} h
- Heures Supplémentaires (Overload): ${data.overload} h

RÉPARTITION:
- Cours Magistraux (CM): ${data.breakdown?.CM || 0} h
- Travaux Dirigés (TD): ${data.breakdown?.TD || 0} h
- Travaux Pratiques (TP): ${data.breakdown?.TP || 0} h

LISTE DES AFFECTATIONS:
`;

    if (data.assignments && data.assignments.length > 0) {
      report += `-------------------------------------------------------------------------------------------------\n`;
      report += `Code        | Nom du Module                               | Type | Salle      | Volume\n`;
      report += `-------------------------------------------------------------------------------------------------\n`;
      data.assignments.forEach(asg => {
        const codePad = asg.code.padEnd(11);
        const namePad = asg.name.padEnd(43).substring(0, 43);
        const typePad = asg.type.padEnd(4);
        const locPad = asg.location.padEnd(10);
        const hoursPad = `${asg.hours} h`.padEnd(8);
        report += `${codePad} | ${namePad} | ${typePad} | ${locPad} | ${hoursPad}\n`;
      });
      report += `-------------------------------------------------------------------------------------------------\n`;
    } else {
      report += `Aucune affectation trouvée pour ce semestre.\n`;
    }

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rapport_charge_${teacherName.replace(/\s+/g, '_').toLowerCase()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">sync</span>
      </div>
    );
  }

  // Handle case where breakdown might be missing (e.g. error response)
  const { 
    total_hours = 0, 
    statutory_requirement = 192, 
    overload = 0, 
    breakdown = { CM: 0, TD: 0, TP: 0 }, 
    assignments = [] 
  } = data as any;

  return (
    <div className="max-w-7xl w-full mx-auto flex flex-col gap-lg">
      {/* Page Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md border-b border-outline-variant pb-md">
        <div>
          <h1 className="font-h1 text-h1 text-on-surface tracking-tight">{t('teacher_consultation.title')}</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-xs">{t('teacher_consultation.subtitle')}</p>
        </div>
        <button 
          onClick={handleDownloadReport}
          className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant hover:bg-surface-container transition-colors text-primary font-h3 text-[14px] px-md py-sm rounded-lg shadow-sm w-fit uppercase tracking-wider"
        >
          <span className="material-symbols-outlined text-[18px]">download</span>
          {t('teacher_consultation.download_report')}
        </button>
      </div>

      {/* Bento Grid: Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
        {/* Total Hours */}
        <div className="md:col-span-1 bg-primary text-on-primary rounded-xl p-md flex flex-col justify-between shadow-md relative overflow-hidden">
          <div className="absolute -right-8 -top-8 opacity-10">
            <span className="material-symbols-outlined text-[140px]">schedule</span>
          </div>
          <h3 className="font-h3 text-h3 z-10 uppercase tracking-widest text-xs opacity-80">{t('teacher_consultation.total_assured_hours')}</h3>
          <div className="z-10 mt-md">
            <div className="font-h1 text-[56px] leading-none mb-1 font-bold">{total_hours}<span className="text-[20px] font-normal opacity-80 ml-1">{t('faculty_assignments.hours_per_year').split('/')[0]}</span></div>
            <p className="font-body-md text-on-primary/70 italic text-sm">{t('teacher_consultation.statutory_requirement', { statutory_requirement })}</p>
          </div>
          {overload > 0 && (
            <div className="mt-sm flex items-center gap-2 z-10 bg-on-primary/10 w-fit px-3 py-1 rounded-full border border-on-primary/20">
              <span className="material-symbols-outlined text-[16px] text-secondary-fixed">trending_up</span>
              <span className="font-label-caps text-label-caps text-secondary-fixed text-[10px] uppercase font-bold">{t('teacher_consultation.overload', { overload })}</span>
            </div>
          )}
        </div>

        {/* Breakdown Progress */}
        <div className="md:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm flex flex-col justify-center">
          <h3 className="font-h3 text-h3 text-on-surface mb-sm tracking-tight border-b border-outline-variant pb-xs">{t('teacher_consultation.workload_breakdown')}</h3>
          <div className="flex flex-col gap-sm mt-2">
            {/* CM */}
            <div className="group">
              <div className="flex justify-between font-label-caps text-label-caps text-on-surface-variant mb-xs uppercase tracking-wider text-[11px] group-hover:text-primary transition-colors">
                <span>{t('dashboard.legend_cm')}</span>
                <span className="font-bold text-on-surface">{breakdown.CM} {t('faculty_assignments.hours_per_year').split('/')[0]}</span>
              </div>
              <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-700" style={{ width: `${total_hours > 0 ? (breakdown.CM / total_hours) * 100 : 0}%` }}></div>
              </div>
            </div>
            {/* TD */}
            <div className="group">
              <div className="flex justify-between font-label-caps text-label-caps text-on-surface-variant mb-xs uppercase tracking-wider text-[11px] group-hover:text-primary transition-colors">
                <span>{t('dashboard.legend_td')}</span>
                <span className="font-bold text-on-surface">{breakdown.TD} {t('faculty_assignments.hours_per_year').split('/')[0]}</span>
              </div>
              <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-700" style={{ width: `${total_hours > 0 ? (breakdown.TD / total_hours) * 100 : 0}%` }}></div>
              </div>
            </div>
            {/* TP */}
            <div className="group">
              <div className="flex justify-between font-label-caps text-label-caps text-on-surface-variant mb-xs uppercase tracking-wider text-[11px] group-hover:text-secondary transition-colors">
                <span>{t('dashboard.legend_tp')}</span>
                <span className="font-bold text-on-surface">{breakdown.TP} {t('faculty_assignments.hours_per_year').split('/')[0]}</span>
              </div>
              <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-secondary-container transition-all duration-700" style={{ width: `${total_hours > 0 ? (breakdown.TP / total_hours) * 100 : 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Split: Current Assignments & Forecasting */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        {/* Current Assigned Courses */}
        <div className="flex flex-col gap-sm">
          <div className="flex items-center justify-between border-b border-outline-variant pb-xs mb-2">
            <h2 className="font-h2 text-h2 text-on-surface tracking-tight">{t('teacher_consultation.current_assignments')}</h2>
            <span className="font-label-caps text-label-caps text-outline bg-surface-container px-2 py-1 rounded uppercase tracking-widest text-[10px] font-bold">{t('teacher_consultation.active_semester')}</span>
          </div>
          <div className="flex flex-col gap-xs">
            {assignments.length > 0 ? assignments.map((assignment: AssignedCourse) => (
              <div key={assignment.id} className="bg-surface-container-lowest border border-outline-variant rounded-lg p-md hover:border-primary transition-all shadow-sm flex items-start justify-between group cursor-default hover:shadow-md">
                <div className="flex gap-md">
                  <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center shrink-0 shadow-inner ${
                    assignment.type === 'CM' ? 'bg-primary-fixed text-on-primary-fixed' :
                    assignment.type === 'TD' ? 'bg-secondary-fixed text-on-secondary-fixed' :
                    'bg-tertiary-fixed text-on-tertiary-fixed'
                  }`}>
                    <span className="font-bold text-[14px]">{assignment.code.slice(0, 3)}</span>
                    <span className="text-[10px] opacity-80 font-bold">{assignment.code.slice(3)}</span>
                  </div>
                  <div>
                    <h4 className="font-h3 text-[16px] text-on-surface group-hover:text-primary transition-colors font-bold">{assignment.name}</h4>
                    <div className="flex flex-wrap items-center gap-4 mt-1 font-table-data text-table-data text-on-surface-variant">
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">groups</span> {assignment.students}</span>
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">location_on</span> {assignment.location}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-h3 text-[16px] text-on-surface font-bold">{assignment.hours} {t('faculty_assignments.hours_per_year').split('/')[0]}</div>
                  <div className="font-label-caps text-[10px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded mt-1 inline-block uppercase tracking-widest font-bold">{assignment.type}</div>
                </div>
              </div>
            )) : (
              <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-xl text-center text-on-surface-variant italic">
                {t('teacher_consultation.no_assignments')}
              </div>
            )}
          </div>
        </div>

        {/* Charge Prévisionnelle (Forecasting) */}
        <div className="flex flex-col gap-sm">
          <div className="flex items-center justify-between border-b border-outline-variant pb-xs mb-2">
            <h2 className="font-h2 text-h2 text-on-surface tracking-tight">{t('teacher_consultation.forecast_title')}</h2>
            <span className="font-label-caps text-label-caps text-secondary-container bg-secondary-container/10 px-2 py-1 rounded uppercase tracking-widest text-[10px] font-bold">
              {forecast?.target_year ? `${t('teacher_consultation.next_year')} ${forecast.target_year}-${forecast.target_year + 1}` : t('teacher_consultation.next_year')}
            </span>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm h-full flex flex-col relative overflow-hidden group hover:shadow-lg transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-surface-container-lowest via-surface-container-lowest to-surface-container-low z-0 opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 flex flex-col h-full">
              <p className="font-body-md text-on-surface-variant mb-md leading-relaxed italic">
                {forecast?.scenario ? t('teacher_consultation.scenario_text', { scenario: forecast.scenario }) : t('teacher_consultation.no_scenario_text')}
              </p>
              <div className="grid grid-cols-2 gap-sm mb-auto">
                <div className="p-sm bg-surface-bright border border-outline-variant rounded-lg shadow-inner">
                  <div className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px] font-bold">{t('teacher_consultation.forecasted_hours')}</div>
                  <div className="font-h2 text-h2 text-on-surface mt-1 font-bold">{forecast?.forecasted_hours || 0} <span className="text-sm font-normal opacity-60">{t('faculty_assignments.hours_per_year').split('/')[0]}</span></div>
                </div>
                <div className="p-sm bg-surface-bright border border-outline-variant rounded-lg shadow-inner">
                  <div className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px] font-bold">{t('teacher_consultation.status')}</div>
                  <div className={`font-h3 text-[14px] ${forecast?.completed ? 'text-primary' : 'text-secondary'} mt-1 flex items-center gap-1 uppercase tracking-tight font-bold`}>
                    <span className="material-symbols-outlined text-[16px]">{forecast?.completed ? 'check_circle' : 'pending_actions'}</span>
                    {forecast?.completed ? t('teacher_consultation.status_generated') : t('teacher_consultation.status_pending')}
                  </div>
                </div>
              </div>
              <div className="mt-md pt-md border-t border-outline-variant flex justify-between items-center">
                <span className="font-table-data text-table-data text-on-surface-variant opacity-60 text-xs">{t('teacher_consultation.last_calculated')}: {new Date().toLocaleDateString()}</span>
                {forecast?.forecasted_hours > 0 && (
                  <button className="text-primary font-h3 text-[14px] hover:underline flex items-center gap-1 uppercase tracking-widest text-[10px] font-bold">
                    {t('teacher_consultation.view_details')} <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherConsultation;
