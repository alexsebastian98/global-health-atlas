-- PostgreSQL + PostGIS Schema Extension
-- To be run in a production PostgreSQL database with PostGIS enabled.

CREATE EXTENSION IF NOT EXISTS postgis;

-- Add spatial boundary column to countries table
ALTER TABLE countries ADD COLUMN IF NOT EXISTS geom geometry(MultiPolygon, 4326);
CREATE INDEX IF NOT EXISTS idx_countries_geom ON countries USING GIST (geom);

-- Materialized View for Pre-aggregated Annual Global Summaries
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_indicator_global_summary AS
SELECT
    indicator_code,
    year,
    COUNT(DISTINCT country_iso3) as reporting_countries,
    AVG(value) as mean_value,
    MIN(value) as min_value,
    MAX(value) as max_value,
    percentile_cont(0.5) WITHIN GROUP (ORDER BY value) as median_value
FROM observations
GROUP BY indicator_code, year;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_global_summary ON mv_indicator_global_summary (indicator_code, year);
