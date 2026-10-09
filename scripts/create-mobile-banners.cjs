const fs = require('node:fs/promises');
const sharp = require('sharp');

const designs = [
  { file: '01-daily-quiz', image: '01-quiz-home.png', tag: 'YOUR DAILY QUIZ SPACE', lines: ['A daily spark', 'for your mind.'], sub: 'Explore questions. Build your knowledge.', colors: ['#091b4c', '#244eb0'], accent: '#ffd572' },
  { file: '02-test-your-knowledge', image: '02-daily-quiz.png', tag: 'MULTIPLE CHOICE QUIZZES', lines: ['Think it through.', 'Choose your answer.'], sub: 'Ten questions. One focused challenge.', colors: ['#111342', '#5136a0'], accent: '#e0beff' },
  { file: '03-quiz-score', image: '03-quiz-result.png', tag: 'YOUR QUIZ SUMMARY', lines: ['See your score.', 'Keep learning.'], sub: 'Review your answers after every quiz.', colors: ['#052e3b', '#107780'], accent: '#a1f0d5' },
  { file: '04-timed-challenge', image: '02-daily-quiz.png', tag: 'A LITTLE TIME. A LOT TO THINK.', lines: ['Ready for your', '90-second quiz?'], sub: 'Put your knowledge to the test.', colors: ['#30132d', '#983951'], accent: '#ffd09e' },
  { file: '05-quiz-guidelines', image: '04-quiz-guidelines.png', tag: 'START WITH THE BASICS', lines: ['Learn the rules.', 'Find your rhythm.'], sub: 'Simple steps to your next quiz.', colors: ['#132247', '#355c88'], accent: '#f9dd85' },
];

(async () => {
  await fs.mkdir('google-play/mobile-banners', { recursive: true });
  const thumbnails = [];
  for (const [index, d] of designs.entries()) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920">
      <defs><linearGradient id="bg" x2=".8" y2="1"><stop stop-color="${d.colors[0]}"/><stop offset="1" stop-color="${d.colors[1]}"/></linearGradient></defs>
      <rect width="1080" height="1920" fill="url(#bg)"/>
      <circle cx="1100" cy="320" r="410" fill="none" stroke="white" stroke-opacity=".045" stroke-width="110"/>
      <circle cx="-80" cy="1620" r="400" fill="none" stroke="white" stroke-opacity=".035" stroke-width="75"/>
      <rect x="76" y="87" width="38" height="6" rx="3" fill="${d.accent}"/>
      <text x="132" y="102" font-family="Arial,sans-serif" font-weight="700" font-size="29" letter-spacing="4" fill="white">SHRI KALYAN</text>
      <text x="76" y="194" font-family="Arial,sans-serif" font-weight="700" font-size="23" letter-spacing="3" fill="${d.accent}">${d.tag}</text>
      <text x="70" y="292" font-family="Arial,sans-serif" font-weight="700" font-size="76" fill="white">${d.lines[0]}</text>
      <text x="70" y="382" font-family="Arial,sans-serif" font-weight="700" font-size="76" fill="${d.accent}">${d.lines[1]}</text>
      <text x="76" y="449" font-family="Arial,sans-serif" font-size="29" fill="#e0e8ff">${d.sub}</text>
      <rect x="176" y="540" width="728" height="1276" rx="33" fill="#030b20" fill-opacity=".3"/>
      <rect x="180" y="530" width="720" height="1280" fill="white"/>
      <text x="76" y="1875" font-family="Arial,sans-serif" font-size="22" letter-spacing="3" fill="#e0e8ff">QUIZ MODE</text>
      <text x="1004" y="1875" text-anchor="end" font-family="Arial,sans-serif" font-size="22" fill="${d.accent}">0${index + 1} / 05</text>
    </svg>`;
    const screenshot = await sharp(`google-play/screenshots/${d.image}`).resize(720, 1280).png().toBuffer();
    const file = `google-play/mobile-banners/${d.file}.png`;
    await sharp(Buffer.from(svg)).composite([{ input: screenshot, left: 180, top: 530 }]).removeAlpha().png().toFile(file);
    thumbnails.push(await sharp(file).resize(216, 384).png().toBuffer());
  }
  await sharp({ create: { width: 1080, height: 384, channels: 3, background: '#0b1d4f' } }).composite(thumbnails.map((input, index) => ({ input, left: index * 216, top: 0 }))).png().toFile('google-play/mobile-banners-preview.png');
  console.log('Created five 1080×1920 mobile banners and preview.');
})().catch(error => { console.error(error); process.exit(1); });
