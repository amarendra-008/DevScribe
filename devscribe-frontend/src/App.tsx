import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import LandingView from './views/LandingView';
import DashboardView from './views/DashboardView';
import ConnectedRepos from './components/repos/ConnectedRepos';
import ChangelogGenerator from './components/changelog/ChangelogGenerator';
import ReadmeGenerator from './components/readme/ReadmeGenerator';
import DocumentList from './components/documents/DocumentList';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.documentElement.classList.add('dark');

    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (err) {
        console.error('Auth error:', err);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#111111]">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<LandingView />} />

      <Route
        path="/app"
        element={user ? <DashboardView /> : <Navigate to="/" replace />}
      >
        <Route index element={<Navigate to="/app/repos" replace />} />
        <Route path="repos" element={<ConnectedRepos />} />
        <Route path="changelog" element={<ChangelogGenerator />} />
        <Route path="readme" element={<ReadmeGenerator />} />
        <Route path="documents" element={<DocumentList />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
