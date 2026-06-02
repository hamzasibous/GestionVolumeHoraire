import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface DashboardStats {
  total_filieres: number;
  total_modules: number;
  total_profs: number;
  total_rooms: number;
  total_hours: number;
  avg_workload: number;
  type_stats: {
    CM: number;
    TD: number;
    TP: number;
  };
  filieres: any[];
}

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8000/api/core/dashboard-stats/')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching dashboard stats:', err);
        setLoading(false);
      });
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">sync</span>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Page Header */}
      <div className="mb-lg">
        <h1 className="font-h1 text-h1 text-on-surface mb-xs">{t('dashboard.title')}</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">{t('dashboard.subtitle')}</p>
      </div>

      {/* Bento Grid: Summary Cards */}
      <div className="grid grid-cols-12 gap-gutter mb-lg">
        {/* Card 1: Total Hourly Volume */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start mb-sm">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">{t('dashboard.total_volume')}</span>
            <div className="w-8 h-8 rounded-lg bg-primary-fixed/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
            </div>
          </div>
          <div>
            <div className="font-h2 text-h2 text-on-surface">{stats.total_hours.toLocaleString()} h</div>
            <div className="mt-xs font-body-md text-body-md text-primary flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              Volume total du semestre
            </div>
          </div>
        </div>

        {/* Card 2: Avg Workload */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start mb-sm">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">{t('dashboard.avg_workload')}</span>
            <div className="w-8 h-8 rounded-lg bg-secondary-fixed/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary-container" style={{ fontVariationSettings: "'FILL' 1" }}>assignment_ind</span>
            </div>
          </div>
          <div>
            <div className="font-h2 text-h2 text-on-surface">{stats.avg_workload} h</div>
            <div className="mt-xs font-body-md text-body-md text-on-surface-variant flex items-center gap-1">
              Moyenne par enseignant
            </div>
          </div>
        </div>

        {/* Card 3: Faculty Count */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start mb-sm">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">{t('dashboard.total_faculty')}</span>
            <div className="w-8 h-8 rounded-lg bg-primary-fixed/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
            </div>
          </div>
          <div>
            <div className="font-h2 text-h2 text-on-surface">{stats.total_profs}</div>
            <div className="mt-xs font-body-md text-body-md text-secondary-container flex items-center gap-1">
              Enseignants actifs
            </div>
          </div>
        </div>

        {/* Card 4: Active Programs */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start mb-sm">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">{t('dashboard.active_programs')}</span>
            <div className="w-8 h-8 rounded-lg bg-tertiary-fixed/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-tertiary-container" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
            </div>
          </div>
          <div>
            <div className="font-h2 text-h2 text-on-surface">{stats.total_filieres}</div>
            <div className="mt-xs font-body-md text-body-md text-on-surface-variant flex items-center gap-1">
              Filières enregistrées
            </div>
          </div>
        </div>
      </div>

      {/* Chart & Data Table Section */}
      <div className="grid grid-cols-12 gap-gutter">
        {/* Chart Module (Left) */}
        <div className="col-span-12 lg:col-span-5 bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex flex-col shadow-sm">
          <div className="mb-md">
            <h3 className="font-h3 text-h3 text-on-surface">{t('dashboard.breakdown_title')}</h3>
            <p className="font-body-md text-body-md text-on-surface-variant">{t('dashboard.breakdown_subtitle')}</p>
          </div>
          {/* Visual Chart Area */}
          <div className="flex-1 flex flex-col justify-center py-4">
            <div className="w-full h-8 rounded-full overflow-hidden flex bg-surface-container shadow-inner mb-md border border-outline-variant/30">
              <div className="bg-primary h-full" style={{ width: `${stats.type_stats.CM}%` }} title={`CM: ${stats.type_stats.CM}%`}></div>
              <div className="bg-secondary-container h-full" style={{ width: `${stats.type_stats.TD}%` }} title={`TD: ${stats.type_stats.TD}%`}></div>
              <div className="bg-tertiary-container h-full" style={{ width: `${stats.type_stats.TP}%` }} title={`TP: ${stats.type_stats.TP}%`}></div>
            </div>
            {/* Legend */}
            <div className="flex flex-col gap-sm mt-4 px-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-primary"></span>
                  <span className="font-body-md text-body-md text-on-surface">{t('dashboard.legend_cm')}</span>
                </div>
                <span className="font-h3 text-h3 text-on-surface">{stats.type_stats.CM}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-secondary-container"></span>
                  <span className="font-body-md text-body-md text-on-surface">{t('dashboard.legend_td')}</span>
                </div>
                <span className="font-h3 text-h3 text-on-surface">{stats.type_stats.TD}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-tertiary-container"></span>
                  <span className="font-body-md text-body-md text-on-surface">{t('dashboard.legend_tp')}</span>
                </div>
                <span className="font-h3 text-h3 text-on-surface">{stats.type_stats.TP}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table Module (Right) */}
        <div className="col-span-12 lg:col-span-7 bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col shadow-sm lg:h-[400px]">
          <div className="p-md border-b border-outline-variant flex justify-between items-center bg-surface">
            <div>
              <h3 className="font-h3 text-h3 text-on-surface">{t('dashboard.table_title')}</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">{t('dashboard.table_subtitle')}</p>
            </div>
          </div>
          <div className="overflow-auto flex-1 modern-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-lowest border-b border-outline-variant sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="py-sm px-md font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">{t('dashboard.table_col_name')}</th>
                  <th className="py-sm px-md font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">{t('dashboard.table_col_level')}</th>
                  <th className="py-sm px-md font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider text-right">{t('dashboard.table_col_hours')}</th>
                  <th className="py-sm px-md font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider text-center">{t('dashboard.table_col_status')}</th>
                </tr>
              </thead>
              <tbody className="font-table-data text-table-data text-on-surface">
                {stats.filieres.map((filiere: any, index: number) => (
                  <tr key={index} className="h-[48px] border-b border-outline-variant even:bg-surface-container-low hover:bg-surface-container transition-colors">
                    <td className="py-sm px-md font-medium">{filiere.name}</td>
                    <td className="py-sm px-md text-on-surface-variant">{filiere.level}</td>
                    <td className="py-sm px-md text-right font-medium">{filiere.totalHours.toLocaleString()}</td>
                    <td className="py-sm px-md text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                        filiere.status === 'Validated' ? 'bg-primary-fixed text-on-primary-fixed' :
                        filiere.status === 'In Review' ? 'bg-secondary-fixed text-on-secondary-fixed' :
                        'bg-surface-variant text-on-surface-variant border border-outline-variant'
                      }`}>
                        {filiere.status === 'Validated' ? t('dashboard.status.validated') : 
                         filiere.status === 'In Review' ? t('dashboard.status.review') : 
                         t('dashboard.status.draft')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
