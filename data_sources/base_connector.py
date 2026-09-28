"""
Base Data Source Connector Architecture for Global Health Atlas.

Every health data provider (WHO, World Bank, UN, UNICEF, IHME, CDC, etc.)
inherits from DataSourceConnector to guarantee:
1. Provenance tracking (source, dataset, license, retrieved timestamp)
2. Normalized observation structure
3. Strict country mapping to canonical ISO-3
4. Metric & unit normalization
5. Uncertainty interval extraction (lower_bound, upper_bound)
6. Data quality tagging (reported, estimated, modeled, provisional)
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, asdict
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("AtlasConnector")


@dataclass
class SourceMetadata:
    id: str
    name: str
    organization: str
    website_url: str
    license_name: str
    license_url: str
    terms_summary: str
    attribution_requirement: str


@dataclass
class DatasetMetadata:
    id: str
    source_id: str
    name: str
    code: str
    description: str
    version: Optional[str] = None
    url: Optional[str] = None
    methodology_url: Optional[str] = None


@dataclass
class IndicatorMetadata:
    id: str
    category: str
    category_name: str
    dataset_id: str
    code: str
    name: str
    short_name: str
    definition: str
    unit: str
    metric_type: str  # rate_per_1000, rate_per_100000, years, percentage, count
    default_classification: str  # quantiles, equal_intervals, logarithmic
    is_inverted: bool  # True if higher is worse (e.g. malaria incidence), False if higher is better (e.g. life expectancy)
    methodology: str
    source_url: str


@dataclass
class NormalizedObservation:
    country_iso3: str
    indicator_code: str
    year: int
    value: float
    unit: str
    lower_bound: Optional[float] = None
    upper_bound: Optional[float] = None
    data_status: str = "estimated"  # reported, estimated, modeled, provisional, projected
    methodology_note: Optional[str] = None
    source_id: str = "who"
    dataset_id: str = "who_gho"
    comments: Optional[str] = None
    retrieved_at: str = ""

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        if not d["retrieved_at"]:
            d["retrieved_at"] = datetime.utcnow().isoformat() + "Z"
        return d


class DataSourceConnector(ABC):
    """Abstract base class for all public health data connectors."""

    def __init__(self, source_id: str, source_name: str):
        self.source_id = source_id
        self.source_name = source_name
        self.logger = logging.getLogger(f"Connector.{source_id}")

    @abstractmethod
    def get_source_metadata(self) -> SourceMetadata:
        """Returns verified provenance and licensing terms for this source."""
        pass

    @abstractmethod
    def get_supported_indicators(self) -> List[IndicatorMetadata]:
        """Returns indicators supported by this connector."""
        pass

    @abstractmethod
    def fetch_indicator_data(
        self, indicator_code: str, country_mapper: Any, start_year: Optional[int] = None, end_year: Optional[int] = None
    ) -> List[NormalizedObservation]:
        """Fetches, validates, and normalizes observations for a specified indicator.

        Guarantees that observations returned have valid canonical country_iso3 and numeric values.
        """
        pass
