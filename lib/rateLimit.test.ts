import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { rateLimit } from "./rateLimit";

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
});

test("sans Upstash : compteur en mémoire, bloque au-delà de la limite", async () => {
  const key = `memoire-${Math.random()}`;
  assert.equal(await rateLimit(key, 2, 60_000), true);
  assert.equal(await rateLimit(key, 2, 60_000), true);
  assert.equal(await rateLimit(key, 2, 60_000), false);
});

test("avec Upstash : le compteur partagé décide", async () => {
  process.env.UPSTASH_REDIS_REST_URL = "https://exemple.upstash.io/";
  process.env.UPSTASH_REDIS_REST_TOKEN = "jeton";
  const calls: { url: string; body: unknown }[] = [];
  let count = 0;
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    calls.push({ url, body: JSON.parse(String(init.body)) });
    count++;
    return new Response(JSON.stringify([{ result: count }, { result: 1 }]));
  }) as typeof fetch;

  assert.equal(await rateLimit("partage", 2, 60_000), true);
  assert.equal(await rateLimit("partage", 2, 60_000), true);
  assert.equal(await rateLimit("partage", 2, 60_000), false);
  assert.equal(calls[0].url, "https://exemple.upstash.io/pipeline");
  assert.deepEqual(calls[0].body, [
    ["INCR", "jr:rl:partage"],
    ["PEXPIRE", "jr:rl:partage", "60000", "NX"],
  ]);
});

test("Upstash en panne : repli mémoire, jamais de blocage à tort", async () => {
  process.env.UPSTASH_REDIS_REST_URL = "https://exemple.upstash.io";
  process.env.UPSTASH_REDIS_REST_TOKEN = "jeton";
  globalThis.fetch = (async () => new Response("erreur", { status: 500 })) as unknown as typeof fetch;
  const original = console.error;
  console.error = () => {};
  try {
    assert.equal(await rateLimit(`panne-${Math.random()}`, 1, 60_000), true);
  } finally {
    console.error = original;
  }
});
