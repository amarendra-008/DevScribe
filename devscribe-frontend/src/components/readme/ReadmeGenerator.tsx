import { useState, useEffect } from 'react';
import { Loader2, Copy, Check, BookOpen, Upload, ChevronDown, Settings2, Sparkles, MessageSquare, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../../lib/useAuth';
import { useClipboard } from '../../lib/useClipboard';
import { fetchConnectedRepos, generateReadme, syncToGitHub, type ReadmeOptions } from '../../lib/api';
import type { ConnectedRepository, GeneratedDocument } from '../../types';

const STYLE_OPTIONS = [
  { value: 'minimal', label: 'Minimal', description: 'Quick overview with essential info only' },
  { value: 'standard', label: 'Standard', description: 'Balanced README with key sections' },
  { value: 'comprehensive', label: 'Comprehensive', description: 'Detailed documentation with examples' },
] as const;

const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional', description: 'Formal, business-appropriate language' },
  { value: 'friendly', label: 'Friendly', description: 'Casual, approachable and welcoming' },
  { value: 'technical', label: 'Technical', description: 'Precise, developer-focused content' },
] as const;

const DEFAULT_OPTIONS: ReadmeOptions = {
  style: 'standard',
  tone: 'professional',
  sections: {
    badges: true,
    features: true,
    installation: true,
    usage: true,
    api: false,
    contributing: true,
    license: true,
    acknowledgments: false,
  },
};

export default function ReadmeGenerator() {
  const { githubToken, userId, loading: authLoading } = useAuth();
  const { copied, copy } = useClipboard();

  const [repos, setRepos] = useState<ConnectedRepository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [document, setDocument] = useState<GeneratedDocument | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);
  const [error, setError] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [options, setOptions] = useState<ReadmeOptions>(DEFAULT_OPTIONS);
  const [feedback, setFeedback] = useState('');
  const [previousContent, setPreviousContent] = useState<string | null>(null);

  useEffect(() => {
    if (githubToken && userId) {
      setLoading(true);
      fetchConnectedRepos(githubToken, userId)
        .then(setRepos)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [githubToken, userId]);

  const handleGenerate = async (isRegenerate = false) => {
    if (!selectedRepo) return;
    setGenerating(true);
    setError('');

    const generateOptions = { ...options };
    if (isRegenerate && feedback.trim() && previousContent) {
      generateOptions.customPrompt = (generateOptions.customPrompt || '') +
        `\n\nPREVIOUS README (needs improvements):\n${previousContent.slice(0, 2000)}\n\nUSER FEEDBACK:\n${feedback}`;
    }

    try {
      const doc = await generateReadme(githubToken, userId, selectedRepo, generateOptions);
      setPreviousContent(doc.content);
      setDocument(doc);
      if (isRegenerate) setFeedback('');
    } catch {
      setError('Failed to generate README. Please try again.');
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
      await syncToGitHub(githubToken, userId, repo.repo_full_name, 'README.md', document.content);
      setSynced(true);
      setTimeout(() => setSynced(false), 3000);
    } catch {
      setError('Failed to sync to GitHub. Make sure you have write access.');
    } finally {
      setSyncing(false);
    }
  };

  const toggleSection = (key: keyof NonNullable<ReadmeOptions['sections']>) => {
    setOptions(prev => ({
      ...prev,
      sections: { ...prev.sections, [key]: !prev.sections?.[key] },
    }));
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
      <div className="w-full max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold text-white mb-2">Generate README</h1>
        <p className="text-gray-400 mb-8">Connect a repository first to generate documentation</p>
        <div className="text-center py-16 bg-[#111] rounded-2xl border border-[#1a1a1a]">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-700" />
          <p className="text-gray-500">No repositories connected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Generate README</h1>
        <p className="text-gray-400 mt-1">Analyze your repository and generate comprehensive documentation</p>
      </div>

      <div className="bg-[#111] rounded-2xl border border-[#1a1a1a] p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-2">Repository</label>
            <div className="relative">
              <select
                value={selectedRepo}
                onChange={(e) => setSelectedRepo(e.target.value)}
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#222] rounded-xl text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/20"
              >
                <option value="">Select repository</option>
                {repos.map((repo) => (
                  <option key={repo.id} value={repo.id}>{repo.repo_name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-end gap-3">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                showOptions ? 'bg-white text-black' : 'bg-[#1a1a1a] text-gray-300 hover:bg-[#222]'
              }`}
            >
              <Settings2 size={18} />
              Customize
            </button>
            <button
              onClick={() => handleGenerate(false)}
              disabled={!selectedRepo || generating}
              className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-medium text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles size={18} />}
              {generating ? 'Generating...' : 'Generate README'}
            </button>
          </div>
        </div>
      </div>

      {showOptions && (
        <div className="bg-[#111] rounded-2xl border border-[#1a1a1a] p-6 mb-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">README Style</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {STYLE_OPTIONS.map(({ value, label, description }) => (
                <button
                  key={value}
                  onClick={() => setOptions(prev => ({ ...prev, style: value }))}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    options.style === value ? 'border-white bg-white/5' : 'border-[#222] hover:border-[#333]'
                  }`}
                >
                  <p className={`font-medium ${options.style === value ? 'text-white' : 'text-gray-300'}`}>{label}</p>
                  <p className="text-sm text-gray-500 mt-1">{description}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Writing Tone</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {TONE_OPTIONS.map(({ value, label, description }) => (
                <button
                  key={value}
                  onClick={() => setOptions(prev => ({ ...prev, tone: value }))}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    options.tone === value ? 'border-white bg-white/5' : 'border-[#222] hover:border-[#333]'
                  }`}
                >
                  <p className={`font-medium ${options.tone === value ? 'text-white' : 'text-gray-300'}`}>{label}</p>
                  <p className="text-sm text-gray-500 mt-1">{description}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Include Sections</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(options.sections || {}).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => toggleSection(key as keyof NonNullable<ReadmeOptions['sections']>)}
                  className={`px-4 py-3 rounded-xl font-medium text-sm capitalize transition-all ${
                    value ? 'bg-white text-black' : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#222]'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              <div className="flex items-center gap-2">
                <MessageSquare size={16} />
                Additional Instructions
              </div>
            </label>
            <textarea
              value={options.customPrompt || ''}
              onChange={(e) => setOptions(prev => ({ ...prev, customPrompt: e.target.value }))}
              placeholder="Add specific instructions or context..."
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#222] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-white/20 resize-none h-32"
            />
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {document && (
        <>
          <div className="bg-[#111] rounded-2xl border border-[#1a1a1a] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a1a] bg-[#0f0f0f]">
              <h3 className="font-medium text-white">{document.title}</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => copy(document.content)}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-[#1a1a1a]"
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

          <div className="mt-6 bg-[#111] rounded-2xl border border-[#1a1a1a] p-6">
            <div className="flex items-center gap-2 mb-3">
              <RefreshCw size={18} className="text-gray-400" />
              <label className="text-sm font-medium text-gray-300">Not happy? Provide feedback and regenerate</label>
            </div>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us what needs to be changed..."
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#222] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-white/20 resize-none h-28 mb-4"
            />
            <button
              onClick={() => handleGenerate(true)}
              disabled={!feedback.trim() || generating}
              className="flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#222] text-white px-5 py-2.5 rounded-xl font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed border border-[#333]"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw size={16} />}
              {generating ? 'Regenerating...' : 'Regenerate with Feedback'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
