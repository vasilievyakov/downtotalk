import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { isAvailable } = await request.json();

  await db
    .update(users)
    .set({
      isAvailable,
      availableSince: isAvailable ? new Date() : null,
      lastSeenAt: new Date(),
    })
    .where(eq(users.id, session.user.id));

  return NextResponse.json({ ok: true, isAvailable });
}

export async function GET() {
  const available = await db.query.users.findMany({
    where: eq(users.isAvailable, true),
    columns: {
      id: true,
      name: true,
      image: true,
      city: true,
      timezone: true,
      preferredPlatforms: true,
      telegramHandle: true,
      availableSince: true,
    },
  });

  return NextResponse.json({ users: available, count: available.length });
}
