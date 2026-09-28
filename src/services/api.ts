/**
 * Global Health Atlas - Client API Client
 */

import { Indicator, Country, ObservationsResponse, CountryProfile, Source, DataQualitySummary, DataUpdateRecord, CountryTrend } from '../types/atlas';

class ApiService {
  private cache = new Map<string, any>();

  private async fetchWithCache<T>(url: string, ttlMs = 60000): Promise<T> {
    const cached = this.cache.get(url);
    if (cached && Date.now() - cached.timestamp < ttlMs) {
      return cached.data;
    }

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`API Error: ${res.status} ${res.statusText} for ${url}`);
    }
    const data = await res.json();
    this.cache.set(url, { data, timestamp: Date.now() });
    return data;
  }

  async getIndicators(category?: string): Promise<Indicator[]> {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    const res = await this.fetchWithCache<{ indicators: Indicator[] }>(`/api/indicators${query}`);
    return res.indicators;
  }

  async getIndicatorDetails(id: string): Promise<{ indicator: Indicator; available_years: number[] }> {
    return this.fetchWithCache<{ indicator: Indicator; available_years: number[] }>(`/api/indicators/${id}`);
  }

  async getCountries(region?: string, search?: string): Promise<Country[]> {
    const params = new URLSearchParams();
    if (region && region !== 'ALL') params.append('region', region);
    if (search) params.append('search', search);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await this.fetchWithCache<{ countries: Country[] }>(`/api/countries${query}`);
    return res.countries;
  }

  async getCountryProfile(iso3: string): Promise<CountryProfile> {
    return this.fetchWithCache<CountryProfile>(`/api/countries/${iso3}`);
  }

  async getObservations(indicator: string, year?: number, region?: string): Promise<ObservationsResponse> {
    const params = new URLSearchParams();
    params.append('indicator', indicator);
    if (year) params.append('year', year.toString());
    if (region && region !== 'ALL') params.append('region', region);
    return this.fetchWithCache<ObservationsResponse>(`/api/observations?${params.toString()}`, 30000);
  }

  async getTrends(indicator: string, countries?: string[]): Promise<Record<string, CountryTrend>> {
    const params = new URLSearchParams();
    params.append('indicator', indicator);
    if (countries && countries.length > 0) {
      params.append('countries', countries.join(','));
    }
    const res = await this.fetchWithCache<{ indicator_code: string; trends: Record<string, CountryTrend> }>(
      `/api/trends?${params.toString()}`
    );
    return res.trends;
  }

  async getSources(): Promise<Source[]> {
    const res = await this.fetchWithCache<{ sources: Source[] }>('/api/sources');
    return res.sources;
  }

  async getDataQuality(): Promise<{ summary: DataQualitySummary; recent_updates: DataUpdateRecord[] }> {
    return this.fetchWithCache<{ summary: DataQualitySummary; recent_updates: DataUpdateRecord[] }>('/api/data-quality');
  }

  async getGeoJson(): Promise<any> {
    return this.fetchWithCache<any>('/api/geojson/countries', 3600000); // 1 hour cache
  }
}

export const api = new ApiService();
