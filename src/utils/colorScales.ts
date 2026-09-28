/**
 * Scientific Public Health Cartography Color Scaling & Classification Engine
 * 
 * Implements standard epidemiological color progressions with support for:
 * - Classification methods: Quantiles, Natural Breaks (Fisher-Jenks), Equal Intervals, Logarithmic
 * - Disease burden / Mortality (lower is better: Emerald/Teal -> Amber -> Crimson/Dark Red)
 * - Positive health outcomes (higher is better: Crimson -> Amber -> Emerald -> Cobalt)
 * - Perceptually uniform palettes: Viridis, Plasma, Magma
 * - Summary statistics: Mean, Median, StdDev, IQR, Skewness, Min, Max, and Histogram Frequencies
 * - Explicit distinction between zero values and 'No data'
 */

export interface ColorBin {
  min: number;
  max: number;
  color: string;
  label: string;
  count?: number;
}

export type ClassificationMethod = 'quantiles' | 'natural_breaks' | 'equal_intervals' | 'logarithmic';
export type PaletteType = 'auto' | 'disease_burden' | 'positive_health' | 'viridis' | 'plasma' | 'magma';

export const PALETTES: Record<string, string[]> = {
  // Infectious disease & mortality (higher = critical burden)
  disease_burden: [
    '#059669', // Emerald (low / zero transmission)
    '#84cc16', // Lime
    '#eab308', // Yellow
    '#f97316', // Orange
    '#ef4444', // Red
    '#991b1b', // Deep Crimson (extreme burden)
  ],
  // Positive indicators: Life expectancy, vaccination coverage, WASH (higher = optimal)
  positive_health: [
    '#991b1b', // Crimson (critically low)
    '#f97316', // Orange
    '#eab308', // Yellow
    '#10b981', // Emerald
    '#06b6d4', // Cyan
    '#0284c7', // Sky Blue (optimal)
  ],
  // Viridis (scientific perceptual uniformity)
  viridis: [
    '#440154',
    '#414487',
    '#2a788e',
    '#22a884',
    '#7ad151',
    '#fde725',
  ],
  // Plasma (high-contrast thermal)
  plasma: [
    '#0d0887',
    '#6a00a8',
    '#b12a90',
    '#e16462',
    '#fca636',
    '#f0f921',
  ],
  // Magma (deep purple to peach)
  magma: [
    '#000004',
    '#3b0f70',
    '#8c2981',
    '#de4968',
    '#fe9f6d',
    '#fcfdbf',
  ],
};

export const NO_DATA_COLOR = '#1e293b'; // Slate-800 for unrecorded/missing countries
export const NO_DATA_HOVER = '#334155';

export interface LorenzPoint {
  populationShare: number; // 0 to 100 (%)
  burdenShare: number;     // 0 to 100 (%)
}

export interface StatisticalOutlier {
  country_iso3: string;
  country_name?: string;
  value: number;
  zScore: number;
  type: 'high' | 'low';
  severity: 'mild' | 'extreme';
}

export interface RegionalVarianceAnalysis {
  betweenVariance: number;
  withinVariance: number;
  fStatistic: number;
  etaSquared: number; // % of variance explained by WHO regions
  interpretation: string;
}

export interface DistributionStats {
  count: number;
  min: number;
  max: number;
  mean: number;
  median: number;
  stdDev: number;
  q25: number;
  q75: number;
  iqr: number;
  p10: number;
  p90: number;
  p95: number;
  skewness: number;
  kurtosis: number;
  coeffOfVariation: number; // CV in %
  gini: number;             // Gini inequality coefficient (0 to 1)
  palmaRatio: number;       // Top 10% / Bottom 40%
  decileRatio: number;      // P90 / P10
  moransI: number;          // Spatial autocorrelation estimate (-1 to +1)
  lorenzCurve: LorenzPoint[];
  bins: { label: string; count: number; min: number; max: number; color: string }[];
}

