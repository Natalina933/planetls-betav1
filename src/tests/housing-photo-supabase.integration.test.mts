import test from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

const appUrl = process.env.HOUSING_PHOTO_TEST_APP_URL?.replace(/\/$/, "");
const supabaseUrl = process.env.HOUSING_PHOTO_TEST_SUPABASE_URL;
const serviceRoleKey = process.env.HOUSING_PHOTO_TEST_SERVICE_ROLE_KEY;
const housingId = process.env.HOUSING_PHOTO_TEST_HOUSING_ID;
const storagePath = process.env.HOUSING_PHOTO_TEST_STORAGE_PATH;
const ownerCookie = process.env.HOUSING_PHOTO_TEST_OWNER_COOKIE;
const neighborCookie = process.env.HOUSING_PHOTO_TEST_NEIGHBOR_COOKIE;

const ready = Boolean(appUrl && supabaseUrl && serviceRoleKey && housingId && storagePath && ownerCookie && neighborCookie);

function photoUrl() {
  const params = new URLSearchParams({ housingId: housingId ?? "", path: storagePath ?? "" });
  return `${appUrl}/api/housing/photos?${params.toString()}`;
}

test("Supabase housing photos are private and the application enforces 401/403/owner access", { skip: !ready }, async () => {
  const storage = createClient(supabaseUrl!, serviceRoleKey!).storage;
  const { data: bucket, error: bucketError } = await storage.getBucket("housing-photos");
  assert.equal(bucketError, null);
  assert.equal(bucket?.public, false);

  const anonymous = await fetch(photoUrl(), { redirect: "manual" });
  assert.equal(anonymous.status, 401);

  const neighbor = await fetch(photoUrl(), {
    headers: { cookie: neighborCookie! },
    redirect: "manual",
  });
  assert.equal(neighbor.status, 403);

  const owner = await fetch(photoUrl(), {
    headers: { cookie: ownerCookie! },
    redirect: "manual",
  });
  assert.equal(owner.status, 302);
  assert.match(owner.headers.get("location") ?? "", /\/storage\/v1\/object\/sign\//);
});
