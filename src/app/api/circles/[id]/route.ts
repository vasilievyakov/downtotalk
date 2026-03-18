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

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

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

  const isOwner = circle.ownerId === session.user.id;
  return NextResponse.json({
    circle: {
      id: circle.id,
      name: circle.name,
      inviteCode: isOwner ? circle.inviteCode : undefined,
      isOwner,
      createdAt: circle.createdAt,
    },
    members: memberships.map((m) => ({
      ...m.user,
      joinedAt: m.joinedAt,
    })),
  });
}
