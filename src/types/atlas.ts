/**
 * Type definitions for Global Health Atlas.
 */

export interface Source {
  id: string;
  name: string;
  organization: string;
  website_url: string;
  license_name: string;
  license_url: string;
  terms_summary: string;
  attribution_requirement: string;
}

export interface Indicator {
  id: string;
  category_id: string;
  category_name: string;
  code: string;
  name: string;
  short_name: string;
  definition: string;
  unit: string;
  metric_type: string;
  default_classification: 'quantiles' | 'natural_breaks' | 'logarithmic' | 'equal_intervals';
  is_inverted: boolean;
  methodology: string;
  source_url: string;
  source_name: string;
  attribution?: string;
  min_year?: number;
  max_year?: number;
  observation_count?: number;
}

export interface Country {
  iso3: string;
  name: string;
  canonical_name: string;
  who_code?: string;
  who_region_code?: string;
  who_region_name?: string;
  population?: number;
}

export interface Observation {
  country_iso3: string;
  country_name?: string;
  who_region_code?: string;
  who_region_name?: string;
  year: number;
  value: number;
  unit: string;
  lower_bound?: number | null;
  upper_bound?: number | null;
  data_status: 'estimated' | 'reported' | 'modeled' | 'provisional' | 'projected';
  methodology_note?: string;
  source_name?: string;
  attribution_requirement?: string;
}

export interface ObservationsResponse {
  indicator_code: string;
  year: number;
  stats: {
    count: number;
    min: number;
    max: number;
    mean: number;
    median: number;
    q25: number;
    q75: number;
  };
  total_reporting: number;
  observations: Record<string, Observation>;
  list: Observation[];
}

export interface CountryProfile {
  country: Country;
  latest_indicators: Array<{
    indicator_code: string;
    indicator_name: string;
    short_name: string;
    unit: string;
    category_id: string;
    category_name: string;
    year: number;
    value: number;
    lower_bound?: number | null;
    upper_bound?: number | null;
    data_status: string;
    methodology_note?: string;
    source_name: string;
  }>;
}

export interface TrendPoint {
  year: number;
  value: number;
  unit: string;
  lower_bound?: number | null;
  upper_bound?: number | null;
  data_status: string;
}

export interface CountryTrend {
  country_iso3: string;
  country_name: string;
  data: TrendPoint[];
}

export interface DataQualitySummary {
  total_observations: number;
  total_countries_covered: number;
  total_indicators_active: number;
  with_uncertainty_interval: number;
  status_estimated: number;
  status_reported: number;
  status_modeled: number;
}

export interface DataUpdateRecord {
  source_id: string;
  indicator_code: string;
  status: string;
  records_ingested: number;
  error_message?: string;
  started_at: string;
  completed_at: string;
}
