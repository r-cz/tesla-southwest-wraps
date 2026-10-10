// Downloads Tesla's official wrap templates into templates/<id>/template.png.
// Usage: bun run fetch-templates <id>...   (ids are folder names in the repo below)
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { ROOT } from "../src/render.ts";

const SOURCE = "https://raw.githubusercontent.com/teslamotors/custom-wraps/master";

const ids = process.argv.slice(2);
if (!ids.length) {
  console.error("Usage: bun run fetch-templates <id>...  e.g. modely-2025-performance");
  console.error("Ids are the vehicle folders in https://github.com/teslamotors/custom-wraps");
  process.exit(1);
}

for (const id of ids) {
  const res = await fetch(`${SOURCE}/${id}/template.png`);
  if (!res.ok) throw new Error(`${id}: ${res.status} ${res.statusText}`);
  const dir = join(ROOT, "templates", id);
  await mkdir(dir, { recursive: true });
  await Bun.write(join(dir, "template.png"), res);
  console.log(`templates/${id}/template.png`);
}
