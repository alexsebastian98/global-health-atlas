/**
 * Country Profile Epidemiological Dossier
 * 
 * Provides an in-depth clinical and public health profile for the selected nation:
 * - Demographics and WHO region classification
 * - Dual-curve historical trend graph with 95% uncertainty interval ribbon
 * - Multi-domain indicator dossier (Infectious disease, maternal/child, vaccines, financing)
 * - Traceable provenance, methodology notes, and source citation
 */

import React, { useEffect, useState } from 'react';
import { X, ExternalLink, Calendar, ShieldCheck, Activity, TrendingUp } from 'lucide-react';
import { Country, CountryProfile, Indicator, CountryTrend } from '../types/atlas';
import { api } from '../services/api';

interface CountryProfileDrawerProps {
  country: Country | null;
  selectedIndicator: Indicator | null;
  onClose: () => void;
  onSelectIndicator: (indicatorCode: string) => void;
}

export const CountryProfileDrawer: React.FC<CountryProfileDrawerProps> = ({
  country,
  selectedIndicator,
  onClose,
  onSelectIndicator,
}) => {
  const [profile, setProfile] = useState<CountryProfile | null>(null);
  const [trend, setTrend] = useState<CountryTrend | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);

  useEffect(() => {
    if (!country) return;

    let isMounted = true;
    setLoading(true);

    // Fetch country dossier
    api
      .getCountryProfile(country.iso3)
      .then((data) => {
        if (isMounted) setProfile(data);
      })
      .catch((err) => console.error('Failed to load country profile:', err));

    // Fetch trend for current indicator
    if (selectedIndicator) {
      api
        .getTrends(selectedIndicator.code, [country.iso3])
        .then((trends) => {
          if (isMounted) {
            setTrend(trends[country.iso3] || null);
          }
        })
        .catch((err) => console.error('Failed to load country trend:', err))
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [country, selectedIndicator]);

  if (!country) return null;

  // Render SVG Trend Chart
  const renderTrendChart = () => {
    if (!trend || !trend.data || trend.data.length === 0) {
      return (
        <div className="py-8 text-center text-xs text-slate-400 bg-slate-900/60 rounded-lg border border-slate-800">
          No historical time series observations available for {selectedIndicator?.short_name || 'this indicator'}.
        </div>
      );
    }

    const data = trend.data;
    const width = 380;
    const height = 180;
    const padding = { top: 20, right: 25, bottom: 30, left: 45 };

    const years = data.map((d) => d.year);
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);

    // Extract values and uncertainty bounds for Y scale
    const allYValues: number[] = [];
    data.forEach((d) => {
      if (typeof d.value === 'number') allYValues.push(d.value);
      if (typeof d.lower_bound === 'number') allYValues.push(d.lower_bound);
      if (typeof d.upper_bound === 'number') allYValues.push(d.upper_bound);
    });

    const minY = Math.min(0, Math.min(...allYValues));
    const maxY = Math.max(...allYValues) * 1.15 || 10;

    const scaleX = (yr: number) => {
      if (minYear === maxYear) return padding.left + (width - padding.left - padding.right) / 2;
      return padding.left + ((yr - minYear) / (maxYear - minYear)) * (width - padding.left - padding.right);
    };

    const scaleY = (val: number) => {
      return height - padding.bottom - ((val - minY) / (maxY - minY)) * (height - padding.top - padding.bottom);
    };

    // Construct line path
    const linePath = data
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(d.year)} ${scaleY(d.value)}`)
      .join(' ');

    // Construct uncertainty interval area path
    const hasUncertainty = data.some((d) => d.lower_bound !== null && d.upper_bound !== null);
    let areaPath = '';
    if (hasUncertainty) {
      const topPoints = data.map((d) => `${scaleX(d.year)},${scaleY(d.upper_bound ?? d.value)}`);
      const bottomPoints = [...data]
        .reverse()
        .map((d) => `${scaleX(d.year)},${scaleY(d.lower_bound ?? d.value)}`);
      areaPath = `M ${topPoints.join(' L ')} L ${bottomPoints.join(' L ')} Z`;
    }

    return (
      <div className="relative bg-slate-950/70 border border-slate-800 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[11px] font-mono text-cyan-400 font-semibold flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            Historical Trajectory ({minYear}–{maxYear})
          </div>
          {hasUncertainty && (
            <div className="text-[10px] font-mono text-slate-400">
              Shaded band: 95% Uncertainty Interval
            </div>
          )}
        </div>

        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
          {/* Grid lines */}
          <line
            x1={padding.left}
            y1={scaleY(minY)}
            x2={width - padding.right}
            y2={scaleY(minY)}
            stroke="#334155"
            strokeWidth={1}
          />
          <line
            x1={padding.left}
            y1={scaleY(maxY * 0.5)}
            x2={width - padding.right}
            y2={scaleY(maxY * 0.5)}
            stroke="#1e293b"
            strokeDasharray="2,3"
            strokeWidth={1}
          />
          <line
            x1={padding.left}
            y1={scaleY(maxY)}
            x2={width - padding.right}
            y2={scaleY(maxY)}
            stroke="#1e293b"
            strokeDasharray="2,3"
            strokeWidth={1}
          />

          {/* Uncertainty Area Ribbon */}
          {hasUncertainty && (
            <path d={areaPath} fill="#06b6d4" fillOpacity={0.15} />
          )}

          {/* Primary Trend Line */}
          <path d={linePath} fill="none" stroke="#22d3ee" strokeWidth={2} />

          {/* Points */}
          {data.map((d) => {
            const cx = scaleX(d.year);
            const cy = scaleY(d.value);
            const isHovered = hoveredPoint?.year === d.year;

            return (
              <g key={d.year}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 5 : 3}
                  fill={isHovered ? '#ffffff' : '#0891b2'}
                  stroke="#22d3ee"
                  strokeWidth={1.5}
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => setHoveredPoint(d)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              </g>
            );
          })}

          {/* Y Axis Labels */}
          <text
            x={padding.left - 8}
            y={scaleY(minY) + 3}
            fill="#94a3b8"
            fontSize={9}
            fontFamily="monospace"
            textAnchor="end"
          >
            {minY.toFixed(0)}
          </text>
          <text
            x={padding.left - 8}
            y={scaleY(maxY * 0.5) + 3}
            fill="#94a3b8"
            fontSize={9}
            fontFamily="monospace"
            textAnchor="end"
          >
            {(maxY * 0.5).toFixed(0)}
          </text>
          <text
            x={padding.left - 8}
            y={scaleY(maxY) + 3}
            fill="#94a3b8"
            fontSize={9}
            fontFamily="monospace"
            textAnchor="end"
          >
            {maxY.toFixed(0)}
          </text>

          {/* X Axis Labels */}
          <text
            x={scaleX(minYear)}
            y={height - padding.bottom + 15}
            fill="#94a3b8"
            fontSize={9}
            fontFamily="monospace"
            textAnchor="middle"
          >
            {minYear}
          </text>
          <text
            x={scaleX(maxYear)}
            y={height - padding.bottom + 15}
            fill="#94a3b8"
            fontSize={9}
            fontFamily="monospace"
            textAnchor="middle"
          >
            {maxYear}
          </text>
        </svg>

        {/* Hovered point tooltip readout */}
        {hoveredPoint && (
          <div className="mt-2 text-center text-xs font-mono bg-slate-900 border border-slate-700 py-1 px-2 rounded text-cyan-300">
            Year {hoveredPoint.year}: <strong className="text-white">{hoveredPoint.value}</strong> {hoveredPoint.unit}
            {hoveredPoint.lower_bound !== null && (
              <span className="text-slate-400 ml-2">
                (95% UI: {hoveredPoint.lower_bound} – {hoveredPoint.upper_bound})
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[460px] bg-slate-950/95 border-l border-slate-800 shadow-2xl backdrop-blur-xl z-50 flex flex-col text-slate-100 overflow-hidden animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-5 border-b border-slate-800 flex items-start justify-between bg-slate-900/60">
        <div>
          <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider mb-1">
            Country Epidemiological Dossier
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            {country.name}
            <span className="text-xs font-mono font-normal text-slate-400 px-2 py-0.5 bg-slate-800 rounded">
              {country.iso3}
            </span>
          </h2>
          <div className="text-xs text-slate-400 mt-1">
            WHO Region: <span className="text-slate-200 font-medium">{country.who_region_name || 'Global'}</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
        {/* Active Indicator Spotlight Card */}
        {selectedIndicator && (
          <div className="space-y-3">
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
              Active Map Focus
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5">
              <div className="text-xs text-slate-400 font-medium">{selectedIndicator.name}</div>
              <div className="text-[11px] text-cyan-400 font-mono mb-3">Unit: {selectedIndicator.unit}</div>

              {renderTrendChart()}
            </div>
          </div>
        )}

        {/* Multi-Domain Health Indicator Matrix */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
              Key Health Indicators
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Latest Verified Observations
            </span>
          </div>

          {loading ? (
            <div className="py-6 text-center text-slate-400">Loading indicators...</div>
          ) : profile && profile.latest_indicators.length > 0 ? (
            <div className="grid gap-2">
              {profile.latest_indicators.map((ind) => (
                <div
                  key={ind.indicator_code}
                  onClick={() => onSelectIndicator(ind.indicator_code)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                    selectedIndicator?.code === ind.indicator_code
                      ? 'bg-cyan-950/40 border-cyan-500/60 ring-1 ring-cyan-500/30'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="space-y-0.5 max-w-[240px]">
                    <div className="text-[10px] uppercase font-mono text-slate-400">
                      {ind.category_name} · {ind.year}
                    </div>
                    <div className="font-semibold text-slate-200 text-xs truncate">
                      {ind.short_name || ind.indicator_name}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                      <span>Status: <strong className="capitalize text-slate-300 font-normal">{ind.data_status}</strong></span>
                      {ind.lower_bound !== null && (
                        <span>· 95% UI: [{ind.lower_bound} – {ind.upper_bound}]</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-bold font-mono tabular-nums text-white">
                      {ind.value >= 1000 ? ind.value.toLocaleString() : ind.value.toFixed(1)}
                    </div>
                    <div className="text-[10px] font-mono text-cyan-400 truncate max-w-[120px]">
                      {ind.unit}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-slate-400 bg-slate-900 rounded-lg">
              No recorded public health observations for this territory.
            </div>
          )}
        </div>

        {/* Data Provenance & Safety Notice */}
        <div className="p-3.5 bg-slate-900/50 border border-slate-800/80 rounded-lg space-y-2 text-[11px] text-slate-400 leading-relaxed">
          <div className="flex items-center gap-1.5 font-semibold text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Empirical Health Observation Safety
          </div>
          <p>
            All displayed metrics are directly ingested from the World Health Organization (WHO) and official international statistical agencies.
            Data incorporates uncertainty intervals where published by estimating bodies.
          </p>
          <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
            Source: WHO Global Health Observatory · No artificial extrapolation.
          </div>
        </div>
      </div>
    </div>
  );
};
