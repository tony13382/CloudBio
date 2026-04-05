import { eq, sql } from "drizzle-orm";
import type { Database } from "../db";
import { users } from "../db/schema";
import { nanoid } from "nanoid";
import { hashPassword, verifyPassword } from "../lib/password";

export class UserService {
  constructor(private db: Database) {}

  async register(email: string, username: string, password: string) {
    const existing = await this.db.query.users.findFirst({
      where: eq(users.email, email),
    });
    if (existing) throw new Error("此信箱已被註冊");

    const existingUsername = await this.db.query.users.findFirst({
      where: eq(users.username, username),
    });
    if (existingUsername) throw new Error("此使用者名稱已被使用");

    const id = nanoid();
    const passwordHash = await hashPassword(password);

    await this.db.insert(users).values({
      id,
      email,
      username: username.toLowerCase(),
      passwordHash,
      displayName: username,
    });

    return { id, email, username: username.toLowerCase(), displayName: username };
  }

  async authenticate(email: string, password: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.email, email),
    });
    if (!user) throw new Error("Invalid credentials");

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) throw new Error("Invalid credentials");

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      socialLinks: user.socialLinks,
    };
  }

  async findById(id: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, id),
    });
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      socialLinks: user.socialLinks,
    };
  }

  async findByUsername(username: string) {
    return this.db.query.users.findFirst({
      where: eq(users.username, username),
    });
  }

  async changePassword(id: string, currentPassword: string, newPassword: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, id),
    });
    if (!user) throw new Error("使用者不存在");

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) throw new Error("目前密碼不正確");

    const newHash = await hashPassword(newPassword);
    await this.db
      .update(users)
      .set({ passwordHash: newHash, updatedAt: sql`(datetime('now'))` })
      .where(eq(users.id, id));
  }

  async updateProfile(
    id: string,
    data: { username?: string; displayName?: string; bio?: string; avatarUrl?: string; socialLinks?: { platform: string; url: string }[] }
  ) {
    if (data.username) {
      const normalized = data.username.toLowerCase();
      const existing = await this.db.query.users.findFirst({
        where: eq(users.username, normalized),
      });
      if (existing && existing.id !== id) {
        throw new Error("此使用者名稱已被使用");
      }
      data.username = normalized;
    }

    await this.db
      .update(users)
      .set({
        ...(data.username !== undefined && { username: data.username }),
        ...(data.displayName !== undefined && { displayName: data.displayName }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
        ...(data.socialLinks !== undefined && { socialLinks: JSON.stringify(data.socialLinks) }),
        updatedAt: sql`(datetime('now'))`,
      })
      .where(eq(users.id, id));

    return this.findById(id);
  }
}