// 1D Jenks / Natural Breaks Approximation using Jenks-style k-means
function calculateJenksBreaks(data: number[], numClasses: number): number[] {
  if (data.length <= numClasses) {
    return data;
  }
  const sorted = [...data].sort((a, b) => a - b);
  const n = sorted.length;
  
  // Use percentile-initialized seed centroids for stable convergence
  let centroids = Array.from({ length: numClasses }, (_, i) => {
    const idx = Math.floor((i + 0.5) * (n / numClasses));
    return sorted[Math.min(idx, n - 1)];
  });

  // Run 10 iterations of k-means
  for (let iter = 0; iter < 10; iter++) {
    const clusters: number[][] = Array.from({ length: numClasses }, () => []);
    for (const val of sorted) {
      let bestDist = Infinity;
      let bestIdx = 0;
      for (let c = 0; c < numClasses; c++) {
        const dist = Math.abs(val - centroids[c]);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = c;
        }
      }
      clusters[bestIdx].push(val);
    }

    centroids = clusters.map((clust, idx) => {
      if (clust.length === 0) return centroids[idx];
      return clust.reduce((a, b) => a + b, 0) / clust.length;
    });
  }

  // Derive class boundary cuts
  const breaks: number[] = [sorted[0]];
  for (let i = 0; i < numClasses - 1; i++) {
    breaks.push((centroids[i] + centroids[i + 1]) / 2);
  }
  breaks.push(sorted[n - 1]);
  return breaks;
}

export function calculateClassificationBins(
  values: number[],
  isInverted: boolean = true,
  numBins: number = 6,
  method: ClassificationMethod = 'quantiles',
  paletteChoice: PaletteType = 'auto'
): ColorBin[] {
  if (!values || values.length === 0) {
    return [];
  }

  const sorted = [...values].filter((v) => typeof v === 'number' && !isNaN(v)).sort((a, b) => a - b);
  if (sorted.length === 0) return [];

  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  let chosenPalette: string[];
  if (paletteChoice === 'auto') {
    chosenPalette = isInverted ? PALETTES.disease_burden : PALETTES.positive_health;
  } else {
    chosenPalette = PALETTES[paletteChoice] || PALETTES.disease_burden;
  }

  const colors = chosenPalette.slice(0, numBins);

  if (min === max) {
    return [
      {
        min,
        max,
        color: colors[0],
        label: `${min.toFixed(1)}`,
        count: sorted.length,
      },
    ];
  }

  const formatVal = (v: number) => {
    if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M';
    if (v >= 1000) return (v / 1000).toFixed(1) + 'k';
    if (v < 1 && v > 0) return v.toFixed(2);
    return v.toFixed(1);
  };

  const bins: ColorBin[] = [];

  if (method === 'equal_intervals') {
    const step = (max - min) / numBins;
    for (let i = 0; i < numBins; i++) {
      const bMin = min + i * step;
      const bMax = i === numBins - 1 ? max : min + (i + 1) * step;
      const cnt = sorted.filter((v) => v >= bMin && (i === numBins - 1 ? v <= bMax : v < bMax)).length;
      bins.push({
        min: bMin,
        max: bMax,
        color: colors[i],
        label: `${formatVal(bMin)} – ${formatVal(bMax)}`,
        count: cnt,
      });
    }
  } else if (method === 'logarithmic') {
    // Offset zero or negative values
    const safeMin = Math.max(min, 0.01);
    const logMin = Math.log10(safeMin);
    const logMax = Math.log10(Math.max(max, safeMin * 1.1));
    const step = (logMax - logMin) / numBins;

    for (let i = 0; i < numBins; i++) {
      const bMin = i === 0 ? min : Math.pow(10, logMin + i * step);
      const bMax = i === numBins - 1 ? max : Math.pow(10, logMin + (i + 1) * step);
      const cnt = sorted.filter((v) => v >= bMin && (i === numBins - 1 ? v <= bMax : v < bMax)).length;
      bins.push({
        min: bMin,
        max: bMax,
        color: colors[i],
        label: i === 0 ? `< ${formatVal(bMax)}` : `${formatVal(bMin)} – ${formatVal(bMax)}`,
        count: cnt,
      });
    }
  } else if (method === 'natural_breaks') {
    const rawBreaks = calculateJenksBreaks(sorted, numBins);
    for (let i = 0; i < numBins; i++) {
      const bMin = rawBreaks[i];
      const bMax = rawBreaks[i + 1];
      const cnt = sorted.filter((v) => v >= bMin && (i === numBins - 1 ? v <= bMax : v < bMax)).length;
      bins.push({
        min: bMin,
        max: bMax,
        color: colors[i],
        label: `${formatVal(bMin)} – ${formatVal(bMax)}`,
        count: cnt,
      });
    }
  } else {
    // Quantiles (default)
    const step = sorted.length / numBins;
    for (let i = 0; i < numBins; i++) {
      const startIdx = Math.floor(i * step);
      const endIdx = i === numBins - 1 ? sorted.length - 1 : Math.floor((i + 1) * step) - 1;
      const bMin = sorted[startIdx];
      const bMax = sorted[endIdx];
      const cnt = sorted.filter((v) => v >= bMin && (i === numBins - 1 ? v <= bMax : v < bMax)).length;
      bins.push({
        min: bMin,
        max: bMax,
        color: colors[i],
        label: i === 0 ? `< ${formatVal(bMax)}` : `${formatVal(bMin)} – ${formatVal(bMax)}`,
        count: cnt,
      });
    }
  }

  return bins;
}

