# Data Model & Schema Specification

The Global Health Atlas uses a normalized relational schema designed to handle tens of millions of spatiotemporal health observations without redundancy or schema mutation when adding new indicators.

---

## 1. Entity-Relationship Model

```
sources (1) ────< datasets (N) ────< indicators (N) ────< observations (N)
                                                               │
categories (1) ────────────────────────────────────────────────┘
                                                               │
countries (1)  ────────────────────────────────────────────────┘
```

---

## 2. Table Specifications

### `sources`
Authoritative institutions publishing health datasets.
- `id` (TEXT, PK): Canonical identifier (e.g. `'who'`, `'world_bank'`).
- `name` (TEXT): Full name of the institution.
- `organization` (TEXT): Parent body.
- `website_url` (TEXT): Official web portal.
- `license_name` (TEXT): Governing license (e.g. `'CC BY 4.0'`).
- `license_url` (TEXT): Link to legal terms.
- `terms_summary` (TEXT): Plain language summary of redistribution rights.
- `attribution_requirement` (TEXT): Mandatory citation string.

### `datasets`
Specific collections published by a source.
- `id` (TEXT, PK): Unique dataset key (e.g. `'who_gho'`, `'world_bank_wdi'`).
- `source_id` (TEXT, FK): References `sources.id`.
- `name` (TEXT): Official repository name.
- `code` (TEXT, UNIQUE): Identifier code.
- `description` (TEXT): Summary of dataset scope.

### `categories`
Public health domains.
- `id` (TEXT, PK): Slug (e.g. `'infectious_diseases'`, `'maternal_child_health'`).
- `name` (TEXT): Display name.
- `description` (TEXT): Epidemiological description.
- `sort_order` (INTEGER): Navigation ordering.

### `indicators`
Specific measurable public health variables.
- `id` (TEXT, PK): Key (e.g. `'MALARIA_EST_INCIDENCE'`).
- `category_id` (TEXT, FK): References `categories.id`.
- `dataset_id` (TEXT, FK): References `datasets.id`.
- `code` (TEXT, UNIQUE): Source code.
- `name` (TEXT): Full clinical title.
- `short_name` (TEXT): Condensed UI title.
- `definition` (TEXT): Official epidemiological definition.
- `unit` (TEXT): Standardized measurement unit.
- `metric_type` (TEXT): `'rate_per_1000'`, `'rate_per_100000'`, `'percentage'`, `'years'`, `'count'`.
- `default_classification` (TEXT): `'quantiles'`, `'natural_breaks'`, `'logarithmic'`.
- `is_inverted` (BOOLEAN): `TRUE` if higher = disease burden; `FALSE` if higher = health outcome.
- `methodology` (TEXT): Statistical modeling description.
- `source_url` (TEXT): Permanent URL to source indicator metadata.

### `countries`
Standardized geographic entities.
- `iso3` (TEXT, PK): ISO 3166-1 alpha-3 code (e.g. `'NGA'`, `'DEU'`).
- `iso2` (TEXT): ISO 3166-1 alpha-2 code.
- `name` (TEXT): Display name.
- `canonical_name` (TEXT): Canonical name.
- `who_region_code` (TEXT): `'AFR'`, `'AMR'`, `'SEAR'`, `'EUR'`, `'EMR'`, `'WPR'`.
- `who_region_name` (TEXT): Region title.

### `observations`
Atomic spatio-temporal health data point.
- `id` (INTEGER, PK, AUTOINCREMENT).
- `country_iso3` (TEXT, FK): References `countries.iso3`.
- `indicator_code` (TEXT, FK): References `indicators.code`.
- `year` (INTEGER): Observation year.
- `value` (REAL): Point estimate / recorded value.
- `unit` (TEXT): Normalized unit.
- `lower_bound` (REAL, NULLABLE): Lower bound of 95% uncertainty interval.
- `upper_bound` (REAL, NULLABLE): Upper bound of 95% uncertainty interval.
- `data_status` (TEXT): `'estimated'`, `'reported'`, `'modeled'`, `'provisional'`.
- `methodology_note` (TEXT): Source-specific comments.
- `source_id` (TEXT, FK): References `sources.id`.
- `dataset_id` (TEXT, FK): References `datasets.id`.
- `retrieved_at` (TIMESTAMP): UTC timestamp of ingestion.
- *Constraint*: `UNIQUE(country_iso3, indicator_code, year)`.

### `data_updates`
Audit log of all data synchronization runs.
- `id` (INTEGER, PK).
- `source_id` (TEXT).
- `indicator_code` (TEXT).
- `status` (TEXT): `'SUCCESS'`, `'FAILED'`, `'PARTIAL'`.
- `records_ingested` (INTEGER).
- `error_message` (TEXT, NULLABLE).
- `started_at` (TIMESTAMP).
- `completed_at` (TIMESTAMP).
