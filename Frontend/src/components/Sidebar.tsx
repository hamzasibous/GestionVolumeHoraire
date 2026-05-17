import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  return (
    <nav className="fixed left-0 top-0 h-screen w-[260px] bg-slate-900 dark:bg-slate-950 border-r border-slate-800 shadow-xl flex flex-col overflow-y-auto z-40">
      {/* Header */}
      <div className="px-6 py-8 border-b border-slate-800/50">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded bg-sky-500 flex items-center justify-center">
            <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance</span>
          </div>
          <h1 className="text-xl font-black tracking-tight text-white uppercase tracking-tighter">GVH Portal</h1>
        </div>
        <p className="font-inter antialiased text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-60">Management System</p>
      </div>
      {/* Main Tabs */}
      <ul className="flex-1 mt-4 space-y-1">
        <li>
          <Link
            to="/"
            className={`flex items-center gap-3 px-6 py-3 font-inter antialiased text-xs font-bold uppercase tracking-widest transition-all active:scale-95 ${
              isActive('/') ? 'text-white bg-slate-800 border-l-4 border-orange-500' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-sm">dashboard</span>
            Dashboard
          </Link>
        </li>
        <li>
          <Link
            to="/programs"
            className={`flex items-center gap-3 px-6 py-3 font-inter antialiased text-xs font-bold uppercase tracking-widest transition-all active:scale-95 ${
              isActive('/programs') || location.pathname.startsWith('/programs/') ? 'text-white bg-slate-800 border-l-4 border-orange-500' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-sm">account_tree</span>
            Programs
          </Link>
        </li>
        <li>
          <Link
            to="/faculty"
            className={`flex items-center gap-3 px-6 py-3 font-inter antialiased text-xs font-bold uppercase tracking-widest transition-all active:scale-95 ${
              isActive('/faculty') ? 'text-white bg-slate-800 border-l-4 border-orange-500' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-sm">groups</span>
            Faculty
          </Link>
        </li>
        <li>
          <Link
            to="/forecasting"
            className={`flex items-center gap-3 px-6 py-3 font-inter antialiased text-xs font-bold uppercase tracking-widest transition-all active:scale-95 ${
              isActive('/forecasting') ? 'text-white bg-slate-800 border-l-4 border-orange-500' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-sm">analytics</span>
            Forecasting
          </Link>
        </li>
        <li>
          <Link
            to="/consultation"
            className={`flex items-center gap-3 px-6 py-3 font-inter antialiased text-xs font-bold uppercase tracking-widest transition-all active:scale-95 ${
              isActive('/consultation') ? 'text-white bg-slate-800 border-l-4 border-orange-500' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-sm">person</span>
            My Workload
          </Link>
        </li>
      </ul>
      {/* Footer Tabs */}
      <ul className="mb-4 border-t border-slate-800/50 pt-4">
        <li>
          <Link
            to="/settings"
            className={`flex items-center gap-3 px-6 py-3 font-inter antialiased text-xs font-bold uppercase tracking-widest transition-all active:scale-95 ${
              isActive('/settings') ? 'text-white bg-slate-800 border-l-4 border-orange-500' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-sm">settings</span>
            Settings
          </Link>
        </li>
        <li>
          <Link
            to="/help"
            className={`flex items-center gap-3 px-6 py-3 font-inter antialiased text-xs font-bold uppercase tracking-widest transition-all active:scale-95 ${
              isActive('/help') ? 'text-white bg-slate-800 border-l-4 border-orange-500' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-sm">help</span>
            Help
          </Link>
        </li>
        <li>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-6 py-3 font-inter antialiased text-xs font-bold uppercase tracking-widest transition-all active:scale-95 text-slate-400 hover:bg-red-500/10 hover:text-red-500"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            Logout
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Sidebar;