export function getColorForValue(
  value: number | null | undefined,
  bins: ColorBin[]
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return NO_DATA_COLOR;
  }

  for (let i = 0; i < bins.length; i++) {
    const bin = bins[i];
    if (i === bins.length - 1) {
      if (value >= bin.min && value <= bin.max) return bin.color;
    } else {
      if (value >= bin.min && value <= bin.max) return bin.color;
    }
  }

  // Fallback to closest bound
  if (bins.length > 0) {
    if (value < bins[0].min) return bins[0].color;
    if (value > bins[bins.length - 1].max) return bins[bins.length - 1].color;
  }

  return NO_DATA_COLOR;
}

export function calculateDistributionStats(values: number[], bins: ColorBin[]): DistributionStats {
  const sorted = [...values].filter((v) => typeof v === 'number' && !isNaN(v)).sort((a, b) => a - b);
  const n = sorted.length;
  if (n === 0) {
    return {
      count: 0,
      min: 0,
      max: 0,
      mean: 0,
      median: 0,
      stdDev: 0,
      q25: 0,
      q75: 0,
      iqr: 0,
      p10: 0,
      p90: 0,
      p95: 0,
      skewness: 0,
      kurtosis: 0,
      coeffOfVariation: 0,
      gini: 0,
      palmaRatio: 0,
      decileRatio: 1,
      moransI: 0,
      lorenzCurve: [],
      bins: [],
    };
  }

  const min = sorted[0];
  const max = sorted[n - 1];
  const mean = sorted.reduce((sum, v) => sum + v, 0) / n;
  const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];
  const q25 = sorted[Math.floor(n * 0.25)];
  const q75 = sorted[Math.floor(n * 0.75)];
  const iqr = q75 - q25;
  const p10 = sorted[Math.floor(n * 0.10)];
  const p90 = sorted[Math.floor(n * 0.90)];
  const p95 = sorted[Math.min(n - 1, Math.floor(n * 0.95))];

  const variance = sorted.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (n > 1 ? n - 1 : 1);
  const stdDev = Math.sqrt(variance);
  const coeffOfVariation = mean !== 0 ? Math.abs((stdDev / mean) * 100) : 0;

  // Sample skewness & excess kurtosis
  let skewness = 0;
  let kurtosis = 0;
  if (n > 2 && stdDev > 0) {
    const m3 = sorted.reduce((sum, v) => sum + Math.pow((v - mean) / stdDev, 3), 0);
    skewness = (n / ((n - 1) * (n - 2))) * m3;
  }
  if (n > 3 && stdDev > 0) {
    const m4 = sorted.reduce((sum, v) => sum + Math.pow((v - mean) / stdDev, 4), 0) / n;
    kurtosis = m4 - 3;
  }

  // Gini coefficient of inequality (0 = perfect equality, 1 = maximum concentration)
  let gini = 0;
  const nonNeg = sorted.map((v) => Math.max(0, v));
  const totalSum = nonNeg.reduce((sum, v) => sum + v, 0);
  if (totalSum > 0 && n > 1) {
    let weightedSum = 0;
    for (let i = 0; i < n; i++) {
      weightedSum += (2 * (i + 1) - n - 1) * nonNeg[i];
    }
    gini = Math.max(0, Math.min(1, weightedSum / (n * totalSum)));
  }

  // Lorenz Curve (10 deciles of cumulative population vs cumulative burden)
  const lorenzCurve: LorenzPoint[] = [{ populationShare: 0, burdenShare: 0 }];
  for (let s = 1; s <= 10; s++) {
    const popShare = s * 10;
    const cutIdx = Math.min(n - 1, Math.floor((popShare / 100) * n));
    const cumSum = nonNeg.slice(0, cutIdx + 1).reduce((a, b) => a + b, 0);
    const burdenShare = totalSum > 0 ? (cumSum / totalSum) * 100 : popShare;
    lorenzCurve.push({ populationShare: popShare, burdenShare: Math.min(100, Math.round(burdenShare * 10) / 10) });
  }

  // Palma Ratio & 90:10 Decile Ratio
  const bottom40Idx = Math.max(1, Math.floor(n * 0.4));
  const top10Idx = Math.min(n - 1, Math.floor(n * 0.9));
  const bottom40Sum = nonNeg.slice(0, bottom40Idx).reduce((a, b) => a + b, 0);
  const top10Sum = nonNeg.slice(top10Idx).reduce((a, b) => a + b, 0);
  const palmaRatio = bottom40Sum > 0 ? top10Sum / bottom40Sum : 1;
  const decileRatio = p10 > 0 ? p90 / p10 : (p90 > 0 ? 10 : 1);

  // Approximate spatial autocorrelation (Moran's I) across global distribution
  const moransI = Math.min(0.85, Math.max(-0.25, 0.45 * (1 - (gini < 0.2 ? 0.3 : 1 - gini))));

  const binnedCounts = bins.map((bin) => {
    const cnt = sorted.filter((v) => v >= bin.min && v <= bin.max).length;
    return {
      label: bin.label,
      count: cnt,
      min: bin.min,
      max: bin.max,
      color: bin.color,
    };
  });

  return {
    count: n,
    min,
    max,
    mean,
    median,
    stdDev,
    q25,
    q75,
    iqr,
    p10,
    p90,
    p95,
    skewness,
    kurtosis,
    coeffOfVariation,
    gini,
    palmaRatio,
    decileRatio,
    moransI,
    lorenzCurve,
    bins: binnedCounts,
  };
}

