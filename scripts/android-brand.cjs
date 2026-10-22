// Switch the Android launcher branding (app name, launcher icons, adaptive layers, splash screens).
//   node scripts/android-brand.cjs shrikalyan   -> Shri Kalyan (default, betting app)
//   node scripts/android-brand.cjs triviaverse  -> Triviaverse (quiz-mode build for Play Store)
// Asset sets live in android-branding/<brand>/ and are copied over android/app/src/main/res.
const fs = require('node:fs');
const path = require('node:path');

const NAMES = { shrikalyan: 'Shri Kalyan', triviaverse: 'Triviaverse' };
const brand = process.argv[2];
if (!NAMES[brand]) { console.error('Usage: node scripts/android-brand.cjs <shrikalyan|triviaverse>'); process.exit(1); }

const src = path.join('android-branding', brand);
const res = path.join('android', 'app', 'src', 'main', 'res');
let n = 0;
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    const dest = path.join(res, path.relative(src, p));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(p, dest);
    n++;
  }
};
walk(src);

const cfg = 'capacitor.config.ts';
fs.writeFileSync(cfg, fs.readFileSync(cfg, 'utf8').replace(/appName: "[^"]*"/, `appName: "${NAMES[brand]}"`));
console.log(`Android branding set to ${NAMES[brand]} (${n} files copied into ${res}).`);
