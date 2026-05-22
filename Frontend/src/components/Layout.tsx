import React from 'react';
import TopAppBar from './TopAppBar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <TopAppBar />
      <main className="flex-1 p-md lg:p-lg">
        {children}
      </main>
    </div>
  );
};

export default Layout;
