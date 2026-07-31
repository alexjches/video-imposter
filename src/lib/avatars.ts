// src/lib/avatars.ts
// The allowed avatar set. Lives apart from lib/auth.ts so client components
// can import it without pulling NextAuth's server-only dependencies in.

export const AVATARS = [
  '🎮', '👾', '🕵️', '🎭', '🦊', '🐺', '🦁', '🐸',
  '🤖', '👽', '🧙', '🦄', '🐙', '🦋', '🐲', '🌙',
] as const;

export function randomAvatar(): string {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)];
}

/** True only for avatars in the allowed set — used to vet user input. */
export function isAllowedAvatar(value: unknown): value is string {
  return typeof value === 'string' && (AVATARS as readonly string[]).includes(value);
}
