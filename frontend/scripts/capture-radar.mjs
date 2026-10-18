import puppeteer from 'puppeteer-core';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function captureRadar() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    headless: 'new'
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  
  await page.goto('http://localhost:3000/radar', { waitUntil: 'networkidle0', timeout: 30000 });
  const out = path.join(__dirname, '..', 'public', 'screenshot_radar.png');
  await page.screenshot({ path: out, fullPage: true });
  console.log('Saved:', out);

  await browser.close();
}

captureRadar().catch(err => {
  console.error(err);
  process.exit(1);
});
