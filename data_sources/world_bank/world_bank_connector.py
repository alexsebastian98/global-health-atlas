"""
World Bank Health, Nutrition and Population (HNP) & Socioeconomic Connector.

Connects to the official World Bank Open Data API (v2) to ingest
canonical healthcare systems, economic, and demographic indicators.
"""

import json
import urllib.request
import urllib.parse
from typing import List, Optional, Any
from data_sources.base_connector import (
    DataSourceConnector,
    SourceMetadata,
    DatasetMetadata,
    IndicatorMetadata,
    NormalizedObservation,
)


class WorldBankConnector(DataSourceConnector):
    """Connector for official World Bank Open Data API (v2)."""

    BASE_URL = "https://api.worldbank.org/v2"

    def __init__(self):
        super().__init__(source_id="world_bank", source_name="World Bank")

    def get_source_metadata(self) -> SourceMetadata:
        return SourceMetadata(
            id="world_bank",
            name="World Bank Open Data",
            organization="The World Bank Group",
            website_url="https://data.worldbank.org",
            license_name="Creative Commons Attribution 4.0 International (CC BY 4.0)",
            license_url="https://datacatalog.worldbank.org/public-licenses#cc-by",
            terms_summary="You are free to copy, distribute, adapt, and transmit the data for commercial and non-commercial purposes with attribution.",
            attribution_requirement="Source: World Bank, World Development Indicators & Health Nutrition and Population Statistics.",
        )

    def get_dataset_metadata(self) -> DatasetMetadata:
        return DatasetMetadata(
            id="world_bank_wdi",
            source_id="world_bank",
            name="World Development Indicators (WDI) - Health & Population",
            code="WB_WDI",
            description="The World Bank's premier compilation of cross-country comparable data on health financing, healthcare workforce, and demographic indicators.",
            url="https://databank.worldbank.org/source/world-development-indicators",
            methodology_url="https://datahelpdesk.worldbank.org/knowledgebase/articles/888063-wdi-sources-and-methods",
        )

    def get_supported_indicators(self) -> List[IndicatorMetadata]:
        return [
            IndicatorMetadata(
                id="SH.XPD.CHEX.GD.ZS",
                category="healthcare_systems",
                category_name="Healthcare Systems & Workforce",
                dataset_id="world_bank_wdi",
                code="SH.XPD.CHEX.GD.ZS",
                name="Current Health Expenditure (% of GDP)",
                short_name="Health Expenditure (% GDP)",
                definition="Level of current health expenditure expressed as a percentage of gross domestic product (GDP). Estimates of current health expenditures include healthcare goods and services consumed during each year.",
                unit="% of GDP",
                metric_type="percentage",
                default_classification="quantiles",
                is_inverted=False,
                methodology="World Health Organization Global Health Expenditure database reconciled by World Bank.",
                source_url="https://data.worldbank.org/indicator/SH.XPD.CHEX.GD.ZS",
            ),
            IndicatorMetadata(
                id="SH.MED.PHYS.ZS",
                category="healthcare_systems",
                category_name="Healthcare Systems",
                dataset_id="world_bank_wdi",
                code="SH.MED.PHYS.ZS",
                name="Physicians Density",
                short_name="Physicians Density",
                definition="Number of physicians (generalist and specialist medical practitioners) per 1 000 people.",
                unit="Physicians / 1 000",
                metric_type="rate_per_1000",
                default_classification="quantiles",
                is_inverted=False,
                methodology="World Health Organization Global Atlas of the Health Workforce and national statistical surveys.",
                source_url="https://data.worldbank.org/indicator/SH.MED.PHYS.ZS",
            ),
            IndicatorMetadata(
                id="SP.POP.TOTL",
                category="demographics_life_expectancy",
                category_name="Demographics & Life Expectancy",
                dataset_id="world_bank_wdi",
                code="SP.POP.TOTL",
                name="Total Population",
                short_name="Total Population",
                definition="Total population based on the de facto definition of population, counting all residents regardless of legal status or citizenship.",
                unit="Persons",
                metric_type="count",
                default_classification="logarithmic",
                is_inverted=False,
                methodology="United Nations Population Division World Population Prospects and national statistical censuses.",
                source_url="https://data.worldbank.org/indicator/SP.POP.TOTL",
            ),
        ]

    def fetch_indicator_data(
        self, indicator_code: str, country_mapper: Any, start_year: Optional[int] = None, end_year: Optional[int] = None
    ) -> List[NormalizedObservation]:
        """Fetches country-level indicator data from World Bank API v2."""
        # Query country=all with 1500 per page to cover recent multi-year data
        url = f"{self.BASE_URL}/country/all/indicator/{indicator_code}?format=json&per_page=1500&date=2015:2024"
        self.logger.info(f"Fetching World Bank data from: {url}")

        req = urllib.request.Request(url, headers={"User-Agent": "GlobalHealthAtlas/1.0"})
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                if resp.status != 200:
                    self.logger.error(f"HTTP error {resp.status} fetching {indicator_code}")
                    return []
                payload = json.loads(resp.read().decode("utf-8"))
        except Exception as e:
            self.logger.error(f"Network error fetching indicator {indicator_code}: {e}")
            return []

        if not isinstance(payload, list) or len(payload) < 2:
            return []

        raw_records = payload[1]
        ind_meta = next((i for i in self.get_supported_indicators() if i.code == indicator_code), None)
        unit = ind_meta.unit if ind_meta else ""

        observations: List[NormalizedObservation] = []
        for r in raw_records:
            val = r.get("value")
            if val is None:
                continue

            raw_iso3 = r.get("countryiso3code")
            iso3 = country_mapper.map_to_iso3(raw_iso3)
            if not iso3:
                continue

            try:
                year = int(r.get("date", 0))
            except (ValueError, TypeError):
                continue

            obs = NormalizedObservation(
                country_iso3=iso3,
                indicator_code=indicator_code,
                year=year,
                value=round(float(val), 2),
                unit=unit,
                lower_bound=None,
                upper_bound=None,
                data_status="reported",
                methodology_note="Reported statistical aggregate via World Bank WDI",
                source_id="world_bank",
                dataset_id="world_bank_wdi",
                comments=None,
                retrieved_at="",
            )
            observations.append(obs)

        self.logger.info(f"Retrieved {len(observations)} valid records from World Bank for {indicator_code}")
        return observations
