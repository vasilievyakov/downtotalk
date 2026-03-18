import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { circles, circleMemberships, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const circle = await db.query.circles.findFirst({
    where: eq(circles.inviteCode, code),
  });

  if (!circle) {
    return NextResponse.json({ error: "Invalid invite" }, { status: 404 });
  }

  const owner = await db.query.users.findFirst({
    where: eq(users.id, circle.ownerId),
    columns: { name: true, image: true },
  });

  return NextResponse.json({
    circle: {
      id: circle.id,
      name: circle.name,
    },
    owner: {
      name: owner?.name || "Someone",
      image: owner?.image || null,
    },
  });
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code } = await params;

  const circle = await db.query.circles.findFirst({
    where: eq(circles.inviteCode, code),
  });

  if (!circle) {
    return NextResponse.json({ error: "Invalid invite" }, { status: 404 });
  }

  // Add to circle (onConflictDoNothing handles duplicates)
  await db
    .insert(circleMemberships)
    .values({
      circleId: circle.id,
      userId: session.user.id,
    })
    .onConflictDoNothing();

  return NextResponse.json({ ok: true, circleId: circle.id });
}
