import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Login: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/api/users/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        navigate('/');
      } else {
        const errorData = await response.json();
        alert(errorData.detail || "Identifiants invalides");
      }
    } catch (error) {
      console.error("Erreur de connexion:", error);
      alert("Impossible de contacter le serveur.");
    }
  };

  return (
    <div className="bg-pattern min-h-screen flex flex-col font-body-md text-on-surface">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-gutter h-16 bg-surface border-b border-outline-variant">
        <div className="flex items-center gap-sm">
          <h1 className="font-h2 text-h2 font-bold text-primary">{t('login.university')}</h1>
        </div>
        <div className="flex items-center gap-md">
          <button className="text-on-surface-variant hover:text-primary-container transition-colors flex items-center gap-xs">
            <span className="material-symbols-outlined">language</span>
            <span className="font-label-caps text-label-caps">FR</span>
          </button>
          <button className="text-on-surface-variant hover:text-primary-container transition-colors flex items-center gap-xs">
            <span className="material-symbols-outlined">help_outline</span>
            <span className="font-label-caps text-label-caps">{t('login.aide')}</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center pt-24 pb-12 px-gutter">
        <div className="grid grid-cols-1 lg:grid-cols-12 max-w-7xl w-full gap-xl items-center">
          
          {/* Branding Column */}
          <div className="hidden lg:flex lg:col-span-7 flex-col gap-lg pr-lg">
            <img 
              alt="UMI University Logo" 
              className="w-full h-auto max-w-xl" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAHhvRkMdIre3TSAFSymehredglaaQy1BDH-9tQcLs3aP11oxN7qbjh_cvpFuy5GiP3w2n6g3sebw3JkkWoxrSYhah1qGo2yowhp9azfWzxULwZwLKEo78d3f6LQEgPc8QX7Oi8x2Shc1xad58DLayH8TrSbzn2mvgIG1zcjN0_0s_HPjczYpH3JADN7lrwfs5dHOqvVMd4wpR5TpmdSr3UmeR6AdV2914_KczeDINtmmAGfO6ouygvP7-1Hr6OmoVUxG80W1Q2lRI" 
            />
            <div className="space-y-sm">
              <h2 className="font-h1 text-h1 text-primary text-4xl leading-tight tracking-tight">{t('login.branding_title')}</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
                {t('login.branding_desc')}
              </p>
            </div>
          </div>

          {/* Auth Card Column */}
          <div className="col-span-1 lg:col-span-5 flex justify-center lg:justify-end">
            <div className="bg-[rgba(255,255,255,0.95)] backdrop-blur-[10px] border border-[#e2e8f0] w-full max-w-[560px] p-12 rounded-2xl shadow-2xl">
              <div className="lg:hidden flex justify-center mb-12">
                <img 
                  alt="UMI Logo" 
                  className="h-28 w-auto" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAHhvRkMdIre3TSAFSymehredglaaQy1BDH-9tQcLs3aP11oxN7qbjh_cvpFuy5GiP3w2n6g3sebw3JkkWoxrSYhah1qGo2yowhp9azfWzxULwZwLKEo78d3f6LQEgPc8QX7Oi8x2Shc1xad58DLayH8TrSbzn2mvgIG1zcjN0_0s_HPjczYpH3JADN7lrwfs5dHOqvVMd4wpR5TpmdSr3UmeR6AdV2914_KczeDINtmmAGfO6ouygvP7-1Hr6OmoVUxG80W1Q2lRI" 
                />
              </div>
              
              <div className="mb-12">
                <h2 className="text-primary font-bold text-4xl mb-4 leading-tight tracking-tight">
                  {t('login.form_title')}
                </h2>
                <p className="text-on-surface-variant text-xl leading-relaxed font-medium">
                  {t('login.form_subtitle')}
                </p>
              </div>

              <form className="space-y-8" onSubmit={handleSubmit}>
                {/* ID Field */}
                <div className="space-y-3">
                  <label className="font-label-caps text-on-surface-variant block uppercase tracking-[0.1em] text-sm font-bold">{t('login.field_email')}</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-2xl">person</span>
                    <input 
                      className="w-full pl-14 pr-6 py-5 bg-surface border border-outline-variant rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-lg" 
                      placeholder={t('login.placeholder_email')} 
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-3">
                  <label className="font-label-caps text-on-surface-variant block uppercase tracking-[0.1em] text-sm font-bold">{t('login.field_password')}</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-2xl">lock</span>
                    <input 
                      className="w-full pl-14 pr-14 py-5 bg-surface border border-outline-variant rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-lg" 
                      placeholder="••••••••" 
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button 
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors" 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <span className="material-symbols-outlined text-2xl">{showPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>

                {/* Options */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-xs cursor-pointer group">
                    <input className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary" type="checkbox" />
                    <span className="font-body-md text-body-md text-on-surface-variant group-hover:text-on-surface">{t('login.remember_me')}</span>
                  </label>
                  <a className="font-body-md text-body-md text-primary hover:underline font-semibold" href="#">{t('login.forgot_password')}</a>
                </div>

                {/* Submit Action */}
                <button 
                  className="w-full py-5 bg-primary text-on-primary font-h3 text-h3 rounded-xl hover:bg-primary-container transition-all flex items-center justify-center gap-sm shadow-sm active:scale-[0.98]" 
                  type="submit"
                >
                  {t('login.btn_login')}
                  <span className="material-symbols-outlined">login</span>
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-lg">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-outline-variant"></div></div>
                <div className="relative flex justify-center text-label-caps">
                  <span className="bg-white px-2 text-on-surface-variant font-label-caps">{t('login.assistance')}</span>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex flex-col gap-sm">
                <button className="w-full py-3 border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors rounded flex items-center justify-center gap-sm font-body-md">
                  <span className="material-symbols-outlined">mail</span>
                  {t('login.contact_admin')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-base px-gutter flex flex-col md:flex-row justify-between items-center gap-sm bg-surface-container border-t border-outline-variant">
        <div className="flex items-center gap-sm">
          <span className="font-h3 text-h3 font-semibold text-on-surface">UMI</span>
          <div className="w-px h-4 bg-outline-variant hidden md:block"></div>
          <span className="font-label-caps text-label-caps text-on-surface-variant">{t('login.footer_rights')}</span>
        </div>
        <div className="flex gap-md">
          <a className="font-label-caps text-label-caps text-on-surface-variant hover:text-secondary" href="#">{t('login.footer_support')}</a>
          <a className="font-label-caps text-label-caps text-on-surface-variant hover:text-secondary" href="#">{t('login.footer_privacy')}</a>
        </div>
      </footer>
    </div>
  );
};

export default Login;
