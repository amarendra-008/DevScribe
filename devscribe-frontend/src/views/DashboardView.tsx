import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';

export default function DashboardView() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#111111]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <header className="md:hidden flex items-center gap-4 px-4 py-3 border-b border-[#2a2a2a]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-400 hover:text-white"
          >
            <Menu size={20} />
          </button>
          <span className="text-lg font-semibold text-white">DevScribe</span>
        </header>

        {/* Main content */}
        <main className="flex-1 p-6 md:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
