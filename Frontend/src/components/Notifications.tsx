import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  from: string;
  senderId?: number;
  recipientId: number;
  read: boolean;
  timestamp: string;
  attachmentName?: string;
  attachmentUrl?: string;
  attachmentType?: string;
}

interface Teacher {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
}

interface UserProfile {
  id: number;
  nom: string;
  prenom: string;
  role: string;
  filiere_name?: string;
}

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null);
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);

  // Fetch initial profile, faculty members, and load local messages
  const loadData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const profileResponse = await fetch('http://localhost:8000/api/users/profile/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setCurrentUser(profileData);

        const usersResponse = await fetch('http://localhost:8000/api/users/management/', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const usersData = await usersResponse.json();
        const isStudent = profileData.role && profileData.role.includes('UTILISATEUR') && 
                          !profileData.role.includes('ENSEIGNANT') && 
                          !profileData.role.includes('ADMIN') && 
                          !profileData.role.includes('CHEF_DEPARTEMENT');
        if (isStudent) {
          navigate('/');
          return;
        }

        // Only between profs/coordinators/admins
        const contacts = usersData.filter((u: any) => 
          u.id !== profileData.id && 
          (u.role?.includes('ENSEIGNANT') || u.role?.includes('ADMIN') || u.role?.includes('CHEF_DEPARTEMENT')) &&
          !u.nom?.toLowerCase().includes('assign')
        );
        setTeachers(contacts);

        const saved = JSON.parse(localStorage.getItem('notifications') || '[]');
        setNotifications(saved);

        if (contacts.length > 0) {
          setSelectedTeacherId(contacts[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading messaging data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Listen for updates from other parts of the application
    const handleUpdate = () => {
      const saved = JSON.parse(localStorage.getItem('notifications') || '[]');
      setNotifications(saved);
    };
    window.addEventListener('notificationsUpdate', handleUpdate);
    return () => {
      window.removeEventListener('notificationsUpdate', handleUpdate);
    };
  }, []);

  // Mark selected teacher's messages as read
  useEffect(() => {
    if (!selectedTeacherId || !currentUser) return;
    const teacher = teachers.find(t => t.id === selectedTeacherId);
    if (!teacher) return;
    
    const saved = JSON.parse(localStorage.getItem('notifications') || '[]');
    let modified = false;
    const updated = saved.map((notif: any) => {
      if (
        notif.recipientId === currentUser.id && 
        (notif.senderId === selectedTeacherId || notif.from === `${teacher.prenom} ${teacher.nom}`) && 
        !notif.read
      ) {
        modified = true;
        return { ...notif, read: true };
      }
      return notif;
    });
    
    if (modified) {
      localStorage.setItem('notifications', JSON.stringify(updated));
      setNotifications(updated);
      window.dispatchEvent(new Event('notificationsUpdate'));
    }
  }, [selectedTeacherId, currentUser, teachers]);

  // Auto-scroll chat area on message updates or thread change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedTeacherId, notifications]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setFileDataUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Send a message to the selected teacher
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && !selectedFile) || !currentUser || !selectedTeacherId) return;

    const newMsg: Notification = {
      id: Date.now(),
      type: 'HELP_REQUEST',
      title: 'Message de la Filière',
      message: inputText.trim() || `Fichier joint: ${selectedFile?.name}`,
      from: `${currentUser.prenom} ${currentUser.nom}`,
      senderId: currentUser.id,
      recipientId: selectedTeacherId,
      read: false,
      timestamp: new Date().toISOString(),
      attachmentName: selectedFile?.name,
      attachmentUrl: fileDataUrl || undefined,
      attachmentType: selectedFile?.type
    };

    const saved = JSON.parse(localStorage.getItem('notifications') || '[]');
    const updated = [...saved, newMsg];
    localStorage.setItem('notifications', JSON.stringify(updated));
    setNotifications(updated);
    setInputText('');
    setSelectedFile(null);
    setFileDataUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    window.dispatchEvent(new Event('notificationsUpdate'));
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0) || ''}${lastName.charAt(0) || ''}`.toUpperCase();
  };

  const formatTimeAgo = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(isoString).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  // Get last message of a teacher's conversation thread
  const getLastMessage = (teacherId: number, teacherName: string) => {
    const thread = notifications.filter(notif => 
      (notif.recipientId === currentUser?.id && (notif.senderId === teacherId || notif.from === teacherName)) ||
      (notif.senderId === currentUser?.id && notif.recipientId === teacherId)
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (thread.length === 0) return { message: 'Pas de message', timestamp: '' };
    return thread[thread.length - 1];
  };

  // Get unread messages count from a teacher
  const getUnreadCount = (teacherId: number, teacherName: string) => {
    return notifications.filter(notif => 
      notif.recipientId === currentUser?.id && 
      (notif.senderId === teacherId || notif.from === teacherName) && 
      !notif.read
    ).length;
  };

  // Filtered teachers list based on search bar input, sorted by last message timestamp (most recent first)
  const filteredTeachers = teachers
    .filter(t => 
      `${t.prenom} ${t.nom}`.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const lastA = getLastMessage(a.id, `${a.prenom} ${a.nom}`);
      const lastB = getLastMessage(b.id, `${b.prenom} ${b.nom}`);
      
      const timeA = lastA.timestamp ? new Date(lastA.timestamp).getTime() : 0;
      const timeB = lastB.timestamp ? new Date(lastB.timestamp).getTime() : 0;
      
      return timeB - timeA;
    });

  const selectedTeacher = teachers.find(t => t.id === selectedTeacherId);

  // Group thread messages between the current logged-in user and the selected teacher
  const activeThread = notifications.filter(notif => 
    (notif.recipientId === currentUser?.id && notif.senderId === selectedTeacherId) || // received from teacher
    (notif.recipientId === currentUser?.id && !notif.senderId && notif.from === `${selectedTeacher?.prenom} ${selectedTeacher?.nom}`) || // fallback matching by name
    (notif.senderId === currentUser?.id && notif.recipientId === selectedTeacherId) // sent to teacher
  ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const isStudent = currentUser?.role && currentUser.role.includes('UTILISATEUR') && 
                    !currentUser.role.includes('ENSEIGNANT') && 
                    !currentUser.role.includes('ADMIN') && 
                    !currentUser.role.includes('CHEF_DEPARTEMENT');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto h-[calc(100vh-100px)] flex bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in duration-500">
      {/* Faculty Conversations Sidebar */}
      <aside className="w-[320px] flex flex-col bg-slate-50 border-r border-slate-200 flex-shrink-0">
        <div className="p-5 border-b border-slate-200 bg-white">
          <h1 className="font-h3 text-xl font-black text-primary mb-1">Messages</h1>
          <p className="font-label-caps text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
            {currentUser?.filiere_name || "Filière Académique"}
          </p>
          <div className="mt-4 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
            <input 
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
              placeholder={isStudent ? "Rechercher un enseignant ou admin..." : "Rechercher un étudiant..."}
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 message-scrollbar">
          {filteredTeachers.length > 0 ? (
            filteredTeachers.map((t) => {
              const last = getLastMessage(t.id, `${t.prenom} ${t.nom}`);
              const isSelected = t.id === selectedTeacherId;
              
              return (
                <div 
                  key={t.id} 
                  onClick={() => setSelectedTeacherId(t.id)}
                  className={`flex items-start gap-3 p-4 cursor-pointer transition-colors border-l-4 ${
                    isSelected ? 'bg-sky-50/50 border-sky-500' : 'hover:bg-slate-100/50 border-transparent bg-white'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-black flex-shrink-0 text-sm relative shadow-inner">
                    {getInitials(t.prenom, t.nom)}
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-bold text-slate-800 text-xs truncate">{t.prenom} {t.nom}</span>
                      <div className="flex items-center gap-1.5">
                        {getUnreadCount(t.id, `${t.prenom} ${t.nom}`) > 0 && (
                          <span className="bg-secondary text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[16px] text-center">
                            {getUnreadCount(t.id, `${t.prenom} ${t.nom}`)}
                          </span>
                        )}
                        {last.timestamp && (
                          <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap">
                            {formatTimeAgo(last.timestamp)}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className={`text-xs truncate ${getUnreadCount(t.id, `${t.prenom} ${t.nom}`) > 0 ? 'text-slate-900 font-black' : isSelected ? 'text-slate-600 font-semibold' : 'text-slate-400'}`}>
                      {last.message}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs italic">
              {isStudent ? "Aucun enseignant ou admin trouvé" : "Aucun étudiant trouvé"}
            </div>
          )}
        </div>
      </aside>

      {/* Message Thread Canvas */}
      {selectedTeacher ? (
        <section className="flex-1 flex flex-col bg-slate-50">
          {/* Thread Header */}
          <header className="h-16 px-6 flex items-center justify-between border-b border-slate-200 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold relative shadow-inner">
                {getInitials(selectedTeacher.prenom, selectedTeacher.nom)}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-800">{selectedTeacher.prenom} {selectedTeacher.nom}</h2>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">En ligne</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors" title="Appeler"><span className="material-symbols-outlined text-xl">call</span></button>
              <button className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors" title="Vidéo"><span className="material-symbols-outlined text-xl">videocam</span></button>
              <button className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors" title="Infos"><span className="material-symbols-outlined text-xl">info</span></button>
            </div>
          </header>

          {/* Conversation Scroll Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 message-scrollbar bg-slate-100/30">
            {activeThread.length > 0 ? (
              activeThread.map((msg) => {
                const isMe = msg.senderId === currentUser?.id;
                
                return (
                  <div 
                    key={msg.id}
                    className={`flex items-end gap-2 max-w-[80%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}
                  >
                    {!isMe && (
                      <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex-shrink-0 flex items-center justify-center text-[10px] font-bold shadow-inner">
                        {getInitials(selectedTeacher.prenom, selectedTeacher.nom)}
                      </div>
                    )}
                    <div className="flex flex-col gap-1">
                      <div className={`p-3 rounded-2xl shadow-sm border ${
                        isMe 
                          ? 'bg-primary text-on-primary border-primary rounded-br-none' 
                          : 'bg-white text-slate-800 border-slate-200 rounded-bl-none'
                      }`}>
                        {msg.attachmentName && msg.attachmentUrl && (
                          <div className="mb-2">
                            {msg.attachmentType?.startsWith('image/') ? (
                              <img src={msg.attachmentUrl} alt={msg.attachmentName} className="max-w-[240px] rounded-lg border border-slate-200 max-h-[160px] object-cover mb-1" />
                            ) : (
                              <a 
                                href={msg.attachmentUrl} 
                                download={msg.attachmentName}
                                className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold border transition-colors ${
                                  isMe ? 'bg-primary-container text-on-primary-container border-primary-container hover:bg-primary-container/85' : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                <span className="material-symbols-outlined text-lg">description</span>
                                <span className="truncate max-w-[160px]">{msg.attachmentName}</span>
                                <span className="material-symbols-outlined text-sm ml-auto">download</span>
                              </a>
                            )}
                          </div>
                        )}
                        <p className="text-sm font-medium leading-relaxed">{msg.message}</p>
                      </div>
                      <span className={`text-[9px] font-bold text-slate-400 ${isMe ? 'mr-1 text-right' : 'ml-1'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                <span className="material-symbols-outlined text-4xl opacity-20">chat</span>
                <p className="text-xs italic">Aucun message échangé. Commencer la conversation.</p>
              </div>
            )}
            <div ref={messageEndRef} />
          </div>

          {/* Input Bar */}
          <footer className="p-4 border-t border-slate-200 bg-white">
            {selectedFile && (
              <div className="mb-3 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-600 animate-in slide-in-from-bottom duration-200">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-primary">attach_file</span>
                  <span className="font-bold truncate max-w-[240px] text-slate-700">{selectedFile.name}</span>
                  <span className="text-[10px] text-slate-400">({Math.round(selectedFile.size / 1024)} KB)</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => { setSelectedFile(null); setFileDataUrl(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            )}

            <form onSubmit={handleSendMessage} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
              />
              <button type="button" className="p-2 text-slate-400 hover:text-primary transition-colors">
                <span className="material-symbols-outlined">add_circle</span>
              </button>
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-slate-400 hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined">attach_file</span>
              </button>
              <input 
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                className="flex-1 border-none focus:ring-0 text-sm bg-transparent outline-none text-slate-800 placeholder-slate-400 py-1" 
                placeholder={selectedFile ? "Ajouter un message ou envoyer le fichier..." : "Écrire un message..."}
              />
              <button type="button" className="p-2 text-slate-400 hover:text-primary transition-colors">
                <span className="material-symbols-outlined">sentiment_satisfied</span>
              </button>
              <button 
                type="submit"
                className="bg-primary text-on-primary p-2.5 rounded-lg flex items-center justify-center hover:bg-primary-container transition-all active:scale-95 shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">send</span>
              </button>
            </form>
            <div className="mt-2 text-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Appuyer sur Entrée pour envoyer</p>
            </div>
          </footer>
        </section>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50 gap-3">
          <span className="material-symbols-outlined text-5xl opacity-20 animate-bounce">forum</span>
          <p className="text-sm font-semibold">
            {isStudent 
              ? "Sélectionner un enseignant ou admin pour démarrer la messagerie" 
              : "Sélectionner un étudiant pour démarrer la messagerie"}
          </p>
        </div>
      )}
    </div>
  );
};

export default Notifications;
