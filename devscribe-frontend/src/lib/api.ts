import type { GitHubRepo, ConnectedRepository, GitRef, GeneratedDocument } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

async function api<T>(
  path: string,
  token: string,
  userId: string,
  method: Method = 'GET',
  body?: unknown
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-user-id': userId,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  if (method === 'DELETE') return undefined as T;
  return res.json();
}

export const fetchAvailableRepos = (token: string, userId: string) =>
  api<{ repos: GitHubRepo[] }>('/api/repos/available', token, userId).then(d => d.repos);

export const fetchConnectedRepos = (token: string, userId: string) =>
  api<{ repositories: ConnectedRepository[] }>('/api/repos/connected', token, userId).then(d => d.repositories);

export const connectRepo = (token: string, userId: string, repo: GitHubRepo) =>
  api<{ repository: ConnectedRepository }>('/api/repos/connect', token, userId, 'POST', {
    github_repo_id: repo.id,
    repo_name: repo.name,
    repo_full_name: repo.full_name,
    repo_url: repo.html_url,
    default_branch: repo.default_branch,
    is_private: repo.private,
  }).then(d => d.repository);

export const disconnectRepo = (token: string, userId: string, repoId: string) =>
  api<void>(`/api/repos/${repoId}`, token, userId, 'DELETE');

export const fetchRepoRefs = (token: string, userId: string, repoId: string) =>
  api<{ releases: GitRef[]; tags: GitRef[]; branches: GitRef[]; commits: GitRef[] }>(
    `/api/repos/${repoId}/refs`, token, userId
  );

export const generateChangelog = (token: string, userId: string, repoId: string, fromRef: string, toRef: string) =>
  api<{ document: GeneratedDocument }>('/api/changelog/generate', token, userId, 'POST', {
    repository_id: repoId,
    from_ref: fromRef,
    to_ref: toRef,
  }).then(d => d.document);

export const generateReadme = (token: string, userId: string, repoId: string, options?: ReadmeOptions) =>
  api<{ document: GeneratedDocument }>('/api/readme/generate', token, userId, 'POST', {
    repository_id: repoId,
    options,
  }).then(d => d.document);

export const fetchDocuments = (token: string, userId: string, docType?: 'changelog' | 'readme') => {
  const params = docType ? `?doc_type=${docType}` : '';
  return api<{ documents: GeneratedDocument[] }>(`/api/documents${params}`, token, userId).then(d => d.documents);
};

export const deleteDocument = (token: string, userId: string, docId: string) =>
  api<void>(`/api/documents/${docId}`, token, userId, 'DELETE');

export const syncToGitHub = (token: string, userId: string, repoFullName: string, filePath: string, content: string) =>
  api<{ sha: string; url: string }>('/api/sync/push', token, userId, 'POST', {
    repo_full_name: repoFullName,
    file_path: filePath,
    content,
    commit_message: `Update ${filePath} via DevScribe`,
  });