import { useState, useEffect } from 'react';
import { supabase } from './supabase';

export function useAuth() {
  const [githubToken, setGitHubToken] = useState('');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setGitHubToken(session.provider_token || '');
        setUserId(session.user.id);
      }
      setLoading(false);
    });
  }, []);

  return { githubToken, userId, loading, isAuthenticated: !!githubToken && !!userId };
}