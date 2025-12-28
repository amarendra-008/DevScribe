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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-72 bg-[#0f0f0f] border-r border-[#1a1a1a] z-50
          transform transition-transform duration-300 ease-out
          md:translate-x-0 md:relative md:flex-shrink-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#1a1a1a]">
            <div className="flex items-center gap-2">
              <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="DevScribe" className="w-8 h-8 rounded-lg" />
              <span className="text-xl font-semibold text-white">DevScribe</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors md:hidden"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            <p className="px-3 mb-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Generate
            </p>
            {navItems.slice(0, 3).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${isActive
                    ? 'bg-white text-black shadow-lg shadow-white/10'
                    : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'
                  }
                `}
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}

            <div className="pt-4">
              <p className="px-3 mb-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Library
              </p>
              {navItems.slice(3).map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                    transition-all duration-200
                    ${isActive
                      ? 'bg-white text-black shadow-lg shadow-white/10'
                      : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'
                    }
                  `}
                >
                  <item.icon size={18} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 border-t border-[#1a1a1a]">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-[#1a1a1a] hover:text-white transition-colors"
            >
              <LogOut size={18} />
              Sign out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
