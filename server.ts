/**
 * Global Health Atlas - Production Full-Stack Server
 * 
 * Provides high-performance REST API endpoints for global public health data,
 * vector GeoJSON boundaries, provenance tracking, and data quality metrics.
 * Mounts Vite dev middleware in development mode and static assets in production.
 */

import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { DatabaseSync } from 'node:sqlite';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// Database connection (SQLite relational database)
const DB_PATH = path.join(process.cwd(), 'data', 'atlas.db');
let db: DatabaseSync | null = null;

function getDb(): DatabaseSync {
  if (!db) {
    if (fs.existsSync(DB_PATH)) {
      db = new DatabaseSync(DB_PATH);
    } else {
      console.warn(`[Server] Database not found at ${DB_PATH}. Operating with fallback caches.`);
    }
  }
  return db!;
}

// In-memory GeoJSON cache for instant vector delivery
let cachedGeoJson: any = null;
function getGeoJson() {
  if (!cachedGeoJson) {
    const geoPath = path.join(process.cwd(), 'data', 'world_countries.geojson');
    if (fs.existsSync(geoPath)) {
      cachedGeoJson = JSON.parse(fs.readFileSync(geoPath, 'utf-8'));
    }
  }
  return cachedGeoJson;
}

// ==========================================
// REST API ENDPOINTS
// ==========================================

// 1. GET /api/metadata
app.get('/api/metadata', (_req: Request, res: Response) => {
  res.json({
    name: 'Global Health Atlas',
    version: '1.0.0',
    tagline: 'An interactive visual atlas of the health of the planet',
    concept: 'Exploration of verified global public health data geographically through interactive maps and time series.',
    primary_source: 'World Health Organization (WHO) Global Health Observatory',
    secondary_source: 'World Bank Open Data',
    retrieval_date: new Date().toISOString().split('T')[0],
    data_policy: 'Strictly verified public health data. Zero fabricated health statistics.',
    supported_domains: [
      'Infectious Diseases',
      'Demographics & Life Expectancy',
      'Maternal & Child Health',
      'Immunization & Vaccines',
      'Healthcare Systems & Financing',
      'Noncommunicable Diseases',
      'Mental Health',
      'Environmental Health'
    ]
  });
});

// 2. GET /api/sources
app.get('/api/sources', (_req: Request, res: Response) => {
  try {
    const database = getDb();
    if (database) {
      const stmt = database.prepare('SELECT * FROM sources');
      const sources = stmt.all();
      return res.json({ sources });
    }
  } catch (err) {
    console.error('Error querying sources:', err);
  }

  // Fallback to static sources cache
  const sourcesPath = path.join(process.cwd(), 'data', 'sources.json');
  if (fs.existsSync(sourcesPath)) {
    const sources = JSON.parse(fs.readFileSync(sourcesPath, 'utf-8'));
    return res.json({ sources });
  }

  res.status(500).json({ error: 'Sources data not available' });
});

// 3. GET /api/indicators
app.get('/api/indicators', (req: Request, res: Response) => {
  const categoryFilter = req.query.category as string | undefined;

  try {
    const database = getDb();
    if (database) {
      let query = `
        SELECT i.id, i.category_id, c.name as category_name, i.code, i.name, i.short_name,
               i.definition, i.unit, i.metric_type, i.default_classification, i.is_inverted,
               i.methodology, i.source_url, s.name as source_name, s.attribution_requirement,
               MIN(o.year) as min_year, MAX(o.year) as max_year, COUNT(o.id) as observation_count
        FROM indicators i
        JOIN categories c ON i.category_id = c.id
        JOIN datasets d ON i.dataset_id = d.id
        JOIN sources s ON d.source_id = s.id
        LEFT JOIN observations o ON i.code = o.indicator_code
      `;
      const params: any[] = [];
      if (categoryFilter) {
        query += ' WHERE i.category_id = ? ';
        params.push(categoryFilter);
      }
      query += ' GROUP BY i.id HAVING COUNT(o.id) > 0 ORDER BY c.sort_order, i.name ';

      const stmt = database.prepare(query);
      const rows = stmt.all(...params);
      return res.json({ indicators: rows });
    }
  } catch (err) {
    console.error('Error querying indicators:', err);
  }

  // Fallback to json cache
  const indPath = path.join(process.cwd(), 'data', 'indicators.json');
  if (fs.existsSync(indPath)) {
    let indicators = JSON.parse(fs.readFileSync(indPath, 'utf-8'));
    indicators = indicators.filter((i: any) => (i.observation_count ?? 0) > 0);
    if (categoryFilter) {
      indicators = indicators.filter((i: any) => i.category_id === categoryFilter);
    }
    return res.json({ indicators });
  }

  res.status(500).json({ error: 'Indicators data not available' });
});

