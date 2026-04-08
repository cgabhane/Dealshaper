# CPS Deal Navigator

## Overview

Internal deal-shaping tool for the Cloud Professional Services (CPS) leadership team. Built to reduce deal-shaping time across the CPS team by automating discovery, inventory import, and scope estimation.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/cps-deal-navigator)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **File parsing**: PapaParse (CSV), SheetJS/xlsx (Excel)

## Features

- **Dashboard**: Deal pipeline overview with total VMs, applications, status breakdown
- **Deal Management**: Create, view, edit, delete deals with full CRUD
- **Multi-step New Deal Wizard**:
  - Discovery step: client info, industry, infrastructure, workload types, business goals, custom scope
  - Inventory step: CMDB CSV import, Excel import, manual VM/server entry
  - Review & Estimate step: live cost and effort estimates
- **Live Insight Panel**: Real-time complexity, strategy suggestion, and risk flags
- **VM/Scope Calculator**: Totals imported VMs + physical servers + manual counts
- **Deal Detail**: Full deal view with inventory table, estimates, edit capabilities
- **File Imports**: CSV (CMDB), Excel (inventory sheets), manual counts

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/cps-deal-navigator run dev` — run frontend locally

## Database Schema

- `deals` — deal records with client info, workload types, complexity, strategy
- `inventory_items` — server/VM inventory items linked to deals (source: cmdb/excel/manual)

## API Routes

- `GET /api/deals/summary` — pipeline summary stats
- `GET /api/deals` — list all deals
- `POST /api/deals` — create deal
- `GET /api/deals/:id` — get deal
- `PUT /api/deals/:id` — update deal
- `DELETE /api/deals/:id` — delete deal
- `GET /api/deals/:id/inventory` — list inventory items
- `POST /api/deals/:id/inventory` — add inventory item
- `GET /api/deals/:id/estimate` — get deal estimate

## Architecture Notes

- All API types generated from `lib/api-spec/openapi.yaml`
- Frontend uses React Query hooks from `@workspace/api-client-react`
- Backend validates using Zod schemas from `@workspace/api-zod`
- Complexity and strategy calculated server-side based on workload types, VM counts, and business goals
