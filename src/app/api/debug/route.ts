import { NextResponse } from "next/server";

export async function GET() {
  let authError = "";
  try {
    // Try to import and initialize auth to catch the actual error
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    return NextResponse.json({
      authOk: true,
      session: session ? "exists" : "null",
    });
  } catch (e) {
    authError = e instanceof Error ? `${e.message}\n${e.stack}` : String(e);
  }

  return NextResponse.json({ authOk: false, authError });
}
