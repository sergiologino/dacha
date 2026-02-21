import sharp from "sharp";
import { readFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const iconsDir = join(root, "public", "icons");

mkdirSync(iconsDir, { recursive: true });

const svgBuffer = readFileSync(join(iconsDir, "icon.svg"));

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

const maskableSvg = (size) => {
  const padding = Math.round(size * 0.1);
  const inner = size - padding * 2;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#059669"/>
  <g transform="translate(${size / 2},${size / 2 + 4})" fill="none" stroke="white" stroke-width="${Math.round(28 * inner / 512)}" stroke-linecap="round" stroke-linejoin="round">
    <path d="M0,${Math.round(80 * inner / 512)} L0,${Math.round(-40 * inner / 512)}"/>
    <path d="M0,${Math.round(-40 * inner / 512)} C0,${Math.round(-120 * inner / 512)} ${Math.round(80 * inner / 512)},${Math.round(-160 * inner / 512)} ${Math.round(80 * inner / 512)},${Math.round(-80 * inner / 512)} C${Math.round(80 * inner / 512)},${Math.round(-40 * inner / 512)} ${Math.round(40 * inner / 512)},0 0,${Math.round(-40 * inner / 512)}"/>
    <path d="M0,${Math.round(-40 * inner / 512)} C0,${Math.round(-120 * inner / 512)} ${Math.round(-80 * inner / 512)},${Math.round(-160 * inner / 512)} ${Math.round(-80 * inner / 512)},${Math.round(-80 * inner / 512)} C${Math.round(-80 * inner / 512)},${Math.round(-40 * inner / 512)} ${Math.round(-40 * inner / 512)},0 0,${Math.round(-40 * inner / 512)}"/>
    <path d="M${Math.round(-60 * inner / 512)},${Math.round(80 * inner / 512)} L${Math.round(60 * inner / 512)},${Math.round(80 * inner / 512)}"/>
  </g>
</svg>`);
};

async function generate() {
  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(join(iconsDir, `icon-${size}.png`));
    console.log(`✓ icon-${size}.png`);
  }

  for (const size of [192, 512]) {
    await sharp(maskableSvg(size))
      .resize(size, size)
      .png()
      .toFile(join(iconsDir, `icon-maskable-${size}.png`));
    console.log(`✓ icon-maskable-${size}.png`);
  }

  // Apple touch icon (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(join(iconsDir, "apple-touch-icon.png"));
  console.log("✓ apple-touch-icon.png");

  // Favicon 32x32
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(join(iconsDir, "favicon-32x32.png"));
  console.log("✓ favicon-32x32.png");

  // Favicon 16x16
  await sharp(svgBuffer)
    .resize(16, 16)
    .png()
    .toFile(join(iconsDir, "favicon-16x16.png"));
  console.log("✓ favicon-16x16.png");

  console.log("\nAll icons generated!");
}

generate().catch(console.error);
