# Body Ritual

Fresh `Next.js 16 + Prisma 7 + PostgreSQL + shadcn/ui` starter intended for Railway deployment.

## Stack

- Next.js 16.2.1 with App Router and Turbopack
- React 19.2.4
- Prisma 7 for PostgreSQL access
- `@prisma/adapter-pg` for the current Prisma 7 adapter-based runtime
- shadcn/ui on Tailwind CSS 4

## Local setup

1. Install dependencies:

```bash
pnpm install
```

2. Copy envs:

```bash
cp .env.example .env
```

3. Point `DATABASE_URL` at your local Postgres or Railway database.

4. Sync the starter schema:

```bash
pnpm db:push
```

5. Start the app:

```bash
pnpm dev
```

## Prisma commands

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:push
pnpm db:studio
```

## Railway

- Create a Railway project with one `Postgres` service and one `Next.js` service.
- Set `DATABASE_URL` on the app service.
- Build command: `pnpm build`
- Start command: `pnpm start`
- For the first deployment, run `pnpm db:push` against the Railway database from your machine or CI.

## Health endpoint

`GET /api/health` returns the current runtime timestamp and database connection status.
