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
  repo_name: string;
  repo_full_name: string;
  repo_url: string;
  default_branch: string;
  is_private: boolean;
}

export interface GitRef {
  name: string;
  type: 'branch' | 'tag' | 'release' | 'commit';
  sha: string;
  date?: string;
  message?: string;
}

export interface GeneratedDocument {
  id: string;
  doc_type: 'changelog' | 'readme';
  title: string;
  content: string;
  created_at: string;
  connected_repositories?: {
    repo_name: string;
    repo_full_name: string;
  };
}
