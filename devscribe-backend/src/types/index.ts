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

export interface GitRelease {
  id: number;
  tag_name: string;
  name: string;
  published_at: string;
  body: string;
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
}

// Request/Response types

export interface ConnectRepoRequest {
  github_repo_id: number;
  repo_name: string;
  repo_full_name: string;
  repo_url: string;
  default_branch: string;
  is_private: boolean;
}

export interface GenerateChangelogRequest {
  repository_id: string;
  from_ref: string;
  to_ref: string;
}

export interface GenerateReadmeRequest {
  repository_id: string;
}

export interface UpdateDocumentRequest {
  title?: string;
  content?: string;
}

// Changelog generation input for LLM

export interface ChangelogInput {
  repo_name: string;
  from_ref: string;
  to_ref: string;
  commits: CommitInfo[];
  pull_requests: PullRequestInfo[];
}

// README generation input for LLM

export interface ReadmeInput {
  repo_name: string;
  description: string | null;
  file_structure: string[];
  languages: Record<string, number>;
  package_json?: Record<string, unknown>;
  existing_readme?: string;
}

// User profile

export interface UserProfile {
  id: string;
  github_username: string;
  github_avatar_url: string | null;
  created_at: string;
}
