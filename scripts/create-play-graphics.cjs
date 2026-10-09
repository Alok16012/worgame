const sharp = require('sharp');
const fs = require('node:fs/promises');

(async () => {
  await fs.mkdir('google-play', { recursive: true });
  await sharp('public/icon-512.png').resize(512, 512).ensureAlpha().png().toFile('google-play/logo-512.png');
  const banner = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
    <defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#092254"/><stop offset="1" stop-color="#224caa"/></linearGradient><linearGradient id="gold" x2="1" y2="1"><stop stop-color="#ffe6a3"/><stop offset="1" stop-color="#f3b72e"/></linearGradient></defs>
    <rect width="1024" height="500" fill="url(#bg)"/>
    <circle cx="950" cy="40" r="260" fill="none" stroke="#ffffff" stroke-opacity=".07" stroke-width="60"/>
    <circle cx="70" cy="520" r="220" fill="none" stroke="#ffffff" stroke-opacity=".04" stroke-width="50"/>
    <path d="M76 116h48" stroke="#f5c542" stroke-width="5" stroke-linecap="round"/>
    <text x="76" y="172" font-family="Arial,sans-serif" font-size="28" font-weight="700" letter-spacing="4" fill="#f8d77c">SHRI KALYAN</text>
    <text x="72" y="253" font-family="Arial,sans-serif" font-size="62" font-weight="700" fill="white">A daily spark</text>
    <text x="72" y="326" font-family="Arial,sans-serif" font-size="62" font-weight="700" fill="url(#gold)">for your mind.</text>
    <text x="76" y="381" font-family="Arial,sans-serif" font-size="23" fill="#cfddff">Quizzes · Questions · Ideas</text>
    <g transform="translate(718 122) rotate(9 108 125)">
      <rect width="204" height="252" rx="26" fill="#ffffff" fill-opacity=".12" stroke="#b8cdff" stroke-opacity=".35"/>
      <text x="102" y="112" text-anchor="middle" font-family="Arial,sans-serif" font-size="90" font-weight="700" fill="#ffe09a">?</text>
      <rect x="32" y="143" width="140" height="28" rx="10" fill="white" fill-opacity=".17"/>
      <rect x="32" y="184" width="140" height="28" rx="10" fill="#f5c542"/>
      <path d="m91 196 7 7 15-17" stroke="#13306f" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </svg>`;
  await fs.writeFile('google-play/banner-source.svg', banner);
  await sharp(Buffer.from(banner)).removeAlpha().png().toFile('google-play/banner-1024x500.png');
  console.log('Created 512px RGBA logo and 1024×500 RGB quiz banner.');
})().catch(error => { console.error(error); process.exit(1); });
