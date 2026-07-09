import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface Department {
  id: number;
  nom: string;
}

interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  tel: string;
  role: string;
  is_active: boolean;
  departement?: number;
  departement_name?: string;
  filiere?: number;
  filiere_name?: string;
  specialite?: string;
}

const UserManagement: React.FC = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filieres, setFilieres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Excel Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    tel: '',
    role: 'ENSEIGNANT',
    departement: '',
    filiere: '',
    specialite: 'INFORMATIQUE',
    password: ''
  });

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/users/management/');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/core/departement/');
      const data = await response.json();
      setDepartments(data);
      if (data.length > 0 && !editingUser) {
        setFormData(prev => ({ ...prev, departement: data[0].id.toString() }));
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchFilieres = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/core/filiere/');
      const data = await response.json();
      setFilieres(data);
    } catch (error) {
      console.error('Error fetching filieres:', error);
    }
  };

  useEffect(() => {
    Promise.all([fetchUsers(), fetchDepartments(), fetchFilieres()]).finally(() => setLoading(false));
  }, []);

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        tel: user.tel || '',
        role: user.role,
        departement: user.departement?.toString() || '',
        filiere: user.filiere?.toString() || '',
        specialite: user.specialite || 'INFORMATIQUE',
        password: ''
      });
    } else {
      setEditingUser(null);
      setFormData({
        nom: '',
        prenom: '',
        email: '',
        tel: '',
        role: 'ENSEIGNANT',
        departement: departments.length > 0 ? departments[0].id.toString() : '',
        filiere: '',
        specialite: 'INFORMATIQUE',
        password: ''
      });
    }
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('users.confirm_delete'))) return;
    try {
      await fetch(`http://localhost:8000/api/users/management/${id}/`, { method: 'DELETE' });
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingUser ? 'PUT' : 'POST';
    const url = editingUser 
      ? `http://localhost:8000/api/users/management/${editingUser.id}/` 
      : 'http://localhost:8000/api/users/management/';
    
    const payload: any = { ...formData };
    if (!payload.password) delete payload.password;
    payload.departement = payload.departement === '' ? null : payload.departement;
    payload.filiere = payload.filiere === '' ? null : payload.filiere;

    const rolesList = payload.role ? payload.role.split(',') : [];
    if (!rolesList.includes('ENSEIGNANT')) {
      payload.specialite = null;
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowModal(false);
        fetchUsers();
      } else {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const err = await res.json();
          alert(JSON.stringify(err));
        } else {
          const text = await res.text();
          console.error('Server error (non-JSON):', text);
          alert('Server error. Check console for details.');
        }
      }
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };



  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setImportResult(null);
      setImportErrors([]);
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsImporting(true);
    setImportResult(null);
    setImportErrors([]);

    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};

    const formDataToSend = new FormData();
    formDataToSend.append('file', selectedFile);

    try {
      const res = await fetch('http://localhost:8000/api/core/import-teachers/', {
        method: 'POST',
        headers,
        body: formDataToSend
      });

      if (res.ok) {
        const data = await res.json();
        setImportResult(data.message);
        if (data.errors && data.errors.length > 0) {
          setImportErrors(data.errors);
        }
        fetchUsers();
        setTimeout(() => {
          setIsImportModalOpen(false);
          setSelectedFile(null);
          setImportResult(null);
          setImportErrors([]);
        }, 3000);
      } else {
        const errData = await res.json();
        alert(errData.error || 'Erreur lors de l\'importation');
      }
    } catch (error) {
      console.error('Error importing file:', error);
      alert('Erreur lors de la connexion au serveur.');
    } finally {
      setIsImporting(false);
    }
  };

  if (loading) return <div className="p-8">{t('common.loading')}</div>;

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-h1 text-h1 text-on-surface">{t('users.title')}</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">{t('users.description')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="border border-outline text-on-surface hover:bg-surface-container px-6 py-2 rounded-lg font-body-md text-body-md flex items-center gap-2 transition-colors shadow-sm uppercase tracking-wider font-bold text-xs"
          >
            <span className="material-symbols-outlined text-[20px]">file_upload</span>
            Importer Excel
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-primary hover:bg-primary/90 text-on-primary px-6 py-2 rounded-lg font-body-md text-body-md flex items-center gap-2 transition-colors shadow-sm uppercase tracking-wider font-bold text-xs"
          >
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            {t('users.create_user')}
          </button>
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-lowest border-b border-outline-variant">
              <th className="px-6 py-3 font-label-caps text-label-caps text-outline uppercase tracking-wider">{t('users.table_user')}</th>
              <th className="px-6 py-3 font-label-caps text-label-caps text-outline uppercase tracking-wider">{t('users.table_role')}</th>
              <th className="px-6 py-3 font-label-caps text-label-caps text-outline uppercase tracking-wider">{t('users.table_contact')}</th>
              <th className="px-6 py-3 font-label-caps text-label-caps text-outline uppercase tracking-wider">{t('users.table_department')}</th>
              <th className="px-6 py-3 font-label-caps text-label-caps text-outline uppercase tracking-wider text-right">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="font-table-data text-table-data divide-y divide-surface-variant">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-surface-container-lowest/50 transition-colors bg-white">
                <td className="px-6 py-4">
                  <div className="font-medium text-on-surface">{user.prenom} {user.nom}</div>
                  <div className="text-xs text-outline">{user.email}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1 max-w-[180px]">
                    {user.role.split(',').map((r: string) => (
                      <span key={r} className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                        r === 'ADMIN' ? 'bg-primary-fixed text-on-primary-fixed' : 
                        r === 'CHEF_DEPARTEMENT' ? 'bg-cyan-100 text-cyan-800 border border-cyan-200' : 
                        r === 'RESPONSABLE_FILIERE' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 
                        r === 'ENSEIGNANT' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 
                        'bg-slate-100 text-slate-800 border border-slate-200'
                      }`}>
                        {r === 'ADMIN' ? 'Admin' :
                         r === 'CHEF_DEPARTEMENT' ? 'Chef' :
                         r === 'RESPONSABLE_FILIERE' ? 'Coord' :
                         r === 'ENSEIGNANT' ? 'Ensg' : 'Etud'}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-on-surface">
                  {user.tel || <span className="text-outline italic">{t('common.n_a')}</span>}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-0.5 text-xs">
                    {user.departement_name && (
                      <span className="text-on-surface-variant font-medium">Dept: {user.departement_name}</span>
                    )}
                    {user.filiere_name && (
                      <span className="text-sky-600 font-semibold">Fil: {user.filiere_name}</span>
                    )}
                    {user.specialite && user.role.split(',').some(r => ['ENSEIGNANT', 'CHEF_DEPARTEMENT', 'RESPONSABLE_FILIERE'].includes(r)) && (
                      <span className="text-purple-700 font-extrabold tracking-wide text-[10px] uppercase mt-0.5">Spéc: {user.specialite}</span>
                    )}
                    {!user.departement_name && !user.filiere_name && (
                      <span className="text-outline italic">{t('common.n_a')}</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => handleOpenModal(user)}
                      className="text-outline hover:text-primary transition-colors p-1"
                    >
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button 
                      onClick={() => handleDelete(user.id)}
                      className="text-outline hover:text-error transition-colors p-1"
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

      {/* Refined Modal Design */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest rounded-2xl w-full max-w-2xl border border-outline-variant shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-outline-variant bg-surface-bright flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <span className="material-symbols-outlined text-primary">{editingUser ? 'edit_square' : 'person_add'}</span>
                </div>
                <div>
                  <h3 className="font-h2 text-xl font-bold text-on-surface tracking-tight">
                    {editingUser ? t('users.modal_edit_title') : t('users.modal_create_title')}
                  </h3>
                  <p className="text-xs text-on-surface-variant font-medium opacity-70">
                    {editingUser ? t('users.modal_edit_desc') : t('users.modal_create_desc')}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-surface-container-high rounded-full transition-colors text-outline"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
              {/* Section 1: Personal Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-outline-variant pb-2">
                  <span className="font-label-caps text-[10px] font-black uppercase tracking-widest text-primary">01 {t('users.section_identity')}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{t('users.first_name')}</label>
                    <input 
                      type="text" 
                      required
                      className="bg-surface-bright border border-outline-variant rounded-xl px-4 py-3 font-body-md text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      placeholder={t('users.placeholder_first_name')}
                      value={formData.prenom}
                      onChange={e => setFormData({...formData, prenom: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{t('users.last_name')}</label>
                    <input 
                      type="text" 
                      required
                      className="bg-surface-bright border border-outline-variant rounded-xl px-4 py-3 font-body-md text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      placeholder={t('users.placeholder_last_name')}
                      value={formData.nom}
                      onChange={e => setFormData({...formData, nom: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Role & Access */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-outline-variant pb-2">
                  <span className="font-label-caps text-[10px] font-black uppercase tracking-widest text-primary">02 {t('users.section_role')}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Rôles de l'utilisateur (Sélection multiple)</label>
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 border border-slate-200 rounded-xl">
                      {[
                        { value: 'ENSEIGNANT', label: 'Enseignant' },
                        { value: 'ADMIN', label: 'Administrateur' },
                        { value: 'CHEF_DEPARTEMENT', label: 'Chef de Département' },
                        { value: 'RESPONSABLE_FILIERE', label: 'Responsable de Filière' },
                        { value: 'UTILISATEUR', label: 'Utilisateur (Étudiant)' }
                      ].map((roleOpt) => {
                        const rolesList = formData.role ? formData.role.split(',') : [];
                        const isChecked = rolesList.includes(roleOpt.value);
                        
                        return (
                          <label key={roleOpt.value} className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                let newRoles = [...rolesList];
                                if (e.target.checked) {
                                  newRoles.push(roleOpt.value);
                                } else {
                                  newRoles = newRoles.filter(r => r !== roleOpt.value);
                                }
                                if (newRoles.length === 0) newRoles = ['ENSEIGNANT'];
                                setFormData({ ...formData, role: newRoles.join(',') });
                              }}
                              className="rounded border-slate-300 text-primary focus:ring-primary/20"
                            />
                            {roleOpt.label}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {formData.role.split(',').some(r => ['ADMIN', 'CHEF_DEPARTEMENT', 'RESPONSABLE_FILIERE', 'ENSEIGNANT'].includes(r)) ? (
                    <>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{t('users.department')}</label>
                        <select 
                          className="bg-surface-bright border border-outline-variant rounded-xl px-4 py-3 font-body-md text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer shadow-inner" 
                          value={formData.departement} 
                          onChange={e => setFormData({...formData, departement: e.target.value})}
                        >
                          <option value="">Sélectionner un département...</option>
                          {departments.map(dept => (
                            <option key={dept.id} value={dept.id}>{dept.nom}</option>
                          ))}
                        </select>
                      </div>

                      {formData.role.split(',').includes('ENSEIGNANT') ? (
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Spécialité de l'Enseignant</label>
                          <select 
                            className="bg-surface-bright border border-outline-variant rounded-xl px-4 py-3 font-body-md text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer shadow-inner" 
                            value={formData.specialite} 
                            onChange={e => setFormData({...formData, specialite: e.target.value})}
                          >
                            <option value="INFORMATIQUE">Informatique</option>
                            <option value="MATHEMATIQUES">Mathématiques</option>
                            <option value="PHYSIQUE">Physique</option>
                            <option value="LANGUES">Langues</option>
                            <option value="AUTRE">Autre</option>
                          </select>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Spécialité de l'Enseignant</label>
                          <div className="bg-slate-100/50 border border-slate-200 rounded-xl px-4 py-3 font-body-md text-slate-400 text-xs italic shadow-inner">
                            Non applicable (Non Enseignant)
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col gap-2 md:col-span-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Filière Coordonnée (Optionnelle)</label>
                        <select 
                          className="bg-surface-bright border border-outline-variant rounded-xl px-4 py-3 font-body-md text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer shadow-inner" 
                          value={formData.filiere} 
                          onChange={e => setFormData({...formData, filiere: e.target.value})}
                        >
                          <option value="">Aucune filière coordonnée</option>
                          {filieres.map(f => (
                            <option key={f.id} value={f.id}>{f.nom}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col gap-2 md:col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Filière</label>
                      <select 
                        className="bg-surface-bright border border-outline-variant rounded-xl px-4 py-3 font-body-md text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer shadow-inner" 
                        value={formData.filiere} 
                        onChange={e => setFormData({...formData, filiere: e.target.value})}
                      >
                        <option value="">Sélectionner une filière...</option>
                        {filieres.map(f => (
                          <option key={f.id} value={f.id}>{f.nom}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 3: Contact & Security */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-outline-variant pb-2">
                  <span className="font-label-caps text-[10px] font-black uppercase tracking-widest text-primary">03 {t('users.section_security')}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{t('users.email')}</label>
                    <input 
                      type="email" 
                      required
                      className="bg-surface-bright border border-outline-variant rounded-xl px-4 py-3 font-body-md text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      placeholder="nom.prenom@example.com"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{t('users.phone')}</label>
                    <input 
                      type="text" 
                      className="bg-surface-bright border border-outline-variant rounded-xl px-4 py-3 font-body-md text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      placeholder="+212 600-000000"
                      value={formData.tel}
                      onChange={e => setFormData({...formData, tel: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{t('users.password')}</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      required={!editingUser}
                      className="w-full bg-surface-bright border border-outline-variant rounded-xl pl-4 pr-12 py-3 font-body-md text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      placeholder={editingUser ? t('users.placeholder_password_edit') : '••••••••'}
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-6 border-t border-outline-variant flex justify-end gap-4 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 border border-outline text-on-surface hover:bg-surface-container rounded-xl font-label-caps text-label-caps uppercase tracking-wider font-bold transition-colors text-xs"
                >
                  {t('common.cancel')}
                </button>
                <button 
                  type="submit"
                  className="px-6 py-3 bg-primary text-on-primary hover:bg-primary-container rounded-xl font-label-caps text-label-caps uppercase tracking-wider font-bold shadow-md transition-all hover:scale-[1.02] text-xs"
                >
                  {editingUser ? t('common.save') : t('users.create_user')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <span className="material-symbols-outlined text-sky-400">upload_file</span>
                <h3 className="text-lg font-black uppercase tracking-tight">Importer des Enseignants</h3>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleImportSubmit} className="p-8 space-y-6">
              <p className="text-slate-600 text-sm leading-relaxed">
                Veuillez sélectionner un fichier Excel (.xlsx) contenant la liste des enseignants. 
                <br/>
                <span className="font-bold">Colonnes attendues :</span> Nom, Prénom, Email, Téléphone, Département, Rôle
              </p>
              
              <div className="border-2 border-dashed border-slate-200 hover:border-sky-500 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer relative bg-slate-50">
                <input 
                  type="file" 
                  accept=".xlsx"
                  required
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <span className="material-symbols-outlined text-slate-400 text-4xl">cloud_upload</span>
                <span className="font-bold text-sm text-slate-700">
                  {selectedFile ? selectedFile.name : "Glisser un fichier ou cliquer ici"}
                </span>
                {selectedFile && (
                  <span className="text-xs text-slate-400">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </span>
                )}
              </div>

              {importResult && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs font-bold">
                  {importResult}
                </div>
              )}

              {importErrors.length > 0 && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-xs max-h-32 overflow-y-auto">
                  <p className="font-bold mb-1">Erreurs lors de l'import :</p>
                  <ul className="list-disc pl-4 space-y-1">
                    {importErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-6 border-t border-slate-100 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors"
                >
                  Fermer
                </button>
                <button 
                  type="submit"
                  disabled={isImporting || !selectedFile}
                  className={`flex-1 bg-slate-900 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 ${isImporting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-800'}`}
                >
                  <span className="material-symbols-outlined text-sm">{isImporting ? 'sync' : 'upload'}</span>
                  {isImporting ? 'Importation...' : 'Importer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
