import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('sceglie città e indicatore e conserva lo stato dopo il reload', async ({ page }) => {
  await page.goto('?city=roma&metric=meanTemperatureC');
  await expect(page.getByText(/A Roma, la temperatura media estiva/)).toBeVisible();
  await page.locator('#city-select').selectOption('milano');
  await page.getByRole('radio', { name: 'Giorni >30 °C' }).click();
  await expect(page).toHaveURL(/city=milano&metric=hotDays/);
  await expect(page.getByText(/A Milano, il numero medio/)).toBeVisible();
  await page.reload();
  await expect(page.locator('#city-select')).toHaveValue('milano');
  await expect(page.getByRole('radio', { name: 'Giorni >30 °C' })).toHaveAttribute('aria-checked', 'true');
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
  await expect(page.getByText(/A Roma,/)).toBeVisible();
  await page.locator('#city-select').selectOption('milano');
  await page.locator('#city-select').selectOption('bari');
  await expect(page.getByText(/A Bari,/)).toBeVisible();
  await expect(page.getByText(/A Milano,/)).toHaveCount(0);
});

test('esporta un CSV completo con decimali a punto', async ({ page }) => {
  await page.goto('?city=roma&metric=precipitationMm');
  await expect(page.getByText(/A Roma,/)).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Scarica CSV' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('comera-il-clima-roma.csv');
  const path = await download.path();
  expect(path).not.toBeNull();
  const csv = await readFile(path!, 'utf8');
  expect(csv.split('\n').filter(Boolean)).toHaveLength(61);
  expect(csv).toMatch(/^year,mean_temperature_c,hot_days_max_gt_30_c,precipitation_mm\n1961,23\.7,40,62\.1/m);
});

test('i controlli principali sono raggiungibili da tastiera', async ({ page }) => {
  await page.goto('?city=roma&metric=meanTemperatureC');
  await expect(page.getByText(/A Roma,/)).toBeVisible();
  await page.locator('#city-select').focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('radio', { name: 'Temperatura media' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('radio', { name: 'Giorni >30 °C' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('radio', { name: 'Giorni >30 °C' })).toHaveAttribute('aria-checked', 'true');
});

