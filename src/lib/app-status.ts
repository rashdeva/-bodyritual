import { env } from "@/lib/env";

type AppStatus = {
  timestamp: string;
  database: {
    label: string;
    description: string;
  };
};

function isPlaceholderLocalDatabase(databaseUrl: string) {
  try {
    const url = new URL(databaseUrl);
    return url.hostname === "localhost" && url.pathname === "/bodyritual";
  } catch {
    return false;
  }
}

export async function getAppStatus(): Promise<AppStatus> {
  const timestamp = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  if (process.env.NEXT_PHASE === "phase-production-build") {
    return {
      timestamp,
      database: {
        label: "Runtime check",
        description: "Database connectivity is skipped during the production build and verified at runtime.",
      },
    };
  }

  if (!env.DATABASE_URL) {
    return {
      timestamp,
      database: {
        label: "Not configured",
        description: "Add DATABASE_URL to connect Railway Postgres and enable live queries.",
      },
    };
  }

  if (isPlaceholderLocalDatabase(env.DATABASE_URL)) {
    return {
      timestamp,
      database: {
        label: "Awaiting database",
        description:
          "The current DATABASE_URL is the starter placeholder for localhost. Replace it with a real local Postgres or Railway connection string.",
      },
    };
  }

  try {
    const { db } = await import("@/lib/db");
    await db.$queryRaw`SELECT 1`;

    return {
      timestamp,
      database: {
        label: "Connected",
        description: "Prisma can reach PostgreSQL. You can start adding product routes and server actions.",
      },
    };
  } catch (error) {
    return {
      timestamp,
      database: {
        label: "Connection failed",
        description:
          error instanceof Error
            ? error.message
            : "Prisma could not connect to PostgreSQL with the current DATABASE_URL.",
      },
    };
  }
}
