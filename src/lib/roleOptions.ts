import { ROLES, ROLE_KEYS, type RoleKey } from "@/lib/rbac";
import type { Locale } from "@/i18n/dictionaries";

export function roleLabel(role: RoleKey, locale: Locale): string {
  const def = ROLES[role];
  if (!def) return role;
  return locale === "ar" ? def.labelAr : def.labelEn;
}

export function roleOptions(locale: Locale): { value: string; label: string }[] {
  return ROLE_KEYS.map((key) => ({ value: key, label: roleLabel(key, locale) }));
}
