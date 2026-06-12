import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { eq } from "drizzle-orm";
import { config } from "./config.js";
import { db } from "./db.js";
import { users } from "./schema.js";
import {
  decryptAiSettings,
  encryptAiSettings,
  getSystemSettings,
  normalizeAiSettings,
  publicAiSettingsForAi,
  type AiSettings,
  type PublicAiSettings
} from "./system-settings.js";

type StoredUserSettings = {
  ai?: AiSettings | null;
};

type StoredUserSettingsFile = {
  users?: Record<string, StoredUserSettings>;
};

const userSettingsPath = resolve(config.dataDir, "user-settings.json");

function readUserSettingsFile(): StoredUserSettingsFile {
  try {
    if (!existsSync(userSettingsPath)) return { users: {} };
    const parsed = JSON.parse(readFileSync(userSettingsPath, "utf8")) as StoredUserSettingsFile;
    const userEntries = Object.entries(parsed.users ?? {}).map(([userId, settings]) => [
      userId,
      {
        ...settings,
        ai: decryptAiSettings(settings.ai ?? null)
      }
    ]);
    return { users: Object.fromEntries(userEntries) };
  } catch (error) {
    console.error("Failed to read user settings:", error);
    return { users: {} };
  }
}

function writeUserSettingsFile(file: StoredUserSettingsFile) {
  const userEntries = Object.entries(file.users ?? {}).map(([userId, settings]) => [
    userId,
    {
      ...settings,
      ai: encryptAiSettings(settings.ai ?? null)
    }
  ]);
  writeFileSync(userSettingsPath, JSON.stringify({ users: Object.fromEntries(userEntries) }, null, 2), "utf8");
}

function ownerFallbackAiSettings(userId: string) {
  const user = db.select().from(users).where(eq(users.id, userId)).get();
  if (user?.role !== "owner") return null;
  return getSystemSettings().ai ?? null;
}

export function getUserAiSettings(userId: string): AiSettings | null {
  const file = readUserSettingsFile();
  const stored = file.users?.[userId];
  if (stored && Object.prototype.hasOwnProperty.call(stored, "ai")) {
    return normalizeAiSettings(stored.ai ?? null);
  }
  return normalizeAiSettings(ownerFallbackAiSettings(userId));
}

export function saveUserAiSettings(userId: string, ai: AiSettings | null) {
  const file = readUserSettingsFile();
  file.users = file.users ?? {};
  file.users[userId] = {
    ...(file.users[userId] ?? {}),
    ai: normalizeAiSettings(ai)
  };
  writeUserSettingsFile(file);
}

export function publicUserAiSettings(userId: string): PublicAiSettings {
  return publicAiSettingsForAi(getUserAiSettings(userId));
}
