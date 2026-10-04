// Builds the site icons from the "M" of the MatchKit logo.
//   node scripts/make-icons.mjs
// Writes src/app/icon.png (browser tab) and src/app/apple-icon.png (iPhone/iPad home screen).

import sharp from "sharp";
import path from "node:path";

const root = path.join(import.meta.dirname, "..");
const LOGO = path.join(root, "public", "matchkit-logo.jpeg");
const CREAM = [254, 248, 236]; // the logo's background colour
const INK = [22, 21, 19];

const { data, info } = await sharp(LOGO).greyscale().raw().toBuffer({ resolveWithObject: true });
const W = info.width;
const H = info.height;
const isDark = (i) => data[i] < 140;

// Label every dark shape; the M is the one containing a point in its left stroke.
const label = new Int32Array(W * H);
let next = 0;
let mLabel = -1;
for (let start = 0; start < W * H; start++) {
  if (!isDark(start) || label[start]) continue;
  next++;
  const stack = [start];
  label[start] = next;
  while (stack.length) {
    const i = stack.pop();
    const x = i % W;
    for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W]) {
      if (j >= 0 && j < W * H && !label[j] && isDark(j)) {
        label[j] = next;
        stack.push(j);
      }
    }
  }
}
for (let y = 380; y < 460 && mLabel < 0; y++) for (let x = 190; x < 230; x++) if (label[y * W + x]) { mLabel = label[y * W + x]; break; }

// Bounding box of the M.
let minX = W, maxX = 0, minY = H, maxY = 0;
for (let i = 0; i < W * H; i++) {
  if (label[i] !== mLabel) continue;
  const x = i % W, y = (i / W) | 0;
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minY = Math.min(minY, y); maxY = Math.max(maxY, y);
}

// Keep the M's soft anti-aliased edge (pixels within 2px of it) but drop anything near other letters.
const near = (i, test) => {
  const x = i % W, y = (i / W) | 0;
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
    const xx = x + dx, yy = y + dy;
    if (xx >= 0 && xx < W && yy >= 0 && yy < H && test(label[yy * W + xx])) return true;
  }
  return false;
};

const pad = Math.round(Math.max(maxX - minX, maxY - minY) * 0.18);
const side = Math.max(maxX - minX, maxY - minY) + 1 + pad * 2;
const ox = minX - Math.round((side - (maxX - minX + 1)) / 2);
const oy = minY - Math.round((side - (maxY - minY + 1)) / 2);

const out = Buffer.alloc(side * side * 3);
for (let y = 0; y < side; y++) {
  for (let x = 0; x < side; x++) {
    const sx = ox + x, sy = oy + y;
    let t = 1; // 1 = cream background, 0 = full ink
    if (sx >= 0 && sx < W && sy >= 0 && sy < H) {
      const i = sy * W + sx;
      const keep = label[i] === mLabel || (near(i, (l) => l === mLabel) && !near(i, (l) => l > 0 && l !== mLabel));
      if (keep) t = Math.min(1, Math.max(0, (data[i] - 20) / (248 - 20)));
    }
    for (let c = 0; c < 3; c++) out[(y * side + x) * 3 + c] = Math.round(INK[c] * (1 - t) + CREAM[c] * t);
  }
}

const icon = sharp(out, { raw: { width: side, height: side, channels: 3 } });
await icon.clone().resize(512, 512).png().toFile(path.join(root, "src", "app", "icon.png"));
await icon.clone().resize(180, 180).png().toFile(path.join(root, "src", "app", "apple-icon.png"));
console.log(`M found at ${minX},${minY}–${maxX},${maxY}; wrote src/app/icon.png (512px) and src/app/apple-icon.png (180px)`);
