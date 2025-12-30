import { Router } from 'express';
import { createGitHubClient } from '../lib/github';
import { requireAuth, asyncHandler } from '../lib/middleware';

const router = Router();
router.use(requireAuth);

router.post('/push', asyncHandler(async (req, res) => {
  const { repo_full_name, file_path, content, commit_message } = req.body;

  if (!repo_full_name || !file_path || !content) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const [owner, repo] = repo_full_name.split('/');
  const octokit = createGitHubClient(req.token);

  let existingSha: string | undefined;
  try {
    const { data } = await octokit.rest.repos.getContent({ owner, repo, path: file_path });
    if (!Array.isArray(data) && data.type === 'file') existingSha = data.sha;
  } catch (err: any) {
    if (err.status !== 404) throw err;
  }

  const { data } = await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: file_path,
    message: commit_message || `Update ${file_path} via DevScribe`,
    content: Buffer.from(content).toString('base64'),
    sha: existingSha,
  });

  res.json({ sha: data.content?.sha, url: data.content?.html_url });
}));

export default router;