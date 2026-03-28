import { ArrowRight, CheckCircle2, DatabaseZap, Rocket, Server } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getAppStatus } from "@/lib/app-status";

const launchSteps = [
  "Set `DATABASE_URL` to your Railway Postgres connection string.",
  "Run `pnpm db:push` locally for the first schema sync.",
  "Use `pnpm dev` for development and deploy the same app to Railway.",
];

const stack = [
  {
    title: "Next.js 16",
    description: "App Router, route handlers and server components in one deployable app.",
    icon: Rocket,
  },
  {
    title: "Prisma 7 + Postgres",
    description: "Typed database access with a Railway-friendly setup and clean schema ownership.",
    icon: DatabaseZap,
  },
  {
    title: "shadcn/ui",
    description: "Composable frontend primitives with Tailwind 4 and a non-generic visual base.",
    icon: Server,
  },
];

export default async function Home() {
  const status = await getAppStatus();

  return (
    <main className="relative flex-1 overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.9),_transparent_36%),linear-gradient(160deg,#f8efe8_0%,#f4ece5_38%,#efe6de_100%)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(24,24,27,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(24,24,27,0.04)_1px,transparent_1px)] bg-[size:72px_72px] opacity-35" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,_rgba(181,102,59,0.22),transparent_65%)]" />

      <section className="relative mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-8 md:px-10 md:py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-black/10 bg-black text-sm font-semibold text-white shadow-[0_20px_60px_rgba(0,0,0,0.16)]">
              BR
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-zinc-500">Body Ritual</p>
              <p className="text-sm text-zinc-600">Next.js starter rebuilt for Railway</p>
            </div>
          </div>
          <Badge className="rounded-full border-black/10 bg-white/75 px-4 py-1.5 text-zinc-700 shadow-sm backdrop-blur">
            Web app only
          </Badge>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.8fr]">
          <Card className="overflow-hidden border-black/10 bg-white/80 shadow-[0_30px_120px_rgba(40,20,10,0.12)] backdrop-blur">
            <CardHeader className="gap-5 pb-2">
              <Badge variant="secondary" className="w-fit rounded-full px-3 py-1 uppercase tracking-[0.22em]">
                Fresh stack
              </Badge>
              <div className="space-y-4">
                <CardTitle className="max-w-4xl text-5xl leading-none font-semibold tracking-[-0.06em] text-zinc-950 md:text-7xl">
                  Next.js, PostgreSQL and shadcn without any Expo residue.
                </CardTitle>
                <CardDescription className="max-w-2xl text-base leading-7 text-zinc-600 md:text-lg">
                  The repo is reset to a single Railway-friendly application: App Router frontend, route-handler backend,
                  Prisma for data access and a clean UI baseline for rebuilding Body Ritual on the web.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://nextjs.org/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-[0_10px_40px_rgba(28,25,23,0.18)] transition hover:opacity-90"
                >
                  Next.js docs
                  <ArrowRight className="size-4" />
                </a>
                <a
                  href="https://ui.shadcn.com/docs/installation/next"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-black/10 bg-white/70 px-6 text-sm font-medium text-zinc-950 transition hover:bg-white"
                >
                  shadcn setup
                </a>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {stack.map(({ title, description, icon: Icon }) => (
                  <div
                    key={title}
                    className="rounded-3xl border border-black/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(255,255,255,0.68))] p-5 shadow-sm"
                  >
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-950 text-white">
                      <Icon className="size-5" />
                    </div>
                    <h2 className="text-xl font-medium tracking-[-0.04em] text-zinc-950">{title}</h2>
                    <p className="mt-2 text-sm leading-6 text-zinc-600">{description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <Card className="border-black/10 bg-zinc-950 text-white shadow-[0_24px_80px_rgba(24,24,27,0.28)]">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-2xl tracking-[-0.04em]">
                  Launch status
                  <span className="font-mono text-sm text-zinc-400">{status.timestamp}</span>
                </CardTitle>
                <CardDescription className="text-zinc-300">
                  Runtime status for the new app and database connection surface.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">Database</p>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.05em]">{status.database.label}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">{status.database.description}</p>
                </div>
                <Separator className="bg-white/10" />
                <div className="space-y-3">
                  {launchSteps.map((step) => (
                    <div key={step} className="flex items-start gap-3 text-sm leading-6 text-zinc-200">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-amber-300" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-black/10 bg-white/78 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-2xl tracking-[-0.04em]">Starter schema</CardTitle>
                <CardDescription>
                  Prisma models are in place for users, rituals and workout sessions so product code can start moving
                  immediately.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 font-mono text-sm text-zinc-700">
                <div className="rounded-2xl border border-black/8 bg-black/[0.03] px-4 py-3">User</div>
                <div className="rounded-2xl border border-black/8 bg-black/[0.03] px-4 py-3">Ritual</div>
                <div className="rounded-2xl border border-black/8 bg-black/[0.03] px-4 py-3">WorkoutSession</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}
