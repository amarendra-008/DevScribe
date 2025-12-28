import type {
  GitHubRepo,
  ConnectedRepository,
  GitRef,
  GeneratedDocument,
  RepoAnalysis,
  ChangelogPreview,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Helper to build headers with auth tokens
function buildHeaders(githubToken: string, userId: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${githubToken}`,
    'x-user-id': userId,
  };
}

// Repositories API

export async function fetchAvailableRepos(
  githubToken: string,
  userId: string
): Promise<GitHubRepo[]> {
  const res = await fetch(`${API_URL}/api/repos/available`, {
    headers: buildHeaders(githubToken, userId),
  });

  if (!res.ok) throw new Error('Failed to fetch repositories');
  const data = await res.json();
  return data.repos;
}

export async function fetchConnectedRepos(
  githubToken: string,
  userId: string
): Promise<ConnectedRepository[]> {
  const res = await fetch(`${API_URL}/api/repos/connected`, {
    headers: buildHeaders(githubToken, userId),
  });

  if (!res.ok) throw new Error('Failed to fetch connected repositories');
  const data = await res.json();
  return data.repositories;
}

export async function connectRepo(
  githubToken: string,
  userId: string,
  repo: GitHubRepo
): Promise<ConnectedRepository> {
  const res = await fetch(`${API_URL}/api/repos/connect`, {
    method: 'POST',
    headers: buildHeaders(githubToken, userId),
    body: JSON.stringify({
      github_repo_id: repo.id,
      repo_name: repo.name,
      repo_full_name: repo.full_name,
      repo_url: repo.html_url,
      default_branch: repo.default_branch,
      is_private: repo.private,
    }),
  });

  if (!res.ok) {
    if (res.status === 409) throw new Error('Repository already connected');
    throw new Error('Failed to connect repository');
  }

  const data = await res.json();
  return data.repository;
}

export async function disconnectRepo(
  githubToken: string,
  userId: string,
  repoId: string
): Promise<void> {
  const res = await fetch(`${API_URL}/api/repos/${repoId}`, {
    method: 'DELETE',
    headers: buildHeaders(githubToken, userId),
  });

  if (!res.ok) throw new Error('Failed to disconnect repository');
}

export async function fetchRepoRefs(
  githubToken: string,
  userId: string,
  repoId: string
): Promise<{ releases: GitRef[]; tags: GitRef[]; branches: GitRef[] }> {
  const res = await fetch(`${API_URL}/api/repos/${repoId}/refs`, {
    headers: buildHeaders(githubToken, userId),
  });

  if (!res.ok) throw new Error('Failed to fetch refs');
  return res.json();
}

// Changelog API

export async function generateChangelog(
  githubToken: string,
  userId: string,
  repositoryId: string,
  fromRef: string,
  toRef: string
): Promise<GeneratedDocument> {
  const res = await fetch(`${API_URL}/api/changelog/generate`, {
    method: 'POST',
    headers: buildHeaders(githubToken, userId),
    body: JSON.stringify({
      repository_id: repositoryId,
      from_ref: fromRef,
      to_ref: toRef,
    }),
  });

  if (!res.ok) throw new Error('Failed to generate changelog');
  const data = await res.json();
  return data.document;
}

export async function previewChangelog(
  githubToken: string,
  userId: string,
  repositoryId: string,
  fromRef: string,
  toRef: string
): Promise<ChangelogPreview> {
  const params = new URLSearchParams({
    repository_id: repositoryId,
    from_ref: fromRef,
    to_ref: toRef,
  });

  const res = await fetch(`${API_URL}/api/changelog/preview?${params}`, {
    headers: buildHeaders(githubToken, userId),
  });

  if (!res.ok) throw new Error('Failed to preview changelog');
  return res.json();
}

// README API

export interface ReadmeOptions {
  style?: 'minimal' | 'standard' | 'comprehensive';
  tone?: 'professional' | 'friendly' | 'technical';
  sections?: {
    badges?: boolean;
    features?: boolean;
    installation?: boolean;
    usage?: boolean;
    api?: boolean;
    contributing?: boolean;
    license?: boolean;
    acknowledgments?: boolean;
  };
  customPrompt?: string;
}

export async function generateReadme(
  githubToken: string,
  userId: string,
  repositoryId: string,
  options?: ReadmeOptions
): Promise<GeneratedDocument> {
  const res = await fetch(`${API_URL}/api/readme/generate`, {
    method: 'POST',
    headers: buildHeaders(githubToken, userId),
    body: JSON.stringify({ repository_id: repositoryId, options }),
  });

  if (!res.ok) throw new Error('Failed to generate README');
  const data = await res.json();
  return data.document;
}

export async function analyzeRepo(
  githubToken: string,
  userId: string,
  repositoryId: string
): Promise<RepoAnalysis> {
  const res = await fetch(`${API_URL}/api/readme/analyze`, {
    method: 'POST',
    headers: buildHeaders(githubToken, userId),
    body: JSON.stringify({ repository_id: repositoryId }),
  });

  if (!res.ok) throw new Error('Failed to analyze repository');
  return res.json();
}

// Documents API

export async function fetchDocuments(
  githubToken: string,
  userId: string,
  docType?: 'changelog' | 'readme',
  repositoryId?: string
): Promise<GeneratedDocument[]> {
  const params = new URLSearchParams();
  if (docType) params.set('doc_type', docType);
  if (repositoryId) params.set('repository_id', repositoryId);

  const url = `${API_URL}/api/documents${params.toString() ? `?${params}` : ''}`;
  const res = await fetch(url, {
    headers: buildHeaders(githubToken, userId),
  });

  if (!res.ok) throw new Error('Failed to fetch documents');
  const data = await res.json();
  return data.documents;
}

export async function fetchDocument(
  githubToken: string,
  userId: string,
  documentId: string
): Promise<GeneratedDocument> {
  const res = await fetch(`${API_URL}/api/documents/${documentId}`, {
    headers: buildHeaders(githubToken, userId),
  });

  if (!res.ok) throw new Error('Failed to fetch document');
  const data = await res.json();
  return data.document;
}

export async function updateDocument(
  githubToken: string,
  userId: string,
  documentId: string,
  updates: { title?: string; content?: string }
): Promise<GeneratedDocument> {
  const res = await fetch(`${API_URL}/api/documents/${documentId}`, {
    method: 'PUT',
    headers: buildHeaders(githubToken, userId),
    body: JSON.stringify(updates),
  });

  if (!res.ok) throw new Error('Failed to update document');
  const data = await res.json();
  return data.document;
}

export async function deleteDocument(
  githubToken: string,
  userId: string,
  documentId: string
): Promise<void> {
  const res = await fetch(`${API_URL}/api/documents/${documentId}`, {
    method: 'DELETE',
    headers: buildHeaders(githubToken, userId),
  });

  if (!res.ok) throw new Error('Failed to delete document');
}

// Sync API - Push content to GitHub

export async function syncToGitHub(
  githubToken: string,
  userId: string,
  repoFullName: string,
  filePath: string,
  content: string,
  commitMessage?: string
): Promise<{ sha: string; url: string }> {
  const res = await fetch(`${API_URL}/api/sync/push`, {
    method: 'POST',
    headers: buildHeaders(githubToken, userId),
    body: JSON.stringify({
      repo_full_name: repoFullName,
      file_path: filePath,
      content,
      commit_message: commitMessage || `Update ${filePath} via DevScribe`,
    }),
  });

  if (!res.ok) throw new Error('Failed to sync to GitHub');
  return res.json();
}
