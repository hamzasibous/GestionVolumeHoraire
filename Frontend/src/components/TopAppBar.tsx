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
    { path: '/consultation', label: t('common.workload'), icon: 'person', teacherOnly: true },
    { path: '/my-timetable', label: t('common.my_timetable'), icon: 'calendar_today' },
    { path: '/evaluations', label: 'Évaluations', icon: 'grade', teacherOnly: true },
    { path: '/filiere-management', label: 'Gestion Filière', icon: 'admin_panel_settings', coordinatorOnly: true },
    { path: '/messages', label: 'Messages', icon: 'mail' },
  ];

  const getInitials = () => {
    if (!user) return 'GVH';
    const p = user.prenom?.charAt(0) || '';
    const n = user.nom?.charAt(0) || '';
    return (p + n).toUpperCase() || 'U';
  };

  const isAdmin = user?.role ? (user.role.includes('ADMIN') || user.role.includes('CHEF_DEPARTEMENT')) : false;
  const isPrivileged = user?.role ? (isAdmin || user.role.includes('RESPONSABLE_FILIERE')) : false;

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-[1440px] mx-auto px-8 h-16 flex items-center justify-between">
        {/* Left: Brand & Main Navigation */}
        <div className="flex items-center gap-10 h-full">
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-85 transition-opacity h-full">
            <h1 className="text-lg font-bold text-sky-850 tracking-tight text-primary">EduAdmin Portal</h1>
          </Link>

          {/* Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 h-full">
            {user?.role && user.role.includes('UTILISATEUR') && !user.role.includes('ENSEIGNANT') && !user.role.includes('ADMIN') && !user.role.includes('CHEF_DEPARTEMENT') ? (
              <>
                {/* Dashboard */}
                <Link
                  to="/"
                  className={`flex items-center gap-2 px-4 h-full font-inter text-sm font-medium transition-all ${
                    isActive('/')
                      ? 'text-primary border-b-2 border-primary bg-slate-50/50'
                      : 'text-slate-550 hover:text-primary hover:bg-slate-50/30'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">dashboard</span>
                  Dashboard
                </Link>

                {/* Timetable */}
                <Link
                  to="/timetable"
                  className={`flex items-center gap-2 px-4 h-full font-inter text-sm font-medium transition-all ${
                    isActive('/timetable')
                      ? 'text-primary border-b-2 border-primary bg-slate-50/50'
                      : 'text-slate-550 hover:text-primary hover:bg-slate-50/30'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">calendar_today</span>
                  Timetable
                </Link>
              </>
            ) : user?.role && user.role.includes('RESPONSABLE_FILIERE') && !user.role.includes('ADMIN') && !user.role.includes('CHEF_DEPARTEMENT') ? (
              <>
                {/* 1. Dashboard */}
                <Link
                  to="/"
                  className={`flex items-center gap-2 px-4 h-full font-inter text-sm font-medium transition-all ${
                    isActive('/')
                      ? 'text-primary border-b-2 border-primary bg-slate-50/50'
                      : 'text-slate-550 hover:text-primary hover:bg-slate-50/30'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">dashboard</span>
                  Dashboard
                </Link>

                {/* 2. Timetable Dropdown */}
                <div className="relative group px-1 h-full flex items-center">
                  <button
                    className={`flex items-center gap-2 px-4 h-12 font-inter text-sm font-medium rounded-lg transition-all ${
                      isActive('/my-timetable') || isActive('/timetable')
                        ? 'text-primary bg-slate-50'
                        : 'text-slate-550 hover:text-primary hover:bg-slate-50/30'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">calendar_today</span>
                    Timetable
                    <span className="material-symbols-outlined text-sm transition-transform group-hover:rotate-180">expand_more</span>
                  </button>
                  <div className="absolute left-0 top-[calc(100%-8px)] w-60 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <Link
                      to="/my-timetable"
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                        isActive('/my-timetable')
                          ? 'text-primary bg-sky-50/50 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">person</span>
                      Mon emploi du temps
                    </Link>
                    <Link
                      to="/timetable"
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                        isActive('/timetable')
                          ? 'text-primary bg-sky-50/50 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">groups</span>
                      Emploi du temps de la filière
                    </Link>
                  </div>
                </div>

                {/* 3. Ma charge */}
                <Link
                  to="/consultation"
                  className={`flex items-center gap-2 px-4 h-full font-inter text-sm font-medium transition-all ${
                    isActive('/consultation')
                      ? 'text-primary border-b-2 border-primary bg-slate-50/50'
                      : 'text-slate-550 hover:text-primary hover:bg-slate-50/30'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">assignment_ind</span>
                  Ma charge
                </Link>

                {/* 4. Messages */}
                <Link
                  to="/messages"
                  className={`flex items-center gap-2 px-4 h-full font-inter text-sm font-medium transition-all ${
                    isActive('/messages')
                      ? 'text-primary border-b-2 border-primary bg-slate-50/50'
                      : 'text-slate-550 hover:text-primary hover:bg-slate-50/30'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">mail</span>
                  Messages
                </Link>

                {/* 5. Gestion Filière */}
                <Link
                  to="/filiere-management"
                  className={`flex items-center gap-2 px-4 h-full font-inter text-sm font-medium transition-all ${
                    isActive('/filiere-management')
                      ? 'text-primary border-b-2 border-primary bg-slate-50/50'
                      : 'text-slate-550 hover:text-primary hover:bg-slate-50/30'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                  Gestion Filière
                </Link>
              </>
            ) : (
              <>
                {/* Main Links */}
                {mainLinks.filter(link => isPrivileged || !link.adminOnly).map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-2 px-4 h-full font-inter text-sm font-medium transition-all ${
                      isActive(link.path)
                        ? 'text-primary border-b-2 border-primary bg-slate-50/50'
                        : 'text-slate-550 hover:text-primary hover:bg-slate-50/30'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">{link.icon}</span>
                    {link.label}
                  </Link>
                ))}

                {/* Faculty & Volume Horaire Dropdown */}
                {isAdmin && (
                  <div className="relative group px-1 h-full flex items-center">
                    <button
                      className={`flex items-center gap-2 px-4 h-12 font-inter text-sm font-medium rounded-lg transition-all ${
                        isActive('/faculty') || isActive('/workload-stats')
                          ? 'text-primary bg-slate-50'
                          : 'text-slate-550 hover:text-primary hover:bg-slate-50/30'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">monitoring</span>
                      Volume Horaire
                      <span className="material-symbols-outlined text-sm transition-transform group-hover:rotate-180">expand_more</span>
                    </button>
                    
                    {/* Dropdown Menu */}
                    <div className="absolute left-0 top-[calc(100%-8px)] w-60 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      <Link
                        to="/faculty"
                        className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                          isActive('/faculty')
                            ? 'text-primary bg-sky-50/50 font-semibold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="material-symbols-outlined text-lg">groups</span>
                        {t('common.faculty')}
                      </Link>
                      <Link
                        to="/workload-stats"
                        className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                          isActive('/workload-stats')
                            ? 'text-primary bg-sky-50/50 font-semibold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="material-symbols-outlined text-lg">monitoring</span>
                        Volume Horaire
                      </Link>
                    </div>
                  </div>
                )}

                {/* Programs Dropdown (Privileged only) */}
                {isPrivileged && (
                  <div className="relative group px-1 h-full flex items-center">
                    <Link
                      to="/programs"
                      className={`flex items-center gap-2 px-4 h-12 font-inter text-sm font-medium rounded-lg transition-all ${
                        isActive('/programs') || programLinks.some(link => isActive(link.path))
                          ? 'text-primary bg-slate-50'
                          : 'text-slate-550 hover:text-primary hover:bg-slate-50/30'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">account_tree</span>
                      {t('common.programs')}
                      <span className="material-symbols-outlined text-sm transition-transform group-hover:rotate-180">expand_more</span>
                    </Link>
                    
                    {/* Dropdown Menu */}
                    <div className="absolute left-0 top-[calc(100%-8px)] w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      {programLinks.map((link) => (
                        <Link
                          key={link.path}
                          to={link.path}
                          className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                            isActive(link.path)
                              ? 'text-primary bg-sky-50/50 font-semibold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className="material-symbols-outlined text-lg">{link.icon}</span>
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                 {/* Chef de Département Personal Dropdown */}
                 {user?.role && user.role.includes('CHEF_DEPARTEMENT') && (
                   <div className="relative group px-1 h-full flex items-center">
                     <button
                       className={`flex items-center gap-2 px-4 h-12 font-inter text-sm font-medium rounded-lg transition-all ${
                         isActive('/consultation') || isActive('/my-timetable') || isActive('/evaluations')
                           ? 'text-primary bg-slate-50'
                           : 'text-slate-550 hover:text-primary hover:bg-slate-50/30'
                       }`}
                     >
                       <span className="material-symbols-outlined text-lg">person</span>
                       Espace Personnel
                       <span className="material-symbols-outlined text-sm transition-transform group-hover:rotate-180">expand_more</span>
                     </button>
                     
                     {/* Dropdown Menu */}
                     <div className="absolute left-0 top-[calc(100%-8px)] w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                       <Link
                         to="/consultation"
                         className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                           isActive('/consultation')
                             ? 'text-primary bg-sky-50/50 font-semibold'
                             : 'text-slate-700 hover:bg-slate-50'
                         }`}
                       >
                         <span className="material-symbols-outlined text-lg">assignment_ind</span>
                         Ma charge
                       </Link>
                       <Link
                         to="/my-timetable"
                         className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                           isActive('/my-timetable')
                             ? 'text-primary bg-sky-50/50 font-semibold'
                             : 'text-slate-700 hover:bg-slate-50'
                         }`}
                       >
                         <span className="material-symbols-outlined text-lg">calendar_today</span>
                         Mon emploi du temps
                       </Link>
                       <Link
                         to="/evaluations"
                         className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                           isActive('/evaluations')
                             ? 'text-primary bg-sky-50/50 font-semibold'
                             : 'text-slate-700 hover:bg-slate-50'
                         }`}
                       >
                         <span className="material-symbols-outlined text-lg">grade</span>
                         Évaluations
                       </Link>
                     </div>
                   </div>
                 )}

                {/* Management Dropdown (Admin & Chef only) */}
                {isAdmin && (
                  <div className="relative group px-1 h-full flex items-center">
                    <button
                      className={`flex items-center gap-2 px-4 h-12 font-inter text-sm font-medium rounded-lg transition-all ${
                        managementLinks.some(link => isActive(link.path))
                          ? 'text-primary bg-slate-50'
                          : 'text-slate-550 hover:text-primary hover:bg-slate-50/30'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">settings_suggest</span>
                      {t('common.management')}
                      <span className="material-symbols-outlined text-sm transition-transform group-hover:rotate-180">expand_more</span>
                    </button>
                    
                    {/* Dropdown Menu */}
                    <div className="absolute left-0 top-[calc(100%-8px)] w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      {managementLinks.map((link) => (
                        <Link
                          key={link.path}
                          to={link.path}
                          className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                            isActive(link.path)
                              ? 'text-primary bg-sky-50/50 font-semibold'
                              : 'text-slate-700 hover:bg-slate-50'
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
                 {personalLinks.filter(link => {
                    const isProf = user?.role ? user.role.includes('ENSEIGNANT') : false;
                    const isCoord = user?.role ? user.role.includes('RESPONSABLE_FILIERE') : false;
                    const isChef = user?.role ? user.role.includes('CHEF_DEPARTEMENT') : false;
                    
                    if (isChef && (link.path === '/consultation' || link.path === '/my-timetable' || link.path === '/evaluations')) {
                      return false;
                    }
                    if (link.path === '/consultation' || link.path === '/my-timetable' || link.path === '/evaluations') {
                      return isProf;
                    }
                    if (link.path === '/filiere-management') {
                      return isCoord;
                    }
                    return !link.teacherOnly || (user?.role && !user.role.includes('UTILISATEUR'));
                 }).map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-2 px-4 h-full font-inter text-sm font-medium transition-all ${
                      isActive(link.path)
                        ? 'text-primary border-b-2 border-primary bg-slate-50/50'
                        : 'text-slate-550 hover:text-primary hover:bg-slate-50/30'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">{link.icon}</span>
                    {link.label}
                  </Link>
                ))}
              </>
            )}
          </nav>
        </div>

        {/* Right: Actions, Notifications & Profile */}
        <div className="flex items-center gap-4 h-full">
          {/* Notifications Button */}
          <Link
            to="/notifications"
            className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 rounded-xl transition-colors relative flex items-center justify-center"
            title="Notifications"
          >
            <span className="material-symbols-outlined">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-orange-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border border-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </Link>

          {/* Help Button */}
          <button
            onClick={() => window.dispatchEvent(new Event('openHelpModal'))}
            className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 rounded-xl transition-colors flex items-center justify-center"
            title="Support"
          >
            <span className="material-symbols-outlined">help</span>
          </button>

          <div className="h-6 w-px bg-slate-200 mx-1"></div>

          {/* Profile with Hover Dropdown */}
          <div className="relative group h-full flex items-center">
            <button className="flex items-center gap-3 pl-3 hover:opacity-85 transition-opacity focus:outline-none h-full">
              <div className="flex flex-col items-end hidden sm:flex text-right -space-y-1">
                <span className="text-sm font-bold text-slate-800">
                  {loading ? '...' : (user ? `${user.prenom} ${user.nom}` : t('common.unassigned'))}
                </span>
                <span className="text-[10px] font-medium text-slate-400 capitalize">
                  {user?.role.toLowerCase().replace('_', ' ')}
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden border border-slate-200 flex items-center justify-center shadow-inner">
                {(!imgError && !loading && user?.photo) ? (
                  <img
                    alt="Profile"
                    className="w-full h-full object-cover"
                    src={user.photo.startsWith('http') ? user.photo : `http://localhost:8000${user.photo}`}
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <span className="text-xs font-black text-sky-850 uppercase tracking-tighter">
                    {loading ? '...' : getInitials()}
                  </span>
                )}
              </div>
              <span className="material-symbols-outlined text-slate-400 text-sm transition-transform group-hover:rotate-180">expand_more</span>
            </button>

            {/* Hover Dropdown Menu */}
            <div className="absolute right-0 top-[calc(100%-8px)] w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-2 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-2 group-hover:translate-y-0">
              <Link
                to="/profile"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">account_circle</span>
                {t('common.profile')}
              </Link>
              
              <Link
                to="/notifications"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">notifications</span>
                Notifications
              </Link>
              
              <Link
                to="/profile"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">settings</span>
                {t('common.settings')}
              </Link>
              
              <div className="border-t border-slate-100 my-1"></div>
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-650 hover:bg-red-50 transition-colors text-left"
              >
                <span className="material-symbols-outlined text-lg">logout</span>
                {t('common.logout')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopAppBar;
