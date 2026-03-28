"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/auth" })}
      className="rounded-full border border-stone-200 bg-white/80 px-4 py-2 text-sm text-stone-700 shadow-sm backdrop-blur"
    >
      Выйти
    </button>
  );
}
