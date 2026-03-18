import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { rateLimitEvents, users, connections } from "@/db/schema";
import { eq, gte, and, sql, count } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { service } = await request.json();
  if (!["claude", "openai", "gemini"].includes(service)) {
    return NextResponse.json({ error: "Invalid service" }, { status: 400 });
  }

  // Create rate limit event
  await db.insert(rateLimitEvents).values({
    userId: session.user.id,
    service,
  });

  // Auto-set user as available
  await db
    .update(users)
    .set({
      isAvailable: true,
      availableSince: new Date(),
      lastSeenAt: new Date(),
    })
    .where(eq(users.id, session.user.id));

  // Count others who are available
  const availableUsers = await db
    .select({ count: count() })
    .from(users)
    .where(
      and(eq(users.isAvailable, true), sql`${users.id} != ${session.user.id}`)
    );

  const othersAvailable = availableUsers[0]?.count || 0;

  return NextResponse.json({
    ok: true,
    service,
    othersAvailable,
  });
}

export async function GET() {
  const now = new Date();
  const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const [recentResult, hourResult, todayConnectionsResult] = await Promise.all([
    // Rate-limited in last 30 min
    db
      .select({ count: count() })
      .from(rateLimitEvents)
      .where(gte(rateLimitEvents.createdAt, thirtyMinAgo)),
    // Rate-limited in last hour
    db
      .select({ count: count() })
      .from(rateLimitEvents)
      .where(gte(rateLimitEvents.createdAt, oneHourAgo)),
    // Connections today
    db
      .select({ count: count() })
      .from(connections)
      .where(gte(connections.createdAt, todayStart)),
  ]);

  return NextResponse.json({
    recentCount: recentResult[0]?.count || 0,
    hourCount: hourResult[0]?.count || 0,
    connectionsToday: todayConnectionsResult[0]?.count || 0,
  });
}
