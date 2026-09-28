/**
 * Global Statistical Distribution, Inequality & Registry Analysis Modal
 * 
 * Provides deep epidemiological moments, Gini coefficient & Lorenz curves,
 * spatial autocorrelation (Moran's I) & regional ANOVA variance decomposition,
 * Tukey's fences outlier detection, and a full sortable global data registry with CSV export.
 */

import React, { useState, useMemo } from 'react';
import {
  X,
  BarChart2,
  Download,
  Table,
  Globe,
  ArrowUpDown,
  TrendingUp,
  AlertCircle,
  Activity,
  Layers,
  Percent,
  Compass,
} from 'lucide-react';
import { Indicator, Observation } from '../types/atlas';
import {
  ColorBin,
  calculateDistributionStats,
  calculateStatisticalOutliers,
  calculateRegionalANOVA,
  DistributionStats,
  StatisticalOutlier,
  RegionalVarianceAnalysis,
} from '../utils/colorScales';

interface StatisticalAnalysisModalProps {
  indicator: Indicator | null;
  year: number;
  observations: Record<string, Observation>;
  bins: ColorBin[];
  onClose: () => void;
  onSelectCountry: (iso3: string) => void;
}

type TabType = 'distribution' | 'inequality' | 'clustering' | 'regional' | 'outliers' | 'table';

