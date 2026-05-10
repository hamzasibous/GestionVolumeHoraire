import React from 'react';

const TeacherConsultation: React.FC = () => {
  return (
    <div className="max-w-7xl w-full mx-auto flex flex-col gap-lg">
      {/* Page Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md">
        <div>
          <h1 className="font-h1 text-h1 text-on-surface">My Assignments & Workload</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-xs">Academic Year 2023-2024</p>
        </div>
        <button className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant hover:bg-surface-container transition-colors text-primary font-h3 text-[14px] px-md py-sm rounded-lg shadow-sm w-fit">
          <span className="material-symbols-outlined text-[18px]">download</span>
          Download Report
        </button>
      </div>

      {/* Bento Grid: Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
        {/* Total Hours */}
        <div className="md:col-span-1 bg-primary text-on-primary rounded-xl p-md flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="absolute -right-8 -top-8 opacity-10">
            <span className="material-symbols-outlined text-[140px]">schedule</span>
          </div>
          <h3 className="font-h3 text-h3 z-10">Total Assured Hours</h3>
          <div className="z-10 mt-md">
            <div className="font-h1 text-[56px] leading-none mb-1">214<span className="text-[20px] font-normal opacity-80 ml-1">hrs</span></div>
            <p className="font-body-md text-on-primary-fixed-variant">Statutory requirement: 192 hrs</p>
          </div>
          <div className="mt-sm flex items-center gap-2 z-10 bg-on-primary/10 w-fit px-3 py-1 rounded-full">
            <span className="material-symbols-outlined text-[16px] text-secondary-fixed">trending_up</span>
            <span className="font-label-caps text-label-caps text-secondary-fixed">Overload (+22 hrs)</span>
          </div>
        </div>

        {/* Breakdown Progress */}
        <div className="md:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm flex flex-col justify-center">
          <h3 className="font-h3 text-h3 text-on-surface mb-sm">Workload Breakdown</h3>
          <div className="flex flex-col gap-sm">
            {/* CM */}
            <div>
              <div className="flex justify-between font-label-caps text-label-caps text-on-surface-variant mb-xs uppercase tracking-wider">
                <span>Cours Magistraux (CM)</span>
                <span className="font-bold text-on-surface">64 hrs</span>
              </div>
              <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: '30%' }}></div>
              </div>
            </div>
            {/* TD */}
            <div>
              <div className="flex justify-between font-label-caps text-label-caps text-on-surface-variant mb-xs uppercase tracking-wider">
                <span>Travaux Dirigés (TD)</span>
                <span className="font-bold text-on-surface">96 hrs</span>
              </div>
              <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: '45%' }}></div>
              </div>
            </div>
            {/* TP */}
            <div>
              <div className="flex justify-between font-label-caps text-label-caps text-on-surface-variant mb-xs uppercase tracking-wider">
                <span>Travaux Pratiques (TP)</span>
                <span className="font-bold text-on-surface">54 hrs</span>
              </div>
              <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-secondary-container" style={{ width: '25%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Split: Current Assignments & Forecasting */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        {/* Current Assigned Courses */}
        <div className="flex flex-col gap-sm">
          <div className="flex items-center justify-between border-b border-outline-variant pb-xs">
            <h2 className="font-h2 text-h2 text-on-surface">Current Assignments</h2>
            <span className="font-label-caps text-label-caps text-outline bg-surface-container px-2 py-1 rounded uppercase tracking-wider">Semester 1</span>
          </div>
          <div className="flex flex-col gap-xs">
            {/* Course Item 1 */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-md hover:border-primary transition-colors shadow-sm flex items-start justify-between group">
              <div className="flex gap-md">
                <div className="w-12 h-12 rounded-lg bg-primary-fixed text-on-primary-fixed flex flex-col items-center justify-center shrink-0">
                  <span className="font-bold text-[14px]">CS</span>
                  <span className="text-[10px] opacity-80">101</span>
                </div>
                <div>
                  <h4 className="font-h3 text-[16px] text-on-surface group-hover:text-primary transition-colors">Intro to Computer Science</h4>
                  <div className="flex flex-wrap items-center gap-4 mt-1 font-table-data text-table-data text-on-surface-variant">
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">groups</span> 120 Students</span>
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">location_on</span> Amphi B (Science)</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-h3 text-[16px] text-on-surface">36 hrs</div>
                <div className="font-label-caps text-[10px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded mt-1 inline-block uppercase tracking-wider">CM</div>
              </div>
            </div>
          </div>
        </div>

        {/* Charge Prévisionnelle (Forecasting) */}
        <div className="flex flex-col gap-sm">
          <div className="flex items-center justify-between border-b border-outline-variant pb-xs">
            <h2 className="font-h2 text-h2 text-on-surface">Charge Prévisionnelle</h2>
            <span className="font-label-caps text-label-caps text-secondary-container bg-secondary-container/10 px-2 py-1 rounded uppercase tracking-wider">Next Year 2024-2025</span>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm h-full flex flex-col relative overflow-hidden">
            <div className="relative z-10 flex flex-col h-full">
              <p className="font-body-md text-on-surface-variant mb-md">Based on preliminary department allocations, your forecasted load is slightly reduced to accommodate research leave.</p>
              <div className="grid grid-cols-2 gap-sm mb-auto">
                <div className="p-sm bg-surface border border-outline-variant rounded-lg">
                  <div className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Forecasted Total</div>
                  <div className="font-h2 text-h2 text-on-surface mt-1">168 <span className="text-sm font-normal">hrs</span></div>
                </div>
                <div className="p-sm bg-surface border border-outline-variant rounded-lg">
                  <div className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Status</div>
                  <div className="font-h3 text-[14px] text-secondary mt-1 flex items-center gap-1 uppercase tracking-wider">
                    <span className="material-symbols-outlined text-[16px]">pending_actions</span>
                    Pending Validation
                  </div>
                </div>
              </div>
              <div className="mt-md pt-md border-t border-outline-variant flex justify-between items-center">
                <span className="font-table-data text-table-data text-on-surface-variant">Last updated: Oct 12, 2023</span>
                <button className="text-primary font-h3 text-[14px] hover:underline flex items-center gap-1">
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
