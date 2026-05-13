import React, { useState } from 'react';

interface DepartmentStats {
  name: string;
  capacity: number;
  demand: number;
}

const initialStats: DepartmentStats[] = [
  { name: 'Sciences', capacity: 12000, demand: 11250 },
  { name: 'Engineering', capacity: 9000, demand: 12750 },
  { name: 'Arts', capacity: 13500, demand: 12750 },
  { name: 'Business', capacity: 6750, demand: 8250 },
];

const ForecastingSimulation: React.FC = () => {
  const [growth, setGrowth] = useState<number>(5.2);
  const [newModules, setNewModules] = useState<number>(12);
  const [stats, setStats] = useState<DepartmentStats[]>(initialStats);

  const totalDemand = stats.reduce((acc, s) => acc + s.demand, 0);
  const totalCapacity = stats.reduce((acc, s) => acc + s.capacity, 0);
  const gap = totalCapacity - totalDemand;

  const handleSimulate = () => {
    // Simulate impact of growth and new modules
    const multiplier = 1 + (growth / 100);
    const updatedStats = stats.map(s => ({
      ...s,
      demand: Math.round((s.demand + (newModules * 10)) * multiplier)
    }));
    setStats(updatedStats);
  };

  const handleReset = () => {
    setStats(initialStats);
    setGrowth(5.2);
    setNewModules(12);
  };

  return (
    <div className="flex flex-col gap-lg max-w-[1400px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-end border-b border-outline-variant pb-md gap-4">
        <div>
          <h2 className="font-h1 text-h1 text-on-background mb-xs tracking-tight">Forecast & Simulation</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">Project workload and capacity for the upcoming academic year based on current parameters.</p>
        </div>
        <button 
          onClick={handleSimulate}
          className="bg-primary hover:bg-primary/90 text-on-primary font-h3 text-sm px-6 py-2.5 rounded shadow-sm transition-all flex items-center gap-2 h-fit active:scale-95 uppercase tracking-wider"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>play_arrow</span>
          Simulate Next Year
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-gutter">
        {/* Scenario Inputs Card */}
        <div className="col-span-12 xl:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-lg p-md shadow-sm flex flex-col h-full">
          <div className="flex items-center gap-2 mb-md border-b border-outline-variant pb-sm">
            <span className="material-symbols-outlined text-secondary-container">tune</span>
            <h3 className="font-h3 text-h3 text-on-background tracking-tight">Scenario Parameters</h3>
          </div>
          <div className="flex flex-col gap-sm flex-1">
            <div className="flex flex-col gap-xs">
              <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Estimated Student Growth</label>
              <div className="relative">
                <input 
                  className="w-full bg-surface-bright border border-outline-variant rounded focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md text-on-background py-2 px-3 pr-8 shadow-sm transition-colors outline-none" 
                  type="number" 
                  value={growth}
                  onChange={(e) => setGrowth(parseFloat(e.target.value))}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-body-md text-outline-variant">%</span>
              </div>
              <p className="text-xs text-outline mt-1 italic">Based on demographic trends</p>
            </div>
            <div className="flex flex-col gap-xs mt-4">
              <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">New Modules Planned</label>
              <input 
                className="w-full bg-surface-bright border border-outline-variant rounded focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md text-on-background py-2 px-3 shadow-sm transition-colors outline-none" 
                type="number" 
                value={newModules}
                onChange={(e) => setNewModules(parseInt(e.target.value))}
              />
            </div>
          </div>
          <div className="mt-md pt-md border-t border-outline-variant">
            <button 
              onClick={handleReset}
              className="w-full bg-surface-bright text-primary border border-outline-variant hover:bg-surface-container-low font-body-md font-medium py-2 rounded transition-colors uppercase tracking-wider text-xs"
            >
              Reset to Baseline
            </button>
          </div>
        </div>

        {/* Bento Stats Area */}
        <div className="col-span-12 xl:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-gutter h-full">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-md shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <h4 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Predicted Total Workload</h4>
              <span className="material-symbols-outlined text-outline">calendar_clock</span>
            </div>
            <div className="mt-4">
              <div className="font-h1 text-4xl text-on-background font-bold tracking-tight">{totalDemand.toLocaleString()} <span className="text-base font-normal text-outline-variant">hrs</span></div>
              <div className={`flex items-center gap-1 mt-2 ${totalDemand > totalCapacity ? 'text-error' : 'text-primary'}`}>
                <span className="material-symbols-outlined text-sm">{totalDemand > totalCapacity ? 'trending_up' : 'trending_down'}</span>
                <span className="font-body-md text-sm font-medium">
                  {((totalDemand / 41100 - 1) * 100).toFixed(1)}% vs baseline
                </span>
              </div>
            </div>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-md shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <h4 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Estimated Capacity Gap</h4>
              <span className="material-symbols-outlined text-secondary-container">warning</span>
            </div>
            <div className="mt-4">
              <div className={`font-h1 text-4xl font-bold tracking-tight ${gap < 0 ? 'text-secondary-container' : 'text-primary'}`}>
                {gap > 0 ? '+' : ''}{gap.toLocaleString()} <span className="text-base font-normal text-outline-variant">hrs</span>
              </div>
              <div className="flex items-center gap-1 mt-2 text-on-surface-variant">
                <span className="font-body-md text-sm">
                  {gap < 0 ? 'Additional resources required to meet demand' : 'Sufficient capacity for projected demand'}
                </span>
              </div>
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-lg p-md shadow-sm flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-outline-variant pb-sm">
              <h3 className="font-h3 text-h3 text-on-background tracking-tight">Capacity vs. Demand Simulation</h3>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-primary opacity-30"></div>
                  <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Current Capacity</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-primary"></div>
                  <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Simulated Demand</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-secondary-container"></div>
                  <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Deficit</span>
                </div>
              </div>
            </div>
            
            {/* SVG-based Bar Chart */}
            <div className="flex-1 flex flex-col justify-end gap-6 pb-2 px-4 relative min-h-[200px] mt-4">
              <div className="absolute left-[-20px] top-0 h-full flex flex-col justify-between text-[10px] text-outline-variant font-table-data text-right pr-2 opacity-60">
                <span>15k</span>
                <span>10k</span>
                <span>5k</span>
                <span>0</span>
              </div>
              <div className="flex justify-around items-end h-[160px] w-full border-l border-b border-outline-variant/50">
                {stats.map((s, index) => {
                  const maxVal = 15000;
                  const capHeight = (s.capacity / maxVal) * 100;
                  const demHeight = (s.demand / maxVal) * 100;
                  const deficit = s.demand > s.capacity ? ((s.demand - s.capacity) / maxVal) * 100 : 0;
                  
                  return (
                    <div key={index} className="flex flex-col items-center gap-2 w-1/4 h-full group">
                      <div className="w-full flex items-end justify-center relative h-full">
                        {/* Capacity (Background Bar) */}
                        <div 
                          className="absolute bottom-0 w-8 bg-primary opacity-20 rounded-t-sm transition-all duration-700" 
                          style={{ height: `${capHeight}%` }}
                        ></div>
                        {/* Demand (Foreground Bar) */}
                        <div 
                          className="absolute bottom-0 w-8 bg-primary rounded-t-sm border-r-2 border-surface-container-lowest z-10 transition-all duration-700" 
                          style={{ height: `${Math.min(demHeight, capHeight)}%` }}
                        ></div>
                        {/* Deficit overlay */}
                        {deficit > 0 && (
                          <div 
                            className="absolute w-8 bg-secondary-container rounded-t-sm z-20 transition-all duration-700" 
                            style={{ height: `${deficit}%`, bottom: `${capHeight}%` }}
                          ></div>
                        )}
                        
                        {/* Tooltip on hover */}
                        <div className="absolute -top-12 bg-on-surface text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none whitespace-nowrap shadow-lg">
                          Cap: {s.capacity.toLocaleString()}h / Dem: {s.demand.toLocaleString()}h
                        </div>
                      </div>
                      <span className="font-label-caps text-[11px] text-on-surface-variant uppercase font-bold mt-2">{s.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations Section */}
      <div className="mt-4">
        <h3 className="font-h2 text-h2 text-on-background mb-md tracking-tight">System Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
          <div className="bg-surface-container-lowest border border-outline-variant border-l-4 border-l-secondary-container rounded-lg p-4 shadow-sm flex gap-4 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded bg-secondary-container/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-secondary-container">person_add</span>
            </div>
            <div>
              <h4 className="font-h3 text-sm text-on-background mb-1 font-bold">Hire Adjunct Faculty</h4>
              <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">Engineering department requires approx. 3 FTE equivalents to cover the 12% projected volume increase.</p>
              <button className="mt-3 text-[10px] font-bold text-primary hover:text-primary-container uppercase tracking-widest flex items-center gap-1 transition-colors">
                View Details <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant border-l-4 border-l-primary rounded-lg p-4 shadow-sm flex gap-4 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary">call_split</span>
            </div>
            <div>
              <h4 className="font-h3 text-sm text-on-background mb-1 font-bold">Re-allocate Modules</h4>
              <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">Shift 4 introductory modules from Arts to Sciences to optimize under-utilized permanent faculty hours.</p>
              <button className="mt-3 text-[10px] font-bold text-primary hover:text-primary-container uppercase tracking-widest flex items-center gap-1 transition-colors">
                View Details <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForecastingSimulation;
