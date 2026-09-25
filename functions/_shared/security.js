const memoryCounters = new Map();

function clientIp(request) {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

async function sha256(value) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function readCounter(key) {
  if (typeof caches !== "undefined" && caches.default) {
    const hit = await caches.default.match(new Request(key));
    if (!hit) return 0;
    const value = Number(await hit.text());
    return Number.isFinite(value) ? value : 0;
  }
  const entry = memoryCounters.get(key);
  if (!entry) return 0;
  if (entry.expires <= Date.now()) {
    memoryCounters.delete(key);
    return 0;
  }
  return entry.count;
}

async function writeCounter(key, count, windowSeconds) {
  if (typeof caches !== "undefined" && caches.default) {
    await caches.default.put(
      new Request(key),
      new Response(String(count), {
        headers: { "cache-control": `public, max-age=${windowSeconds}` },
      }),
    );
    return;
  }

  const now = Date.now();
  memoryCounters.set(key, { count, expires: now + windowSeconds * 1000 });
  if (memoryCounters.size > 1_000) {
    for (const [candidate, value] of memoryCounters) {
      if (value.expires <= now) memoryCounters.delete(candidate);
    }
  }
}

/**
 * Best-effort, zero-cost edge throttling. Cloudflare's cache keeps counters at
 * the serving POP; the in-memory branch makes local development/tests behave.
 * A WAF rule remains a useful outer layer, but correctness never depends on it.
 */
export async function checkRateLimit(request, { scope, limit, windowSeconds, discriminator = "" }) {
  const bucket = Math.floor(Date.now() / (windowSeconds * 1000));
  const identity = await sha256(`${clientIp(request)}|${discriminator}`);
  const key = `https://rate-limit.gedushop.invalid/${scope}/${identity}/${bucket}`;
  const count = (await readCounter(key)) + 1;
  await writeCounter(key, count, windowSeconds);
  return { allowed: count <= limit, retryAfter: windowSeconds };
}

export function rateLimited(retryAfter = 600) {
  return new Response(JSON.stringify({ error: "Too many attempts. Please wait and try again." }), {
    status: 429,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      "retry-after": String(retryAfter),
    },
  });
}

export async function fingerprint(value) {
  return sha256(String(value));
}
