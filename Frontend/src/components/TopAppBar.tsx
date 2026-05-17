import React from 'react';
import { Link } from 'react-router-dom';

const TopAppBar: React.FC = () => {
  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-sm border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 h-16">
      {/* Left: Brand & Nav */}
      <div className="flex items-center gap-8">
        <div className="text-lg font-bold text-sky-900 dark:text-white tracking-wide font-inter text-sm">Système de Gestion Volume Horaire</div>
        <nav className="hidden md:flex gap-6">
          <a className="text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-300 font-inter text-sm tracking-wide transition-colors" href="#">Directives</a>
          <a className="text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-300 font-inter text-sm tracking-wide transition-colors" href="#">Reports</a>
        </nav>
      </div>
      {/* Right: Actions & Profile */}
      <div className="flex items-center gap-4">
        <button className="text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-300 transition-colors p-2 rounded-full focus-within:ring-2 focus-within:ring-sky-500">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button className="text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-300 transition-colors p-2 rounded-full focus-within:ring-2 focus-within:ring-sky-500">
          <span className="material-symbols-outlined">apps</span>
        </button>
        <Link to="/profile" className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden ml-2 border border-slate-300 hover:opacity-80 transition-opacity">
          <img alt="Administrator Profile" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAO0_vv-zPr7AMWByoXAAb8eQ_QmdsQpvYCf9rtSr8Hp1sFQkkfDM0DbmeCHCHNJFkBguBJZ7ZhT3dXs34xXV9sYZAvvyRZEl9yqBou1L9XG_muJk8y4Skl0zsYSmBdtm5F56Zz6YIm22JUUEFIJnf7fz0x36Ek__fN7zbi_gZtfpwXbkJo9RaNr3CGHOtFYKw1pnx6DHni0yuecWgBJM0KKLfhcb_wT2u8PO2EXHnJ1DBD3FzEZQHZ-zpFmCMb8eUUpcCXTewHC4Bf" />
        </Link>
      </div>
    </header>
  );
};

export default TopAppBar;
