import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getImageProps } from "next/image.js";
import {
  getHousingPhotoStoragePath,
  toHousingPhotoUrl,
} from "../app/lib/housingPhotoUrl.ts";

const read = (path: string) =>
  readFileSync(new URL(path, import.meta.url), "utf8");

test("uploaded JPG paths render through the authenticated photo route without the image optimizer", () => {
  const path =
    "4dae1e64-5d5e-4ab7-ad7f-7eed4b3e46c9/30/1789231396498-r8f865.JPG";
  const src = toHousingPhotoUrl(path, 30);
  const { props } = getImageProps({
    src,
    alt: "Logement",
    width: 220,
    height: 180,
    unoptimized: true,
  });
  const url = new URL(props.src, "https://planetls.local");
  assert.equal(url.pathname, "/api/housing/photos");
  assert.equal(url.searchParams.get("housingId"), "30");
  assert.equal(url.searchParams.get("path"), path);
  assert.equal(props.srcSet, undefined);
  assert.equal(
    toHousingPhotoUrl("/images/default-logement.png", 30),
    "/images/default-logement.png",
  );
  assert.equal(
    toHousingPhotoUrl("https://cdn.test/photo.jpg", 30),
    "https://cdn.test/photo.jpg",
  );
});

test("dashboard and housing cards resolve private photos and preserve browser authentication", () => {
  const dashboard = read("../features/owner-dashboard/OwnerDashboardView.tsx");
  const list = read("../app/components/dashboard/housing/HousingListPage.tsx");
  const ownerDetail = read("../app/dashboard/owner/logements/[id]/page.tsx");
  const conciergeDetail = read(
    "../app/components/dashboard/concierge/LogementPage.tsx",
  );
  const avatar = read("../components/ui/Avatar/Avatar.tsx");
  assert.match(
    dashboard,
    /src=\{toHousingPhotoUrl\(property\.photo_principale, property\.id\)\} unoptimized/,
  );
  assert.equal(
    [
      ...list.matchAll(
        /src=\{toHousingPhotoUrl\(getSafePhoto\(logement\.photo_principale\), logement\.id\)\} unoptimized/g,
      ),
    ].length,
    2,
  );
  assert.match(
    ownerDetail,
    /src=\{toHousingPhotoUrl\(activeGalleryPhoto, id\)\}/,
  );
  assert.match(ownerDetail, /src=\{toHousingPhotoUrl\(photo, id\)\}/);
  assert.match(
    conciergeDetail,
    /src=\{draft\.photo_principale \? toHousingPhotoUrl\(draft\.photo_principale, id\) : null\}/,
  );
  assert.match(avatar, /unoptimized=\{unoptimized\}/);
});

test("housing photo URLs keep legacy public values compatible through the authenticated route", () => {
  const legacy =
    "https://project.supabase.co/storage/v1/object/public/housing-photos/user-1/42/photo.webp";
  assert.equal(getHousingPhotoStoragePath(legacy), "user-1/42/photo.webp");
  assert.equal(
    getHousingPhotoStoragePath("user-1/draft/photo.webp"),
    "user-1/draft/photo.webp",
  );
  assert.match(
    toHousingPhotoUrl(legacy, 42),
    /^\/api\/housing\/photos\?housingId=42&path=user-1%2F42%2Fphoto\.webp$/,
  );
});

test("housing photos are private and signed only after the housing access check", () => {
  const route = read("../app/api/housing/photos/route.ts");
  const cleanup = read("../app/api/admin/housing-photos/cleanup/route.ts");
  const migration = read(
    "../../supabase/migrations/20260902113000_private_housing_photos.sql",
  );

  assert.match(route, /export async function GET/);
  assert.match(route, /export async function DELETE/);
  assert.match(
    route,
    /canAccessHousing\(housing\.proprietaire, userId, auth\.role, auth\.isAdmin\)/,
  );
  assert.match(route, /housingReferencesPhoto/);
  assert.match(route, /createSignedUrl\(storagePath, SIGNED_URL_TTL_SECONDS\)/);
  assert.match(route, /public: false/);
  assert.doesNotMatch(route, /getPublicUrl/);
  assert.match(migration, /'housing-photos'/);
  assert.match(migration, /false/);
  assert.match(migration, /ON CONFLICT \(id\) DO UPDATE/);
  assert.match(cleanup, /requireApiRole\(req, ADMIN_ROLES\)/);
  assert.match(
    cleanup,
    /dryRun: req\.nextUrl\.searchParams\.get\("dryRun"\) !== "false"/,
  );
  assert.match(cleanup, /MAX_FILES_PER_RUN = 100/);
});
