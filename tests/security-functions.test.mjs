import assert from "node:assert/strict";
import test from "node:test";

import { checkRateLimit } from "../functions/_shared/security.js";
import { onRequest as proxyRequest } from "../functions/wp/[[path]].js";
import { onRequestPost as abandonedPost } from "../functions/abandoned.js";

test("mutation proxy never automatically replays a POST", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return new Response("failed", { status: 503 });
  };
  try {
    const response = await proxyRequest({
      request: new Request("https://gedushop.com/wp/wc/store/v1/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      }),
      params: { path: ["wc", "store", "v1", "checkout"] },
    });
    assert.equal(response.status, 503);
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("read-only proxy retries a temporary upstream failure", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return new Response(calls === 1 ? "failed" : "ok", { status: calls === 1 ? 503 : 200 });
  };
  try {
    const response = await proxyRequest({
      request: new Request("https://gedushop.com/wp/wc/store/v1/products"),
      params: { path: ["wc", "store", "v1", "products"] },
    });
    assert.equal(response.status, 200);
    assert.equal(calls, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("edge limiter blocks after the configured allowance", async () => {
  const request = new Request("https://gedushop.com/api/orders", {
    headers: { "cf-connecting-ip": `test-${crypto.randomUUID()}` },
  });
  const scope = `test-${crypto.randomUUID()}`;
  assert.equal((await checkRateLimit(request, { scope, limit: 2, windowSeconds: 60 })).allowed, true);
  assert.equal((await checkRateLimit(request, { scope, limit: 2, windowSeconds: 60 })).allowed, true);
  assert.equal((await checkRateLimit(request, { scope, limit: 2, windowSeconds: 60 })).allowed, false);
});

test("abandoned-cart endpoint silently rejects invalid snapshots", async () => {
  const originalFetch = globalThis.fetch;
  let forwarded = false;
  globalThis.fetch = async () => {
    forwarded = true;
    return new Response(null, { status: 204 });
  };
  try {
    const response = await abandonedPost({
      request: new Request("https://gedushop.com/abandoned", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone: "123", items: [] }),
      }),
      env: { CART_BEACON_SECRET: "test-secret", SUITE_URL: "https://suite.example" },
    });
    assert.equal(response.status, 204);
    assert.equal(forwarded, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