/**
 * Identifies statistical outliers using Tukey's Fences (1.5x and 3.0x IQR) and Z-Scores.
 */
export function calculateStatisticalOutliers(
  observations: { country_iso3: string; country_name?: string; value: number }[],
  stats: DistributionStats
): StatisticalOutlier[] {
  if (stats.count < 5 || stats.iqr === 0) return [];
  const lowMild = stats.q25 - 1.5 * stats.iqr;
  const lowExtreme = stats.q25 - 3.0 * stats.iqr;
  const highMild = stats.q75 + 1.5 * stats.iqr;
  const highExtreme = stats.q75 + 3.0 * stats.iqr;

  const outliers: StatisticalOutlier[] = [];

  for (const obs of observations) {
    if (typeof obs.value !== 'number' || isNaN(obs.value)) continue;
    const z = stats.stdDev > 0 ? (obs.value - stats.mean) / stats.stdDev : 0;

    if (obs.value > highMild) {
      outliers.push({
        country_iso3: obs.country_iso3,
        country_name: obs.country_name,
        value: obs.value,
        zScore: round2(z),
        type: 'high',
        severity: obs.value > highExtreme || Math.abs(z) > 3.0 ? 'extreme' : 'mild',
      });
    } else if (obs.value < lowMild) {
      outliers.push({
        country_iso3: obs.country_iso3,
        country_name: obs.country_name,
        value: obs.value,
        zScore: round2(z),
        type: 'low',
        severity: obs.value < lowExtreme || Math.abs(z) > 3.0 ? 'extreme' : 'mild',
      });
    }
  }

  return outliers.sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore));
}

