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

  const routes = [
    { url: 'http://localhost:3000', file: 'v2_home.png' },
    { url: 'http://localhost:3000/radar', file: 'v2_radar.png' },
    { url: 'http://localhost:3000/create', file: 'v2_create.png' },
    { url: 'http://localhost:3000/room/101', file: 'v2_room.png' },
    { url: 'http://localhost:3000/broker', file: 'v2_broker.png' },
  ];

  for (const route of routes) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    console.log(`Navigating to ${route.url}...`);
    try {
      await page.goto(route.url, { waitUntil: 'networkidle0', timeout: 30000 });
      const outputPath = path.join(__dirname, '..', 'public', route.file);
      await page.screenshot({ path: outputPath, fullPage: true });
      console.log(`Screenshot saved to: ${outputPath}`);
    } catch (e) {
      console.error(`Failed to capture ${route.url}:`, e.message);
    } finally {
      await page.close();
    }
  }

  await browser.close();
}

captureAll().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});
