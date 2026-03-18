import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { circles, circleMemberships, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const circle = await db.query.circles.findFirst({
    where: eq(circles.id, id),
  });

  if (!circle) {
    return NextResponse.json({ error: "Circle not found" }, { status: 404 });
  }

  // Check user is a member
  const membership = await db.query.circleMemberships.findFirst({
    where: (cm, { and, eq: e }) =>
      and(e(cm.circleId, id), e(cm.userId, session.user!.id!)),
  });

  if (!membership) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  // Get all members with user details
  const memberships = await db.query.circleMemberships.findMany({
    where: eq(circleMemberships.circleId, id),
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          image: true,
          city: true,
          isAvailable: true,
          availableSince: true,
        },
      },
    },
  });

  return NextResponse.json({
    circle: {
      ...circle,
      isOwner: circle.ownerId === session.user.id,
    },
    members: memberships.map((m) => ({
      ...m.user,
      joinedAt: m.joinedAt,
    })),
  });
}
