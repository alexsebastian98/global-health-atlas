# Contributing to Global Health Atlas

We welcome contributions from software engineers, medical informaticists, biostatisticians, and geospatial developers.

---

## 1. Adding a New Data Source Connector

To add a new data provider (e.g. UNICEF, IHME, CDC, or national public health institutes):

1. Create a new directory in `data_sources/<source_name>/`.
2. Implement a connector inheriting from `DataSourceConnector` in `data_sources/base_connector.py`.
3. Implement the three mandatory methods:
   - `get_source_metadata()`: Source organization, license, terms of use, and citation rules.
   - `get_supported_indicators()`: List of `IndicatorMetadata` defining names, units, definitions, metric types, and default classification.
   - `fetch_indicator_data(indicator_code, country_mapper)`: Queries the external API, resolves countries to canonical ISO3 via `country_mapper`, extracts uncertainty bounds, and returns `List[NormalizedObservation]`.
4. Register the connector in `update_data.py`.
5. Run tests:
   ```bash
   python3 update_data.py --indicator YOUR_INDICATOR_CODE
   npm test
   ```

---

## 2. Invariant Checklist for Pull Requests

Before submitting a PR, verify:
- [ ] No fake or synthetic health data is introduced.
- [ ] All indicators have clear definitions, units, and source URLs.
- [ ] Automated tests pass (`npm test`).
- [ ] TypeScript compiles cleanly with zero errors (`npm run lint`).
- [ ] License of the external source allows redistribution with attribution.
