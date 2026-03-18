import { db } from "@/db";
import {
  users,
  notifications,
  circleMemberships,
} from "@/db/schema";
import { eq, and, gte, inArray } from "drizzle-orm";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

const SERVICE_NAME: Record<string, string> = {
  claude: "Claude",
  openai: "ChatGPT",
  gemini: "Gemini",
};

// ── Low-level send ──────────────────────────────────

interface InlineKeyboardButton {
  text: string;
  url: string;
}

export async function sendTelegramMessage(
  chatId: string,
  text: string,
  options?: {
    parse_mode?: "HTML" | "MarkdownV2";
    reply_markup?: { inline_keyboard: InlineKeyboardButton[][] };
  }
) {
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: options?.parse_mode ?? "HTML",
  };
  if (options?.reply_markup) {
    body.reply_markup = options.reply_markup;
  }
  const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
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

// ── Build inline keyboard from user profile ─────────

interface SenderProfile {
  name: string | null;
  telegramHandle: string | null;
  whatsappNumber: string | null;
  zoomLink: string | null;
}

function buildContactKeyboard(sender: SenderProfile): InlineKeyboardButton[][] {
  const buttons: InlineKeyboardButton[] = [];

  if (sender.telegramHandle) {
    buttons.push({
      text: "Message on Telegram",
      url: `https://t.me/${sender.telegramHandle}`,
    });
  }
  if (sender.whatsappNumber) {
    const phone = sender.whatsappNumber.replace(/[^0-9+]/g, "");
    buttons.push({
      text: "Call on WhatsApp",
      url: `https://wa.me/${phone}`,
    });
  }
  if (sender.zoomLink) {
    buttons.push({
      text: "Join Zoom",
      url: sender.zoomLink,
    });
  }

  // Always add dashboard fallback
  buttons.push({
    text: "Open dashboard",
    url: "https://downtotalk.vercel.app/dashboard",
  });

  // One button per row
  return buttons.map((b) => [b]);
}

// ── Notify circle members when someone becomes available ─

export async function notifyCircleMembers(
  userId: string,
  sender: SenderProfile,
  reason: { type: "rate-limit"; service: string } | { type: "available" }
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

  const name = sender.name || "Someone";
  const hasContacts = sender.telegramHandle || sender.whatsappNumber || sender.zoomLink;

  let text: string;
  if (reason.type === "rate-limit") {
    const serviceName = SERVICE_NAME[reason.service] || reason.service;
    text = `<b>${name}</b> is free — hit the ${serviceName} limit.`;
    if (!hasContacts) {
      text += "\n\n<i>This person hasn't added contact methods yet.</i>";
    } else {
      text += "\n\nReach out while they're waiting!";
    }
  } else {
    text = `<b>${name}</b> is now available to talk.`;
    if (!hasContacts) {
      text += "\n\n<i>This person hasn't added contact methods yet.</i>";
    }
  }

  const keyboard = buildContactKeyboard(sender);

  for (const r of recipients) {
    if (!r.telegramChatId) continue;
    if (await wasRecentlySent(r.id, "someone_free")) continue;
    await sendTelegramMessage(r.telegramChatId, text, {
      reply_markup: { inline_keyboard: keyboard },
    });
    await recordSent(r.id, "someone_free", { fromUserId: userId });
  }
}

// ── Notify service subscribers when outage detected ─────

export async function notifyServiceSubscribers(
  service: string,
  status: string
) {
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

  const serviceName = SERVICE_NAME[service] || service;
  const statusEmoji = status === "outage" ? "\u{1F534}" : "\u{1F7E1}";
  const text = `${statusEmoji} <b>${serviceName}</b> is ${status}.\n\nCheck who's free:`;

  const keyboard: InlineKeyboardButton[][] = [
    [{ text: "Open dashboard", url: "https://downtotalk.vercel.app/dashboard" }],
  ];

  for (const s of subscribers) {
    if (!s.telegramChatId) continue;
    if (await wasRecentlySent(s.id, "downtime")) continue;
    await sendTelegramMessage(s.telegramChatId, text, {
      reply_markup: { inline_keyboard: keyboard },
    });
    await recordSent(s.id, "downtime", { service, status });
  }
}
