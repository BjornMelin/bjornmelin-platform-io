import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { allImageWidths } from "../src/lib/config/image-sizes.mjs";

const cwd = process.cwd();
const publicDir = path.join(cwd, "public");
const variantsDir = path.join(publicDir, "_images");

const widths = allImageWidths;

const isRasterSource = (ext) =>
  ext === ".png" || ext === ".jpg" || ext === ".jpeg" || ext === ".webp";

const walk = async (dir) => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip generated variants to avoid infinite recursion.
      if (absPath === variantsDir) continue;
      files.push(...(await walk(absPath)));
      continue;
    }
    if (entry.isFile()) files.push(absPath);
  }

  return files;
};

const ensureDir = async (filePath) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
};

const isNewerThan = async (sourcePath, targetPath) => {
  try {
    const [sourceStat, targetStat] = await Promise.all([fs.stat(sourcePath), fs.stat(targetPath)]);
    return targetStat.mtimeMs >= sourceStat.mtimeMs;
  } catch {
    return false;
  }
};

const toPosix = (p) => p.split(path.sep).join(path.posix.sep);

const buildVariantPaths = (relativeSourcePathNoExt, width) => {
  const rel = `${relativeSourcePathNoExt}_${width}.webp`;
  const abs = path.join(variantsDir, rel);
  return { rel: toPosix(path.posix.join("/_images", rel)), abs };
};

const generateForFile = async (absSourcePath) => {
  const relativeSourcePath = path.relative(publicDir, absSourcePath);
  const relativeSourcePathPosix = toPosix(relativeSourcePath);
  const ext = path.extname(relativeSourcePath).toLowerCase();

  if (!isRasterSource(ext)) return { source: relativeSourcePathPosix, generated: 0, skipped: 0 };
  if (relativeSourcePathPosix.startsWith("_images/")) {
    return { source: relativeSourcePathPosix, generated: 0, skipped: 0 };
  }

  const relativeNoExt = toPosix(relativeSourcePath.slice(0, -ext.length));
  const image = sharp(absSourcePath, { failOn: "none" });
  const meta = await image.metadata();
  const sourceWidth = meta.width ?? 0;

  // If we can't read width metadata, skip.
  if (sourceWidth <= 0) return { source: relativeSourcePath, generated: 0, skipped: 0 };

  let generated = 0;
  let skipped = 0;

  for (const width of widths) {
    const { abs: absVariantPath } = buildVariantPaths(relativeNoExt, width);
    if (await isNewerThan(absSourcePath, absVariantPath)) {
      skipped += 1;
      continue;
    }

    await ensureDir(absVariantPath);

    // Recreate sharp pipeline per variant (sharp instances are not reusable across toFile calls).
    await sharp(absSourcePath, { failOn: "none" })
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(absVariantPath);

    generated += 1;
  }

  return { source: relativeSourcePath, generated, skipped };
};

const main = async () => {
  try {
    await fs.access(publicDir);
  } catch {
    // eslint-disable-next-line no-console
    console.log(`images: ${publicDir} not found, skipping variant generation`);
    return;
  }

  await fs.mkdir(variantsDir, { recursive: true });

  const files = await walk(publicDir);
  const results = [];

  for (const file of files) {
    results.push(await generateForFile(file));
  }

  const totals = results.reduce(
    (acc, r) => {
      acc.generated += r.generated;
      acc.skipped += r.skipped;
      return acc;
    },
    { generated: 0, skipped: 0 },
  );

  // Keep output terse in dev/CI logs.
  if (totals.generated > 0) {
    // eslint-disable-next-line no-console
    console.log(
      `images: generated ${totals.generated} variant(s) (skipped ${totals.skipped}) into public/_images/`,
    );
  }
};

await main();
