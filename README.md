# DevScribe

A web app that uses AI to generate README files and changelogs for your GitHub repositories.

## What it does

- Generates README files by analyzing your code
- Creates changelogs by comparing commits
- Pushes generated docs directly to GitHub
- Lets you customize the style and tone

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS
- Backend: Node.js, Express, TypeScript
- Database: Supabase (PostgreSQL)
- AI: OpenRouter API (Llama 3 70B)
- Auth: GitHub OAuth via Supabase

## AI Provider

DevScribe uses **OpenRouter API** with Llama 3 70B model for AI-powered documentation generation.

**Why OpenRouter?**
- Cost-effective for side projects
- Access to multiple models
- No minimum spend requirements

We initially integrated Claude API (Anthropic) for potentially higher quality outputs, but reverted to OpenRouter due to:
- Claude API requires separate billing from Claude Pro subscription
- No free tier for API usage
- OpenRouter provides good quality at lower cost for this use case

## Setup

### You'll need

- Node.js 18+
- Supabase account
- OpenRouter API key
- GitHub OAuth app

### Backend

```bash
cd devscribe-backend
npm install
```

Create `.env` file:
```
SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key
OPENROUTER_API_KEY=your_key
PORT=3000
```

Start it:
```bash
npm run dev
```

### Frontend

```bash
cd devscribe-frontend
npm install
```

Create `.env` file:
```
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
VITE_API_URL=http://localhost:3000
```

Start it:
```bash
npm run dev
```

### Database

1. Go to Supabase dashboard
2. Enable GitHub provider in Auth settings
3. Run the SQL from `supabase/migrations/001_initial_schema.sql`
4. Add `http://localhost:5173/app` to redirect URLs

## How to use

1. Open `http://localhost:5173`
2. Login with GitHub
3. Connect a repo
4. Go to README or Changelog
5. Generate and push to GitHub

## Folder structure

```
DevScribe/
├── devscribe-frontend/    # React app
├── devscribe-backend/     # Express API
├── supabase/              # Database migrations
└── docker-compose.yml     # Docker setup
```

## Docker

```bash
cp .env.example .env
# add your keys
docker-compose up --build
```

## Author

Amarendra Mishra
