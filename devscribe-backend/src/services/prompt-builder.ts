import type { ChangelogInput, ReadmeInput, ReadmeOptions } from '../types';
import { getEnhancedDependencies } from './code-analyzer';

const STYLE_DESCRIPTIONS = {
  minimal: 'Keep it concise. Only essential information.',
  standard: 'Balance between brevity and detail. Cover key aspects.',
  comprehensive: 'Provide extensive documentation with detailed examples.',
};

const TONE_DESCRIPTIONS = {
  professional: 'formal, business-appropriate language',
  friendly: 'casual, approachable, welcoming language',
  technical: 'precise, developer-focused content',
};

export const CHANGELOG_SYSTEM_PROMPT = `You are DevScribe, an expert technical writer. Generate clear, user-focused changelogs following Keep a Changelog format.`;

export function buildReadmeSystemPrompt(options?: ReadmeOptions): string {
  const style = options?.style || 'standard';
  const tone = options?.tone || 'professional';

  return `You are DevScribe, an expert technical documentation writer that creates comprehensive, accurate README files by analyzing actual source code.

STYLE: ${STYLE_DESCRIPTIONS[style]}
TONE: Use ${TONE_DESCRIPTIONS[tone]}.

YOUR APPROACH:
1. Analyze the provided source code to understand what the project actually does
2. Identify key features from the code, not assumptions
3. Generate accurate installation and usage instructions based on the actual codebase
4. Provide code examples that reflect the real API and patterns used
5. Be specific about the technology stack and architecture

QUALITY STANDARDS:
- Every claim must be backed by the source code provided
- Code examples should be realistic and work with the actual codebase
- Installation steps should match the project's actual setup requirements
- API documentation should reflect actual exports and routes found in the code`;
}

export function buildChangelogPrompt(input: ChangelogInput): string {
  const commits = input.commits
    .slice(0, 100)
    .map(c => `- ${c.message.split('\n')[0]} (${c.sha.slice(0, 7)})`)
    .join('\n');

  const prs = input.pull_requests
    .map(pr => `- #${pr.number}: ${pr.title}${pr.labels.length ? ` [${pr.labels.join(', ')}]` : ''} by @${pr.author}`)
    .join('\n');

  return `Generate a changelog for ${input.repo_name} from ${input.from_ref} to ${input.to_ref}.

COMMITS (${input.commits.length}):
${commits || 'None'}

PULL REQUESTS (${input.pull_requests.length}):
${prs || 'None'}

Include sections: Added, Changed, Fixed, Removed, Security (only if relevant).
Rules: Group related changes, write clear descriptions, reference PR numbers, skip trivial changes, use present tense.
Output only Markdown, starting with version header.`;
}

export function buildReadmePrompt(input: ReadmeInput, options?: ReadmeOptions): string {
  const structure = input.file_structure.slice(0, 100).join('\n');
  const languages = Object.entries(input.languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([lang, bytes]) => `- ${lang}: ${Math.round(bytes / 1024)}KB`)
    .join('\n');

  // Build comprehensive prompt with code analysis
  let prompt = `Generate a comprehensive README for "${input.repo_name}".`;

  // Add code analysis if available
  if (input.code_analysis) {
    const analysis = input.code_analysis;

    prompt += `

## PROJECT ANALYSIS (from source code inspection)

ARCHITECTURE: ${analysis.architecture}

TECH STACK: ${analysis.techStack.join(', ') || 'JavaScript/TypeScript'}

ENTRY POINTS:
${analysis.entryPoints.map(e => `- ${e}`).join('\n') || '- Not detected'}

DETECTED PATTERNS:
${analysis.patterns.map(p => `- ${p}`).join('\n') || '- Standard patterns'}`;

    // Add routes if any
    if (analysis.routes.length > 0) {
      prompt += `

API ROUTES (detected from code):
${analysis.routes.map(r => `- ${r.method} ${r.path} (${r.file})`).join('\n')}`;
    }

    // Add components if any
    if (analysis.components.length > 0) {
      prompt += `

COMPONENTS (detected from code):
${analysis.components.map(c => `- ${c.name} [${c.type}] (${c.file})`).join('\n')}`;
    }

    // Add key exports
    if (analysis.exports.length > 0) {
      prompt += `

KEY EXPORTS:
${analysis.exports.slice(0, 15).map(e => `- ${e.type} ${e.name} from ${e.file}`).join('\n')}`;
    }
  }

  // Add source code samples
  if (input.source_files && input.source_files.length > 0) {
    prompt += `

## SOURCE CODE SAMPLES (for accurate documentation)
`;
    for (const file of input.source_files.slice(0, 10)) {
      prompt += `
### ${file.path} (${file.lineCount} lines)
\`\`\`${file.language}
${file.content.slice(0, 2000)}${file.content.length > 2000 ? '\n// ... (truncated)' : ''}
\`\`\`
`;
    }
  }

  prompt += `

## ADDITIONAL CONTEXT

DESCRIPTION: ${input.description || 'No description provided'}

FILE STRUCTURE (${input.file_structure.length} files):
${structure}

LANGUAGES:
${languages || 'Unknown'}`;

  // Enhanced dependency info
  if (input.package_json) {
    const pkg = input.package_json as Record<string, unknown>;
    const enhancedDeps = getEnhancedDependencies(input.package_json);
    const scripts = Object.entries((pkg.scripts as Record<string, string>) || {});

    prompt += `

PACKAGE INFO:
- Name: ${pkg.name || 'Unknown'}
- Version: ${pkg.version || '0.0.0'}
- Description: ${pkg.description || 'No description'}

DEPENDENCIES (with purposes):
${enhancedDeps.map(d => `- ${d.name}@${d.version}: ${d.description}`).join('\n') || 'None'}

AVAILABLE SCRIPTS:
${scripts.map(([name, cmd]) => `- npm run ${name}: ${cmd}`).join('\n') || 'None'}`;
  }

  if (input.existing_readme) {
    prompt += `

EXISTING README (for context, improve upon this):
${input.existing_readme.slice(0, 2000)}`;
  }

  // Section configuration
  const sections = options?.sections || {
    badges: true, features: true, installation: true, usage: true,
    api: false, contributing: true, license: true, acknowledgments: false,
  };

  const sectionsList = ['Title with compelling tagline', 'Clear description of what the project does'];
  if (sections.badges) sectionsList.push('Relevant badges (build status, version, license)');
  if (sections.features) sectionsList.push('Key features (derived from actual code functionality)');
  if (sections.installation) sectionsList.push('Installation steps (based on actual package.json scripts)');
  if (sections.usage) sectionsList.push('Usage examples (with real code from the codebase)');
  if (sections.api) sectionsList.push('API Documentation (based on detected routes/exports)');
  if (sections.contributing) sectionsList.push('Contributing guidelines');
  if (sections.license) sectionsList.push('License');
  if (sections.acknowledgments) sectionsList.push('Acknowledgments');

  if (options?.customPrompt?.trim()) {
    prompt += `

USER INSTRUCTIONS (follow these specifically):
${options.customPrompt.trim()}`;
  }

  prompt += `

## OUTPUT REQUIREMENTS

Include these sections: ${sectionsList.join(', ')}

IMPORTANT:
1. Base all features and functionality on the actual source code provided above
2. Use real code patterns from the source files for examples
3. Reference actual exports, routes, and components by name
4. Installation steps must match the actual package.json scripts
5. Be specific about the tech stack - mention actual libraries used
6. Don't make up features that aren't in the code

Output only the README content in Markdown format.`;

  return prompt;
}
