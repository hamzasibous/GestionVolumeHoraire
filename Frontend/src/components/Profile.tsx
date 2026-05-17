import React, { useState } from 'react';

const Profile: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

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
            <h2 className="font-h1 text-h1 text-on-surface">Dr. Ahmed Mansouri</h2>
            <div className="flex flex-wrap items-center gap-4 text-on-surface-variant mt-1">
              <span className="flex items-center gap-1 font-body-md text-body-md">
                <span className="material-symbols-outlined text-[18px]">work</span>
                Professeur de l'Enseignement Supérieur
              </span>
              <span className="flex items-center gap-1 font-body-md text-body-md">
                <span className="material-symbols-outlined text-[18px]">apartment</span>
                Département d'Informatique
              </span>
            </div>
          </div>
          <div className="ml-auto pb-2">
            <button 
              className="bg-primary text-on-primary px-6 py-2 rounded-lg font-label-caps text-label-caps hover:opacity-90 transition-opacity active:scale-95"
              onClick={() => setIsModalOpen(true)}
            >
              Modifier le Profil
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
              Informations Personnelles
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
            <div>
              <p className="font-label-caps text-label-caps text-outline mb-1 uppercase">Email Institutionnel</p>
              <p className="font-body-lg text-body-lg text-on-surface">a.mansouri@university.edu.ma</p>
            </div>
            <div>
              <p className="font-label-caps text-label-caps text-outline mb-1 uppercase">Numéro de Téléphone</p>
              <p className="font-body-lg text-body-lg text-on-surface">+212 6 00 00 00 00</p>
            </div>
            <div>
              <p className="font-label-caps text-label-caps text-outline mb-1 uppercase">Localisation Bureau</p>
              <p className="font-body-lg text-body-lg text-on-surface">Bloc C, Bureau 204, 2ème Étage</p>
            </div>
            <div>
              <p className="font-label-caps text-label-caps text-outline mb-1 uppercase">Identifiant Employé</p>
              <p className="font-body-lg text-body-lg text-on-surface">ID-2024-AM782</p>
            </div>
          </div>
        </div>

        {/* Academic Credentials Card */}
        <div className="col-span-12 lg:col-span-4 bg-primary text-on-primary p-md rounded-lg shadow-sm">
          <h3 className="font-h3 text-h3 mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined">verified</span>
            Parcours Académique
          </h3>
          <div className="space-y-6">
            <div className="bg-white/10 p-4 rounded border border-white/20">
              <p className="font-label-caps text-label-caps text-on-primary-container mb-1 opacity-90 uppercase">Grade Actuel</p>
              <p className="font-h3 text-h3">P.E.S (A)</p>
            </div>
            <div className="bg-white/10 p-4 rounded border border-white/20">
              <p className="font-label-caps text-label-caps text-on-primary-container mb-1 opacity-90 uppercase">Date de Nomination</p>
              <p className="font-h3 text-h3">14 Septembre 2012</p>
            </div>
            <div className="bg-white/10 p-4 rounded border border-white/20">
              <p className="font-label-caps text-label-caps text-on-primary-container mb-1 opacity-90 uppercase">Spécialité</p>
              <p className="font-h3 text-h3">Génie Logiciel</p>
            </div>
          </div>
        </div>

        {/* Account Settings Section */}
        <div className="col-span-12 bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden shadow-sm">
          <div className="p-md border-b border-outline-variant bg-surface-container-low">
            <h3 className="font-h3 text-h3 text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined">settings_suggest</span>
              Paramètres du Compte
            </h3>
          </div>
          <div className="divide-y divide-outline-variant">
            {/* Password Management */}
            <div className="p-gutter flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="font-body-lg text-body-lg font-semibold text-on-surface">Mot de passe</h4>
                <p className="font-body-md text-body-md text-on-surface-variant">Dernière modification il y a 3 mois</p>
              </div>
              <button className="border border-outline text-on-surface px-4 py-2 rounded font-label-caps text-label-caps hover:bg-surface-container-high transition-colors">
                Changer le mot de passe
              </button>
            </div>
            {/* Notifications Management */}
            <div className="p-gutter flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="font-body-lg text-body-lg font-semibold text-on-surface">Notifications</h4>
                <p className="font-body-md text-body-md text-on-surface-variant">Gérer les alertes par email et push pour les charges horaires</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-label-caps text-label-caps text-outline mr-2">ACTIF</span>
                <div className="w-12 h-6 bg-secondary-container rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
            {/* Language Preferences */}
            <div className="p-gutter flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="font-body-lg text-body-lg font-semibold text-on-surface">Préférences de Langue</h4>
                <p className="font-body-md text-body-md text-on-surface-variant">Choisir la langue d'affichage de l'interface</p>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-secondary text-on-secondary rounded font-label-caps text-label-caps">Français</button>
                <button className="px-3 py-1 border border-outline text-on-surface-variant rounded font-label-caps text-label-caps hover:bg-surface-container-high">العربية</button>
                <button className="px-3 py-1 border border-outline text-on-surface-variant rounded font-label-caps text-label-caps hover:bg-surface-container-high">English</button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="col-span-12 md:col-span-6 lg:col-span-3 bg-surface-container-lowest border border-outline-variant p-md rounded-lg flex items-center gap-4">
          <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined">schedule</span>
          </div>
          <div>
            <p className="font-label-caps text-label-caps text-outline uppercase">Charge Annuelle</p>
            <h4 className="font-h2 text-h2 text-on-surface">192h</h4>
          </div>
        </div>
        <div className="col-span-12 md:col-span-6 lg:col-span-3 bg-surface-container-lowest border border-outline-variant p-md rounded-lg flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <span className="material-symbols-outlined">groups</span>
          </div>
          <div>
            <p className="font-label-caps text-label-caps text-outline uppercase">Étudiants Encadrés</p>
            <h4 className="font-h2 text-h2 text-on-surface">14</h4>
          </div>
        </div>
        <div className="col-span-12 md:col-span-6 lg:col-span-3 bg-surface-container-lowest border border-outline-variant p-md rounded-lg flex items-center gap-4">
          <div className="w-12 h-12 bg-tertiary-container/20 rounded-full flex items-center justify-center text-tertiary">
            <span className="material-symbols-outlined">article</span>
          </div>
          <div>
            <p className="font-label-caps text-label-caps text-outline uppercase">Publications</p>
            <h4 className="font-h2 text-h2 text-on-surface">32</h4>
          </div>
        </div>
        <div className="col-span-12 md:col-span-6 lg:col-span-3 bg-surface-container-lowest border border-outline-variant p-md rounded-lg flex items-center gap-4">
          <div className="w-12 h-12 bg-error-container/40 rounded-full flex items-center justify-center text-error">
            <span className="material-symbols-outlined">event_note</span>
          </div>
          <div>
            <p className="font-label-caps text-label-caps text-outline uppercase">Congés Restants</p>
            <h4 className="font-h2 text-h2 text-on-surface">22j</h4>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-md overflow-y-auto bg-black/50">
          <div className="bg-surface-container-lowest w-full max-w-2xl rounded-xl shadow-lg border border-outline-variant overflow-hidden">
            <div className="p-md border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
              <h3 className="font-h3 text-h3 text-on-surface">Modifier les Informations du Profil</h3>
              <button 
                className="text-outline hover:text-on-surface transition-colors"
                onClick={() => setIsModalOpen(false)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form className="p-md space-y-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative group">
                  <img 
                    alt="Current Avatar" 
                    className="w-24 h-24 rounded-lg object-cover border-2 border-outline-variant shadow-sm" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDEvDasyccbzreZr32R4u6oi0JAK-1FoanFH3ze8vM8jLMOhM8jE6nykmJiPLrSXSzZ9vzRfKSzs63DR4n6fzkN5PKRoTo-w2z1u-5Qg-WQM6cmzNKf40BoBPMu_z19YwatgZrcJZqg57YmYOW1z4SUCb2hpT9SgGD1qHcrpGXdOom4z6JZXBJNVt-fzVszeFvq3WfHnekXi2yWG6x8BBD41SaS25E1i6nroTcKjEzNhQlRlaB2gcebsbkOtzu4CCUbnxmoAiPX83g" 
                  />
                  <button className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" type="button">
                    <span className="material-symbols-outlined text-white">photo_camera</span>
                  </button>
                </div>
                <div className="flex-grow text-center md:text-left">
                  <p className="font-body-md text-body-md font-semibold text-on-surface">Photo de Profil</p>
                  <p className="font-label-caps text-label-caps text-outline">JPG, PNG ou GIF. Max 2MB.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-caps text-label-caps text-outline uppercase">Nom Complet</label>
                  <input className="bg-surface border border-outline-variant rounded-lg p-2 font-body-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none" type="text" defaultValue="Dr. Ahmed Mansouri"/>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-caps text-label-caps text-outline uppercase">Email Institutionnel</label>
                  <input className="bg-surface border border-outline-variant rounded-lg p-2 font-body-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none" type="email" defaultValue="a.mansouri@university.edu.ma"/>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-caps text-label-caps text-outline uppercase">Numéro de Téléphone</label>
                  <input className="bg-surface border border-outline-variant rounded-lg p-2 font-body-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none" type="text" defaultValue="+212 6 00 00 00 00"/>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-caps text-label-caps text-outline uppercase">Localisation Bureau (Local)</label>
                  <input className="bg-surface border border-outline-variant rounded-lg p-2 font-body-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none" type="text" defaultValue="Bloc C, Bureau 204, 2ème Étage"/>
                </div>
              </div>
              <div className="pt-md border-t border-outline-variant flex justify-end gap-sm">
                <button 
                  className="px-6 py-2 rounded-lg font-label-caps text-label-caps text-on-surface border border-outline hover:bg-surface-container-high transition-colors" 
                  onClick={() => setIsModalOpen(false)}
                  type="button"
                >
                  Annuler
                </button>
                <button 
                  className="px-6 py-2 rounded-lg font-label-caps text-label-caps text-on-primary bg-primary hover:opacity-90 transition-opacity" 
                  type="submit"
                >
                  Enregistrer les modifications
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
