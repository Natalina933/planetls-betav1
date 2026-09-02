import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getHousingPhotoStoragePath, toHousingPhotoUrl } from "../app/lib/housingPhotoUrl.ts";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("housing photo URLs keep legacy public values compatible through the authenticated route", () => {
  const legacy = "https://project.supabase.co/storage/v1/object/public/housing-photos/user-1/42/photo.webp";
  assert.equal(getHousingPhotoStoragePath(legacy), "user-1/42/photo.webp");
  assert.equal(getHousingPhotoStoragePath("user-1/draft/photo.webp"), "user-1/draft/photo.webp");
  assert.match(toHousingPhotoUrl(legacy, 42), /^\/api\/housing\/photos\?housingId=42&path=user-1%2F42%2Fphoto\.webp$/);
});

test("housing photos are private and signed only after the housing access check", () => {
  const route = read("../app/api/housing/photos/route.ts");
  const cleanup = read("../app/api/admin/housing-photos/cleanup/route.ts");
  const migration = read("../../supabase/migrations/20260902113000_private_housing_photos.sql");

  assert.match(route, /export async function GET/);
  assert.match(route, /export async function DELETE/);
  assert.match(route, /canAccessHousing\(housing\.proprietaire, userId, auth\.role, auth\.isAdmin\)/);
  assert.match(route, /housingReferencesPhoto/);
  assert.match(route, /createSignedUrl\(storagePath, SIGNED_URL_TTL_SECONDS\)/);
  assert.match(route, /public: false/);
  assert.doesNotMatch(route, /getPublicUrl/);
  assert.match(migration, /'housing-photos'/);
  assert.match(migration, /false/);
  assert.match(migration, /ON CONFLICT \(id\) DO UPDATE/);
  assert.match(cleanup, /requireApiRole\(req, ADMIN_ROLES\)/);
  assert.match(cleanup, /dryRun: req\.nextUrl\.searchParams\.get\("dryRun"\) !== "false"/);
  assert.match(cleanup, /MAX_FILES_PER_RUN = 100/);
});
