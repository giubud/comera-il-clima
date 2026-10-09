import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { assertCityDataset } from '../src/data/schema';

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

test('tema e ordinamento persistono localmente senza entrare nel URL', async ({ page }) => {
  await page.goto('?city=roma&metric=meanTemperatureC');
  await page.getByRole('button', { name: 'Scuro' }).click();
  await page.getByRole('combobox', { name: 'Ordina città' }).selectOption('alpha');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('combobox', { name: 'Ordina città' })).toHaveValue('alpha');
  await expect(page).not.toHaveURL(/theme|sort/);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('combobox', { name: 'Ordina città' })).toHaveValue('alpha');
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
  const dataset: unknown = JSON.parse(await readFile('public/data/roma.json', 'utf8'));
  assertCityDataset(dataset);
  const lines = csv.split('\n').filter(Boolean);
  expect(lines[0]).toBe('year,mean_temperature_c,hot_days_max_gt_30_c,precipitation_mm');
  const records = lines.slice(1).map((line) => line.split(','));
  expect(records).toEqual(dataset.years.map((summer) => [
    String(summer.year),
    summer.meanTemperatureC.toFixed(1),
    String(summer.hotDays),
    summer.precipitationMm.toFixed(1),
  ]));
});

test('il confronto mostra tutte le città e nove valori per riga', async ({ page }) => {
  await page.goto('?city=roma&metric=precipitationMm');
  const rows = page.locator('.comparison tbody tr');
  await expect(rows).toHaveCount(10);
  await expect(rows.first().locator('td')).toHaveCount(9);
  await page.getByRole('combobox', { name: 'Ordina città' }).selectOption('delta');
  const changes = (await rows.locator('td:nth-child(10)').allTextContents()).map((text) => Number(text.replace('−', '-').replace(',', '.')));
  expect(changes).toEqual([...changes].sort((a, b) => a - b));
});

test('periodi, anno e confronto città restano nel link e aggiornano i valori', async ({ page }) => {
  await page.goto('?city=roma&metric=meanTemperatureC');
  await page.getByRole('combobox', { name: 'Confronto rapido' }).selectOption('decades');
  await expect(page).toHaveURL(/a=1961-1970&b=2011-2020/);
  await page.getByRole('combobox', { name: "Confronta con un'altra città" }).selectOption('milano');
  await page.getByRole('button', { name: '2003', exact: true }).first().click();
  await expect(page).toHaveURL(/vs=milano&year=2003/);
  await expect(page.getByRole('heading', { name: 'L’estate del 2003' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'L’estate del 2003' })).toBeVisible();
});

test('giorni annuali interi e medie decimali in tutte le viste', async ({ page }) => {
  await page.goto('?city=roma&metric=hotDays&year=2003');
  await expect(page.locator('.year-cards strong')).toHaveText([
    '27,4 °C', '81 giorni', '34,9 mm',
  ]);
  const chartPoint = page.locator('.chart-point[data-year="2003"]');
  await expect(chartPoint).toHaveAttribute('aria-label', 'Estate 2003: 81 giorni');
  await expect(chartPoint.locator('title')).toHaveText('2003: 81 giorni');
  await expect(page.locator('.stripe[data-year="2003"]'))
    .toHaveAttribute('title', '2003: 81 giorni');
  const cityValues = page.locator('.year-city span');
  await expect(cityValues).toHaveCount(10);
  for (const value of await cityValues.allTextContents()) {
    expect(value).toMatch(/^\d+ giorni$/);
  }
  await expect(page.locator('.year-city[data-city="roma"] span')).toHaveText('81 giorni');
  await expect(page.locator('.chart-footer')).toContainText('Media A 31,7 giorni');
  await expect(page.locator('.chart-footer')).toContainText('Media B 53,8 giorni');
  await expect(page.locator('.metric-card[data-metric="hotDays"] .metric-periods'))
    .toHaveText('A 31,7 → B 53,8');
  const comparison = page.locator('.comparison tr').filter({
    has: page.getByRole('button', { name: 'Roma', exact: true }),
  });
  await expect(comparison.locator('td').nth(3)).toHaveText('31,7');
  await expect(comparison.locator('td').nth(4)).toHaveText('53,8');
  const annualRow = page.locator('.annual tbody tr').filter({
    has: page.getByRole('button', { name: '2003', exact: true }),
  });
  await expect(annualRow.locator('td').nth(2)).toHaveText('81');
  await page.reload();
  await expect(page.locator('.year-cards strong').nth(1)).toHaveText('81 giorni');
});

test('mappa locale navigabile da tastiera e archivio di 60 estati', async ({ page }) => {
  await page.goto('?city=roma&metric=meanTemperatureC');
  const mapCity = page.locator('.map-point[data-city="napoli"]');
  await expect(mapCity).toBeVisible();
  await mapCity.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Napoli · estate' })).toBeVisible();
  await expect(page.locator('.annual tbody tr')).toHaveCount(60);
  await page.getByRole('checkbox', { name: 'Media mobile (5)' }).check();
  await expect(page).toHaveURL(/smooth=1/);
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

test('mostra licenze, attribuzioni e limiti insieme ai dati', async ({ page }) => {
  await page.goto('?city=roma&metric=meanTemperatureC');
  await expect(page.getByRole('heading', { name: 'Roma · estate' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Fonti, licenze e avvertenze' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'CC BY 4.0' })).toHaveAttribute('href', 'https://creativecommons.org/licenses/by/4.0/');
  await expect(page.getByRole('link', { name: 'MIT' })).toHaveAttribute('href', /\/LICENSE$/);
  await expect(page.getByRole('link', { name: /ERA5 del Copernicus Climate Change Service/ })).toHaveAttribute('href', /cds\.climate\.copernicus\.eu/);
  await expect(page.getByText(/Contiene informazioni modificate del Copernicus Climate Change Service/)).toBeVisible();
  await expect(page.getByText(/Né la Commissione europea né ECMWF sono responsabili/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Licenze e attribuzioni complete' })).toHaveAttribute('href', /DATA_LICENSE\.md$/);
});
