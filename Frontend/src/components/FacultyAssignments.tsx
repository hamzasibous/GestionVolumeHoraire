import React, { useState, useEffect } from 'react';

interface Assignment {
  id: string;
  moduleCode: string;
  moduleName: string;
  type: string;
  hours: number;
}

interface FacultyMember {
  id: string;
  name: string;
  department: string;
  title: string;
  avatar?: string;
  initials?: string;
  workload: number;
  maxWorkload: number;
  assignments: Assignment[];
  isOverloaded?: boolean;
}

const mockFaculty: FacultyMember[] = [
  {
    id: '1',
    name: 'Dr. Sarah Jenkins',
    department: 'Computer Science',
    title: 'Professor',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3u1cNHcEIEItz41MHGmECZYZ7C5JCfjXj9DPIPfwVg3GumZ5p36ApEhLgMz5ICC3CgsY1sdbrq_C-tk_K91FLRRl6h21wyOj-2mG-JU8pvclDyYKO0CJ94YznqgaQ8vT0XaCCiehS84jV599CFBsbGf5viWAMmasG6fRknCh1mTWXj3xF-OZ-rVWURh-p-HiWpb_gPMlLCYJ4RQibD-1dHvVZU1NDSDaahatqMkMdC_jBvhX9opKp1e0rm_YwbEYEF-hnZKVts8Lr',
    workload: 210,
    maxWorkload: 192,
    isOverloaded: true,
    assignments: [
      { id: 'a1', moduleCode: 'CS301', moduleName: 'Advanced Algorithms', type: 'Lecture', hours: 60 },
      { id: 'a2', moduleCode: 'CS301', moduleName: 'Advanced Algorithms', type: 'Seminar', hours: 30 },
      { id: 'a3', moduleCode: 'CS450', moduleName: 'Machine Learning', type: 'Lecture', hours: 60 },
      { id: 'a4', moduleCode: 'CS790', moduleName: 'Thesis Supervision', type: 'Project', hours: 60 },
    ]
  },
  {
    id: '2',
    name: 'Prof. Michael Kim',
    department: 'Mathematics',
    title: 'Assoc. Prof',
    initials: 'MK',
    workload: 178,
    maxWorkload: 192,
    assignments: [
      { id: 'a5', moduleCode: 'MATH101', moduleName: 'Calculus I', type: 'Lecture', hours: 90 },
      { id: 'a6', moduleCode: 'MATH101', moduleName: 'Calculus I', type: 'Tutorial', hours: 88 },
    ]
  },
  {
    id: '3',
    name: 'Dr. Elias Vance',
    department: 'Computer Science',
    title: 'Lecturer',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAS_5D0-WvSCyy6hVL8dxOg-PyuhSxPInquev7i7RmvuPdwo4k9mZNXHWr-RUfpZF1IJWZijOT0FlW5o-_SkE7oA2PyQiKgml9r6sXriDMKD6DZBpUK6pAhBeEhnUst-omLPEAdzXM05Du1d5tvCGN319XmHXOQEdeUVowlMMYwda2pzXIzZyOzniJFEhCjljOFqBbG1mjey8S5Qq3VWOtgbclb7LsxDK9eZ4giyBHiEjNMEd22DBPD5Itb2r1HAVj7O57TwOy3A3m-',
    workload: 90,
    maxWorkload: 192,
    assignments: [
      { id: 'a7', moduleCode: 'CS101', moduleName: 'Intro to Programming', type: 'Lecture', hours: 60 },
      { id: 'a8', moduleCode: 'CS101', moduleName: 'Intro to Programming', type: 'Tutorial', hours: 30 },
    ]
  }
];

const mockAvailableModules = [
  { code: 'CS101', name: 'Intro to Programming', type: 'Lecture', level: 'Undergrad', hours: 60 },
  { code: 'CS101', name: 'Intro to Programming', type: 'Lab Section A', level: 'Undergrad', hours: 30 },
  { code: 'SE400', name: 'Software Engineering', type: 'Lecture', level: 'Senior', hours: 45 },
  { code: 'DB200', name: 'Database Systems', type: 'Lecture', level: 'Core', hours: 60 },
];

