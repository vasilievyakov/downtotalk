import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendTelegramMessage } from "@/lib/telegram";

interface TelegramUpdate {
  message?: {
    chat: { id: number };
    text?: string;
    from?: { first_name?: string };
  };
}

export async function POST(request: NextRequest) {
  const update: TelegramUpdate = await request.json();
  const message = update.message;
  if (!message?.text) return NextResponse.json({ ok: true });

  const chatId = String(message.chat.id);
  const text = message.text;

  // Handle /start with deep link: /start {userId}
  if (text.startsWith("/start")) {
    const parts = text.split(" ");
    const userId = parts[1];

    if (!userId) {
      await sendTelegramMessage(
        chatId,
        "Welcome to DownToTalk!\n\nTo enable notifications, use the link from your profile at downtotalk.vercel.app."
      );
      return NextResponse.json({ ok: true });
    }

    // Verify user exists
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true, name: true },
    });

    if (!user) {
      await sendTelegramMessage(chatId, "User not found. Please check your link.");
      return NextResponse.json({ ok: true });
    }

    // Save telegramChatId
    await db
      .update(users)
      .set({ telegramChatId: chatId })
      .where(eq(users.id, userId));

    const name = message.from?.first_name || "there";
    await sendTelegramMessage(
      chatId,
      `\u2713 Notifications enabled, ${name}!\n\nYou'll get a message when someone in your circles becomes available.`
    );

    return NextResponse.json({ ok: true });
  }

  // Handle /stop — disable notifications
  if (text === "/stop") {
    await db
      .update(users)
      .set({ telegramChatId: null })
      .where(eq(users.telegramChatId, chatId));

    await sendTelegramMessage(chatId, "Notifications disabled. Send /start to re-enable.");
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}
