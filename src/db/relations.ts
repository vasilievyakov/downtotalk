import { relations } from "drizzle-orm";
import {
  users,
  circles,
  circleMemberships,
  connections,
  notifications,
} from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  ownedCircles: many(circles),
  circleMemberships: many(circleMemberships),
  initiatedConnections: many(connections, { relationName: "initiator" }),
  receivedConnections: many(connections, { relationName: "receiver" }),
  notifications: many(notifications),
}));

export const circlesRelations = relations(circles, ({ one, many }) => ({
  owner: one(users, {
    fields: [circles.ownerId],
    references: [users.id],
  }),
  memberships: many(circleMemberships),
}));

export const circleMembershipsRelations = relations(
  circleMemberships,
  ({ one }) => ({
    circle: one(circles, {
      fields: [circleMemberships.circleId],
      references: [circles.id],
    }),
    user: one(users, {
      fields: [circleMemberships.userId],
      references: [users.id],
    }),
  })
);

export const connectionsRelations = relations(connections, ({ one }) => ({
  initiator: one(users, {
    fields: [connections.initiatorId],
    references: [users.id],
    relationName: "initiator",
  }),
  receiver: one(users, {
    fields: [connections.receiverId],
    references: [users.id],
    relationName: "receiver",
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));
