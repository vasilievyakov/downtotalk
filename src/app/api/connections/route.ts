import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { connections, users, circleMemberships } from "@/db/schema";
import { eq, and, inArray, gte } from "drizzle-orm";

const VALID_PLATFORMS = ["telegram", "whatsapp", "zoom", "meet"] as const;
const VALID_TRIGGERS = ["downtime", "manual"] as const;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { receiverId, platform, trigger, downtimeService } = body;

  if (!receiverId || typeof receiverId !== "string" || !UUID_REGEX.test(receiverId)) {
    return NextResponse.json({ error: "Invalid receiverId" }, { status: 400 });
  }
  if (receiverId === session.user.id) {
    return NextResponse.json({ error: "Cannot connect with yourself" }, { status: 400 });
  }
  if (!platform || !VALID_PLATFORMS.includes(platform)) {
    return NextResponse.json(
      { error: "Invalid platform" },
      { status: 400 }
    );
  }

  // Dedup: no repeat connections to same receiver within 5 min
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
  const recentConnection = await db.query.connections.findFirst({
    where: and(
      eq(connections.initiatorId, session.user.id),
      eq(connections.receiverId, receiverId),
      gte(connections.createdAt, fiveMinAgo)
    ),
  });
  if (recentConnection) {
    return NextResponse.json({ error: "Connection already initiated" }, { status: 429 });
  }

  // Verify circle membership: initiator and receiver must share a circle
  const initiatorCircles = await db
    .select({ circleId: circleMemberships.circleId })
    .from(circleMemberships)
    .where(eq(circleMemberships.userId, session.user.id));

  const circleIds = initiatorCircles.map((c) => c.circleId);

  if (circleIds.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const sharedMembership = await db
    .select({ userId: circleMemberships.userId })
    .from(circleMemberships)
    .where(
      and(
        eq(circleMemberships.userId, receiverId),
        inArray(circleMemberships.circleId, circleIds)
      )
    )
    .limit(1);

  if (sharedMembership.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Get receiver info for generating call link
  const receiver = await db.query.users.findFirst({
    where: eq(users.id, receiverId),
    columns: {
      id: true,
      name: true,
      telegramHandle: true,
      whatsappNumber: true,
      zoomLink: true,
    },
  });

  if (!receiver) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Generate call link
  let callLink = "";
  switch (platform) {
    case "telegram":
      callLink = receiver.telegramHandle
        ? `https://t.me/${receiver.telegramHandle}`
        : "";
      break;
    case "whatsapp":
      callLink = receiver.whatsappNumber
        ? `https://wa.me/${receiver.whatsappNumber.replace(/[^0-9]/g, "")}`
        : "";
      break;
    case "zoom":
      callLink = receiver.zoomLink || "";
      break;
    case "meet":
      // Google Meet links need to be created via Calendar API or shared manually
      callLink = "";
      break;
  }

  const [connection] = await db
    .insert(connections)
    .values({
      initiatorId: session.user.id,
      receiverId,
      platform,
      trigger: VALID_TRIGGERS.includes(trigger) ? trigger : "manual",
      downtimeService: typeof downtimeService === "string" ? downtimeService.slice(0, 50) : null,
      status: "initiated",
    })
    .returning();

  return NextResponse.json({
    connection: { id: connection.id, status: connection.status },
    callLink,
  });
}
