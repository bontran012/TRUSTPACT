import puppeteer from 'puppeteer-core';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function captureAll() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    headless: 'new'
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  
  const pages = [
    { route: '/room/101', name: 'screenshot_room.png' },
    { route: '/broker', name: 'screenshot_broker.png' },
    { route: '/create', name: 'screenshot_create.png' }
  ];

  for (const p of pages) {
    console.log(`Navigating to http://localhost:3000${p.route}...`);
    await page.goto(`http://localhost:3000${p.route}`, { waitUntil: 'networkidle0', timeout: 30000 });
    const out = path.join(__dirname, '..', 'public', p.name);
    await page.screenshot({ path: out, fullPage: true });
    console.log(`Saved: ${out}`);
  }

  await browser.close();
}

captureAll().catch(err => {
  console.error(err);
  process.exit(1);
});
