export function isSafeCallbackUrl(value: string | undefined): value is string {
  if (
    !value ||
    value.length > 2_000 ||
    !value.startsWith("/") ||
    value.startsWith("//")
  ) {
    return false;
  }

  try {
    return new URL(value, "https://trinity-ai.invalid").origin ===
      "https://trinity-ai.invalid";
  } catch {
    return false;
  }
}

export function safeCallbackUrl(value: string | undefined) {
  return isSafeCallbackUrl(value) ? value : "/home";
}
