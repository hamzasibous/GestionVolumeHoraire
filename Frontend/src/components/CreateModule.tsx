import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface Filiere {
  id: number;
  nom: string;
}

const CreateModule: React.FC = () => {
  const navigate = useNavigate();
  const [moduleName, setModuleName] = useState('');
  const [selectedFiliere, setSelectedFiliere] = useState('');
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('http://localhost:8000/core/filiere/')
      .then(res => res.json())
      .then(data => setFilieres(data))
      .catch(err => console.error('Error fetching filieres:', err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/core/module/create-module/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: moduleName }),
      });
      
      if (response.ok) {
        const newModule = await response.json();
        
        // If a filiere is selected, affect it
        if (selectedFiliere) {
          await fetch('http://localhost:8000/core/module/affecter-filiere/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filiere: selectedFiliere,
              module: newModule.id,
              semestre: 'S1_l', // Default semester as per backend choices
            }),
          });
        }
        
        navigate('/programs');
      } else {
        alert('Failed to create module');
      }
    } catch (error) {
      console.error('Error creating module:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header & Breadcrumb */}
      <section className="flex flex-col gap-xs mt-md border-b border-outline-variant pb-md">
        <nav className="flex items-center gap-xs text-on-surface-variant font-label-caps text-[10px] uppercase font-bold tracking-widest">
          <Link to="/programs" className="hover:text-primary transition-colors">Programs</Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-primary">Create Module</span>
        </nav>
        <h2 className="font-h1 text-h1 text-on-surface tracking-tight font-bold">Create New Module</h2>
        <p className="text-on-surface-variant text-sm mt-1">Design a new educational unit with specific speciality and academic path.</p>
      </section>

      {/* Bento Form Layout */}
      <div className="grid grid-cols-12 gap-gutter">
        {/* Main Form Column */}
        <div className="col-span-12 lg:col-span-8">
          <form onSubmit={handleSubmit} className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant shadow-lg space-y-md">
            {/* Section Heading */}
            <div className="border-b border-outline-variant pb-sm mb-md flex items-center gap-base">
              <span className="material-symbols-outlined text-primary shadow-sm rounded p-1">assignment</span>
              <h3 className="font-h3 text-h3 font-bold uppercase text-xs tracking-widest text-primary">Module Identity</h3>
            </div>

            {/* Basic Info Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              <div className="flex flex-col gap-xs">
                <label className="font-label-caps text-on-surface-variant uppercase text-[10px] font-bold tracking-widest" htmlFor="module_name">Module Name</label>
                <input 
                  className="border-outline-variant border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary px-4 py-3 font-body-md text-on-surface bg-surface-bright outline-none transition-all shadow-inner" 
                  id="module_name" 
                  placeholder="e.g. Advanced Network Security" 
                  type="text" 
                  value={moduleName}
                  onChange={(e) => setModuleName(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-xs">
                <label className="font-label-caps text-on-surface-variant uppercase text-[10px] font-bold tracking-widest" htmlFor="speciality">Speciality</label>
                <select className="border-outline-variant border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary px-4 py-3 font-body-md text-on-surface bg-surface-bright outline-none transition-all cursor-pointer shadow-inner" id="speciality" required>
                  <option disabled selected value="">Select a Speciality</option>
                  <option value="networking">Networking</option>
                  <option value="software">Software</option>
                  <option value="cyber">Cyber</option>
                </select>
              </div>
            </div>

            {/* Optional Filière */}
            <div className="flex flex-col gap-xs">
              <label className="font-label-caps text-on-surface-variant uppercase text-[10px] font-bold tracking-widest" htmlFor="filiere">Filière (Optional)</label>
              <select 
                className="border-outline-variant border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary px-4 py-3 font-body-md text-on-surface bg-surface-bright outline-none transition-all cursor-pointer shadow-inner" 
                id="filiere"
                value={selectedFiliere}
                onChange={(e) => setSelectedFiliere(e.target.value)}
              >
                <option value="">Not Assigned</option>
                {filieres.map(f => (
                  <option key={f.id} value={f.id}>{f.nom}</option>
                ))}
              </select>
              <p className="text-[11px] text-on-surface-variant italic font-medium opacity-70">Selecting a Filière will enable specific academic path configurations.</p>
            </div>

            {/* Description Field */}
            <div className="flex flex-col gap-xs">
              <label className="font-label-caps text-on-surface-variant uppercase text-[10px] font-bold tracking-widest" htmlFor="description">Module Description</label>
              <textarea 
                id="description"
                rows={3}
                placeholder="Briefly describe the module's objectives and core topics..."
                className="border-outline-variant border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary px-4 py-3 font-body-md text-on-surface bg-surface-bright outline-none transition-all shadow-inner resize-none"
              ></textarea>
              <p className="text-[11px] text-on-surface-variant italic font-medium opacity-70">A concise summary for the academic catalog.</p>
            </div>

            {/* Conditional Section: Path Configuration */}
            <div className="p-md bg-surface-container-low/30 rounded-xl border border-outline-variant border-dashed space-y-md shadow-inner">
              <h4 className="font-label-caps text-on-surface-variant border-b border-outline-variant pb-xs uppercase text-[10px] font-bold tracking-widest opacity-80">Path Configuration</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div className="flex flex-col gap-xs md:col-span-2">
                  <label className="font-label-caps text-on-surface-variant uppercase text-[10px] font-bold tracking-widest" htmlFor="program_type">Program Type</label>
                  <select 
                    id="program_type"
                    className="border-outline-variant border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary px-4 py-3 font-body-md text-on-surface bg-surface-bright outline-none transition-all cursor-pointer shadow-inner"
                    required
                  >
                    <option value="licence">Licence</option>
                    <option value="licence_excellence">Licence Excellence</option>
                    <option value="licence_temps_amenage">Licence Temps Aménagé</option>
                    <option value="master">Master</option>
                    <option value="master_excellence">Master Excellence</option>
                    <option value="master_temps_amenage">Master Temps Aménagé</option>
                  </select>
                </div>
                <div className="flex flex-col gap-xs">
                  <label className="font-label-caps text-on-surface-variant uppercase text-[10px] font-bold tracking-widest" htmlFor="semester">Semester</label>
                  <select className="border-outline-variant border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary px-4 py-3 font-body-md text-on-surface bg-surface-bright outline-none shadow-inner" id="semester">
                    <option value="s1">S1</option>
                    <option value="s2">S2</option>
                    <option value="s3">S3</option>
                    <option value="s4">S4</option>
                    <option value="s5">S5</option>
                    <option value="s6">S6</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-md pt-md border-t border-outline-variant">
              <button 
                type="button"
                onClick={() => navigate('/programs')}
                className="px-lg py-base text-primary font-label-caps uppercase text-[10px] font-bold tracking-widest border border-primary rounded hover:bg-primary/5 transition-all active:scale-95"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={loading}
                className="px-lg py-base bg-primary text-on-primary font-label-caps uppercase text-[10px] font-bold tracking-widest rounded shadow-lg hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Module'}
              </button>
            </div>
          </form>
        </div>

        {/* Info Column */}
        <div className="col-span-12 lg:col-span-4 space-y-gutter">
          <div className="bg-surface-container-low/50 p-md rounded-xl border border-outline-variant flex flex-col gap-base shadow-sm">
            <div className="flex items-center gap-xs border-b border-outline-variant pb-2 mb-2">
              <span className="material-symbols-outlined text-secondary text-sm">info</span>
              <h3 className="font-h3 text-h3 text-secondary font-bold uppercase text-[10px] tracking-widest">Creation Guidelines</h3>
            </div>
            <ul className="space-y-sm">
              <li className="flex items-start gap-xs text-[11px] text-on-surface-variant font-medium leading-relaxed">
                <span className="material-symbols-outlined text-[16px] mt-0.5 text-primary">check_circle</span>
                Ensure module names follow the official academic catalog nomenclature.
              </li>
              <li className="flex items-start gap-xs text-[11px] text-on-surface-variant font-medium leading-relaxed">
                <span className="material-symbols-outlined text-[16px] mt-0.5 text-primary">check_circle</span>
                Modules in "Licence" must be mapped to semesters S1 through S6.
              </li>
              <li className="flex items-start gap-xs text-[11px] text-on-surface-variant font-medium leading-relaxed">
                <span className="material-symbols-outlined text-[16px] mt-0.5 text-primary">check_circle</span>
                Core specialities (Cyber, Software) require validation by the Department Head.
              </li>
            </ul>
          </div>
          <div className="relative h-64 rounded-xl overflow-hidden border border-outline-variant shadow-lg group">
            <img 
              alt="Lab" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC4-MGh7hnVkedK_1dNsiORO-EQEMQezI3KcYT3l88gP14dJR_Ae3lXLWwjwy1aGMg8m4YX9TepsecdbYqcp9bqh3aAR6jazzmqfpfMoRwEfmQ8TLmaTbKWQRGnsY8j3RHLwOS8qfACoE1CXSKPCUv27pHqwO-1TpM9w27wbDhovVPSZCtXWm8QsyOqNoAnWcaEVyqbeqDtSXNIWncEoMiHSnAmT2hZWMFDC-fAWKM8AGx_fACTLQRf2_dQSDjrXdxENAAPY0D0ZRI" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/90 to-transparent flex items-end p-md">
              <p className="text-on-primary font-body-md italic text-xs font-medium leading-relaxed uppercase tracking-widest opacity-90">"Excellence in education begins with a structured curriculum design."</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateModule;
