import { Router } from 'express';
import { supabase } from '../lib/supabase';
import {
  createGitHubClient, getUserRepos, getRepoReleases,
  getRepoTags, getRepoBranches, getRecentCommits, getFirstCommit,
} from '../lib/github';
import { requireAuth, asyncHandler } from '../lib/middleware';
import type { GitRef } from '../types';

const router = Router();
router.use(requireAuth);

router.get('/available', asyncHandler(async (req, res) => {
  const octokit = createGitHubClient(req.token);
  const repos = await getUserRepos(octokit);
  res.json({ repos });
}));

router.get('/connected', asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('connected_repositories')
    .select('*')
    .eq('user_id', req.userId)
    .order('connected_at', { ascending: false });

  if (error) throw error;
  res.json({ repositories: data });
}));

router.post('/connect', asyncHandler(async (req, res) => {
  const { github_repo_id, repo_name, repo_full_name, repo_url, default_branch, is_private } = req.body;

  if (!github_repo_id || !repo_name || !repo_full_name) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const { data, error } = await supabase
    .from('connected_repositories')
    .insert({
      user_id: req.userId,
      github_repo_id,
      repo_name,
      repo_full_name,
      repo_url,
      default_branch: default_branch || 'main',
      is_private: is_private || false,
    })
    .select()
    .single();

  if (error?.code === '23505') {
    res.status(409).json({ error: 'Repository already connected' });
    return;
  }
  if (error) throw error;
  res.status(201).json({ repository: data });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const { error } = await supabase
    .from('connected_repositories')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.userId);

  if (error) throw error;
  res.status(204).send();
}));

router.get('/:id/refs', asyncHandler(async (req, res) => {
  const { data: repo, error } = await supabase
    .from('connected_repositories')
    .select('*')
    .eq('id', req.params.id)
    .eq('user_id', req.userId)
    .single();

  if (error || !repo) {
    res.status(404).json({ error: 'Repository not found' });
    return;
  }

  const [owner, repoName] = repo.repo_full_name.split('/');
  const octokit = createGitHubClient(req.token);

  const [releases, tags, branches, commits, firstCommit] = await Promise.all([
    getRepoReleases(octokit, owner, repoName).catch(() => []),
    getRepoTags(octokit, owner, repoName).catch(() => []),
    getRepoBranches(octokit, owner, repoName).catch(() => []),
    getRecentCommits(octokit, owner, repoName, 15).catch(() => []),
    getFirstCommit(octokit, owner, repoName).catch(() => null),
  ]);

  const releaseRefs: GitRef[] = releases.map(r => ({
    name: r.tag_name, type: 'release', sha: '', date: r.published_at,
  }));

  const commitRefs: GitRef[] = commits.map(c => ({
    name: c.sha.slice(0, 7), type: 'commit', sha: c.sha, message: c.message, date: c.date,
  }));

  if (firstCommit && !commits.find(c => c.sha === firstCommit.sha)) {
    commitRefs.push({
      name: firstCommit.sha.slice(0, 7), type: 'commit', sha: firstCommit.sha,
      message: `[FIRST] ${firstCommit.message}`, date: firstCommit.date,
    });
  }

  res.json({ releases: releaseRefs, tags, branches, commits: commitRefs });
}));

export default router;