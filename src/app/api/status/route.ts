import { NextResponse } from "next/server";
import { checkAllStatuses } from "@/lib/status-monitor";

export const revalidate = 60; // ISR: revalidate every 60 seconds

export async function GET() {
  const statuses = await checkAllStatuses();
  return NextResponse.json({ statuses, timestamp: new Date().toISOString() });
}
