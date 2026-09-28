#!/usr/bin/env python3
"""Global Health Atlas - Production Data Ingestion & Update Pipeline.

Fetches authoritative health data from official public health APIs (WHO GHO, World Bank),
validates observations, normalizes countries to canonical ISO-3, extracts uncertainty intervals,
and persists to both the relational database (SQLite/PostgreSQL) and optimized JSON caches.

Usage:
    python3 update_data.py               # Ingest primary MVP indicators
    python3 update_data.py --all         # Ingest all supported indicators
    python3 update_data.py --indicator MALARIA_EST_INCIDENCE
    python3 update_data.py --verify      # Verify data integrity and coverage
"""

import os
import sys
import json
import sqlite3
import argparse
import logging
from datetime import datetime

# Local connector imports
from data_sources.geography.country_mapper import CountryMapper
from data_sources.who.who_connector import WhoGhoConnector
from data_sources.world_bank.world_bank_connector import WorldBankConnector

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("DataPipeline")

DB_PATH = "data/atlas.db"
CANONICAL_COUNTRIES_PATH = "data/canonical_countries.json"
SCHEMA_PATH = "db/schema.sql"

CATEGORIES = [
    {"id": "infectious_diseases", "name": "Infectious Diseases", "slug": "infectious-diseases", "description": "Global epidemiology of vector-borne and communicable pathogens including malaria, tuberculosis, and viral outbreaks.", "sort_order": 1},
    {"id": "demographics_life_expectancy", "name": "Demographics & Longevity", "slug": "demographics-life-expectancy", "description": "Population longevity, life expectancy at birth, and healthy life expectancy (HALE) across nations.", "sort_order": 2},
    {"id": "mortality_burden", "name": "Mortality & Disease Burden", "slug": "mortality-burden", "description": "All-cause, adult, infant, and maternal mortality surveillance and global disease burden.", "sort_order": 3},
    {"id": "nutrition", "name": "Nutrition & Malnutrition", "slug": "nutrition", "description": "Child stunting, wasting, micronutrient deficiencies, and anaemia in women of reproductive age.", "sort_order": 4},
    {"id": "injuries_violence", "name": "Injuries & Violence", "slug": "injuries-violence", "description": "Road traffic fatalities, interpersonal violence, and unintentional injury death rates.", "sort_order": 5},
    {"id": "maternal_child_health", "name": "Maternal, Sexual & Reproductive Health", "slug": "maternal-child-health", "description": "Skilled birth attendance, adolescent birth rate, and maternal health indicators.", "sort_order": 6},
    {"id": "noncommunicable_diseases", "name": "Noncommunicable Diseases", "slug": "noncommunicable-diseases", "description": "Cardiovascular, hypertension, diabetes, oncologic, and metabolic disease prevalence.", "sort_order": 7},
    {"id": "mental_health", "name": "Mental Health", "slug": "mental-health", "description": "Suicide mortality rates and psychiatric epidemiological surveillance.", "sort_order": 8},
    {"id": "immunization", "name": "Immunization & Vaccines", "slug": "immunization", "description": "National vaccine coverage rates for preventable childhood diseases including measles (MCV) and DTP3.", "sort_order": 9},
    {"id": "environmental_health", "name": "Environmental Health & WASH", "slug": "environmental-health", "description": "Ambient fine particulate air pollution (PM2.5), safely managed water, and sanitation access.", "sort_order": 10},
    {"id": "risk_factors", "name": "Risk Factors & Substance Use", "slug": "risk-factors", "description": "Population exposures to behavioural risk factors including alcohol consumption and tobacco use.", "sort_order": 11},
    {"id": "healthcare_systems", "name": "Healthcare Systems & Workforce", "slug": "healthcare-systems", "description": "Universal health coverage index (SDG 3.8.1), health workforce density, and health expenditure.", "sort_order": 12},
    {"id": "neglected_tropical_diseases", "name": "Neglected Tropical Diseases", "slug": "neglected-tropical-diseases", "description": "Surveillance and elimination tracking for neglected tropical diseases including leprosy.", "sort_order": 13},
    {"id": "health_security_emergencies", "name": "Health Security & Emergencies", "slug": "health-security-emergencies", "description": "International Health Regulations (IHR 2005) SPAR core capacity scores and pandemic readiness.", "sort_order": 14},
]


