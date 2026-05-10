import React from 'react';

const Dashboard: React.FC = () => {
  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Page Header */}
      <div className="mb-lg">
        <h1 className="font-h1 text-h1 text-on-surface mb-xs">Global Overview</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">Computer Science Department Statistics & Workload</p>
      </div>

      {/* Bento Grid: Summary Cards */}
      <div className="grid grid-cols-12 gap-gutter mb-lg">
        {/* Card 1: Total Hourly Volume */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex flex-col justify-between">
          <div className="flex justify-between items-start mb-sm">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Total Hourly Volume</span>
            <div className="w-8 h-8 rounded-lg bg-primary-fixed/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
            </div>
          </div>
          <div>
            <div className="font-h2 text-h2 text-on-surface">14,850 h</div>
            <div className="mt-xs font-body-md text-body-md text-primary flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              +4.2% vs last year
            </div>
          </div>
        </div>

        {/* Card 2: Avg Workload */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex flex-col justify-between">
          <div className="flex justify-between items-start mb-sm">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Avg Workload / Teacher</span>
            <div className="w-8 h-8 rounded-lg bg-secondary-fixed/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary-container" style={{ fontVariationSettings: "'FILL' 1" }}>assignment_ind</span>
            </div>
          </div>
          <div>
            <div className="font-h2 text-h2 text-on-surface">215 h</div>
            <div className="mt-xs font-body-md text-body-md text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-outline">horizontal_rule</span>
              Stable workload
            </div>
          </div>
        </div>

        {/* Card 3: Faculty Count */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex flex-col justify-between">
          <div className="flex justify-between items-start mb-sm">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Total Faculty Count</span>
            <div className="w-8 h-8 rounded-lg bg-primary-fixed/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
            </div>
          </div>
          <div>
            <div className="font-h2 text-h2 text-on-surface">68</div>
            <div className="mt-xs font-body-md text-body-md text-secondary-container flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">warning</span>
              2 pending recruitments
            </div>
          </div>
        </div>

        {/* Card 4: Active Programs */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex flex-col justify-between">
          <div className="flex justify-between items-start mb-sm">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Active Programs (Filières)</span>
            <div className="w-8 h-8 rounded-lg bg-tertiary-fixed/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-tertiary-container" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
            </div>
          </div>
          <div>
            <div className="font-h2 text-h2 text-on-surface">12</div>
            <div className="mt-xs font-body-md text-body-md text-on-surface-variant flex items-center gap-1">
              Across 3 degrees
            </div>
          </div>
        </div>
      </div>

      {/* Chart & Data Table Section */}
      <div className="grid grid-cols-12 gap-gutter">
        {/* Chart Module (Left) */}
        <div className="col-span-12 lg:col-span-5 bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex flex-col">
          <div className="mb-md">
            <h3 className="font-h3 text-h3 text-on-surface">Hourly Breakdown by Type</h3>
            <p className="font-body-md text-body-md text-on-surface-variant">Distribution of total volume</p>
          </div>
          {/* Visual Chart Area */}
          <div className="flex-1 flex flex-col justify-center py-lg">
            <div className="w-full h-8 rounded-full overflow-hidden flex bg-surface-container shadow-inner mb-md border border-outline-variant/30">
              <div className="bg-primary h-full" style={{ width: '45%' }} title="CM: 45%"></div>
              <div className="bg-secondary-container h-full" style={{ width: '35%' }} title="TD: 35%"></div>
              <div className="bg-tertiary-container h-full" style={{ width: '20%' }} title="TP: 20%"></div>
            </div>
            {/* Legend */}
            <div className="flex flex-col gap-sm mt-4 px-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-primary"></span>
                  <span className="font-body-md text-body-md text-on-surface">Cours Magistraux (CM)</span>
                </div>
                <span className="font-h3 text-h3 text-on-surface">45%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-secondary-container"></span>
                  <span className="font-body-md text-body-md text-on-surface">Travaux Dirigés (TD)</span>
                </div>
                <span className="font-h3 text-h3 text-on-surface">35%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-tertiary-container"></span>
                  <span className="font-body-md text-body-md text-on-surface">Travaux Pratiques (TP)</span>
                </div>
                <span className="font-h3 text-h3 text-on-surface">20%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table Module (Right) */}
        <div className="col-span-12 lg:col-span-7 bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col">
          <div className="p-md border-b border-outline-variant flex justify-between items-center bg-surface">
            <div>
              <h3 className="font-h3 text-h3 text-on-surface">Current Filières</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">Detailed status and allocated hours</p>
            </div>
            <button className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded transition-colors">
              <span className="material-symbols-outlined">more_vert</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-lowest border-b border-outline-variant">
                <tr>
                  <th className="py-sm px-md font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Program Name</th>
                  <th className="py-sm px-md font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Level</th>
                  <th className="py-sm px-md font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider text-right">Total Hours</th>
                  <th className="py-sm px-md font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider text-center">Status</th>
                </tr>
              </thead>
              <tbody className="font-table-data text-table-data text-on-surface">
                <tr className="h-[48px] border-b border-outline-variant even:bg-surface-container-low hover:bg-surface-container transition-colors">
                  <td className="py-sm px-md font-medium">Licence Informatique</td>
                  <td className="py-sm px-md text-on-surface-variant">L1 - L3</td>
                  <td className="py-sm px-md text-right font-medium">4,200</td>
                  <td className="py-sm px-md text-center">
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-semibold">Validated</span>
                  </td>
                </tr>
                <tr className="h-[48px] border-b border-outline-variant even:bg-surface-container-low hover:bg-surface-container transition-colors">
                  <td className="py-sm px-md font-medium">Master Génie Logiciel</td>
                  <td className="py-sm px-md text-on-surface-variant">M1 - M2</td>
                  <td className="py-sm px-md text-right font-medium">2,850</td>
                  <td className="py-sm px-md text-center">
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-semibold">Validated</span>
                  </td>
                </tr>
                <tr className="h-[48px] border-b border-outline-variant even:bg-surface-container-low hover:bg-surface-container transition-colors">
                  <td className="py-sm px-md font-medium">Master IA & Data Science</td>
                  <td className="py-sm px-md text-on-surface-variant">M1 - M2</td>
                  <td className="py-sm px-md text-right font-medium">3,100</td>
                  <td className="py-sm px-md text-center">
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-semibold">In Review</span>
                  </td>
                </tr>
                <tr className="h-[48px] border-b border-outline-variant even:bg-surface-container-low hover:bg-surface-container transition-colors">
                  <td className="py-sm px-md font-medium">Licence Pro Sécurité</td>
                  <td className="py-sm px-md text-on-surface-variant">L3</td>
                  <td className="py-sm px-md text-right font-medium">1,200</td>
                  <td className="py-sm px-md text-center">
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-semibold">Validated</span>
                  </td>
                </tr>
                <tr className="h-[48px] border-b border-outline-variant even:bg-surface-container-low hover:bg-surface-container transition-colors">
                  <td className="py-sm px-md font-medium">Master Réseaux</td>
                  <td className="py-sm px-md text-on-surface-variant">M1 - M2</td>
                  <td className="py-sm px-md text-right font-medium">2,400</td>
                  <td className="py-sm px-md text-center">
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-surface-variant text-on-surface-variant border border-outline-variant text-xs font-semibold">Draft</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="p-sm bg-surface text-center border-t border-outline-variant">
            <a className="font-body-md text-body-md text-primary hover:text-primary-container font-medium transition-colors" href="#">View All Programs</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
