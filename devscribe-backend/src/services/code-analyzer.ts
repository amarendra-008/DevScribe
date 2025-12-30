import type {
  CodeFile,
  CodeAnalysis,
  ExportInfo,
  RouteInfo,
  ComponentInfo,
} from '../types';

// Known dependency descriptions for better context
const DEPENDENCY_DESCRIPTIONS: Record<string, string> = {
  // Frameworks
  'react': 'UI library for building component-based interfaces',
  'next': 'React framework with SSR and file-based routing',
  'express': 'Minimal Node.js web framework for APIs',
  'fastify': 'Fast and low overhead Node.js web framework',
  'koa': 'Expressive HTTP middleware framework',
  'nestjs': 'Progressive Node.js framework with TypeScript',
  '@nestjs/core': 'Progressive Node.js framework with TypeScript',
  'vue': 'Progressive JavaScript framework for UIs',
  'angular': 'Platform for building web applications',
  '@angular/core': 'Platform for building web applications',
  'svelte': 'Compile-time JavaScript framework',

  // State management
  'redux': 'Predictable state container',
  '@reduxjs/toolkit': 'Redux toolkit for efficient state management',
  'zustand': 'Small, fast state management',
  'mobx': 'Simple, scalable state management',
  'recoil': 'State management library for React',
  'jotai': 'Primitive and flexible state management',

  // Data fetching
  'axios': 'Promise-based HTTP client',
  'swr': 'React hooks for data fetching',
  '@tanstack/react-query': 'Powerful data fetching and caching',
  'apollo-client': 'GraphQL client with caching',
  '@apollo/client': 'GraphQL client with caching',

  // Database
  'prisma': 'Next-generation ORM for Node.js and TypeScript',
  '@prisma/client': 'Next-generation ORM for Node.js and TypeScript',
  'mongoose': 'MongoDB object modeling for Node.js',
  'typeorm': 'ORM for TypeScript and JavaScript',
  'sequelize': 'Promise-based Node.js ORM',
  'drizzle-orm': 'TypeScript ORM with SQL-like syntax',
  'knex': 'SQL query builder for Node.js',

  // Auth
  'next-auth': 'Authentication for Next.js',
  'passport': 'Simple authentication middleware',
  'jsonwebtoken': 'JWT implementation for Node.js',
  '@supabase/supabase-js': 'Supabase client for auth and database',
  'firebase': 'Backend-as-a-service platform',
  '@clerk/clerk-sdk-node': 'User management and authentication',

  // Styling
  'tailwindcss': 'Utility-first CSS framework',
  'styled-components': 'CSS-in-JS styling library',
  '@emotion/react': 'CSS-in-JS library with React',
  'sass': 'CSS preprocessor with variables and nesting',
  'chakra-ui': 'Component library for React',
  '@chakra-ui/react': 'Component library for React',
  '@mui/material': 'Material Design component library',
  'antd': 'Ant Design React UI library',
  'radix-ui': 'Unstyled accessible components',
  '@radix-ui/react-dialog': 'Unstyled accessible components',

  // Testing
  'jest': 'JavaScript testing framework',
  'vitest': 'Fast Vite-native unit test framework',
  '@testing-library/react': 'React component testing utilities',
  'cypress': 'E2E testing framework',
  'playwright': 'E2E testing for modern web apps',

  // Build tools
  'vite': 'Next-generation frontend build tool',
  'webpack': 'Module bundler for JavaScript',
  'esbuild': 'Extremely fast JavaScript bundler',
  'turbo': 'High-performance build system',
  'tsup': 'Bundle TypeScript libraries with no config',

  // Utilities
  'lodash': 'Modern JavaScript utility library',
  'date-fns': 'Modern JavaScript date utility library',
  'dayjs': 'Fast 2kB alternative to Moment.js',
  'zod': 'TypeScript-first schema validation',
  'yup': 'Schema builder for runtime value parsing',
  'uuid': 'RFC4122 UUID generator',
  'nanoid': 'Tiny, URL-friendly unique ID generator',

  // API
  '@octokit/rest': 'GitHub REST API client',
  'openai': 'OpenAI API client library',
  'stripe': 'Payment processing API',
  'twilio': 'Cloud communications platform',
  'sendgrid': 'Email delivery service',
  '@aws-sdk/client-s3': 'AWS S3 SDK for cloud storage',
};

