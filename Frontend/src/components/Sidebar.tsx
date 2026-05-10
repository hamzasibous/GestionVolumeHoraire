import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed left-0 top-0 h-screen w-[260px] bg-slate-900 dark:bg-slate-950 border-r border-slate-800 shadow-xl flex flex-col overflow-y-auto z-40">
      {/* Header */}
      <div className="px-6 py-8 border-b border-slate-800/50">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded bg-sky-500 flex items-center justify-center">
            <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance</span>
          </div>
          <h1 className="text-xl font-black tracking-tight text-white">GVH Portal</h1>
        </div>
        <p className="font-inter antialiased text-sm font-medium text-slate-400">Management System</p>
      </div>
      {/* Main Tabs */}
      <ul className="flex-1 mt-4">
        <li>
          <Link
            to="/"
            className={`flex items-center gap-3 px-4 py-3 font-inter antialiased text-sm font-medium transition-transform active:scale-95 ${
              isActive('/') ? 'text-white bg-slate-800 border-l-4 border-orange-500' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined">dashboard</span>
            Dashboard
          </Link>
        </li>
        <li>
          <Link
            to="/programs"
            className={`flex items-center gap-3 px-4 py-3 font-inter antialiased text-sm font-medium transition-transform active:scale-95 ${
              isActive('/programs') ? 'text-white bg-slate-800 border-l-4 border-orange-500' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined">account_tree</span>
            Programs
          </Link>
        </li>
        <li>
          <Link
            to="/faculty"
            className={`flex items-center gap-3 px-4 py-3 font-inter antialiased text-sm font-medium transition-transform active:scale-95 ${
              isActive('/faculty') ? 'text-white bg-slate-800 border-l-4 border-orange-500' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined">groups</span>
            Faculty
          </Link>
        </li>
        <li>
          <Link
            to="/forecasting"
            className={`flex items-center gap-3 px-4 py-3 font-inter antialiased text-sm font-medium transition-transform active:scale-95 ${
              isActive('/forecasting') ? 'text-white bg-slate-800 border-l-4 border-orange-500' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined">analytics</span>
            Forecasting
          </Link>
        </li>
        <li>
          <Link
            to="/consultation"
            className={`flex items-center gap-3 px-4 py-3 font-inter antialiased text-sm font-medium transition-transform active:scale-95 ${
              isActive('/consultation') ? 'text-white bg-slate-800 border-l-4 border-orange-500' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined">person</span>
            My Workload
          </Link>
        </li>
      </ul>
      {/* Footer Tabs */}
      <ul className="mb-4">
        <li>
          <Link
            to="/settings"
            className={`flex items-center gap-3 px-4 py-3 font-inter antialiased text-sm font-medium transition-transform active:scale-95 ${
              isActive('/settings') ? 'text-white bg-slate-800 border-l-4 border-orange-500' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined">settings</span>
            Settings
          </Link>
        </li>
        <li>
          <Link
            to="/help"
            className={`flex items-center gap-3 px-4 py-3 font-inter antialiased text-sm font-medium transition-transform active:scale-95 ${
              isActive('/help') ? 'text-white bg-slate-800 border-l-4 border-orange-500' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined">help</span>
            Help
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Sidebar;
