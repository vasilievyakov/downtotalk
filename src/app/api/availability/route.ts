import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users, circleMemberships } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
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
  const { isAvailable } = body;

  if (typeof isAvailable !== "boolean") {
    return NextResponse.json({ error: "isAvailable must be boolean" }, { status: 400 });
  }

  await db
    .update(users)
    .set({
      isAvailable,
      availableSince: isAvailable ? new Date() : null,
      lastSeenAt: new Date(),
    })
    .where(eq(users.id, session.user.id));

  // Notify circle members when becoming available
  if (isAvailable) {
    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { name: true },
    });
    notifyCircleMembers(
      session.user.id,
      `${currentUser?.name || "Someone"} is now available to talk.\n\nJoin: downtotalk.vercel.app/dashboard`
    ).catch(() => {}); // fire-and-forget
  }

  return NextResponse.json({ ok: true, isAvailable });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find all circles the current user belongs to
  const myMemberships = await db.query.circleMemberships.findMany({
    where: eq(circleMemberships.userId, session.user.id),
    columns: { circleId: true },
  });

  const circleIds = myMemberships.map((m) => m.circleId);

  if (circleIds.length === 0) {
    return NextResponse.json({ users: [], count: 0 });
  }

  // Find all users in those circles
  const fellowMembers = await db.query.circleMemberships.findMany({
    where: inArray(circleMemberships.circleId, circleIds),
    columns: { userId: true },
  });

  const fellowUserIds = [
    ...new Set(
      fellowMembers
        .map((m) => m.userId)
        .filter((id) => id !== session.user!.id)
    ),
  ];

  if (fellowUserIds.length === 0) {
    return NextResponse.json({ users: [], count: 0 });
  }

  // Get available users from circles only
  const available = await db.query.users.findMany({
    where: and(
      eq(users.isAvailable, true),
      inArray(users.id, fellowUserIds)
    ),
    columns: {
      id: true,
      name: true,
      image: true,
      city: true,
      timezone: true,
      preferredPlatforms: true,
      availableSince: true,
    },
  });

  return NextResponse.json({ users: available, count: available.length });
}
