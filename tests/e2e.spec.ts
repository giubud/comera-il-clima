import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('naviga tra le dieci città e conserva città e indicatore nel URL', async ({ page }) => {
  await page.goto('?city=roma&metric=meanTemperatureC');
  await expect(page.getByRole('heading', { name: 'Roma · estate' })).toBeVisible();
  const rail = page.getByRole('complementary', { name: 'Città' });
  await expect(rail.locator('[data-city]')).toHaveCount(10);
  await rail.getByRole('button', { name: /Milano/ }).click();
  await page.getByRole('radio', { name: 'Giorni >30 °C' }).click();
  await expect(page).toHaveURL(/city=milano&metric=hotDays/);
  await expect(page.getByRole('heading', { name: 'Milano · estate' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Milano · estate' })).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Giorni >30 °C' })).toHaveAttribute('aria-checked', 'true');
});

test('tema e densità persistono localmente senza entrare nel URL', async ({ page }) => {
  await page.goto('?city=roma&metric=meanTemperatureC');
  await page.getByRole('button', { name: 'Scuro' }).click();
  await page.getByRole('button', { name: 'Compatta' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('html')).toHaveAttribute('data-density', 'compact');
  await expect(page).not.toHaveURL(/theme|density/);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('html')).toHaveAttribute('data-density', 'compact');
});

test('mostra un errore leggibile e il comando di riprova', async ({ page }) => {
  await page.route('**/data/roma.json', (route) => route.abort('failed'));
  await page.goto('?city=roma&metric=meanTemperatureC');
  await expect(page.getByRole('alert')).toContainText('Non è stato possibile caricare i dati');
  await expect(page.getByRole('button', { name: 'Riprova' })).toBeVisible();
});

test('un cambio rapido non associa i dati vecchi alla nuova città', async ({ page }) => {
  await page.route('**/data/milano.json', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 350));
    await route.continue();
  });
  await page.goto('?city=roma&metric=meanTemperatureC');
  const rail = page.getByRole('complementary', { name: 'Città' });
  await rail.getByRole('button', { name: /Milano/ }).click();
  await rail.getByRole('button', { name: /Bari/ }).click();
  await expect(page.getByRole('heading', { name: 'Bari · estate' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Milano · estate' })).toHaveCount(0);
});

test('esporta un CSV completo con decimali a punto', async ({ page }) => {
  await page.goto('?city=roma&metric=precipitationMm');
  await expect(page.getByRole('heading', { name: 'Roma · estate' })).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'CSV ↓' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('comera-il-clima-roma.csv');
  const path = await download.path();
  const csv = await readFile(path!, 'utf8');
  expect(csv.split('\n').filter(Boolean)).toHaveLength(61);
  expect(csv).toMatch(/^year,mean_temperature_c,hot_days_max_gt_30_c,precipitation_mm\n1961,23\.7,40,62\.1/m);
});

test('la classifica pioggia è ordinata per delta crescente', async ({ page }) => {
  await page.goto('?city=roma&metric=precipitationMm');
  const ranking = page.getByRole('region', { name: 'Confronto città' });
  const labels = await ranking.locator('.rank-row strong').allTextContents();
  const manifest = JSON.parse(await readFile('public/data/manifest.json', 'utf8')) as { cities: { name: string; periods: { a: { precipitationMm: number }; b: { precipitationMm: number } } }[] };
  const expected = manifest.cities.slice().sort((a, b) =>
    (a.periods.b.precipitationMm - a.periods.a.precipitationMm) - (b.periods.b.precipitationMm - b.periods.a.precipitationMm)
  ).map((city) => city.name);
  expect(labels).toEqual(expected);
});

test('i controlli principali sono raggiungibili da tastiera', async ({ page }) => {
  await page.goto('?city=roma&metric=meanTemperatureC');
  const radio = page.getByRole('radio', { name: 'Giorni >30 °C' });
  await radio.focus();
  await page.keyboard.press('Enter');
  await expect(radio).toHaveAttribute('aria-checked', 'true');
  const city = page.getByRole('complementary', { name: 'Città' }).getByRole('button', { name: /Napoli/ });
  await city.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Napoli · estate' })).toBeVisible();
});
