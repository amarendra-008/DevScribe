import { useState, useEffect } from 'react';
import { Loader2, FileText, BookOpen, Trash2, Copy, Check, FolderOpen } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { fetchDocuments, deleteDocument } from '../../lib/api';
import type { GeneratedDocument } from '../../types';

export default function DocumentList() {
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'changelog' | 'readme'>('all');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Documents</h1>
          <p className="text-gray-400 mt-1">
            View and manage your generated documentation
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-1 bg-[#18181b] p-1 rounded border border-[#2a2a2a]">
          {(['all', 'changelog', 'readme'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-white text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Document list */}
      {documents.length === 0 ? (
        <div className="text-center py-16 bg-[#18181b] rounded-md border border-[#2a2a2a]">
          <FolderOpen className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <h3 className="text-lg font-medium text-white mb-2">
            No documents yet
          </h3>
          <p className="text-gray-400">
            Generate changelogs or READMEs to see them here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-start justify-between p-4 bg-[#18181b] rounded-md border border-[#2a2a2a]"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {doc.doc_type === 'changelog' ? (
                    <FileText className="w-5 h-5 text-gray-400" />
                  ) : (
                    <BookOpen className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-white font-medium">{doc.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    <span className="capitalize">{doc.doc_type}</span>
                    <span>{formatDate(doc.created_at)}</span>
                    {doc.connected_repositories && (
                      <span>{doc.connected_repositories.repo_name}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleCopy(doc)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  {copied === doc.id ? (
                    <Check size={18} className="text-green-400" />
                  ) : (
                    <Copy size={18} />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(doc.id)}
                  disabled={deleting === doc.id}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
                >
                  {deleting === doc.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 size={18} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
