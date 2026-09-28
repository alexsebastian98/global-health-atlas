# Data Quality, Integrity & Uncertainty Policy

## 1. Principles of Quality Assurance

The Global Health Atlas enforces strict data quality invariants:

1. **No Synthetic Values**: If an official institution does not have a record for country $C$ in year $Y$, the record is stored and rendered as `null` (Missing / Unsurveyed). No artificial extrapolation or synthetic values are inserted.
2. **Uncertainty Interval Preservation**:
   Whenever a source publishes uncertainty intervals (such as 95% Bayesian credible intervals from WHO MMEIG or Global Malaria Programme models), the lower and upper bounds are preserved and exposed in tooltips, country dossiers, and longitudinal graphs.
3. **Data Status Standardization**:
   - `estimated`: Model-based estimates derived by international agencies reconciling health facility records, diagnostic testing ratios, and survey data.
   - `reported`: Direct counts reported by national vital statistics offices and civil registries.
   - `modeled`: Pure mechanistic or mathematical simulations.
   - `provisional`: Preliminary surveillance data subject to annual retrospective adjustments.

---

## 2. Invariant Auditing Rules

- **Boundedness**: For all observations with bounds: `lower_bound <= value <= upper_bound`.
- **Geographic Precision**: Every record must resolve to a valid 3-letter ISO 3166-1 alpha-3 code present in `canonical_countries.json`. Non-country aggregates (e.g. regional totals like "WHO Western Pacific Region") are filtered out during ingestion to prevent choropleth distortion.
- **Atomic Updates**: Ingestion processes use database transactions to prevent partial writes.
