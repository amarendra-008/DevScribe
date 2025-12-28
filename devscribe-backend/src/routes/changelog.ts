import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import {
  createGitHubClient,
  getCommitsBetweenRefs,
  getPullRequestsBetweenRefs,
} from '../lib/github';
import { callOpenRouter } from '../services/openrouter';
import {
  CHANGELOG_SYSTEM_PROMPT,
  buildChangelogPrompt,
} from '../services/prompt-builder';
import type { GenerateChangelogRequest } from '../types';

const router = Router();

// Extracts GitHub token from Authorization header
function getGitHubToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

// POST /api/changelog/generate - Generate changelog between two refs
router.post('/generate', async (req: Request, res: Response) => {
  const token = getGitHubToken(req);
  const userId = req.headers['x-user-id'] as string;

  if (!token || !userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const body = req.body as GenerateChangelogRequest;
  console.log('Changelog request:', body);

  if (!body.repository_id || !body.from_ref || !body.to_ref) {
    res.status(400).json({ error: 'Missing required fields', received: body });
    return;
  }

  try {
    // Get repository details
    const { data: repo, error: repoError } = await supabase
      .from('connected_repositories')
      .select('*')
      .eq('id', body.repository_id)
      .eq('user_id', userId)
      .single();

    if (repoError || !repo) {
      res.status(404).json({ error: 'Repository not found' });
      return;
    }

    const [owner, repoName] = repo.repo_full_name.split('/');
    const octokit = createGitHubClient(token);

    // Fetch commits and PRs between refs
    const [commits, pullRequests] = await Promise.all([
      getCommitsBetweenRefs(octokit, owner, repoName, body.from_ref, body.to_ref),
      getPullRequestsBetweenRefs(octokit, owner, repoName, body.from_ref, body.to_ref),
    ]);

    console.log(`Found ${commits.length} commits, ${pullRequests.length} PRs`);

    if (commits.length === 0) {
      res.status(400).json({
        error: 'No commits found between refs',
        from_ref: body.from_ref,
        to_ref: body.to_ref,
      });
      return;
    }

    // Build prompt and generate changelog
    const userPrompt = buildChangelogPrompt({
      repo_name: repo.repo_name,
      from_ref: body.from_ref,
      to_ref: body.to_ref,
      commits,
      pull_requests: pullRequests,
    });

    const content = await callOpenRouter(CHANGELOG_SYSTEM_PROMPT, userPrompt);

    // Save document
    const title = `${repo.repo_name} ${body.from_ref} → ${body.to_ref}`;
    const { data: doc, error: docError } = await supabase
      .from('generated_documents')
      .insert({
        user_id: userId,
        repository_id: body.repository_id,
        doc_type: 'changelog',
        title,
        content,
        metadata: {
          from_ref: body.from_ref,
          to_ref: body.to_ref,
          commits_count: commits.length,
          prs_count: pullRequests.length,
        },
      })
      .select()
      .single();

    if (docError) throw docError;

    res.json({ document: doc });
  } catch (err) {
    console.error('Failed to generate changelog:', err);
    res.status(500).json({ error: 'Failed to generate changelog' });
  }
});

// GET /api/changelog/preview - Preview commits and PRs between refs
router.get('/preview', async (req: Request, res: Response) => {
  const token = getGitHubToken(req);
  const userId = req.headers['x-user-id'] as string;

  if (!token || !userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const { repository_id, from_ref, to_ref } = req.query;

  if (!repository_id || !from_ref || !to_ref) {
    res.status(400).json({ error: 'Missing required query parameters' });
    return;
  }

  try {
    // Get repository details
    const { data: repo, error: repoError } = await supabase
      .from('connected_repositories')
      .select('*')
      .eq('id', repository_id)
      .eq('user_id', userId)
      .single();

    if (repoError || !repo) {
      res.status(404).json({ error: 'Repository not found' });
      return;
    }

    const [owner, repoName] = repo.repo_full_name.split('/');
    const octokit = createGitHubClient(token);

    const [commits, pullRequests] = await Promise.all([
      getCommitsBetweenRefs(octokit, owner, repoName, from_ref as string, to_ref as string),
      getPullRequestsBetweenRefs(octokit, owner, repoName, from_ref as string, to_ref as string),
    ]);

    res.json({
      commits,
      pull_requests: pullRequests,
    });
  } catch (err) {
    console.error('Failed to preview changes:', err);
    res.status(500).json({ error: 'Failed to preview changes' });
  }
});

export default router;
