import { test } from "node:test";
import assert from "node:assert/strict";
import { referencedPublicEnv, suspiciousPublicEnv } from "./publicEnv";

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

test("retour à la ligne final toléré ; variables de Vercel ignorées", () => {
  assert.deepEqual(suspiciousPublicEnv({ NEXT_PUBLIC_VAPID_PUBLIC_KEY: "BLX\n" }), []);
  assert.deepEqual(
    suspiciousPublicEnv({ NEXT_PUBLIC_VERCEL_GIT_COMMIT_MESSAGE: "fix: titre\n\n- VAPID_PRIVATE_KEY=… dans le texte" }),
    []
  );
});

test("les variables serveur (sans NEXT_PUBLIC_) ne sont pas concernées", () => {
  assert.deepEqual(suspiciousPublicEnv({ SMTP_PASSWORD: "a\nb", VAPID_PRIVATE_KEY: "X=Y" }), []);
});

test("seules les variables lues par le code sont contrôlées", () => {
  const referenced = referencedPublicEnv([
    "const url = process.env.NEXT_PUBLIC_SUPABASE_URL;",
    "// NEXT_PUBLIC_VAPID_PUBLIC_KEY n'est plus lue (simple mention)",
  ]);
  assert.deepEqual([...referenced], ["NEXT_PUBLIC_SUPABASE_URL"]);
  const env = { NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co", NEXT_PUBLIC_VAPID_PUBLIC_KEY: "BLX\nVAPID_PRIVATE_KEY=EGQ" };
  assert.deepEqual(suspiciousPublicEnv(env, referenced), []);
  assert.deepEqual(suspiciousPublicEnv({ ...env, NEXT_PUBLIC_SUPABASE_URL: "a\nB_C=1" }, referenced), ["NEXT_PUBLIC_SUPABASE_URL"]);
  // « process.envXNEXT_PUBLIC_… » n'est pas une lecture de variable.
  assert.deepEqual([...referencedPublicEnv(["processXenvXNEXT_PUBLIC_Y"])], []);
});
