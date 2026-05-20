import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface Module {
  id: string;
  nom: string;
}

interface Department {
  id: string;
  nom: string;
}

interface FormData {
  title: string;
  level: string;
  department: string;
  description: string;
  selectedModules: { id: string, semester: string }[];
}

const levels = [
  { value: 'Licence_f', label: 'Licence Fondamentale' },
  { value: 'Licence_e', label: 'Licence Excellence' },
  { value: 'Licence_t', label: 'Licence Temps Aménagé' },
  { value: 'Master_f', label: 'Master Fondamental' },
  { value: 'Master_e', label: 'Master Excellence' },
  { value: 'Master_t', label: 'Master Temps Aménagé' },
];

const AddFiliere: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    level: '',
    department: '',
    description: '',
    selectedModules: [],
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [availableModules, setAvailableModules] = useState<Module[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch departments
    fetch('http://localhost:8000/core/departement/')
      .then(res => res.json())
      .then(data => setDepartments(data.map((d: any) => ({ id: d.id.toString(), nom: d.nom }))))
      .catch(err => console.error('Error fetching departments:', err));

    // Fetch modules
    fetch('http://localhost:8000/core/module/')
      .then(res => res.json())
      .then(data => setAvailableModules(data.map((m: any) => ({ id: m.id.toString(), nom: m.nom }))))
      .catch(err => console.error('Error fetching modules:', err));
  }, []);

  const validateStep1 = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.title) newErrors.title = 'Title is required';
    if (!formData.level) newErrors.level = 'Academic level is required';
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.description) newErrors.description = 'Description is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2) setStep(3);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const toggleModule = (id: string) => {
    setFormData(prev => {
      const isSelected = prev.selectedModules.some(m => m.id === id);
      if (isSelected) {
        return {
          ...prev,
          selectedModules: prev.selectedModules.filter(m => m.id !== id)
        };
      } else {
        return {
          ...prev,
          selectedModules: [...prev.selectedModules, { id, semester: 'S1_l' }]
        };
      }
    });
  };

  const updateModuleSemester = (id: string, semester: string) => {
    setFormData(prev => ({
      ...prev,
      selectedModules: prev.selectedModules.map(m => m.id === id ? { ...m, semester } : m)
    }));
  };

  const getSemesterOptions = () => {
    const isMaster = formData.level.startsWith('Master');
    const max = isMaster ? 4 : 6;
    const options = [];
    for (let i = 1; i <= max; i++) {
      options.push(`S${i}_l`);
    }
    return options;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 1. Create Filiere
      const filiereRes = await fetch('http://localhost:8000/core/filiere/create-filiere/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: formData.title,
          description: formData.description,
          niveaux: formData.level,
          departement: parseInt(formData.department),
        }),
      });

      if (!filiereRes.ok) throw new Error('Failed to create filiere');
      const filiereData = await filiereRes.json();

      // 2. Affect Modules
      for (const mod of formData.selectedModules) {
        await fetch('http://localhost:8000/core/module/affecter-filiere/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filiere: filiereData.id,
            module: parseInt(mod.id),
            semestre: mod.semester,
          }),
        });
      }

      navigate('/programs');
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while creating the program.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8">
      {/* Page Header */}
      <div className="border-b border-outline-variant pb-4">
        <div className="flex items-center gap-2 text-sm text-outline mb-2 font-table-data">
          <Link to="/programs" className="hover:text-primary transition-colors uppercase tracking-wider font-bold">Filières</Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-on-surface font-medium">New Program Entry</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="font-h1 text-h1 text-on-surface tracking-tight font-bold">Create New Filière</h1>
          <span className="bg-surface-variant text-on-surface-variant px-3 py-1 rounded-full font-label-caps text-label-caps border border-outline-variant uppercase tracking-widest text-[10px] font-bold">Draft Mode</span>
        </div>
      </div>

      {/* Multi-Step Stepper Component */}
      <div className="w-full relative py-4 mb-4">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-surface-container-high -z-10 -translate-y-1/2 rounded-full"></div>
        <div 
          className="absolute top-1/2 left-0 h-0.5 bg-primary -z-10 -translate-y-1/2 rounded-full transition-all duration-500" 
          style={{ width: step === 1 ? '33%' : step === 2 ? '66%' : '100%' }}
        ></div>
        <ul className="flex justify-between items-center w-full relative z-0">
          {[1, 2, 3].map((s) => (
            <li key={s} className={`flex flex-col items-center gap-2 bg-background px-4 transition-all duration-300 ${step >= s ? 'opacity-100' : 'opacity-40'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm border-2 transition-colors ${
                step === s ? 'bg-primary text-on-primary border-primary shadow-lg' : 
                step > s ? 'bg-primary-container text-on-primary-container border-primary-container' : 
                'bg-surface-container-highest text-on-surface-variant border-outline-variant'
              }`}>
                {step > s ? <span className="material-symbols-outlined text-sm font-bold">check</span> : <span className="font-label-caps text-label-caps font-bold">0{s}</span>}
              </div>
              <span className={`font-label-caps text-[10px] uppercase tracking-widest font-bold whitespace-nowrap ${step === s ? 'text-primary' : 'text-on-surface-variant'}`}>
                {s === 1 ? 'General Info' : s === 2 ? 'Modules Selection' : 'Review & Publish'}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col min-h-[400px]">
          {step === 1 && (
            <>
              <div className="px-6 py-5 border-b border-outline-variant bg-surface-bright flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">info</span>
                <h2 className="font-h3 text-h3 text-on-surface tracking-tight font-bold uppercase text-sm">Step 1: Program Details</h2>
              </div>
              <div className="p-8 flex-1 flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[11px] font-bold" htmlFor="program-title">Program Title <span className="text-error">*</span></label>
                  <input 
                    className={`w-full px-4 py-3 bg-surface-bright border rounded-lg font-body-lg text-on-surface focus:outline-none focus:ring-2 transition-all placeholder:text-outline/40 ${errors.title ? 'border-error focus:ring-error/20' : 'border-outline-variant focus:border-primary focus:ring-primary/20'}`} 
                    id="program-title" 
                    placeholder="e.g., Licence Informatique" 
                    type="text" 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                  {errors.title && <p className="text-error text-xs italic mt-1">{errors.title}</p>}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[11px] font-bold" htmlFor="program-desc">Description <span className="text-error">*</span></label>
                  <textarea 
                    className={`w-full px-4 py-3 bg-surface-bright border rounded-lg font-body-md text-on-surface focus:outline-none focus:ring-2 transition-all placeholder:text-outline/40 min-h-[100px] ${errors.description ? 'border-error focus:ring-error/20' : 'border-outline-variant focus:border-primary focus:ring-primary/20'}`} 
                    id="program-desc" 
                    placeholder="Provide a brief overview of the program objectives and content..." 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                  {errors.description && <p className="text-error text-xs italic mt-1">{errors.description}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[11px] font-bold" htmlFor="academic-level">Academic Level <span className="text-error">*</span></label>
                    <select 
                      className={`w-full px-4 py-3 bg-surface-bright border rounded-lg font-body-md text-on-surface focus:outline-none focus:ring-2 transition-all cursor-pointer ${errors.level ? 'border-error focus:ring-error/20' : 'border-outline-variant focus:border-primary focus:ring-primary/20'}`} 
                      id="academic-level"
                      value={formData.level}
                      onChange={(e) => setFormData({...formData, level: e.target.value})}
                    >
                      <option value="">Select Level...</option>
                      {levels.map(l => (
                        <option key={l.value} value={l.value}>{l.label}</option>
                      ))}
                    </select>
                    {errors.level && <p className="text-error text-xs italic mt-1">{errors.level}</p>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[11px] font-bold" htmlFor="department">Department <span className="text-error">*</span></label>
                    <select 
                      className={`w-full px-4 py-3 bg-surface-bright border rounded-lg font-body-md text-on-surface focus:outline-none focus:ring-2 transition-all cursor-pointer ${errors.department ? 'border-error focus:ring-error/20' : 'border-outline-variant focus:border-primary focus:ring-primary/20'}`} 
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                    >
                      <option value="">Assign to Department...</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.nom}</option>
                      ))}
                    </select>
                    {errors.department && <p className="text-error text-xs italic mt-1">{errors.department}</p>}
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="px-6 py-5 border-b border-outline-variant bg-surface-bright flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">library_add</span>
                  <h2 className="font-h3 text-h3 text-on-surface tracking-tight font-bold uppercase text-sm">Step 2: Module Selection</h2>
                </div>
                <span className="text-xs font-bold text-primary bg-primary-fixed px-2 py-1 rounded-full uppercase tracking-widest">{formData.selectedModules.length} Selected</span>
              </div>
              <div className="p-0 flex-1 overflow-y-auto max-h-[500px]">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-surface-bright border-b border-outline-variant z-10">
                    <tr>
                      <th className="px-6 py-3 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Module Name</th>
                      <th className="px-6 py-3 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest font-bold text-center">Semester</th>
                      <th className="px-6 py-3 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest font-bold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30">
                    {availableModules.map((module) => {
                      const selectedModule = formData.selectedModules.find(m => m.id === module.id);
                      return (
                        <tr key={module.id} className={`group transition-colors ${selectedModule ? 'bg-primary-container/10' : 'hover:bg-surface-container-low'}`}>
                          <td className="px-6 py-4">
                            <div className="font-bold text-sm text-on-surface">{module.nom}</div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {selectedModule ? (
                              <select 
                                className="bg-surface-bright border border-outline-variant rounded px-2 py-1 text-xs font-bold"
                                value={selectedModule.semester}
                                onChange={(e) => updateModuleSemester(module.id, e.target.value)}
                              >
                                {getSemesterOptions().map(s => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-outline text-xs italic">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => toggleModule(module.id)}
                              className={`px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition-all ${
                                selectedModule 
                                  ? 'bg-secondary text-on-secondary shadow-md hover:bg-error active:scale-95' 
                                  : 'bg-primary text-on-primary hover:bg-primary-container active:scale-95 shadow-sm'
                              }`}
                            >
                              {selectedModule ? 'Remove' : 'Add'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="px-6 py-5 border-b border-outline-variant bg-surface-bright flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">visibility</span>
                <h2 className="font-h3 text-h3 text-on-surface tracking-tight font-bold uppercase text-sm">Step 3: Final Review & Publish</h2>
              </div>
              <div className="p-8 flex-1 flex flex-col gap-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-outline-variant pb-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-1 opacity-60">Program Title</h4>
                      <p className="font-h2 text-xl font-bold text-primary tracking-tight">{formData.title}</p>
                    </div>
                    <div>
                      <h4 className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-1 opacity-60">Academic Level</h4>
                      <p className="font-bold text-on-surface">{levels.find(l => l.value === formData.level)?.label}</p>
                    </div>
                    <div>
                      <h4 className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-1 opacity-60">Department</h4>
                      <p className="font-bold text-on-surface">{departments.find(d => d.id === formData.department)?.nom}</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-1 opacity-60">Description</h4>
                      <p className="text-sm text-on-surface-variant leading-relaxed italic">"{formData.description}"</p>
                    </div>
                    <div className="bg-primary-container/10 p-4 rounded-lg border border-primary/20">
                      <h4 className="font-label-caps text-[10px] text-primary uppercase tracking-widest font-bold mb-2">Curriculum Summary</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-on-surface">Total Modules:</span>
                        <span className="text-lg font-black text-primary">{formData.selectedModules.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-4 opacity-60">Selected Curriculum Structure</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {formData.selectedModules.map(mInfo => {
                      const m = availableModules.find(mod => mod.id === mInfo.id);
                      return m ? (
                        <div key={mInfo.id} className="flex items-center justify-between p-3 bg-surface-bright border border-outline-variant rounded shadow-sm hover:border-primary transition-colors group">
                          <div className="flex flex-col">
                            <span className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">{m.nom}</span>
                          </div>
                          <span className="text-[10px] font-black text-primary-container px-2 py-1 bg-primary-fixed rounded uppercase tracking-widest">{mInfo.semester}</span>
                        </div>
                      ) : null;
                    })}
                    {formData.selectedModules.length === 0 && (
                      <div className="text-center py-8 border-2 border-dashed border-outline-variant rounded-xl opacity-40 italic text-sm">
                        No modules selected for this program.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sidebar Info Column */}
        <div className="flex flex-col gap-6">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-6">
            <h3 className="font-h3 text-sm font-bold text-on-surface mb-4 flex items-center gap-2 uppercase tracking-widest border-b border-outline-variant pb-2">
              <span className="material-symbols-outlined text-outline text-[20px]">settings_suggest</span>
              Guidance
            </h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-primary text-sm mt-1">check_circle</span>
                <p className="text-xs text-on-surface-variant leading-relaxed font-medium">Ensure names follow the official academic catalog nomenclature.</p>
              </div>
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-primary text-sm mt-1">check_circle</span>
                <p className="text-xs text-on-surface-variant leading-relaxed font-medium">Modules must be assigned to valid semesters for the chosen level.</p>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-outline-variant">
               <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
                  <span className="text-on-surface-variant">Validation Status</span>
                  <span className={Object.keys(errors).length === 0 ? 'text-primary' : 'text-error'}>
                    {Object.keys(errors).length === 0 ? 'Ready' : 'Incomplete'}
                  </span>
               </div>
            </div>
          </div>
          
          <div className="relative h-48 rounded-xl overflow-hidden border border-outline-variant shadow-sm group">
            <img 
              alt="Academic" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC4-MGh7hnVkedK_1dNsiORO-EQEMQezI3KcYT3l88gP14dJR_Ae3lXLWwjwy1aGMg8m4YX9TepsecdbYqcp9bqh3aAR6jazzmqfpfMoRwEfmQ8TLmaTbKWQRGnsY8j3RHLwOS8qfACoE1CXSKPCUv27pHqwO-1TpM9w27wbDhovVPSZCtXWm8QsyOqNoAnWcaEVyqbeqDtSXNIWncEoMiHSnAmT2hZWMFDC-fAWKM8AGx_fACTLQRf2_dQSDjrXdxENAAPY0D0ZRI" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/90 to-transparent flex items-end p-4">
              <p className="text-on-primary text-[10px] italic font-bold uppercase tracking-widest opacity-80 leading-relaxed">"Excellence in education begins with a structured curriculum design."</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-outline-variant pt-8 pb-12">
        <button 
          onClick={step === 1 ? () => navigate('/programs') : handleBack}
          className="px-6 py-2.5 rounded-lg font-label-caps text-label-caps text-on-surface-variant border border-outline-variant hover:bg-surface-container transition-all flex items-center gap-2 uppercase tracking-widest font-bold active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px]">{step === 1 ? 'close' : 'arrow_back'}</span>
          {step === 1 ? 'Cancel' : 'Back'}
        </button>
        <button 
          onClick={step === 3 ? handleSubmit : handleNext}
          disabled={loading}
          className={`px-8 py-2.5 rounded-lg font-label-caps text-label-caps shadow-lg transition-all flex items-center gap-2 uppercase tracking-widest font-bold active:scale-95 ${
            step === 3 ? 'bg-primary text-on-primary hover:bg-primary-container' : 'bg-secondary-container text-on-secondary-container hover:bg-secondary transition-colors'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? 'Processing...' : (step === 3 ? 'Publish Program' : 'Continue')}
          <span className="material-symbols-outlined text-[18px]">{step === 3 ? 'publish' : 'arrow_forward'}</span>
        </button>
      </div>
    </div>
  );
};

export default AddFiliere;
