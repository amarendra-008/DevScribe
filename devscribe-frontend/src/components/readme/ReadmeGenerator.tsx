import { useState, useEffect } from 'react';
import { Loader2, Copy, Check, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '../../lib/supabase';
import { fetchConnectedRepos, generateReadme } from '../../lib/api';
import type { ConnectedRepository, GeneratedDocument } from '../../types';

export default function ReadmeGenerator() {
  const [repos, setRepos] = useState<ConnectedRepository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [document, setDocument] = useState<GeneratedDocument | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [githubToken, setGitHubToken] = useState('');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    initAuth();
  }, []);

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

  const handleGenerate = async () => {
    if (!selectedRepo) return;

    setGenerating(true);
    setError('');
    setDocument(null);

    try {
      const doc = await generateReadme(githubToken, userId, selectedRepo);
      setDocument(doc);
    } catch (err) {
      setError('Failed to generate README. Please try again.');
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
        <h1 className="text-2xl font-semibold text-white mb-2">Generate README</h1>
        <p className="text-gray-400 mb-8">
          Connect a repository first to generate documentation
        </p>
        <div className="text-center py-16 bg-[#18181b] rounded-md border border-[#2a2a2a]">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400">No repositories connected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold text-white mb-2">Generate README</h1>
      <p className="text-gray-400 mb-8">
        Analyze your repository and generate comprehensive documentation
      </p>

      {/* Configuration */}
      <div className="bg-[#18181b] rounded-md border border-[#2a2a2a] p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Repository
            </label>
            <select
              value={selectedRepo}
              onChange={(e) => setSelectedRepo(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#111111] border border-[#2a2a2a] rounded text-white focus:outline-none focus:border-gray-500"
            >
              <option value="">Select repository</option>
              {repos.map((repo) => (
                <option key={repo.id} value={repo.id}>
                  {repo.repo_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={!selectedRepo || generating}
              className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded font-medium text-sm hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Generate README'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Output */}
      {document && (
        <div className="bg-[#18181b] rounded-md border border-[#2a2a2a]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a]">
            <h3 className="font-medium text-white">{document.title}</h3>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
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
