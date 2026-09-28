/**
 * Data Provenance & Indicator Methodology Modal
 * 
 * Exposes verifiable provenance, definitions, methodology notes,
 * and citation guidelines for the active indicator.
 */

import React from 'react';
import { X, ExternalLink, ShieldCheck, BookOpen, Copy, Check } from 'lucide-react';
import { Indicator } from '../types/atlas';

interface DataProvenanceModalProps {
  indicator: Indicator | null;
  onClose: () => void;
}

export const DataProvenanceModal: React.FC<DataProvenanceModalProps> = ({
  indicator,
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!indicator) return null;

  const citationText = `${indicator.source_name}. "${indicator.name} (${indicator.code})". Global Health Atlas / Global Health Observatory. Retrieved September 2026 from ${indicator.source_url}`;

  const handleCopyCitation = () => {
    navigator.clipboard.writeText(citationText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between bg-slate-900/60">
          <div>
            <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider mb-1">
              Data Provenance & Scientific Methodology
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {indicator.name}
            </h2>
            <div className="text-xs text-slate-400 mt-0.5">
              Domain: <span className="text-slate-200">{indicator.category_name}</span> · Code: <span className="font-mono text-cyan-400">{indicator.code}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300">
          {/* Official Indicator Definition */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold text-slate-200 uppercase font-mono tracking-wider">
              Official Definition
            </h3>
            <p className="bg-slate-900/80 border border-slate-800 rounded-lg p-3.5 leading-relaxed text-slate-200">
              {indicator.definition}
            </p>
          </div>

          {/* Unit & Metric Specification */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3.5">
              <div className="text-[10px] uppercase font-mono text-slate-400 mb-1">Standardized Unit</div>
              <div className="text-base font-bold text-white font-mono">{indicator.unit}</div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3.5">
              <div className="text-[10px] uppercase font-mono text-slate-400 mb-1">Metric Classification</div>
              <div className="text-base font-bold text-cyan-400 capitalize font-mono">
                {indicator.metric_type.replace(/_/g, ' ')}
              </div>
            </div>
          </div>

          {/* Estimation Methodology */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold text-slate-200 uppercase font-mono tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              Scientific Methodology & Modeling
            </h3>
            <p className="bg-slate-900/80 border border-slate-800 rounded-lg p-3.5 leading-relaxed text-slate-300">
              {indicator.methodology || 'Official statistical estimates calculated using epidemiological and mathematical modeling.'}
            </p>
          </div>

          {/* Source Provenance & Portal */}
          <div className="space-y-2 bg-slate-900/40 border border-slate-800 rounded-lg p-4">
            <div className="text-[10px] uppercase font-mono text-slate-400">Institutional Authority</div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-white text-sm">{indicator.source_name}</div>
                <div className="text-[11px] text-slate-400">Directly synchronized via official machine-readable API</div>
              </div>
              <a
                href={indicator.source_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950 border border-cyan-700/60 hover:border-cyan-500 rounded text-cyan-400 text-xs font-medium transition-colors"
              >
                <span>View WHO Registry</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Academic Citation Block */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono text-slate-400">
                Scientific Citation
              </span>
              <button
                onClick={handleCopyCitation}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to clipboard' : 'Copy citation'}</span>
              </button>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-[11px] text-slate-400 select-all leading-relaxed">
              {citationText}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
