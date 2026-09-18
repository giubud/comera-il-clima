import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const output = join(process.cwd(), 'docs', 'screenshots');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.CI ? {} : { channel: 'msedge' }) });
const page = await browser.newPage();
for (const viewport of [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'tablet', width: 768, height: 900 },
  { name: 'mobile', width: 360, height: 800 },
]) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.goto('http://127.0.0.1:4173/comera-il-clima/?city=roma&metric=meanTemperatureC');
  await page.getByRole('heading', { name: 'Roma · estate' }).waitFor();
  await page.screenshot({ path: join(output, `${viewport.name}.png`), fullPage: true });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  if (overflow) throw new Error(`Overflow orizzontale della pagina a ${viewport.width}px.`);
}
await page.setViewportSize({ width: 1440, height: 1000 });
await page.getByRole('button', { name: 'Scuro' }).click();
await page.screenshot({ path: join(output, 'desktop-dark.png'), fullPage: true });
await browser.close();
console.log('Screenshot desktop, dark, tablet e mobile acquisiti senza overflow della pagina.');
