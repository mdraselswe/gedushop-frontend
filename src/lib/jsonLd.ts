/** Prevent an HTML-like value from terminating its surrounding script tag. */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
