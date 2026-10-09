// Captures the actual quiz UI with an isolated local fixture. Blocks cloud traffic.
const path = require('node:path');
const fs = require('node:fs/promises');
const sharp = require('sharp');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

(async () => {
  const destination = path.resolve('google-play');
  await fs.mkdir(path.join(destination, 'screenshots'), { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 693 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      return url.hostname === '127.0.0.1' ? route.continue() : route.abort();
    });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    await page.goto('http://127.0.0.1:3000');
    await page.waitForFunction(() => localStorage.getItem('wordgame_state_v1'));
    await page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem('wordgame_state_v1'));
      state.users = [{ id: 1001, name: 'Quiz Learner', mobile: '9000000000', password: '', email: '', balance: 0, status: 'active', betting: false, joined: '2026-10-09 10:00', lastLogin: null, loggedIn: true, bank: { holder: '', bank: '', account: '', ifsc: '', address: '' }, paytm: '', phonepe: '', gpay: '', upi: '' }];
      localStorage.setItem('wordgame_state_v1', JSON.stringify(state));
      localStorage.setItem('wg_session', '1001');
    });
    await page.reload();
    await page.getByRole('button', { name: 'Play Daily Quiz' }).waitFor();
    await page.evaluate(() => document.fonts.ready);
    // Hide development tooling only; application UI is unchanged.
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
    const capture = async name => {
      await page.screenshot({ path: path.join(destination, 'screenshots', name), animations: 'disabled' });
      const file = path.join(destination, 'screenshots', name);
      const image = await sharp(file).resize(1080, 1920, { fit: 'fill' }).removeAlpha().png().toBuffer();
      await fs.writeFile(file, image);
    };
    await capture('01-quiz-home.png');
    await page.getByRole('button', { name: 'Play Daily Quiz' }).click();
    await page.getByText('Questions 1 of 10', { exact: false }).waitFor();
    await capture('02-daily-quiz.png');
    for (let i = 0; i < 9; i++) {
      await page.locator('button.border-2').first().click();
      await page.getByRole('button', { name: 'Next', exact: true }).click();
    }
    await page.getByRole('button', { name: 'Submit Quiz', exact: true }).click();
    await page.getByRole('button', { name: /Explore Markets/ }).waitFor();
    await page.getByText('Quiz completed! View your score below.', { exact: true }).waitFor({ state: 'hidden' });
    await capture('03-quiz-result.png');
    await page.getByRole('button', { name: /Explore Markets/ }).click();
    await page.getByRole('button', { name: 'Quiz Rules', exact: true }).click();
    await capture('04-quiz-guidelines.png');
    for (const route of ['privacy-policy', 'delete-account']) {
      const response = await page.goto(`http://127.0.0.1:3000/${route}`);
      if (response.status() !== 200) throw new Error(`${route}: ${response.status()}`);
      await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
      await page.screenshot({ path: path.join(destination, `${route}-preview.png`), fullPage: true });
    }
    console.log('Captured four quiz-mode screenshots and verified both policy routes.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
