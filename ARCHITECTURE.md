# System Architecture: Global Health Atlas

## 1. Architectural Philosophy

The Global Health Atlas is engineered around the core premise that **public health maps must reflect empirical epidemiological reality with zero data fabrication**.

In biomedical and epidemiological computing, presenting unverified or synthetic numbers under the guise of real disease statistics can cause severe misinformation. Therefore, the system is architected as an end-to-end provenance pipeline:

```
[Official APIs: WHO, World Bank]
                 │
                 ▼
     [Connector Layer (Python)]
                 │  - Validates response schemas
                 │  - Reconciles country aliases to ISO 3166-1 alpha-3
                 │  - Extracts point estimates + 95% uncertainty intervals
                 ▼
      [Relational Database (SQL)]
                 │  - Normalized schema: sources, datasets, indicators, observations
                 │  - Foreign key constraints & unique composite index (country, indicator, year)
                 ▼
     [Backend REST API (Express)]
                 │  - Fast O(1) indexed dictionary feeds for choropleth mapping
                 │  - Summary distribution statistics (min, max, median, quartiles)
                 │  - Audit quality & pipeline execution logs
                 ▼
    [Client Visualization (React + D3)]
                 │  - SVG vector rendering (Equal Earth & Orthographic 3D Globe)
                 │  - Dynamic quantile/natural interval choropleth color scales
                 │  - Strict 'No data' styling (never coerced to 0)
                 ▼
        [Human Understanding]
```

---

## 2. Directory Layout

```
├── data/                                # Relational database & geospatial artifacts
│   ├── atlas.db                         # Production SQLite relational database (11+ MB)
│   ├── canonical_countries.json         # ISO 3166-1 alpha-3 standard country reference
│   ├── indicators.json                  # High-speed indicators cache
│   ├── sources.json                     # Verified sources cache
│   └── world_countries.geojson          # 177 sovereign boundary features
├── data_sources/                        # Modular ingestion connectors
│   ├── base_connector.py                # Abstract DataSourceConnector ABC
│   ├── geography/
│   │   └── country_mapper.py            # Canonical country resolution engine
│   ├── who/
│   │   └── who_connector.py             # Official WHO GHO OData API connector
│   ├── world_bank/
│   │   └── world_bank_connector.py      # World Bank Open Data v2 connector
│   └── other_connectors.py              # UNICEF, IHME, CDC connector architectures
├── db/                                  # Database Schemas & Migrations
│   ├── schema.sql                       # Normalized relational DDL
│   └── postgis_schema.sql               # PostgreSQL + PostGIS spatial extension & views
├── src/                                 # Frontend SPA
│   ├── components/
│   │   ├── AtlasHeader.tsx              # 3-Zone navigation header
│   │   ├── ControlsBar.tsx              # Domain, indicator, region & timeline scrub controls
│   │   ├── WorldMap.tsx                 # D3.js geospatial rendering engine
│   │   ├── MapLegend.tsx                # Scientific legend & classification inspector
│   │   ├── CountryProfileDrawer.tsx     # Slide-in country epidemiological dossier
│   │   ├── ComparisonView.tsx           # Multi-country longitudinal comparative view
│   │   ├── DataQualityView.tsx          # Data quality & uncertainty audit console
│   │   ├── SourcesView.tsx              # Data sources & licensing console
│   │   └── DataProvenanceModal.tsx      # Traceability & citation modal
│   ├── services/
│   │   └── api.ts                       # Cached HTTP API client
│   ├── types/
│   │   └── atlas.ts                     # TypeScript data contracts
│   └── utils/
│       └── colorScales.ts               # Scientific choropleth color binning
├── tests/                               # Automated test suite
│   └── atlas.test.js                    # Invariant, uncertainty, and schema tests
├── server.ts                            # Express full-stack API server
├── update_data.py                       # CLI data update & pipeline orchestrator
└── package.json                         # Dependencies & execution scripts
```

---

## 3. Medical Informatics Considerations

### 3.1 Point Estimates vs. Uncertainty Intervals
In global epidemiology, point estimates (e.g. 235 cases per 1,000) are estimates derived from statistical models (such as Bayesian spatial splines or regression models calibrated with household surveys). Displaying solely the point estimate creates an illusion of certainty. The Global Health Atlas ingests and displays the **95% uncertainty interval** (`lower_bound` and `upper_bound`), reflecting true epidemiological precision.

### 3.2 The Zero vs. Missing Distinction
Treating unrecorded countries as zero incidence would imply that a disease has been eradicated in that nation, which is catastrophic in public health surveillance. The Global Health Atlas maintains a strict invariant:
- **Value = 0**: Verified zero transmission / zero reported cases.
- **Value = null**: Missing / non-endemic / unrecorded (styled as dark neutral hatch, distinct from low incidence).

### 3.3 Classification Methods
- **Quantiles**: Partitions sorted values into equal-sized frequency groups. Prevents extreme outliers (e.g. high-burden hyperendemic nations) from flattening the color gradation of moderate-burden nations.
- **Natural Breaks**: Minimizes squared deviations from class means for skewed counts.
