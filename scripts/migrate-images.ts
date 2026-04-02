/**
 * Migration script: downloads all external project images, optimizes them
 * (resize + WebP), uploads to Vercel Blob, and updates the database.
 *
 * Usage: npx tsx scripts/migrate-images.ts
 *
 * Requires BLOB_READ_WRITE_TOKEN in .env.local
 */

import { put } from "@vercel/blob";
import { readFileSync } from "fs";

// Load .env.local manually (no dotenv dependency)
const envFile = readFileSync(".env.local", "utf-8");
for (const line of envFile.split("\n")) {
  const match = line.match(/^([^#=]+)="?([^"]*)"?$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

const API_BASE = "https://ns-tools-atlas.vercel.app";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN!;
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN!;

if (!BLOB_TOKEN) {
  console.error("Missing BLOB_READ_WRITE_TOKEN in .env.local");
  process.exit(1);
}
if (!ADMIN_TOKEN) {
  console.error("Missing ADMIN_TOKEN in .env.local");
  process.exit(1);
}

// --- Image optimization using sharp-free canvas approach ---
// Node.js doesn't have OffscreenCanvas, so we use a raw fetch + sharp-less approach:
// Download as buffer, upload as-is but convert via a canvas polyfill OR
// just use the sharp package which is standard for Node image processing.

// Since we want WebP conversion + resize, let's check if sharp is available,
// otherwise just upload originals.

let sharp: any;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.warn(
    "sharp not installed. Run: pnpm add -D sharp\nImages will be uploaded without optimization.",
  );
}

interface Project {
  id: string;
  name: string;
  imageUrl?: string | null;
  productImages?: string[] | null;
}

async function fetchProjects(): Promise<Project[]> {
  // Fetch all projects including pending/dead via admin endpoint
  const res = await fetch(`${API_BASE}/api/admin-data`, {
    headers: { "x-admin-token": ADMIN_TOKEN },
  });
  if (!res.ok) throw new Error(`Failed to fetch projects: ${res.status}`);
  const data = await res.json();
  return data.projects || data;
}

async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch (err: any) {
    console.warn(`  Failed to download ${url}: ${err.message}`);
    return null;
  }
}

async function optimizeAndUpload(
  buffer: Buffer,
  pathname: string,
  type: "logo" | "product",
): Promise<string> {
  let optimized: Buffer = buffer;
  let contentType = "image/webp";

  if (sharp) {
    const maxW = type === "logo" ? 256 : 1200;
    const maxH = type === "logo" ? 256 : 900;
    const quality = type === "logo" ? 85 : 80;

    optimized = await sharp(buffer)
      .resize(maxW, maxH, { fit: "inside", withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();
  } else {
    // Without sharp, detect content type from buffer magic bytes
    if (buffer[0] === 0xff && buffer[1] === 0xd8) contentType = "image/jpeg";
    else if (buffer[0] === 0x89 && buffer[1] === 0x50) contentType = "image/png";
    else if (buffer[0] === 0x47 && buffer[1] === 0x49) contentType = "image/gif";
    else contentType = "image/webp";
  }

  const blob = await put(pathname, optimized, {
    access: "public",
    contentType,
    token: BLOB_TOKEN,
  });

  return blob.url;
}

async function updateProject(
  id: string,
  column: string,
  value: string | string[] | null,
) {
  const res = await fetch(`${API_BASE}/api/admin-update`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": ADMIN_TOKEN,
    },
    body: JSON.stringify({ table: "projects", id, column, value }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to update ${id}.${column}: ${err}`);
  }
}

function isAlreadyBlob(url: string): boolean {
  return url.includes(".blob.vercel-storage.com");
}

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

async function main() {
  console.log("Fetching projects...");
  const projects = await fetchProjects();
  console.log(`Found ${projects.length} projects\n`);

  let migratedLogos = 0;
  let migratedProducts = 0;
  let skipped = 0;
  let failed = 0;

  for (const project of projects) {
    const slug = sanitizeFilename(project.name);

    // Migrate logo
    if (project.imageUrl && !isAlreadyBlob(project.imageUrl)) {
      process.stdout.write(`[logo] ${project.name}... `);
      const buf = await downloadImage(project.imageUrl);
      if (buf) {
        try {
          const newUrl = await optimizeAndUpload(
            buf,
            `logos/${slug}.webp`,
            "logo",
          );
          await updateProject(project.id, "imageUrl", newUrl);
          console.log("OK");
          migratedLogos++;
        } catch (err: any) {
          console.log(`FAIL: ${err.message}`);
          failed++;
        }
      } else {
        console.log("SKIP (download failed)");
        skipped++;
      }
    }

    // Migrate product images
    if (project.productImages?.length) {
      const newUrls: string[] = [];
      let changed = false;

      for (let i = 0; i < project.productImages.length; i++) {
        const url = project.productImages[i];
        if (isAlreadyBlob(url)) {
          newUrls.push(url);
          continue;
        }

        process.stdout.write(
          `[product ${i + 1}/${project.productImages.length}] ${project.name}... `,
        );
        const buf = await downloadImage(url);
        if (buf) {
          try {
            const newUrl = await optimizeAndUpload(
              buf,
              `products/${slug}-${i + 1}.webp`,
              "product",
            );
            newUrls.push(newUrl);
            console.log("OK");
            migratedProducts++;
            changed = true;
          } catch (err: any) {
            console.log(`FAIL: ${err.message}`);
            newUrls.push(url); // keep original on failure
            failed++;
          }
        } else {
          console.log("SKIP (download failed)");
          newUrls.push(url);
          skipped++;
        }
      }

      if (changed) {
        await updateProject(project.id, "productImages", newUrls);
      }
    }
  }

  console.log(`\nDone!`);
  console.log(`  Logos migrated: ${migratedLogos}`);
  console.log(`  Product images migrated: ${migratedProducts}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Failed: ${failed}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