const FacultyAssignments: React.FC = () => {
  const [faculty, setFaculty] = useState<FacultyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  
  useEffect(() => {
    fetch('http://localhost:8000/api/core/faculty-assignments/')
      .then(res => res.json())
      .then(data => {
        setFaculty(data);
        if (data.length > 0) {
          setSelectedFacultyId(data[0].id);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching faculty assignments:', err);
        setLoading(false);
      });
  }, []);

  const filteredFaculty = faculty.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = departmentFilter === 'All Departments' || member.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  const selectedFaculty = faculty.find(f => f.id === selectedFacultyId) || faculty[0];

  const totalFaculty = faculty.length;
  const avgWorkload = faculty.length > 0 
    ? Math.round(faculty.reduce((acc, curr) => acc + curr.workload, 0) / faculty.length) 
    : 0;
  const overloadCount = faculty.filter(f => f.isOverloaded).length;

  const departments = Array.from(new Set(faculty.map(f => f.department)));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">sync</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-lg">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="font-h1 text-h1 text-on-surface tracking-tight">Faculty Assignments</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Manage teaching workloads and ensure equitable distribution across the department.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-outline text-on-surface rounded hover:bg-surface-container transition-colors font-body-md text-body-md font-medium flex items-center gap-2 uppercase tracking-wider">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export
          </button>
          <button className="px-4 py-2 bg-primary text-on-primary rounded hover:bg-on-primary-fixed-variant transition-colors font-body-md text-body-md font-medium flex items-center gap-2 shadow-sm uppercase tracking-wider">
            <span className="material-symbols-outlined text-[18px]">publish</span>
            Publish Assignments
          </button>
        </div>
      </div>

      {/* Statistical Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        <div className="bg-surface-container-lowest p-md border border-outline-variant rounded-lg shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-on-primary-fixed text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
          </div>
          <div>
            <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider mb-1">Total Faculty</h3>
            <p className="font-h1 text-h1 text-on-surface">{totalFaculty}</p>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-md border border-outline-variant rounded-lg shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-secondary-fixed flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-on-secondary-fixed text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>balance</span>
          </div>
          <div>
            <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider mb-1 text-xs">Moyenne Générale</h3>
            <p className="font-h1 text-h1 text-on-surface">{avgWorkload} <span className="font-body-md text-body-md text-on-surface-variant font-normal">hrs/year</span></p>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-md border border-outline-variant rounded-lg shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-on-error-container text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
          </div>
          <div>
            <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider mb-1">Workload Alerts</h3>
            <p className="font-h1 text-h1 text-error">{overloadCount} <span className="font-body-md text-body-md text-on-surface-variant font-normal">Over capacity</span></p>
          </div>
        </div>
      </div>

      {/* Dual-Pane Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter min-h-[600px]">
        {/* Left Pane: Faculty Directory */}
        <div className="xl:col-span-4 flex flex-col bg-surface border border-outline-variant rounded-lg shadow-sm overflow-hidden">
          {/* Directory Header / Search */}
          <div className="p-4 border-b border-outline-variant bg-surface-container-lowest">
            <div className="relative w-full mb-3">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
              <input 
                className="w-full pl-10 pr-4 py-2 bg-surface-bright border border-outline-variant rounded focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md transition-colors" 
                placeholder="Search faculty..." 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select 
                className="w-full px-3 py-1.5 bg-surface-bright border border-outline-variant rounded font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                <option>All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Faculty List */}
          <div className="flex-1 overflow-y-auto">
            {filteredFaculty.map((member) => (
              <div 
                key={member.id}
                onClick={() => setSelectedFacultyId(member.id)}
                className={`p-4 border-b border-outline-variant cursor-pointer hover:bg-surface-container transition-colors relative ${
                  selectedFacultyId === member.id ? 'bg-surface-container-low' : ''
                }`}
              >
                {selectedFacultyId === member.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-surface-variant overflow-hidden shrink-0 flex items-center justify-center">
                    {member.avatar ? (
                      <img alt={member.name} className="w-full h-full object-cover" src={member.avatar} />
                    ) : (
                      <span className="font-h3 text-on-surface-variant bg-surface-container-high w-full h-full flex items-center justify-center uppercase tracking-wider">{member.initials}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-h3 text-h3 text-on-surface truncate tracking-tight">{member.name}</h4>
                      {member.isOverloaded && <span className="material-symbols-outlined text-error text-[18px]" title="Over capacity">error</span>}
                    </div>
                    <p className="font-body-md text-[13px] text-on-surface-variant truncate">{member.department} • {member.title}</p>
                  </div>
                </div>
                {/* Workload Meter */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Workload</span>
                    <span className={`font-table-data text-table-data font-semibold ${member.isOverloaded ? 'text-error' : 'text-on-surface'}`}>
                      {member.workload} / {member.maxWorkload} hrs
                    </span>
                  </div>
                  <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${member.isOverloaded ? 'bg-secondary-container' : 'bg-primary'}`} 
                      style={{ width: `${Math.min((member.workload / member.maxWorkload) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Pane: Assignment Canvas */}
        {selectedFaculty && (
          <div className="xl:col-span-8 flex flex-col bg-surface border border-outline-variant rounded-lg shadow-sm overflow-hidden">
            {/* Canvas Header */}
            <div className="p-6 border-b border-outline-variant bg-surface-bright flex flex-col sm:flex-row items-center justify-between shrink-0 gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-surface-variant overflow-hidden shrink-0 flex items-center justify-center border border-outline-variant">
                  {selectedFaculty.avatar ? (
                    <img alt={selectedFaculty.name} className="w-full h-full object-cover" src={selectedFaculty.avatar} />
                  ) : (
                    <span className="font-h2 text-h2 text-on-surface-variant uppercase tracking-wider">{selectedFaculty.initials}</span>
                  )}
                </div>
                <div>
                  <h3 className="font-h2 text-h2 text-on-surface tracking-tight">{selectedFaculty.name}</h3>
                  <div className="flex flex-wrap items-center gap-4 font-body-md text-sm text-on-surface-variant">
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">school</span> {selectedFaculty.department}</span>
                    <span className={`flex items-center gap-1 ${selectedFaculty.isOverloaded ? 'text-error' : 'text-primary'}`}>
                      <span className="material-symbols-outlined text-[16px]">{selectedFaculty.isOverloaded ? 'trending_up' : 'check_circle'}</span> 
                      {selectedFaculty.workload} hrs {selectedFaculty.isOverloaded ? '(Overload)' : '(Normal)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* Canvas Body */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-surface-container-lowest">
              {/* Current Assignments Table */}
              <div className="flex-1 border-r border-outline-variant flex flex-col min-w-0">
                <div className="p-4 border-b border-outline-variant bg-surface flex items-center justify-between shrink-0">
                  <h4 className="font-h3 text-[16px] font-semibold text-on-surface tracking-tight uppercase tracking-wider text-xs">Assigned Modules</h4>
                  <span className="px-2 py-1 bg-surface-container-high rounded text-xs font-semibold text-on-surface-variant">{selectedFaculty.assignments.length} Modules</span>
                </div>
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-left border-collapse min-w-[400px]">
                    <thead className="sticky top-0 bg-surface z-10 shadow-sm border-b border-outline-variant">
                      <tr>
                        <th className="p-base px-4 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Module</th>
                        <th className="p-base px-4 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider w-20">Type</th>
                        <th className="p-base px-4 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider text-right w-24">Hours</th>
                        <th className="p-base px-4 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="font-table-data text-table-data text-on-surface divide-y divide-surface-variant">
                      {selectedFaculty.assignments.map((assignment) => (
                        <tr key={assignment.id} className="hover:bg-surface-container transition-colors h-[48px]">
                          <td className="p-base px-4 font-medium">{assignment.moduleCode} - {assignment.moduleName}</td>
                          <td className="p-base px-4 text-on-surface-variant">{assignment.type}</td>
                          <td className="p-base px-4 text-right">{assignment.hours}</td>
                          <td className="p-base px-4 text-right">
                            <button className="text-outline hover:text-error transition-colors p-1" title="Unassign">
                              <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t-2 border-outline-variant bg-surface-bright font-semibold sticky bottom-0">
                      <tr>
                        <td className="p-base px-4 text-right font-label-caps text-on-surface-variant uppercase tracking-wider" colSpan={2}>Total Assigned</td>
                        <td className={`p-base px-4 text-right ${selectedFaculty.isOverloaded ? 'text-error' : 'text-primary'}`}>{selectedFaculty.workload}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
              {/* Available Modules List - Filter functionality could be added here later */}
              <div className="w-full md:w-[340px] flex flex-col bg-surface shrink-0">
                <div className="p-4 border-b border-outline-variant bg-surface flex flex-col gap-3 shrink-0">
                  <h4 className="font-h3 text-[16px] font-semibold text-on-surface tracking-tight uppercase tracking-wider text-xs">Available Modules</h4>
                  <div className="relative w-full">
                    <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
                    <input className="w-full pl-8 pr-3 py-1.5 text-sm bg-surface-bright border border-outline-variant rounded focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-body-md transition-colors" placeholder="Filter modules..." type="text" />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-surface-container-lowest">
                  {/* For now keeping this list empty or we can fetch modules from /api/core/module/ */}
                  <div className="p-4 text-center text-on-surface-variant text-sm italic">
                    Search to find modules to assign
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacultyAssignments;
