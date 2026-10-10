import { join } from "node:path";
import sharp from "sharp";
import { heartDefs } from "./livery.ts";
import type { WrapModel } from "./models/types.ts";

export const ROOT = join(import.meta.dir, "..");

/** Output name: Paint Shop allows letters, digits, `_`, `-` and spaces, up to 30 characters. */
export const WRAP_FILENAME = "Southwest_Heart.png";

/** Paint Shop rejects wraps over 1 MB. */
export const MAX_BYTES = 1024 * 1024;

/**
 * The template's panel shapes as a single-channel mask, grown outward by
 * roughly `pixels` (blurred, then anything the blur touched is kept).
 */
export async function panelMask(model: WrapModel, pixels: number): Promise<Buffer> {
  // Separate pipelines, because sharp applies chained operations in its own
  // fixed order rather than the order they are called in.
  const raw = { width: model.width, height: model.height, channels: 1 } as const;
  const alpha = await sharp(templatePath(model)).extractChannel("alpha").raw().toBuffer();
  const mask = await sharp(alpha, { raw })
    .blur({ sigma: pixels / 1.3, minAmplitude: 0.001 })
    .toColourspace("b-w")
    .raw()
    .toBuffer();
  if (mask.length !== alpha.length) throw new Error("expected a single-channel mask");
  for (let i = 0; i < mask.length; i++) mask[i] = mask[i]! >= 10 ? 255 : 0;
  return mask;
}

/**
 * How far paint bleeds past each panel outline, in pixels, so texture
 * filtering never samples the transparent gaps at panel edges.
 */
const BLEED = 1;

export function templatePath(model: WrapModel): string {
  return join(ROOT, "templates", model.id, "template.png");
}

export function toSvg(model: WrapModel): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${model.width}" height="${model.height}" viewBox="0 0 ${model.width} ${model.height}">` +
    `<defs>${heartDefs()}</defs>` +
    model.design() +
    `</svg>`
  );
}

/** Renders the design and cuts it to the template's panel shapes. */
export async function renderWrap(model: WrapModel): Promise<Buffer> {
  const { width, height } = model;
  const art = await sharp(Buffer.from(toSvg(model)))
    .removeAlpha()
    .raw()
    .toBuffer();
  return sharp(art, { raw: { width, height, channels: 3 } })
    .joinChannel(await panelMask(model, BLEED), { raw: { width, height, channels: 1 } })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
}
