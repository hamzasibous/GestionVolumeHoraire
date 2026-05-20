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
  departement_name?: string;
}

const Profile: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/users/profile/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
        if (data.langue && i18n.language !== data.langue) {
          i18n.changeLanguage(data.langue);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
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

  if (loading) return <div className="p-8">{t('common.loading')}</div>;
  if (!user) return <div className="p-8 text-error">{t('common.error')}</div>;

  return (
    <div className="p-gutter max-w-7xl mx-auto w-full">
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
          <div className="w-32 h-32 rounded-lg border-4 border-surface overflow-hidden bg-white shadow-sm shrink-0">
            <img 
              alt="Avatar Principal" 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDEvDasyccbzreZr32R4u6oi0JAK-1FoanFH3ze8vM8jLMOhM8jE6nykmJiPLrSXSzZ9vzRfKSzs63DR4n6fzkN5PKRoTo-w2z1u-5Qg-WQM6cmzNKf40BoBPMu_z19YwatgZrcJZqg57YmYOW1z4SUCb2hpT9SgGD1qHcrpGXdOom4z6JZXBJNVt-fzVszeFvq3WfHnekXi2yWG6x8BBD41SaS25E1i6nroTcKjEzNhQlRlaB2gcebsbkOtzu4CCUbnxmoAiPX83g" 
            />
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
              <p className="font-label-caps text-label-caps text-outline mb-1 uppercase">Email Institutionnel</p>
              <p className="font-body-lg text-body-lg text-on-surface">{user.email}</p>
            </div>
            <div>
              <p className="font-label-caps text-label-caps text-outline mb-1 uppercase">Numéro de Téléphone</p>
              <p className="font-body-lg text-body-lg text-on-surface">{user.tel || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Academic Credentials Card - keep some parts static or based on user data if available */}
        <div className="col-span-12 lg:col-span-4 bg-primary text-on-primary p-md rounded-lg shadow-sm">
          <h3 className="font-h3 text-h3 mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined">verified</span>
            {t('profile.academic_credentials')}
          </h3>
          <div className="space-y-6">
            <div className="bg-white/10 p-4 rounded border border-white/20">
              <p className="font-label-caps text-label-caps text-on-primary-container mb-1 opacity-90 uppercase">Role</p>
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
                <h4 className="font-body-lg text-body-lg font-semibold text-on-surface">{t('profile.language_preferences')}</h4>
                <p className="font-body-md text-body-md text-on-surface-variant">{t('profile.choose_language')}</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => changeLanguage('fr')}
                  className={`px-3 py-1 rounded font-label-caps text-label-caps transition-all ${i18n.language.startsWith('fr') ? 'bg-secondary text-on-secondary shadow-md' : 'border border-outline text-on-surface-variant hover:bg-surface-container-high'}`}
                >
                  {t('common.french')}
                </button>
                <button 
                  onClick={() => changeLanguage('en')}
                  className={`px-3 py-1 rounded font-label-caps text-label-caps transition-all ${i18n.language.startsWith('en') ? 'bg-secondary text-on-secondary shadow-md' : 'border border-outline text-on-surface-variant hover:bg-surface-container-high'}`}
                >
                  {t('common.english')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