// 4. GET /api/indicators/:id
app.get('/api/indicators/:id', (req: Request, res: Response) => {
  const indicatorId = req.params.id;

  try {
    const database = getDb();
    if (database) {
      const stmt = database.prepare(`
        SELECT i.*, c.name as category_name, s.name as source_name, s.license_name, s.attribution_requirement,
               MIN(o.year) as min_year, MAX(o.year) as max_year, COUNT(o.id) as observation_count
        FROM indicators i
        JOIN categories c ON i.category_id = c.id
        JOIN datasets d ON i.dataset_id = d.id
        JOIN sources s ON d.source_id = s.id
        LEFT JOIN observations o ON i.code = o.indicator_code
        WHERE i.id = ? OR i.code = ?
        GROUP BY i.id
      `);
      const ind = stmt.get(indicatorId, indicatorId);
      if (!ind) {
        return res.status(404).json({ error: `Indicator '${indicatorId}' not found` });
      }

      // Get available years for this indicator
      const yearsStmt = database.prepare(`
        SELECT DISTINCT year FROM observations WHERE indicator_code = ? ORDER BY year ASC
      `);
      const yearsRows = yearsStmt.all(ind.code as string);
      const availableYears = yearsRows.map((r: any) => r.year);

      return res.json({
        indicator: ind,
        available_years: availableYears
      });
    }
  } catch (err) {
    console.error('Error fetching indicator details:', err);
  }

  res.status(500).json({ error: 'Indicator details unavailable' });
});

