import { pgTable, text, uuid, timestamp, primaryKey } from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
  userId: uuid("user_id").primaryKey(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  location: text("location"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const userRoles = pgTable("user_roles", {
  userId: uuid("user_id").notNull(),
  role: text("role").notNull(), // 'user' | 'creator' | 'admin' | 'moderator'
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.role] }),
}));

export const userSkills = pgTable("user_skills", {
  userId: uuid("user_id").notNull(),
  skill: text("skill").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.skill] }),
}));

export const accounts = pgTable("accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  provider: text("provider").notNull(),         // 'google' | 'email' | 'wallet'
  providerUserId: text("provider_user_id"),
  walletAddress: text("wallet_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
