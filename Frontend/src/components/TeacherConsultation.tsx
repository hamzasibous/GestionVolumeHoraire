import React from 'react';

interface AssignedCourse {
  id: string;
  code: string;
  name: string;
  type: 'CM' | 'TD' | 'TP';
  students: number | string;
  location: string;
  hours: number;
}

const mockAssignments: AssignedCourse[] = [
  { id: '1', code: 'CS101', name: 'Intro to Computer Science', type: 'CM', students: 120, location: 'Amphi B (Science)', hours: 36 },
  { id: '2', code: 'CS101', name: 'Intro to Computer Science (Lab)', type: 'TP', students: 'Grp A, B, C', location: 'Lab 402', hours: 54 },
  { id: '3', code: 'CS302', name: 'Operating Systems', type: 'TD', students: 30, location: 'Salle 105', hours: 30 },
];

const TeacherConsultation: React.FC = () => {
  const totalCM = mockAssignments.filter(a => a.type === 'CM').reduce((acc, a) => acc + a.hours, 0);
  const totalTD = mockAssignments.filter(a => a.type === 'TD').reduce((acc, a) => acc + a.hours, 0);
  const totalTP = mockAssignments.filter(a => a.type === 'TP').reduce((acc, a) => acc + a.hours, 0);
  const totalHours = totalCM + totalTD + totalTP;
  const statutoryRequirement = 192;
  const overload = totalHours - statutoryRequirement;

  return (
    <div className="max-w-7xl w-full mx-auto flex flex-col gap-lg">
      {/* Page Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md border-b border-outline-variant pb-md">
        <div>
          <h1 className="font-h1 text-h1 text-on-surface tracking-tight">My Assignments & Workload</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-xs">Academic Year 2023-2024</p>
        </div>
        <button className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant hover:bg-surface-container transition-colors text-primary font-h3 text-[14px] px-md py-sm rounded-lg shadow-sm w-fit uppercase tracking-wider">
          <span className="material-symbols-outlined text-[18px]">download</span>
          Download Report
        </button>
      </div>

      {/* Bento Grid: Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
        {/* Total Hours */}
        <div className="md:col-span-1 bg-primary text-on-primary rounded-xl p-md flex flex-col justify-between shadow-md relative overflow-hidden">
          <div className="absolute -right-8 -top-8 opacity-10">
            <span className="material-symbols-outlined text-[140px]">schedule</span>
          </div>
          <h3 className="font-h3 text-h3 z-10 uppercase tracking-widest text-xs opacity-80">Total Assured Hours</h3>
          <div className="z-10 mt-md">
            <div className="font-h1 text-[56px] leading-none mb-1 font-bold">{totalHours}<span className="text-[20px] font-normal opacity-80 ml-1">hrs</span></div>
            <p className="font-body-md text-on-primary/70 italic text-sm">Statutory requirement: {statutoryRequirement} hrs</p>
          </div>
          {overload > 0 && (
            <div className="mt-sm flex items-center gap-2 z-10 bg-on-primary/10 w-fit px-3 py-1 rounded-full border border-on-primary/20">
              <span className="material-symbols-outlined text-[16px] text-secondary-fixed">trending_up</span>
              <span className="font-label-caps text-label-caps text-secondary-fixed text-[10px] uppercase font-bold">Overload (+{overload} hrs)</span>
            </div>
          )}
        </div>

        {/* Breakdown Progress */}
        <div className="md:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm flex flex-col justify-center">
          <h3 className="font-h3 text-h3 text-on-surface mb-sm tracking-tight border-b border-outline-variant pb-xs">Workload Breakdown</h3>
          <div className="flex flex-col gap-sm mt-2">
            {/* CM */}
            <div className="group">
              <div className="flex justify-between font-label-caps text-label-caps text-on-surface-variant mb-xs uppercase tracking-wider text-[11px] group-hover:text-primary transition-colors">
                <span>Cours Magistraux (CM)</span>
                <span className="font-bold text-on-surface">{totalCM} hrs</span>
              </div>
              <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-700" style={{ width: `${(totalCM / totalHours) * 100}%` }}></div>
              </div>
            </div>
            {/* TD */}
            <div className="group">
              <div className="flex justify-between font-label-caps text-label-caps text-on-surface-variant mb-xs uppercase tracking-wider text-[11px] group-hover:text-primary transition-colors">
                <span>Travaux Dirigés (TD)</span>
                <span className="font-bold text-on-surface">{totalTD} hrs</span>
              </div>
              <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-700" style={{ width: `${(totalTD / totalHours) * 100}%` }}></div>
              </div>
            </div>
            {/* TP */}
            <div className="group">
              <div className="flex justify-between font-label-caps text-label-caps text-on-surface-variant mb-xs uppercase tracking-wider text-[11px] group-hover:text-secondary transition-colors">
                <span>Travaux Pratiques (TP)</span>
                <span className="font-bold text-on-surface">{totalTP} hrs</span>
              </div>
              <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-secondary-container transition-all duration-700" style={{ width: `${(totalTP / totalHours) * 100}%` }}></div>
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
            <h2 className="font-h2 text-h2 text-on-surface tracking-tight">Current Assignments</h2>
            <span className="font-label-caps text-label-caps text-outline bg-surface-container px-2 py-1 rounded uppercase tracking-widest text-[10px] font-bold">Semester 1</span>
          </div>
          <div className="flex flex-col gap-xs">
            {mockAssignments.map((assignment) => (
              <div key={assignment.id} className="bg-surface-container-lowest border border-outline-variant rounded-lg p-md hover:border-primary transition-all shadow-sm flex items-start justify-between group cursor-default hover:shadow-md">
                <div className="flex gap-md">
                  <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center shrink-0 shadow-inner ${
                    assignment.type === 'CM' ? 'bg-primary-fixed text-on-primary-fixed' :
                    assignment.type === 'TD' ? 'bg-secondary-fixed text-on-secondary-fixed' :
                    'bg-tertiary-fixed text-on-tertiary-fixed'
                  }`}>
                    <span className="font-bold text-[14px]">{assignment.code.slice(0, 2)}</span>
                    <span className="text-[10px] opacity-80 font-bold">{assignment.code.slice(2)}</span>
                  </div>
                  <div>
                    <h4 className="font-h3 text-[16px] text-on-surface group-hover:text-primary transition-colors font-bold">{assignment.name}</h4>
                    <div className="flex flex-wrap items-center gap-4 mt-1 font-table-data text-table-data text-on-surface-variant">
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">groups</span> {assignment.students} Students</span>
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">location_on</span> {assignment.location}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-h3 text-[16px] text-on-surface font-bold">{assignment.hours} hrs</div>
                  <div className="font-label-caps text-[10px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded mt-1 inline-block uppercase tracking-widest font-bold">{assignment.type}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Charge Prévisionnelle (Forecasting) */}
        <div className="flex flex-col gap-sm">
          <div className="flex items-center justify-between border-b border-outline-variant pb-xs mb-2">
            <h2 className="font-h2 text-h2 text-on-surface tracking-tight">Charge Prévisionnelle</h2>
            <span className="font-label-caps text-label-caps text-secondary-container bg-secondary-container/10 px-2 py-1 rounded uppercase tracking-widest text-[10px] font-bold">Next Year 2024-2025</span>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm h-full flex flex-col relative overflow-hidden group hover:shadow-lg transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-surface-container-lowest via-surface-container-lowest to-surface-container-low z-0 opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 flex flex-col h-full">
              <p className="font-body-md text-on-surface-variant mb-md leading-relaxed italic">Based on preliminary department allocations, your forecasted load is slightly reduced to accommodate research leave.</p>
              <div className="grid grid-cols-2 gap-sm mb-auto">
                <div className="p-sm bg-surface-bright border border-outline-variant rounded-lg shadow-inner">
                  <div className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px] font-bold">Forecasted Total</div>
                  <div className="font-h2 text-h2 text-on-surface mt-1 font-bold">168 <span className="text-sm font-normal opacity-60">hrs</span></div>
                </div>
                <div className="p-sm bg-surface-bright border border-outline-variant rounded-lg shadow-inner">
                  <div className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px] font-bold">Status</div>
                  <div className="font-h3 text-[14px] text-secondary mt-1 flex items-center gap-1 uppercase tracking-tight font-bold">
                    <span className="material-symbols-outlined text-[16px]">pending_actions</span>
                    Pending Validation
                  </div>
                </div>
              </div>
              <div className="mt-md pt-md border-t border-outline-variant flex justify-between items-center">
                <span className="font-table-data text-table-data text-on-surface-variant opacity-60 text-xs">Last updated: Oct 12, 2023</span>
                <button className="text-primary font-h3 text-[14px] hover:underline flex items-center gap-1 uppercase tracking-widest text-[10px] font-bold">
                  View Details <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherConsultation;
