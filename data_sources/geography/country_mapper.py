import json
import re
from typing import Optional, Dict, Any

# ISO-3166-1 canonical mapping for all sovereign countries and territories
# Includes WHO country codes, UN codes, ISO2, ISO3, and common nomenclature aliases.

COUNTRY_ALIASES = {
    # Official name variations to canonical ISO-3
    "united states": "USA",
    "united states of america": "USA",
    "usa": "USA",
    "us": "USA",
    "united kingdom": "GBR",
    "united kingdom of great britain and northern ireland": "GBR",
    "uk": "GBR",
    "great britain": "GBR",
    "russia": "RUS",
    "russian federation": "RUS",
    "china": "CHN",
    "people's republic of china": "CHN",
    "south korea": "KOR",
    "korea, republic of": "KOR",
    "republic of korea": "KOR",
    "north korea": "PRK",
    "korea, democratic people's republic of": "PRK",
    "democratic people's republic of korea": "PRK",
    "vietnam": "VNM",
    "viet nam": "VNM",
    "iran": "IRN",
    "iran (islamic republic of)": "IRN",
    "syria": "SYR",
    "syrian arab republic": "SYR",
    "tanzania": "TZA",
    "united republic of tanzania": "TZA",
    "dr congo": "COD",
    "democratic republic of the congo": "COD",
    "congo, democratic republic of the": "COD",
    "congo, dem. rep.": "COD",
    "congo": "COG",
    "republic of the congo": "COG",
    "congo, rep.": "COG",
    "cote d'ivoire": "CIV",
    "côte d'ivoire": "CIV",
    "ivory coast": "CIV",
    "bolivia": "BOL",
    "bolivia (plurinational state of)": "BOL",
    "venezuela": "VEN",
    "venezuela (bolivarian republic of)": "VEN",
    "laos": "LAO",
    "lao people's democratic republic": "LAO",
    "moldova": "MDA",
    "republic of moldova": "MDA",
    "czechia": "CZE",
    "czech republic": "CZE",
    "burma": "MMR",
    "myanmar": "MMR",
    "macedonia": "MKD",
    "north macedonia": "MKD",
    "republic of north macedonia": "MKD",
    "eswatini": "SWZ",
    "swaziland": "SWZ",
    "cape verde": "CPV",
    "cabo verde": "CPV",
    "brunei": "BRN",
    "brunei darussalam": "BRN",
    "timor-leste": "TLS",
    "east timor": "TLS",
    "micronesia": "FSM",
    "micronesia (federated states of)": "FSM",
    "palestine": "PSE",
    "state of palestine": "PSE",
    "occupied palestinian territory": "PSE",
    "turkey": "TUR",
    "türkiye": "TUR",
    "egypt": "EGY",
    "egypt, arab rep.": "EGY",
    "yemen": "YEM",
    "yemen, rep.": "YEM",
}


def normalize_string(s: str) -> str:
    """Normalize string by lowercasing and stripping non-alphanumeric chars except space."""
    if not s:
        return ""
    s = s.lower().strip()
    s = re.sub(r"[\.,\-_\'\"]", "", s)
    s = re.sub(r"\s+", " ", s)
    return s.strip()


class CountryMapper:
    """Canonical country mapping engine converting heterogeneous external identifiers

    into standardized ISO 3166-1 alpha-3 canonical country entities.
    """

    def __init__(self, canonical_countries_path: Optional[str] = None):
        self.by_iso3: Dict[str, Dict[str, Any]] = {}
        self.by_iso2: Dict[str, str] = {}
        self.by_name: Dict[str, str] = {}
        self.by_who_code: Dict[str, str] = {}

        if canonical_countries_path:
            with open(canonical_countries_path, "r", encoding="utf-8") as f:
                countries = json.load(f)
                for c in countries:
                    self.register_country(c)

    def register_country(self, c: Dict[str, Any]):
        iso3 = c["iso3"].upper()
        self.by_iso3[iso3] = c
        if c.get("iso2"):
            self.by_iso2[c["iso2"].upper()] = iso3
        if c.get("who_code"):
            self.by_who_code[c["who_code"].upper()] = iso3
        name_norm = normalize_string(c.get("name", ""))
        if name_norm:
            self.by_name[name_norm] = iso3
        canonical_norm = normalize_string(c.get("canonical_name", ""))
        if canonical_norm:
            self.by_name[canonical_norm] = iso3

    def map_to_iso3(self, identifier: str) -> Optional[str]:
        """Resolves any identifier (ISO-3, ISO-2, WHO code, country name) to canonical ISO-3."""
        if not identifier:
            return None
        raw = identifier.strip()
        upper = raw.upper()

        # Direct ISO-3 match
        if upper in self.by_iso3:
            return upper

        # ISO-2 match
        if len(upper) == 2 and upper in self.by_iso2:
            return self.by_iso2[upper]

        # WHO code match
        if upper in self.by_who_code:
            return self.by_who_code[upper]

        # Normalized alias lookup
        norm = normalize_string(raw)
        if norm in COUNTRY_ALIASES:
            return COUNTRY_ALIASES[norm]

        # Direct name lookup
        if norm in self.by_name:
            return self.by_name[norm]

        # Partial matching check
        for alias, target_iso3 in COUNTRY_ALIASES.items():
            if alias in norm or norm in alias:
                return target_iso3

        return None

    def get_country(self, iso3: str) -> Optional[Dict[str, Any]]:
        return self.by_iso3.get(iso3.upper() if iso3 else "")
