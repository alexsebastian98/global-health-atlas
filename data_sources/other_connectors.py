"""
Data Connectors Architecture Index for UN, UNICEF, IHME, CDC, and OWID.

Provides verified source metadata, licensing specifications, and architectural
hooks for secondary and specialized global public health data providers.
"""

from typing import List, Optional, Any
from data_sources.base_connector import (
    DataSourceConnector,
    SourceMetadata,
    DatasetMetadata,
    IndicatorMetadata,
    NormalizedObservation,
)


class UnicefConnector(DataSourceConnector):
    """UNICEF Global Data Warehouse connector architecture."""

    def __init__(self):
        super().__init__(source_id="unicef", source_name="UNICEF")

    def get_source_metadata(self) -> SourceMetadata:
        return SourceMetadata(
            id="unicef",
            name="UNICEF Data: Monitoring the situation of children and women",
            organization="United Nations Children's Fund (UNICEF)",
            website_url="https://data.unicef.org",
            license_name="Creative Commons Attribution 4.0 International (CC BY 4.0)",
            license_url="https://data.unicef.org/terms-of-use/",
            terms_summary="UNICEF open data is available under CC BY 4.0. Users must provide clear attribution and indicate if changes were made.",
            attribution_requirement="Source: UNICEF Data Warehouse (data.unicef.org).",
        )

    def get_supported_indicators(self) -> List[IndicatorMetadata]:
        return []

    def fetch_indicator_data(
        self, indicator_code: str, country_mapper: Any, start_year: Optional[int] = None, end_year: Optional[int] = None
    ) -> List[NormalizedObservation]:
        return []


class IhmeConnector(DataSourceConnector):
    """Institute for Health Metrics and Evaluation (IHME) GBD connector architecture."""

    def __init__(self):
        super().__init__(source_id="ihme", source_name="IHME")

    def get_source_metadata(self) -> SourceMetadata:
        return SourceMetadata(
            id="ihme",
            name="Institute for Health Metrics and Evaluation (IHME) - Global Burden of Disease",
            organization="University of Washington / IHME",
            website_url="https://www.healthdata.org/gbd",
            license_name="IHME Non-Commercial User Agreement",
            license_url="https://www.healthdata.org/about/terms-and-conditions",
            terms_summary="IHME GBD estimates are available for non-commercial research and educational purposes. Commercial redistribution requires written permission.",
            attribution_requirement="Global Burden of Disease Study 2021 (GBD 2021) Results. Seattle, United States: Institute for Health Metrics and Evaluation (IHME).",
        )

    def get_supported_indicators(self) -> List[IndicatorMetadata]:
        return []

    def fetch_indicator_data(
        self, indicator_code: str, country_mapper: Any, start_year: Optional[int] = None, end_year: Optional[int] = None
    ) -> List[NormalizedObservation]:
        return []


class CdcConnector(DataSourceConnector):
    """Centers for Disease Control and Prevention (CDC) Open Data connector architecture."""

    def __init__(self):
        super().__init__(source_id="cdc", source_name="CDC")

    def get_source_metadata(self) -> SourceMetadata:
        return SourceMetadata(
            id="cdc",
            name="Centers for Disease Control and Prevention (CDC)",
            organization="U.S. Department of Health and Human Services",
            website_url="https://data.cdc.gov",
            license_name="Public Domain (U.S. Government Work)",
            license_url="https://www.cdc.gov/other/agencymaterials.html",
            terms_summary="Data produced by CDC employees is generally in the public domain and free from copyright restrictions.",
            attribution_requirement="Source: Centers for Disease Control and Prevention, National Center for Health Statistics.",
        )

    def get_supported_indicators(self) -> List[IndicatorMetadata]:
        return []

    def fetch_indicator_data(
        self, indicator_code: str, country_mapper: Any, start_year: Optional[int] = None, end_year: Optional[int] = None
    ) -> List[NormalizedObservation]:
        return []
