import { useState, useEffect } from 'react';
import { Loader2, Copy, Check, FileText, Upload, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../../lib/useAuth';
import { useClipboard } from '../../lib/useClipboard';
import { fetchConnectedRepos, fetchRepoRefs, generateChangelog, syncToGitHub } from '../../lib/api';
import type { ConnectedRepository, GitRef, GeneratedDocument } from '../../types';

export default function ChangelogGenerator() {
  const { githubToken, userId, loading: authLoading } = useAuth();
  const { copied, copy } = useClipboard();

  const [repos, setRepos] = useState<ConnectedRepository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [refs, setRefs] = useState<{ releases: GitRef[]; tags: GitRef[]; branches: GitRef[]; commits: GitRef[] }>({
    releases: [], tags: [], branches: [], commits: [],
  });
  const [fromRef, setFromRef] = useState('');
  const [toRef, setToRef] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [document, setDocument] = useState<GeneratedDocument | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (githubToken && userId) {
      setLoading(true);
      fetchConnectedRepos(githubToken, userId)
        .then(setRepos)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [githubToken, userId]);

  useEffect(() => {
    if (selectedRepo && githubToken && userId) {
      fetchRepoRefs(githubToken, userId, selectedRepo)
        .then(data => {
          setRefs(data);
          setFromRef('');
          setToRef('');
        })
        .catch(() => {});
    }
  }, [selectedRepo, githubToken, userId]);

  const allRefs = [...refs.releases, ...refs.tags, ...refs.branches, ...refs.commits];

  const handleGenerate = async () => {
    if (!selectedRepo || !fromRef || !toRef) return;
    setGenerating(true);
    setError('');
    setDocument(null);

    try {
      const doc = await generateChangelog(githubToken, userId, selectedRepo, fromRef, toRef);
      setDocument(doc);
    } catch {
      setError('Failed to generate changelog. Make sure there are commits between the selected refs.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSync = async () => {
    if (!document || !selectedRepo) return;
    setSyncing(true);
    setSynced(false);
    try {
      const repo = repos.find(r => r.id === selectedRepo);
      if (!repo) throw new Error('Repository not found');
      await syncToGitHub(githubToken, userId, repo.repo_full_name, 'CHANGELOG.md', document.content);
      setSynced(true);
      setTimeout(() => setSynced(false), 3000);
    } catch {
      setError('Failed to sync to GitHub. Make sure you have write access.');
    } finally {
      setSyncing(false);
    }
  };

  const formatRefOption = (ref: GitRef) => {
    if (ref.type === 'commit') {
      const shortMessage = ref.message?.slice(0, 30) || '';
      return `${ref.name} - ${shortMessage}${(ref.message?.length || 0) > 30 ? '...' : ''}`;
    }
    return `${ref.name} (${ref.type})`;
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (repos.length === 0) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold text-white mb-2">Generate Changelog</h1>
        <p className="text-gray-400 mb-8">Connect a repository first to generate changelogs</p>
        <div className="text-center py-16 bg-[#18181b] rounded-md border border-[#2a2a2a]">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400">No repositories connected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold text-white mb-2">Generate Changelog</h1>
      <p className="text-gray-400 mb-8">Select a repository and version range to generate a changelog</p>

      <div className="bg-[#18181b] rounded-lg border border-[#2a2a2a] p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Repository</label>
            <div className="relative">
              <select
                value={selectedRepo}
                onChange={(e) => setSelectedRepo(e.target.value)}
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-lg text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/20"
              >
                <option value="">Select repository</option>
                {repos.map((repo) => (
                  <option key={repo.id} value={repo.id}>{repo.repo_name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">From (older)</label>
            <div className="relative">
              <select
                value={fromRef}
                onChange={(e) => setFromRef(e.target.value)}
                disabled={!selectedRepo}
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-lg text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select ref</option>
                {allRefs.map((ref) => (
                  <option key={`${ref.type}-${ref.sha || ref.name}`} value={ref.type === 'commit' ? ref.sha : ref.name}>
                    {formatRefOption(ref)}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">To (newer)</label>
            <div className="relative">
              <select
                value={toRef}
                onChange={(e) => setToRef(e.target.value)}
                disabled={!selectedRepo}
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-lg text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select ref</option>
                {allRefs.map((ref) => (
                  <option key={`${ref.type}-${ref.sha || ref.name}`} value={ref.type === 'commit' ? ref.sha : ref.name}>
                    {formatRefOption(ref)}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={!selectedRepo || !fromRef || !toRef || generating}
          className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {generating ? 'Generating...' : 'Generate Changelog'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {document && (
        <div className="bg-[#18181b] rounded-lg border border-[#2a2a2a]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a]">
            <h3 className="font-medium text-white">{document.title}</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => copy(document.content)}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-medium text-sm disabled:opacity-50"
              >
                {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : synced ? <Check size={16} /> : <Upload size={16} />}
                {syncing ? 'Syncing...' : synced ? 'Synced!' : 'Push to GitHub'}
              </button>
            </div>
          </div>
          <div className="p-6 prose prose-invert prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{document.content}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
