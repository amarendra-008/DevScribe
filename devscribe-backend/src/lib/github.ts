import { Octokit } from '@octokit/rest';
import type {
  GitHubRepo,
  GitRef,
  GitRelease,
  CommitInfo,
  PullRequestInfo,
  CodeFile,
} from '../types';

// Creates an authenticated Octokit instance
export function createGitHubClient(accessToken: string): Octokit {
  return new Octokit({ auth: accessToken });
}

// Fetches all repositories for the authenticated user
export async function getUserRepos(octokit: Octokit): Promise<GitHubRepo[]> {
  const { data } = await octokit.repos.listForAuthenticatedUser({
    sort: 'updated',
    per_page: 100,
    type: 'all',
  });

  return data.map((repo) => ({
    id: repo.id,
    name: repo.name,
    full_name: repo.full_name,
    html_url: repo.html_url,
    description: repo.description,
    private: repo.private,
    default_branch: repo.default_branch,
    language: repo.language,
    stargazers_count: repo.stargazers_count,
    updated_at: repo.updated_at || '',
  }));
}

// Fetches releases for a repository
export async function getRepoReleases(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<GitRelease[]> {
  const { data } = await octokit.repos.listReleases({
    owner,
    repo,
    per_page: 50,
  });

  return data.map((release) => ({
    id: release.id,
    tag_name: release.tag_name,
    name: release.name || release.tag_name,
    published_at: release.published_at || '',
    body: release.body || '',
  }));
}

// Fetches tags for a repository
export async function getRepoTags(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<GitRef[]> {
  const { data } = await octokit.repos.listTags({
    owner,
    repo,
    per_page: 50,
  });

  return data.map((tag) => ({
    name: tag.name,
    type: 'tag' as const,
    sha: tag.commit.sha,
  }));
}

// Fetches branches for a repository
export async function getRepoBranches(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<GitRef[]> {
  const { data } = await octokit.repos.listBranches({
    owner,
    repo,
    per_page: 50,
  });

  return data.map((branch) => ({
    name: branch.name,
    type: 'branch' as const,
    sha: branch.commit.sha,
  }));
}

// Fetches commits between two refs
export async function getCommitsBetweenRefs(
  octokit: Octokit,
  owner: string,
  repo: string,
  base: string,
  head: string
): Promise<CommitInfo[]> {
  const { data } = await octokit.repos.compareCommits({
    owner,
    repo,
    base,
    head,
  });

  return data.commits.map((commit) => ({
    sha: commit.sha,
    message: commit.commit.message,
    author: commit.commit.author?.name || 'Unknown',
    date: commit.commit.author?.date || '',
  }));
}

// Fetches merged pull requests between two refs
export async function getPullRequestsBetweenRefs(
  octokit: Octokit,
  owner: string,
  repo: string,
  base: string,
  head: string
): Promise<PullRequestInfo[]> {
  // Get commits in range first
  const commits = await getCommitsBetweenRefs(octokit, owner, repo, base, head);
  const commitShas = new Set(commits.map((c) => c.sha));

  // Fetch recent merged PRs
  const { data: prs } = await octokit.pulls.list({
    owner,
    repo,
    state: 'closed',
    sort: 'updated',
    direction: 'desc',
    per_page: 100,
  });

  // Filter to PRs merged with commits in our range
  const relevantPrs = prs.filter((pr) => {
    if (!pr.merged_at || !pr.merge_commit_sha) return false;
    return commitShas.has(pr.merge_commit_sha);
  });

  return relevantPrs.map((pr) => ({
    number: pr.number,
    title: pr.title,
    body: pr.body,
    labels: pr.labels.map((label) =>
      typeof label === 'string' ? label : label.name || ''
    ),
    author: pr.user?.login || 'Unknown',
    merged_at: pr.merged_at || '',
  }));
}

// Fetches repository file tree
export async function getRepoTree(
  octokit: Octokit,
  owner: string,
  repo: string,
  ref: string = 'HEAD'
): Promise<string[]> {
  try {
    const { data } = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: ref,
      recursive: 'true',
    });

    return data.tree
      .filter((item) => item.path)
      .map((item) => item.path as string);
  } catch {
    return [];
  }
}

// Fetches file content from repository
export async function getFileContent(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string
): Promise<string | null> {
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
    });

    if ('content' in data && data.content) {
      return Buffer.from(data.content, 'base64').toString('utf-8');
    }
    return null;
  } catch {
    return null;
  }
}

