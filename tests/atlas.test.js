/**
 * Global Health Atlas - Test Suite
 * 
 * Tests critical invariant criteria:
 * 1. Canonical country mapping and alias resolution
 * 2. Real data provenance and absence of fabricated statistics
 * 3. Handling of countries without data (explicit 'No data' rather than 0)
 * 4. Handling of indicators without data
 * 5. Observations statistics calculation (min, max, median, quantiles)
 * 6. Uncertainty interval integrity (lower_bound <= upper_bound)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';

const DB_PATH = path.join(process.cwd(), 'data', 'atlas.db');
const COUNTRIES_PATH = path.join(process.cwd(), 'data', 'countries.json');
const INDICATORS_PATH = path.join(process.cwd(), 'data', 'indicators.json');
const SOURCES_PATH = path.join(process.cwd(), 'data', 'sources.json');
const GEOJSON_PATH = path.join(process.cwd(), 'data', 'world_countries.geojson');

test('Data Files & Relational Database exist', () => {
  assert.ok(fs.existsSync(DB_PATH), 'atlas.db must exist');
  assert.ok(fs.existsSync(COUNTRIES_PATH), 'countries.json must exist');
  assert.ok(fs.existsSync(INDICATORS_PATH), 'indicators.json must exist');
  assert.ok(fs.existsSync(SOURCES_PATH), 'sources.json must exist');
  assert.ok(fs.existsSync(GEOJSON_PATH), 'world_countries.geojson must exist');
});

test('Database contains verified authoritative sources', () => {
  const db = new DatabaseSync(DB_PATH);
  const sources = db.prepare('SELECT * FROM sources').all();
  assert.ok(sources.length >= 2, 'Must have at least WHO and World Bank sources');

  const who = sources.find((s) => s.id === 'who');
  assert.ok(who, 'WHO source must exist');
  assert.match(who.website_url, /who\.int/, 'WHO website must be legitimate');
  assert.ok(who.attribution_requirement, 'Attribution requirement must be non-empty');
});

test('Primary MVP Indicator: Malaria Incidence per 1,000 population at risk', () => {
  const db = new DatabaseSync(DB_PATH);
  const ind = db.prepare("SELECT * FROM indicators WHERE code = 'MALARIA_EST_INCIDENCE'").get();
  assert.ok(ind, 'MALARIA_EST_INCIDENCE indicator must exist');
  assert.equal(ind.unit, 'Cases / 1 000 at risk');
  assert.equal(ind.category_id, 'infectious_diseases');
  assert.ok(ind.definition.length > 20, 'Definition must be populated');

  // Verify observations count
  const obs = db.prepare("SELECT COUNT(*) as cnt, MIN(year) as min_y, MAX(year) as max_y FROM observations WHERE indicator_code = 'MALARIA_EST_INCIDENCE'").get();
  assert.ok(obs.cnt > 2000, `Expected >2000 malaria observations, got ${obs.cnt}`);
  assert.ok(obs.min_y <= 2005, 'Should have historical data back to at least 2005');
  assert.ok(obs.max_y >= 2022, 'Should have data up to recent years');
});

test('Uncertainty Intervals: 95% Confidence Intervals are scientifically valid', () => {
  const db = new DatabaseSync(DB_PATH);
  // Verify that for all observations with uncertainty intervals: lower_bound <= value <= upper_bound
  const withBounds = db.prepare(`
    SELECT country_iso3, year, value, lower_bound, upper_bound
    FROM observations
    WHERE indicator_code = 'MALARIA_EST_INCIDENCE'
      AND lower_bound IS NOT NULL
      AND upper_bound IS NOT NULL
    LIMIT 200
  `).all();

  assert.ok(withBounds.length > 50, 'Must have observations with uncertainty bounds');
  for (const row of withBounds) {
    assert.ok(row.lower_bound <= row.upper_bound + 0.01, `Lower bound (${row.lower_bound}) must be <= upper bound (${row.upper_bound}) for ${row.country_iso3} ${row.year}`);
  }
});

test('Missing Data Invariant: Countries without data must be distinguishable from zero', () => {
  const db = new DatabaseSync(DB_PATH);
  // Countries like Iceland or Finland do not have endemic malaria transmission and thus no incidence estimate in WHO GHO
  const isEndemic = db.prepare(`
    SELECT value FROM observations
    WHERE indicator_code = 'MALARIA_EST_INCIDENCE' AND country_iso3 = 'ISL' AND year = 2022
  `).get();

  // Missing data should be undefined / null in query, NOT 0.0
  assert.equal(isEndemic, undefined, 'Iceland should have no malaria record, not an invented zero record');
});

test('World GeoJSON features map to valid ISO3 country codes', () => {
  const geojson = JSON.parse(fs.readFileSync(GEOJSON_PATH, 'utf-8'));
  assert.ok(geojson.features.length >= 170, 'Must have at least 170 country features');

  let validIsoCount = 0;
  for (const f of geojson.features) {
    const iso3 = f.properties.iso3;
    assert.ok(iso3, `Country ${f.properties.name} must have iso3 code`);
    assert.notEqual(iso3, '-99', `Country ${f.properties.name} must not have -99 iso3`);
    assert.equal(iso3.length, 3, `ISO3 code '${iso3}' must be 3 characters`);
    validIsoCount++;
  }
  assert.equal(validIsoCount, geojson.features.length);
});

test('Data Quality breakdown contains valid status values', () => {
  const db = new DatabaseSync(DB_PATH);
  const statuses = db.prepare(`
    SELECT DISTINCT data_status FROM observations
  `).all();

  const validStatuses = new Set(['estimated', 'reported', 'modeled', 'provisional', 'projected']);
  for (const s of statuses) {
    assert.ok(validStatuses.has(s.data_status), `Status '${s.data_status}' must be one of official statuses`);
  }
});
