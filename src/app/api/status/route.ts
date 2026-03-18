import { NextResponse } from "next/server";
import { db } from "@/db";
import { serviceStatuses } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { checkAllStatuses } from "@/lib/status-monitor";
import { notifyServiceSubscribers } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function GET() {
  const statuses = await checkAllStatuses();

  // Compare with previous status and notify on transitions
  for (const current of statuses) {
    if (current.status === "checking") continue;

    const previous = await db.query.serviceStatuses.findFirst({
      where: eq(serviceStatuses.service, current.service),
      orderBy: [desc(serviceStatuses.checkedAt)],
    });

    const prevStatus = previous?.status || "operational";
    const isNewOutage =
      (current.status === "degraded" || current.status === "outage") &&
      prevStatus === "operational";

    // Save current status
    await db.insert(serviceStatuses).values({
      service: current.service,
      status: current.status,
      incidentTitle: current.incidentTitle || null,
    });

    // Notify only on transition to degraded/outage
    if (isNewOutage) {
      notifyServiceSubscribers(current.service, current.status);
    }
  }

  return NextResponse.json({ statuses, timestamp: new Date().toISOString() });
}
