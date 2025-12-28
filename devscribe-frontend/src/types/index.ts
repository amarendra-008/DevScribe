// Repository types

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  private: boolean;
  default_branch: string;
  language: string | null;
  stargazers_count: number;
  updated_at: string;
}

export interface ConnectedRepository {
  id: string;
  user_id: string;
  github_repo_id: number;
  repo_name: string;
  repo_full_name: string;
  repo_url: string;
  default_branch: string;
  is_private: boolean;
  connected_at: string;
}

// Git reference types

export interface GitRef {
  name: string;
  type: 'branch' | 'tag' | 'release' | 'commit';
  sha: string;
  date?: string;
  message?: string;
}

// Commit and PR types

export interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  date: string;
}

export interface PullRequestInfo {
  number: number;
  title: string;
  body: string | null;
  labels: string[];
  author: string;
  merged_at: string;
}

// Document types

export type DocumentType = 'changelog' | 'readme';

export interface GeneratedDocument {
  id: string;
  user_id: string;
  repository_id: string;
  doc_type: DocumentType;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  connected_repositories?: {
    repo_name: string;
    repo_full_name: string;
    repo_url?: string;
  };
}

// Analysis types

export interface RepoAnalysis {
  file_structure: string[];
  languages: Record<string, number>;
  file_count: number;
}

export interface ChangelogPreview {
  commits: CommitInfo[];
  pull_requests: PullRequestInfo[];
}
