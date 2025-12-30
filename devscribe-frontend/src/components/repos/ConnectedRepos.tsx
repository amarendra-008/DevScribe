import { useState, useEffect } from 'react';
import { Plus, Trash2, ExternalLink, Loader2, GitBranch } from 'lucide-react';
import { useAuth } from '../../lib/useAuth';
import { fetchConnectedRepos, disconnectRepo } from '../../lib/api';
import RepoSelector from './RepoSelector';
import type { ConnectedRepository } from '../../types';

export default function ConnectedRepos() {
  const { githubToken, userId, loading: authLoading } = useAuth();

  const [repos, setRepos] = useState<ConnectedRepository[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSelector, setShowSelector] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (githubToken && userId) {
      loadRepos();
    }
  }, [githubToken, userId]);

  const loadRepos = async () => {
    setLoading(true);
    try {
      const data = await fetchConnectedRepos(githubToken, userId);
      setRepos(data);
    } catch {
      // Handle silently
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (repoId: string) => {
    setDeleting(repoId);
    try {
      await disconnectRepo(githubToken, userId, repoId);
      setRepos(repos.filter((r) => r.id !== repoId));
    } catch {
      // Handle silently
    } finally {
      setDeleting(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Repositories</h1>
          <p className="text-gray-400 mt-1">Connect your GitHub repositories to generate documentation</p>
        </div>
        <button
          onClick={() => setShowSelector(true)}
          className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded font-medium text-sm hover:bg-gray-100"
        >
          <Plus size={18} />
          Add Repository
        </button>
      </div>

      {repos.length === 0 ? (
        <div className="text-center py-16 bg-[#18181b] rounded-md border border-[#2a2a2a]">
          <GitBranch className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <h3 className="text-lg font-medium text-white mb-2">No repositories connected</h3>
          <p className="text-gray-400 mb-6">Connect a GitHub repository to start generating documentation</p>
          <button
            onClick={() => setShowSelector(true)}
            className="inline-flex items-center gap-2 bg-white text-black px-4 py-2 rounded font-medium text-sm hover:bg-gray-100"
          >
            <Plus size={18} />
            Connect Repository
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {repos.map((repo) => (
            <div
              key={repo.id}
              className="flex items-center justify-between p-4 bg-[#18181b] rounded-md border border-[#2a2a2a]"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{repo.repo_name}</span>
                  {repo.is_private && (
                    <span className="text-xs px-2 py-0.5 bg-[#2a2a2a] rounded text-gray-400">Private</span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{repo.repo_full_name}</p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={repo.repo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-400 hover:text-white"
                >
                  <ExternalLink size={18} />
                </a>
                <button
                  onClick={() => handleDisconnect(repo.id)}
                  disabled={deleting === repo.id}
                  className="p-2 text-gray-400 hover:text-red-400 disabled:opacity-50"
                >
                  {deleting === repo.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 size={18} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <RepoSelector
        isOpen={showSelector}
        onClose={() => setShowSelector(false)}
        onRepoConnected={loadRepos}
        githubToken={githubToken}
        userId={userId}
      />
    </div>
  );
}