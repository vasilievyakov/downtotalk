import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const VALID_PLATFORMS = ["telegram", "whatsapp", "zoom", "meet"] as const;
const VALID_SERVICES = ["claude", "openai", "gemini"] as const;

const profileUpdateSchema = z
  .object({
    name: z.string().max(100).trim().optional(),
    timezone: z.string().max(100).optional(),
    city: z.string().max(100).trim().optional(),
    preferredPlatforms: z
      .array(z.enum(VALID_PLATFORMS))
      .max(4)
      .optional(),
    telegramHandle: z
      .string()
      .max(32)
      .regex(/^[a-zA-Z0-9_]*$/, "Invalid Telegram handle")
      .optional()
      .nullable(),
    whatsappNumber: z
      .string()
      .max(20)
      .regex(/^[0-9+\s()-]*$/, "Invalid phone number")
      .optional()
      .nullable(),
    zoomLink: z
      .string()
      .max(500)
      .url()
      .refine(
        (url) => /^https:\/\/([\w-]+\.)?zoom\.us\//.test(url),
        "Must be a zoom.us link"
      )
      .optional()
      .nullable(),
    monitoredServices: z
      .array(z.enum(VALID_SERVICES))
      .max(3)
      .optional(),
  })
  .strict();

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: {
      id: true,
      name: true,
      email: true,
      image: true,
      githubUsername: true,
      timezone: true,
      city: true,
      preferredPlatforms: true,
      telegramHandle: true,
      whatsappNumber: true,
      zoomLink: true,
      monitoredServices: true,
      telegramChatId: true,
      isAvailable: true,
      availableSince: true,
      lastSeenAt: true,
      createdAt: true,
      // githubAccessToken explicitly excluded
    },
  });

  return NextResponse.json({ user });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  const updates = parsed.data;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  await db.update(users).set(updates).where(eq(users.id, session.user.id));

  return NextResponse.json({ ok: true });
}
