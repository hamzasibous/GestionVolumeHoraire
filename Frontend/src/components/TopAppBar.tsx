import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface UserProfile {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  departement_name?: string;
}

const TopAppBar: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
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
        } else if (response.status === 401) {
          // Token might be expired
          handleLogout();
        }
      } catch (error) {
        console.error('Error fetching profile in TopAppBar:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  const navLinks = [
    { path: '/', label: t('common.dashboard'), icon: 'dashboard', adminOnly: true },
    { path: '/programs', label: t('common.programs'), icon: 'account_tree', adminOnly: true },
    { path: '/faculty', label: t('common.faculty'), icon: 'groups', adminOnly: true },
    { path: '/forecasting', label: t('common.forecasting'), icon: 'analytics', adminOnly: true },
    { path: '/users', label: t('common.users'), icon: 'manage_accounts', adminOnly: true },
    { path: '/vacations', label: t('common.vacations'), icon: 'event_busy', adminOnly: true },
    { path: '/consultation', label: t('common.workload'), icon: 'person', adminOnly: false },
  ];

  const filteredLinks = navLinks.filter(link => {
    if (user?.role === 'ADMIN') return true;
    return !link.adminOnly;
  });

  const getInitials = () => {
    if (!user) return 'GVH';
    const p = user.prenom?.charAt(0) || '';
    const n = user.nom?.charAt(0) || '';
    return (p + n).toUpperCase() || 'U';
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-slate-900 border-b border-slate-800 shadow-md">
      <div className="max-w-[1440px] mx-auto px-8 h-16 flex items-center justify-between">
        {/* Left: Brand & Main Navigation */}
        <div className="flex items-center gap-12">
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded bg-sky-500 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance</span>
            </div>
            <div className="flex flex-col -space-y-1">
              <h1 className="text-lg font-black tracking-tight text-white uppercase">GVH Portal</h1>
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Management System</span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {filteredLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-inter text-sm font-medium transition-all ${
                  isActive(link.path)
                    ? 'text-white bg-slate-800/50 border-b-2 border-orange-500 rounded-b-none'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right: Profile with Hover Dropdown */}
        <div className="relative group h-full flex items-center">
          <button className="flex items-center gap-3 pl-4 border-l border-slate-700 hover:opacity-80 transition-opacity focus:outline-none h-10">
            <div className="flex flex-col items-end hidden sm:block text-right">
              <span className="text-sm font-medium text-white leading-none">
                {loading ? '...' : (user ? `${user.prenom} ${user.nom}` : t('common.unassigned'))}
              </span>
              <span className="text-[11px] text-slate-400">
                {loading ? '...' : (user?.departement_name || user?.role || 'Guest')}
              </span>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-800 overflow-hidden border border-slate-700 flex items-center justify-center">
              {(!imgError && !loading) ? (
                <img
                  alt="Profile"
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAO0_vv-zPr7AMWByoXAAb8eQ_QmdsQpvYCf9rtSr8Hp1sFQkkfDM0DbmeCHCHNJFkBguBJZ7ZhT3dXs34xXV9sYZAvvyRZEl9yqBou1L9XG_muJk8y4Skl0zsYSmBdtm5F56Zz6YIm22JUUEFIJnf7fz0x36Ek__fN7zbi_gZtfpwXbkJo9RaNr3CGHOtFYKw1pnx6DHni0yuecWgBJM0KKLfhcb_wT2u8PO2EXHnJ1DBD3FzEZQHZ-zpFmCMb8eUUpcCXTewHC4Bf"
                  onError={() => setImgError(true)}
                />
              ) : (
                <span className="text-sm font-bold text-sky-400 uppercase tracking-tighter">
                  {loading ? '...' : getInitials()}
                </span>
              )}
            </div>
            <span className="material-symbols-outlined text-slate-400 text-lg transition-transform group-hover:rotate-180">expand_more</span>
          </button>

          {/* Hover Dropdown Menu */}
          <div className="absolute right-0 top-full w-56 bg-slate-800 border border-slate-700 rounded-b-lg shadow-xl z-20 py-2 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-2 group-hover:translate-y-0">
            <Link
              to="/profile"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-lg">account_circle</span>
              {t('common.profile')}
            </Link>
            
            <div className="border-t border-slate-700/50 my-1"></div>
            
            <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-left">
              <span className="material-symbols-outlined text-lg">notifications</span>
              Notifications
            </button>
            
            <Link
              to="/settings"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-lg">settings</span>
              {t('common.settings')}
            </Link>
            
            <Link
              to="/help"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-lg">help</span>
              {t('common.help')}
            </Link>
            
            <div className="border-t border-slate-700 my-1"></div>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors text-left"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              {t('common.logout')}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopAppBar;
