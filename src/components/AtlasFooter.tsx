/**
 * Global Health Atlas - Persistent Bottom Footer
 * 
 * Prominently presents creator attribution (ALEX BRIJO SEBASTIAN),
 * institutional source credentials, verified data integrity status,
 * and quick access to the Credibility & Sources console.
 */

import React from 'react';
import { Database, ShieldCheck, User, ExternalLink, ArrowRight } from 'lucide-react';
import { ActiveTab } from './AtlasHeader';

interface AtlasFooterProps {
  activeTab: ActiveTab;
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenProvenance?: () => void;
}

export const AtlasFooter: React.FC<AtlasFooterProps> = ({
  activeTab,
  onNavigateTab,
  onOpenProvenance,
}) => {
  return (
    <footer className="h-10 px-5 border-t border-slate-800/90 bg-slate-950/95 backdrop-blur-md flex items-center justify-between text-xs text-slate-400 select-none shrink-0 z-30">
      {/* Zone 1: Creator Attribution (ALEX BRIJO SEBASTIAN) */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
          <User className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px] font-medium text-slate-400">Created by</span>
          <span className="text-[11px] font-bold text-white tracking-wide">
            ALEX BRIJO SEBASTIAN
          </span>
        </div>
        <span className="hidden lg:inline text-[11px] text-slate-400 font-mono">
          Public Health Informatics & Geospatial Analytics
        </span>
      </div>

      {/* Zone 2: Authoritative Data Source & Credibility Badge */}
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-400">
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span>Data Sources:</span>
          <span className="text-slate-300 font-medium">WHO Global Health Observatory (GHO) & UN Agencies</span>
        </div>

        <button
          onClick={() => onNavigateTab('sources')}
          className={`flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors border ${
            activeTab === 'sources'
              ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
              : 'bg-slate-900 hover:bg-slate-800 text-cyan-400 border-slate-700/80'
          }`}
          title="Inspect institutional credibility, data provenance, and citation guidelines"
        >
          <span>Credibility & Sources</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Zone 3: Verification & Ethics Status */}
      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
        <div className="hidden sm:flex items-center gap-1 text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>140k+ Verified Records · 0% Synthetic</span>
        </div>
        <span className="hidden xl:inline text-slate-400">|</span>
        <span className="hidden xl:inline text-slate-400">Non-Clinical Research Atlas</span>
      </div>
    </footer>
  );
};
