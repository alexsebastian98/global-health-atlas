# REST API Reference: Global Health Atlas

All API endpoints are served from `/api/` with JSON payloads and standard HTTP status codes.

---

## 1. Endpoints

### `GET /api/metadata`
Returns system metadata, concept statement, supported domains, and data governance policies.

### `GET /api/sources`
Returns all authoritative institutions, dataset descriptions, licensing terms, and citation rules.

### `GET /api/indicators`
Returns all available indicators.
- **Query Parameters**:
  - `category` *(optional)*: Filter by health domain slug (`infectious_diseases`, `maternal_child_health`, etc.)

### `GET /api/indicators/:id`
Returns detailed metadata for an indicator (definition, methodology, available years, and source link).

### `GET /api/countries`
Returns canonical country list.
- **Query Parameters**:
  - `region` *(optional)*: Filter by WHO Region code (`AFR`, `AMR`, `EUR`, etc.)
  - `search` *(optional)*: Case-insensitive search on name or ISO3.

### `GET /api/countries/:id`
Returns detailed country epidemiological profile with latest observations across all indicators.

### `GET /api/observations`
Primary choropleth feed returning keyed observations and distribution statistics.
- **Query Parameters**:
  - `indicator` *(required)*: Indicator code (e.g. `MALARIA_EST_INCIDENCE`).
  - `year` *(optional)*: Target year (defaults to latest available year).
  - `region` *(optional)*: Filter by WHO Region.
- **Response Format**:
```json
{
  "indicator_code": "MALARIA_EST_INCIDENCE",
  "year": 2022,
  "stats": {
    "count": 103,
    "min": 0,
    "max": 376.6,
    "mean": 83.4,
    "median": 7.37,
    "q25": 0.05,
    "q75": 181.7
  },
  "total_reporting": 103,
  "observations": {
    "NGA": {
      "country_iso3": "NGA",
      "country_name": "Nigeria",
      "year": 2022,
      "value": 312.4,
      "unit": "Cases / 1 000 at risk",
      "lower_bound": 250.1,
      "upper_bound": 380.2,
      "data_status": "estimated",
      "source_name": "World Health Organization"
    }
  }
}
```

### `GET /api/trends`
Multi-country longitudinal time series.
- **Query Parameters**:
  - `indicator` *(required)*: Indicator code.
  - `countries` *(optional)*: Comma-separated ISO3 list (e.g. `NGA,IND,BRA,DEU`).

### `GET /api/data-quality`
Returns summary statistics of data statuses, uncertainty interval coverage, and update pipeline logs.

### `GET /api/geojson/countries`
Serves the world countries boundary vector GeoJSON with caching headers.
