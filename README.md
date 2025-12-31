<div align="center">

# DevScribe

**AI-Powered Documentation Generator for GitHub Repositories**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://supabase.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)

[Features](#features) • [How It Works](#how-it-works) • [Tech Stack](#tech-stack) • [Architecture](#architecture) • [Getting Started](#getting-started)

---

**A full-stack application that connects to GitHub, analyzes your codebase, and generates professional documentation using AI—then pushes it directly to your repository.**

</div>

---

## Why I Built This

Documentation is often the last priority for developers. READMEs become outdated, changelogs are forgotten, and onboarding takes longer than it should.

I built DevScribe to:
- **Solve a real problem** I experienced maintaining my own projects
- **Build a complete product** with auth, database, API, and deployment
- **Work with modern technologies** including AI/LLM integration, OAuth, and cloud infrastructure
- **Learn full-stack development** by shipping something end-to-end

---

## Features

### Intelligent Code Analysis Engine
Built a custom code analysis system that understands your project without heavy AST parsing:
- **Framework Detection**: Identifies 18+ architectures (React, Next.js, Vue, Angular, Express, NestJS, Django, FastAPI, etc.)
- **Pattern Recognition**: Detects 15+ design patterns (React Hooks, Context API, Redux, REST routes, GraphQL, JWT auth, etc.)
- **Dependency Mapping**: Maps 50+ common packages to human-readable descriptions
- **Smart File Selection**: Categorizes files into 7 priority levels and selects diverse samples for analysis

### README Generation
- **3 Documentation Styles**: Minimal, Standard, Comprehensive
- **3 Writing Tones**: Professional, Friendly, Technical
- **8 Toggleable Sections**: Badges, Features, Installation, Usage, API, Contributing, License, Acknowledgments
- **Custom Instructions**: Add specific requirements for generation
- **Iterative Refinement**: Provide feedback and regenerate with improvements

### Changelog Generation
- Parses commit history between any two Git references (releases, tags, branches, commits)
- Matches commits to related pull requests
- Generates [Keep a Changelog](https://keepachangelog.com/) format
- Groups by type: Added, Changed, Fixed, Removed, Security

### GitHub Integration
- **OAuth Authentication**: Secure token handling via Supabase
- **Private Repository Support**: Full access with proper scopes
- **One-Click Sync**: Push generated docs directly to your repo
- **Smart File Operations**: Creates or updates files with proper SHA tracking

---

## How It Works

### README Generation (4-Phase Process)

```
Phase 1: Metadata Collection
├── Fetch repository file tree (up to 100 files)
├── Get language statistics
├── Read package.json for dependencies
└── Fetch existing README for context

Phase 2: Smart File Selection
├── Filter out node_modules, build dirs, media files
├── Categorize by priority (entry, config, types, routes, services, components)
├── Select diverse samples (max 20 files, 300 lines each)
└── Batch fetch to avoid rate limiting

Phase 3: Code Analysis
├── Detect project architecture
├── Identify design patterns
├── Extract routes, components, exports
└── Map tech stack with descriptions

Phase 4: AI Generation
├── Build context-aware prompt with actual source code
├── Apply user's style, tone, and section preferences
├── Generate with Claude via OpenRouter
└── Store document with rich metadata
```

### Changelog Generation

```
1. Fetch commits between two Git refs using GitHub Compare API
2. Find related PRs by matching merge commit SHAs
3. Build structured prompt with commits and PR metadata
4. Generate changelog in Keep a Changelog format
```

---

## Tech Stack

| Layer | Technology | Why I Chose It |
|-------|------------|----------------|
| **Frontend** | React 18, TypeScript, Vite | Industry standard, type safety, fast HMR |
| **Styling** | Tailwind CSS, Framer Motion | Utility-first CSS, smooth animations |
| **Backend** | Node.js, Express, TypeScript | Full-stack JavaScript, strong typing |
| **Database** | Supabase (PostgreSQL) | Managed Postgres + built-in auth + RLS |
| **Auth** | GitHub OAuth via Supabase | Secure flow, no password handling |
| **AI** | Claude via OpenRouter | Access to best-in-class LLMs |
| **GitHub API** | Octokit REST Client | Official SDK, comprehensive coverage |
| **DevOps** | Docker, Docker Compose | Consistent environments, easy deployment |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         React Frontend                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────────┐   │
│  │   Landing   │ │  Dashboard  │ │   README    │ │  Changelog   │   │
│  │    View     │ │    View     │ │  Generator  │ │  Generator   │   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └──────────────┘   │
│                                                                     │
│  Custom Hooks: useAuth, useClipboard    API Client: Type-safe fetch │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │ REST API (Bearer + User ID)
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Express Backend                              │
├─────────────────────────────────────────────────────────────────────┤
│  Routes                    Services                                 │
│  ├── /repos                ├── code-analyzer.ts (540 lines)        │
│  │   ├── GET /available    │   ├── Architecture detection          │
│  │   ├── GET /connected    │   ├── Pattern recognition             │
│  │   ├── POST /connect     │   ├── Export/route extraction         │
│  │   └── GET /:id/refs     │   └── Tech stack mapping              │
│  │                         │                                        │
│  ├── /readme               ├── prompt-builder.ts                    │
│  │   └── POST /generate    │   ├── Context-aware prompts           │
│  │                         │   └── Style/tone customization         │
│  ├── /changelog            │                                        │
│  │   └── POST /generate    ├── openrouter.ts                       │
│  │                         │   └── Claude API integration           │
│  ├── /documents            │                                        │
│  │   ├── GET /             ├── github.ts (490 lines)               │
│  │   └── DELETE /:id       │   ├── Repo/commit/PR operations       │
│  │                         │   ├── Smart file selection            │
│  └── /sync                 │   └── Pagination handling             │
│      └── POST /push        │                                        │
├─────────────────────────────────────────────────────────────────────┤
│  Middleware: requireAuth (token validation), asyncHandler          │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          ▼                       ▼                       ▼
   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
   │  Supabase   │         │   GitHub    │         │  OpenRouter │
   │  PostgreSQL │         │    API      │         │   (Claude)  │
   │             │         │             │         │             │
   │ • 3 tables  │         │ • OAuth     │         │ • Prompt    │
   │ • RLS       │         │ • Repos     │         │ • Generate  │
   │ • Triggers  │         │ • Commits   │         │             │
   └─────────────┘         └─────────────┘         └─────────────┘
```

---

## Database Schema

Designed with security and performance in mind:

```sql
-- Users (auto-created on GitHub signup via trigger)
user_profiles
├── id (UUID, FK → auth.users)
├── github_username
└── avatar_url

-- Repository connections (unique per user)
connected_repositories
├── id (UUID)
├── user_id (UUID, FK)
├── github_repo_id (INTEGER)
├── repo_name, repo_full_name, repo_url
├── default_branch, is_private
└── UNIQUE(user_id, github_repo_id)

-- Generated documents with rich metadata
generated_documents
├── id (UUID)
├── user_id, repository_id (FKs)
├── doc_type ENUM('readme', 'changelog')
├── title, content (TEXT)
├── metadata (JSONB) → languages, architecture, tech_stack, patterns
└── created_at, updated_at
```

**Security**: Row-Level Security (RLS) ensures users can only access their own data.

---

## Key Technical Implementations

### 1. Smart Code Analysis Without AST
Instead of complex AST parsing, I built a regex-based pattern detection system:

```typescript
// Detects 18+ framework architectures
function detectArchitecture(packageJson, languages, fileTree): string {
  // Next.js, React SPA, Vue, Angular, Svelte, Express, NestJS,
  // Django, Flask, FastAPI, Go, Rust, Electron, React Native...
}

// Identifies 15+ design patterns
function detectPatterns(sourceFiles, packageJson): string[] {
  // React Hooks, Context API, Redux, REST routes, GraphQL,
  // Prisma ORM, JWT Auth, Unit Testing, E2E Testing...
}
```

### 2. Intelligent File Selection
Prioritized sampling to get the most relevant code:

```typescript
const CATEGORY_LIMITS = {
  entry: 3,      // index.ts, main.ts, app.ts
  config: 3,     // vite.config, tsconfig
  types: 2,      // Type definitions
  routes: 4,     // API endpoints
  services: 4,   // Business logic
  components: 4, // UI components
  other: 2       // Everything else
};
// Max 20 files, 300 lines each, batched in groups of 5
```

### 3. Parallel Data Fetching
Efficient concurrent requests with proper error handling:

```typescript
const [tree, languages, packageJson, existingReadme] = await Promise.all([
  getRepoTree(owner, repo),
  getRepoLanguages(owner, repo),
  getFileContent(owner, repo, 'package.json').catch(() => null),
  getFileContent(owner, repo, 'README.md').catch(() => null)
]);
```

### 4. Feedback Loop for Iterative Improvement
Users can refine generated content:

```typescript
if (isRegenerate && feedback.trim() && previousContent) {
  options.customPrompt += `
    PREVIOUS README (needs improvements):
    ${previousContent.slice(0, 2000)}

    USER FEEDBACK:
    ${feedback}
  `;
}
```

### 5. GitHub Pagination Handling
Finding the first commit requires parsing Link headers:

```typescript
// Parse GitHub's pagination to find last page
const lastPageMatch = linkHeader.match(/page=(\d+)>; rel="last"/);
const lastPage = lastPageMatch ? parseInt(lastPageMatch[1]) : 1;
// Fetch last page to get first commit
```

---

## What I Learned

**Backend Development**
- Designing RESTful APIs with proper error handling and status codes
- Implementing OAuth 2.0 flows with secure token management
- Working with third-party APIs (GitHub REST, OpenRouter LLM)
- Structuring services for maintainability and testability

**Frontend Development**
- Building complex forms with controlled components and state management
- Custom hooks for reusable logic (`useAuth`, `useClipboard`)
- Responsive design with Tailwind CSS and mobile-first approach
- Markdown rendering with GitHub Flavored Markdown support

**Database Design**
- PostgreSQL schema design with proper foreign keys and indexes
- Row-Level Security for data isolation
- Automatic triggers for timestamps and user profile creation
- JSONB columns for flexible metadata storage

**AI/LLM Integration**
- Prompt engineering for consistent, high-quality outputs
- Providing code context for better generation accuracy
- Handling rate limits and API errors gracefully

**DevOps**
- Docker containerization for consistent environments
- Environment configuration across development and production
- CORS handling for frontend-backend communication

---

## Project Structure

```
DevScribe/
├── devscribe-frontend/              # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── readme/              # README generator with customization
│   │   │   ├── changelog/           # Changelog generator with ref selection
│   │   │   ├── repos/               # Repository connection management
│   │   │   ├── documents/           # Document library with filtering
│   │   │   └── layout/              # Sidebar navigation
│   │   ├── views/                   # Landing page, Dashboard shell
│   │   ├── lib/
│   │   │   ├── api.ts               # Type-safe API client
│   │   │   ├── useAuth.ts           # Authentication hook
│   │   │   └── useClipboard.ts      # Clipboard hook
│   │   └── types/                   # Shared TypeScript interfaces
│
├── devscribe-backend/               # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── routes/
│   │   │   ├── repositories.ts      # Repo CRUD + refs
│   │   │   ├── readme.ts            # README generation endpoint
│   │   │   ├── changelog.ts         # Changelog generation endpoint
│   │   │   ├── documents.ts         # Document management
│   │   │   └── sync.ts              # GitHub file push
│   │   ├── services/
│   │   │   ├── code-analyzer.ts     # 540-line analysis engine
│   │   │   ├── prompt-builder.ts    # AI prompt construction
│   │   │   └── openrouter.ts        # LLM integration
│   │   ├── lib/
│   │   │   ├── github.ts            # 490-line GitHub API wrapper
│   │   │   ├── supabase.ts          # Database client
│   │   │   └── middleware.ts        # Auth + error handling
│   │   └── types/                   # Backend type definitions
│
├── supabase/
│   └── migrations/                  # PostgreSQL schema + RLS policies
│
└── docker-compose.yml               # Container orchestration
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account (free tier works)
- OpenRouter API key
- GitHub OAuth app

### Installation

```bash
# Clone the repository
git clone https://github.com/amarendra-008/DevScribe.git
cd DevScribe

# Backend
cd devscribe-backend
npm install
cp .env.example .env    # Configure your keys
npm run dev

# Frontend (new terminal)
cd devscribe-frontend
npm install
cp .env.example .env    # Configure your keys
npm run dev

# Open http://localhost:5173
```

### Environment Variables

**Backend** (`devscribe-backend/.env`)
```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
OPENROUTER_API_KEY=sk-or-...
PORT=3000
```

**Frontend** (`devscribe-frontend/.env`)
```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
VITE_API_URL=http://localhost:3000
```

### Docker

```bash
cp .env.example .env
docker-compose up --build
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/repos/available` | List user's GitHub repositories |
| `GET` | `/api/repos/connected` | List connected repositories |
| `POST` | `/api/repos/connect` | Connect a repository |
| `DELETE` | `/api/repos/:id` | Disconnect a repository |
| `GET` | `/api/repos/:id/refs` | Get releases, tags, branches, commits |
| `POST` | `/api/readme/generate` | Generate README with options |
| `POST` | `/api/changelog/generate` | Generate changelog between refs |
| `GET` | `/api/documents` | List generated documents |
| `DELETE` | `/api/documents/:id` | Delete a document |
| `POST` | `/api/sync/push` | Push file to GitHub |

---

## Future Improvements

- [ ] GitLab and Bitbucket integration
- [ ] Webhook for automatic regeneration on push
- [ ] Template marketplace for custom README styles
- [ ] Monorepo documentation support
- [ ] Batch generation for multiple repos

---

## License

MIT License - feel free to use this as inspiration for your own projects!

---

<div align="center">

### Built by [Amarendra Mishra](https://github.com/amarendra-008)

[![GitHub](https://img.shields.io/badge/GitHub-amarendra--008-181717?style=flat-square&logo=github)](https://github.com/amarendra-008)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=flat-square&logo=linkedin)](https://linkedin.com/in/your-profile)

</div>
