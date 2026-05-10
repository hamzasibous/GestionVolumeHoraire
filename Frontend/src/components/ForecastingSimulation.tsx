import React from 'react';

const ForecastingSimulation: React.FC = () => {
  return (
    <div className="flex flex-col gap-lg">
      {/* Page Header */}
      <div className="flex justify-between items-end border-b border-outline-variant pb-md">
        <div>
          <h2 className="font-h1 text-h1 text-on-background mb-xs">Forecast & Simulation</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">Project workload and capacity for the upcoming academic year based on current parameters.</p>
        </div>
        <button className="bg-primary hover:bg-primary-container hover:text-on-primary-container text-on-primary font-h3 text-sm px-6 py-2.5 rounded shadow-sm transition-colors flex items-center gap-2 h-fit">
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>play_arrow</span>
          Simulate Next Year
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-gutter">
        {/* Scenario Inputs Card */}
        <div className="col-span-12 xl:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-lg p-md shadow-[0_4px_12px_rgba(0,0,0,0.02)] flex flex-col h-full">
          <div className="flex items-center gap-2 mb-md">
            <span className="material-symbols-outlined text-secondary-container">tune</span>
            <h3 className="font-h3 text-h3 text-on-background">Scenario Parameters</h3>
          </div>
          <div className="flex flex-col gap-sm flex-1">
            <div className="flex flex-col gap-xs">
              <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Estimated Student Growth</label>
              <div className="relative">
                <input className="w-full bg-surface border border-outline-variant rounded focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md text-on-background py-2 px-3 pr-8 shadow-sm" type="number" defaultValue="5.2" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-body-md text-outline-variant">%</span>
              </div>
              <p className="text-xs text-outline mt-1">Based on demographic trends</p>
            </div>
            <div className="flex flex-col gap-xs mt-2">
              <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">New Modules Planned</label>
              <input className="w-full bg-surface border border-outline-variant rounded focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md text-on-background py-2 px-3 shadow-sm" type="number" defaultValue="12" />
            </div>
          </div>
          <div className="mt-md pt-md border-t border-outline-variant">
            <button className="w-full bg-surface text-primary border border-outline-variant hover:bg-surface-container-low font-body-md font-medium py-2 rounded transition-colors">
              Reset to Baseline
            </button>
          </div>
        </div>

        {/* Bento Stats Area */}
        <div className="col-span-12 xl:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-gutter h-full">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-md shadow-[0_4px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <h4 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Predicted Total Workload</h4>
              <span className="material-symbols-outlined text-outline">calendar_clock</span>
            </div>
            <div className="mt-4">
              <div className="font-h1 text-4xl text-on-background font-bold tracking-tight">42,850 <span className="text-base font-normal text-outline-variant">hrs</span></div>
              <div className="flex items-center gap-1 mt-2 text-error">
                <span className="material-symbols-outlined text-sm">trending_up</span>
                <span className="font-body-md text-sm font-medium">+4.2% vs current year</span>
              </div>
            </div>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-md shadow-[0_4px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <h4 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Estimated Capacity Gap</h4>
              <span className="material-symbols-outlined text-secondary-container">warning</span>
            </div>
            <div className="mt-4">
              <div className="font-h1 text-4xl text-secondary-container font-bold tracking-tight">-1,240 <span className="text-base font-normal text-outline-variant">hrs</span></div>
              <div className="flex items-center gap-1 mt-2 text-on-surface-variant">
                <span className="font-body-md text-sm">Additional resources required to meet demand</span>
              </div>
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-lg p-md shadow-[0_4px_12px_rgba(0,0,0,0.02)] flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h3 className="font-h3 text-h3 text-on-background">Capacity vs. Demand Simulation</h3>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-primary opacity-30"></div>
                  <span className="font-label-caps text-[10px] text-on-surface-variant uppercase">Current Capacity</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-primary"></div>
                  <span className="font-label-caps text-[10px] text-on-surface-variant uppercase">Simulated Demand</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-secondary-container"></div>
                  <span className="font-label-caps text-[10px] text-on-surface-variant uppercase">Deficit</span>
                </div>
              </div>
            </div>
            {/* Simple CSS Bar Chart Area */}
            <div className="flex-1 flex flex-col justify-end gap-6 pb-2 px-4 border-l border-b border-outline-variant relative min-h-[200px] mt-4">
               <div className="absolute left-[-40px] top-0 h-full flex flex-col justify-between text-xs text-outline-variant font-table-data text-right pr-2">
                <span>15k</span>
                <span>10k</span>
                <span>5k</span>
                <span>0</span>
              </div>
              <div className="flex justify-around items-end h-[160px] w-full">
                <div className="flex flex-col items-center gap-2 w-16 h-full">
                  <div className="w-full flex items-end justify-center relative h-full">
                    <div className="absolute bottom-0 w-8 bg-primary opacity-20 rounded-t-sm" style={{ height: '80%' }}></div>
                    <div className="absolute bottom-0 w-8 bg-primary rounded-t-sm border-r-2 border-surface-container-lowest z-10" style={{ height: '75%' }}></div>
                  </div>
                  <span className="font-label-caps text-[11px] text-on-surface-variant uppercase">Sciences</span>
                </div>
                <div className="flex flex-col items-center gap-2 w-16 h-full">
                  <div className="w-full flex items-end justify-center relative h-full">
                    <div className="absolute bottom-0 w-8 bg-primary opacity-20 rounded-t-sm" style={{ height: '60%' }}></div>
                    <div className="absolute bottom-0 w-8 bg-primary rounded-t-sm border-r-2 border-surface-container-lowest z-10" style={{ height: '85%' }}></div>
                    <div className="absolute bottom-[60%] w-8 bg-secondary-container rounded-t-sm z-20" style={{ height: '25%' }}></div>
                  </div>
                  <span className="font-label-caps text-[11px] text-on-surface-variant uppercase">Eng.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations Section */}
      <div className="mt-4">
        <h3 className="font-h2 text-h2 text-on-background mb-md">System Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
          <div className="bg-surface-container-lowest border border-outline-variant border-l-4 border-l-secondary-container rounded-lg p-4 shadow-sm flex gap-4">
            <div className="w-10 h-10 rounded bg-secondary-container/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-secondary-container">person_add</span>
            </div>
            <div>
              <h4 className="font-h3 text-sm text-on-background mb-1">Hire Adjunct Faculty</h4>
              <p className="font-body-md text-xs text-on-surface-variant">Engineering department requires approx. 3 FTE equivalents to cover the 12% projected volume increase.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForecastingSimulation;
