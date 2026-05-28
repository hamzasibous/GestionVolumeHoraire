import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface Local {
  id: string;
  bloc: string;
  numero: number;
  capacite: number;
  departement: number | null;
  departement_name: string;
  name: string;
}

interface Departement {
  id: number;
  nom: string;
}

const LocalManagement: React.FC = () => {
  const { t } = useTranslation();
  const [locals, setLocals] = useState<Local[]>([]);
  const [departments, setDepartments] = useState<Departement[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    bloc: '',
    numero: '',
    capacite: '',
    departementId: '',
  });

  const fetchLocals = () => {
    fetch('http://localhost:8000/api/core/local/')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setLocals(data.reverse());
        }
      })
      .catch(err => console.error('Error fetching locals:', err));
  };

  const fetchDepartments = () => {
    fetch('http://localhost:8000/api/core/departement/')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDepartments(data);
        }
      })
      .catch(err => console.error('Error fetching departments:', err));
  };

  useEffect(() => {
    Promise.all([fetchLocals(), fetchDepartments()])
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      bloc: formData.bloc,
      numero: parseInt(formData.numero),
      capacite: parseInt(formData.capacite),
      departement: formData.departementId ? parseInt(formData.departementId) : null,
    };

    fetch('http://localhost:8000/api/core/local/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(res => res.json())
      .then(() => {
        fetchLocals();
        setFormData({ bloc: '', numero: '', capacite: '', departementId: '' });
      })
      .catch(err => console.error('Error saving local:', err));
  };

  const handleDelete = (id: string) => {
    if (!window.confirm(t('common.confirm'))) return;
    fetch(`http://localhost:8000/api/core/local/${id}/`, {
      method: 'DELETE',
    })
      .then(() => fetchLocals())
      .catch(err => console.error('Error deleting local:', err));
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full font-body-md text-on-surface-variant">{t('common.loading')}</div>;
  }

  return (
    <div className="flex flex-col gap-lg max-w-7xl mx-auto animate-in fade-in duration-500">
      <div>
        <h1 className="font-h1 text-h1 text-on-surface tracking-tight">{t('locals.title')}</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-2">{t('locals.subtitle')}</p>
      </div>

      <div className="grid grid-cols-12 gap-gutter">
        {/* Creation Form */}
        <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm h-fit">
          <div className="flex items-center gap-2 mb-6 border-b border-outline-variant pb-4">
            <span className="material-symbols-outlined text-primary">meeting_room</span>
            <h3 className="font-h3 text-h3 text-on-surface">{t('locals.new_entry')}</h3>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-widest font-bold">{t('locals.field_bloc')}</label>
              <input 
                required
                type="text"
                placeholder={t('locals.placeholder_bloc')}
                className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg font-body-md focus:ring-2 focus:ring-primary/20 outline-none"
                value={formData.bloc}
                onChange={(e) => setFormData({...formData, bloc: e.target.value})}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-widest font-bold">{t('locals.field_numero')}</label>
              <input 
                required
                type="number"
                placeholder={t('locals.placeholder_numero')}
                className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg font-body-md focus:ring-2 focus:ring-primary/20 outline-none"
                value={formData.numero}
                onChange={(e) => setFormData({...formData, numero: e.target.value})}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-widest font-bold">{t('locals.field_capacite')}</label>
              <input 
                required
                type="number"
                placeholder={t('locals.placeholder_capacite')}
                className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg font-body-md focus:ring-2 focus:ring-primary/20 outline-none"
                value={formData.capacite}
                onChange={(e) => setFormData({...formData, capacite: e.target.value})}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-widest font-bold">{t('locals.field_dept')}</label>
              <select 
                className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg font-body-md focus:ring-2 focus:ring-primary/20 outline-none"
                value={formData.departementId}
                onChange={(e) => setFormData({...formData, departementId: e.target.value})}
              >
                <option value="">{t('locals.select_dept')}</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
              </select>
            </div>

            <button 
              type="submit"
              className="w-full bg-primary text-on-primary py-3 rounded-lg font-bold shadow-lg hover:bg-primary/90 transition-all active:scale-95 flex items-center justify-center gap-2 mt-4"
            >
              <span className="material-symbols-outlined text-[20px]">save</span>
              {t('locals.save_btn')}
            </button>
          </form>
        </div>

        {/* List Table */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-outline-variant bg-surface-bright flex justify-between items-center">
            <h3 className="font-h3 text-h3 text-on-surface">{t('locals.table_title')}</h3>
            <span className="px-3 py-1 bg-primary-fixed text-on-primary-fixed rounded-full text-xs font-bold uppercase tracking-widest">{locals.length} {t('common.actions')}</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-lowest border-b border-outline-variant">
                  <th className="px-6 py-4 font-label-caps text-label-caps text-outline uppercase tracking-wider">{t('locals.table_col_name')}</th>
                  <th className="px-6 py-4 font-label-caps text-label-caps text-outline uppercase tracking-wider">{t('locals.table_col_bloc')}</th>
                  <th className="px-6 py-4 font-label-caps text-label-caps text-outline uppercase tracking-wider">{t('locals.table_col_capacity')}</th>
                  <th className="px-6 py-4 font-label-caps text-label-caps text-outline uppercase tracking-wider">{t('locals.table_col_dept')}</th>
                  <th className="px-6 py-4 font-label-caps text-label-caps text-outline uppercase tracking-wider text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="font-table-data text-table-data divide-y divide-outline-variant/30">
                {locals.map((l) => (
                  <tr key={l.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-on-surface">
                        {l.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-on-surface">
                      {l.bloc}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-outline">group</span>
                        <span className="text-on-surface font-medium">{l.capacite}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter bg-secondary-container text-on-secondary-container`}>
                        {l.departement_name || t('common.unassigned')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-1.5 text-outline hover:text-primary transition-colors">
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button 
                          className="p-1.5 text-outline hover:text-error transition-colors"
                          onClick={() => handleDelete(l.id)}
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {locals.length === 0 && (
            <div className="p-20 flex flex-col items-center justify-center text-on-surface-variant opacity-40 italic">
              <span className="material-symbols-outlined text-6xl mb-4">meeting_room</span>
              <p>{t('locals.no_entries')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocalManagement;
