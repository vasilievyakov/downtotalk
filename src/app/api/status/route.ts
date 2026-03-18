import { NextResponse } from "next/server";
import { db } from "@/db";
import { serviceStatuses, users } from "@/db/schema";
import { eq, desc, and, lt, sql } from "drizzle-orm";
import { checkAllStatuses } from "@/lib/status-monitor";
import { notifyServiceSubscribers } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function GET() {
  // Auto-reset availability after 2 hours
  await db
    .update(users)
    .set({ isAvailable: false, availableSince: null })
    .where(
      and(
        eq(users.isAvailable, true),
        lt(users.availableSince, sql`NOW() - INTERVAL '2 hours'`)
      )
    );

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

  const availableResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(eq(users.isAvailable, true));

  const availableCount = Number(availableResult[0]?.count ?? 0);

  return NextResponse.json({ statuses, availableCount, timestamp: new Date().toISOString() });
}
