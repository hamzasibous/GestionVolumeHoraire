import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface UserProfile {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  photo?: string | null;
  departement_name?: string;
}

const TopAppBar: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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
        setImgError(false);
        updateUnreadCount(data.id);
      } else if (response.status === 401) {
        handleLogout();
      }
    } catch (error) {
      console.error('Error fetching profile in TopAppBar:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUnreadCount = (userId: number) => {
    const saved = JSON.parse(localStorage.getItem('notifications') || '[]');
    const count = saved.filter((n: any) => n.recipientId === userId && !n.read).length;
    setUnreadCount(count);
  };

  useEffect(() => {
    fetchProfile();
    const handleUpdate = () => {
      if (user) updateUnreadCount(user.id);
    };
    window.addEventListener('profileUpdate', fetchProfile);
    window.addEventListener('notificationsUpdate', handleUpdate);
    return () => {
      window.removeEventListener('profileUpdate', fetchProfile);
      window.removeEventListener('notificationsUpdate', handleUpdate);
    };
  }, [user?.id]);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  const mainLinks = [
    { path: '/', label: t('common.dashboard'), icon: 'dashboard', adminOnly: true },
    { path: '/faculty', label: t('common.faculty'), icon: 'groups', adminOnly: true },
    { path: '/forecasting', label: t('common.forecasting'), icon: 'analytics', adminOnly: true },
  ];

  const programLinks = [
    { path: '/programs/new', label: t('programs.add_filiere'), icon: 'add_circle' },
    { path: '/programs/new-module', label: t('programs.create_module'), icon: 'post_add' },
    { path: '/timetable', label: t('common.timetable'), icon: 'calendar_today' },
  ];

  const managementLinks = [
    { path: '/users', label: t('common.users'), icon: 'manage_accounts' },
    { path: '/vacations', label: t('common.vacations'), icon: 'event_busy' },
    { path: '/locals', label: t('common.locals'), icon: 'meeting_room' },
  ];

  const personalLinks = [
    { path: '/consultation', label: t('common.workload'), icon: 'person' },
    { path: '/my-timetable', label: t('common.my_timetable'), icon: 'calendar_today' },
  ];

  const getInitials = () => {
    if (!user) return 'GVH';
    const p = user.prenom?.charAt(0) || '';
    const n = user.nom?.charAt(0) || '';
    return (p + n).toUpperCase() || 'U';
  };

  const isPrivileged = user?.role === 'ADMIN' || user?.role === 'CHEF_DEPARTEMENT';

  return (
    <header className="sticky top-0 z-50 w-full bg-slate-900 border-b border-slate-800 shadow-md">
      <div className="max-w-[1440px] mx-auto px-8 h-20 flex items-center justify-between">
        {/* Left: Brand & Main Navigation */}
        <div className="flex items-center gap-12">
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-14 h-14 flex items-center justify-center">
              <img src="/assets/logo.png" alt="Smartime Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col -space-y-1">
              <h1 className="text-xl font-black tracking-tight text-white uppercase">Smartime</h1>
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">Management System</span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 h-full">
            {/* Main Links */}
            {mainLinks.filter(link => isPrivileged || !link.adminOnly).map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-2 px-4 h-full font-inter text-sm font-medium transition-all ${
                  isActive(link.path)
                    ? 'text-white bg-slate-800/50 border-b-4 border-orange-500'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{link.icon}</span>
                {link.label}
              </Link>
            ))}

            {/* Programs Dropdown (Privileged only) */}
            {isPrivileged && (
              <div className="relative group px-1 h-full">
                <Link
                  to="/programs"
                  className={`flex items-center gap-2 px-4 h-full font-inter text-sm font-medium transition-all ${
                    isActive('/programs') || programLinks.some(link => isActive(link.path))
                      ? 'text-white bg-slate-800/50'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">account_tree</span>
                  {t('common.programs')}
                  <span className="material-symbols-outlined text-sm transition-transform group-hover:rotate-180">expand_more</span>
                </Link>
                
                {/* Dropdown Menu */}
                <div className="absolute left-0 top-full w-64 bg-slate-800 border border-slate-700 rounded-b-lg shadow-xl z-30 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  {programLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                        isActive(link.path)
                          ? 'text-sky-400 bg-slate-700/50'
                          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">{link.icon}</span>
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Management Dropdown (Privileged only) */}
            {isPrivileged && (
              <div className="relative group px-1 h-full">
                <button
                  className={`flex items-center gap-2 px-4 h-full font-inter text-sm font-medium transition-all ${
                    managementLinks.some(link => isActive(link.path))
                      ? 'text-white bg-slate-800/50'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">settings_suggest</span>
                  {t('common.management')}
                  <span className="material-symbols-outlined text-sm transition-transform group-hover:rotate-180">expand_more</span>
                </button>
                
                {/* Dropdown Menu */}
                <div className="absolute left-0 top-full w-48 bg-slate-800 border border-slate-700 rounded-b-lg shadow-xl z-30 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  {managementLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                        isActive(link.path)
                          ? 'text-sky-400 bg-slate-700/50'
                          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">{link.icon}</span>
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Personal Links */}
            {personalLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-2 px-4 h-full font-inter text-sm font-medium transition-all ${
                  isActive(link.path)
                    ? 'text-white bg-slate-800/50 border-b-4 border-orange-500'
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
          <button className="flex items-center gap-3 pl-4 border-l border-slate-700 hover:opacity-80 transition-opacity focus:outline-none h-full">
            <div className="flex flex-col items-end hidden sm:block text-right">
              <span className="text-sm font-medium text-white leading-none">
                {loading ? '...' : (user ? `${user.prenom} ${user.nom}` : t('common.unassigned'))}
              </span>
              <span className="text-[11px] text-slate-400">
                {loading ? '...' : (user?.departement_name || user?.role || 'Guest')}
              </span>
            </div>
            <div className="w-11 h-11 rounded-full bg-slate-800 overflow-hidden border border-slate-700 flex items-center justify-center">
              {(!imgError && !loading && user?.photo) ? (
                <img
                  alt="Profile"
                  className="w-full h-full object-cover"
                  src={user.photo.startsWith('http') ? user.photo : `http://localhost:8000${user.photo}`}
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
            
            <Link
              to="/notifications"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors relative"
            >
              <span className="material-symbols-outlined text-lg">notifications</span>
              Notifications
              {unreadCount > 0 && (
                <span className="absolute left-7 top-2 w-4 h-4 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-slate-800 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Link>
            
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
