import { Router, Request, Response } from 'express';
import { createGitHubClient } from '../lib/github';

const router = Router();

// Middleware to extract GitHub token from Authorization header
function getGitHubToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

interface SyncRequest {
  repo_full_name: string;
  file_path: string;
  content: string;
  commit_message?: string;
}

// POST /api/sync/push - Push content to a GitHub repository
router.post('/push', async (req: Request, res: Response) => {
  const token = getGitHubToken(req);
  const userId = req.headers['x-user-id'] as string;

  if (!token || !userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const body = req.body as SyncRequest;

  if (!body.repo_full_name || !body.file_path || !body.content) {
    res.status(400).json({ error: 'Missing required fields: repo_full_name, file_path, content' });
    return;
  }

  const [owner, repo] = body.repo_full_name.split('/');

  if (!owner || !repo) {
    res.status(400).json({ error: 'Invalid repo_full_name format. Expected: owner/repo' });
    return;
  }

  try {
    const octokit = createGitHubClient(token);

    // Try to get the existing file to get its SHA (needed for updates)
    let existingSha: string | undefined;
    try {
      const { data: existingFile } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: body.file_path,
      });

      if (!Array.isArray(existingFile) && existingFile.type === 'file') {
        existingSha = existingFile.sha;
      }
    } catch (err: any) {
      // File doesn't exist, that's fine - we'll create it
      if (err.status !== 404) {
        throw err;
      }
    }

    // Create or update the file
    const { data } = await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: body.file_path,
      message: body.commit_message || `Update ${body.file_path} via DevScribe`,
      content: Buffer.from(body.content).toString('base64'),
      sha: existingSha,
    });

    res.json({
      sha: data.content?.sha,
      url: data.content?.html_url,
    });
  } catch (err: any) {
    console.error('Failed to sync to GitHub:', err);

    if (err.status === 403) {
      res.status(403).json({ error: 'No write access to repository' });
      return;
    }

    if (err.status === 404) {
      res.status(404).json({ error: 'Repository not found' });
      return;
    }

    res.status(500).json({ error: 'Failed to sync to GitHub' });
  }
});

export default router;
