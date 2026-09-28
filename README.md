# Global Health Atlas

> **"An interactive visual atlas of the health of the planet."**

The **Global Health Atlas** is a production-grade geospatial and epidemiological intelligence platform designed to explore verified global public health data geographically. The world map is the primary interface, allowing researchers, clinicians, epidemiologists, and policymakers to navigate spatial patterns, longitudinal trends, and health disparities across nations and time.

---

## 1. Core Principles

- **Zero Fabricated Statistics**: Every displayed statistic is traced to an official, authoritative international health body (World Health Organization Global Health Observatory, World Bank Health Nutrition & Population). No synthetic or fake metrics are ever substituted.
- **Data Provenance & Uncertainty**: Every observation includes its source, dataset, official indicator definition, unit, methodology notes, publication date, and 95% uncertainty intervals (lower and upper bounds) where published by estimating bodies.
- **Geographic Integrity**: Robust ISO 3166-1 alpha-3 canonical country resolution. Missing data is explicitly distinguished and styled as "No reported data", never silently zeroed.
- **Medical Informatics Rigor**: Clear distinction between *model-based estimates*, *directly reported registry counts*, and *survey aggregates*. Non-clinical macro-epidemiological tool without diagnostic claims.

---

## 2. Architecture Overview

```
External Authoritative Sources (WHO GHO OData API, World Bank Open Data API)
                                    ↓
            Modular Ingestion Layer (/data_sources/who, /data_sources/world_bank)
                                    ↓
            Canonical Country Mapper (ISO 3166-1 alpha-3, WHO Regions)
                                    ↓
            Unit Normalization & Uncertainty Interval Parsing (Low, High 95% UI)
                                    ↓
            Relational Storage (/db/schema.sql, SQLite / PostgreSQL + PostGIS)
                                    ↓
            REST API Layer (Express / TypeScript / server.ts)
                                    ↓
            Geospatial Frontend (React 19, D3.js Geo, Vite, Tailwind CSS)
                                    ↓
    Interactive Equal Earth Map & 3D Orthographic Globe + Country Profile Dossier
```

---

## 3. Supported Domains & Indicators (MVP)

| Domain | Indicator | Source | Code | Unit | Metric Type |
|---|---|---|---|---|---|
| **Infectious Diseases** | Estimated Malaria Incidence | WHO GHO | `MALARIA_EST_INCIDENCE` | Cases / 1,000 at risk | Rate per 1,000 |
| **Infectious Diseases** | Estimated Malaria Mortality Rate | WHO GHO | `MALARIA_EST_MORTALITY` | Deaths / 100,000 | Rate per 100,000 |
| **Infectious Diseases** | Estimated Total Malaria Cases | WHO GHO | `MALARIA_EST_CASES` | Cases | Count |
| **Demographics & Longevity** | Life Expectancy at Birth | WHO GHO | `WHOSIS_000001` | Years | Continuous |
| **Maternal & Child Health** | Maternal Mortality Ratio | WHO GHO | `MDG_0000000026` | Deaths / 100,000 live births | Ratio per 100,000 |
| **Maternal & Child Health** | Under-Five Mortality Rate | WHO GHO | `MDG_0000000007` | Deaths / 1,000 live births | Rate per 1,000 |
| **Immunization** | Measles Vaccine Coverage (MCV1) | WHO / UNICEF | `WHS8_110` | % coverage | Percentage |
| **Healthcare Financing** | Current Health Expenditure | World Bank | `SH.XPD.CHEX.GD.ZS` | % of GDP | Percentage |

---

## 4. Key Features

1. **Interactive Cartography**:
   - Equal Earth 2D projection and 3D Orthographic Globe with fluid drag rotation.
   - Smooth zoom and pan (`d3.zoom`) with viewport reset.
   - Scientific choropleth classification (Quantiles & Natural Breaks).
   - "No reported data" states handled cleanly without biasing distribution statistics.
2. **Time Machine & Animation**:
   - Continuous year scrubbing (2000–2024).
   - Play/pause automated temporal progression.
3. **Country Hover & Epidemiological Dossier**:
   - Hover cards showing point estimates, 95% uncertainty intervals, and reporting status.
   - Slide-in country drawer showing complete multi-domain indicator matrix and historical trend line charts.
4. **Longitudinal Country Comparison**:
   - Side-by-side comparison of up to 4 countries simultaneously.
   - Aligned multi-curve SVG time-series graphs with quantitative matrix.
5. **Data Quality & Audit Console**:
   - Live breakdown of model-based estimates vs. reported registries vs. uncertainty coverage.
   - Audit trail of pipeline ingestion timestamps and record counts.

---

## 5. Quickstart & Local Execution

### Prerequisites
- Node.js >= 20.x
- Python >= 3.10

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Data Pipeline (Optional - Database is Pre-seeded)
```bash
python3 update_data.py
# Or to ingest a specific indicator:
python3 update_data.py --indicator MALARIA_EST_INCIDENCE
# Or verify data coverage:
python3 update_data.py --verify
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run Automated Invariant Tests
```bash
npm test
```

---

## 6. Deployment Architecture

- **Frontend**: Vite SPA bundle deployed to Cloudflare Pages, Vercel, or AWS S3/CloudFront.
- **Backend**: Express REST API on Fly.io, Railway, or Google Cloud Run.
- **Database**: Managed PostgreSQL with PostGIS (`/db/postgis_schema.sql`), or embedded SQLite for self-contained instances.

---

## 7. Data Licensing & Attribution

- **World Health Organization (WHO)**: Data published under WHO Open Data Policy and WHO Terms of Use.
  *Attribution: World Health Organization, Global Health Observatory (GHO).*
- **World Bank**: Data licensed under Creative Commons Attribution 4.0 International (CC BY 4.0).
  *Attribution: World Bank World Development Indicators (WDI).*
- **Geospatial Boundaries**: Natural Earth Admin 0 Country Polygons (Public Domain / CC0).

---

## 8. Limitations & Known Considerations

1. **Reporting Lags**: Epidemiological indicators computed through statistical consensus (e.g. maternal mortality, malaria incidence) typically experience an international publication lag of 12–24 months due to survey harmonization.
2. **Surveillance Disparities**: Disparities between countries reflect differences in vital registration completeness and diagnostic testing capacity. Uncertainty intervals quantify these estimation variances.
3. **Non-Clinical Use**: This platform is an observational demographic and public health atlas, not a patient diagnostic or triage system.
