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
}

const UserManagement: React.FC = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    tel: '',
    role: 'ENSEIGNANT',
    departement: '',
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
      // Auto-select the first department if available and not editing
      if (data.length > 0 && !editingUser) {
        setFormData(prev => ({ ...prev, departement: data[0].id.toString() }));
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  useEffect(() => {
    Promise.all([fetchUsers(), fetchDepartments()]).finally(() => setLoading(false));
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
    // Removed the line that deleted department for Admins, so they can also belong to a department
    if (!payload.departement) delete payload.departement;

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

  const handleRoleToggle = async (user: User) => {
    const newRole = user.role === 'ADMIN' ? 'ENSEIGNANT' : 'ADMIN';
    if (!window.confirm(t('users.confirm_role_toggle', { name: user.prenom, role: newRole }))) return;
    
    try {
      const res = await fetch(`http://localhost:8000/api/users/management/${user.id}/change_role/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) fetchUsers();
    } catch (error) {
      console.error('Error changing role:', error);
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
        <button 
          onClick={() => handleOpenModal()}
          className="bg-primary hover:bg-primary/90 text-on-primary px-6 py-2 rounded-lg font-body-md text-body-md flex items-center gap-2 transition-colors shadow-sm uppercase tracking-wider font-bold"
        >
          <span className="material-symbols-outlined text-[20px]">person_add</span>
          {t('users.create_user')}
        </button>
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
                  <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                    user.role === 'ADMIN' ? 'bg-primary-fixed text-on-primary-fixed' : 'bg-secondary-container text-on-secondary-container'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-on-surface">
                  {user.tel || <span className="text-outline italic">{t('common.n_a')}</span>}
                </td>
                <td className="px-6 py-4">
                  <span className="text-on-surface-variant">{user.departement_name || t('common.n_a')}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => handleRoleToggle(user)}
                      title="Toggle Admin/Teacher"
                      className="text-outline hover:text-secondary transition-colors p-1"
                    >
                      <span className="material-symbols-outlined text-[20px]">swap_horiz</span>
                    </button>
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

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="p-8 space-y-8">
                {/* Section 1: Identity */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-outline-variant pb-2">
                    <span className="font-label-caps text-[10px] font-black uppercase tracking-widest text-primary">01 {t('users.section_identity')}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{t('users.first_name')}</label>
                      <input 
                        required 
                        placeholder="John"
                        className="bg-surface-bright border border-outline-variant rounded-xl px-4 py-3 font-body-md text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-inner" 
                        value={formData.prenom} 
                        onChange={e => setFormData({...formData, prenom: e.target.value})}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{t('users.last_name')}</label>
                      <input 
                        required 
                        placeholder="Doe"
                        className="bg-surface-bright border border-outline-variant rounded-xl px-4 py-3 font-body-md text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-inner" 
                        value={formData.nom} 
                        onChange={e => setFormData({...formData, nom: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{t('users.email')}</label>
                    <input 
                      required 
                      type="email" 
                      placeholder="john.doe@university.edu"
                      className="bg-surface-bright border border-outline-variant rounded-xl px-4 py-3 font-body-md text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-inner" 
                      value={formData.email} 
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>

                {/* Section 2: Role & Access */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-outline-variant pb-2">
                    <span className="font-label-caps text-[10px] font-black uppercase tracking-widest text-primary">02 {t('users.section_role')}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{t('users.role')}</label>
                      <select 
                        className="bg-surface-bright border border-outline-variant rounded-xl px-4 py-3 font-body-md text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer shadow-inner" 
                        value={formData.role} 
                        onChange={e => setFormData({...formData, role: e.target.value})}
                      >
                        <option value="ENSEIGNANT">{t('users.teacher')}</option>
                        <option value="ADMIN">{t('users.admin')}</option>
                        <option value="CHEF_DEPARTEMENT">{t('users.department_head')}</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{t('users.department')}</label>
                      <select 
                        className="bg-surface-bright border border-outline-variant rounded-xl px-4 py-3 font-body-md text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer shadow-inner" 
                        value={formData.departement} 
                        onChange={e => setFormData({...formData, departement: e.target.value})}
                      >
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.id}>{dept.nom}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 3: Security */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-outline-variant pb-2">
                    <span className="font-label-caps text-[10px] font-black uppercase tracking-widest text-primary">03 {t('users.section_security')}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                      {t('users.password')} {editingUser && <span className="text-primary-fixed-dim italic lowercase">({t('common.optional')})</span>}
                    </label>
                    <div className="relative group">
                      <input 
                        required={!editingUser} 
                        type={showPassword ? 'text' : 'password'} 
                        placeholder="••••••••"
                        className="w-full bg-surface-bright border border-outline-variant rounded-xl pl-4 pr-12 py-3 font-body-md text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-inner" 
                        value={formData.password} 
                        onChange={e => setFormData({...formData, password: e.target.value})}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-surface-container rounded-lg text-outline transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                    {editingUser && <p className="text-[10px] text-on-surface-variant italic font-medium">{t('users.password_hint')}</p>}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-8 py-6 bg-surface-bright border-t border-outline-variant flex items-center justify-end gap-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 rounded-lg font-label-caps text-[11px] font-bold uppercase tracking-widest text-on-surface-variant hover:bg-surface-container transition-all"
                >
                  {t('common.discard')}
                </button>
                <button 
                  type="submit" 
                  className="bg-primary hover:bg-primary/90 text-on-primary px-8 py-2.5 rounded-lg font-label-caps text-[11px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">{editingUser ? 'save' : 'how_to_reg'}</span>
                  {editingUser ? t('common.save') : t('users.register_confirm')}
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
