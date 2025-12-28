import { useState, useEffect } from 'react';
import { Loader2, FileText, BookOpen, Trash2, Copy, Check, FolderOpen, Upload, Eye } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '../../lib/supabase';
import { fetchDocuments, deleteDocument, syncToGitHub } from '../../lib/api';
import type { GeneratedDocument } from '../../types';

export default function DocumentList() {
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'changelog' | 'readme'>('all');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const [githubToken, setGitHubToken] = useState('');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    if (githubToken && userId) {
      loadDocuments();
    }
  }, [filter, githubToken, userId]);

  const initAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setGitHubToken(session.provider_token || '');
      setUserId(session.user.id);
    }
  };

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const docType = filter === 'all' ? undefined : filter;
      const data = await fetchDocuments(githubToken, userId, docType);
      setDocuments(data);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    setDeleting(docId);
    try {
      await deleteDocument(githubToken, userId, docId);
      setDocuments(documents.filter((d) => d.id !== docId));
    } catch (err) {
      console.error('Failed to delete:', err);
    } finally {
      setDeleting(null);
    }
  };

  const handleCopy = async (doc: GeneratedDocument) => {
    await navigator.clipboard.writeText(doc.content);
    setCopied(doc.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSync = async (doc: GeneratedDocument) => {
    if (!doc.connected_repositories) return;
    setSyncing(doc.id);
    try {
      const fileName = doc.doc_type === 'changelog' ? 'CHANGELOG.md' : 'README.md';
      await syncToGitHub(
        githubToken,
        userId,
        doc.connected_repositories.repo_full_name,
        fileName,
        doc.content
      );
    } catch (err) {
      console.error('Failed to sync:', err);
    } finally {
      setSyncing(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Documents</h1>
          <p className="text-gray-400 mt-1">
            View and manage your generated documentation
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-1 bg-[#111] p-1.5 rounded-xl border border-[#222]">
          {(['all', 'changelog', 'readme'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                filter === f
                  ? 'bg-white text-black shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4">
          <p className="text-3xl font-semibold text-white">{documents.length}</p>
          <p className="text-sm text-gray-500">Total Documents</p>
        </div>
        <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4">
          <p className="text-3xl font-semibold text-white">
            {documents.filter(d => d.doc_type === 'changelog').length}
          </p>
          <p className="text-sm text-gray-500">Changelogs</p>
        </div>
        <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4">
          <p className="text-3xl font-semibold text-white">
            {documents.filter(d => d.doc_type === 'readme').length}
          </p>
          <p className="text-sm text-gray-500">READMEs</p>
        </div>
      </div>

      {/* Document list */}
      {documents.length === 0 ? (
        <div className="text-center py-20 bg-[#111] rounded-2xl border border-[#1a1a1a]">
          <FolderOpen className="w-16 h-16 mx-auto mb-4 text-gray-700" />
          <h3 className="text-xl font-medium text-white mb-2">
            No documents yet
          </h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            Generate changelogs or READMEs from your repositories to see them here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-[#111] rounded-xl border border-[#1a1a1a] overflow-hidden transition-all duration-200 hover:border-[#2a2a2a]"
            >
              {/* Document header */}
              <div className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    doc.doc_type === 'changelog'
                      ? 'bg-blue-500/10 text-blue-400'
                      : 'bg-green-500/10 text-green-400'
                  }`}>
                    {doc.doc_type === 'changelog' ? (
                      <FileText size={20} />
                    ) : (
                      <BookOpen size={20} />
                    )}
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{doc.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        doc.doc_type === 'changelog'
                          ? 'bg-blue-500/10 text-blue-400'
                          : 'bg-green-500/10 text-green-400'
                      }`}>
                        {doc.doc_type}
                      </span>
                      <span>{formatDate(doc.created_at)}</span>
                      {doc.connected_repositories && (
                        <span className="text-gray-600">•</span>
                      )}
                      {doc.connected_repositories && (
                        <span>{doc.connected_repositories.repo_name}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExpandedDoc(expandedDoc === doc.id ? null : doc.id)}
                    className="p-2.5 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors"
                    title="Preview"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => handleCopy(doc)}
                    className="p-2.5 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors"
                    title="Copy"
                  >
                    {copied === doc.id ? (
                      <Check size={18} className="text-green-400" />
                    ) : (
                      <Copy size={18} />
                    )}
                  </button>
                  {doc.connected_repositories && (
                    <button
                      onClick={() => handleSync(doc)}
                      disabled={syncing === doc.id}
                      className="p-2.5 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors disabled:opacity-50"
                      title="Push to GitHub"
                    >
                      {syncing === doc.id ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Upload size={18} />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(doc.id)}
                    disabled={deleting === doc.id}
                    className="p-2.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    {deleting === doc.id ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Trash2 size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Expandable preview */}
              {expandedDoc === doc.id && (
                <div className="border-t border-[#1a1a1a] p-6 bg-[#0a0a0a]">
                  <div className="prose prose-invert prose-sm max-w-none max-h-96 overflow-y-auto">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {doc.content}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
