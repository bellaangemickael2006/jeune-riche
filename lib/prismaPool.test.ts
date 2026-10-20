import { test } from "node:test";
import assert from "node:assert/strict";
import { poolConfig } from "./prismaPool";

test("poolConfig retire les paramètres de Prisma 6 et sslmode", () => {
  const config = poolConfig(
    "postgresql://u:p@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require&application_name=jr"
  );
  const url = new URL(config.connectionString!);
  assert.equal(url.searchParams.get("pgbouncer"), null);
  assert.equal(url.searchParams.get("connection_limit"), null);
  assert.equal(url.searchParams.get("sslmode"), null);
  assert.equal(url.searchParams.get("application_name"), "jr");
  assert.equal(url.port, "6543");
  assert.deepEqual(config.ssl, { rejectUnauthorized: false });
  assert.equal(config.max, 3);
});

test("poolConfig : pas de SSL en local, URL absente ou illisible transmise telle quelle", () => {
  assert.equal(poolConfig("postgresql://u:p@localhost:5432/db").ssl, false);
  assert.equal(poolConfig(undefined).connectionString, undefined);
  assert.equal(poolConfig("pas une url").connectionString, "pas une url");
});
