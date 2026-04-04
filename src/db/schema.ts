import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  socialLinks: text("social_links"), // JSON: [{platform, url}]
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

export const blocks = sqliteTable("blocks", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // button | banner | square | dual_square | video | divider | text
  config: text("config").notNull(), // JSON string
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  sortOrder: real("sort_order").notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

export const appearances = sqliteTable("appearances", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  theme: text("theme").default("default"),
  bgType: text("bg_type").default("solid"),
  bgValue: text("bg_value").default("#ffffff"),
  buttonStyle: text("button_style").default("rounded"),
  buttonColor: text("button_color").default("#000000"),
  buttonTextColor: text("button_text_color").default("#ffffff"),
  fontFamily: text("font_family").default("Inter"),
  textColor: text("text_color").default("#000000"),
  profileStyle: text("profile_style").default("blend"),
  bgBlur: integer("bg_blur", { mode: "boolean" }).default(false),
  customCss: text("custom_css"),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});