// Detect project architecture from dependencies and structure
function detectArchitecture(
  packageJson?: Record<string, unknown>,
  languages?: Record<string, number>,
  fileTree?: string[]
): string {
  const deps = {
    ...(packageJson?.dependencies as Record<string, string> || {}),
    ...(packageJson?.devDependencies as Record<string, string> || {}),
  };

  const depNames = Object.keys(deps);
  const hasFile = (pattern: RegExp) => fileTree?.some(f => pattern.test(f)) || false;

  // Next.js
  if (depNames.includes('next')) {
    return 'Next.js Application (React SSR/SSG Framework)';
  }

  // React SPA
  if (depNames.includes('react') && depNames.includes('vite')) {
    return 'React SPA with Vite';
  }
  if (depNames.includes('react') && depNames.includes('react-scripts')) {
    return 'React SPA (Create React App)';
  }

  // Vue
  if (depNames.includes('vue') || depNames.includes('nuxt')) {
    return depNames.includes('nuxt') ? 'Nuxt.js Application (Vue SSR)' : 'Vue.js Application';
  }

  // Angular
  if (depNames.includes('@angular/core')) {
    return 'Angular Application';
  }

  // Svelte
  if (depNames.includes('svelte') || depNames.includes('@sveltejs/kit')) {
    return depNames.includes('@sveltejs/kit') ? 'SvelteKit Application' : 'Svelte Application';
  }

  // Express/Node backend
  if (depNames.includes('express')) {
    return 'Express.js REST API';
  }
  if (depNames.includes('fastify')) {
    return 'Fastify REST API';
  }
  if (depNames.includes('@nestjs/core')) {
    return 'NestJS Application';
  }

  // Electron
  if (depNames.includes('electron')) {
    return 'Electron Desktop Application';
  }

  // React Native
  if (depNames.includes('react-native')) {
    return 'React Native Mobile Application';
  }

  // CLI tool
  if (depNames.includes('commander') || depNames.includes('yargs') || depNames.includes('inquirer')) {
    return 'Node.js CLI Tool';
  }

  // Library/package
  if (hasFile(/^(src\/)?index\.(ts|js)$/) && packageJson?.main) {
    return 'JavaScript/TypeScript Library';
  }

  // Python
  if (languages?.Python && (languages.Python > (languages.TypeScript || 0) + (languages.JavaScript || 0))) {
    if (hasFile(/requirements\.txt|Pipfile|pyproject\.toml/)) {
      if (hasFile(/manage\.py/)) return 'Django Application';
      if (hasFile(/app\.py/) || depNames.includes('flask')) return 'Flask Application';
      if (hasFile(/main\.py/) && hasFile(/api\//)) return 'FastAPI Application';
      return 'Python Application';
    }
  }

  // Go
  if (languages?.Go && languages.Go > 10000) {
    return 'Go Application';
  }

  // Rust
  if (languages?.Rust || hasFile(/Cargo\.toml/)) {
    return 'Rust Application';
  }

  // Fallback
  if (depNames.includes('react')) return 'React Application';
  if (languages?.TypeScript) return 'TypeScript Project';
  if (languages?.JavaScript) return 'JavaScript Project';

  return 'Software Project';
}

// Detect patterns from code content
function detectPatterns(sourceFiles: CodeFile[], packageJson?: Record<string, unknown>): string[] {
  const patterns: Set<string> = new Set();
  const allContent = sourceFiles.map(f => f.content).join('\n');
  const deps = Object.keys({
    ...(packageJson?.dependencies as Record<string, string> || {}),
    ...(packageJson?.devDependencies as Record<string, string> || {}),
  });

  // React patterns
  if (/useState|useEffect|useCallback|useMemo/.test(allContent)) {
    patterns.add('React Hooks');
  }
  if (/useContext|createContext/.test(allContent)) {
    patterns.add('React Context API');
  }
  if (deps.includes('redux') || deps.includes('@reduxjs/toolkit')) {
    patterns.add('Redux State Management');
  }
  if (deps.includes('zustand')) {
    patterns.add('Zustand State Management');
  }

  // API patterns
  if (/router\.(get|post|put|delete|patch)/.test(allContent)) {
    patterns.add('RESTful API Routes');
  }
  if (/graphql|gql`|@Query|@Mutation/.test(allContent)) {
    patterns.add('GraphQL API');
  }
  if (/@Controller|@Injectable|@Module/.test(allContent)) {
    patterns.add('Dependency Injection');
  }

  // Database patterns
  if (deps.includes('@prisma/client') || deps.includes('prisma')) {
    patterns.add('Prisma ORM');
  }
  if (deps.includes('mongoose')) {
    patterns.add('MongoDB with Mongoose');
  }
  if (deps.includes('typeorm')) {
    patterns.add('TypeORM');
  }

  // Auth patterns
  if (/jwt|jsonwebtoken|Bearer/.test(allContent)) {
    patterns.add('JWT Authentication');
  }
  if (deps.includes('@supabase/supabase-js')) {
    patterns.add('Supabase Auth');
  }
  if (deps.includes('next-auth')) {
    patterns.add('NextAuth.js');
  }

  // Testing patterns
  if (deps.includes('jest') || deps.includes('vitest')) {
    patterns.add('Unit Testing');
  }
  if (deps.includes('cypress') || deps.includes('playwright')) {
    patterns.add('E2E Testing');
  }

  // Build patterns
  if (deps.includes('typescript')) {
    patterns.add('TypeScript');
  }
  if (deps.includes('tailwindcss')) {
    patterns.add('Tailwind CSS');
  }

  return Array.from(patterns);
}

// Extract tech stack from dependencies
function extractTechStack(packageJson?: Record<string, unknown>): string[] {
  if (!packageJson) return [];

  const deps = {
    ...(packageJson.dependencies as Record<string, string> || {}),
    ...(packageJson.devDependencies as Record<string, string> || {}),
  };

  const stack: string[] = [];
  const depNames = Object.keys(deps);

  // Core frameworks
  if (depNames.includes('react')) stack.push('React');
  if (depNames.includes('next')) stack.push('Next.js');
  if (depNames.includes('vue')) stack.push('Vue.js');
  if (depNames.includes('express')) stack.push('Express.js');
  if (depNames.includes('@nestjs/core')) stack.push('NestJS');
  if (depNames.includes('typescript')) stack.push('TypeScript');

  // Databases
  if (depNames.includes('@prisma/client')) stack.push('Prisma');
  if (depNames.includes('mongoose')) stack.push('MongoDB');
  if (depNames.includes('@supabase/supabase-js')) stack.push('Supabase');

  // Styling
  if (depNames.includes('tailwindcss')) stack.push('Tailwind CSS');
  if (depNames.includes('styled-components')) stack.push('Styled Components');

  return stack;
}

// Extract exports from source files
function extractExports(sourceFiles: CodeFile[]): ExportInfo[] {
  const exports: ExportInfo[] = [];

  for (const file of sourceFiles) {
    const lines = file.content.split('\n');

    for (const line of lines) {
      // export function name
      const funcMatch = line.match(/export\s+(?:async\s+)?function\s+(\w+)/);
      if (funcMatch) {
        exports.push({
          name: funcMatch[1],
          type: 'function',
          file: file.path,
        });
        continue;
      }

      // export const name
      const constMatch = line.match(/export\s+const\s+(\w+)/);
      if (constMatch) {
        exports.push({
          name: constMatch[1],
          type: 'const',
          file: file.path,
        });
        continue;
      }

      // export class name
      const classMatch = line.match(/export\s+(?:default\s+)?class\s+(\w+)/);
      if (classMatch) {
        exports.push({
          name: classMatch[1],
          type: 'class',
          file: file.path,
        });
        continue;
      }

      // export interface/type name
      const typeMatch = line.match(/export\s+(interface|type)\s+(\w+)/);
      if (typeMatch) {
        exports.push({
          name: typeMatch[2],
          type: typeMatch[1] as 'interface' | 'type',
          file: file.path,
        });
        continue;
      }

      // export default function Component (React)
      const defaultFuncMatch = line.match(/export\s+default\s+function\s+(\w+)/);
      if (defaultFuncMatch) {
        exports.push({
          name: defaultFuncMatch[1],
          type: 'component',
          file: file.path,
        });
      }
    }
  }

  return exports.slice(0, 30); // Limit to top 30
}

// Detect routes from source files
function detectRoutes(sourceFiles: CodeFile[]): RouteInfo[] {
  const routes: RouteInfo[] = [];

  for (const file of sourceFiles) {
    const content = file.content;

    // Express-style routes: router.get('/path', handler)
    const expressRoutes = content.matchAll(/router\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/gi);
    for (const match of expressRoutes) {
      routes.push({
        method: match[1].toUpperCase(),
        path: match[2],
        handler: 'handler',
        file: file.path,
      });
    }

    // app.get('/path', ...) style
    const appRoutes = content.matchAll(/app\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/gi);
    for (const match of appRoutes) {
      routes.push({
        method: match[1].toUpperCase(),
        path: match[2],
        handler: 'handler',
        file: file.path,
      });
    }

    // Next.js API routes (from file path)
    if (file.path.includes('pages/api/') || file.path.includes('app/api/')) {
      const apiPath = file.path
        .replace(/^.*pages\/api/, '/api')
        .replace(/^.*app\/api/, '/api')
        .replace(/\.(ts|js|tsx|jsx)$/, '')
        .replace(/\/route$/, '')
        .replace(/\/index$/, '');

      // Check for HTTP methods
      const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].filter(m =>
        content.includes(`export async function ${m}`) ||
        content.includes(`export function ${m}`) ||
        content.includes(`export const ${m}`)
      );

      if (methods.length > 0) {
        methods.forEach(method => {
          routes.push({ method, path: apiPath, handler: method, file: file.path });
        });
      } else if (content.includes('export default')) {
        routes.push({ method: 'ALL', path: apiPath, handler: 'default', file: file.path });
      }
    }
  }

  return routes.slice(0, 20); // Limit to 20 routes
}

// Detect React/Vue components
function detectComponents(sourceFiles: CodeFile[]): ComponentInfo[] {
  const components: ComponentInfo[] = [];

  for (const file of sourceFiles) {
    const content = file.content;

    // Skip non-component files
    if (!file.path.match(/\.(tsx|jsx)$/)) continue;

    // Functional components
    const funcComponents = content.matchAll(/(?:export\s+)?(?:default\s+)?function\s+([A-Z]\w+)\s*\(/g);
    for (const match of funcComponents) {
      const name = match[1];
      const isPage = file.path.includes('/pages/') || file.path.includes('/app/');
      const isLayout = name.toLowerCase().includes('layout') || file.path.includes('layout');

      components.push({
        name,
        file: file.path,
        type: isLayout ? 'layout' : isPage ? 'page' : 'functional',
      });
    }

    // Arrow function components
    const arrowComponents = content.matchAll(/(?:export\s+)?const\s+([A-Z]\w+)\s*(?::\s*(?:React\.)?FC[^=]*)?\s*=\s*(?:\([^)]*\)|[^=])\s*=>/g);
    for (const match of arrowComponents) {
      const name = match[1];
      if (!components.some(c => c.name === name && c.file === file.path)) {
        components.push({
          name,
          file: file.path,
          type: 'functional',
        });
      }
    }
  }

  return components.slice(0, 20);
}

// Find entry points
function findEntryPoints(sourceFiles: CodeFile[], fileTree?: string[]): string[] {
  const entryPoints: string[] = [];

  const entryPatterns = [
    /^(src\/)?(index|main|app|server)\.(ts|js|tsx|jsx)$/,
    /^(src\/)?App\.(tsx|jsx)$/,
    /^pages\/_app\.(tsx|jsx)$/,
    /^app\/layout\.(tsx|jsx)$/,
  ];

  // From source files
  for (const file of sourceFiles) {
    if (entryPatterns.some(p => p.test(file.path))) {
      entryPoints.push(file.path);
    }
  }

  // From file tree
  if (fileTree) {
    for (const path of fileTree) {
      if (entryPatterns.some(p => p.test(path)) && !entryPoints.includes(path)) {
        entryPoints.push(path);
      }
    }
  }

  return entryPoints.slice(0, 5);
}

// Get enhanced dependency info
export function getEnhancedDependencies(packageJson?: Record<string, unknown>): Array<{ name: string; version: string; description: string }> {
  if (!packageJson) return [];

  const deps = packageJson.dependencies as Record<string, string> || {};
  const result: Array<{ name: string; version: string; description: string }> = [];

  for (const [name, version] of Object.entries(deps)) {
    const normalizedName = name.replace(/^@/, '').split('/')[0];
    const description = DEPENDENCY_DESCRIPTIONS[name] ||
      DEPENDENCY_DESCRIPTIONS[normalizedName] ||
      'External dependency';

    result.push({ name, version, description });
  }

  return result.slice(0, 20);
}

// Main analysis function
export function analyzeCodebase(
  sourceFiles: CodeFile[],
  packageJson?: Record<string, unknown>,
  languages?: Record<string, number>,
  fileTree?: string[]
): CodeAnalysis {
  return {
    architecture: detectArchitecture(packageJson, languages, fileTree),
    entryPoints: findEntryPoints(sourceFiles, fileTree),
    exports: extractExports(sourceFiles),
    routes: detectRoutes(sourceFiles),
    components: detectComponents(sourceFiles),
    patterns: detectPatterns(sourceFiles, packageJson),
    techStack: extractTechStack(packageJson),
  };
}
