import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const heroDir = path.join(root, "public", "assets", "hero");
const maxHeroBytes = 320 * 1024;
const heroWidths = [860, 1600];

function bytes(value) {
  return `${Math.round(value / 1024)} KiB`;
}

function isSourceImage(file) {
  return /\.(png|jpe?g)$/i.test(file) && !/-\d+\.(png|jpe?g)$/i.test(file);
}

async function writeHeroVariants(sourcePath) {
  const parsed = path.parse(sourcePath);
  const metadata = await sharp(sourcePath).metadata();
  const widths = [...new Set(heroWidths.filter((width) => width <= metadata.width || width === heroWidths[0]))];

  for (const width of widths) {
    const actualWidth = Math.min(width, metadata.width);
    const webpPath = path.join(parsed.dir, `${parsed.name}-${actualWidth}.webp`);
    const avifPath = path.join(parsed.dir, `${parsed.name}-${actualWidth}.avif`);

    await sharp(sourcePath)
      .resize({ width: actualWidth, withoutEnlargement: true })
      .webp({ quality: 72, effort: 6, smartSubsample: true })
      .toFile(webpPath);

    await sharp(sourcePath)
      .resize({ width: actualWidth, withoutEnlargement: true })
      .avif({ quality: 45, effort: 5 })
      .toFile(avifPath);

    const webpSize = fs.statSync(webpPath).size;
    if (actualWidth >= 1400 && webpSize > maxHeroBytes) {
      throw new Error(`${path.relative(root, webpPath)} is ${bytes(webpSize)}, expected <= ${bytes(maxHeroBytes)}`);
    }

    console.log(`Optimized ${path.relative(root, webpPath)} (${bytes(webpSize)})`);
  }
}

if (!fs.existsSync(heroDir)) {
  console.log("No hero image directory found.");
  process.exit(0);
}

const sources = fs.readdirSync(heroDir).filter(isSourceImage);
if (!sources.length) {
  throw new Error("No source hero PNG/JPEG files found in public/assets/hero.");
}

for (const source of sources) {
  await writeHeroVariants(path.join(heroDir, source));
}
