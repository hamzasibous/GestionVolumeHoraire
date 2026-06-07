import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  from: string;
  recipientId: number;
  timestamp: string;
  read: boolean;
}

interface UserProfile {
  id: number;
  role: string;
}

const Notifications: React.FC = () => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileAndNotifications = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        const response = await fetch('http://localhost:8000/api/users/profile/', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);

          const saved = JSON.parse(localStorage.getItem('notifications') || '[]');
          // Filter notifications for this user
          const myNotifications = saved.filter((n: Notification) => n.recipientId === userData.id);
          setNotifications(myNotifications);
          
          // Mark as read only MY notifications in the global store
          const updatedGlobal = saved.map((n: Notification) => 
            n.recipientId === userData.id ? { ...n, read: true } : n
          );
          localStorage.setItem('notifications', JSON.stringify(updatedGlobal));
          window.dispatchEvent(new Event('notificationsUpdate'));
        }
      } catch (error) {
        console.error('Error in Notifications page:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndNotifications();
  }, []);

  const clearAll = () => {
    if (!user) return;
    const globalNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    // Keep notifications that are NOT for this user
    const remaining = globalNotifications.filter((n: Notification) => n.recipientId !== user.id);
    localStorage.setItem('notifications', JSON.stringify(remaining));
    setNotifications([]);
    window.dispatchEvent(new Event('notificationsUpdate'));
  };

  const deleteNotification = (id: number) => {
    const globalNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const updated = globalNotifications.filter((n: Notification) => n.id !== id);
    localStorage.setItem('notifications', JSON.stringify(updated));
    setNotifications(notifications.filter(n => n.id !== id));
    window.dispatchEvent(new Event('notificationsUpdate'));
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-700 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Notifications</h1>
          <p className="text-slate-400 text-sm">Gérez vos alertes et demandes d'assistance</p>
        </div>
        {notifications.length > 0 && (
          <button 
            onClick={clearAll}
            className="text-xs font-bold text-red-400 hover:text-red-300 uppercase tracking-widest flex items-center gap-1 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">delete_sweep</span>
            Tout effacer
          </button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700 border-dashed rounded-2xl py-20 flex flex-col items-center justify-center text-slate-500">
            <span className="material-symbols-outlined text-5xl mb-4 opacity-20">notifications_off</span>
            <p className="font-medium italic">Aucune notification pour le moment</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div 
              key={notif.id}
              className="bg-slate-800 border border-slate-700 rounded-2xl p-6 transition-all group relative overflow-hidden shadow-lg shadow-black/20"
            >
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-sky-500/10 text-sky-400">
                  <span className="material-symbols-outlined text-2xl">support_agent</span>
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white tracking-tight">{notif.title}</h3>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      {formatDate(notif.timestamp)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-sky-400/80 uppercase">De: {notif.from}</span>
                  </div>

                  <p className="text-slate-300 text-sm leading-relaxed bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 italic">
                    "{notif.message}"
                  </p>
                </div>

                <button 
                  onClick={() => deleteNotification(notif.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-slate-500 hover:text-red-400"
                  title="Supprimer"
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
