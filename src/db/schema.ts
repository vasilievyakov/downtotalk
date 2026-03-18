import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  jsonb,
  integer,
  primaryKey,
  unique,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

// ──────────────────────────────────────────
// Auth.js required tables
// ──────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").unique().notNull(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  // DownToTalk-specific fields
  githubUsername: text("github_username"),
  timezone: text("timezone"),
  city: text("city"),
  preferredPlatforms: jsonb("preferred_platforms")
    .$type<string[]>()
    .default(["telegram"]),
  telegramHandle: text("telegram_handle"),
  whatsappNumber: text("whatsapp_number"),
  zoomLink: text("zoom_link"),
  monitoredServices: jsonb("monitored_services")
    .$type<string[]>()
    .default(["claude", "openai", "gemini"]),
  telegramChatId: text("telegram_chat_id"),
  isAvailable: boolean("is_available").default(false),
  availableSince: timestamp("available_since", { mode: "date" }),
  lastSeenAt: timestamp("last_seen_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  ]
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

// ──────────────────────────────────────────
// DownToTalk domain tables
// ──────────────────────────────────────────

export const serviceStatuses = pgTable("service_statuses", {
  id: uuid("id").defaultRandom().primaryKey(),
  service: text("service").notNull(), // "claude" | "openai" | "gemini"
  component: text("component"), // "api" | "web" | "code"
  status: text("status").notNull(), // "operational" | "degraded" | "partial_outage" | "major_outage" | "maintenance"
  incidentId: text("incident_id"),
  incidentTitle: text("incident_title"),
  checkedAt: timestamp("checked_at", { mode: "date" }).defaultNow(),
});

export const connections = pgTable("connections", {
  id: uuid("id").defaultRandom().primaryKey(),
  initiatorId: uuid("initiator_id")
    .notNull()
    .references(() => users.id),
  receiverId: uuid("receiver_id")
    .notNull()
    .references(() => users.id),
  platform: text("platform").notNull(), // "telegram" | "whatsapp" | "zoom" | "meet"
  trigger: text("trigger").notNull(), // "downtime" | "manual"
  downtimeService: text("downtime_service"), // which AI service was down
  status: text("status").notNull().default("initiated"), // "initiated" | "accepted" | "completed" | "missed"
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  type: text("type").notNull(), // "downtime" | "someone_free" | "connection_request"
  channel: text("channel").default("in_app"), // "in_app" | "telegram"
  payload: jsonb("payload"),
  sentAt: timestamp("sent_at", { mode: "date" }).defaultNow(),
  readAt: timestamp("read_at", { mode: "date" }),
});

// ──────────────────────────────────────────
// Rate limit events (user-reported)
// ──────────────────────────────────────────

export const rateLimitEvents = pgTable("rate_limit_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  service: text("service").notNull(), // "claude" | "openai" | "gemini"
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

// ──────────────────────────────────────────
// Circles (invite-based social graph)
// ──────────────────────────────────────────

export const circles = pgTable("circles", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  inviteCode: text("invite_code").unique().notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

// ──────────────────────────────────────────
// Waitlist (pre-launch email collection)
// ──────────────────────────────────────────

export const waitlist = pgTable("waitlist", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").unique().notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const circleMemberships = pgTable(
  "circle_memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    circleId: uuid("circle_id")
      .notNull()
      .references(() => circles.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at", { mode: "date" }).defaultNow(),
  },
  (table) => [unique().on(table.circleId, table.userId)]
);
