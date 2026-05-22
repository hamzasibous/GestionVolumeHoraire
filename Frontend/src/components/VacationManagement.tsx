import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface Vacation {
  id: string;
  teacherName: string;
  startDate: string;
  endDate: string;
  type: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

interface User {
  id: number;
  nom: string;
  prenom: string;
}

const VacationManagement: React.FC = () => {
  const { t } = useTranslation();
  const [vacations, setVacations] = useState<Vacation[]>([
    { id: '1', teacherName: 'Sarah Jenkins', startDate: '2024-06-15', endDate: '2024-06-25', type: 'Annual Leave', status: 'Approved' },
    { id: '2', teacherName: 'Michael Kim', startDate: '2024-07-01', endDate: '2024-07-05', type: 'Sick Leave', status: 'Pending' },
  ]);
  const [users, setUsers] = useState<User[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    teacherId: '',
    startDate: '',
    endDate: '',
    type: 'Annual Leave',
  });

  useEffect(() => {
    // Fetch teachers for the dropdown
    fetch('http://localhost:8000/api/users/management/')
      .then(res => res.json())
      .then(data => setUsers(data.filter((u: any) => u.role === 'ENSEIGNANT')))
      .catch(err => console.error('Error fetching teachers:', err));
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const teacher = users.find(u => u.id.toString() === formData.teacherId);
    const newVacation: Vacation = {
      id: Math.random().toString(36).substr(2, 9),
      teacherName: teacher ? `${teacher.prenom} ${teacher.nom}` : 'Unknown Teacher',
      startDate: formData.startDate,
      endDate: formData.endDate,
      type: formData.type,
      status: 'Pending',
    };
    setVacations([newVacation, ...vacations]);
    setFormData({ teacherId: '', startDate: '', endDate: '', type: 'Annual Leave' });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const simulateExtraction = () => {
    if (!selectedImage) return;
    setIsExtracting(true);
    
    // Simulating OCR/AI processing time
    setTimeout(() => {
      // Mocked data extracted from image
      setFormData({
        teacherId: users[0]?.id.toString() || '',
        startDate: '2024-08-10',
        endDate: '2024-08-20',
        type: 'Maternity/Paternity',
      });
      setIsExtracting(false);
      alert('Data extracted from image! Please review and confirm the form.');
    }, 2000);
  };

  return (
    <div className="flex flex-col gap-lg max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Page Header */}
      <div>
        <h1 className="font-h1 text-h1 text-on-surface tracking-tight">Vacation Management</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-2">Manage faculty leave requests and import data from official documents.</p>
      </div>

      <div className="grid grid-cols-12 gap-gutter">
        {/* Manual Entry Form */}
        <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm h-fit">
          <div className="flex items-center gap-2 mb-6 border-b border-outline-variant pb-4">
            <span className="material-symbols-outlined text-primary">edit_calendar</span>
            <h3 className="font-h3 text-h3 text-on-surface">New Vacation Entry</h3>
          </div>
          
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-widest font-bold">Faculty Member</label>
              <select 
                required
                className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg font-body-md focus:ring-2 focus:ring-primary/20 outline-none"
                value={formData.teacherId}
                onChange={(e) => setFormData({...formData, teacherId: e.target.value})}
              >
                <option value="">Select Teacher...</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>)}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-widest font-bold">Start Date</label>
                <input 
                  required
                  type="date" 
                  className="w-full px-4 py-2 bg-surface-bright border border-outline-variant rounded-lg font-body-md focus:ring-2 focus:ring-primary/20 outline-none"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-widest font-bold">End Date</label>
                <input 
                  required
                  type="date" 
                  className="w-full px-4 py-2 bg-surface-bright border border-outline-variant rounded-lg font-body-md focus:ring-2 focus:ring-primary/20 outline-none"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-widest font-bold">Leave Type</label>
              <select 
                className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg font-body-md focus:ring-2 focus:ring-primary/20 outline-none"
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
              >
                <option value="Annual Leave">Annual Leave</option>
                <option value="Sick Leave">Sick Leave</option>
                <option value="Maternity/Paternity">Maternity/Paternity</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <button 
              type="submit"
              className="w-full bg-primary text-on-primary py-3 rounded-lg font-bold shadow-lg hover:bg-primary/90 transition-all active:scale-95 flex items-center justify-center gap-2 mt-4"
            >
              <span className="material-symbols-outlined text-[20px]">save</span>
              Save Vacation
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-outline-variant"></div></div>
            <div className="relative flex justify-center text-xs uppercase font-bold tracking-widest">
              <span className="bg-white px-2 text-outline">Or Import from Image</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="border-2 border-dashed border-outline-variant rounded-xl p-6 flex flex-col items-center justify-center gap-3 hover:bg-surface-container-low transition-colors group cursor-pointer relative">
              <input 
                type="file" 
                accept="image/*" 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                onChange={handleImageChange}
              />
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-outline text-4xl group-hover:scale-110 transition-transform">add_a_photo</span>
                  <p className="text-xs text-on-surface-variant font-medium">Click to upload document photo</p>
                </>
              )}
            </div>
            <button 
              onClick={simulateExtraction}
              disabled={!selectedImage || isExtracting}
              className={`w-full py-2.5 border-2 border-secondary text-secondary rounded-lg font-bold uppercase text-[10px] tracking-widest hover:bg-secondary/5 transition-all flex items-center justify-center gap-2 ${(!selectedImage || isExtracting) && 'opacity-50 grayscale'}`}
            >
              <span className="material-symbols-outlined text-[18px]">{isExtracting ? 'hourglass_empty' : 'document_scanner'}</span>
              {isExtracting ? 'Processing Image...' : 'Extract Data Automatically'}
            </button>
          </div>
        </div>

        {/* Vacations List */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-outline-variant bg-surface-bright flex justify-between items-center">
            <h3 className="font-h3 text-h3 text-on-surface">Scheduled Vacations</h3>
            <span className="px-3 py-1 bg-primary-fixed text-on-primary-fixed rounded-full text-xs font-bold uppercase tracking-widest">{vacations.length} Entries</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-lowest border-b border-outline-variant">
                  <th className="px-6 py-4 font-label-caps text-label-caps text-outline uppercase tracking-wider">Teacher</th>
                  <th className="px-6 py-4 font-label-caps text-label-caps text-outline uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-4 font-label-caps text-label-caps text-outline uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 font-label-caps text-label-caps text-outline uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 font-label-caps text-label-caps text-outline uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="font-table-data text-table-data divide-y divide-outline-variant/30">
                {vacations.map((v) => (
                  <tr key={v.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-on-surface">{v.teacherName}</div>
                      <div className="text-[11px] text-outline">Computer Science</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium">{v.startDate}</span>
                        <span className="text-[10px] text-outline uppercase">to {v.endDate}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-on-surface-variant">{v.type}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${
                        v.status === 'Approved' ? 'bg-primary-fixed text-on-primary-fixed' : 
                        v.status === 'Rejected' ? 'bg-error-container text-on-error' : 
                        'bg-secondary-fixed text-on-secondary-fixed'
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-1.5 text-outline hover:text-primary transition-colors">
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button 
                          className="p-1.5 text-outline hover:text-error transition-colors"
                          onClick={() => setVacations(vacations.filter(vac => vac.id !== v.id))}
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {vacations.length === 0 && (
            <div className="p-20 flex flex-col items-center justify-center text-on-surface-variant opacity-40 italic">
              <span className="material-symbols-outlined text-6xl mb-4">event_busy</span>
              <p>No vacations recorded yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VacationManagement;
