import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { waitlist } from "@/db/schema";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (email.length > 255) {
      return NextResponse.json({ error: "Email too long" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const normalized = email.toLowerCase().trim();

    // Upsert — handles race conditions gracefully
    await db
      .insert(waitlist)
      .values({ email: normalized })
      .onConflictDoNothing();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Waitlist error:", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
