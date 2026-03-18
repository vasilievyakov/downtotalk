import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { circles, circleMemberships } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

function generateInviteCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

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
    const [circle] = await db
      .insert(circles)
      .values({
        ownerId: session.user.id,
        name: "My network",
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

      return {
        id: m.circle.id,
        name: m.circle.name,
        inviteCode: m.circle.inviteCode,
        isOwner: m.circle.ownerId === session.user!.id,
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

  const { name } = await request.json();
  if (!name) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
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
