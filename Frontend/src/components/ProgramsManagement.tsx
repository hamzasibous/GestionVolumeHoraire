import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface Seance {
  id: string;
  name: string;
  type: 'CM' | 'TD' | 'TP';
  teacher: string;
  room: string;
  volume: number;
}

interface Module {
  id: string;
  name: string;
  totalHours: number;
  assignedHours: number;
  seances: Seance[];
}

interface Filiere {
  id: string;
  name: string;
  level: string;
  description: string;
  modules: Module[];
}

const mockFilieres: Filiere[] = [
  {
    id: '1',
    name: 'Licence Informatique',
    level: 'L3',
    description: 'Computer Science Undergrad',
    modules: [
      {
        id: 'm1',
        name: 'Advanced Web Technologies',
        totalHours: 60,
        assignedHours: 45,
        seances: [
          { id: 's1', name: 'Frontend Development (React)', type: 'CM', teacher: 'Dr. Robert', room: 'Amphi A', volume: 15 },
          { id: 's2', name: 'Backend API (Node.js)', type: 'TD', teacher: 'Prof. Smith', room: 'Salle 204', volume: 15 },
          { id: 's3', name: 'Fullstack Project', type: 'TP', teacher: 'Unassigned', room: 'Pending', volume: 15 },
        ]
      },
      { id: 'm2', name: 'Database Administration', totalHours: 45, assignedHours: 0, seances: [] },
      { id: 'm3', name: 'Network Security', totalHours: 45, assignedHours: 0, seances: [] },
    ]
  },
  {
    id: '2',
    name: 'Master Big Data',
    level: 'M2',
    description: 'Data Science & Analytics',
    modules: [
      { id: 'm4', name: 'Machine Learning', totalHours: 60, assignedHours: 0, seances: [] },
      { id: 'm5', name: 'Big Data Architecture', totalHours: 60, assignedHours: 0, seances: [] },
    ]
  }
];