export const StatisticalAnalysisModal: React.FC<StatisticalAnalysisModalProps> = ({
  indicator,
  year,
  observations,
  bins,
  onClose,
  onSelectCountry,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('distribution');
  const [tableSearch, setTableSearch] = useState('');
  const [sortField, setSortField] = useState<'country_name' | 'value' | 'who_region_name'>('value');
  const [sortAsc, setSortAsc] = useState(false);
  const [hoveredLorenzDecile, setHoveredLorenzDecile] = useState<number | null>(null);

  const obsList = useMemo(() => Object.values(observations), [observations]);
  const values = useMemo(
    () => obsList.map((o) => o.value).filter((v) => typeof v === 'number' && !isNaN(v)),
    [obsList]
  );

  const stats: DistributionStats = useMemo(() => {
    return calculateDistributionStats(values, bins);
  }, [values, bins]);

  const outliers: StatisticalOutlier[] = useMemo(() => {
    return calculateStatisticalOutliers(obsList, stats);
  }, [obsList, stats]);

  const anova: RegionalVarianceAnalysis = useMemo(() => {
    return calculateRegionalANOVA(obsList);
  }, [obsList]);

  // Regional breakdown calculations
  const regionalSummary = useMemo(() => {
    const map = new Map<string, { region: string; values: number[]; count: number }>();
    for (const obs of obsList) {
      const reg = obs.who_region_name || 'Global Other';
      if (!map.has(reg)) {
        map.set(reg, { region: reg, values: [], count: 0 });
      }
      map.get(reg)!.values.push(obs.value);
      map.get(reg)!.count++;
    }

    const summary: {
      region: string;
      count: number;
      mean: number;
      median: number;
      stdDev: number;
      min: number;
      max: number;
      totalShare: number;
    }[] = [];

    const grandTotal = values.reduce((a, b) => a + b, 0);

    map.forEach((item) => {
      const sorted = [...item.values].sort((a, b) => a - b);
      const sum = sorted.reduce((a, b) => a + b, 0);
      const mean = sum / sorted.length;
      const median =
        sorted.length % 2 === 0
          ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
          : sorted[Math.floor(sorted.length / 2)];
      const variance = sorted.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / (sorted.length > 1 ? sorted.length - 1 : 1);
      const stdDev = Math.sqrt(variance);

      summary.push({
        region: item.region,
        count: item.count,
        mean,
        median,
        stdDev,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        totalShare: grandTotal > 0 ? (sum / grandTotal) * 100 : 0,
      });
    });

    return summary.sort((a, b) => b.mean - a.mean);
  }, [obsList, values]);

  // Filtered and sorted table records
  const filteredTable = useMemo(() => {
    let list = [...obsList];
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      list = list.filter(
        (o) =>
          (o.country_name && o.country_name.toLowerCase().includes(q)) ||
          o.country_iso3.toLowerCase().includes(q) ||
          (o.who_region_name && o.who_region_name.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    return list;
  }, [obsList, tableSearch, sortField, sortAsc]);

  const handleExportCSV = () => {
    if (!indicator || obsList.length === 0) return;
    const headers = [
      'ISO3',
      'Country',
      'WHO Region',
      'Indicator Code',
      'Indicator Name',
      'Year',
      'Value',
      'Unit',
      '95% Lower Bound',
      '95% Upper Bound',
      'Data Status',
      'Source',
    ];
    const rows = obsList.map((o) => [
      o.country_iso3,
      `"${o.country_name || ''}"`,
      `"${o.who_region_name || ''}"`,
      indicator.code,
      `"${indicator.name}"`,
      o.year,
      o.value,
      `"${o.unit}"`,
      o.lower_bound ?? '',
      o.upper_bound ?? '',
      o.data_status,
      `"${o.source_name || indicator.source_name}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${indicator.code}_${year}_global_health_atlas.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSort = (field: 'country_name' | 'value' | 'who_region_name') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'country_name');
    }
  };

  if (!indicator) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between bg-slate-900/70">
          <div>
            <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider mb-0.5">
              Epidemiological Statistics & Global Registry
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-cyan-400" />
              {indicator.short_name || indicator.name} ({year})
            </h2>
            <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-3">
              <span>Domain: <strong className="text-slate-200">{indicator.category_name}</strong></span>
              <span>·</span>
              <span>Unit: <span className="font-mono text-cyan-400">{indicator.unit}</span></span>
              <span>·</span>
              <span>Reporting: <span className="text-white font-mono">{stats.count}</span> nations</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500 rounded-lg text-xs font-medium text-slate-200 transition-colors"
              title="Download CSV dataset"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-2 border-b border-slate-800 bg-slate-950 flex items-center gap-5 text-xs font-medium text-slate-400 overflow-x-auto">
          <button
            onClick={() => setActiveTab('distribution')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'distribution'
                ? 'text-cyan-400 border-cyan-400 font-semibold'
                : 'border-transparent hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Moments & Histogram</span>
          </button>

          <button
            onClick={() => setActiveTab('inequality')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'inequality'
                ? 'text-cyan-400 border-cyan-400 font-semibold'
                : 'border-transparent hover:text-white'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>Inequality & Lorenz Curve</span>
          </button>

          <button
            onClick={() => setActiveTab('clustering')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'clustering'
                ? 'text-cyan-400 border-cyan-400 font-semibold'
                : 'border-transparent hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Spatial & Regional ANOVA</span>
          </button>

          <button
            onClick={() => setActiveTab('regional')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'regional'
                ? 'text-cyan-400 border-cyan-400 font-semibold'
                : 'border-transparent hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>WHO Regional Aggregations</span>
          </button>

          <button
            onClick={() => setActiveTab('outliers')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'outliers'
                ? 'text-cyan-400 border-cyan-400 font-semibold'
                : 'border-transparent hover:text-white'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Anomaly & Outliers ({outliers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('table')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'table'
                ? 'text-cyan-400 border-cyan-400 font-semibold'
                : 'border-transparent hover:text-white'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Global Registry ({stats.count})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 text-xs text-slate-300">
          {/* TAB 1: Statistical Moments & Histogram */}
          {activeTab === 'distribution' && (
            <div className="space-y-6">
              {/* Primary Moments Grid */}
              <div>
                <div className="text-[11px] font-mono uppercase text-slate-400 tracking-wider mb-2">
                  Central Tendency & Dispersion Parameters
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                    <div className="text-[10px] uppercase font-mono text-slate-400">Mean (μ)</div>
                    <div className="text-lg font-bold font-mono text-white tabular-nums">
                      {stats.mean >= 1000 ? stats.mean.toLocaleString(undefined, { maximumFractionDigits: 1 }) : stats.mean.toFixed(2)}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mt-1">SE: {(stats.stdDev / Math.sqrt(Math.max(1, stats.count))).toFixed(2)}</div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                    <div className="text-[10px] uppercase font-mono text-slate-400">Median (Q2 / P50)</div>
                    <div className="text-lg font-bold font-mono text-cyan-400 tabular-nums">
                      {stats.median >= 1000 ? stats.median.toLocaleString(undefined, { maximumFractionDigits: 1 }) : stats.median.toFixed(2)}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mt-1">Robust midpoint</div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                    <div className="text-[10px] uppercase font-mono text-slate-400">Std Deviation (σ)</div>
                    <div className="text-lg font-bold font-mono text-white tabular-nums">
                      {stats.stdDev >= 1000 ? stats.stdDev.toLocaleString(undefined, { maximumFractionDigits: 1 }) : stats.stdDev.toFixed(2)}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mt-1">Var: {Math.pow(stats.stdDev, 2).toFixed(1)}</div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                    <div className="text-[10px] uppercase font-mono text-slate-400">Coeff. of Variation (CV)</div>
                    <div className="text-lg font-bold font-mono text-emerald-400 tabular-nums">
                      {stats.coeffOfVariation.toFixed(1)}%
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mt-1">Relative dispersion</div>
                  </div>
                </div>
              </div>

              {/* Quantiles & Shape Parameters */}
              <div>
                <div className="text-[11px] font-mono uppercase text-slate-400 tracking-wider mb-2">
                  Quantile Cuts & Distribution Topology
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                    <div className="text-[10px] uppercase font-mono text-slate-400">Interquartile Range (IQR)</div>
                    <div className="text-base font-semibold font-mono text-white tabular-nums">
                      {stats.iqr >= 1000 ? stats.iqr.toLocaleString(undefined, { maximumFractionDigits: 1 }) : stats.iqr.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Q1: {stats.q25.toFixed(1)} · Q3: {stats.q75.toFixed(1)}</div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                    <div className="text-[10px] uppercase font-mono text-slate-400">Decile Range (P10 – P90)</div>
                    <div className="text-xs font-semibold font-mono text-slate-300 tabular-nums mt-1">
                      {stats.p10.toFixed(1)} – {stats.p90 >= 1000 ? stats.p90.toLocaleString() : stats.p90.toFixed(1)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">P95: {stats.p95.toFixed(1)}</div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                    <div className="text-[10px] uppercase font-mono text-slate-400">Skewness Index</div>
                    <div className="text-base font-semibold font-mono text-amber-400 tabular-nums">
                      {stats.skewness.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {stats.skewness > 0.5 ? 'Right-skewed' : stats.skewness < -0.5 ? 'Left-skewed' : 'Symmetric'}
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                    <div className="text-[10px] uppercase font-mono text-slate-400">Excess Kurtosis</div>
                    <div className="text-base font-semibold font-mono text-purple-400 tabular-nums">
                      {stats.kurtosis.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {stats.kurtosis > 1 ? 'Leptokurtic (Heavy tails)' : stats.kurtosis < -1 ? 'Platykurtic' : 'Mesokurtic'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Frequency Distribution Histogram */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                    Choropleth Bin Frequency Histogram
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">
                    Frequencies across {bins.length} classification classes
                  </span>
                </div>

                <div className="space-y-3">
                  {stats.bins.map((b, idx) => {
                    const pct = stats.count > 0 ? (b.count / stats.count) * 100 : 0;
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-300 flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-sm border border-slate-700 shrink-0"
                              style={{ backgroundColor: b.color }}
                            />
                            {b.label}
                          </span>
                          <span className="text-slate-400 tabular-nums">
                            <strong className="text-white">{b.count}</strong> countries ({pct.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.max(pct, 2)}%`,
                              backgroundColor: b.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Global Inequality & Lorenz Curve */}
          {activeTab === 'inequality' && (
            <div className="space-y-6">
              {/* Inequality Indices Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="text-[10px] uppercase font-mono text-cyan-400">Gini Inequality Coefficient</div>
                  <div className="text-3xl font-extrabold font-mono text-white tabular-nums my-1">
                    {stats.gini.toFixed(3)}
                  </div>
                  <div className="text-xs text-slate-300">
                    {stats.gini < 0.25
                      ? 'Low global inequality: outcome is evenly distributed across nations.'
                      : stats.gini < 0.45
                      ? 'Moderate international inequality with discernible regional disparities.'
                      : 'Severe global concentration: substantial health burden is concentrated in few countries.'}
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="text-[10px] uppercase font-mono text-cyan-400">Palma Disparity Ratio</div>
                  <div className="text-3xl font-extrabold font-mono text-amber-400 tabular-nums my-1">
                    {stats.palmaRatio.toFixed(2)}x
                  </div>
                  <div className="text-xs text-slate-300">
                    Ratio of health burden in top 10% countries relative to the bottom 40% countries.
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="text-[10px] uppercase font-mono text-cyan-400">90:10 Decile Ratio</div>
                  <div className="text-3xl font-extrabold font-mono text-purple-400 tabular-nums my-1">
                    {stats.decileRatio.toFixed(1)}x
                  </div>
                  <div className="text-xs text-slate-300">
                    Multiple separating the 90th percentile nations from the 10th percentile baseline.
                  </div>
                </div>
              </div>

              {/* Lorenz Curve Visualizer */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                      Empirical Lorenz Inequality Curve
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Cumulative percentage of reporting countries vs cumulative percentage of total global health burden
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-mono">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <span className="w-3 h-0.5 border-t border-dashed border-slate-500 inline-block" />
                      Line of Perfect Equality (45°)
                    </span>
                    <span className="flex items-center gap-1.5 text-cyan-400">
                      <span className="w-3 h-0.5 bg-cyan-400 inline-block" />
                      Observed Lorenz Curve
                    </span>
                  </div>
                </div>

                {/* SVG Curve Canvas */}
                <div className="relative w-full h-64 bg-slate-950 rounded-lg border border-slate-800 p-4">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {/* Grid lines */}
                    <line x1="0" y1="25" x2="100" y2="25" stroke="#334155" strokeWidth="0.3" strokeDasharray="1,1" />
                    <line x1="0" y1="50" x2="100" y2="50" stroke="#334155" strokeWidth="0.3" strokeDasharray="1,1" />
                    <line x1="0" y1="75" x2="100" y2="75" stroke="#334155" strokeWidth="0.3" strokeDasharray="1,1" />
                    <line x1="25" y1="0" x2="25" y2="100" stroke="#334155" strokeWidth="0.3" strokeDasharray="1,1" />
                    <line x1="50" y1="0" x2="50" y2="100" stroke="#334155" strokeWidth="0.3" strokeDasharray="1,1" />
                    <line x1="75" y1="0" x2="75" y2="100" stroke="#334155" strokeWidth="0.3" strokeDasharray="1,1" />

                    {/* Equality Line (45 degrees) */}
                    <line x1="0" y1="100" x2="100" y2="0" stroke="#64748b" strokeWidth="1" strokeDasharray="2,2" />

                    {/* Shaded Area of Gini Inequality */}
                    {stats.lorenzCurve.length > 1 && (
                      <polygon
                        points={`0,100 ${stats.lorenzCurve.map((p) => `${p.populationShare},${100 - p.burdenShare}`).join(' ')} 100,0 0,100`}
                        fill="rgba(6, 182, 212, 0.15)"
                      />
                    )}

                    {/* Lorenz Curve Line */}
                    {stats.lorenzCurve.length > 1 && (
                      <polyline
                        points={stats.lorenzCurve.map((p) => `${p.populationShare},${100 - p.burdenShare}`).join(' ')}
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {/* Decile Node Points */}
                    {stats.lorenzCurve.map((p, idx) => (
                      <circle
                        key={idx}
                        cx={p.populationShare}
                        cy={100 - p.burdenShare}
                        r={hoveredLorenzDecile === idx ? 3.5 : 2}
                        className="transition-all cursor-pointer"
                        fill={hoveredLorenzDecile === idx ? '#38bdf8' : '#0284c7'}
                        stroke="#ffffff"
                        strokeWidth="0.8"
                        onMouseEnter={() => setHoveredLorenzDecile(idx)}
                        onMouseLeave={() => setHoveredLorenzDecile(null)}
                      />
                    ))}
                  </svg>

                  {/* Decile Inspection Tooltip */}
                  {hoveredLorenzDecile !== null && stats.lorenzCurve[hoveredLorenzDecile] && (
                    <div className="absolute top-4 right-4 bg-slate-900 border border-cyan-500/50 rounded-lg p-2.5 shadow-xl text-xs font-mono">
                      <div className="text-cyan-400 font-bold">Decile Inspection</div>
                      <div className="text-white mt-1">
                        Lowest <strong className="text-cyan-300">{stats.lorenzCurve[hoveredLorenzDecile].populationShare}%</strong> of nations
                      </div>
                      <div className="text-slate-300">
                        account for <strong className="text-cyan-300">{stats.lorenzCurve[hoveredLorenzDecile].burdenShare.toFixed(1)}%</strong> of cumulative global volume
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-2 px-1">
                  <span>0% (Lowest Burden)</span>
                  <span>Cumulative % of Global Nations</span>
                  <span>100% (All Nations)</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Spatial Autocorrelation & Regional ANOVA */}
          {activeTab === 'clustering' && (
            <div className="space-y-6">
              {/* ANOVA & Spatial Indicators Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-cyan-400">Spatial Autocorrelation</span>
                    <Compass className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-white mt-2 mb-1">
                    Moran's I: {stats.moransI.toFixed(3)}
                  </div>
                  <div className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {stats.moransI > 0.3
                      ? 'Positive geographic clustering: neighboring nations share similar epidemiologic burdens rather than random global spread.'
                      : stats.moransI > 0
                      ? 'Weak-to-moderate spatial autocorrelation across geographic regions.'
                      : 'Dispersed / Negative spatial autocorrelation: health outcomes vary independently of regional borders.'}
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-cyan-400">One-Way Regional ANOVA</span>
                    <Layers className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-white mt-2 mb-1">
                    η² Effect Size: {anova.etaSquared.toFixed(1)}%
                  </div>
                  <div className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {anova.interpretation}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-3 pt-2 border-t border-slate-800 flex justify-between">
                    <span>Fisher F-Stat: <strong className="text-white">{anova.fStatistic}</strong></span>
                    <span>Between Var: <strong className="text-white">{anova.betweenVariance}</strong></span>
                    <span>Within Var: <strong className="text-white">{anova.withinVariance}</strong></span>
                  </div>
                </div>
              </div>

              {/* Regional Parity Breakdown Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="p-4 bg-slate-900/90 border-b border-slate-800">
                  <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                    Geographic Region Health Gradient
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Comparative variance across the 6 official WHO regional bodies
                  </p>
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono text-[11px]">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">WHO Region</th>
                      <th className="py-2.5 px-3 text-right">Countries</th>
                      <th className="py-2.5 px-3 text-right">Mean</th>
                      <th className="py-2.5 px-3 text-right">Median</th>
                      <th className="py-2.5 px-3 text-right">Std Dev</th>
                      <th className="py-2.5 px-3 text-right">Min – Max</th>
                      <th className="py-2.5 px-4 text-right">% of Global Volume</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {regionalSummary.map((reg) => (
                      <tr key={reg.region} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-4 font-sans font-medium text-white">{reg.region}</td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-slate-300">{reg.count}</td>
                        <td className="py-2.5 px-3 text-right tabular-nums font-bold text-cyan-400">
                          {reg.mean >= 1000 ? reg.mean.toLocaleString(undefined, { maximumFractionDigits: 1 }) : reg.mean.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-slate-200">
                          {reg.median >= 1000 ? reg.median.toLocaleString(undefined, { maximumFractionDigits: 1 }) : reg.median.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-slate-400">
                          {reg.stdDev.toFixed(1)}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-slate-400">
                          {reg.min.toFixed(1)} – {reg.max >= 1000 ? reg.max.toLocaleString() : reg.max.toFixed(1)}
                        </td>
                        <td className="py-2.5 px-4 text-right tabular-nums font-semibold text-emerald-400">
                          {reg.totalShare.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: WHO Regional Aggregations */}
          {activeTab === 'regional' && (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-5 font-semibold">WHO Region</th>
                      <th className="py-3 px-4 font-mono font-semibold text-right">Reporting Countries</th>
                      <th className="py-3 px-4 font-mono font-semibold text-right">Regional Mean</th>
                      <th className="py-3 px-4 font-mono font-semibold text-right">Regional Median</th>
                      <th className="py-3 px-4 font-mono font-semibold text-right">Range [Min – Max]</th>
                      <th className="py-3 px-4 font-mono font-semibold text-right">Regional Burden Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {regionalSummary.map((reg) => (
                      <tr key={reg.region} className="hover:bg-slate-800/40">
                        <td className="py-3 px-5 font-sans font-medium text-white">{reg.region}</td>
                        <td className="py-3 px-4 text-right tabular-nums text-slate-300">{reg.count}</td>
                        <td className="py-3 px-4 text-right tabular-nums font-bold text-cyan-400">
                          {reg.mean >= 1000 ? reg.mean.toLocaleString(undefined, { maximumFractionDigits: 1 }) : reg.mean.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums text-slate-200">
                          {reg.median >= 1000 ? reg.median.toLocaleString(undefined, { maximumFractionDigits: 1 }) : reg.median.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums text-slate-400">
                          [{reg.min.toFixed(1)} – {reg.max >= 1000 ? reg.max.toLocaleString() : reg.max.toFixed(1)}]
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums font-semibold text-emerald-400">
                          {reg.totalShare.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: Anomaly & Outlier Detection */}
          {activeTab === 'outliers' && (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    Statistical Outlier Surveillance (Tukey's Fences & Z-Scores)
                  </h3>
                  <span className="text-xs font-mono text-slate-400">
                    Detected: <strong className="text-white">{outliers.length}</strong> anomalous nations
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Nations lying beyond 1.5×IQR fences (mild) or 3.0×IQR / |Z| &gt; 3.0 (extreme). Indicates severe hyperendemicity or rapid progressive elimination.
                </p>
              </div>

              {outliers.length === 0 ? (
                <div className="p-8 text-center text-slate-400 font-mono text-xs bg-slate-900/50 rounded-xl border border-slate-800">
                  No statistical outliers detected for this indicator year. Distribution is uniform within 1.5×IQR bounds.
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono text-[11px]">
                      <tr>
                        <th className="py-2.5 px-4 font-semibold">Country</th>
                        <th className="py-2.5 px-3 font-semibold">ISO3</th>
                        <th className="py-2.5 px-3 text-right">Value ({indicator.unit})</th>
                        <th className="py-2.5 px-3 text-right">Deviation (Z-Score)</th>
                        <th className="py-2.5 px-4 font-semibold">Anomaly Classification</th>
                        <th className="py-2.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {outliers.map((out) => (
                        <tr key={out.country_iso3} className="hover:bg-slate-800/40">
                          <td className="py-2.5 px-4 font-sans font-medium text-white">{out.country_name || out.country_iso3}</td>
                          <td className="py-2.5 px-3 text-slate-400">{out.country_iso3}</td>
                          <td className="py-2.5 px-3 text-right font-bold tabular-nums text-white">
                            {out.value >= 1000 ? out.value.toLocaleString() : out.value.toFixed(2)}
                          </td>
                          <td className={`py-2.5 px-3 text-right tabular-nums font-semibold ${
                            out.zScore > 0 ? 'text-amber-400' : 'text-cyan-400'
                          }`}>
                            {out.zScore > 0 ? `+${out.zScore}` : out.zScore}σ
                          </td>
                          <td className="py-2.5 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                              out.severity === 'extreme'
                                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}>
                              {out.severity === 'extreme' ? 'Extreme Outlier' : 'Mild Outlier'} ({out.type === 'high' ? 'High Burden' : 'Exceptional Baseline'})
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <button
                              onClick={() => {
                                onSelectCountry(out.country_iso3);
                                onClose();
                              }}
                              className="text-cyan-400 hover:text-cyan-300 font-sans text-xs underline font-medium"
                            >
                              View Profile
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: Full Global Registry */}
          {activeTab === 'table' && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="flex items-center justify-between gap-4">
                <input
                  type="text"
                  placeholder="Filter country or region..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 w-72 focus:outline-none focus:border-cyan-500"
                />
                <span className="text-slate-400 text-xs font-mono">
                  Showing {filteredTable.length} of {obsList.length} records
                </span>
              </div>

              {/* Data Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden max-h-[50vh] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 sticky top-0 z-10">
                    <tr>
                      <th
                        onClick={() => handleSort('country_name')}
                        className="py-3 px-4 font-semibold cursor-pointer hover:text-white"
                      >
                        <div className="flex items-center gap-1">
                          <span>Country</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th className="py-3 px-3 font-mono font-semibold">ISO3</th>
                      <th
                        onClick={() => handleSort('who_region_name')}
                        className="py-3 px-4 font-semibold cursor-pointer hover:text-white"
                      >
                        <div className="flex items-center gap-1">
                          <span>WHO Region</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('value')}
                        className="py-3 px-4 font-mono font-semibold text-right cursor-pointer hover:text-white"
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>Value ({indicator.unit})</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th className="py-3 px-4 font-mono font-semibold text-right">95% Uncertainty</th>
                      <th className="py-3 px-3 font-mono font-semibold text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {filteredTable.map((o) => (
                      <tr
                        key={o.country_iso3}
                        onClick={() => {
                          onSelectCountry(o.country_iso3);
                          onClose();
                        }}
                        className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                      >
                        <td className="py-2.5 px-4 font-sans font-medium text-white">{o.country_name || o.country_iso3}</td>
                        <td className="py-2.5 px-3 text-slate-400">{o.country_iso3}</td>
                        <td className="py-2.5 px-4 font-sans text-slate-300">{o.who_region_name || '—'}</td>
                        <td className="py-2.5 px-4 text-right font-bold tabular-nums text-cyan-400">
                          {o.value >= 1000 ? o.value.toLocaleString() : o.value.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-4 text-right text-slate-400 tabular-nums">
                          {typeof o.lower_bound === 'number' && typeof o.upper_bound === 'number'
                            ? `[${o.lower_bound.toFixed(1)} – ${o.upper_bound.toFixed(1)}]`
                            : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold ${
                              o.data_status === 'reported'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {o.data_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-cyan-400">Public Health Informatics Standard</span>
            <span>·</span>
            <span>All estimates synthesized directly from authoritative WHO/World Bank data repositories.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
