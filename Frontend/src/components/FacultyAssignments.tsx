import React from 'react';

const FacultyAssignments: React.FC = () => {
  return (
    <div className="flex flex-col gap-lg">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-h1 text-h1 text-on-surface">Faculty Assignments</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Manage teaching workloads and ensure equitable distribution across the department.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-outline text-on-surface rounded hover:bg-surface-container transition-colors font-body-md text-body-md font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export
          </button>
          <button className="px-4 py-2 bg-primary text-on-primary rounded hover:bg-on-primary-fixed-variant transition-colors font-body-md text-body-md font-medium flex items-center gap-2 shadow-sm">
            <span className="material-symbols-outlined text-[18px]">publish</span>
            Publish Assignments
          </button>
        </div>
      </div>

      {/* Statistical Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        <div className="bg-surface p-md border border-outline-variant rounded-lg shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-on-primary-fixed text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
          </div>
          <div>
            <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider mb-1">Total Faculty</h3>
            <p className="font-h1 text-h1 text-on-surface">42</p>
          </div>
        </div>
        <div className="bg-surface p-md border border-outline-variant rounded-lg shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-secondary-fixed flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-on-secondary-fixed text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>balance</span>
          </div>
          <div>
            <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider mb-1">Moyenne Générale</h3>
            <p className="font-h1 text-h1 text-on-surface">192 <span className="font-body-md text-body-md text-on-surface-variant font-normal">hrs/year</span></p>
          </div>
        </div>
        <div className="bg-surface p-md border border-outline-variant rounded-lg shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-on-error-container text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
          </div>
          <div>
            <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider mb-1">Workload Alerts</h3>
            <p className="font-h1 text-h1 text-error">3 <span className="font-body-md text-body-md text-on-surface-variant font-normal">Over capacity</span></p>
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
              <input className="w-full pl-10 pr-4 py-2 bg-surface border border-outline-variant rounded focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md transition-colors" placeholder="Search faculty..." type="text" />
            </div>
            <div className="flex gap-2">
              <select className="w-full px-3 py-1.5 bg-surface border border-outline-variant rounded font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary">
                <option>All Departments</option>
                <option>Computer Science</option>
                <option>Mathematics</option>
              </select>
            </div>
          </div>
          {/* Faculty List */}
          <div className="flex-1 overflow-y-auto">
            {/* Faculty Item: Overworked Alert */}
            <div className="p-4 border-b border-outline-variant bg-surface-container-low cursor-pointer hover:bg-surface-container transition-colors relative">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-surface-variant overflow-hidden shrink-0">
                  <img alt="Faculty Avatar" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC3u1cNHcEIEItz41MHGmECZYZ7C5JCfjXj9DPIPfwVg3GumZ5p36ApEhLgMz5ICC3CgsY1sdbrq_C-tk_K91FLRRl6h21wyOj-2mG-JU8pvclDyYKO0CJ94YznqgaQ8vT0XaCCiehS84jV599CFBsbGf5viWAMmasG6fRknCh1mTWXj3xF-OZ-rVWURh-p-HiWpb_gPMlLCYJ4RQibD-1dHvVZU1NDSDaahatqMkMdC_jBvhX9opKp1e0rm_YwbEYEF-hnZKVts8Lr" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-h3 text-h3 text-on-surface truncate">Dr. Sarah Jenkins</h4>
                    <span className="material-symbols-outlined text-error text-[18px]">error</span>
                  </div>
                  <p className="font-body-md text-[13px] text-on-surface-variant truncate">Computer Science • Professor</p>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-label-caps text-label-caps text-on-surface-variant">Workload</span>
                  <span className="font-table-data text-table-data font-semibold text-error">210 / 192 hrs</span>
                </div>
                <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
                  <div className="h-full bg-secondary-container rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>
            {/* Faculty Item: Normal */}
            <div className="p-4 border-b border-outline-variant cursor-pointer hover:bg-surface-container transition-colors">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-surface-variant overflow-hidden shrink-0">
                  <span className="w-full h-full flex items-center justify-center font-h3 text-on-surface-variant bg-surface-container-high">MK</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-h3 text-h3 text-on-surface truncate">Prof. Michael Kim</h4>
                  <p className="font-body-md text-[13px] text-on-surface-variant truncate">Mathematics • Assoc. Prof</p>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-label-caps text-label-caps text-on-surface-variant">Workload</span>
                  <span className="font-table-data text-table-data text-on-surface">178 / 192 hrs</span>
                </div>
                <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Pane: Assignment Canvas */}
        <div className="xl:col-span-8 flex flex-col bg-surface border border-outline-variant rounded-lg shadow-sm overflow-hidden">
          {/* Canvas Header */}
          <div className="p-6 border-b border-outline-variant bg-surface flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-surface-variant overflow-hidden shrink-0">
                <img alt="Faculty Avatar" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAtEI3rXj0iRm0KBVhj7PKD-p3gO_IApbmDrJO4bc523AHuYmci_5hAxStL0jEdwSJXK4q6f7-UblVqP8JUQfj2ybAGCgdnb2pz5ruB6S3vfppTcZWSbFL3Acxi01Zcj_al5Y59EDu9tPV7KEQmYbEqsbiehuBQLJWXQ4YmKW9d3TPzGagVSHcVn0zeqjAyrNwQbSH6WJTW8dnRLkWQUrzyssZzkUqYKRs51R7qcGWTDMbDlzsWdHDbVRUkHjrxLMOYY44eVW42SXeE" />
              </div>
              <div>
                <h3 className="font-h2 text-h2 text-on-surface mb-1">Dr. Sarah Jenkins</h3>
                <div className="flex items-center gap-4 font-body-md text-sm text-on-surface-variant">
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">school</span> Computer Science</span>
                  <span className="flex items-center gap-1 text-error"><span className="material-symbols-outlined text-[16px]">trending_up</span> 210 hrs (Overload)</span>
                </div>
              </div>
            </div>
          </div>
          {/* Canvas Body */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-surface-container-lowest">
            {/* Current Assignments Table */}
            <div className="flex-1 border-r border-outline-variant flex flex-col min-w-0">
              <div className="p-4 border-b border-outline-variant bg-surface flex items-center justify-between shrink-0">
                <h4 className="font-h3 text-[16px] font-semibold text-on-surface">Assigned Modules</h4>
                <span className="px-2 py-1 bg-surface-container-high rounded text-xs font-semibold text-on-surface-variant">4 Modules</span>
              </div>
              <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse min-w-[400px]">
                  <thead className="sticky top-0 bg-surface z-10 shadow-sm border-b border-outline-variant">
                    <tr>
                      <th className="p-base px-4 font-label-caps text-label-caps text-on-surface-variant uppercase">Module</th>
                      <th className="p-base px-4 font-label-caps text-label-caps text-on-surface-variant uppercase w-20">Type</th>
                      <th className="p-base px-4 font-label-caps text-label-caps text-on-surface-variant uppercase text-right w-24">Hours</th>
                      <th className="p-base px-4 font-label-caps text-label-caps text-on-surface-variant uppercase w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="font-table-data text-table-data text-on-surface divide-y divide-surface-variant">
                    <tr className="hover:bg-surface-container transition-colors h-[48px]">
                      <td className="p-base px-4 font-medium">CS301 - Advanced Algorithms</td>
                      <td className="p-base px-4 text-on-surface-variant">Lecture</td>
                      <td className="p-base px-4 text-right">60</td>
                      <td className="p-base px-4 text-right">
                        <button className="text-outline hover:text-error transition-colors p-1" title="Unassign">
                          <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="border-t-2 border-outline-variant bg-surface font-semibold sticky bottom-0">
                    <tr>
                      <td className="p-base px-4 text-right font-label-caps text-on-surface-variant uppercase" colspan={2}>Total Assigned</td>
                      <td className="p-base px-4 text-right text-error">210</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            {/* Available Modules List */}
            <div className="w-full md:w-[340px] flex flex-col bg-surface shrink-0">
              <div className="p-4 border-b border-outline-variant bg-surface flex flex-col gap-3 shrink-0">
                <h4 className="font-h3 text-[16px] font-semibold text-on-surface">Available Modules</h4>
                <div className="relative w-full">
                  <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
                  <input className="w-full pl-8 pr-3 py-1.5 text-sm bg-surface-container-low border border-outline-variant rounded focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-body-md transition-colors" placeholder="Filter modules..." type="text" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-surface-container-lowest">
                <div className="border border-outline-variant rounded p-3 hover:border-primary hover:shadow-sm transition-all group bg-surface">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-table-data font-semibold text-on-surface leading-tight">CS101 - Intro to Programming</p>
                      <p className="font-body-md text-xs text-on-surface-variant">Lecture • Undergrad</p>
                    </div>
                    <span className="px-2 py-0.5 bg-primary-container text-on-primary-container rounded text-xs font-semibold shrink-0">60 hrs</span>
                  </div>
                  <button className="w-full py-1.5 border border-outline text-on-surface rounded text-sm font-medium hover:bg-primary hover:text-on-primary hover:border-primary transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 focus:opacity-100">
                    <span className="material-symbols-outlined text-[16px]">add</span> Assign
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyAssignments;