// Fetches repository languages
export async function getRepoLanguages(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<Record<string, number>> {
  const { data } = await octokit.repos.listLanguages({
    owner,
    repo,
  });
  return data;
}

// Fetches recent commits for a repository
export async function getRecentCommits(
  octokit: Octokit,
  owner: string,
  repo: string,
  perPage: number = 20
): Promise<{ sha: string; message: string; date: string }[]> {
  const { data } = await octokit.repos.listCommits({
    owner,
    repo,
    per_page: perPage,
  });

  return data.map((commit) => ({
    sha: commit.sha,
    message: commit.commit.message.split('\n')[0], // First line only
    date: commit.commit.author?.date || '',
  }));
}

// Fetches the first commit of a repository
export async function getFirstCommit(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<{ sha: string; message: string; date: string } | null> {
  try {
    // Get all commits (paginated to find the first one)
    const { data } = await octokit.repos.listCommits({
      owner,
      repo,
      per_page: 1,
    });

    if (data.length === 0) return null;

    // Get the total count by checking the Link header
    const response = await octokit.repos.listCommits({
      owner,
      repo,
      per_page: 1,
      page: 1,
    });

    // Parse link header to find last page
    const linkHeader = response.headers.link;
    if (!linkHeader) {
      // Only one page of commits
      return {
        sha: data[0].sha,
        message: data[0].commit.message.split('\n')[0],
        date: data[0].commit.author?.date || '',
      };
    }

    const lastPageMatch = linkHeader.match(/page=(\d+)>; rel="last"/);
    if (lastPageMatch) {
      const lastPage = parseInt(lastPageMatch[1], 10);
      const lastPageResponse = await octokit.repos.listCommits({
        owner,
        repo,
        per_page: 1,
        page: lastPage,
      });

      if (lastPageResponse.data.length > 0) {
        const firstCommit = lastPageResponse.data[0];
        return {
          sha: firstCommit.sha,
          message: firstCommit.commit.message.split('\n')[0],
          date: firstCommit.commit.author?.date || '',
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

// Priority patterns for selecting important files
const ENTRY_POINT_PATTERNS = [
  /^(src\/)?(index|main|app|server)\.(ts|js|tsx|jsx)$/,
  /^(src\/)?App\.(ts|js|tsx|jsx)$/,
];

const CONFIG_PATTERNS = [
  /^tsconfig\.json$/,
  /^vite\.config\.(ts|js)$/,
  /^next\.config\.(ts|js|mjs)$/,
  /^webpack\.config\.(ts|js)$/,
  /^tailwind\.config\.(ts|js)$/,
  /^\.env\.example$/,
];

const ROUTE_PATTERNS = [
  /^(src\/)?(routes|api|pages\/api)\/.+\.(ts|js|tsx|jsx)$/,
  /^(src\/)?controllers?\/.+\.(ts|js)$/,
];

const COMPONENT_PATTERNS = [
  /^(src\/)?components?\/.+\.(tsx|jsx)$/,
  /^(src\/)?pages?\/.+\.(tsx|jsx)$/,
];

const TYPE_PATTERNS = [
  /^(src\/)?types?\/(index|.+)\.(ts|d\.ts)$/,
  /^(src\/)?interfaces?\/.+\.ts$/,
];

const SERVICE_PATTERNS = [
  /^(src\/)?(services?|lib|utils?)\/.+\.(ts|js)$/,
];

// Files/directories to always skip
const SKIP_PATTERNS = [
  /node_modules/,
  /\.git/,
  /dist\//,
  /build\//,
  /\.next\//,
  /coverage\//,
  /\.lock$/,
  /lock\.json$/,
  /\.min\.(js|css)$/,
  /\.map$/,
  /\.d\.ts$/,  // Skip declaration files except explicit type files
  /\.(png|jpg|jpeg|gif|svg|ico|webp)$/i,
  /\.(woff|woff2|ttf|eot)$/i,
  /\.(mp3|mp4|wav|avi)$/i,
];

function getLanguageFromPath(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  const langMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'tsx',
    js: 'javascript',
    jsx: 'jsx',
    py: 'python',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    java: 'java',
    kt: 'kotlin',
    swift: 'swift',
    php: 'php',
    cs: 'csharp',
    cpp: 'cpp',
    c: 'c',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    md: 'markdown',
    css: 'css',
    scss: 'scss',
    html: 'html',
  };
  return langMap[ext] || ext;
}

function shouldSkipFile(filePath: string): boolean {
  return SKIP_PATTERNS.some(pattern => pattern.test(filePath));
}

function categorizeFile(filePath: string): { category: string; priority: number } {
  if (ENTRY_POINT_PATTERNS.some(p => p.test(filePath))) {
    return { category: 'entry', priority: 1 };
  }
  if (CONFIG_PATTERNS.some(p => p.test(filePath))) {
    return { category: 'config', priority: 2 };
  }
  if (TYPE_PATTERNS.some(p => p.test(filePath))) {
    return { category: 'types', priority: 3 };
  }
  if (ROUTE_PATTERNS.some(p => p.test(filePath))) {
    return { category: 'routes', priority: 4 };
  }
  if (SERVICE_PATTERNS.some(p => p.test(filePath))) {
    return { category: 'services', priority: 5 };
  }
  if (COMPONENT_PATTERNS.some(p => p.test(filePath))) {
    return { category: 'components', priority: 6 };
  }
  return { category: 'other', priority: 10 };
}

// Fetches key source files for comprehensive code analysis
export async function getKeySourceFiles(
  octokit: Octokit,
  owner: string,
  repo: string,
  fileTree: string[],
  maxFiles: number = 20,
  maxLinesPerFile: number = 300
): Promise<CodeFile[]> {
  // Filter and categorize files
  const categorizedFiles = fileTree
    .filter(f => !shouldSkipFile(f))
    .filter(f => /\.(ts|tsx|js|jsx|py|go|rs|java|rb|php)$/.test(f))
    .map(f => ({
      path: f,
      ...categorizeFile(f),
    }))
    .sort((a, b) => a.priority - b.priority);

  // Select diverse set of files across categories
  const selectedFiles: string[] = [];
  const categoryLimits: Record<string, number> = {
    entry: 3,
    config: 3,
    types: 2,
    routes: 4,
    services: 4,
    components: 4,
    other: 2,
  };
  const categoryCounts: Record<string, number> = {};

  for (const file of categorizedFiles) {
    if (selectedFiles.length >= maxFiles) break;

    const limit = categoryLimits[file.category] || 2;
    const count = categoryCounts[file.category] || 0;

    if (count < limit) {
      selectedFiles.push(file.path);
      categoryCounts[file.category] = count + 1;
    }
  }

  // Fetch file contents in parallel (with concurrency limit)
  const codeFiles: CodeFile[] = [];
  const batchSize = 5;

  for (let i = 0; i < selectedFiles.length; i += batchSize) {
    const batch = selectedFiles.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (filePath) => {
        try {
          const content = await getFileContent(octokit, owner, repo, filePath);
          if (!content) return null;

          const lines = content.split('\n');
          const lineCount = lines.length;

          // Truncate if too long
          let truncatedContent = content;
          if (lineCount > maxLinesPerFile) {
            truncatedContent = lines.slice(0, maxLinesPerFile).join('\n') +
              `\n\n// ... truncated (${lineCount - maxLinesPerFile} more lines)`;
          }

          return {
            path: filePath,
            language: getLanguageFromPath(filePath),
            content: truncatedContent,
            lineCount,
          } as CodeFile;
        } catch {
          return null;
        }
      })
    );

    codeFiles.push(...results.filter((f): f is CodeFile => f !== null));
  }

  return codeFiles;
}
