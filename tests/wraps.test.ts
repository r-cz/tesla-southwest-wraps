import { describe, expect, test } from "bun:test";
import sharp from "sharp";
import { MODELS } from "../src/models/index.ts";
import { MAX_BYTES, panelMask, renderWrap, templatePath, WRAP_FILENAME } from "../src/render.ts";

// Paint Shop requirements: https://github.com/teslamotors/custom-wraps#image-requirements
test("wrap filename is Paint Shop compatible", () => {
  expect(WRAP_FILENAME).toMatch(/^[A-Za-z0-9_\- ]{1,26}\.png$/);
});

describe.each(MODELS)("$name", (model) => {
  test("renders a PNG Paint Shop will accept", async () => {
    const png = await renderWrap(model);
    const meta = await sharp(png).metadata();
    expect(meta.format).toBe("png");
    expect(meta.width).toBe(model.width);
    expect(meta.height).toBe(model.height);
    expect(meta.width).toBeGreaterThanOrEqual(512);
    expect(meta.width).toBeLessThanOrEqual(1024);
    expect(png.length).toBeLessThanOrEqual(MAX_BYTES);
  });

  test("paints every panel of the template and nothing far outside it", async () => {
    const [wrapAlpha, templateAlpha] = await Promise.all([
      sharp(await renderWrap(model))
        .extractChannel("alpha")
        .raw()
        .toBuffer(),
      sharp(templatePath(model)).extractChannel("alpha").raw().toBuffer(),
    ]);
    const outside = await panelMask(model, 5);
    let unpainted = 0;
    let stray = 0;
    for (let i = 0; i < templateAlpha.length; i++) {
      if (templateAlpha[i]! > 0 && wrapAlpha[i] !== 255) unpainted++;
      if (outside[i] === 0 && wrapAlpha[i] !== 0) stray++;
    }
    expect(unpainted).toBe(0);
    expect(stray).toBe(0);
  });
});
