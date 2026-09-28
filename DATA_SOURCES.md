# Data Sources & Provenance Registry

The Global Health Atlas prioritizes official, machine-readable, authoritative international data repositories.

---

## 1. Primary Sources

### World Health Organization (WHO)
- **Portal**: [https://www.who.int/data/gho](https://www.who.int/data/gho)
- **API Endpoint**: `https://ghoapi.azureedge.net/api/` (OData REST API)
- **License**: WHO Open Data Policy (CC BY-NC-SA 3.0 IGO & WHO Terms of Use)
- **Attribution**: *World Health Organization, Global Health Observatory (GHO).*
- **Primary Indicators Synchronized**:
  - `MALARIA_EST_INCIDENCE`: Estimated malaria incidence per 1,000 population at risk (2000–2024).
  - `MALARIA_EST_MORTALITY`: Estimated malaria mortality rate per 100,000 population (2000–2024).
  - `MALARIA_EST_CASES`: Total estimated number of malaria episodes (2000–2024).
  - `WHOSIS_000001`: Life expectancy at birth in years (2000–2021).
  - `MDG_0000000026`: Maternal mortality ratio per 100,000 live births (1985–2023).
  - `MDG_0000000007`: Under-five pediatric mortality rate per 1,000 live births (1931–2024).
  - `WHS8_110`: Measles-containing-vaccine first-dose (MCV1) immunization coverage % (2000–2025).

### The World Bank Group
- **Portal**: [https://data.worldbank.org](https://data.worldbank.org)
- **API Endpoint**: `https://api.worldbank.org/v2/`
- **License**: Creative Commons Attribution 4.0 International (CC BY 4.0)
- **Attribution**: *World Bank, World Development Indicators (WDI).*
- **Primary Indicators Synchronized**:
  - `SH.XPD.CHEX.GD.ZS`: Current health expenditure (% of GDP) (2015–2024).
  - `SH.MED.PHYS.ZS`: Physicians density (per 1,000 people).
  - `SP.POP.TOTL`: Total national population.

---

## 2. Secondary & Extension Sources Architecture

The system provides connector adapters in `/data_sources` for:
- **UNICEF Data**: Child protection, severe acute malnutrition, and WASH coverage.
- **UN Population Division (WPP)**: Demographic pyramids, total fertility rates, and crude death rates.
- **IHME Global Burden of Disease (GBD)**: Disability-Adjusted Life Years (DALYs), Years of Life Lost (YLLs), and risk factors.
- **CDC Open Data**: Disease surveillance and specific epidemic transmission networks.

---

## 3. Data Integrity Invariants

1. **No Scraping**: All data is retrieved through documented, versioned APIs or machine-readable exports.
2. **Deterministic Canonical Resolution**: Country names and codes from various sources are converted through `CountryMapper` using ISO 3166-1 alpha-3 standards.
3. **No Overwrites of Valid Data**: Pipeline failures log errors without truncating existing valid observations.