def init_db():
    os.makedirs("data", exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        conn.executescript(f.read())
    conn.commit()
    conn.close()
    logger.info("Database initialized successfully.")


def seed_metadata_and_countries(conn: sqlite3.Connection, who: WhoGhoConnector, wb: WorldBankConnector):
    cursor = conn.cursor()

    # Seed Categories
    for cat in CATEGORIES:
        cursor.execute(
            """INSERT OR REPLACE INTO categories (id, name, slug, description, sort_order)
               VALUES (?, ?, ?, ?, ?)""",
            (cat["id"], cat["name"], cat["slug"], cat["description"], cat["sort_order"]),
        )

    # Seed Sources
    for connector in [who, wb]:
        s = connector.get_source_metadata()
        cursor.execute(
            """INSERT OR REPLACE INTO sources (id, name, organization, website_url, license_name, license_url, terms_summary, attribution_requirement)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (s.id, s.name, s.organization, s.website_url, s.license_name, s.license_url, s.terms_summary, s.attribution_requirement),
        )

    # Seed Datasets
    who_ds = who.get_dataset_metadata()
    cursor.execute(
        """INSERT OR REPLACE INTO datasets (id, source_id, name, code, description, url, methodology_url)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (who_ds.id, who_ds.source_id, who_ds.name, who_ds.code, who_ds.description, who_ds.url, who_ds.methodology_url),
    )

    wb_ds = wb.get_dataset_metadata()
    cursor.execute(
        """INSERT OR REPLACE INTO datasets (id, source_id, name, code, description, url, methodology_url)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (wb_ds.id, wb_ds.source_id, wb_ds.name, wb_ds.code, wb_ds.description, wb_ds.url, wb_ds.methodology_url),
    )

    # Seed Indicators
    all_indicators = who.get_supported_indicators() + wb.get_supported_indicators()
    for ind in all_indicators:
        cursor.execute(
            """INSERT OR REPLACE INTO indicators (id, category_id, dataset_id, code, name, short_name, definition, unit, metric_type, default_classification, is_inverted, methodology, source_url)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (ind.id, ind.category, ind.dataset_id, ind.code, ind.name, ind.short_name, ind.definition, ind.unit, ind.metric_type, ind.default_classification, ind.is_inverted, ind.methodology, ind.source_url),
        )

    # Seed Canonical Countries
    if os.path.exists(CANONICAL_COUNTRIES_PATH):
        with open(CANONICAL_COUNTRIES_PATH, "r", encoding="utf-8") as f:
            countries = json.load(f)
            for c in countries:
                cursor.execute(
                    """INSERT OR REPLACE INTO countries (iso3, name, canonical_name, who_code, who_region_code, who_region_name)
                       VALUES (?, ?, ?, ?, ?, ?)""",
                    (c["iso3"], c["name"], c["canonical_name"], c.get("who_code"), c.get("who_region_code"), c.get("who_region_name")),
                )
            logger.info(f"Seeded {len(countries)} countries into database.")

    conn.commit()


def ingest_indicator(conn: sqlite3.Connection, connector, indicator_code: str, country_mapper: CountryMapper, force: bool = False) -> int:
    cursor = conn.cursor()

    if not force:
        cursor.execute("SELECT COUNT(*) FROM observations WHERE indicator_code = ?", (indicator_code,))
        existing = cursor.fetchone()[0]
        if existing > 0:
            logger.info(f"Indicator {indicator_code} already has {existing} records in database. Skipping fetch.")
            return existing

    started_at = datetime.utcnow().isoformat() + "Z"
    logger.info(f"--- Ingesting Indicator: {indicator_code} from {connector.source_id} ---")

    try:
        observations = connector.fetch_indicator_data(indicator_code, country_mapper)
        if not observations:
            logger.warning(f"No observations fetched for {indicator_code}")
            cursor.execute(
                """INSERT INTO data_updates (source_id, indicator_code, status, records_ingested, error_message, started_at, completed_at)
                   VALUES (?, ?, 'FAILED', 0, 'No records returned from source API', ?, ?)""",
                (connector.source_id, indicator_code, started_at, datetime.utcnow().isoformat() + "Z"),
            )
            conn.commit()
            return 0

        # Insert observations in batch
        insert_records = []
        for obs in observations:
            insert_records.append((
                obs.country_iso3,
                obs.indicator_code,
                obs.year,
                obs.value,
                obs.unit,
                obs.lower_bound,
                obs.upper_bound,
                obs.data_status,
                obs.methodology_note,
                obs.source_id,
                obs.dataset_id,
                obs.comments,
                obs.retrieved_at,
            ))

        cursor.executemany(
            """INSERT OR REPLACE INTO observations
               (country_iso3, indicator_code, year, value, unit, lower_bound, upper_bound, data_status, methodology_note, source_id, dataset_id, comments, retrieved_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            insert_records,
        )

        completed_at = datetime.utcnow().isoformat() + "Z"
        cursor.execute(
            """INSERT INTO data_updates (source_id, indicator_code, status, records_ingested, error_message, started_at, completed_at)
               VALUES (?, ?, 'SUCCESS', ?, NULL, ?, ?)""",
            (connector.source_id, indicator_code, len(insert_records), started_at, completed_at),
        )
        conn.commit()
        logger.info(f"✓ Ingested {len(insert_records)} records for {indicator_code}")
        return len(insert_records)

    except Exception as e:
        logger.error(f"Error during ingestion of {indicator_code}: {e}", exc_info=True)
        cursor.execute(
            """INSERT INTO data_updates (source_id, indicator_code, status, records_ingested, error_message, started_at, completed_at)
               VALUES (?, ?, 'FAILED', 0, ?, ?, ?)""",
            (connector.source_id, indicator_code, str(e), started_at, datetime.utcnow().isoformat() + "Z"),
        )
        conn.commit()
        return 0


def export_fast_cache(conn: sqlite3.Connection):
    """Generates optimized JSON index files in data/ for lightning-fast frontend and server responses."""
    cursor = conn.cursor()

    # Export indicators
    cursor.execute("""
        SELECT i.id, i.category_id, c.name as category_name, i.code, i.name, i.short_name,
               i.definition, i.unit, i.metric_type, i.default_classification, i.is_inverted,
               i.methodology, i.source_url, s.name as source_name, s.attribution_requirement,
               MIN(o.year) as min_year, MAX(o.year) as max_year, COUNT(o.id) as observation_count
        FROM indicators i
        JOIN categories c ON i.category_id = c.id
        JOIN datasets d ON i.dataset_id = d.id
        JOIN sources s ON d.source_id = s.id
        LEFT JOIN observations o ON i.code = o.indicator_code
        GROUP BY i.id
    """)
    ind_rows = cursor.fetchall()
    indicators = []
    for r in ind_rows:
        indicators.append({
            "id": r[0],
            "category_id": r[1],
            "category_name": r[2],
            "code": r[3],
            "name": r[4],
            "short_name": r[5],
            "definition": r[6],
            "unit": r[7],
            "metric_type": r[8],
            "default_classification": r[9],
            "is_inverted": bool(r[10]),
            "methodology": r[11],
            "source_url": r[12],
            "source_name": r[13],
            "attribution": r[14],
            "min_year": r[15],
            "max_year": r[16],
            "observation_count": r[17],
        })

    with open("data/indicators.json", "w", encoding="utf-8") as f:
        json.dump(indicators, f, indent=2)

    # Export countries
    cursor.execute("""
        SELECT c.iso3, c.name, c.canonical_name, c.who_region_code, c.who_region_name
        FROM countries c
        ORDER BY c.name
    """)
    countries = [
        {"iso3": r[0], "name": r[1], "canonical_name": r[2], "who_region_code": r[3], "who_region_name": r[4]}
        for r in cursor.fetchall()
    ]
    with open("data/countries.json", "w", encoding="utf-8") as f:
        json.dump(countries, f, indent=2)

    # Export Sources
    cursor.execute("SELECT id, name, organization, website_url, license_name, license_url, terms_summary, attribution_requirement FROM sources")
    sources = [
        {
            "id": r[0],
            "name": r[1],
            "organization": r[2],
            "website_url": r[3],
            "license_name": r[4],
            "license_url": r[5],
            "terms_summary": r[6],
            "attribution_requirement": r[7],
        }
        for r in cursor.fetchall()
    ]
    with open("data/sources.json", "w", encoding="utf-8") as f:
        json.dump(sources, f, indent=2)

    logger.info("Exported fast JSON cache files to data/.")


def verify_integrity(conn: sqlite3.Connection):
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM countries")
    total_countries = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM indicators")
    total_indicators = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM observations")
    total_obs = cursor.fetchone()[0]
    cursor.execute("""
        SELECT indicator_code, COUNT(*), MIN(year), MAX(year), COUNT(DISTINCT country_iso3)
        FROM observations
        GROUP BY indicator_code
    """)
    breakdown = cursor.fetchall()

    print("\n==================================================")
    print("GLOBAL HEALTH ATLAS - DATA INTEGRITY REPORT")
    print("==================================================")
    print(f"Total Canonical Countries: {total_countries}")
    print(f"Total Configured Indicators: {total_indicators}")
    print(f"Total Verified Observations: {total_obs:,}")
    print("--------------------------------------------------")
    print("Indicator Coverage Breakdown:")
    for b in breakdown:
        print(f"  • {b[0]:<22} | Records: {b[1]:<6} | Years: {b[2]}-{b[3]} | Countries: {b[4]}")
    print("==================================================\n")


def main():
    parser = argparse.ArgumentParser(description="Global Health Atlas Data Pipeline")
    parser.add_argument("--indicator", type=str, help="Specific indicator code to ingest")
    parser.add_argument("--all", action="store_true", help="Ingest all available indicators")
    parser.add_argument("--verify", action="store_true", help="Run data integrity verification")
    parser.add_argument("--force", action="store_true", help="Force re-fetching data even if cached")
    args = parser.parse_args()

    init_db()
    conn = sqlite3.connect(DB_PATH)

    country_mapper = CountryMapper(CANONICAL_COUNTRIES_PATH)
    who = WhoGhoConnector()
    wb = WorldBankConnector()

    seed_metadata_and_countries(conn, who, wb)

    if args.verify:
        verify_integrity(conn)
        conn.close()
        return

    # Indicators to ingest
    indicators_to_run = []
    if args.indicator:
        indicators_to_run.append(args.indicator)
    elif args.all:
        indicators_to_run = [ind.code for ind in who.get_supported_indicators()] + [ind.code for ind in wb.get_supported_indicators()]
    else:
        # Comprehensive multi-domain indicators set across all core global health domains
        indicators_to_run = [
            # Infectious Diseases
            "MALARIA_EST_INCIDENCE",
            "MALARIA_EST_MORTALITY",
            "MALARIA_EST_CASES",
            "MDG_0000000020", # Tuberculosis incidence rate
            "HIV_0000000001", # HIV incidence rate
            # Demographics & Longevity
            "WHOSIS_000001", # Life expectancy at birth
            "WHOSIS_000002", # Healthy life expectancy (HALE)
            # Mortality & Disease Burden
            "MDG_0000000026", # Maternal mortality ratio
            "MDG_0000000007", # Under-five mortality rate
            "MDG_0000000001", # Infant mortality rate
            "WHOSIS_000004", # Adult mortality rate (15-60)
            # Nutrition & Malnutrition
            "NUTSTUNTINGPREV", # Child stunting prevalence (<5 years)
            "NUTRITION_WH_2", # Child wasting prevalence (<5 years)
            "NUTRITION_ANAEMIA_REPRODUCTIVEAGE_PREV", # Anaemia in women (15-49)
            # Injuries & Violence
            "RS_198", # Road traffic mortality rate
            "VIOLENCE_HOMICIDERATE", # Interpersonal violence & homicide rate
            # Maternal, Sexual & Reproductive Health
            "MDG_0000000025", # Skilled birth attendance
            "MDG_0000000003", # Adolescent birth rate (15-19)
            # Noncommunicable Diseases
            "NCD_BMI_30C", # Adult obesity prevalence
            "NCD_HYP_PREVALENCE_A", # Hypertension prevalence
            # Mental Health
            "MH_12", # Suicide mortality rate
            # Immunization & Vaccines
            "WHS8_110", # Measles MCV1 coverage
            "WHS4_100", # DTP3 coverage
            # Environmental Health & WASH
            "AIR_41", # Ambient air pollution PM2.5
            "WSH_WATER_SAFELY_MANAGED", # Safely managed drinking water
            "WSH_SANITATION_SAFELY_MANAGED", # Safely managed sanitation
            # Risk Factors & Substance Use
            "SA_0000001688", # Alcohol consumption per capita
            "M_Est_tob_curr", # Current tobacco use prevalence
            # Healthcare Systems & Workforce
            "UHC_INDEX_REPORTED", # Universal health coverage index
            "SH.XPD.CHEX.GD.ZS", # Current health expenditure % GDP
            "HWF_0001", # Medical doctors density per 10k
            # Neglected Tropical Diseases (NTDs)
            "WHS3_45", # New leprosy cases
            # Health Security & Emergencies
            "SDGIHR", # International Health Regulations (IHR) SPAR Core Capacity Score
        ]

    total_records = 0
    who_codes = {i.code for i in who.get_supported_indicators()}
    wb_codes = {i.code for i in wb.get_supported_indicators()}

    for code in indicators_to_run:
        if code in who_codes:
            cnt = ingest_indicator(conn, who, code, country_mapper, force=args.force)
            total_records += cnt
        elif code in wb_codes:
            cnt = ingest_indicator(conn, wb, code, country_mapper, force=args.force)
            total_records += cnt
        else:
            logger.error(f"Unrecognized indicator code: {code}")

    export_fast_cache(conn)
    verify_integrity(conn)
    conn.close()
    logger.info(f"Pipeline run complete. Ingested total of {total_records} records.")


if __name__ == "__main__":
    main()
