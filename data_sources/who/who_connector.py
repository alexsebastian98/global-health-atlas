"""
WHO Global Health Observatory (GHO) API Connector.

Provides direct, authenticated-free access to official WHO public-health
indicators through the official WHO GHO OData API (ghoapi.azureedge.net).
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


class WhoGhoConnector(DataSourceConnector):
    """Connector for the official WHO Global Health Observatory API."""

    BASE_URL = "https://ghoapi.azureedge.net/api"

    def __init__(self):
        super().__init__(source_id="who", source_name="World Health Organization")

    def get_source_metadata(self) -> SourceMetadata:
        return SourceMetadata(
            id="who",
            name="World Health Organization (WHO)",
            organization="World Health Organization",
            website_url="https://www.who.int/data/gho",
            license_name="WHO Open Data Policy (CC BY-NC-SA 3.0 IGO / WHO Terms of Use)",
            license_url="https://www.who.int/about/policies/publishing/data-policy/terms-and-conditions",
            terms_summary="WHO open health data is made available for public health, research, and non-commercial educational use. Source must be explicitly cited.",
            attribution_requirement="Source: World Health Organization, Global Health Observatory (GHO).",
        )

    def get_dataset_metadata(self) -> DatasetMetadata:
        return DatasetMetadata(
            id="who_gho",
            source_id="who",
            name="WHO Global Health Observatory Repository",
            code="WHO_GHO",
            description="The Global Health Observatory is WHO's gateway to health-related statistics for more than 1000 indicators across 194 Member States.",
            url="https://www.who.int/data/gho",
            methodology_url="https://www.who.int/data/gho/indicator-metadata-registry",
        )

    def get_supported_indicators(self) -> List[IndicatorMetadata]:
        return [
            IndicatorMetadata(
                id="MALARIA_EST_INCIDENCE",
                category="infectious_diseases",
                category_name="Infectious Diseases",
                dataset_id="who_gho",
                code="MALARIA_EST_INCIDENCE",
                name="Estimated Malaria Incidence",
                short_name="Malaria Incidence",
                definition="Number of estimated malaria cases per 1 000 population at risk in a given year.",
                unit="Cases / 1 000 at risk",
                metric_type="rate_per_1000",
                default_classification="natural_breaks",
                is_inverted=True,
                methodology="Estimates produced using mathematical and geospatial modeling developed by the WHO Global Malaria Programme in collaboration with academic consortia, integrating routine surveillance, active case detection, and intervention coverage.",
                source_url="https://www.who.int/data/gho/data/indicators/indicator-details/GHO/estimated-malaria-incidence-(per-1000-population-at-risk)",
            ),
            IndicatorMetadata(
                id="MALARIA_EST_MORTALITY",
                category="infectious_diseases",
                category_name="Infectious Diseases",
                dataset_id="who_gho",
                code="MALARIA_EST_MORTALITY",
                name="Estimated Malaria Mortality Rate",
                short_name="Malaria Mortality",
                definition="Estimated number of deaths directly attributable to malaria per 100 000 population.",
                unit="Deaths / 100 000",
                metric_type="rate_per_100000",
                default_classification="natural_breaks",
                is_inverted=True,
                methodology="Cause-of-death estimation models by WHO Global Malaria Programme using vital registration, verbal autopsy data, and transmission intensity curves.",
                source_url="https://www.who.int/data/gho/data/indicators/indicator-details/GHO/estimated-malaria-mortality-rate-(per-100-000-population)",
            ),
            IndicatorMetadata(
                id="MALARIA_EST_CASES",
                category="infectious_diseases",
                category_name="Infectious Diseases",
                dataset_id="who_gho",
                code="MALARIA_EST_CASES",
                name="Estimated Number of Malaria Cases",
                short_name="Total Malaria Cases",
                definition="Total estimated absolute count of malaria episodes in the national population.",
                unit="Cases",
                metric_type="count",
                default_classification="logarithmic",
                is_inverted=True,
                methodology="National surveillance data adjusted for health facility attendance rates, diagnostic testing rates, and reporting completeness.",
                source_url="https://www.who.int/data/gho/data/indicators/indicator-details/GHO/estimated-number-of-malaria-cases",
            ),
            IndicatorMetadata(
                id="WHOSIS_000001",
                category="demographics_life_expectancy",
                category_name="Demographics & Life Expectancy",
                dataset_id="who_gho",
                code="WHOSIS_000001",
                name="Life Expectancy at Birth",
                short_name="Life Expectancy",
                definition="The average number of years a newborn would live if current age-specific mortality rates were to continue for their lifetime.",
                unit="Years",
                metric_type="years",
                default_classification="quantiles",
                is_inverted=False,
                methodology="Calculated by the WHO Division of Data, Analytics and Delivery from national life tables, civil registration, and demographic census projections.",
                source_url="https://www.who.int/data/gho/data/indicators/indicator-details/GHO/life-expectancy-at-birth-(years)",
            ),
            IndicatorMetadata(
                id="MDG_0000000026",
                category="mortality_burden",
                category_name="Mortality & Disease Burden",
                dataset_id="who_gho",
                code="MDG_0000000026",
                name="Maternal Mortality Ratio",
                short_name="Maternal Mortality Ratio",
                definition="The annual number of female deaths from any cause related to or aggravated by pregnancy or its management (excluding accidental or incidental causes) per 100 000 live births.",
                unit="Deaths / 100 000 live births",
                metric_type="rate_per_100000",
                default_classification="natural_breaks",
                is_inverted=True,
                methodology="Maternal Mortality Estimation Inter-Agency Group (MMEIG) Bayesian maternal mortality estimation model (BMat).",
                source_url="https://www.who.int/data/gho/data/indicators/indicator-details/GHO/maternal-mortality-ratio-(per-100-000-live-births)",
            ),
            IndicatorMetadata(
                id="MDG_0000000007",
                category="mortality_burden",
                category_name="Mortality & Disease Burden",
                dataset_id="who_gho",
                code="MDG_0000000007",
                name="Under-Five Mortality Rate",
                short_name="Under-5 Mortality Rate",
                definition="The probability of dying between birth and exactly five years of age expressed per 1 000 live births.",
                unit="Deaths / 1 000 live births",
                metric_type="rate_per_1000",
                default_classification="natural_breaks",
                is_inverted=True,
                methodology="UN Inter-agency Group for Child Mortality Estimation (UN IGME) statistical spline and regression models based on civil registration, vital statistics, and DHS surveys.",
                source_url="https://www.who.int/data/gho/data/indicators/indicator-details/GHO/under-five-mortality-rate-(probability-of-dying-by-age-5-per-1000-live-births)",
            ),
            IndicatorMetadata(
                id="MDG_0000000001",
                category="mortality_burden",
                category_name="Mortality & Disease Burden",
                dataset_id="who_gho",
                code="MDG_0000000001",
                name="Infant Mortality Rate",
                short_name="Infant Mortality Rate",
                definition="Probability of dying between birth and exactly 1 year of age, expressed per 1 000 live births.",
                unit="Deaths / 1 000 live births",
                metric_type="rate_per_1000",
                default_classification="natural_breaks",
                is_inverted=True,
                methodology="UN Inter-agency Group for Child Mortality Estimation (UN IGME) statistical models synthesizing civil registration, censuses, and demographic surveys.",
                source_url="https://www.who.int/data/gho/data/indicators/indicator-details/GHO/infant-mortality-rate-(probability-of-dying-between-birth-and-age-1-per-1000-live-births)",
            ),
            IndicatorMetadata(
                id="NUTSTUNTINGPREV",
                category="nutrition",
                category_name="Nutrition & Malnutrition",
                dataset_id="who_gho",
                code="NUTSTUNTINGPREV",
                name="Child Stunting Prevalence (< 5 Years)",
                short_name="Child Stunting Prevalence",
                definition="Percentage of children under 5 years of age who are stunted (height-for-age below -2 standard deviations from the WHO Child Growth Standards median).",
                unit="% of children < 5",
                metric_type="percentage",
                default_classification="quantiles",
                is_inverted=True,
                methodology="UNICEF/WHO/World Bank Group Joint Child Malnutrition Estimates (JME) derived from national nutrition surveys and demographic health surveys.",
                source_url="https://www.who.int/data/gho/data/indicators/indicator-details/GHO/gho-jme-stunting-prevalence",
            ),
            IndicatorMetadata(
                id="NUTRITION_ANAEMIA_REPRODUCTIVEAGE_PREV",
                category="nutrition",
                category_name="Nutrition & Malnutrition",
                dataset_id="who_gho",
                code="NUTRITION_ANAEMIA_REPRODUCTIVEAGE_PREV",
                name="Anaemia in Women of Reproductive Age (15–49)",
                short_name="Anaemia Prevalence in Women",
                definition="Prevalence of anaemia in women of reproductive age (15–49 years) residing in households, defined as haemoglobin concentration < 120 g/L for non-pregnant and non-lactating women, and < 110 g/L for pregnant women.",
                unit="% of women (15–49)",
                metric_type="percentage",
                default_classification="quantiles",
                is_inverted=True,
                methodology="WHO Department of Nutrition and Food Safety Bayesian hierarchical estimation models summarizing national blood biomarker surveys.",
                source_url="https://www.who.int/data/gho/data/indicators/indicator-details/GHO/prevalence-of-anaemia-in-women-of-reproductive-age-(-)",
            ),
            IndicatorMetadata(
                id="RS_198",
                category="injuries_violence",
                category_name="Injuries & Violence",
                dataset_id="who_gho",
                code="RS_198",
                name="Estimated Road Traffic Death Rate",
                short_name="Road Traffic Mortality Rate",
                definition="Estimated number of road traffic fatalities per 100 000 population in a given year.",
                unit="Deaths / 100 000",
                metric_type="rate_per_100000",
                default_classification="natural_breaks",
                is_inverted=True,
                methodology="WHO Global Status Report on Road Safety statistical negative binomial regression models informed by national transport, police, and vital registration records.",
                source_url="https://www.who.int/data/gho/data/indicators/indicator-details/GHO/estimated-road-traffic-death-rate-(per-100-000-population)",
            ),
            IndicatorMetadata(
                id="VIOLENCE_HOMICIDERATE",
                category="injuries_violence",
                category_name="Injuries & Violence",
                dataset_id="who_gho",
                code="VIOLENCE_HOMICIDERATE",
                name="Interpersonal Violence & Homicide Rate",
                short_name="Homicide Mortality Rate",
                definition="Estimated rate of homicides per 100 000 population per year.",
                unit="Deaths / 100 000",
                metric_type="rate_per_100000",
                default_classification="natural_breaks",
                is_inverted=True,
                methodology="WHO Global Health Estimates cause-of-death model utilizing civil registration vital statistics and UNODC crime surveys.",
                source_url="https://www.who.int/data/gho/data/indicators/indicator-details/GHO/estimates-of-rates-of-homicides-per-100-000-population",
            ),
            IndicatorMetadata(
                id="MDG_0000000025",
                category="maternal_child_health",
                category_name="Maternal, Sexual & Reproductive Health",
                dataset_id="who_gho",
                code="MDG_0000000025",
                name="Births Attended by Skilled Health Personnel",
                short_name="Skilled Birth Attendance",
                definition="Percentage of births attended by skilled health personnel (doctors, nurses, or certified midwives trained in management of normal deliveries and obstetric complications).",
                unit="% of live births",
                metric_type="percentage",
                default_classification="equal_intervals",
                is_inverted=False,
                methodology="Joint WHO/UNICEF database compiled from national demographic surveys and administrative health facility registries.",
                source_url="https://www.who.int/data/gho/data/indicators/indicator-details/GHO/births-attended-by-skilled-health-personnel-(-)",
            ),
            IndicatorMetadata(
                id="MDG_0000000003",
                category="maternal_child_health",
                category_name="Maternal, Sexual & Reproductive Health",
                dataset_id="who_gho",
                code="MDG_0000000003",
                name="Adolescent Birth Rate (Ages 15–19)",
                short_name="Adolescent Birth Rate",
                definition="Annual number of births to women aged 15–19 years per 1 000 women in that age group.",
                unit="Births / 1 000 women (15–19)",
                metric_type="rate_per_1000",
                default_classification="natural_breaks",
                is_inverted=True,
                methodology="United Nations Population Division and WHO annual compilations from vital registration, national population censuses, and demographic health surveys.",
                source_url="https://www.who.int/data/gho/data/indicators/indicator-details/GHO/adolescent-birth-rate-(per-1000-women)",
            ),
            IndicatorMetadata(
                id="WHS8_110",
                category="immunization",
                category_name="Immunization & Vaccines",
                dataset_id="who_gho",
                code="WHS8_110",
                name="Measles Vaccine First-Dose Coverage (MCV1)",
                short_name="Measles (MCV1) Coverage",
                definition="Percentage of children aged 12–23 months who have received at least one dose of measles-containing vaccine.",
                unit="% coverage",
                metric_type="percentage",
                default_classification="equal_intervals",
                is_inverted=False,
                methodology="WHO/UNICEF Estimates of National Immunization Coverage (WUENIC) reconciling administrative facility data and population-based household survey coverage.",
                source_url="https://www.who.int/data/gho/data/indicators/indicator-details/GHO/measles-containing-vaccine-first-dose-(mcv1)-immunization-coverage-among-1-year-olds-(-)",
            ),
            IndicatorMetadata(
                id="WHS4_100",
                category="immunization",
                category_name="Immunization & Vaccines",
                dataset_id="who_gho",
                code="WHS4_100",
                name="Diphtheria, Tetanus & Pertussis (DTP3) Coverage",
                short_name="DTP3 Immunization Coverage",
                definition="Percentage of one-year-olds who have received three doses of the combined diphtheria, tetanus toxoid, and pertussis vaccine.",
                unit="% coverage",
                metric_type="percentage",
                default_classification="equal_intervals",
                is_inverted=False,
                methodology="WHO/UNICEF estimates of national immunization coverage based on administrative reports and household survey data.",
                source_url="https://www.who.int/data/gho/data/indicators/indicator-details/GHO/diphtheria-tetanus-toxoid-and-pertussis-(dtp3)-immunization-coverage-among-1-year-olds-(-)",
            ),
            IndicatorMetadata(
                id="MDG_0000000020",
                category="infectious_diseases",
                category_name="Infectious Diseases",
                dataset_id="who_gho",
                code="MDG_0000000020",
                name="Tuberculosis Incidence Rate",
                short_name="Tuberculosis Incidence",
                definition="Estimated number of new and relapse tuberculosis cases arising in a given year, expressed per 100 000 population.",
                unit="Cases / 100 000",
                metric_type="rate_per_100000",
                default_classification="natural_breaks",
                is_inverted=True,
                methodology="WHO Global Tuberculosis Programme epidemiological estimates combining case notifications, inventory studies, and mortality surveys.",
                source_url="https://www.who.int/data/gho/data/indicators/indicator-details/GHO/incidence-of-tuberculosis-(per-100-000-population-per-year)",
            ),
            IndicatorMetadata(
                id="HIV_0000000001",
                category="infectious_diseases",
                category_name="Infectious Diseases",
                dataset_id="who_gho",
                code="HIV_0000000001",
                name="HIV Incidence",
                short_name="HIV Incidence Rate",
                definition="Number of newly infected individuals with HIV per 1 000 uninfected population in the specified year.",
                unit="New cases / 1 000 uninfected",
                metric_type="rate_per_1000",
                default_classification="natural_breaks",
                is_inverted=True,
                methodology="UNAIDS/WHO mathematical modeling using the Spectrum/EPP modeling package informed by antenatal clinic sentinel surveillance and national population surveys.",
                source_url="https://www.who.int/data/gho/data/indicators/indicator-details/GHO/hiv-incidence-per-1000-uninfected-population",
            ),
            IndicatorMetadata(
                id="MH_12",
                category="mental_health",
                category_name="Mental Health",
                dataset_id="who_gho",
                code="MH_12",
                name="Suicide Mortality Rate",
                short_name="Suicide Mortality",
                definition="Crude and age-standardized suicide mortality rate per 100 000 population per year.",
                unit="Deaths / 100 000",
                metric_type="rate_per_100000",
                default_classification="natural_breaks",
                is_inverted=True,
                methodology="WHO Department of Mental Health and Substance Use cause-of-death estimates based on civil registration and vital statistics (CRVS) registries.",
                source_url="https://www.who.int/data/gho/data/indicators/indicator-details/GHO/suicide-mortality-rate-(per-100-000-population)",
            ),
            IndicatorMetadata(
                id="NCD_BMI_30C",
                category="noncommunicable_diseases",
                category_name="Noncommunicable Diseases",
                dataset_id="who_gho",
                code="NCD_BMI_30C",
                name="Adult Obesity Prevalence (BMI >= 30)",
                short_name="Adult Obesity Prevalence",
                definition="Age-standardized prevalence of obesity among adults aged 18+ years (Body Mass Index >= 30 kg/m2).",
                unit="% of adults",
                metric_type="percentage",
                default_classification="quantiles",
                is_inverted=True,
                methodology="NCD Risk Factor Collaboration (NCD-RisC) and WHO global Bayesian hierarchical modeling applied to physical population health examination surveys.",
                source_url="https://www.who.int/data/gho/data/indicators/indicator-details/GHO/prevalence-of-obesity-among-adults-bmi-=-30-(crude-estimate)-(-)",
            ),
            IndicatorMetadata(
                id="NCD_HYP_PREVALENCE_A",
                category="noncommunicable_diseases",
                category_name="Noncommunicable Diseases",
                dataset_id="who_gho",
                code="NCD_HYP_PREVALENCE_A",
                name="Adult Hypertension Prevalence",
                short_name="Hypertension Prevalence",
                definition="Age-standardized prevalence of hypertension among adults aged 30–79 years (systolic blood pressure >= 140 mmHg or diastolic >= 90 mmHg or taking antihypertensive medication).",
                unit="% of adults",
                metric_type="percentage",
                default_classification="quantiles",
                is_inverted=True,
                methodology="Global pooling of measured blood pressure surveys by the NCD Risk Factor Collaboration and WHO.",
                source_url="https://www.who.int/data/gho/data/indicators/indicator-details/GHO/prevalence-of-hypertension-among-adults-aged-30-79-years",
            ),
            IndicatorMetadata(
                id="AIR_41",
                category="environmental_health",
                category_name="Environmental Health & WASH",
                dataset_id="who_gho",
                code="AIR_41",
                name="Ambient Air Pollution PM2.5 Annual Mean",
                short_name="PM2.5 Air Pollution",
                definition="Annual mean concentration of fine particulate matter (PM2.5) in urban and rural areas, measured in micrograms per cubic meter (ug/m3).",
                unit="ug / m3",
                metric_type="rate_per_1000",
                default_classification="natural_breaks",
                is_inverted=True,
                methodology="Global Burden of Disease and WHO Data Integration Model for Air Quality (DIMAQ) combining ground monitoring stations, satellite aerosol optical depth, and chemical transport models.",
                source_url="https://www.who.int/data/gho/data/indicators/indicator-details/GHO/ambient-air-pollution-attributable-deaths",
            ),
            IndicatorMetadata(
                id="WSH_WATER_SAFELY_MANAGED",
                category="environmental_health",
                category_name="Environmental Health & WASH",
                dataset_id="who_gho",
                code="WSH_WATER_SAFELY_MANAGED",
                name="Safely Managed Drinking Water Services",
                short_name="Safely Managed Water",
                definition="Percentage of population using drinking water from an improved source that is accessible on premises, available when needed, and free from fecal and priority chemical contamination.",
                unit="% of population",
                metric_type="percentage",
                default_classification="quantiles",
                is_inverted=False,
                methodology="WHO/UNICEF Joint Monitoring Programme for Water Supply, Sanitation and Hygiene (JMP) multi-linear regression analysis of census and nationally representative survey microdata.",
                source_url="https://www.who.int/data/gho/data/indicators/indicator-details/GHO/population-using-safely-managed-drinking-water-services-(-)",
            ),
            IndicatorMetadata(
                id="WSH_SANITATION_SAFELY_MANAGED",
                category="environmental_health",
                category_name="Environmental Health & WASH",
                dataset_id="who_gho",
                code="WSH_SANITATION_SAFELY_MANAGED",
                name="Safely Managed Sanitation Services",
                short_name="Safely Managed Sanitation",
                definition="Percentage of population using improved sanitation facilities that are not shared with other households and where excreta are safely disposed of in situ or treated off-site.",
                unit="% of population",
                metric_type="percentage",
                default_classification="quantiles",
                is_inverted=False,
                methodology="WHO/UNICEF JMP statistical estimates compiled from national censuses, administrative data, and environmental surveillance reports.",
                source_url="https://www.who.int/data/gho/data/indicators/indicator-details/GHO/population-using-safely-managed-sanitation-services-(-)",
            ),
            IndicatorMetadata(
                id="SA_0000001688",
                category="risk_factors",
                category_name="Risk Factors & Substance Use",
                dataset_id="who_gho",
                code="SA_0000001688",
                name="Alcohol Per Capita Consumption (15+)",
                short_name="Alcohol Consumption",
                definition="Total alcohol per capita (15+ years) consumption in litres of pure alcohol per calendar year.",
                unit="Litres of pure alcohol / capita",
                metric_type="rate_per_1000",
                default_classification="natural_breaks",
                is_inverted=True,
                methodology="WHO Global Information System on Alcohol and Health (GISAH) combining government tax statistics, trade databases, and estimates of unrecorded consumption.",
                source_url="https://www.who.int/data/gho/data/indicators/indicator-details/GHO/total-alcohol-per-capita-(15-)-consumption",
            ),
            IndicatorMetadata(
                id="UHC_INDEX_REPORTED",
                category="healthcare_systems",
                category_name="Healthcare Systems & Workforce",
                dataset_id="who_gho",
                code="UHC_INDEX_REPORTED",
                name="Universal Health Coverage (UHC) Index",
                short_name="Universal Health Coverage Index",
                definition="Coverage index for essential health services (SDG indicator 3.8.1) computed on a scale of 0 to 100 representing reproductive, maternal, newborn, child, infectious disease, and noncommunicable disease service coverage.",
                unit="Index (0–100)",
                metric_type="percentage",
                default_classification="equal_intervals",
                is_inverted=False,
                methodology="Calculated by WHO as the geometric mean of 14 tracer indicators across four service categories.",
                source_url="https://www.who.int/data/gho/data/indicators/indicator-details/GHO/uhc-service-coverage-index",
            ),
            IndicatorMetadata(
                id="HWF_0001",
                category="healthcare_systems",
                category_name="Healthcare Systems & Workforce",
                dataset_id="who_gho",
                code="HWF_0001",
                name="Medical Doctors Density",
                short_name="Physicians Density",
                definition="Density of medical doctors (generalist and specialist medical practitioners) per 10 000 population.",
                unit="Doctors / 10 000",
                metric_type="rate_per_1000",
                default_classification="quantiles",
                is_inverted=False,
                methodology="WHO National Health Workforce Accounts (NHWA) and global workforce registry statistics.",
                source_url="https://www.who.int/data/gho/data/indicators/indicator-details/GHO/medical-doctors-(per-10-000-population)",
            ),
            IndicatorMetadata(
                id="WHOSIS_000002",
                category="demographics_life_expectancy",
                category_name="Demographics & Longevity",
                dataset_id="who_gho",
                code="WHOSIS_000002",
                name="Healthy Life Expectancy (HALE) at Birth",
                short_name="Healthy Life Expectancy (HALE)",
                definition="Average number of years that a person can expect to live in 'full health' by taking into account years lived in less than full health due to disease and/or injury.",
                unit="Years",
                metric_type="years",
                default_classification="quantiles",
                is_inverted=False,
                methodology="WHO Global Health Estimates combining standard life tables with prevalence estimates of non-fatal health states and disability weights.",
                source_url="https://www.who.int/data/gho/data/indicators/indicator-details/GHO/healthy-life-expectancy-(hale)-at-birth-(years)",
            ),
            IndicatorMetadata(
                id="NUTRITION_WH_2",
                category="nutrition",
                category_name="Nutrition & Malnutrition",
                dataset_id="who_gho",
                code="NUTRITION_WH_2",
                name="Child Wasting Prevalence (< 5 Years)",
                short_name="Child Wasting Prevalence",
                definition="Percentage of children under 5 years of age who are wasted (weight-for-height below -2 standard deviations from the WHO Child Growth Standards median).",
                unit="% of children < 5",
                metric_type="percentage",
                default_classification="quantiles",
                is_inverted=True,
                methodology="UNICEF/WHO/World Bank Group Joint Child Malnutrition Estimates (JME) derived from national nutrition surveys and demographic health surveys.",
                source_url="https://www.who.int/data/gho/data/indicators/indicator-details/GHO/gho-jme-wasting-prevalence",
            ),
            IndicatorMetadata(
                id="WHOSIS_000004",
                category="mortality_burden",
                category_name="Mortality & Disease Burden",
                dataset_id="who_gho",
                code="WHOSIS_000004",
                name="Adult Mortality Rate (Probability of Dying 15–60)",
                short_name="Adult Mortality Rate",
                definition="Probability that a 15-year-old person will die before reaching their 60th birthday, expressed per 1 000 population.",
                unit="Deaths / 1 000 (ages 15–60)",
                metric_type="rate_per_1000",
                default_classification="natural_breaks",
                is_inverted=True,
                methodology="Calculated from national life tables, civil registration and vital statistics (CRVS), and demographic surveys compiled by the WHO Department of Data and Analytics.",
                source_url="https://www.who.int/data/gho/data/indicators/indicator-details/GHO/adult-mortality-rate-(probability-of-dying-between-15-and-60-years-per-1000-population)",
            ),
            IndicatorMetadata(
                id="WHS3_45",
                category="neglected_tropical_diseases",
                category_name="Neglected Tropical Diseases",
                dataset_id="who_gho",
                code="WHS3_45",
                name="New Leprosy Cases Registered",
                short_name="New Leprosy Cases",
                definition="Annual number of newly detected and registered cases of leprosy (Hansen's disease) reported by national disease control programmes.",
                unit="Registered cases",
                metric_type="count",
                default_classification="logarithmic",
                is_inverted=True,
                methodology="Official national surveillance data submitted annually to the WHO Global Leprosy Programme.",
                source_url="https://www.who.int/data/gho/data/indicators/indicator-details/GHO/new-cases-of-leprosy",
            ),
            IndicatorMetadata(
                id="SDGIHR",
                category="health_security_emergencies",
                category_name="Health Security & Emergencies",
                dataset_id="who_gho",
                code="SDGIHR",
                name="IHR Core Capacity Score (SPAR Average)",
                short_name="Health Security / IHR Capacity",
                definition="Average percentage of 13 International Health Regulations (2005) core capacities achieved by the State Party, assessing national pandemic and outbreak preparedness.",
                unit="% capacity",
                metric_type="percentage",
                default_classification="equal_intervals",
                is_inverted=False,
                methodology="State Party Self-Assessment Annual Reporting (SPAR) tool submitted to the World Health Assembly under IHR Article 54.",
                source_url="https://www.who.int/data/gho/data/indicators/indicator-details/GHO/international-health-regulations-(2005)-monitoring-framework",
            ),
            IndicatorMetadata(
                id="M_Est_tob_curr",
                category="risk_factors",
                category_name="Risk Factors & Substance Use",
                dataset_id="who_gho",
                code="M_Est_tob_curr",
                name="Current Tobacco Use Prevalence",
                short_name="Tobacco Use Prevalence",
                definition="Age-standardized prevalence of current tobacco smoking or use among persons aged 15 years and older.",
                unit="% of adults (15+)",
                metric_type="percentage",
                default_classification="quantiles",
                is_inverted=True,
                methodology="WHO global report on trends in prevalence of tobacco use 2000–2030, applying Bayesian meta-regression modeling across national population surveys.",
                source_url="https://www.who.int/data/gho/data/indicators/indicator-details/GHO/gho-tobacco-control-monitor-prevalence",
            ),
        ]

    def fetch_indicator_data(
        self, indicator_code: str, country_mapper: Any, start_year: Optional[int] = None, end_year: Optional[int] = None
    ) -> List[NormalizedObservation]:
        """Queries the WHO GHO API for the indicator, filters by COUNTRY, maps to canonical ISO3,

        and extracts point estimates + uncertainty intervals.
        """
        url = f"{self.BASE_URL}/{indicator_code}"
        self.logger.info(f"Fetching WHO GHO data from: {url}")

        req = urllib.request.Request(url, headers={"User-Agent": "GlobalHealthAtlas/1.0 (PublicHealthResearch)"})
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                if resp.status != 200:
                    self.logger.error(f"HTTP error {resp.status} fetching {indicator_code}")
                    return []
                payload = json.loads(resp.read().decode("utf-8"))
        except Exception as e:
            self.logger.error(f"Network error fetching indicator {indicator_code}: {e}")
            return []

        raw_records = payload.get("value", [])
        self.logger.info(f"Retrieved {len(raw_records)} raw records for {indicator_code}")

        # Find indicator metadata to know units
        ind_meta = next((i for i in self.get_supported_indicators() if i.code == indicator_code), None)
        unit = ind_meta.unit if ind_meta else ""

        observations: List[NormalizedObservation] = []
        skipped_non_country = 0
        skipped_unmapped = 0
        skipped_invalid_val = 0

        for r in raw_records:
            # We strictly want country-level observations
            spatial_type = r.get("SpatialDimType")
            if spatial_type != "COUNTRY":
                skipped_non_country += 1
                continue

            raw_country = r.get("SpatialDim")
            iso3 = country_mapper.map_to_iso3(raw_country)
            if not iso3:
                skipped_unmapped += 1
                continue

            # Year
            try:
                year = int(r.get("TimeDim", 0))
            except (ValueError, TypeError):
                continue

            if start_year and year < start_year:
                continue
            if end_year and year > end_year:
                continue

            # Numeric value
            num_val = r.get("NumericValue")
            if num_val is None:
                # Try parsing from Value string
                raw_str = str(r.get("Value", "")).replace(" ", "").replace(",", ".")
                try:
                    num_val = float(raw_str)
                except ValueError:
                    skipped_invalid_val += 1
                    continue

            # Uncertainty intervals
            low = r.get("Low")
            high = r.get("High")
            if low is not None:
                try:
                    low = float(low)
                except (ValueError, TypeError):
                    low = None
            if high is not None:
                try:
                    high = float(high)
                except (ValueError, TypeError):
                    high = None

            # Determine data status (WHO distinguishes estimated vs reported in metadata)
            # Most WHO epidemiological indicators are model-based estimates
            data_status = "estimated"
            if "reported" in (ind_meta.name.lower() if ind_meta else ""):
                data_status = "reported"

            obs = NormalizedObservation(
                country_iso3=iso3,
                indicator_code=indicator_code,
                year=year,
                value=round(float(num_val), 3),
                unit=unit,
                lower_bound=round(low, 3) if low is not None else None,
                upper_bound=round(high, 3) if high is not None else None,
                data_status=data_status,
                methodology_note=r.get("Comments"),
                source_id="who",
                dataset_id="who_gho",
                comments=r.get("Comments"),
                retrieved_at=r.get("Date") or "",
            )
            observations.append(obs)

        self.logger.info(
            f"Successfully normalized {len(observations)} observations for {indicator_code} "
            f"(skipped: {skipped_non_country} non-country aggregates, {skipped_unmapped} unmapped, {skipped_invalid_val} invalid values)"
        )
        return observations
