import { useState, useEffect } from 'react';
import { Loader2, FileText, BookOpen, Trash2, Copy, Check, FolderOpen, Upload, Eye } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../../lib/useAuth';
import { useClipboard } from '../../lib/useClipboard';
import { fetchDocuments, deleteDocument, syncToGitHub } from '../../lib/api';
import type { GeneratedDocument } from '../../types';

type FilterType = 'all' | 'changelog' | 'readme';

export default function DocumentList() {
  const { githubToken, userId, loading: authLoading } = useAuth();
  const { copy } = useClipboard();

  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (githubToken && userId) {
      loadDocuments();
    }
  }, [filter, githubToken, userId]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const data = await fetchDocuments(githubToken, userId, filter === 'all' ? undefined : filter);
      setDocuments(data);
    } catch {
      // Handle silently
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    setDeleting(docId);
    try {
      await deleteDocument(githubToken, userId, docId);
      setDocuments(documents.filter((d) => d.id !== docId));
    } catch {
      // Handle silently
    } finally {
      setDeleting(null);
    }
  };

  const handleCopy = async (doc: GeneratedDocument) => {
    await copy(doc.content);
    setCopiedId(doc.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSync = async (doc: GeneratedDocument) => {
    if (!doc.connected_repositories) return;
    setSyncing(doc.id);
    try {
      const fileName = doc.doc_type === 'changelog' ? 'CHANGELOG.md' : 'README.md';
      await syncToGitHub(githubToken, userId, doc.connected_repositories.repo_full_name, fileName, doc.content);
    } catch {
      // Handle silently
    } finally {
      setSyncing(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-neon" />
      </div>
    );
  }

  const changelogCount = documents.filter(d => d.doc_type === 'changelog').length;
  const readmeCount = documents.filter(d => d.doc_type === 'readme').length;

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-neon">{'>'} Documents</h1>
          <p className="text-gray-400 mt-1">View and manage your generated documentation</p>
        </div>

        <div className="flex items-center gap-1 bg-hacker-card p-1.5 border border-hacker-border">
          {(['all', 'changelog', 'readme'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-neon text-black shadow-neon-sm'
                  : 'text-gray-400 hover:text-neon hover:bg-neon/10'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-hacker-card border border-hacker-border p-4">
          <p className="text-3xl font-semibold text-neon">{documents.length}</p>
          <p className="text-sm text-gray-500">Total Documents</p>
        </div>
        <div className="bg-hacker-card border border-hacker-border p-4">
          <p className="text-3xl font-semibold text-neon">{changelogCount}</p>
          <p className="text-sm text-gray-500">Changelogs</p>
        </div>
        <div className="bg-hacker-card border border-hacker-border p-4">
          <p className="text-3xl font-semibold text-neon">{readmeCount}</p>
          <p className="text-sm text-gray-500">READMEs</p>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-20 bg-hacker-card border border-hacker-border">
          <FolderOpen className="w-16 h-16 mx-auto mb-4 text-neon/30" />
          <h3 className="text-xl font-medium text-white mb-2">No documents yet</h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            Generate changelogs or READMEs from your repositories to see them here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-hacker-card border border-hacker-border overflow-hidden hover:border-neon/30 transition-all"
            >
              <div className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 flex items-center justify-center border ${
                    doc.doc_type === 'changelog'
                      ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                      : 'bg-green-500/10 border-green-500/30 text-green-400'
                  }`}>
                    {doc.doc_type === 'changelog' ? <FileText size={20} /> : <BookOpen size={20} />}
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{doc.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span className={`px-2 py-0.5 text-xs font-medium border ${
                        doc.doc_type === 'changelog'
                          ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                          : 'bg-green-500/10 border-green-500/30 text-green-400'
                      }`}>
                        {doc.doc_type}
                      </span>
                      <span>{formatDate(doc.created_at)}</span>
                      {doc.connected_repositories && (
                        <>
                          <span className="text-gray-600">|</span>
                          <span className="text-neon/60">{doc.connected_repositories.repo_name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExpandedDoc(expandedDoc === doc.id ? null : doc.id)}
                    className="p-2.5 text-gray-400 hover:text-neon hover:bg-neon/10 transition-all"
                    title="Preview"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => handleCopy(doc)}
                    className="p-2.5 text-gray-400 hover:text-neon hover:bg-neon/10 transition-all"
                    title="Copy"
                  >
                    {copiedId === doc.id ? <Check size={18} className="text-neon" /> : <Copy size={18} />}
                  </button>
                  {doc.connected_repositories && (
                    <button
                      onClick={() => handleSync(doc)}
                      disabled={syncing === doc.id}
                      className="p-2.5 text-gray-400 hover:text-green-400 hover:bg-green-500/10 disabled:opacity-50 transition-all"
                      title="Push to GitHub"
                    >
                      {syncing === doc.id ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(doc.id)}
                    disabled={deleting === doc.id}
                    className="p-2.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-all"
                    title="Delete"
                  >
                    {deleting === doc.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                  </button>
                </div>
              </div>

              {expandedDoc === doc.id && (
                <div className="border-t border-hacker-border p-6 bg-hacker-bg">
                  <div className="prose prose-invert prose-sm max-w-none max-h-96 overflow-y-auto">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{doc.content}</ReactMarkdown>
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
