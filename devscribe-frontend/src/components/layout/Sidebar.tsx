import { NavLink } from 'react-router-dom';
import { GitBranch, FileText, BookOpen, FolderOpen, LogOut, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { to: '/app/repos', icon: GitBranch, label: 'Repositories' },
  { to: '/app/changelog', icon: FileText, label: 'Changelog' },
  { to: '/app/readme', icon: BookOpen, label: 'README' },
  { to: '/app/documents', icon: FolderOpen, label: 'Documents' },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-[#18181b] border-r border-[#2a2a2a] z-50
          transform transition-transform duration-200
          md:translate-x-0 md:static
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <span className="text-xl font-semibold text-white">DevScribe</span>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-white md:hidden"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium
                  transition-colors
                  ${isActive
                    ? 'bg-white text-black'
                    : 'text-gray-300 hover:bg-[#2a2a2a] hover:text-white'
                  }
                `}
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium text-gray-400 hover:bg-[#2a2a2a] hover:text-white transition-colors"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
