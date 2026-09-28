/**
 * Scientific Map Legend & Classification Inspector
 */

import React from 'react';
import { ColorBin, NO_DATA_COLOR } from '../utils/colorScales';
import { Indicator } from '../types/atlas';
import { BarChart2 } from 'lucide-react';

interface MapLegendProps {
  indicator: Indicator | null;
  bins: ColorBin[];
  year: number;
  totalReporting: number;
  classificationMethod?: string;
  onOpenStats?: () => void;
  stats?: {
    min: number;
    max: number;
    mean: number;
    median: number;
    gini?: number;
  };
}

export const MapLegend: React.FC<MapLegendProps> = ({
  indicator,
  bins,
  year,
  totalReporting,
  classificationMethod = 'quantiles',
  onOpenStats,
  stats,
}) => {
  if (!indicator || bins.length === 0) return null;

  return (
    <div className="absolute bottom-6 left-6 z-20 bg-slate-950/90 border border-slate-800 rounded-lg p-3.5 shadow-2xl backdrop-blur-md max-w-sm text-xs select-none">
      {/* Indicator Title & Unit */}
      <div className="mb-2">
        <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
          {indicator.category_name} · {year}
        </div>
        <div className="font-semibold text-slate-100 text-sm leading-tight">
          {indicator.short_name || indicator.name}
        </div>
        <div className="text-[11px] font-mono text-cyan-400 mt-0.5">
          Unit: {indicator.unit}
        </div>
      </div>

      {/* Color Bins Swatches */}
      <div className="space-y-1 my-2">
        <div className="flex h-3 rounded overflow-hidden border border-slate-700">
          {bins.map((bin, idx) => (
            <div
              key={idx}
              className="flex-1 transition-opacity"
              style={{ backgroundColor: bin.color }}
              title={`${bin.label} (${bin.count ?? 0} countries)`}
            />
          ))}
        </div>

        {/* Labels below swatches */}
        <div className="flex justify-between text-[10px] font-mono text-slate-400 tabular-nums pt-0.5">
          <span>{bins[0]?.label.split('–')[0].trim()}</span>
          <span>
            Median: {stats ? (stats.median >= 1000 ? stats.median.toLocaleString(undefined, { maximumFractionDigits: 1 }) : stats.median.toFixed(1)) : ''}
            {stats?.gini !== undefined && (
              <span className="text-slate-400 ml-1.5 font-normal">
                · Gini: <strong className="text-cyan-400">{stats.gini.toFixed(2)}</strong>
              </span>
            )}
          </span>
          <span>{bins[bins.length - 1]?.label.split('–')[1]?.trim() || bins[bins.length - 1]?.label}</span>
        </div>
      </div>

      {/* Legend Metadata & No Data Swatch */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-sm border border-slate-600"
            style={{ backgroundColor: NO_DATA_COLOR }}
          />
          <span>No reported data</span>
        </div>

        <div className="font-mono text-[10px] text-slate-400">
          {totalReporting} reporting countries
        </div>
      </div>

      {/* Classification method & interactive stats opener */}
      <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
        <span className="text-slate-400 font-mono">
          Method: <strong className="text-slate-300 uppercase">{classificationMethod.replace('_', ' ')}</strong>
        </span>
        {onOpenStats && (
          <button
            onClick={onOpenStats}
            className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
          >
            <BarChart2 className="w-3 h-3" />
            <span>Distribution Analysis</span>
          </button>
        )}
      </div>

      {/* Polarity notice */}
      <div className="mt-1 text-[10px] text-slate-400 italic">
        {indicator.is_inverted
          ? '● Red indicates higher disease incidence / mortality burden'
          : '● Cyan/Blue indicates higher population health outcome'}
      </div>
    </div>
  );
};
