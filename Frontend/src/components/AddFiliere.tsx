import React from 'react';
import { Link } from 'react-router-dom';

const AddFiliere: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-outline mb-2 font-table-data">
          <Link to="/programs" className="hover:text-primary transition-colors">Filières</Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-on-surface">New Program Entry</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="font-h1 text-h1 text-on-surface tracking-tight">Create New Filière</h1>
          <span className="bg-surface-variant text-on-surface-variant px-3 py-1 rounded-full font-label-caps text-label-caps border border-outline-variant uppercase tracking-wider">Draft Mode</span>
        </div>
        <p className="font-body-lg text-body-lg text-on-surface-variant mt-2 max-w-2xl">Define the core structure, academic level, and administrative department for the new academic program.</p>
      </div>

      {/* Multi-Step Stepper Component */}
      <div className="w-full relative py-4">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-surface-variant -z-10 -translate-y-1/2 rounded-full"></div>
        <div className="absolute top-1/2 left-0 w-1/3 h-0.5 bg-primary -z-10 -translate-y-1/2 rounded-full"></div>
        <ul className="flex justify-between items-center w-full relative z-0">
          <li className="flex flex-col items-center gap-2 bg-surface px-2">
            <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-sm border-2 border-surface">
              <span className="font-label-caps text-label-caps">01</span>
            </div>
            <span className="font-h3 text-sm text-on-surface whitespace-nowrap">General Info</span>
          </li>
          <li className="flex flex-col items-center gap-2 bg-surface px-2 opacity-60">
            <div className="w-10 h-10 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center border-2 border-surface">
              <span className="font-label-caps text-label-caps">02</span>
            </div>
            <span className="font-body-md text-sm text-on-surface-variant whitespace-nowrap">Modules Selection</span>
          </li>
          <li className="flex flex-col items-center gap-2 bg-surface px-2 opacity-60">
            <div className="w-10 h-10 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center border-2 border-surface">
              <span className="font-label-caps text-label-caps">03</span>
            </div>
            <span className="font-body-md text-sm text-on-surface-variant whitespace-nowrap">Review & Publish</span>
          </li>
        </ul>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl border border-surface-variant shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-surface-variant bg-surface-bright flex items-center gap-3">
            <span className="material-symbols-outlined text-primary-container">info</span>
            <h2 className="font-h3 text-h3 text-on-surface">Program Details</h2>
          </div>
          <div className="p-6 flex-1 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider" htmlFor="program-title">Program Title <span className="text-error">*</span></label>
              <input className="w-full px-4 py-3 bg-surface-bright border border-outline-variant rounded-lg font-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-outline/60" id="program-title" placeholder="e.g., Licence Informatique" type="text" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider" htmlFor="academic-level">Academic Level <span className="text-error">*</span></label>
                <select className="w-full px-4 py-3 bg-surface-bright border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors cursor-pointer" id="academic-level">
                  <option disabled selected value="">Select Level...</option>
                  <option value="L1">Licence 1 (L1)</option>
                  <option value="L2">Licence 2 (L2)</option>
                  <option value="L3">Licence 3 (L3)</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider" htmlFor="department">Department <span className="text-error">*</span></label>
                <select className="w-full px-4 py-3 bg-surface-bright border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors cursor-pointer" id="department">
                  <option disabled selected value="">Assign to Department...</option>
                  <option value="cs">Computer Science & IT</option>
                  <option value="math">Mathematics</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <div className="bg-surface-container-lowest rounded-xl border border-surface-variant shadow-sm p-6">
            <h3 className="font-h3 text-h3 text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-outline text-[20px]">settings_suggest</span>
              Configuration
            </h3>
            <div className="flex items-center justify-between py-3 border-b border-surface-variant">
              <div className="flex flex-col">
                <span className="font-body-md font-medium text-on-surface">Status</span>
                <span className="font-table-data text-xs text-on-surface-variant">Visibility state</span>
              </div>
              <span className="bg-surface-container text-on-surface px-2 py-1 rounded text-xs font-label-caps border border-outline-variant uppercase tracking-wider">Draft</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-surface-variant pt-6 pb-12">
        <Link to="/programs" className="px-6 py-2.5 rounded-lg font-label-caps text-label-caps text-on-surface-variant border border-outline-variant hover:bg-surface-variant transition-colors flex items-center gap-2 uppercase tracking-wider">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Cancel
        </Link>
        <button className="px-8 py-2.5 rounded-lg bg-secondary-container text-on-secondary-container font-label-caps text-label-caps hover:bg-opacity-90 transition-colors shadow-sm flex items-center gap-2 uppercase tracking-wider">
          Proceed to Modules
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};

export default AddFiliere;
