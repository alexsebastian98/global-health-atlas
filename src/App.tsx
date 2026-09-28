/**
 * Global Health Atlas - Root Application
 * 
 * "An interactive visual atlas of the health of the planet."
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AtlasHeader, ActiveTab } from './components/AtlasHeader';
import { ControlsBar } from './components/ControlsBar';
import { WorldMap } from './components/WorldMap';
import { MapLegend } from './components/MapLegend';
import { CountryProfileDrawer } from './components/CountryProfileDrawer';
import { ComparisonView } from './components/ComparisonView';
import { DataQualityView } from './components/DataQualityView';
import { SourcesView } from './components/SourcesView';
import { DataProvenanceModal } from './components/DataProvenanceModal';
import { StatisticalAnalysisModal } from './components/StatisticalAnalysisModal';
import { AtlasFooter } from './components/AtlasFooter';
import { Indicator, Country, Observation, ObservationsResponse } from './types/atlas';
import { api } from './services/api';
import {
  calculateClassificationBins,
  calculateDistributionStats,
  ColorBin,
  ClassificationMethod,
  PaletteType,
} from './utils/colorScales';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('atlas');
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [selectedIndicator, setSelectedIndicator] = useState<Indicator | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [geoJson, setGeoJson] = useState<any>(null);

  // Time machine & spatial parameters
  const [selectedYear, setSelectedYear] = useState<number>(2022);
  const [availableYears, setAvailableYears] = useState<number[]>([2000, 2024]);
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [projectionMode, setProjectionMode] = useState<'equal-earth' | 'globe'>('equal-earth');

  // Statistical calibration options
  const [classificationMethod, setClassificationMethod] = useState<ClassificationMethod>('quantiles');
  const [paletteChoice, setPaletteChoice] = useState<PaletteType>('auto');

  // Observations data
  const [observations, setObservations] = useState<Record<string, Observation>>({});
  const [obsStats, setObsStats] = useState<{ min: number; max: number; mean: number; median: number } | undefined>();
  const [totalReporting, setTotalReporting] = useState<number>(0);
  const [loadingObs, setLoadingObs] = useState<boolean>(true);
  const [initError, setInitError] = useState<string | null>(null);

  // Modals & Drawers state
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [showProvenanceModal, setShowProvenanceModal] = useState<boolean>(false);
  const [showStatsModal, setShowStatsModal] = useState<boolean>(false);

  // 1. Initial Load: Indicators, Countries, and World GeoJSON
  useEffect(() => {
    let isMounted = true;

    Promise.all([api.getIndicators(), api.getCountries(), api.getGeoJson()])
      .then(([inds, cntrs, geo]) => {
        if (!isMounted) return;

        setIndicators(inds);
        setCountries(cntrs);
        setGeoJson(geo);

        // Select Malaria Incidence as primary MVP indicator
        const malaria = inds.find((i) => i.code === 'MALARIA_EST_INCIDENCE') || inds[0];
        if (malaria) {
          setSelectedIndicator(malaria);
        }
      })
      .catch((err) => {
        console.error('Initialization error:', err);
        if (isMounted) setInitError('Failed to initialize atlas boundaries and indicator registry.');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. When Indicator Changes: Fetch available years
  useEffect(() => {
    if (!selectedIndicator) return;

    let isMounted = true;
    api
      .getIndicatorDetails(selectedIndicator.code)
      .then((res) => {
        if (!isMounted) return;
        if (res.available_years && res.available_years.length > 0) {
          setAvailableYears(res.available_years);
          const latestYear = res.available_years[res.available_years.length - 1];
          setSelectedYear(latestYear);
        }
      })
      .catch((err) => console.error('Failed to load indicator details:', err));

    return () => {
      isMounted = false;
    };
  }, [selectedIndicator]);

  // 3. When Indicator, Year, or Region Changes: Load Observations
  useEffect(() => {
    if (!selectedIndicator) return;

    let isMounted = true;
    setLoadingObs(true);

    api
      .getObservations(selectedIndicator.code, selectedYear, selectedRegion)
      .then((res: ObservationsResponse) => {
        if (!isMounted) return;
        setObservations(res.observations || {});
        setObsStats(res.stats);
        setTotalReporting(res.total_reporting || 0);
      })
      .catch((err) => {
        console.error('Failed to load observations:', err);
        if (isMounted) setObservations({});
      })
      .finally(() => {
        if (isMounted) setLoadingObs(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedIndicator, selectedYear, selectedRegion]);

  // Calculate discrete color bins based on distribution and selected classification
  const obsValues = useMemo(() => {
    return Object.values(observations)
      .map((o) => o.value)
      .filter((v) => typeof v === 'number' && !isNaN(v));
  }, [observations]);

  const bins: ColorBin[] = useMemo(() => {
    return calculateClassificationBins(
      obsValues,
      selectedIndicator?.is_inverted ?? true,
      6,
      classificationMethod,
      paletteChoice
    );
  }, [obsValues, selectedIndicator, classificationMethod, paletteChoice]);

  const distributionStats = useMemo(() => {
    return calculateDistributionStats(obsValues, bins);
  }, [obsValues, bins]);

  const handleSelectCountry = useCallback((c: Country) => {
    setSelectedCountry(c);
  }, []);

  const handleSelectCountryIso = useCallback(
    (iso3: string) => {
      const match = countries.find((c) => c.iso3 === iso3);
      if (match) {
        setSelectedCountry(match);
      } else {
        setSelectedCountry({ iso3, name: iso3, canonical_name: iso3 });
      }
    },
    [countries]
  );

  const handleIndicatorChangeFromCode = useCallback(
    (code: string) => {
      const ind = indicators.find((i) => i.code === code);
      if (ind) setSelectedIndicator(ind);
    },
    [indicators]
  );

  if (initError) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="bg-slate-900 border border-rose-800 rounded-xl p-6 max-w-md text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-white">Initialization Notice</h2>
          <p className="text-xs text-slate-300">{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-white"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* 3-Zone Header Contract */}
      <AtlasHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenProvenance={() => setShowProvenanceModal(true)}
      />

      {/* Main View Router */}
      {activeTab === 'atlas' && (
        <div className="flex flex-col flex-1 relative overflow-hidden">
          {/* Controls, Classification & Time Scrubber Bar */}
          <ControlsBar
            indicators={indicators}
            selectedIndicator={selectedIndicator}
            onSelectIndicator={setSelectedIndicator}
            availableYears={availableYears}
            selectedYear={selectedYear}
            onSelectYear={setSelectedYear}
            selectedRegion={selectedRegion}
            onSelectRegion={setSelectedRegion}
            countries={countries}
            onSelectCountry={handleSelectCountry}
            projection={projectionMode}
            onToggleProjection={() =>
              setProjectionMode(projectionMode === 'equal-earth' ? 'globe' : 'equal-earth')
            }
            classificationMethod={classificationMethod}
            onSelectClassificationMethod={setClassificationMethod}
            paletteChoice={paletteChoice}
            onSelectPalette={setPaletteChoice}
            onOpenStats={() => setShowStatsModal(true)}
          />

          {/* Interactive World Map (Primary Focus) */}
          <div className="flex-1 relative w-full h-full bg-slate-950">
            {loadingObs && (
              <div className="absolute top-4 left-6 z-30 flex items-center gap-2 bg-slate-900/90 border border-slate-700 text-cyan-400 text-xs px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Synchronizing observations for {selectedYear}...</span>
              </div>
            )}

            <WorldMap
              geoJson={geoJson}
              observations={observations}
              selectedIndicator={selectedIndicator}
              selectedYear={selectedYear}
              bins={bins}
              projectionMode={projectionMode}
              onSelectCountry={handleSelectCountry}
              selectedCountryIso3={selectedCountry?.iso3 || null}
            />

            {/* Scientific Legend & Distribution Inspector */}
            <MapLegend
              indicator={selectedIndicator}
              bins={bins}
              year={selectedYear}
              totalReporting={totalReporting}
              classificationMethod={classificationMethod}
              onOpenStats={() => setShowStatsModal(true)}
              stats={distributionStats}
            />
          </div>

          {/* Slide-In Country Profile Drawer */}
          {selectedCountry && (
            <CountryProfileDrawer
              country={selectedCountry}
              selectedIndicator={selectedIndicator}
              onClose={() => setSelectedCountry(null)}
              onSelectIndicator={handleIndicatorChangeFromCode}
            />
          )}
        </div>
      )}

      {activeTab === 'compare' && (
        <ComparisonView
          countries={countries}
          indicators={indicators}
          selectedIndicator={selectedIndicator}
          onSelectIndicator={setSelectedIndicator}
        />
      )}

      {activeTab === 'data-quality' && <DataQualityView />}

      {activeTab === 'sources' && <SourcesView />}

      {/* Persistent Global Footer */}
      <AtlasFooter
        activeTab={activeTab}
        onNavigateTab={setActiveTab}
        onOpenProvenance={() => setShowProvenanceModal(true)}
      />

      {/* Statistical Distribution & Global Data Table Modal */}
      {showStatsModal && (
        <StatisticalAnalysisModal
          indicator={selectedIndicator}
          year={selectedYear}
          observations={observations}
          bins={bins}
          onClose={() => setShowStatsModal(false)}
          onSelectCountry={handleSelectCountryIso}
        />
      )}

      {/* Data Provenance & Methodology Modal */}
      {showProvenanceModal && (
        <DataProvenanceModal
          indicator={selectedIndicator}
          onClose={() => setShowProvenanceModal(false)}
        />
      )}
    </div>
  );
}
