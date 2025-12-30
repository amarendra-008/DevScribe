import { NavLink } from 'react-router-dom';
import { GitBranch, FileText, BookOpen, FolderOpen, LogOut, X, Terminal } from 'lucide-react';
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
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-72 bg-hacker-card border-r border-hacker-border z-50
          transform transition-transform duration-300 ease-out
          md:translate-x-0 md:relative md:flex-shrink-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-hacker-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center border border-neon bg-neon/10">
                <Terminal size={18} className="text-neon" />
              </div>
              <span className="text-xl font-semibold text-neon">DevScribe</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-500 hover:text-neon hover:bg-neon/10 transition-colors md:hidden"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            <p className="px-3 mb-3 text-xs font-medium text-neon/60 uppercase tracking-wider">
              {'>'} Generate
            </p>
            {navItems.slice(0, 3).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 text-sm font-medium
                  transition-all duration-200 border-l-2
                  ${isActive
                    ? 'bg-neon/10 text-neon border-neon shadow-neon-sm'
                    : 'text-gray-400 border-transparent hover:bg-hacker-border hover:text-neon hover:border-neon/50'
                  }
                `}
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}

            <div className="pt-4">
              <p className="px-3 mb-3 text-xs font-medium text-neon/60 uppercase tracking-wider">
                {'>'} Library
              </p>
              {navItems.slice(3).map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2.5 text-sm font-medium
                    transition-all duration-200 border-l-2
                    ${isActive
                      ? 'bg-neon/10 text-neon border-neon shadow-neon-sm'
                      : 'text-gray-400 border-transparent hover:bg-hacker-border hover:text-neon hover:border-neon/50'
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
          <div className="px-4 py-4 border-t border-hacker-border">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-colors border-l-2 border-transparent hover:border-red-500/50"
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
