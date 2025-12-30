import { useState, useEffect } from 'react';
import { X, Search, Lock, Star, Loader2 } from 'lucide-react';
import { fetchAvailableRepos, connectRepo } from '../../lib/api';
import type { GitHubRepo } from '../../types';

interface RepoSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onRepoConnected: () => void;
  githubToken: string;
  userId: string;
}

export default function RepoSelector({
  isOpen,
  onClose,
  onRepoConnected,
  githubToken,
  userId,
}: RepoSelectorProps) {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && githubToken) {
      loadRepos();
    }
  }, [isOpen, githubToken]);

  const loadRepos = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAvailableRepos(githubToken, userId);
      setRepos(data);
    } catch {
      setError('Failed to load repositories');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (repo: GitHubRepo) => {
    setConnecting(repo.id);
    setError('');
    try {
      await connectRepo(githubToken, userId, repo);
      onRepoConnected();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect';
      setError(message);
    } finally {
      setConnecting(null);
    }
  };

  const filteredRepos = repos.filter((repo) =>
    repo.name.toLowerCase().includes(search.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-hacker-card w-full max-w-lg max-h-[80vh] flex flex-col border border-hacker-border">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-hacker-border">
          <h2 className="text-lg font-semibold text-neon">{'>'} Connect Repository</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-neon transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-hacker-border">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neon/50" />
            <input
              type="text"
              placeholder="Search repositories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-hacker-bg border border-hacker-border text-white placeholder-gray-500 focus:outline-none focus:border-neon focus:shadow-neon-sm transition-all"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 py-2 text-red-400 text-sm border-b border-red-500/30 bg-red-500/10">{error}</div>
        )}

        {/* Repo list */}
        <div className="flex-1 overflow-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-neon" />
            </div>
          ) : filteredRepos.length === 0 ? (
            <p className="text-center text-gray-500 py-12">
              {search ? 'No repositories match your search' : 'No repositories found'}
            </p>
          ) : (
            <div className="space-y-1">
              {filteredRepos.map((repo) => (
                <button
                  key={repo.id}
                  onClick={() => handleConnect(repo)}
                  disabled={connecting !== null}
                  className="w-full flex items-center justify-between p-3 hover:bg-neon/10 border border-transparent hover:border-neon/30 transition-all text-left disabled:opacity-50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium truncate hover:text-neon transition-colors">
                        {repo.name}
                      </span>
                      {repo.private && (
                        <Lock size={14} className="text-neon/50 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
                      {repo.language && <span className="text-neon/60">{repo.language}</span>}
                      <span className="flex items-center gap-1">
                        <Star size={12} />
                        {repo.stargazers_count}
                      </span>
                    </div>
                  </div>
                  {connecting === repo.id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-neon" />
                  ) : (
                    <span className="text-sm text-neon/70 hover:text-neon transition-colors">Connect</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
