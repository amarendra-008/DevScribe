import { useState, useEffect } from 'react';
import { Loader2, Copy, Check, FileText, Upload, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '../../lib/supabase';
import {
  fetchConnectedRepos,
  fetchRepoRefs,
  generateChangelog,
  syncToGitHub,
} from '../../lib/api';
import type { ConnectedRepository, GitRef, GeneratedDocument } from '../../types';

export default function ChangelogGenerator() {
  const [repos, setRepos] = useState<ConnectedRepository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [refs, setRefs] = useState<{ releases: GitRef[]; tags: GitRef[]; branches: GitRef[] }>({
    releases: [],
    tags: [],
    branches: [],
  });
  const [fromRef, setFromRef] = useState('');
  const [toRef, setToRef] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [document, setDocument] = useState<GeneratedDocument | null>(null);
  const [copied, setCopied] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);
  const [error, setError] = useState('');
  const [githubToken, setGitHubToken] = useState('');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    if (selectedRepo && githubToken) {
      loadRefs();
    }
  }, [selectedRepo]);

  const initAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setGitHubToken(session.provider_token || '');
      setUserId(session.user.id);
      loadRepos(session.provider_token || '', session.user.id);
    }
  };

  const loadRepos = async (token: string, uid: string) => {
    setLoading(true);
    try {
      const data = await fetchConnectedRepos(token, uid);
      setRepos(data);
    } catch (err) {
      console.error('Failed to load repos:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRefs = async () => {
    try {
      const data = await fetchRepoRefs(githubToken, userId, selectedRepo);
      setRefs(data);
      setFromRef('');
      setToRef('');
    } catch (err) {
      console.error('Failed to load refs:', err);
    }
  };

  const allRefs = [...refs.releases, ...refs.tags, ...refs.branches];

  const handleGenerate = async () => {
    if (!selectedRepo || !fromRef || !toRef) return;

    setGenerating(true);
    setError('');
    setDocument(null);

    try {
      const doc = await generateChangelog(githubToken, userId, selectedRepo, fromRef, toRef);
      setDocument(doc);
    } catch (err) {
      setError('Failed to generate changelog. Make sure there are commits between the selected refs.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!document) return;
    await navigator.clipboard.writeText(document.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
    } catch (err) {
      setError('Failed to sync to GitHub. Make sure you have write access to the repository.');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
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
        <p className="text-gray-400 mb-8">
          Connect a repository first to generate changelogs
        </p>
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
      <p className="text-gray-400 mb-8">
        Select a repository and version range to generate a changelog
      </p>

      {/* Configuration */}
      <div className="bg-[#18181b] rounded-lg border border-[#2a2a2a] p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Repository select */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Repository
            </label>
            <div className="relative">
              <select
                value={selectedRepo}
                onChange={(e) => setSelectedRepo(e.target.value)}
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-lg text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all hover:border-[#444]"
              >
                <option value="">Select repository</option>
                {repos.map((repo) => (
                  <option key={repo.id} value={repo.id}>
                    {repo.repo_name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* From ref */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              From (older)
            </label>
            <div className="relative">
              <select
                value={fromRef}
                onChange={(e) => setFromRef(e.target.value)}
                disabled={!selectedRepo}
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-lg text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all hover:border-[#444] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-[#333]"
              >
                <option value="">Select ref</option>
                {allRefs.map((ref) => (
                  <option key={`${ref.type}-${ref.name}`} value={ref.name}>
                    {ref.name} ({ref.type})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* To ref */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              To (newer)
            </label>
            <div className="relative">
              <select
                value={toRef}
                onChange={(e) => setToRef(e.target.value)}
                disabled={!selectedRepo}
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-lg text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all hover:border-[#444] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-[#333]"
              >
                <option value="">Select ref</option>
                {allRefs.map((ref) => (
                  <option key={`${ref.type}-${ref.name}`} value={ref.name}>
                    {ref.name} ({ref.type})
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
          className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Changelog'
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Output */}
      {document && (
        <div className="bg-[#18181b] rounded-lg border border-[#2a2a2a]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a]">
            <h3 className="font-medium text-white">{document.title}</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
              >
                {syncing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Syncing...
                  </>
                ) : synced ? (
                  <>
                    <Check size={16} />
                    Synced!
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Push to GitHub
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="p-6 prose prose-invert prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {document.content}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
