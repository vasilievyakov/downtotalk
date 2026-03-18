import { db } from "@/db";
import {
  users,
  notifications,
  circleMemberships,
} from "@/db/schema";
import { eq, and, gte, inArray } from "drizzle-orm";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// ── Low-level send ──────────────────────────────────

export async function sendTelegramMessage(
  chatId: string,
  text: string,
  options?: { parse_mode?: "HTML" | "MarkdownV2" }
) {
  const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: options?.parse_mode ?? "HTML",
    }),
  });
  return res.json();
}

// ── Dedup check: same type+userId+channel within 30 min ─

async function wasRecentlySent(
  userId: string,
  type: string
): Promise<boolean> {
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
  const existing = await db.query.notifications.findFirst({
    where: and(
      eq(notifications.userId, userId),
      eq(notifications.type, type),
      eq(notifications.channel, "telegram"),
      gte(notifications.sentAt, thirtyMinAgo)
    ),
  });
  return !!existing;
}

async function recordSent(
  userId: string,
  type: string,
  payload: Record<string, unknown>
) {
  await db.insert(notifications).values({
    userId,
    type,
    channel: "telegram",
    payload,
  });
}

// ── Notify circle members when someone becomes available ─

export async function notifyCircleMembers(
  userId: string,
  message: string
) {
  // Find all circles the user belongs to
  const memberships = await db.query.circleMemberships.findMany({
    where: eq(circleMemberships.userId, userId),
    columns: { circleId: true },
  });
  const circleIds = memberships.map((m) => m.circleId);
  if (circleIds.length === 0) return;

  // Find all fellow members with telegramChatId
  const fellowMemberships = await db.query.circleMemberships.findMany({
    where: inArray(circleMemberships.circleId, circleIds),
    columns: { userId: true },
  });
  const fellowIds = [
    ...new Set(
      fellowMemberships.map((m) => m.userId).filter((id) => id !== userId)
    ),
  ];
  if (fellowIds.length === 0) return;

  const recipients = await db.query.users.findMany({
    where: inArray(users.id, fellowIds),
    columns: { id: true, telegramChatId: true },
  });

  for (const r of recipients) {
    if (!r.telegramChatId) continue;
    if (await wasRecentlySent(r.id, "someone_free")) continue;
    await sendTelegramMessage(r.telegramChatId, message);
    await recordSent(r.id, "someone_free", { fromUserId: userId });
  }
}

// ── Notify service subscribers when outage detected ─────

export async function notifyServiceSubscribers(
  service: string,
  status: string
) {
  // Find all users who monitor this service and have telegramChatId
  const allUsers = await db.query.users.findMany({
    columns: {
      id: true,
      telegramChatId: true,
      monitoredServices: true,
    },
  });

  const subscribers = allUsers.filter(
    (u) =>
      u.telegramChatId &&
      u.monitoredServices &&
      (u.monitoredServices as string[]).includes(service)
  );

  const serviceName =
    service === "claude"
      ? "Claude"
      : service === "openai"
        ? "ChatGPT"
        : "Gemini";

  const statusEmoji = status === "outage" ? "\u{1F534}" : "\u{1F7E1}";
  const message = `${statusEmoji} <b>${serviceName}</b> is ${status}.\n\nCheck who's free: downtotalk.vercel.app/dashboard`;

  for (const s of subscribers) {
    if (!s.telegramChatId) continue;
    if (await wasRecentlySent(s.id, "downtime")) continue;
    await sendTelegramMessage(s.telegramChatId, message);
    await recordSent(s.id, "downtime", { service, status });
  }
}
