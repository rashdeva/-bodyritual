import { NextResponse } from "next/server";

import { getAppStatus } from "@/lib/app-status";

export async function GET() {
  const status = await getAppStatus();

  return NextResponse.json({
    ok: status.database.label === "Connected",
    ...status,
  });
}
