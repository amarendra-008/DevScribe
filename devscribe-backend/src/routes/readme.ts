import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import {
  createGitHubClient,
  getRepoTree,
  getFileContent,
  getRepoLanguages,
} from '../lib/github';
import { callOpenRouter } from '../services/openrouter';
import {
  buildReadmeSystemPrompt,
  buildReadmePrompt,
  type ReadmeOptions,
} from '../services/prompt-builder';
import type { GenerateReadmeRequest } from '../types';

const router = Router();

// Extracts GitHub token from Authorization header
function getGitHubToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

// POST /api/readme/generate - Generate README from repository analysis
router.post('/generate', async (req: Request, res: Response) => {
  const token = getGitHubToken(req);
  const userId = req.headers['x-user-id'] as string;

  if (!token || !userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const body = req.body as GenerateReadmeRequest & { options?: ReadmeOptions };
  if (!body.repository_id) {
    res.status(400).json({ error: 'Repository ID required' });
    return;
  }

  const options: ReadmeOptions = body.options || {};

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

    // Fetch repository data in parallel
    const [fileStructure, languages, packageJson, existingReadme] = await Promise.all([
      getRepoTree(octokit, owner, repoName, repo.default_branch),
      getRepoLanguages(octokit, owner, repoName),
      getFileContent(octokit, owner, repoName, 'package.json'),
      getFileContent(octokit, owner, repoName, 'README.md'),
    ]);

    // Parse package.json if it exists
    let parsedPackageJson: Record<string, unknown> | undefined;
    if (packageJson) {
      try {
        parsedPackageJson = JSON.parse(packageJson);
      } catch {
        // Ignore parse errors
      }
    }

    // Build prompts with options
    const systemPrompt = buildReadmeSystemPrompt(options);
    const userPrompt = buildReadmePrompt({
      repo_name: repo.repo_name,
      description: null,
      file_structure: fileStructure,
      languages,
      package_json: parsedPackageJson,
      existing_readme: existingReadme || undefined,
    }, options);

    const content = await callOpenRouter(systemPrompt, userPrompt);

    // Save document
    const { data: doc, error: docError } = await supabase
      .from('generated_documents')
      .insert({
        user_id: userId,
        repository_id: body.repository_id,
        doc_type: 'readme',
        title: `${repo.repo_name} README`,
        content,
        metadata: {
          languages: Object.keys(languages),
          file_count: fileStructure.length,
          options: {
            style: options.style || 'standard',
            tone: options.tone || 'professional',
          },
        },
      })
      .select()
      .single();

    if (docError) throw docError;

    res.json({ document: doc });
  } catch (err) {
    console.error('Failed to generate README:', err);
    res.status(500).json({ error: 'Failed to generate README' });
  }
});

// POST /api/readme/analyze - Analyze repository structure
router.post('/analyze', async (req: Request, res: Response) => {
  const token = getGitHubToken(req);
  const userId = req.headers['x-user-id'] as string;

  if (!token || !userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const body = req.body as GenerateReadmeRequest;
  if (!body.repository_id) {
    res.status(400).json({ error: 'Repository ID required' });
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

    // Fetch repository data
    const [fileStructure, languages] = await Promise.all([
      getRepoTree(octokit, owner, repoName, repo.default_branch),
      getRepoLanguages(octokit, owner, repoName),
    ]);

    res.json({
      file_structure: fileStructure.slice(0, 100),
      languages,
      file_count: fileStructure.length,
    });
  } catch (err) {
    console.error('Failed to analyze repository:', err);
    res.status(500).json({ error: 'Failed to analyze repository' });
  }
});

export default router;
