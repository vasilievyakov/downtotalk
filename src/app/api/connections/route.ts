import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { connections, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { receiverId, platform, trigger, downtimeService } =
    await request.json();

  if (!receiverId || !platform) {
    return NextResponse.json(
      { error: "receiverId and platform required" },
      { status: 400 }
    );
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
    return NextResponse.json({ error: "User not found" }, { status: 404 });
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
      trigger: trigger || "manual",
      downtimeService: downtimeService || null,
      status: "initiated",
    })
    .returning();

  return NextResponse.json({ connection, callLink });
}