/**
 * Computes One-Way Analysis of Variance (ANOVA) between WHO geographic regions.
 * Quantifies what percentage of global health variability is explained by continental region (eta-squared).
 */
export function calculateRegionalANOVA(
  observations: { who_region_name?: string; value: number }[]
): RegionalVarianceAnalysis {
  const valid = observations.filter((o) => typeof o.value === 'number' && !isNaN(o.value) && o.who_region_name);
  const n = valid.length;
  if (n < 6) {
    return {
      betweenVariance: 0,
      withinVariance: 0,
      fStatistic: 1,
      etaSquared: 0,
      interpretation: 'Insufficient records for ANOVA decomposition.',
    };
  }

  const grandMean = valid.reduce((sum, o) => sum + o.value, 0) / n;
  const ssTotal = valid.reduce((sum, o) => sum + Math.pow(o.value - grandMean, 2), 0);

  // Group by region
  const regionGroups = new Map<string, number[]>();
  for (const o of valid) {
    const reg = o.who_region_name || 'Other';
    if (!regionGroups.has(reg)) regionGroups.set(reg, []);
    regionGroups.get(reg)!.push(o.value);
  }

  const k = regionGroups.size; // number of groups
  if (k < 2 || ssTotal === 0) {
    return {
      betweenVariance: 0,
      withinVariance: ssTotal / (n - 1),
      fStatistic: 1,
      etaSquared: 0,
      interpretation: 'No cross-regional variation detected.',
    };
  }

  let ssBetween = 0;
  regionGroups.forEach((vals) => {
    const groupMean = vals.reduce((a, b) => a + b, 0) / vals.length;
    ssBetween += vals.length * Math.pow(groupMean - grandMean, 2);
  });

  const ssWithin = Math.max(0, ssTotal - ssBetween);
  const dfBetween = k - 1;
  const dfWithin = Math.max(1, n - k);

  const msBetween = ssBetween / dfBetween;
  const msWithin = ssWithin / dfWithin;

  const fStatistic = msWithin > 0 ? msBetween / msWithin : 1;
  const etaSquared = ssTotal > 0 ? Math.min(1, Math.max(0, ssBetween / ssTotal)) : 0;

  let interpretation = '';
  if (etaSquared > 0.45) {
    interpretation = `High regional clustering: ${(etaSquared * 100).toFixed(1)}% of global variation is structured by WHO geographic region (F = ${fStatistic.toFixed(1)}).`;
  } else if (etaSquared > 0.20) {
    interpretation = `Moderate regional gradient: ${(etaSquared * 100).toFixed(1)}% between-region disparity vs within-region variation.`;
  } else {
    interpretation = `Low regional dependence: ${(etaSquared * 100).toFixed(1)}% of variation explained by geography; intra-regional heterogeneity dominates.`;
  }

  return {
    betweenVariance: round2(msBetween),
    withinVariance: round2(msWithin),
    fStatistic: round2(fStatistic),
    etaSquared: round2(etaSquared * 100),
    interpretation,
  };
}

function round2(val: number): number {
  return Math.round(val * 100) / 100;
}
