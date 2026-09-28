-- Global Health Atlas Relational Schema (PostgreSQL / SQLite Compatible DDL)
-- Designed for millions of public health observations across space and time.

CREATE TABLE IF NOT EXISTS sources (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    organization TEXT NOT NULL,
    website_url TEXT NOT NULL,
    license_name TEXT NOT NULL,
    license_url TEXT NOT NULL,
    terms_summary TEXT,
    attribution_requirement TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS datasets (
    id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    version TEXT,
    url TEXT,
    methodology_url TEXT,
    FOREIGN KEY (source_id) REFERENCES sources (id)
);

CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS indicators (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL,
    dataset_id TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    definition TEXT NOT NULL,
    unit TEXT NOT NULL,
    metric_type TEXT NOT NULL,
    default_classification TEXT DEFAULT 'quantiles',
    is_inverted BOOLEAN DEFAULT FALSE,
    methodology TEXT,
    source_url TEXT,
    FOREIGN KEY (category_id) REFERENCES categories (id),
    FOREIGN KEY (dataset_id) REFERENCES datasets (id)
);

CREATE TABLE IF NOT EXISTS countries (
    iso3 TEXT PRIMARY KEY,
    iso2 TEXT,
    numeric_code TEXT,
    name TEXT NOT NULL,
    canonical_name TEXT NOT NULL,
    who_code TEXT,
    who_region_code TEXT,
    who_region_name TEXT,
    un_region TEXT,
    population BIGINT
);

CREATE TABLE IF NOT EXISTS observations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    country_iso3 TEXT NOT NULL,
    indicator_code TEXT NOT NULL,
    year INTEGER NOT NULL,
    date TEXT,
    value REAL NOT NULL,
    unit TEXT NOT NULL,
    lower_bound REAL,
    upper_bound REAL,
    data_status TEXT DEFAULT 'estimated',
    methodology_note TEXT,
    source_id TEXT NOT NULL,
    dataset_id TEXT NOT NULL,
    comments TEXT,
    retrieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (country_iso3) REFERENCES countries (iso3),
    FOREIGN KEY (indicator_code) REFERENCES indicators (code),
    FOREIGN KEY (source_id) REFERENCES sources (id),
    FOREIGN KEY (dataset_id) REFERENCES datasets (id),
    CONSTRAINT unq_obs UNIQUE (country_iso3, indicator_code, year)
);

CREATE TABLE IF NOT EXISTS data_updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id TEXT NOT NULL,
    indicator_code TEXT NOT NULL,
    status TEXT NOT NULL, -- 'SUCCESS', 'FAILED', 'PARTIAL'
    records_ingested INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Essential Performance Indexes
CREATE INDEX IF NOT EXISTS idx_obs_indicator_year ON observations (indicator_code, year);
CREATE INDEX IF NOT EXISTS idx_obs_country_indicator ON observations (country_iso3, indicator_code);
CREATE INDEX IF NOT EXISTS idx_obs_year ON observations (year);
CREATE INDEX IF NOT EXISTS idx_countries_region ON countries (who_region_code);
CREATE INDEX IF NOT EXISTS idx_indicators_category ON indicators (category_id);
