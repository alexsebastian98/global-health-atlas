/**
 * Atlas Top Navigation Bar
 * 
 * Implements strict 3-zone header contract:
 * Zone 1: Single text element wordmark "Global Health Atlas"
 * Zone 2: Navigation views ("Atlas Map", "Compare", "Provenance & Quality", "API Docs")
 * Zone 3: Primary Action ("Explore Sources")
 */

import React from 'react';
import { Globe, GitCompare, ShieldCheck, Database } from 'lucide-react';

export type ActiveTab = 'atlas' | 'compare' | 'data-quality' | 'sources';

interface AtlasHeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenProvenance: () => void;
}

export const AtlasHeader: React.FC<AtlasHeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenProvenance,
}) => {
  return (
    <header className="h-14 px-6 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md flex items-center justify-between z-40 shrink-0">
      {/* Zone 1: Brand Wordmark (Single text element in display face) */}
      <div className="flex items-center gap-2">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onTabChange('atlas');
          }}
          className="text-lg font-bold tracking-tight text-white hover:text-cyan-400 transition-colors whitespace-nowrap"
        >
          Global Health Atlas
        </a>
      </div>

      {/* Zone 2: 4 Clean Text Navigation Links */}
      <nav className="flex items-center gap-6 text-sm font-medium text-slate-300">
        <button
          onClick={() => onTabChange('atlas')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === 'atlas' ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400 pb-0.5' : 'hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Atlas Map</span>
        </button>

        <button
          onClick={() => onTabChange('compare')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === 'compare' ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400 pb-0.5' : 'hover:text-white'
          }`}
        >
          <GitCompare className="w-4 h-4" />
          <span>Country Comparison</span>
        </button>

        <button
          onClick={() => onTabChange('data-quality')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === 'data-quality' ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400 pb-0.5' : 'hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Data Quality & Integrity</span>
        </button>

        <button
          onClick={() => onTabChange('sources')}
          title="Authoritative Data Sources, Scientific Credibility & Institutional Provenance"
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === 'sources' ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400 pb-0.5' : 'hover:text-white'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Credibility & Sources</span>
        </button>
      </nav>

      {/* Zone 3: Primary Action Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenProvenance}
          className="px-3.5 py-1.5 text-xs font-semibold text-cyan-950 bg-cyan-400 hover:bg-cyan-300 transition-colors rounded-md shadow-sm whitespace-nowrap"
        >
          Data Provenance
        </button>
      </div>
    </header>
  );
};
