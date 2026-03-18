import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { circles, circleMemberships, users } from "@/db/schema";
import { eq, sql, count } from "drizzle-orm";
import { generateInviteCode } from "@/lib/crypto";

const MAX_CIRCLES_PER_USER = 20;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get circles where user is a member, with circle details
  let memberships = await db.query.circleMemberships.findMany({
    where: eq(circleMemberships.userId, session.user.id),
    with: {
      circle: true,
    },
  });

  // Auto-create default circle if user has none
  if (memberships.length === 0) {
    // Get user name for circle naming
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { name: true },
    });
    const circleName = user?.name
      ? `${user.name}'s circle`
      : `${session.user.name || session.user.email || "My"}'s circle`;

    const [circle] = await db
      .insert(circles)
      .values({
        ownerId: session.user.id,
        name: circleName,
        inviteCode: generateInviteCode(),
      })
      .returning();

    await db.insert(circleMemberships).values({
      circleId: circle.id,
      userId: session.user.id,
    });

    memberships = await db.query.circleMemberships.findMany({
      where: eq(circleMemberships.userId, session.user.id),
      with: { circle: true },
    });
  }

  // Count members per circle
  const circlesWithCounts = await Promise.all(
    memberships.map(async (m) => {
      const memberCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(circleMemberships)
        .where(eq(circleMemberships.circleId, m.circle.id));

      const isOwner = m.circle.ownerId === session.user!.id;
      return {
        id: m.circle.id,
        name: m.circle.name,
        inviteCode: isOwner ? m.circle.inviteCode : undefined,
        isOwner,
        memberCount: Number(memberCount[0].count),
        createdAt: m.circle.createdAt,
      };
    })
  );

  return NextResponse.json({ circles: circlesWithCounts });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { name: rawName } = body;
  if (!rawName || typeof rawName !== "string" || rawName.trim().length === 0 || rawName.length > 100) {
    return NextResponse.json({ error: "Name required (max 100 chars)" }, { status: 400 });
  }
  const name = rawName.trim();

  // Limit circles per user
  const [circleCount] = await db
    .select({ count: count() })
    .from(circles)
    .where(eq(circles.ownerId, session.user.id));
  if (circleCount.count >= MAX_CIRCLES_PER_USER) {
    return NextResponse.json({ error: "Circle limit reached" }, { status: 400 });
  }

  const [circle] = await db
    .insert(circles)
    .values({
      ownerId: session.user.id,
      name,
      inviteCode: generateInviteCode(),
    })
    .returning();

  // Owner is also a member
  await db.insert(circleMemberships).values({
    circleId: circle.id,
    userId: session.user.id,
  });

  return NextResponse.json({ circle });
}
