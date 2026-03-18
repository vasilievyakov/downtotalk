import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { rateLimitEvents, users, connections, circleMemberships } from "@/db/schema";
import { eq, gte, and, sql, count, inArray } from "drizzle-orm";
import { notifyCircleMembers } from "@/lib/telegram";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { service } = body;
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

  // Notify circle members via Telegram
  const currentUser = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { name: true },
  });
  const serviceName =
    service === "claude" ? "Claude" : service === "openai" ? "ChatGPT" : "Gemini";
  notifyCircleMembers(
    session.user.id,
    `${currentUser?.name || "Someone"} is free \u2014 hit the ${serviceName} limit.\n\nJoin: downtotalk.vercel.app/dashboard`
  ).catch(() => {}); // fire-and-forget

  // Count others who are available (within shared circles only)
  const myMemberships = await db.query.circleMemberships.findMany({
    where: eq(circleMemberships.userId, session.user.id),
    columns: { circleId: true },
  });
  const myCircleIds = myMemberships.map((m) => m.circleId);

  let othersAvailable = 0;
  if (myCircleIds.length > 0) {
    const fellowMembers = await db.query.circleMemberships.findMany({
      where: inArray(circleMemberships.circleId, myCircleIds),
      columns: { userId: true },
    });
    const fellowIds = [...new Set(fellowMembers.map((m) => m.userId).filter((id) => id !== session.user!.id))];
    if (fellowIds.length > 0) {
      const availableUsers = await db
        .select({ count: count() })
        .from(users)
        .where(and(eq(users.isAvailable, true), inArray(users.id, fellowIds)));
      othersAvailable = availableUsers[0]?.count || 0;
    }
  }

  return NextResponse.json({
    ok: true,
    service,
    othersAvailable,
  });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
