import { Octokit } from '@octokit/rest';
import type {
  GitHubRepo,
  GitRef,
  GitRelease,
  CommitInfo,
  PullRequestInfo,
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
