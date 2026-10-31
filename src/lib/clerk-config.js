/**
 * Clerk Configuration and Key Validation Helpers
 */

export function isValidClerkPublishableKey(key) {
  if (!key || typeof key !== "string") return false;
  const trimmed = key.trim();

  // Reject unconfigured placeholders
  if (
    trimmed.includes("your_") ||
    trimmed.includes("...") ||
    trimmed.includes("placeholder") ||
    trimmed.includes("<") ||
    trimmed.includes(">")
  ) {
    return false;
  }

  // Must begin with pk_test_ or pk_live_
  if (!trimmed.startsWith("pk_test_") && !trimmed.startsWith("pk_live_")) {
    return false;
  }

  // Must contain base64 payload
  const parts = trimmed.split("_");
  if (parts.length < 3) return false;
  const b64 = parts.slice(2).join("_");

  try {
    const decoded =
      typeof atob === "function"
        ? atob(b64)
        : Buffer.from(b64, "base64").toString("utf-8");

    // Valid Clerk keys decode to a string ending with $
    return typeof decoded === "string" && decoded.endsWith("$") && decoded.length > 1;
  } catch {
    return false;
  }
}

export function isValidClerkSecretKey(key) {
  if (!key || typeof key !== "string") return false;
  const trimmed = key.trim();

  if (
    trimmed.includes("your_") ||
    trimmed.includes("...") ||
    trimmed.includes("placeholder") ||
    trimmed.includes("<") ||
    trimmed.includes(">")
  ) {
    return false;
  }

  return trimmed.startsWith("sk_test_") || trimmed.startsWith("sk_live_");
}

export function isClerkConfigured() {
  const pub = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return isValidClerkPublishableKey(pub);
}
