import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import TopAppBar from './TopAppBar';

interface LayoutProps {
  children: React.ReactNode;
}

interface User {
  id: number;
  nom: string;
  prenom: string;
  role: string;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { t } = useTranslation();
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [profs, setProfs] = useState<User[]>([]);
  const [selectedProfId, setSelectedProfId] = useState<string>('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    if (isHelpModalOpen) {
      // Fetch profs and current user
      const fetchData = async () => {
        try {
          const token = localStorage.getItem('access_token');
          
          // Fetch current user
          const meRes = await fetch('http://localhost:8000/api/users/profile/', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (meRes.ok) setCurrentUser(await meRes.ok ? await meRes.json() : null);

          // Fetch all users and filter for ENSEIGNANT
          const usersRes = await fetch('http://localhost:8000/api/users/management/', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (usersRes.ok) {
            const allUsers = await usersRes.json();
            setProfs(allUsers.filter((u: any) => u.role === 'ENSEIGNANT' || u.role === 'CHEF_DEPARTEMENT'));
          }
        } catch (error) {
          console.error('Error fetching help data:', error);
        }
      };
      fetchData();
    }
  }, [isHelpModalOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfId || !message || !currentUser) return;

    setIsSending(true);
    
    // Simulate sending by adding to localStorage notifications
    const targetProf = profs.find(p => p.id.toString() === selectedProfId);
    const newNotification = {
      id: Date.now(),
      type: 'HELP_REQUEST',
      title: 'Demande d\'assistance',
      message: message,
      from: `${currentUser.prenom} ${currentUser.nom}`,
      recipientId: parseInt(selectedProfId),
      timestamp: new Date().toISOString(),
      read: false
    };

    const existing = JSON.parse(localStorage.getItem('notifications') || '[]');
    localStorage.setItem('notifications', JSON.stringify([...existing, newNotification]));
    
    // Alert and close
    setTimeout(() => {
      alert(`Message envoyé à ${targetProf?.prenom} ${targetProf?.nom} !`);
      setIsSending(false);
      setIsHelpModalOpen(false);
      setMessage('');
      setSelectedProfId('');
      window.dispatchEvent(new Event('notificationsUpdate'));
    }, 500);
  };

  return (
    <div className="flex flex-col min-h-screen relative">
      <TopAppBar />
      <main className="flex-1 p-md lg:p-lg">
        {children}
      </main>

      {/* Floating Aide Button */}
      <button 
        onClick={() => setIsHelpModalOpen(true)}
        className="fixed bottom-8 left-8 z-[100] bg-slate-900 text-white p-4 rounded-full shadow-2xl hover:bg-sky-600 transition-all group flex items-center gap-0 hover:gap-3 overflow-hidden border border-slate-700 hover:border-sky-400"
      >
        <span className="material-symbols-outlined text-2xl">help</span>
        <span className="max-w-0 group-hover:max-w-[100px] transition-all duration-300 font-bold uppercase text-[10px] tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100">
          {t('common.help')}
        </span>
      </button>

      {/* Help Modal */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <div className="p-2 bg-sky-500/20 rounded-lg"><span className="material-symbols-outlined text-sky-400">support_agent</span></div>
                <h3 className="text-lg font-black uppercase tracking-tight">Besoin d'aide ?</h3>
              </div>
              <button onClick={() => setIsHelpModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSendMessage} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Destinataire (Enseignant)</label>
                <select 
                  required
                  value={selectedProfId}
                  onChange={(e) => setSelectedProfId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">Sélectionner un enseignant...</option>
                  {profs.map(p => (
                    <option key={p.id} value={p.id}>Pr. {p.nom} {p.prenom}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Votre Message</label>
                <textarea 
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Décrivez votre problème ou posez votre question..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all h-32 resize-none"
                />
              </div>

              <div className="pt-6 border-t border-slate-100 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsHelpModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={isSending || !selectedProfId || !message}
                  className={`flex-1 bg-slate-900 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 ${isSending ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-800'}`}
                >
                  <span className="material-symbols-outlined text-sm">{isSending ? 'sync' : 'send'}</span>
                  {isSending ? 'Envoi...' : 'Envoyer le message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
