# Forsy Economy

Tracking the emerging agent economy across countries. Built from public web signals, nowcast estimates, and source-weighted calculations.

## Features

- Interactive world map showing Agent GDP by country
- Comprehensive country table with metrics
- Real-time summary statistics
- Daily automated research updates via Vercel Cron
- OpenAI-powered web research for gathering public signals

## Tech Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- Supabase Postgres
- Vercel Functions
- Vercel Cron
- OpenAI Responses API with web search

## Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and keys from Project Settings > API

### 2. Run SQL Migration

The migration has been applied via the Supabase MCP. If you need to run it manually, execute the SQL in `supabase/migrations/init.sql` in your Supabase SQL editor.

### 3. Set Environment Variables

Create a `.env.local` file with the following variables:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o
CRON_SECRET=your_random_secret
RUN_RESEARCH_CRON=false
\`\`\`

### 4. Run Seed Script

Seed the database with all countries and demo metrics:

\`\`\`bash
npx tsx scripts/seed.ts
\`\`\`

### 5. Start Local Dev Server

\`\`\`bash
pnpm dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to see the app.

### 6. Deploy to Vercel

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add the environment variables in Vercel project settings
4. Deploy

### 7. Add Custom Domain

1. Go to Vercel project settings > Domains
2. Add \`economy.forsy.ai\`
3. Configure DNS records as instructed

### 8. Enable Research Cron

Only enable after testing in production:

1. Set \`RUN_RESEARCH_CRON=true\` in Vercel environment variables
2. The cron will run daily at 5:00 AM UTC
3. It processes 5 countries per run

### 9. Embed in Webflow

Add an iframe to your Webflow site:

\`\`\`html
<iframe
  src="https://economy.forsy.ai"
  style="width: 100%; min-height: 800px; border: none;"
  title="Forsy Economy"
></iframe>
\`\`\`

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| GET /api/economy/countries | All countries with latest metrics |
| GET /api/economy/summary | Global aggregate statistics |
| GET /api/health | Health check |
| GET /api/cron/update-economy | Protected cron endpoint |

## Metrics

### Agent GDP

Estimated monthly economic value created by agent work:

\`\`\`
Agent GDP = Agent-Assisted Work Value
          + Agent-Generated Revenue
          + Agent Service Revenue
          + Agent Asset Revenue
\`\`\`

### Employment

Percentage of observable digital work signals showing deployed agent use:

\`\`\`
employment_pct = deployed_agent_work_signals / total_relevant_digital_work_signals * 100
\`\`\`

### Productivity

Agent GDP divided by total estimated agent tool spend:

\`\`\`
productivity_multiplier = agent_gdp_usd_month / total_agent_tax_spend_usd_month
\`\`\`

## Database Schema

See \`supabase/migrations/init.sql\` for the complete schema.

### Tables

- **countries**: ISO country data
- **country_metric_snapshots**: Monthly metric snapshots per country
- **source_signals**: Research evidence and citations
- **research_runs**: Cron job tracking

## Important Notes

- The app works with seeded country data before enabling OpenAI research
- Demo metrics are placeholder values for UI development only
- OpenAI is only called from protected backend cron routes
- Missing metrics display "No Data Yet"
- All countries appear in the map and table
