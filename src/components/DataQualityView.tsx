/**
 * Global Health Atlas - Data Quality & Audit Console
 * 
 * Exposes full transparency into:
 * - Total observation volume and country coverage
 * - Data status breakdown (Estimated vs Reported vs Modeled)
 * - 95% Uncertainty interval completeness
 * - Pipeline ingestion history with timestamps and record counts
 */

import React, { useEffect, useState } from 'react';
import { ShieldCheck, CheckCircle2, AlertCircle, Database, RefreshCw, BarChart2 } from 'lucide-react';
import { DataQualitySummary, DataUpdateRecord } from '../types/atlas';
import { api } from '../services/api';

export const DataQualityView: React.FC = () => {
  const [data, setData] = useState<{ summary: DataQualitySummary; recent_updates: DataUpdateRecord[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getDataQuality()
      .then((res) => setData(res))
      .catch((err) => console.error('Failed to fetch data quality metrics:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950 text-slate-400 text-xs">
        <RefreshCw className="w-5 h-5 animate-spin mr-2 text-cyan-400" />
        Auditing database observations...
      </div>
    );
  }

  const summary = data?.summary;
  const updates = data?.recent_updates || [];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-8 text-slate-100">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-slate-800 pb-5">
          <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider mb-1">
            Epidemiological Audit & Quality Assurance
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            Data Quality & System Integrity
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            In medical informatics and public health intelligence, data provenance and statistical certainty
            are paramount. Here is the exact provenance and verification status of every observation in the Global Health Atlas.
          </p>
        </div>

        {/* High-Level Metric Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="text-slate-400 text-xs font-medium mb-1">Verified Observations</div>
            <div className="text-2xl font-bold font-mono text-white tabular-nums">
              {summary ? summary.total_observations.toLocaleString() : '—'}
            </div>
            <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> 100% Authoritative Ingestion
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="text-slate-400 text-xs font-medium mb-1">Canonical Territories</div>
            <div className="text-2xl font-bold font-mono text-cyan-400 tabular-nums">
              {summary ? summary.total_countries_covered : '—'}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">ISO 3166-1 Standardized</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="text-slate-400 text-xs font-medium mb-1">With 95% Uncertainty Bands</div>
            <div className="text-2xl font-bold font-mono text-amber-400 tabular-nums">
              {summary ? summary.with_uncertainty_interval.toLocaleString() : '—'}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Rigorous Statistical Modeling</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="text-slate-400 text-xs font-medium mb-1">Active Indicators</div>
            <div className="text-2xl font-bold font-mono text-white tabular-nums">
              {summary ? summary.total_indicators_active : '—'}
            </div>
            <div className="text-[10px] text-cyan-400 mt-1">WHO & World Bank Repositories</div>
          </div>
        </div>

        {/* Data Status Taxonomy Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-cyan-400" />
                Data Status Taxonomy Breakdown
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Every statistic is classified according to official epidemiological standard definitions.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200 uppercase tracking-wide text-[10px] font-mono">
                  Model-Based Estimates
                </span>
                <span className="font-mono text-cyan-400 font-bold tabular-nums">
                  {summary ? summary.status_estimated.toLocaleString() : '0'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Calculated by the World Health Organization and inter-agency working groups using validated mathematical models to adjust for incomplete routine reporting.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200 uppercase tracking-wide text-[10px] font-mono">
                  Directly Reported
                </span>
                <span className="font-mono text-emerald-400 font-bold tabular-nums">
                  {summary ? summary.status_reported.toLocaleString() : '0'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Direct administrative registry submissions, national census reports, and verified household surveys without intermediate spline adjustments.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200 uppercase tracking-wide text-[10px] font-mono">
                  Uncertainty Reporting
                </span>
                <span className="font-mono text-amber-400 font-bold tabular-nums">
                  {summary ? `${((summary.with_uncertainty_interval / (summary.total_observations || 1)) * 100).toFixed(1)}%` : '0%'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Percentage of epidemiological estimates accompanied by published lower and upper bounds (representing 95% Bayesian credible or confidence intervals).
              </p>
            </div>
          </div>
        </div>

        {/* Data Update Pipeline Logs */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              Automated Ingestion Pipeline Logs
            </h3>
            <span className="text-xs text-slate-400 font-mono">Latest Ingestion Runs</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-6 font-semibold">Source</th>
                  <th className="py-3 px-6 font-semibold">Indicator Code</th>
                  <th className="py-3 px-6 font-semibold">Status</th>
                  <th className="py-3 px-6 font-semibold text-right">Records Ingested</th>
                  <th className="py-3 px-6 font-semibold text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {updates.map((up, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-6 font-sans uppercase font-bold text-slate-300">
                      {up.source_id}
                    </td>
                    <td className="py-3 px-6 text-cyan-400">{up.indicator_code}</td>
                    <td className="py-3 px-6 font-sans">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded ${
                          up.status === 'SUCCESS'
                            ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/60'
                            : 'text-rose-400 bg-rose-950/60 border border-rose-800/60'
                        }`}
                      >
                        {up.status === 'SUCCESS' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        {up.status}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-right tabular-nums text-slate-200">
                      {up.records_ingested.toLocaleString()}
                    </td>
                    <td className="py-3 px-6 text-right text-slate-400 text-[11px]">
                      {new Date(up.completed_at || up.started_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