const ProgramsManagement: React.FC = () => {
  const [selectedFiliereId, setSelectedFiliereId] = useState<string>(mockFilieres[0].id);
  const [selectedModuleId, setSelectedModuleId] = useState<string>(mockFilieres[0].modules[0].id);

  const selectedFiliere = mockFilieres.find(f => f.id === selectedFiliereId) || mockFilieres[0];
  const selectedModule = selectedFiliere.modules.find(m => m.id === selectedModuleId) || selectedFiliere.modules[0];

  return (
    <div className="flex flex-col gap-lg">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-h1 text-h1 text-on-surface">Programs & Séances Management</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">Manage Filières, Modules, and detailed Séance allocations.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/programs/new-module" className="border border-outline text-on-surface hover:bg-surface-container-high px-6 py-2 rounded-lg font-body-md text-body-md flex items-center gap-2 transition-colors shadow-sm uppercase tracking-wider font-bold">
            <span className="material-symbols-outlined text-[20px]">add</span>
            Create Module
          </Link>
          <Link to="/programs/new" className="bg-primary hover:bg-primary/90 text-on-primary px-6 py-2 rounded-lg font-body-md text-body-md flex items-center gap-2 transition-colors shadow-sm uppercase tracking-wider font-bold">
            <span className="material-symbols-outlined text-[20px]">add</span>
            Add New Filière
          </Link>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-12 gap-gutter items-start">
        {/* Left Column: Filières List */}
        <div className="col-span-4 flex flex-col gap-md">
          {/* Search & Filter */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
            <div className="relative focus-within:ring-2 focus-within:ring-primary rounded-lg">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
              <input className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-lg text-sm bg-surface-bright focus:border-transparent focus:ring-0" placeholder="Search Filières..." type="text" />
            </div>
            <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
              <button className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full font-label-caps text-label-caps whitespace-nowrap uppercase tracking-wider">All</button>
              <button className="px-3 py-1 bg-surface-container border border-outline-variant text-on-surface rounded-full font-label-caps text-label-caps whitespace-nowrap hover:bg-surface-container-high transition-colors uppercase tracking-wider">Licence</button>
              <button className="px-3 py-1 bg-surface-container border border-outline-variant text-on-surface rounded-full font-label-caps text-label-caps whitespace-nowrap hover:bg-surface-container-high transition-colors uppercase tracking-wider">Master</button>
            </div>
          </div>
          {/* List */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
            {mockFilieres.map((filiere) => (
              <div key={filiere.id} className="border-b border-outline-variant">
                <div 
                  onClick={() => {
                    setSelectedFiliereId(filiere.id);
                    setSelectedModuleId(filiere.modules[0]?.id || '');
                  }}
                  className={`p-4 border-l-4 cursor-pointer hover:bg-surface-container transition-colors ${
                    selectedFiliereId === filiere.id ? 'border-secondary-container bg-surface-container-low' : 'border-transparent'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-h3 text-h3 text-on-surface">{filiere.name}</h3>
                    <div className="flex items-center gap-1">
                      <span className="bg-primary-fixed text-on-primary-fixed px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider">{filiere.level}</span>
                      <span className="material-symbols-outlined text-outline">expand_more</span>
                    </div>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant text-sm mb-3">{filiere.description}</p>
                  <div className="flex items-center justify-between text-xs text-outline">
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">folder</span> {filiere.modules.length} Modules</span>
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">schedule</span> {filiere.modules.reduce((acc, m) => acc + m.totalHours, 0)}h Total</span>
                  </div>
                </div>
                {/* Nested Modules List */}
                {selectedFiliereId === filiere.id && (
                  <div className="bg-surface-container-lowest py-2 border-t border-outline-variant">
                    {filiere.modules.map((m) => (
                      <div 
                        key={m.id}
                        onClick={() => setSelectedModuleId(m.id)}
                        className={`px-6 py-2 cursor-pointer transition-colors flex items-center justify-between ${
                          selectedModuleId === m.id ? 'bg-primary-container/10 border-l-4 border-primary text-primary font-medium' : 'hover:bg-surface-container-low text-on-surface-variant'
                        }`}
                      >
                        <span className="text-sm">{m.name}</span>
                        {selectedModuleId === m.id && <span className="material-symbols-outlined text-[16px]">chevron_right</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Detail View */}
        <div className="col-span-8 flex flex-col gap-md">
          {/* Module Header */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm flex flex-col gap-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-primary-fixed text-on-primary-fixed px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">{selectedFiliere.level}</span>
                  <span className="text-outline font-label-caps text-label-caps uppercase tracking-wider">{selectedFiliere.name}</span>
                </div>
                <h2 className="font-h2 text-h2 text-on-surface tracking-tight font-bold">{selectedFiliere.name}</h2>
                <p className="text-on-surface-variant text-sm mt-1 italic leading-relaxed">"{selectedFiliere.description}"</p>
                <div className="mt-4 border-t border-outline-variant/30 pt-4">
                   <h3 className="text-primary font-h3 text-sm font-bold uppercase tracking-widest">Active Module: {selectedModule.name}</h3>
                </div>
              </div>
              <div className="flex gap-3">
                <Link to="/timetable" className="px-4 py-2 bg-secondary-container text-on-secondary-container rounded-lg hover:bg-secondary-container/90 transition-colors font-body-md text-body-md flex items-center gap-2 shadow-sm uppercase tracking-wider font-bold">
                  <span className="material-symbols-outlined text-[18px]">add_box</span>
                  Add/Edit Séance
                </Link>
              </div>
            </div>
            {/* Progress/Stats */}
            <div className="grid grid-cols-2 gap-6">
              <div className="p-4 bg-surface-bright border border-surface-variant rounded-lg">
                <div className="text-outline font-label-caps text-label-caps mb-1 uppercase tracking-wider">Total Hours Assigned</div>
                <div className="font-h2 text-h2 text-on-surface">{selectedModule.assignedHours}<span className="text-sm font-normal text-outline">/{selectedModule.totalHours}</span></div>
                <div className="w-full bg-surface-container-high h-2 rounded-full mt-3">
                  <div className="bg-primary h-2 rounded-full" style={{ width: `${(selectedModule.assignedHours / selectedModule.totalHours) * 100}%` }}></div>
                </div>
              </div>
              <div className="p-4 bg-surface-bright border border-surface-variant rounded-lg">
                <div className="text-outline font-label-caps text-label-caps mb-1 uppercase tracking-wider">Séances</div>
                <div className="font-h2 text-h2 text-on-surface">{selectedModule.seances.length}</div>
              </div>
            </div>
          </div>
          {/* Séances Table */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant bg-surface-bright flex justify-between items-center">
              <h3 className="font-h3 text-h3 text-on-surface">Séances Allocation</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-lowest border-b border-outline-variant">
                    <th className="px-6 py-3 font-label-caps text-label-caps text-outline uppercase tracking-wider">Séance Name</th>
                    <th className="px-6 py-3 font-label-caps text-label-caps text-outline uppercase tracking-wider">Teacher</th>
                    <th className="px-6 py-3 font-label-caps text-label-caps text-outline uppercase tracking-wider">Room</th>
                    <th className="px-6 py-3 font-label-caps text-label-caps text-outline uppercase tracking-wider">Volume (h)</th>
                    <th className="px-6 py-3 font-label-caps text-label-caps text-outline uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="font-table-data text-table-data divide-y divide-surface-variant">
                  {selectedModule.seances.length > 0 ? selectedModule.seances.map((seance) => (
                    <tr key={seance.id} className="hover:bg-surface-container-lowest/50 transition-colors bg-white">
                      <td className="px-6 py-4">
                        <div className="font-medium text-on-surface">{seance.name}</div>
                        <div className="text-xs text-outline mt-1">{seance.type}: {seance.type === 'CM' ? 'Lecture' : seance.type === 'TD' ? 'Tutorial' : 'Practical Work'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {seance.teacher === 'Unassigned' ? (
                            <span className="px-2 py-1 bg-error-container text-on-error-container text-xs rounded-full font-medium">Unassigned</span>
                          ) : (
                            <>
                              <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-xs font-bold uppercase">
                                {seance.teacher.split(' ').map(n => n[0]).join('')}
                              </div>
                              <span className="text-on-surface">{seance.teacher}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-on-surface">
                        <span className={seance.room === 'Pending' ? 'text-outline italic' : ''}>{seance.room}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-surface-container-high rounded text-xs font-medium text-on-surface-variant">{seance.volume}h</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-outline hover:text-primary transition-colors p-1">
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant opacity-60">
                        No séances assigned to this module yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgramsManagement;
