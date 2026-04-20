/**
 * Remove solid background from logo PNG using corner color sampling.
 * Works for black, white, or any uniform border color.
 */
import sharp from "sharp";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const inputPath = join(root, "public", "logo-canaa-gastronomia.png");
const outPath = inputPath;

async function main() {
  const input = sharp(inputPath);
  const { data, info } = await input.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const channels = 4;

  // Sample corners + a few edge pixels for robust bg color
  const samples = [
    [0, 0],
    [w - 1, 0],
    [0, h - 1],
    [w - 1, h - 1],
    [Math.floor(w / 2), 0],
    [Math.floor(w / 2), h - 1],
    [0, Math.floor(h / 2)],
    [w - 1, Math.floor(h / 2)],
  ];

  let sr = 0,
    sg = 0,
    sb = 0;
  for (const [x, y] of samples) {
    const i = (y * w + x) * channels;
    sr += data[i];
    sg += data[i + 1];
    sb += data[i + 2];
  }
  sr /= samples.length;
  sg /= samples.length;
  sb /= samples.length;

  const threshold = 55; // max Euclidean distance to treat as background

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * channels;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const dist = Math.sqrt(
        (r - sr) ** 2 + (g - sg) ** 2 + (b - sb) ** 2,
      );
      if (dist < threshold) {
        data[i + 3] = 0;
      }
    }
  }

  const out = await sharp(data, {
    raw: { width: w, height: h, channels: 4 },
  })
    .png({ compressionLevel: 9, effort: 10 })
    .toBuffer();

  writeFileSync(outPath, out);
  console.log("Wrote", outPath, out.length, "bytes");
  console.log("Sampled bg RGB:", Math.round(sr), Math.round(sg), Math.round(sb));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
