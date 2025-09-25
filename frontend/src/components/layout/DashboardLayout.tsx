import React, { ReactNode } from 'react';
import Link from 'next/link';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen" style={{backgroundColor: '#fafafa'}}>

      {/* Main Content */}
      <main className="max-w-none mx-auto py-4 px-6">
        {children}
      </main>

    </div>
  );
}