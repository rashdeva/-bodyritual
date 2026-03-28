import Link from "next/link";
import { redirect } from "next/navigation";

import { VkIdOneTap } from "@/components/auth/vk-id-one-tap";
import { getAuthSession, isVkAuthConfigured } from "@/lib/auth";
import { env } from "@/lib/env";

export default async function AuthPage() {
  const session = await getAuthSession();
  if (session?.user?.id) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#fffef9_0%,#f6ede0_44%,#efdfce_100%)] px-5 py-8">
      <section className="w-full max-w-md rounded-[2rem] border border-white/70 bg-white/78 p-8 shadow-[0_28px_90px_rgba(96,64,32,0.12)] backdrop-blur">
        <p className="text-[0.72rem] uppercase tracking-[0.32em] text-stone-500">Авторизация</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.07em] text-stone-950">Войти в BodyRitual</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          Вход строится через VK ID OneTap. После первого логина пользователь и его стартовый профиль создаются в Postgres.
        </p>

        <div className="mt-8 space-y-3">
          <div className="rounded-[1.4rem] border border-stone-200 bg-stone-50/80 px-4 py-4 text-sm text-stone-600">
            Provider: VK ID OneTap
          </div>
          <div className="rounded-[1.4rem] border border-stone-200 bg-stone-50/80 px-4 py-4 text-sm text-stone-600">
            Session: NextAuth credentials + JWT cookie
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {env.VK_CLIENT_ID}
          <div className="w-full">
            <VkIdOneTap
              disabled={!isVkAuthConfigured}
              appId={env.VK_CLIENT_ID ?? ""}
              redirectUrl={`${env.NEXTAUTH_URL}/auth`}
            />
          </div>
          <Link href="/onboarding" className="rounded-full border border-stone-200 bg-white/80 px-6 py-3 text-sm font-medium text-stone-800">
            Назад
          </Link>
        </div>

        {!isVkAuthConfigured ? (
          <p className="mt-5 text-sm leading-6 text-amber-700">
            Добавьте `VK_CLIENT_ID`, `VK_CLIENT_SECRET`, `NEXTAUTH_SECRET` и `NEXTAUTH_URL` в env, иначе VK ID login не запустится.
          </p>
        ) : null}
      </section>
    </main>
  );
}
