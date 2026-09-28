/**
 * Atlas Parameter & Timeline Controls Bar
 * 
 * Provides domain selection, indicator dropdown, WHO region filter,
 * classification algorithms (Quantiles, Natural Breaks, Equal Intervals, Logarithmic),
 * palette styling, country search, and Time Machine playback.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Search, Globe, Map, BarChart2, Sliders } from 'lucide-react';
import { Indicator, Country } from '../types/atlas';
import { ClassificationMethod, PaletteType } from '../utils/colorScales';

interface ControlsBarProps {
  indicators: Indicator[];
  selectedIndicator: Indicator | null;
  onSelectIndicator: (indicator: Indicator) => void;
  availableYears: number[];
  selectedYear: number;
  onSelectYear: (year: number) => void;
  selectedRegion: string;
  onSelectRegion: (region: string) => void;
  countries: Country[];
  onSelectCountry: (country: Country) => void;
  projection: 'equal-earth' | 'globe';
  onToggleProjection: () => void;
  classificationMethod: ClassificationMethod;
  onSelectClassificationMethod: (method: ClassificationMethod) => void;
  paletteChoice: PaletteType;
  onSelectPalette: (palette: PaletteType) => void;
  onOpenStats: () => void;
}

const WHO_REGIONS = [
  { code: 'ALL', name: 'Global (All Regions)' },
  { code: 'AFR', name: 'African Region (AFRO)' },
  { code: 'AMR', name: 'Region of the Americas (AMRO)' },
  { code: 'SEAR', name: 'South-East Asia (SEARO)' },
  { code: 'EUR', name: 'European Region (EURO)' },
  { code: 'EMR', name: 'Eastern Mediterranean (EMRO)' },
  { code: 'WPR', name: 'Western Pacific (WPRO)' },
];

export const ControlsBar: React.FC<ControlsBarProps> = ({
  indicators,
  selectedIndicator,
  onSelectIndicator,
  availableYears,
  selectedYear,
  onSelectYear,
  selectedRegion,
  onSelectRegion,
  countries,
  onSelectCountry,
  projection,
  onToggleProjection,
  classificationMethod,
  onSelectClassificationMethod,
  paletteChoice,
  onSelectPalette,
  onOpenStats,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Group indicators by health domain
  const domains = Array.from(new Set(indicators.map((i) => i.category_name)));
  const currentDomain = selectedIndicator?.category_name || domains[0] || 'Infectious Diseases';

  // Indicators under active domain
  const domainIndicators = indicators.filter((i) => i.category_name === currentDomain);

  // Playback timer
  useEffect(() => {
    let interval: any = null;
    if (isPlaying && availableYears.length > 1) {
      interval = setInterval(() => {
        onSelectYear(
          (() => {
            const currentIndex = availableYears.indexOf(selectedYear);
            if (currentIndex === -1 || currentIndex >= availableYears.length - 1) {
              return availableYears[0];
            }
            return availableYears[currentIndex + 1];
          })()
        );
      }, 1400);
    } else {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, selectedYear, availableYears, onSelectYear]);

  // Click outside to dismiss search suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCountries = searchQuery.trim()
    ? countries
        .filter(
          (c) =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.iso3.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 6)
    : [];

  const handleStepBack = () => {
    const idx = availableYears.indexOf(selectedYear);
    if (idx > 0) {
      onSelectYear(availableYears[idx - 1]);
    }
  };

  const handleStepForward = () => {
    const idx = availableYears.indexOf(selectedYear);
    if (idx !== -1 && idx < availableYears.length - 1) {
      onSelectYear(availableYears[idx + 1]);
    }
  };

  return (
    <div className="bg-slate-900/95 border-b border-slate-800 px-6 py-2 flex flex-col gap-2 text-xs z-30">
      {/* Primary Control Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Domain, Indicator, and Region Selectors */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Domain Selector */}
          <div className="flex items-center gap-1.5">
            <label className="text-slate-400 font-medium">Domain</label>
            <select
              value={currentDomain}
              onChange={(e) => {
                const newDomain = e.target.value;
                const firstInd = indicators.find((i) => i.category_name === newDomain);
                if (firstInd) onSelectIndicator(firstInd);
              }}
              className="bg-slate-950 border border-slate-700 text-slate-100 rounded px-2.5 py-1.5 focus:border-cyan-500 focus:outline-none"
            >
              {domains.map((dom) => {
                const count = indicators.filter((i) => i.category_name === dom).length;
                return (
                  <option key={dom} value={dom}>
                    {dom} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Indicator Selector */}
          <div className="flex items-center gap-1.5">
            <label className="text-slate-400 font-medium">Indicator</label>
            <select
              value={selectedIndicator?.code || ''}
              onChange={(e) => {
                const ind = indicators.find((i) => i.code === e.target.value);
                if (ind) onSelectIndicator(ind);
              }}
              className="bg-slate-950 border border-slate-700 text-cyan-400 font-medium rounded px-2.5 py-1.5 focus:border-cyan-500 focus:outline-none max-w-xs truncate"
            >
              {domainIndicators.map((ind) => (
                <option key={ind.code} value={ind.code}>
                  {ind.short_name || ind.name} ({ind.unit})
                </option>
              ))}
            </select>
          </div>

          {/* WHO Region Filter */}
          <div className="flex items-center gap-1.5">
            <label className="text-slate-400 font-medium">Region</label>
            <select
              value={selectedRegion}
              onChange={(e) => onSelectRegion(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 rounded px-2 py-1.5 focus:border-cyan-500 focus:outline-none"
            >
              {WHO_REGIONS.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Middle: Time Machine Scrubbing & Playback */}
        <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1">
          <button
            onClick={handleStepBack}
            disabled={availableYears.indexOf(selectedYear) <= 0}
            title="Previous year"
            className="text-slate-400 hover:text-white disabled:opacity-30 p-1"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? 'Pause timeline' : 'Play timeline animation'}
            className={`p-1.5 rounded-full ${
              isPlaying ? 'bg-amber-500 text-slate-950' : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
            } transition-colors`}
          >
            {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
          </button>

          <button
            onClick={handleStepForward}
            disabled={availableYears.indexOf(selectedYear) >= availableYears.length - 1}
            title="Next year"
            className="text-slate-400 hover:text-white disabled:opacity-30 p-1"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          <span className="font-mono text-cyan-400 font-bold tabular-nums text-sm px-1.5">{selectedYear}</span>

          {availableYears.length > 1 && (
            <input
              type="range"
              min={availableYears[0]}
              max={availableYears[availableYears.length - 1]}
              step={1}
              value={selectedYear}
              onChange={(e) => onSelectYear(parseInt(e.target.value, 10))}
              className="w-28 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          )}
        </div>

        {/* Right: Quick Search, Statistical Analysis Button & Projection */}
        <div className="flex items-center gap-2.5">
          {/* Statistical Distribution & Registry Button */}
          <button
            onClick={onOpenStats}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-700/60 hover:border-cyan-400 rounded text-cyan-300 font-semibold transition-colors shadow-sm"
            title="Open statistical distribution, moments, and global data registry"
          >
            <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Statistics & Registry</span>
          </button>

          {/* Advanced Stats / Classification Toggle */}
          <button
            onClick={() => setShowAdvancedStats(!showAdvancedStats)}
            className={`p-1.5 border rounded transition-colors ${
              showAdvancedStats
                ? 'bg-slate-800 border-cyan-400 text-cyan-400'
                : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title="Statistical classification & color palette options"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Country Quick Search */}
          <div ref={searchRef} className="relative">
            <div className="flex items-center bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 focus-within:border-cyan-500">
              <Search className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
              <input
                type="text"
                placeholder="Search country..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-28"
              />
            </div>

            {showSearchResults && filteredCountries.length > 0 && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-slate-950 border border-slate-700 rounded-md shadow-xl py-1 z-50">
                {filteredCountries.map((c) => (
                  <button
                    key={c.iso3}
                    onClick={() => {
                      onSelectCountry(c);
                      setSearchQuery('');
                      setShowSearchResults(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center justify-between text-xs"
                  >
                    <span className="text-slate-200 truncate">{c.name}</span>
                    <span className="font-mono text-slate-500 text-[10px] uppercase ml-2">{c.iso3}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Projection Mode Toggle (Equal Earth vs 3D Globe) */}
          <button
            onClick={onToggleProjection}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 border border-slate-700 hover:border-slate-500 rounded text-slate-300 transition-colors"
            title={`Switch to ${projection === 'equal-earth' ? '3D Orthographic Globe' : 'Equal Earth Flat Map'}`}
          >
            {projection === 'equal-earth' ? (
              <>
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>Globe</span>
              </>
            ) : (
              <>
                <Map className="w-3.5 h-3.5 text-cyan-400" />
                <span>Equal Earth</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Advanced Statistical Calibration Ribbon (Collapsible) */}
      {showAdvancedStats && (
        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-[11px] text-slate-300 animate-in fade-in duration-100">
          <div className="flex flex-wrap items-center gap-4">
            {/* Classification Method */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-mono uppercase text-[10px]">Classification Algorithm:</span>
              <select
                value={classificationMethod}
                onChange={(e) => onSelectClassificationMethod(e.target.value as ClassificationMethod)}
                className="bg-slate-950 border border-slate-700 text-cyan-400 rounded px-2 py-0.5 focus:outline-none"
              >
                <option value="quantiles">Quantiles (Equal Frequency per Class)</option>
                <option value="natural_breaks">Natural Breaks (Jenks k-means Variance Minimization)</option>
                <option value="equal_intervals">Equal Intervals (Uniform Metric Spans)</option>
                <option value="logarithmic">Logarithmic (Geometric Progression for Skewed Counts)</option>
              </select>
            </div>

            {/* Color Palette */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-mono uppercase text-[10px]">Palette Progression:</span>
              <select
                value={paletteChoice}
                onChange={(e) => onSelectPalette(e.target.value as PaletteType)}
                className="bg-slate-950 border border-slate-700 text-slate-200 rounded px-2 py-0.5 focus:outline-none"
              >
                <option value="auto">Auto (Epidemiological Polarity)</option>
                <option value="disease_burden">Disease Burden (Emerald → Yellow → Crimson)</option>
                <option value="positive_health">Positive Health (Crimson → Yellow → Cobalt)</option>
                <option value="viridis">Viridis (Perceptually Uniform)</option>
                <option value="plasma">Plasma (Thermal Contrast)</option>
                <option value="magma">Magma (Dark Violet → Peach)</option>
              </select>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 font-mono">
            Statistical Method: <strong className="text-slate-200 uppercase">{classificationMethod.replace('_', ' ')}</strong> · 6 discrete classes
          </div>
        </div>
      )}
    </div>
  );
};
