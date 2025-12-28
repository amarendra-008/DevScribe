import type { ChangelogInput, ReadmeInput } from '../types';

// System prompt for changelog generation
export const CHANGELOG_SYSTEM_PROMPT = `You are DevScribe, an expert technical writer specializing in software release documentation. You analyze commits and pull requests to generate clear, user-focused changelogs following the Keep a Changelog specification.

Your changelogs are:
- Clear and readable by non-technical users
- Organized into standard sections
- Focused on user-facing changes
- Concise but informative`;

// README customization options interface
export interface ReadmeOptions {
  style?: 'minimal' | 'standard' | 'comprehensive';
  tone?: 'professional' | 'friendly' | 'technical';
  sections?: {
    badges?: boolean;
    features?: boolean;
    installation?: boolean;
    usage?: boolean;
    api?: boolean;
    contributing?: boolean;
    license?: boolean;
    acknowledgments?: boolean;
  };
  customPrompt?: string;
}

// Build system prompt based on options
export function buildReadmeSystemPrompt(options?: ReadmeOptions): string {
  const tone = options?.tone || 'professional';
  const style = options?.style || 'standard';

  const toneDescriptions = {
    professional: 'formal, business-appropriate language with clear technical accuracy',
    friendly: 'casual, approachable, and welcoming language that encourages contributors',
    technical: 'precise, developer-focused content with detailed technical specifications',
  };

  const styleDescriptions = {
    minimal: 'Keep it concise and to the point. Only essential information.',
    standard: 'Balance between brevity and detail. Cover key aspects thoroughly.',
    comprehensive: 'Provide extensive documentation with detailed examples and explanations.',
  };

  return `You are DevScribe, an expert technical writer who creates ${style} README documentation.

WRITING STYLE: ${styleDescriptions[style]}
TONE: Use ${toneDescriptions[tone]}.

Your READMEs are:
- Well-structured with clear hierarchy
- Accurate to the project's tech stack
- Include practical, working examples
- Easy to follow for developers of all levels`;
}

// Builds the user prompt for changelog generation
export function buildChangelogPrompt(input: ChangelogInput): string {
  const commitList = input.commits
    .slice(0, 100)
    .map((c) => {
      const firstLine = c.message.split('\n')[0];
      return `- ${firstLine} (${c.sha.slice(0, 7)})`;
    })
    .join('\n');

  const prList = input.pull_requests
    .map((pr) => {
      const labels = pr.labels.length > 0 ? ` [${pr.labels.join(', ')}]` : '';
      return `- #${pr.number}: ${pr.title}${labels} by @${pr.author}`;
    })
    .join('\n');

  return `Generate a changelog for ${input.repo_name} from ${input.from_ref} to ${input.to_ref}.

COMMITS (${input.commits.length} total):
${commitList || 'No commits found'}

PULL REQUESTS (${input.pull_requests.length} total):
${prList || 'No pull requests found'}

Generate a changelog with these sections (include only sections with relevant changes):
- Added: New features
- Changed: Changes in existing functionality
- Fixed: Bug fixes
- Removed: Removed features
- Security: Security fixes

Rules:
- Group related changes together
- Write clear, user-facing descriptions
- Reference PR numbers when available
- Skip merge commits and trivial changes
- Use present tense
- Do not include section headers for empty sections

Output only the changelog content in Markdown format, starting with the version header.`;
}

// Builds the user prompt for README generation
export function buildReadmePrompt(input: ReadmeInput, options?: ReadmeOptions): string {
  const structure = input.file_structure.slice(0, 80).join('\n');

  const languages = Object.entries(input.languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([lang, bytes]) => `- ${lang}: ${Math.round(bytes / 1024)}KB`)
    .join('\n');

  let prompt = `Generate a README for the repository "${input.repo_name}".

DESCRIPTION:
${input.description || 'No description provided'}

FILE STRUCTURE:
${structure}

LANGUAGES:
${languages || 'Unknown'}`;

  if (input.package_json) {
    const pkg = input.package_json as Record<string, unknown>;
    const deps = Object.keys((pkg.dependencies as Record<string, string>) || {}).slice(0, 15);
    const devDeps = Object.keys((pkg.devDependencies as Record<string, string>) || {}).slice(0, 10);

    prompt += `

PACKAGE.JSON:
- Name: ${pkg.name || 'Unknown'}
- Version: ${pkg.version || 'Unknown'}
- Dependencies: ${deps.join(', ') || 'None'}
- Dev Dependencies: ${devDeps.join(', ') || 'None'}
- Scripts: ${Object.keys((pkg.scripts as Record<string, string>) || {}).join(', ') || 'None'}`;
  }

  if (input.existing_readme) {
    prompt += `

EXISTING README (for reference):
${input.existing_readme.slice(0, 1500)}`;
  }

  // Build sections list based on options
  const sections = options?.sections || {
    badges: true,
    features: true,
    installation: true,
    usage: true,
    api: false,
    contributing: true,
    license: true,
    acknowledgments: false,
  };

  const sectionsList: string[] = [];
  sectionsList.push('Project title with brief tagline');
  sectionsList.push('Description');
  if (sections.badges) sectionsList.push('Badges (build status, version, license)');
  if (sections.features) sectionsList.push('Features (inferred from structure and dependencies)');
  if (sections.installation) sectionsList.push('Installation with step-by-step instructions');
  if (sections.usage) sectionsList.push('Usage with code examples');
  if (sections.api) sectionsList.push('API Documentation');
  if (sections.contributing) sectionsList.push('Contributing guidelines');
  if (sections.license) sectionsList.push('License');
  if (sections.acknowledgments) sectionsList.push('Acknowledgments');

  const numberedSections = sectionsList.map((s, i) => `${i + 1}. ${s}`).join('\n');

  // Add custom instructions if provided
  if (options?.customPrompt && options.customPrompt.trim()) {
    prompt += `

USER'S ADDITIONAL INSTRUCTIONS:
${options.customPrompt.trim()}

Please incorporate these instructions into the README generation.`;
  }

  prompt += `

Generate a README with these sections:
${numberedSections}

Rules:
- Use proper Markdown formatting
- Include appropriate code blocks with syntax highlighting
- Be specific to this project's detected tech stack
- Only include sections listed above
- Make sure all code examples are complete and runnable
- Follow any additional instructions provided by the user above

Output only the README content in Markdown format.`;

  return prompt;
}
