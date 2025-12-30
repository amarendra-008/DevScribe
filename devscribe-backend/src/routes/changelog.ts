import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { createGitHubClient, getCommitsBetweenRefs, getPullRequestsBetweenRefs } from '../lib/github';
import { callClaude } from '../services/claude';
import { CHANGELOG_SYSTEM_PROMPT, buildChangelogPrompt } from '../services/prompt-builder';
import { requireAuth, asyncHandler } from '../lib/middleware';

const router = Router();
router.use(requireAuth);

router.post('/generate', asyncHandler(async (req, res) => {
  const { repository_id, from_ref, to_ref } = req.body;

  if (!repository_id || !from_ref || !to_ref) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const { data: repo, error: repoError } = await supabase
    .from('connected_repositories')
    .select('*')
    .eq('id', repository_id)
    .eq('user_id', req.userId)
    .single();

  if (repoError || !repo) {
    res.status(404).json({ error: 'Repository not found' });
    return;
  }

  const [owner, repoName] = repo.repo_full_name.split('/');
  const octokit = createGitHubClient(req.token);

  const [commits, pullRequests] = await Promise.all([
    getCommitsBetweenRefs(octokit, owner, repoName, from_ref, to_ref),
    getPullRequestsBetweenRefs(octokit, owner, repoName, from_ref, to_ref),
  ]);

  if (commits.length === 0) {
    res.status(400).json({ error: 'No commits found between refs' });
    return;
  }

  const content = await callClaude(
    CHANGELOG_SYSTEM_PROMPT,
    buildChangelogPrompt({ repo_name: repo.repo_name, from_ref, to_ref, commits, pull_requests: pullRequests })
  );

  const { data: doc, error: docError } = await supabase
    .from('generated_documents')
    .insert({
      user_id: req.userId,
      repository_id,
      doc_type: 'changelog',
      title: `${repo.repo_name} ${from_ref} → ${to_ref}`,
      content,
      metadata: { from_ref, to_ref, commits_count: commits.length, prs_count: pullRequests.length },
    })
    .select()
    .single();

  if (docError) throw docError;
  res.json({ document: doc });
}));

export default router;