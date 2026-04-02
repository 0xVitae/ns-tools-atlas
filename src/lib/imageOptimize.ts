/**
 * Browser-side image optimization using Canvas API.
 * Resizes, compresses, and converts images to WebP before upload.
 */

interface OptimizeOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
}

const LOGO_PRESET: OptimizeOptions = { maxWidth: 256, maxHeight: 256, quality: 0.85 };
const PRODUCT_PRESET: OptimizeOptions = { maxWidth: 1200, maxHeight: 900, quality: 0.80 };

export function getOptimizePreset(type: "logo" | "product"): OptimizeOptions {
  return type === "logo" ? LOGO_PRESET : PRODUCT_PRESET;
}

export async function optimizeImage(file: File, type: "logo" | "product"): Promise<File> {
  const opts = getOptimizePreset(type);

  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;

  // Calculate target dimensions maintaining aspect ratio
  let targetW = width;
  let targetH = height;
  if (targetW > opts.maxWidth) {
    targetH = Math.round(targetH * (opts.maxWidth / targetW));
    targetW = opts.maxWidth;
  }
  if (targetH > opts.maxHeight) {
    targetW = Math.round(targetW * (opts.maxHeight / targetH));
    targetH = opts.maxHeight;
  }

  const canvas = new OffscreenCanvas(targetW, targetH);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, targetW, targetH);
  bitmap.close();

  const blob = await canvas.convertToBlob({ type: "image/webp", quality: opts.quality });
  const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
  return new File([blob], name, { type: "image/webp" });
}
