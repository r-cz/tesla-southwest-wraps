// Renders every wrap (or just the model ids passed as arguments) into wraps/<id>/.
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { MODELS } from "../src/models/index.ts";
import { MAX_BYTES, renderWrap, ROOT, WRAP_FILENAME } from "../src/render.ts";

const ids = process.argv.slice(2);
const models = ids.length ? MODELS.filter((m) => ids.includes(m.id)) : MODELS;
const unknown = ids.filter((id) => !MODELS.some((m) => m.id === id));
if (unknown.length) {
  console.error(`Unknown model id(s): ${unknown.join(", ")}`);
  console.error(`Available: ${MODELS.map((m) => m.id).join(", ")}`);
  process.exit(1);
}

for (const model of models) {
  const png = await renderWrap(model);
  if (png.length > MAX_BYTES) {
    throw new Error(`${model.id}: ${png.length} bytes exceeds Paint Shop's 1 MB limit`);
  }
  const dir = join(ROOT, "wraps", model.id);
  await mkdir(dir, { recursive: true });
  await Bun.write(join(dir, WRAP_FILENAME), png);
  console.log(`${model.name}: wraps/${model.id}/${WRAP_FILENAME} (${(png.length / 1024).toFixed(0)} KB)`);
}
