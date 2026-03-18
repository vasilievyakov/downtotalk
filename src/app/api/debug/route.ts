import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function GET() {
  let dbStatus = "unknown";
  let dbError = "";
  let tables: string[] = [];

  try {
    const result = await db.execute(
      sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
    );
    tables = result.rows.map((r: Record<string, unknown>) => r.table_name as string);
    dbStatus = "connected";
  } catch (e) {
    dbStatus = "error";
    dbError = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json({
    env: {
      hasDbUrl: !!process.env.DATABASE_URL,
      hasAuthSecret: !!process.env.AUTH_SECRET,
      hasGithubId: !!process.env.AUTH_GITHUB_ID,
      hasGithubSecret: !!process.env.AUTH_GITHUB_SECRET,
      hasGoogleId: !!process.env.AUTH_GOOGLE_ID,
      hasGoogleSecret: !!process.env.AUTH_GOOGLE_SECRET,
    },
    db: { status: dbStatus, error: dbError, tables },
  });
}
