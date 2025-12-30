import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, Terminal } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';

export default function DashboardView() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-hacker-bg overflow-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center gap-4 px-4 py-3 border-b border-hacker-border bg-hacker-bg">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-500 hover:text-neon transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Terminal size={18} className="text-neon" />
            <span className="text-lg font-semibold text-neon">DevScribe</span>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 md:p-10 lg:p-12">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
