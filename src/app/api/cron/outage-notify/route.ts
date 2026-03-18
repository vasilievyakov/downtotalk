import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { serviceStatuses } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { checkAllStatuses } from "@/lib/status-monitor";
import { notifyServiceSubscribers } from "@/lib/telegram";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentStatuses = await checkAllStatuses();

  for (const current of currentStatuses) {
    // Get previous status from DB
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
      await notifyServiceSubscribers(current.service, current.status);
    }
  }

  return NextResponse.json({ ok: true, checked: currentStatuses.length });
}
