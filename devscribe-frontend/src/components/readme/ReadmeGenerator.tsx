import { useState, useEffect } from 'react';
import { Loader2, Copy, Check, BookOpen, Upload, ChevronDown, Settings2, Sparkles, MessageSquare, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '../../lib/supabase';
import { fetchConnectedRepos, generateReadme, syncToGitHub } from '../../lib/api';
import type { ConnectedRepository, GeneratedDocument } from '../../types';

// README customization options
interface ReadmeOptions {
  style: 'minimal' | 'standard' | 'comprehensive';
  tone: 'professional' | 'friendly' | 'technical';
  sections: {
    badges: boolean;
    features: boolean;
    installation: boolean;
    usage: boolean;
    api: boolean;
    contributing: boolean;
    license: boolean;
    acknowledgments: boolean;
  };
  customPrompt?: string;
}

const defaultOptions: ReadmeOptions = {
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

const styleDescriptions = {
  minimal: 'Quick overview with essential info only',
  standard: 'Balanced README with key sections',
  comprehensive: 'Detailed documentation with examples',
};

const toneDescriptions = {
  professional: 'Formal, business-appropriate language',
  friendly: 'Casual, approachable and welcoming',
  technical: 'Precise, developer-focused content',
};

export default function ReadmeGenerator() {
  const [repos, setRepos] = useState<ConnectedRepository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [document, setDocument] = useState<GeneratedDocument | null>(null);
  const [copied, setCopied] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);
  const [error, setError] = useState('');
  const [githubToken, setGitHubToken] = useState('');
  const [userId, setUserId] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [options, setOptions] = useState<ReadmeOptions>(defaultOptions);
  const [feedback, setFeedback] = useState('');
  const [previousContent, setPreviousContent] = useState<string | null>(null);

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

  const handleGenerate = async (isRegenerate = false) => {
    if (!selectedRepo) return;

    setGenerating(true);
    setError('');

    // Build options with feedback for regeneration
    const generateOptions = { ...options };
    if (isRegenerate && feedback.trim() && previousContent) {
      // Append feedback to custom prompt for regeneration
      const feedbackPrompt = `\n\nPREVIOUS README (needs improvements):\n${previousContent.slice(0, 2000)}\n\nUSER FEEDBACK - Please address these issues:\n${feedback}`;
      generateOptions.customPrompt = (generateOptions.customPrompt || '') + feedbackPrompt;
    }

    try {
      const doc = await generateReadme(githubToken, userId, selectedRepo, generateOptions);
      setPreviousContent(doc.content);
      setDocument(doc);
      if (isRegenerate) {
        setFeedback(''); // Clear feedback after regeneration
      }
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
    } catch (err) {
      setError('Failed to sync to GitHub. Make sure you have write access to the repository.');
    } finally {
      setSyncing(false);
    }
  };

  const toggleSection = (key: keyof ReadmeOptions['sections']) => {
    setOptions(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        [key]: !prev.sections[key],
      },
    }));
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
      <div className="w-full max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold text-white mb-2">Generate README</h1>
        <p className="text-gray-400 mb-8">
          Connect a repository first to generate documentation
        </p>
        <div className="text-center py-16 bg-[#111] rounded-2xl border border-[#1a1a1a]">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-700" />
          <p className="text-gray-500">No repositories connected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Generate README</h1>
          <p className="text-gray-400 mt-1">
            Analyze your repository and generate comprehensive documentation
          </p>
        </div>
      </div>

      {/* Repository Selection */}
      <div className="bg-[#111] rounded-2xl border border-[#1a1a1a] p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Repository
            </label>
            <div className="relative">
              <select
                value={selectedRepo}
                onChange={(e) => setSelectedRepo(e.target.value)}
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#222] rounded-xl text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all hover:border-[#333]"
              >
                <option value="">Select repository</option>
                {repos.map((repo) => (
                  <option key={repo.id} value={repo.id}>
                    {repo.repo_name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-end gap-3">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                showOptions
                  ? 'bg-white text-black'
                  : 'bg-[#1a1a1a] text-gray-300 hover:bg-[#222] hover:text-white'
              }`}
            >
              <Settings2 size={18} />
              Customize
            </button>
            <button
              onClick={() => handleGenerate(false)}
              disabled={!selectedRepo || generating}
              className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-medium text-sm hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Generate README
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Customization Options */}
      {showOptions && (
        <div className="bg-[#111] rounded-2xl border border-[#1a1a1a] p-6 mb-6 space-y-6">
          {/* Style Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              README Style
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(['minimal', 'standard', 'comprehensive'] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => setOptions(prev => ({ ...prev, style }))}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    options.style === style
                      ? 'border-white bg-white/5'
                      : 'border-[#222] hover:border-[#333] hover:bg-[#0a0a0a]'
                  }`}
                >
                  <p className={`font-medium capitalize ${options.style === style ? 'text-white' : 'text-gray-300'}`}>
                    {style}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {styleDescriptions[style]}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Tone Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Writing Tone
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(['professional', 'friendly', 'technical'] as const).map((tone) => (
                <button
                  key={tone}
                  onClick={() => setOptions(prev => ({ ...prev, tone }))}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    options.tone === tone
                      ? 'border-white bg-white/5'
                      : 'border-[#222] hover:border-[#333] hover:bg-[#0a0a0a]'
                  }`}
                >
                  <p className={`font-medium capitalize ${options.tone === tone ? 'text-white' : 'text-gray-300'}`}>
                    {tone}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {toneDescriptions[tone]}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Section Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Include Sections
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(options.sections).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => toggleSection(key as keyof ReadmeOptions['sections'])}
                  className={`px-4 py-3 rounded-xl font-medium text-sm capitalize transition-all ${
                    value
                      ? 'bg-white text-black'
                      : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#222] hover:text-gray-300'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Instructions */}
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
              placeholder="Add any specific instructions or context...&#10;&#10;Examples:&#10;• Use MIT license&#10;• This is a CLI tool for developers&#10;• Include Docker setup instructions&#10;• Mention it's part of a larger monorepo"
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#222] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all hover:border-[#333] resize-none h-32"
            />
            <p className="text-xs text-gray-500 mt-2">
              Provide context about your project, preferred license type, special features to highlight, or any other details you'd like included.
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Output */}
      {document && (
        <>
          <div className="bg-[#111] rounded-2xl border border-[#1a1a1a] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a1a] bg-[#0f0f0f]">
              <h3 className="font-medium text-white">{document.title}</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-[#1a1a1a]"
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

          {/* Regenerate with Feedback */}
          <div className="mt-6 bg-[#111] rounded-2xl border border-[#1a1a1a] p-6">
            <div className="flex items-center gap-2 mb-3">
              <RefreshCw size={18} className="text-gray-400" />
              <label className="text-sm font-medium text-gray-300">
                Not happy with the result? Provide feedback and regenerate
              </label>
            </div>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us what needs to be changed...&#10;&#10;Examples:&#10;• Make the installation section more detailed&#10;• Add more code examples&#10;• Change the license to Apache 2.0&#10;• The description is too long, make it shorter&#10;• Add a troubleshooting section"
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#222] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all hover:border-[#333] resize-none h-28 mb-4"
            />
            <button
              onClick={() => handleGenerate(true)}
              disabled={!feedback.trim() || generating}
              className="flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#222] text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-[#333]"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  Regenerate with Feedback
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
