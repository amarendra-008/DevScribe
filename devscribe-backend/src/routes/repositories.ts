import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import {
  createGitHubClient,
  getUserRepos,
  getRepoReleases,
  getRepoTags,
  getRepoBranches,
  getRecentCommits,
  getFirstCommit,
} from '../lib/github';
import type { ConnectRepoRequest, GitRef } from '../types';

const router = Router();

// Middleware to extract GitHub token from Authorization header
function getGitHubToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

// GET /api/repos/available - List user's GitHub repositories
router.get('/available', async (req: Request, res: Response) => {
  const token = getGitHubToken(req);
  if (!token) {
    res.status(401).json({ error: 'GitHub token required' });
    return;
  }

  try {
    const octokit = createGitHubClient(token);
    const repos = await getUserRepos(octokit);
    res.json({ repos });
  } catch (err) {
    console.error('Failed to fetch GitHub repos:', err);
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

// GET /api/repos/connected - List connected repositories for user
router.get('/connected', async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    res.status(401).json({ error: 'User ID required' });
    return;
  }

  try {
    const { data, error } = await supabase
      .from('connected_repositories')
      .select('*')
      .eq('user_id', userId)
      .order('connected_at', { ascending: false });

    if (error) throw error;
    res.json({ repositories: data });
  } catch (err) {
    console.error('Failed to fetch connected repos:', err);
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

// POST /api/repos/connect - Connect a repository
router.post('/connect', async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    res.status(401).json({ error: 'User ID required' });
    return;
  }

  const body = req.body as ConnectRepoRequest;
  if (!body.github_repo_id || !body.repo_name || !body.repo_full_name) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  try {
    const { data, error } = await supabase
      .from('connected_repositories')
      .insert({
        user_id: userId,
        github_repo_id: body.github_repo_id,
        repo_name: body.repo_name,
        repo_full_name: body.repo_full_name,
        repo_url: body.repo_url,
        default_branch: body.default_branch || 'main',
        is_private: body.is_private || false,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        res.status(409).json({ error: 'Repository already connected' });
        return;
      }
      throw error;
    }

    res.status(201).json({ repository: data });
  } catch (err) {
    console.error('Failed to connect repository:', err);
    res.status(500).json({ error: 'Failed to connect repository' });
  }
});

// DELETE /api/repos/:id - Disconnect a repository
router.delete('/:id', async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    res.status(401).json({ error: 'User ID required' });
    return;
  }

  const { id } = req.params;

  try {
    const { error } = await supabase
      .from('connected_repositories')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    console.error('Failed to disconnect repository:', err);
    res.status(500).json({ error: 'Failed to disconnect repository' });
  }
});

// GET /api/repos/:id/refs - Get releases, tags, and branches for a repository
router.get('/:id/refs', async (req: Request, res: Response) => {
  const token = getGitHubToken(req);
  const userId = req.headers['x-user-id'] as string;

  if (!token || !userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const { id } = req.params;

  try {
    // Get connected repo details
    const { data: repo, error } = await supabase
      .from('connected_repositories')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !repo) {
      res.status(404).json({ error: 'Repository not found' });
      return;
    }

    const [owner, repoName] = repo.repo_full_name.split('/');
    const octokit = createGitHubClient(token);

    // Fetch all refs in parallel
    const [releases, tags, branches, commits, firstCommit] = await Promise.all([
      getRepoReleases(octokit, owner, repoName).catch(() => []),
      getRepoTags(octokit, owner, repoName).catch(() => []),
      getRepoBranches(octokit, owner, repoName).catch(() => []),
      getRecentCommits(octokit, owner, repoName, 15).catch(() => []),
      getFirstCommit(octokit, owner, repoName).catch(() => null),
    ]);

    // Convert releases to refs format
    const releaseRefs: GitRef[] = releases.map((r) => ({
      name: r.tag_name,
      type: 'release' as const,
      sha: '',
      date: r.published_at,
    }));

    // Convert commits to refs format
    const commitRefs: GitRef[] = commits.map((c) => ({
      name: c.sha.slice(0, 7),
      type: 'commit' as const,
      sha: c.sha,
      message: c.message,
      date: c.date,
    }));

    // Add first commit as a special ref if available and not already in list
    if (firstCommit && !commits.find(c => c.sha === firstCommit.sha)) {
      commitRefs.push({
        name: firstCommit.sha.slice(0, 7),
        type: 'commit' as const,
        sha: firstCommit.sha,
        message: `[FIRST] ${firstCommit.message}`,
        date: firstCommit.date,
      });
    }

    res.json({
      releases: releaseRefs,
      tags,
      branches,
      commits: commitRefs,
    });
  } catch (err) {
    console.error('Failed to fetch refs:', err);
    res.status(500).json({ error: 'Failed to fetch repository refs' });
  }
});

export default router;
