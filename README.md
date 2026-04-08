# CPS Deal Navigator (Dealshaper)

  Internal automated deal-shaping tool for the Cloud Professional Services (CPS) team.  
  Reduces deal-shaping time by automating discovery, inventory import, scope estimation, and strategy recommendation.

  ## Features

  - **Dashboard** — Deal pipeline overview: total VMs, applications, complexity breakdown, status breakdown
  - **New Deal Wizard** — Multi-step form covering discovery, inventory import, and live estimation
  - **CMDB / Excel / Manual Import** — Import server inventory from CSV (CMDB), Excel files, or enter manually
  - **VM Calculator** — Auto-totals imported VMs + physical servers + manual counts
  - **Live Insight Panel** — Real-time complexity score, migration strategy, and risk flags as you fill in the form
  - **Deal Estimates** — Automated effort days, migration weeks, and indicative cost range per deal
  - **Deal Management** — Full CRUD: create, view, edit, delete deals

  ## Tech Stack

  - **Frontend**: React + Vite + TypeScript + Tailwind CSS
  - **Backend**: Node.js + Express 5 + TypeScript
  - **Database**: PostgreSQL + Drizzle ORM
  - **Monorepo**: pnpm workspaces

  ## Prerequisites

  - Node.js 20+
  - pnpm (`npm install -g pnpm`)
  - PostgreSQL (or any managed Postgres — e.g. Supabase, Neon, Railway)

  ## Setup

  ```bash
  # 1. Clone the repo
  git clone https://github.com/cgabhane/Dealshaper.git
  cd Dealshaper

  # 2. Install all dependencies
  pnpm install

  # 3. Set environment variables
  cp .env.example .env
  # Edit .env and fill in your DATABASE_URL

  # 4. Push database schema
  pnpm --filter @workspace/db run push

  # 5. Start the API server (in one terminal)
  pnpm --filter @workspace/api-server run dev

  # 6. Start the frontend (in another terminal)
  PORT=3000 BASE_PATH=/ pnpm --filter @workspace/cps-deal-navigator run dev
  ```

  Then open http://localhost:3000 in your browser.

  ## Environment Variables

  Create a `.env` file in the root with:

  ```
  DATABASE_URL=postgresql://user:password@host:5432/dbname
  SESSION_SECRET=your-secret-key
  ```

  ## Project Structure

  ```
  artifacts/
    api-server/          # Express backend (API routes)
    cps-deal-navigator/  # React frontend
  lib/
    api-spec/            # OpenAPI spec (source of truth)
    api-client-react/    # Generated React Query hooks
    api-zod/             # Generated Zod validation schemas
    db/                  # Database schema (Drizzle ORM)
  ```

  ## Key Commands

  | Command | Description |
  |---|---|
  | `pnpm install` | Install all dependencies |
  | `pnpm --filter @workspace/api-server run dev` | Run API server |
  | `PORT=3000 BASE_PATH=/ pnpm --filter @workspace/cps-deal-navigator run dev` | Run frontend |
  | `pnpm --filter @workspace/db run push` | Sync database schema |
  | `pnpm --filter @workspace/api-spec run codegen` | Regenerate API hooks from OpenAPI spec |
  | `pnpm run typecheck` | Full TypeScript check |

  ---

  Built for CPS leadership — reducing deal-shaping time across the team.
  