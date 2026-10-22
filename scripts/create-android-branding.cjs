// Generates the Triviaverse Android launcher icons, adaptive icon layers, native splash screens and the
// Play Store icon from public/quiz-logo.png (Triviaverse). Run: node scripts/create-android-branding.cjs
const sharp = require('sharp');
const fs = require('node:fs/promises');

const SRC = 'public/quiz-logo.png';
const RES = 'android-branding/triviaverse'; // then apply with: node scripts/android-brand.cjs triviaverse
const NAVY = { r: 11, g: 5, b: 59, alpha: 1 }; // sampled from the logo background

const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
const SPLASH = {
  'drawable': [480, 480],
  'drawable-land-mdpi': [480, 320], 'drawable-land-hdpi': [800, 480], 'drawable-land-xhdpi': [1280, 720], 'drawable-land-xxhdpi': [1600, 960], 'drawable-land-xxxhdpi': [1920, 1280],
  'drawable-port-mdpi': [320, 480], 'drawable-port-hdpi': [480, 800], 'drawable-port-xhdpi': [720, 1280], 'drawable-port-xxhdpi': [960, 1600], 'drawable-port-xxxhdpi': [1280, 1920],
};

const circleMask = (px) => Buffer.from(`<svg width="${px}" height="${px}"><circle cx="${px / 2}" cy="${px / 2}" r="${px / 2}" fill="#fff"/></svg>`);
const squareOnNavy = (px) => sharp(SRC).resize(px, px).flatten({ background: NAVY }).png();

(async () => {
  for (const [d, scale] of Object.entries(DENSITIES)) {
    const dir = `${RES}/mipmap-${d}`;
    const px = Math.round(48 * scale);
    // Legacy launcher icon: full-bleed square (Android masks it on launchers that need to).
    await squareOnNavy(px).toFile(`${dir}/ic_launcher.png`);
    // Round legacy icon.
    await sharp(await squareOnNavy(px).toBuffer())
      .composite([{ input: circleMask(px), blend: 'dest-in' }]).png().toFile(`${dir}/ic_launcher_round.png`);
    // Adaptive foreground: 108dp canvas, logo scaled so its artwork sits inside the 66dp safe zone.
    const canvas = Math.round(108 * scale);
    const logo = Math.round(canvas * 0.88);
    await sharp({ create: { width: canvas, height: canvas, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: await sharp(SRC).resize(logo, logo).png().toBuffer(), gravity: 'centre' }])
      .png().toFile(`${dir}/ic_launcher_foreground.png`);
  }
  await fs.writeFile(`${RES}/values/ic_launcher_background.xml`,
    `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#0B053B</color>\n</resources>\n`);

  for (const [dir, [w, h]] of Object.entries(SPLASH)) {
    const logo = Math.round(Math.min(w, h) * 0.5);
    await sharp({ create: { width: w, height: h, channels: 3, background: NAVY } })
      .composite([{ input: await sharp(SRC).resize(logo, logo).png().toBuffer(), gravity: 'centre' }])
      .png().toFile(`${RES}/${dir}/splash.png`);
  }

  await fs.mkdir('google-play', { recursive: true });
  await sharp(SRC).resize(512, 512).flatten({ background: NAVY }).ensureAlpha().png().toFile('google-play/logo-512.png');
  console.log('Triviaverse launcher icons, adaptive layers, splash screens and Play Store icon written.');
})().catch((e) => { console.error(e); process.exit(1); });
