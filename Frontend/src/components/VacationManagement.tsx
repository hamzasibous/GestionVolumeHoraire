import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface Vacation {
  id: string;
  teacherName: string;
  titre: string;
  startDate: string;
  endDate: string;
  type: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  is_global: boolean;
}

interface User {
  id: number;
  nom: string;
  prenom: string;
}

const VacationManagement: React.FC = () => {
  const { t } = useTranslation();
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editingVacationId, setEditingVacationId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    teacherId: '',
    titre: '',
    startDate: '',
    endDate: '',
    type: 'Annual Leave',
  });

  const fetchVacations = () => {
    fetch('http://localhost:8000/api/core/vacations/')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const mappedData: Vacation[] = data.map((v: any) => ({
            id: v.id.toString(),
            teacherId: v.enseignant?.toString() || 'all',
            teacherName: v.teacher_name,
            titre: v.titre,
            startDate: v.date_debut,
            endDate: v.date_fin,
            type: v.type_conge,
            status: v.statut,
            is_global: v.is_global,
          }));
          setVacations(mappedData.reverse());
        }
      })
      .catch(err => console.error('Error fetching vacations:', err));
  };

  useEffect(() => {
    fetch('http://localhost:8000/api/users/management/')
      .then(res => res.json())
      .then(data => setUsers(data.filter((u: any) => u.role && u.role.includes('ENSEIGNANT'))))
      .catch(err => console.error('Error fetching teachers:', err));

    fetchVacations();
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const isGlobal = formData.teacherId === 'all';
    const payload = {
      enseignant: isGlobal ? null : parseInt(formData.teacherId),
      titre: formData.titre,
      date_debut: formData.startDate,
      date_fin: formData.endDate,
      type_conge: formData.type,
      is_global: isGlobal,
      statut: 'Approved', // Default to approved for admin management
    };

    const url = editingVacationId 
      ? `http://localhost:8000/api/core/vacations/${editingVacationId}/`
      : 'http://localhost:8000/api/core/vacations/';
    
    const method = editingVacationId ? 'PATCH' : 'POST';

    fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(res => res.json())
      .then(() => {
        fetchVacations();
        setFormData({ teacherId: '', titre: '', startDate: '', endDate: '', type: 'Annual Leave' });
        setEditingVacationId(null);
      })
      .catch(err => console.error('Error saving vacation:', err));
  };

  const handleEdit = (v: Vacation) => {
    setEditingVacationId(v.id);
    setFormData({
      teacherId: v.is_global ? 'all' : (v as any).teacherId,
      titre: v.titre || '',
      startDate: v.startDate,
      endDate: v.endDate,
      type: v.type,
    });
  };

  const handleDelete = (id: string) => {
    if (!window.confirm(t('common.confirm'))) return;
    fetch(`http://localhost:8000/api/core/vacations/${id}/`, {
      method: 'DELETE',
    })
      .then(() => fetchVacations())
      .catch(err => console.error('Error deleting vacation:', err));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRealAIExtraction = () => {
    if (!selectedImage) return;
    setIsExtracting(true);
    
    const formData = new FormData();
    formData.append('image', selectedImage);

    fetch('http://localhost:8000/api/core/vacations/extract/', {
      method: 'POST',
      body: formData,
    })
      .then(res => res.json())
      .then(extractedHolidays => {
        if (extractedHolidays.error) {
           alert("AI Error: " + extractedHolidays.error);
           setIsExtracting(false);
           return;
        }

        if (!Array.isArray(extractedHolidays)) {
           alert(t('vacations.ai_error_format'));
           setIsExtracting(false);
           return;
        }

        Promise.all(extractedHolidays.map((holiday: any) => 
          fetch('http://localhost:8000/api/core/vacations/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              titre: holiday.titre,
              date_debut: holiday.date_debut,
              date_fin: holiday.date_fin,
              type_conge: holiday.type_conge,
              is_global: true,
              enseignant: 'all',
              statut: 'Approved'
            }),
          })
        )).then(() => {
          setIsExtracting(false);
          fetchVacations();
          alert(t('vacations.ai_success', { count: extractedHolidays.length }));
        });
      })
      .catch(err => {
        console.error('Extraction error:', err);
        setIsExtracting(false);
      });
  };

  return (
    <div className="flex flex-col gap-lg max-w-7xl mx-auto animate-in fade-in duration-500">
      <div>
        <h1 className="font-h1 text-h1 text-on-surface tracking-tight">{t('vacations.title')}</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-2">{t('vacations.subtitle')}</p>
      </div>

      <div className="grid grid-cols-12 gap-gutter">
        <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm h-fit">
          <div className="flex items-center gap-2 mb-6 border-b border-outline-variant pb-4">
            <span className="material-symbols-outlined text-primary">edit_calendar</span>
            <h3 className="font-h3 text-h3 text-on-surface">{editingVacationId ? 'Modifier l\'Entrée' : t('vacations.new_entry')}</h3>
          </div>
          
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-widest font-bold">{t('vacations.faculty_member')}</label>
              <select 
                required
                className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg font-body-md focus:ring-2 focus:ring-primary/20 outline-none"
                value={formData.teacherId}
                onChange={(e) => setFormData({...formData, teacherId: e.target.value})}
              >
                <option value="">{t('vacations.select_teacher')}</option>
                <option value="all" className="font-bold text-primary">{t('vacations.all_professors')}</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-widest font-bold">{t('vacations.holiday_title')}</label>
              <input 
                type="text"
                placeholder={formData.teacherId === 'all' ? t('vacations.placeholder_holiday') : t('vacations.placeholder_medical')}
                className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg font-body-md focus:ring-2 focus:ring-primary/20 outline-none"
                value={formData.titre}
                onChange={(e) => setFormData({...formData, titre: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-widest font-bold">{t('vacations.start_date')}</label>
                <input 
                  required
                  type="date" 
                  className="w-full px-4 py-2 bg-surface-bright border border-outline-variant rounded-lg font-body-md focus:ring-2 focus:ring-primary/20 outline-none"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-widest font-bold">{t('vacations.end_date')}</label>
                <input 
                  required
                  type="date" 
                  className="w-full px-4 py-2 bg-surface-bright border border-outline-variant rounded-lg font-body-md focus:ring-2 focus:ring-primary/20 outline-none"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-widest font-bold">{t('vacations.leave_type')}</label>
              <select 
                className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg font-body-md focus:ring-2 focus:ring-primary/20 outline-none"
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
              >
                <option value="Annual Leave">{t('vacations.types.annual')}</option>
                <option value="Public Holiday">{t('vacations.types.public')}</option>
                <option value="Academic Holiday">{t('vacations.types.academic') || 'Calendrier Académique'}</option>
                <option value="Sick Leave">{t('vacations.types.sick')}</option>
                <option value="Other">{t('vacations.types.other')}</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              {editingVacationId && (
                <button 
                  type="button"
                  onClick={() => {
                    setEditingVacationId(null);
                    setFormData({ teacherId: '', titre: '', startDate: '', endDate: '', type: 'Annual Leave' });
                  }}
                  className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-lg font-bold hover:bg-slate-200 transition-all active:scale-95"
                >
                  Annuler
                </button>
              )}
              <button 
                type="submit"
                className="flex-1 bg-primary text-on-primary py-3 rounded-lg font-bold shadow-lg hover:bg-primary/90 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">{editingVacationId ? 'edit' : 'save'}</span>
                {editingVacationId ? 'Enregistrer' : (formData.teacherId === 'all' ? t('vacations.save_all') : t('vacations.save_vacation'))}
              </button>
            </div>
          </form>

          {!editingVacationId && (
            <>
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-outline-variant"></div></div>
                <div className="relative flex justify-center text-xs uppercase font-bold tracking-widest">
                  <span className="bg-white px-2 text-outline">{t('vacations.ai_import')}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="border-2 border-dashed border-outline-variant rounded-xl p-6 flex flex-col items-center justify-center gap-3 hover:bg-surface-container-low transition-colors group cursor-pointer relative">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    onChange={handleImageChange}
                  />
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-outline text-4xl group-hover:scale-110 transition-transform">add_a_photo</span>
                      <p className="text-xs text-on-surface-variant font-medium text-center">{t('vacations.ai_upload_desc')}</p>
                    </>
                  )}
                </div>
                <button 
                  onClick={handleRealAIExtraction}
                  disabled={!selectedImage || isExtracting}
                  className={`w-full py-2.5 bg-secondary text-on-secondary rounded-lg font-bold uppercase text-[10px] tracking-widest hover:bg-secondary/90 shadow-md transition-all flex items-center justify-center gap-2 ${(!selectedImage || isExtracting) && 'opacity-50 grayscale'}`}
                >
                  <span className="material-symbols-outlined text-[18px]">{isExtracting ? 'settings_suggest' : 'auto_fix_high'}</span>
                  {isExtracting ? t('vacations.ai_processing') : t('vacations.ai_extract_btn')}
                </button>
              </div>
            </>
          )}
        </div>

        <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-outline-variant bg-surface-bright flex justify-between items-center">
            <h3 className="font-h3 text-h3 text-on-surface">{t('vacations.table_title')}</h3>
            <span className="px-3 py-1 bg-primary-fixed text-on-primary-fixed rounded-full text-xs font-bold uppercase tracking-widest">{vacations.length} {t('common.actions')}</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-lowest border-b border-outline-variant">
                  <th className="px-6 py-4 font-label-caps text-label-caps text-outline uppercase tracking-wider">{t('vacations.table_col_teacher')}</th>
                  <th className="px-6 py-4 font-label-caps text-label-caps text-outline uppercase tracking-wider">{t('vacations.table_col_duration')}</th>
                  <th className="px-6 py-4 font-label-caps text-label-caps text-outline uppercase tracking-wider">{t('vacations.table_col_type')}</th>
                  <th className="px-6 py-4 font-label-caps text-label-caps text-outline uppercase tracking-wider">{t('vacations.table_col_scope')}</th>
                  <th className="px-6 py-4 font-label-caps text-label-caps text-outline uppercase tracking-wider text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="font-table-data text-table-data divide-y divide-outline-variant/30">
                {vacations.map((v) => (
                  <tr key={v.id} className={`hover:bg-surface-container-low/50 transition-colors ${v.is_global ? 'bg-primary/5' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="font-bold text-on-surface">
                        {v.is_global ? (v.titre || v.type) : v.teacherName}
                      </div>
                      <div className="text-[11px] text-outline">
                        {v.is_global ? t('vacations.scope_all') : t('users.teacher')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium">{v.startDate}</span>
                        <span className="text-[10px] text-outline uppercase">{t('common.back')} {v.endDate}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-on-surface-variant">{v.type}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${
                        v.is_global ? 'bg-tertiary-container text-on-tertiary' : 'bg-secondary-container text-on-secondary'
                      }`}>
                        {v.is_global ? t('vacations.scope_all') : t('vacations.scope_individual')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          className="p-1.5 text-outline hover:text-primary transition-colors"
                          onClick={() => handleEdit(v)}
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button 
                          className="p-1.5 text-outline hover:text-error transition-colors"
                          onClick={() => handleDelete(v.id)}
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
          
          {vacations.length === 0 && (
            <div className="p-20 flex flex-col items-center justify-center text-on-surface-variant opacity-40 italic">
              <span className="material-symbols-outlined text-6xl mb-4">event_busy</span>
              <p>{t('vacations.no_entries')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VacationManagement;
