import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { createGitHubClient, getRepoTree, getFileContent, getRepoLanguages, getKeySourceFiles } from '../lib/github';
import { callClaude } from '../services/claude';
import { buildReadmeSystemPrompt, buildReadmePrompt } from '../services/prompt-builder';
import { analyzeCodebase } from '../services/code-analyzer';
import { requireAuth, asyncHandler } from '../lib/middleware';
import type { ReadmeOptions } from '../types';

const router = Router();
router.use(requireAuth);

router.post('/generate', asyncHandler(async (req, res) => {
  const { repository_id, options = {} } = req.body as { repository_id: string; options?: ReadmeOptions };

  if (!repository_id) {
    res.status(400).json({ error: 'Repository ID required' });
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

  // Phase 1: Get basic repo structure and metadata
  const [fileStructure, languages, packageJson, existingReadme] = await Promise.all([
    getRepoTree(octokit, owner, repoName, repo.default_branch),
    getRepoLanguages(octokit, owner, repoName),
    getFileContent(octokit, owner, repoName, 'package.json'),
    getFileContent(octokit, owner, repoName, 'README.md'),
  ]);

  let parsedPackageJson: Record<string, unknown> | undefined;
  if (packageJson) {
    try { parsedPackageJson = JSON.parse(packageJson); } catch {}
  }

  // Phase 2: Deep code analysis - read key source files
  console.log(`[README] Fetching key source files for ${repo.repo_full_name}...`);
  const sourceFiles = await getKeySourceFiles(octokit, owner, repoName, fileStructure);
  console.log(`[README] Fetched ${sourceFiles.length} source files for analysis`);

  // Phase 3: Analyze the codebase
  const codeAnalysis = analyzeCodebase(sourceFiles, parsedPackageJson, languages, fileStructure);
  console.log(`[README] Code analysis complete:`, {
    architecture: codeAnalysis.architecture,
    patterns: codeAnalysis.patterns.length,
    routes: codeAnalysis.routes.length,
    components: codeAnalysis.components.length,
    exports: codeAnalysis.exports.length,
  });

  // Phase 4: Generate README with comprehensive context
  const content = await callClaude(
    buildReadmeSystemPrompt(options),
    buildReadmePrompt({
      repo_name: repo.repo_name,
      description: repo.description || null,
      file_structure: fileStructure,
      languages,
      package_json: parsedPackageJson,
      existing_readme: existingReadme || undefined,
      source_files: sourceFiles,
      code_analysis: codeAnalysis,
    }, options)
  );

  const { data: doc, error: docError } = await supabase
    .from('generated_documents')
    .insert({
      user_id: req.userId,
      repository_id,
      doc_type: 'readme',
      title: `${repo.repo_name} README`,
      content,
      metadata: {
        languages: Object.keys(languages),
        file_count: fileStructure.length,
        source_files_analyzed: sourceFiles.length,
        architecture: codeAnalysis.architecture,
        tech_stack: codeAnalysis.techStack,
        patterns: codeAnalysis.patterns,
      },
    })
    .select()
    .single();

  if (docError) throw docError;
  res.json({ document: doc });
}));

export default router;
