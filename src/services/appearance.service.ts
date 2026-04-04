import { eq, sql } from "drizzle-orm";
import type { Database } from "../db";
import { appearances } from "../db/schema";
import { nanoid } from "nanoid";

export type AppearanceData = {
  theme?: string;
  bgType?: string;
  bgValue?: string;
  buttonStyle?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  fontFamily?: string;
  textColor?: string;
  profileStyle?: string;
  bgBlur?: boolean;
  customCss?: string;
};

export class AppearanceService {
  constructor(private db: Database) {}

  async getByUser(userId: string) {
    return this.db.query.appearances.findFirst({
      where: eq(appearances.userId, userId),
    });
  }

  async upsert(userId: string, data: AppearanceData) {
    const existing = await this.getByUser(userId);

    if (existing) {
      await this.db
        .update(appearances)
        .set({
          ...(data.theme !== undefined && { theme: data.theme }),
          ...(data.bgType !== undefined && { bgType: data.bgType }),
          ...(data.bgValue !== undefined && { bgValue: data.bgValue }),
          ...(data.buttonStyle !== undefined && { buttonStyle: data.buttonStyle }),
          ...(data.buttonColor !== undefined && { buttonColor: data.buttonColor }),
          ...(data.buttonTextColor !== undefined && { buttonTextColor: data.buttonTextColor }),
          ...(data.fontFamily !== undefined && { fontFamily: data.fontFamily }),
          ...(data.textColor !== undefined && { textColor: data.textColor }),
          ...(data.profileStyle !== undefined && { profileStyle: data.profileStyle }),
          ...(data.bgBlur !== undefined && { bgBlur: data.bgBlur }),
          ...(data.customCss !== undefined && { customCss: data.customCss }),
          updatedAt: sql`(datetime('now'))`,
        })
        .where(eq(appearances.userId, userId));
    } else {
      await this.db.insert(appearances).values({
        id: nanoid(),
        userId,
        ...data,
      });
    }

    return this.getByUser(userId);
  }
}
