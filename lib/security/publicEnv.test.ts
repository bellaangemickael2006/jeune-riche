import { test } from "node:test";
import assert from "node:assert/strict";
import { suspiciousPublicEnv } from "./publicEnv";

test("variables publiques normales : rien à signaler", () => {
  assert.deepEqual(
    suspiciousPublicEnv({
      NEXT_PUBLIC_SITE_URL: "https://jeune-riche.vercel.app",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiJ9.abc_DEF-123",
      NEXT_PUBLIC_GOOGLE_CLIENT_ID: "123-abc.apps.googleusercontent.com",
      NEXT_PUBLIC_SENTRY_DSN: "https://abc@o1.ingest.sentry.io/2?FOO=1",
    }),
    []
  );
});

test("deux variables collées dans une seule : signalée", () => {
  assert.deepEqual(
    suspiciousPublicEnv({ NEXT_PUBLIC_VAPID_PUBLIC_KEY: "BLX\nVAPID_PRIVATE_KEY=EGQ" }),
    ["NEXT_PUBLIC_VAPID_PUBLIC_KEY"]
  );
  assert.deepEqual(suspiciousPublicEnv({ NEXT_PUBLIC_X: "abc SECRET_KEY=123" }), ["NEXT_PUBLIC_X"]);
});

test("les variables serveur (sans NEXT_PUBLIC_) ne sont pas concernées", () => {
  assert.deepEqual(suspiciousPublicEnv({ SMTP_PASSWORD: "a\nb", VAPID_PRIVATE_KEY: "X=Y" }), []);
});
