/**
 * Guest name check, shared by the checkout form and mirrored by ordering-backend
 * (internal/modules/ordering/contact_name.go). Keep the two in step.
 */

/** Fallback list for when the store config cannot be read. The backend serves the live one
 *  (service config orders.guest_placeholder_names) as placeholder_names on GET /config. */
export const DEFAULT_PLACEHOLDER_NAMES = [
  "a customer", "customer", "guest", "test", "testing", "name", "my name", "client",
  "mteja", "me", "n/a", "na", "none", "user", "buyer", "anonymous", "unknown",
  "xxx", "abc", "asdf", "qwerty",
];

export const GUEST_NAME_MAX_LENGTH = 60;

export const GUEST_NAME_MESSAGES = {
  required: "Please enter your name.",
  placeholder: "Please enter your real first name, e.g. Wanjiku",
  tooLong: "Please keep your name under 60 characters.",
  characters: "Names can only use letters, spaces, apostrophes, hyphens and dots.",
  tooShort: "Please enter at least 2 letters.",
} as const;

const NAME_PATTERN = /^[\p{L}\p{M} '’.\-]+$/u;
const LETTER = /\p{L}/u;

/** Trims the name and folds runs of spaces into one. */
export function normalizeGuestName(name: string): string {
  return name.trim().split(/\s+/).filter(Boolean).join(" ");
}

/**
 * Returns the message to show for a name the checkout will refuse, or null when it is fine.
 * A first name alone is fine.
 */
export function guestNameError(name: string, placeholders: readonly string[] = DEFAULT_PLACEHOLDER_NAMES): string | null {
  const n = normalizeGuestName(name);
  if (!n) return GUEST_NAME_MESSAGES.required;

  const lower = n.toLowerCase();
  const list = placeholders.length > 0 ? placeholders : DEFAULT_PLACEHOLDER_NAMES;
  if (list.some((p) => normalizeGuestName(p).toLowerCase() === lower)) return GUEST_NAME_MESSAGES.placeholder;

  const chars = Array.from(n);
  if (chars.length > GUEST_NAME_MAX_LENGTH) return GUEST_NAME_MESSAGES.tooLong;
  if (!NAME_PATTERN.test(n)) return GUEST_NAME_MESSAGES.characters;

  const letters = chars.filter((c) => LETTER.test(c)).map((c) => c.toLowerCase());
  if (chars.length < 2 || letters.length < 2) return GUEST_NAME_MESSAGES.tooShort;
  if (letters.every((c) => c === letters[0])) return GUEST_NAME_MESSAGES.placeholder;

  return null;
}