// 5. GET /api/countries
app.get('/api/countries', (req: Request, res: Response) => {
  const region = req.query.region as string | undefined;
  const search = (req.query.search as string | undefined)?.toLowerCase();

  try {
    const database = getDb();
    if (database) {
      let query = 'SELECT * FROM countries';
      const conditions: string[] = [];
      const params: any[] = [];

      if (region && region !== 'ALL') {
        conditions.push('(who_region_code = ? OR who_region_name = ?)');
        params.push(region, region);
      }
      if (search) {
        conditions.push('(LOWER(name) LIKE ? OR LOWER(iso3) LIKE ?)');
        params.push(`%${search}%`, `%${search}%`);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      query += ' ORDER BY name ASC';

      const stmt = database.prepare(query);
      const countries = stmt.all(...params);
      return res.json({ countries });
    }
  } catch (err) {
    console.error('Error querying countries:', err);
  }

  const countriesPath = path.join(process.cwd(), 'data', 'countries.json');
  if (fs.existsSync(countriesPath)) {
    let countries = JSON.parse(fs.readFileSync(countriesPath, 'utf-8'));
    if (region && region !== 'ALL') {
      countries = countries.filter((c: any) => c.who_region_code === region || c.who_region_name === region);
    }
    if (search) {
      countries = countries.filter((c: any) => c.name.toLowerCase().includes(search) || c.iso3.toLowerCase().includes(search));
    }
    return res.json({ countries });
  }

  res.status(500).json({ error: 'Countries data unavailable' });
});

// 6. GET /api/countries/:id
app.get('/api/countries/:id', (req: Request, res: Response) => {
  const iso3 = req.params.id.toUpperCase();

  try {
    const database = getDb();
    if (database) {
      const countryStmt = database.prepare('SELECT * FROM countries WHERE iso3 = ?');
      const country = countryStmt.get(iso3);

      if (!country) {
        return res.status(404).json({ error: `Country '${iso3}' not found` });
      }

      // Fetch latest values for each indicator for this country
      const latestStmt = database.prepare(`
        SELECT o.indicator_code, i.name as indicator_name, i.short_name, i.unit, i.category_id,
               c.name as category_name, o.year, o.value, o.lower_bound, o.upper_bound,
               o.data_status, o.methodology_note, o.retrieved_at, s.name as source_name
        FROM observations o
        JOIN indicators i ON o.indicator_code = i.code
        JOIN categories c ON i.category_id = c.id
        JOIN sources s ON o.source_id = s.id
        WHERE o.country_iso3 = ?
          AND o.year = (
            SELECT MAX(year) FROM observations
            WHERE country_iso3 = o.country_iso3 AND indicator_code = o.indicator_code
          )
        ORDER BY c.sort_order, i.name
      `);
      const latestIndicators = latestStmt.all(iso3);

      return res.json({
        country,
        latest_indicators: latestIndicators
      });
    }
  } catch (err) {
    console.error('Error fetching country profile:', err);
  }

  res.status(500).json({ error: 'Country profile unavailable' });
});

// 7. GET /api/observations - Primary Map Choropleth Feed
app.get('/api/observations', (req: Request, res: Response) => {
  const indicatorCode = (req.query.indicator as string) || 'MALARIA_EST_INCIDENCE';
  const yearParam = req.query.year ? parseInt(req.query.year as string, 10) : null;
  const regionParam = req.query.region as string | undefined;

  try {
    const database = getDb();
    if (database) {
      // Determine year if not specified: pick the latest available year for this indicator
      let targetYear = yearParam;
      if (!targetYear) {
        const maxYearStmt = database.prepare(
          'SELECT MAX(year) as max_year FROM observations WHERE indicator_code = ?'
        );
        const row: any = maxYearStmt.get(indicatorCode);
        targetYear = row?.max_year || 2022;
      }

      let query = `
        SELECT o.country_iso3, c.name as country_name, c.who_region_code, c.who_region_name,
               o.year, o.value, o.unit, o.lower_bound, o.upper_bound, o.data_status,
               o.methodology_note, s.name as source_name, s.attribution_requirement
        FROM observations o
        JOIN countries c ON o.country_iso3 = c.iso3
        JOIN sources s ON o.source_id = s.id
        WHERE o.indicator_code = ? AND o.year = ?
      `;
      const params: any[] = [indicatorCode, targetYear];

      if (regionParam && regionParam !== 'ALL') {
        query += ' AND (c.who_region_code = ? OR c.who_region_name = ?) ';
        params.push(regionParam, regionParam);
      }

      query += ' ORDER BY o.value DESC';

      const stmt = database.prepare(query);
      const observations = stmt.all(...params);

      // Compute statistical distribution for scientific choropleth classification
      const values = observations.map((o: any) => o.value).filter((v: any) => typeof v === 'number' && !isNaN(v)).sort((a: number, b: number) => a - b);
      
      let stats = {
        count: values.length,
        min: values.length ? values[0] : 0,
        max: values.length ? values[values.length - 1] : 0,
        mean: values.length ? values.reduce((acc: number, cur: number) => acc + cur, 0) / values.length : 0,
        median: values.length ? values[Math.floor(values.length / 2)] : 0,
        q25: values.length ? values[Math.floor(values.length * 0.25)] : 0,
        q75: values.length ? values[Math.floor(values.length * 0.75)] : 0
      };

      // Create indexed map by ISO3 for immediate O(1) polygon binding in client
      const observationsByIso3: Record<string, any> = {};
      for (const obs of observations as any[]) {
        observationsByIso3[obs.country_iso3] = obs;
      }

      return res.json({
        indicator_code: indicatorCode,
        year: targetYear,
        stats,
        total_reporting: observations.length,
        observations: observationsByIso3,
        list: observations
      });
    }
  } catch (err) {
    console.error('Error querying observations:', err);
  }

  res.status(500).json({ error: 'Observations data unavailable' });
});

// 8. GET /api/trends - Multi-Country Time Series
app.get('/api/trends', (req: Request, res: Response) => {
  const indicatorCode = (req.query.indicator as string) || 'MALARIA_EST_INCIDENCE';
  const countriesParam = req.query.countries as string | undefined; // comma-separated ISO3

  try {
    const database = getDb();
    if (database) {
      let query = `
        SELECT o.country_iso3, c.name as country_name, o.year, o.value, o.unit,
               o.lower_bound, o.upper_bound, o.data_status
        FROM observations o
        JOIN countries c ON o.country_iso3 = c.iso3
        WHERE o.indicator_code = ?
      `;
      const params: any[] = [indicatorCode];

      if (countriesParam) {
        const isoList = countriesParam.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
        if (isoList.length > 0) {
          const placeholders = isoList.map(() => '?').join(',');
          query += ` AND o.country_iso3 IN (${placeholders}) `;
          params.push(...isoList);
        }
      }

      query += ' ORDER BY o.country_iso3, o.year ASC';

      const stmt = database.prepare(query);
      const rows = stmt.all(...params);

      // Group by country
      const trendsByCountry: Record<string, { country_iso3: string; country_name: string; data: any[] }> = {};
      for (const r of rows as any[]) {
        if (!trendsByCountry[r.country_iso3]) {
          trendsByCountry[r.country_iso3] = {
            country_iso3: r.country_iso3,
            country_name: r.country_name,
            data: []
          };
        }
        trendsByCountry[r.country_iso3].data.push({
          year: r.year,
          value: r.value,
          unit: r.unit,
          lower_bound: r.lower_bound,
          upper_bound: r.upper_bound,
          data_status: r.data_status
        });
      }

      return res.json({
        indicator_code: indicatorCode,
        trends: trendsByCountry
      });
    }
  } catch (err) {
    console.error('Error querying trends:', err);
  }

  res.status(500).json({ error: 'Trends data unavailable' });
});

// 9. GET /api/data-quality - Provenance and Uncertainty Audit
app.get('/api/data-quality', (_req: Request, res: Response) => {
  try {
    const database = getDb();
    if (database) {
      const summaryStmt = database.prepare(`
        SELECT 
          COUNT(*) as total_observations,
          COUNT(DISTINCT country_iso3) as total_countries_covered,
          COUNT(DISTINCT indicator_code) as total_indicators_active,
          SUM(CASE WHEN lower_bound IS NOT NULL AND upper_bound IS NOT NULL THEN 1 ELSE 0 END) as with_uncertainty_interval,
          SUM(CASE WHEN data_status = 'estimated' THEN 1 ELSE 0 END) as status_estimated,
          SUM(CASE WHEN data_status = 'reported' THEN 1 ELSE 0 END) as status_reported,
          SUM(CASE WHEN data_status = 'modeled' THEN 1 ELSE 0 END) as status_modeled
        FROM observations
      `);
      const summary = summaryStmt.get();

      const updatesStmt = database.prepare(`
        SELECT source_id, indicator_code, status, records_ingested, error_message, started_at, completed_at
        FROM data_updates
        ORDER BY id DESC
        LIMIT 20
      `);
      const updates = updatesStmt.all();

      return res.json({
        summary,
        recent_updates: updates
      });
    }
  } catch (err) {
    console.error('Error fetching data quality metrics:', err);
  }

  res.status(500).json({ error: 'Data quality metrics unavailable' });
});

// 10. GET /api/geojson/countries - High-Fidelity Geometries
app.get('/api/geojson/countries', (_req: Request, res: Response) => {
  const geo = getGeoJson();
  if (geo) {
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.json(geo);
  }
  res.status(500).json({ error: 'World GeoJSON boundary data not found' });
});

// ==========================================
// VITE DEV MIDDLEWARE & STATIC ASSET SERVING
// ==========================================

async function startServer() {
  if (!isProduction) {
    // Dynamic import vite in dev to mount middlewares
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
    console.log('[Server] Mounted Vite dev middleware.');
  } else {
    // Serve production static build
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('[Server] Serving production static files from dist/.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Global Health Atlas] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
