import React from 'react';
import Sidebar from './Sidebar';
import TopAppBar from './TopAppBar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-[260px] flex flex-col min-h-screen">
        <TopAppBar />
        <main className="flex-1 p-md lg:p-lg">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
