import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(new URL("../../supabase/migrations/20260921130000_contract_internal_signatures.sql", import.meta.url), "utf8");
const rollback = readFileSync(new URL("../../supabase/rollbacks/20260921130000_contract_internal_signatures.sql", import.meta.url), "utf8");

test("contract signature migration keeps real contract relationships and existing collaboration statuses", () => {
  assert.match(migration, /contract_version_id uuid NOT NULL REFERENCES public\.services_contract_versions\(id\) ON DELETE RESTRICT/);
  const signatureTable = migration.match(/CREATE TABLE public\.contract_version_signatures \([\s\S]*?\n\);/)?.[0] ?? "";
  assert.doesNotMatch(signatureTable, /collaboration_id/i);
  assert.match(migration, /JOIN public\.services_contracts sc ON sc\.id = cv\.contract_id/);
  for (const status of ["pending_handover", "scheduled", "active", "paused", "ended", "cancelled"]) {
    assert.match(migration, new RegExp(`'${status}'`));
  }
});

test("contract signature migration separates agreement from signature and enforces idempotent roles", () => {
  assert.match(migration, /CREATE TABLE public\.contract_version_signatures/);
  assert.match(migration, /UNIQUE \(contract_version_id, signer_role\)/);
  assert.match(migration, /UNIQUE \(contract_version_id, signer_profile_id\)/);
  assert.match(migration, /v\.owner_accepted_at IS NULL OR v\.concierge_accepted_at IS NULL/);
  assert.match(migration, /ON CONFLICT \(contract_version_id, signer_role\) DO NOTHING/);
  assert.match(migration, /actor_role := CASE WHEN p_actor_id = c\.owner_profile_id THEN 'owner' ELSE 'concierge' END/);
});

test("contract signature migration rejects invalid startsOn without current-date fallback", () => {
  assert.match(migration, /jsonb_typeof\(v\.conditions->'duration'->'startsOn'\) <> 'string'/);
  assert.match(migration, /to_char\(effective_start, 'YYYY-MM-DD'\) <> v\.conditions->'duration'->>'startsOn'/);
  assert.match(migration, /RAISE EXCEPTION 'Invalid effective date' USING errcode = '23514'/);
  assert.match(migration, /effective_start <= CURRENT_DATE/);
  assert.doesNotMatch(migration, /COALESCE\([^)]*CURRENT_DATE/i);
});

test("contract signature rollback refuses destructive rollback when live signature states exist", () => {
  assert.match(rollback, /Rollback refused: export and resolve contract_version_signatures/);
  assert.match(rollback, /status IN \('signing','signed'\)/);
  assert.match(rollback, /status = 'scheduled'/);
  assert.match(rollback, /DROP TABLE IF EXISTS public\.contract_version_signatures/);
  assert.match(rollback, /CHECK \(status IN \('pending_handover', 'active', 'paused', 'ended', 'cancelled'\)\)/);
});
