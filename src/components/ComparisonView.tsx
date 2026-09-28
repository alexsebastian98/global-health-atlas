/**
 * Multi-Country Public Health Comparison Console
 * 
 * Allows users to select multiple countries and compare trajectories over time
 * for any verified public health indicator with aligned axes and tabular figures.
 */

import React, { useState, useEffect } from 'react';
import { Plus, X, GitCompare, TrendingUp, Info } from 'lucide-react';
import { Country, Indicator, CountryTrend } from '../types/atlas';
import { api } from '../services/api';

interface ComparisonViewProps {
  countries: Country[];
  indicators: Indicator[];
  selectedIndicator: Indicator | null;
  onSelectIndicator: (indicator: Indicator) => void;
}

const COUNTRY_COLORS = ['#38bdf8', '#34d399', '#f472b6', '#facc15'];

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  countries,
  indicators,
  selectedIndicator,
  onSelectIndicator,
}) => {
  // Default selected comparison countries: Nigeria, India, Brazil, Germany
  const [selectedIsoCodes, setSelectedIsoCodes] = useState<string[]>(['NGA', 'IND', 'BRA', 'DEU']);
  const [trends, setTrends] = useState<Record<string, CountryTrend>>({});
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Fetch trend data whenever selected countries or indicator changes
  useEffect(() => {
    if (!selectedIndicator || selectedIsoCodes.length === 0) return;

    setLoading(true);
    api
      .getTrends(selectedIndicator.code, selectedIsoCodes)
      .then((data) => setTrends(data))
      .catch((err) => console.error('Error fetching comparison trends:', err))
      .finally(() => setLoading(false));
  }, [selectedIndicator, selectedIsoCodes]);

  const handleAddCountry = (iso3: string) => {
    if (selectedIsoCodes.length < 4 && !selectedIsoCodes.includes(iso3)) {
      setSelectedIsoCodes([...selectedIsoCodes, iso3]);
      setShowAddMenu(false);
      setSearchQuery('');
    }
  };

  const handleRemoveCountry = (iso3: string) => {
    setSelectedIsoCodes(selectedIsoCodes.filter((c) => c !== iso3));
  };

  // Get full country objects for selected codes
  const selectedCountries = selectedIsoCodes
    .map((iso) => countries.find((c) => c.iso3 === iso))
    .filter(Boolean) as Country[];

  // Compute common year span and max value for SVG graph
  const allPoints: { year: number; value: number; iso3: string }[] = [];
  Object.entries(trends).forEach(([iso3, t]) => {
    t.data.forEach((p) => {
      allPoints.push({ year: p.year, value: p.value, iso3 });
    });
  });

  const years = Array.from(new Set(allPoints.map((p) => p.year))).sort((a, b) => a - b);
  const minYear = years.length ? years[0] : 2000;
  const maxYear = years.length ? years[years.length - 1] : 2024;
  const maxValue = allPoints.length ? Math.max(...allPoints.map((p) => p.value)) * 1.15 : 100;
  const minValue = 0;

  const width = 800;
  const height = 300;
  const padding = { top: 30, right: 40, bottom: 40, left: 60 };

  const scaleX = (yr: number) => {
    if (minYear === maxYear) return padding.left;
    return padding.left + ((yr - minYear) / (maxYear - minYear)) * (width - padding.left - padding.right);
  };

  const scaleY = (val: number) => {
    return height - padding.bottom - ((val - minValue) / (maxValue - minValue)) * (height - padding.top - padding.bottom);
  };

  const filteredSearchCountries = searchQuery.trim()
    ? countries
        .filter(
          (c) =>
            !selectedIsoCodes.includes(c.iso3) &&
            (c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              c.iso3.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        .slice(0, 8)
    : [];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-8 text-slate-100">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header & Indicator Selector */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider mb-1">
              Comparative Longitudinal Analysis
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <GitCompare className="w-6 h-6 text-cyan-400" />
              Country Comparison
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Cross-country epidemiological comparison over time. Every trajectory is backed by official World Health Organization records.
            </p>
          </div>

          {/* Indicator Selector */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg p-2">
            <span className="text-xs text-slate-400 font-medium">Indicator:</span>
            <select
              value={selectedIndicator?.code || ''}
              onChange={(e) => {
                const ind = indicators.find((i) => i.code === e.target.value);
                if (ind) onSelectIndicator(ind);
              }}
              className="bg-slate-950 border border-slate-700 text-cyan-400 text-xs font-semibold rounded px-3 py-1.5 focus:border-cyan-500 focus:outline-none"
            >
              {indicators.map((ind) => (
                <option key={ind.code} value={ind.code}>
                  {ind.category_name} — {ind.short_name || ind.name} ({ind.unit})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Countries Chip Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {selectedCountries.map((c, idx) => (
            <div
              key={c.iso3}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-slate-900/80 border-slate-800 shadow-sm"
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COUNTRY_COLORS[idx % COUNTRY_COLORS.length] }}
              />
              <span className="font-semibold text-xs text-white">{c.name}</span>
              <span className="font-mono text-[10px] text-slate-400 uppercase">{c.iso3}</span>
              <button
                onClick={() => handleRemoveCountry(c.iso3)}
                className="text-slate-400 hover:text-rose-400 ml-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {selectedIsoCodes.length < 4 && (
            <div className="relative">
              <button
                onClick={() => setShowAddMenu(!showAddMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-slate-700 hover:border-cyan-500 text-xs text-slate-300 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-cyan-400" />
                <span>Add Country ({selectedIsoCodes.length}/4)</span>
              </button>

              {showAddMenu && (
                <div className="absolute left-0 top-full mt-2 w-64 bg-slate-950 border border-slate-700 rounded-lg shadow-2xl p-2 z-30">
                  <input
                    type="text"
                    placeholder="Search country to add..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 mb-2"
                  />
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {filteredSearchCountries.map((c) => (
                      <button
                        key={c.iso3}
                        onClick={() => handleAddCountry(c.iso3)}
                        className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 rounded flex items-center justify-between text-xs"
                      >
                        <span className="text-slate-200">{c.name}</span>
                        <span className="font-mono text-slate-400 text-[10px] uppercase">{c.iso3}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Multi-Curve Historical Trend Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                {selectedIndicator?.name} Trajectories
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                Unit: {selectedIndicator?.unit} · Years {minYear} to {maxYear}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              {selectedCountries.map((c, idx) => (
                <div key={c.iso3} className="flex items-center gap-1.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: COUNTRY_COLORS[idx % COUNTRY_COLORS.length] }}
                  />
                  <span className="text-slate-300">{c.name}</span>
                </div>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-slate-400">Loading multi-country trajectories...</div>
          ) : allPoints.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-xs">
              No overlapping longitudinal data points found for the selected nations in {selectedIndicator?.short_name}.
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[650px] select-none">
                {/* Horizontal Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                  const val = minValue + ratio * (maxValue - minValue);
                  const y = scaleY(val);
                  return (
                    <g key={ratio}>
                      <line
                        x1={padding.left}
                        y1={y}
                        x2={width - padding.right}
                        y2={y}
                        stroke="#1e293b"
                        strokeDasharray={ratio === 0 ? 'none' : '2,3'}
                        strokeWidth={1}
                      />
                      <text
                        x={padding.left - 10}
                        y={y + 3}
                        fill="#94a3b8"
                        fontSize={10}
                        fontFamily="monospace"
                        textAnchor="end"
                      >
                        {val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val.toFixed(1)}
                      </text>
                    </g>
                  );
                })}

                {/* X Axis Years */}
                {years
                  .filter((_, idx) => idx % Math.max(1, Math.floor(years.length / 8)) === 0 || idx === years.length - 1)
                  .map((yr) => (
                    <text
                      key={yr}
                      x={scaleX(yr)}
                      y={height - padding.bottom + 20}
                      fill="#94a3b8"
                      fontSize={10}
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {yr}
                    </text>
                  ))}

                {/* Country Lines */}
                {selectedCountries.map((c, idx) => {
                  const countryTrend = trends[c.iso3];
                  if (!countryTrend || countryTrend.data.length === 0) return null;

                  const color = COUNTRY_COLORS[idx % COUNTRY_COLORS.length];
                  const sortedData = [...countryTrend.data].sort((a, b) => a.year - b.year);

                  const pathStr = sortedData
                    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(d.year)} ${scaleY(d.value)}`)
                    .join(' ');

                  return (
                    <g key={c.iso3}>
                      {/* Path Line */}
                      <path d={pathStr} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" />

                      {/* Data Dots */}
                      {sortedData.map((d) => (
                        <circle
                          key={d.year}
                          cx={scaleX(d.year)}
                          cy={scaleY(d.value)}
                          r={3.5}
                          fill={color}
                          stroke="#020617"
                          strokeWidth={1.5}
                        />
                      ))}
                    </g>
                  );
                })}
              </svg>
            </div>
          )}
        </div>

        {/* Tabular Quantitative Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Quantitative Historical Matrix</h3>
            <span className="text-xs text-slate-400 font-mono">Values in {selectedIndicator?.unit}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-6 font-semibold">Territory</th>
                  <th className="py-3 px-6 font-semibold">WHO Region</th>
                  {years.slice(-6).map((yr) => (
                    <th key={yr} className="py-3 px-4 font-mono font-semibold text-right">
                      {yr}
                    </th>
                  ))}
                  <th className="py-3 px-6 font-semibold text-right">Latest Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {selectedCountries.map((c, idx) => {
                  const countryTrend = trends[c.iso3];
                  const dataMap = new Map(countryTrend?.data.map((d) => [d.year, d]) || []);
                  const latestPoint = countryTrend?.data.slice(-1)[0];

                  return (
                    <tr key={c.iso3} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-6 font-sans font-medium text-white flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: COUNTRY_COLORS[idx % COUNTRY_COLORS.length] }}
                        />
                        {c.name}
                      </td>
                      <td className="py-3 px-6 text-slate-400 font-sans">{c.who_region_name || 'Global'}</td>
                      {years.slice(-6).map((yr) => {
                        const pt = dataMap.get(yr);
                        return (
                          <td key={yr} className="py-3 px-4 text-right tabular-nums">
                            {pt ? (
                              <span className="text-slate-200">
                                {pt.value >= 1000 ? pt.value.toLocaleString() : pt.value.toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="py-3 px-6 text-right font-sans">
                        <span className="text-[11px] capitalize text-slate-300">
                          {latestPoint?.data_status || 'Unrecorded'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Methodological Context Note */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-4 flex items-start gap-3 text-xs text-slate-400">
          <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-slate-300">Scientific Comparison Context</div>
            <p>
              Different nations employ varying surveillance methods and census intervals. When comparing indicators,
              consult the 95% uncertainty intervals and methodological notes. Absence of points for specific years
              indicates that the estimating body did not publish estimates, rather than an incidence of zero.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
