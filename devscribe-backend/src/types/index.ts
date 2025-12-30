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

export interface ChangelogInput {
  repo_name: string;
  from_ref: string;
  to_ref: string;
  commits: CommitInfo[];
  pull_requests: PullRequestInfo[];
}

export interface ReadmeInput {
  repo_name: string;
  description: string | null;
  file_structure: string[];
  languages: Record<string, number>;
  package_json?: Record<string, unknown>;
  existing_readme?: string;
  source_files?: CodeFile[];
  code_analysis?: CodeAnalysis;
}

// Code analysis types for comprehensive README generation
export interface CodeFile {
  path: string;
  language: string;
  content: string;
  lineCount: number;
}

export interface ExportInfo {
  name: string;
  type: 'function' | 'class' | 'const' | 'interface' | 'type' | 'component' | 'default';
  file: string;
  description?: string;
}

export interface RouteInfo {
  method: string;
  path: string;
  handler: string;
  file: string;
}

export interface ComponentInfo {
  name: string;
  file: string;
  type: 'functional' | 'class' | 'page' | 'layout';
  props?: string[];
}

export interface CodeAnalysis {
  architecture: string;
  entryPoints: string[];
  exports: ExportInfo[];
  routes: RouteInfo[];
  components: ComponentInfo[];
  patterns: string[];
  techStack: string[];
}
