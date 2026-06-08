import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface UserProfile {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  tel: string;
  role: string;
  langue: string;
  photo: string | null;
  departement_name?: string;
}

const Profile: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('No access token found');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:8000/api/users/profile/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
        if (data.langue && i18n.language !== data.langue) {
          i18n.changeLanguage(data.langue);
        }
      } else {
        setError(t('common.error'));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const changeLanguage = async (lng: string) => {
    i18n.changeLanguage(lng);
    if (user) {
      try {
        await fetch('http://localhost:8000/api/users/profile/', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
          body: JSON.stringify({ langue: lng })
        });
        setUser({ ...user, langue: lng });
      } catch (error) {
        console.error('Error updating language preference:', error);
      }
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('photo', file);

    try {
      const response = await fetch('http://localhost:8000/api/users/profile/', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: formData
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        // Trigger top bar update
        window.dispatchEvent(new Event('profileUpdate'));
      }
    } catch (err) {
      console.error('Photo upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!user) return;
    
    setIsUploading(true);
    // In Django Rest Framework, to clear a file field, we can send an empty string or null depending on config
    // We will use a standard PATCH with photo: null if supported, or handle specially
    try {
      const response = await fetch('http://localhost:8000/api/users/profile/', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ photo: null })
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        window.dispatchEvent(new Event('profileUpdate'));
      }
    } catch (err) {
      console.error('Photo removal failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      nom: formData.get('nom'),
      prenom: formData.get('prenom'),
      email: formData.get('email'),
      tel: formData.get('tel'),
    };

    try {
      const response = await fetch('http://localhost:8000/api/users/profile/', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        setIsModalOpen(false);
        // Trigger top bar update in case name changed
        window.dispatchEvent(new Event('profileUpdate'));
      } else {
        alert("Erreur lors de la mise à jour du profil.");
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <p className="text-on-surface-variant font-medium">{t('common.loading')}</p>
    </div>
  );

  if (error || !user) return (
    <div className="flex flex-col items-center justify-center p-20 gap-6 bg-surface-container-lowest rounded-xl border border-outline-variant max-w-2xl mx-auto mt-10">
      <div className="w-16 h-16 rounded-full bg-error-container flex items-center justify-center">
        <span className="material-symbols-outlined text-error text-3xl">error</span>
      </div>
      <div className="text-center">
        <h2 className="text-h2 font-bold text-on-surface mb-2">{t('common.error')}</h2>
        <p className="text-on-surface-variant mb-6">We couldn't load your profile information. Please check your connection or try again.</p>
        <button 
          onClick={fetchProfile}
          className="bg-primary text-on-primary px-8 py-2.5 rounded-lg font-bold hover:bg-primary-container transition-all active:scale-95 flex items-center gap-2 mx-auto"
        >
          <span className="material-symbols-outlined text-lg">refresh</span>
          Retry Loading
        </button>
      </div>
    </div>
  );

  const initials = `${user.prenom?.charAt(0) || ''}${user.nom?.charAt(0) || ''}`.toUpperCase();

  return (
    <div className="p-gutter max-w-7xl mx-auto w-full animate-in fade-in duration-500">
      {/* Hero Header Section */}
      <section className="mb-md">
        <div className="relative w-full h-48 rounded-lg overflow-hidden mb-[-64px]">
          <img 
            alt="University Banner" 
            className="w-full h-full object-cover" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDVx2AeKsCK5MCzgtP58Udeq6tBjJzQyQE0GZUsno0Qx1tAyN9ioFTYT4JqbmQtrec8KHMKkEijOgkq-XsFPSJ7CsO_fywz9CLarSGgn9iWEcNg9Oo7j-KNH_zoTtgT0dXsw0ns0s8j4dMjx1jz59CJhizcuUOiunZtLvXnybJzL3aAavwWo8oDTH_wRxfJXG_CEZrABHgBgRzjJK210H8S_xHXMTkNjZw0iO-0rVozpWxnEzDkX6kqXxxbkthJafIG4TSrq5HFslg" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        </div>
        <div className="relative px-gutter flex flex-col md:flex-row items-end gap-6">
          <div className="group relative w-32 h-32 rounded-lg border-4 border-surface overflow-hidden bg-slate-200 shadow-sm shrink-0 flex items-center justify-center">
            {user.photo ? (
              <img 
                alt="Avatar Principal" 
                className="w-full h-full object-cover" 
                src={user.photo.startsWith('http') ? user.photo : `http://localhost:8000${user.photo}`}
              />
            ) : (
              <span className="text-4xl font-bold text-primary">{initials}</span>
            )}
            
            {/* Photo Edit Overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
               <label className="cursor-pointer bg-white/20 hover:bg-white/40 p-1.5 rounded-full transition-colors" title="Change photo">
                 <span className="material-symbols-outlined text-white text-[20px]">edit</span>
                 <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
               </label>
               {user.photo && (
                 <button 
                   onClick={handleRemovePhoto}
                   className="bg-white/20 hover:bg-white/40 p-1.5 rounded-full transition-colors" 
                   title="Remove photo"
                 >
                   <span className="material-symbols-outlined text-white text-[20px]">delete</span>
                 </button>
               )}
            </div>
            
            {isUploading && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
              </div>
            )}
          </div>
          <div className="pb-2">
            <h2 className="font-h1 text-h1 text-on-surface">{user.prenom} {user.nom}</h2>
            <div className="flex flex-wrap items-center gap-4 text-on-surface-variant mt-1">
              <span className="flex items-center gap-1 font-body-md text-body-md">
                <span className="material-symbols-outlined text-[18px]">work</span>
                {user.role}
              </span>
              {user.departement_name && (
                <span className="flex items-center gap-1 font-body-md text-body-md">
                  <span className="material-symbols-outlined text-[18px]">apartment</span>
                  {user.departement_name}
                </span>
              )}
            </div>
          </div>
          <div className="ml-auto pb-2">
            <button 
              className="bg-primary text-on-primary px-6 py-2 rounded-lg font-label-caps text-label-caps hover:opacity-90 transition-opacity active:scale-95"
              onClick={() => setIsModalOpen(true)}
            >
              {t('profile.edit_profile')}
            </button>
          </div>
        </div>
      </section>

      {/* Bento Grid Layout for Info Cards */}
      <div className="grid grid-cols-12 gap-gutter mt-md">
        {/* Personal Information Card */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest border border-outline-variant p-md rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-6 border-b border-outline-variant pb-4">
            <h3 className="font-h3 text-h3 text-primary flex items-center gap-2">
              <span className="material-symbols-outlined">person</span>
              {t('profile.personal_info')}
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
            <div>
              <p className="font-label-caps text-label-caps text-outline mb-1 uppercase tracking-widest text-[10px] font-bold">Email Institutionnel</p>
              <p className="font-body-lg text-body-lg text-on-surface">{user.email}</p>
            </div>
            <div>
              <p className="font-label-caps text-label-caps text-outline mb-1 uppercase tracking-widest text-[10px] font-bold">Numéro de Téléphone</p>
              <p className="font-body-lg text-body-lg text-on-surface">{user.tel || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Academic Credentials Card */}
        <div className="col-span-12 lg:col-span-4 bg-primary text-on-primary p-md rounded-lg shadow-sm relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-10">
            <span className="material-symbols-outlined text-[120px]">verified</span>
          </div>
          <h3 className="font-h3 text-h3 mb-6 flex items-center gap-2 z-10 relative">
            <span className="material-symbols-outlined">verified</span>
            {t('profile.academic_credentials')}
          </h3>
          <div className="space-y-6 z-10 relative">
            <div className="bg-white/10 p-4 rounded border border-white/20">
              <p className="font-label-caps text-label-caps text-on-primary-container mb-1 opacity-90 uppercase tracking-widest text-[10px] font-bold">Role</p>
              <p className="font-h3 text-h3">{user.role}</p>
            </div>
          </div>
        </div>

        {/* Account Settings Section */}
        <div className="col-span-12 bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden shadow-sm">
          <div className="p-md border-b border-outline-variant bg-surface-container-low">
            <h3 className="font-h3 text-h3 text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined">settings_suggest</span>
              {t('profile.account_settings')}
            </h3>
          </div>
          <div className="divide-y divide-outline-variant">
            {/* Language Preferences */}
            <div className="p-gutter flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="font-body-lg text-body-lg font-bold text-on-surface">{t('profile.language_preferences')}</h4>
                <p className="font-body-md text-body-md text-on-surface-variant">{t('profile.choose_language')}</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => changeLanguage('fr')}
                  className={`px-4 py-1.5 rounded font-label-caps text-label-caps transition-all uppercase tracking-widest text-[10px] font-bold ${i18n.language.startsWith('fr') ? 'bg-secondary text-on-secondary shadow-md' : 'border border-outline text-on-surface-variant hover:bg-surface-container-high'}`}
                >
                  {t('common.french')}
                </button>
                <button 
                  onClick={() => changeLanguage('en')}
                  className={`px-4 py-1.5 rounded font-label-caps text-label-caps transition-all uppercase tracking-widest text-[10px] font-bold ${i18n.language.startsWith('en') ? 'bg-secondary text-on-secondary shadow-md' : 'border border-outline text-on-surface-variant hover:bg-surface-container-high'}`}
                >
                  {t('common.english')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <div className="p-2 bg-primary/20 rounded-lg"><span className="material-symbols-outlined text-primary-fixed">edit</span></div>
                <h3 className="text-lg font-black uppercase tracking-tight">{t('profile.edit_profile')}</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Prénom</label>
                  <input 
                    name="prenom" 
                    defaultValue={user.prenom} 
                    required 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Nom</label>
                  <input 
                    name="nom" 
                    defaultValue={user.nom} 
                    required 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Email</label>
                <input 
                  name="email" 
                  type="email" 
                  defaultValue={user.email} 
                  required 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Téléphone</label>
                <input 
                  name="tel" 
                  defaultValue={user.tel} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                />
              </div>

              <div className="pt-6 border-t border-slate-100 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-slate-900 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg hover:bg-slate-800"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
