import React from 'react';
import { Link } from 'react-router-dom';

const ProgramsManagement: React.FC = () => {
  return (
    <div className="flex flex-col gap-lg">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-h1 text-h1 text-on-surface">Programs & Courses Management</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">Manage Filières, Modules, and detailed Course allocations.</p>
        </div>
        <Link to="/programs/new" className="bg-primary hover:bg-primary/90 text-on-primary px-6 py-2 rounded-lg font-body-md text-body-md flex items-center gap-2 transition-colors shadow-sm uppercase tracking-wider">
          <span className="material-symbols-outlined text-[20px]">add</span>
          Add New Filière
        </Link>
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
            {/* Active Item */}
            <div className="p-4 border-l-4 border-secondary-container bg-surface-container-low cursor-pointer hover:bg-surface-container transition-colors border-b border-outline-variant">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-h3 text-h3 text-on-surface">Licence Informatique</h3>
                <span className="bg-primary-fixed text-on-primary-fixed px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider">L3</span>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant text-sm mb-3">Computer Science Undergrad</p>
              <div className="flex items-center justify-between text-xs text-outline">
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">folder</span> 12 Modules</span>
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">schedule</span> 450h Total</span>
              </div>
            </div>
            {/* Inactive Item */}
            <div className="p-4 border-l-4 border-transparent cursor-pointer hover:bg-surface-container transition-colors border-b border-outline-variant">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-h3 text-h3 text-on-surface">Master Big Data</h3>
                <span className="bg-tertiary-fixed text-on-tertiary-fixed px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider">M2</span>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant text-sm mb-3">Data Science & Analytics</p>
              <div className="flex items-center justify-between text-xs text-outline">
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">folder</span> 8 Modules</span>
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">schedule</span> 320h Total</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Detail View */}
        <div className="col-span-8 flex flex-col gap-md">
          {/* Module Header */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm flex flex-col gap-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-primary-fixed text-on-primary-fixed px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">L3</span>
                  <span className="text-outline font-label-caps text-label-caps uppercase tracking-wider">Licence Informatique</span>
                </div>
                <h2 className="font-h2 text-h2 text-on-surface">Module: Advanced Web Technologies</h2>
              </div>
              <div className="flex gap-3">
                <button className="px-4 py-2 border border-outline-variant text-on-surface rounded-lg hover:bg-surface-container transition-colors font-body-md text-body-md flex items-center gap-2 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                  Edit
                </button>
                <button className="px-4 py-2 bg-secondary-container text-on-secondary-container rounded-lg hover:bg-secondary-container/90 transition-colors font-body-md text-body-md flex items-center gap-2 shadow-sm uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[18px]">add_box</span>
                  Add Course
                </button>
              </div>
            </div>
            {/* Progress/Stats */}
            <div className="grid grid-cols-3 gap-6">
              <div className="p-4 bg-surface-bright border border-surface-variant rounded-lg">
                <div className="text-outline font-label-caps text-label-caps mb-1 uppercase tracking-wider">Total Hours Assigned</div>
                <div className="font-h2 text-h2 text-on-surface">45<span className="text-sm font-normal text-outline">/60</span></div>
                <div className="w-full bg-surface-container-high h-2 rounded-full mt-3">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
            </div>
          </div>
          {/* Courses Table */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant bg-surface-bright flex justify-between items-center">
              <h3 className="font-h3 text-h3 text-on-surface">Courses Allocation</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-lowest border-b border-outline-variant">
                    <th className="px-6 py-3 font-label-caps text-label-caps text-outline uppercase tracking-wider">Course Name</th>
                    <th className="px-6 py-3 font-label-caps text-label-caps text-outline uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="font-table-data text-table-data divide-y divide-surface-variant">
                  <tr className="hover:bg-surface-container-lowest/50 transition-colors bg-white">
                    <td className="px-6 py-4">
                      <div className="font-medium text-on-surface">Frontend Development (React)</div>
                      <div className="text-xs text-outline mt-1">CM: Lecture</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-outline hover:text-primary transition-colors p-1">
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                    </td>
                  </tr>
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
