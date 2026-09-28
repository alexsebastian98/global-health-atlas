/**
 * Authoritative Sources, Data Credibility & Governance Console
 * 
 * Provides comprehensive documentation on:
 * 1. Exactly where the public health data originates (WHO GHO, UN IGME, UNICEF, World Bank).
 * 2. Strict credibility standards & Zero-Fabrication integrity policy.
 * 3. Ingested indicator registry & authoritative source mappings.
 * 4. Institutional licensing, attribution strings, and terms of redistribution.
 * 5. Creator attribution: ALEX BRIJO SEBASTIAN.
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  ExternalLink,
  ShieldCheck,
  Database,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Layers,
  Award,
  BookOpen,
  Copy,
  Check
} from 'lucide-react';
import { Source, Indicator } from '../types/atlas';
import { api } from '../services/api';

export const SourcesView: React.FC = () => {
  const [sources, setSources] = useState<Source[]>([]);
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [indicatorSearch, setIndicatorSearch] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');
  const [copiedCitation, setCopiedCitation] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.getSources(), api.getIndicators()])
      .then(([srcs, inds]) => {
        setSources(srcs);
        setIndicators(inds);
      })
      .catch((err) => console.error('Failed to load sources or indicators:', err))
      .finally(() => setLoading(false));
  }, []);

  const domains = useMemo(() => {
    const set = new Set<string>();
    indicators.forEach((i) => {
      if (i.category_name) set.add(i.category_name);
    });
    return Array.from(set).sort();
  }, [indicators]);

  const filteredIndicators = useMemo(() => {
    return indicators.filter((ind) => {
      const matchesDomain = selectedDomain === 'ALL' || ind.category_name === selectedDomain;
      const matchesSearch =
        !indicatorSearch ||
        ind.name.toLowerCase().includes(indicatorSearch.toLowerCase()) ||
        ind.code.toLowerCase().includes(indicatorSearch.toLowerCase()) ||
        ind.category_name.toLowerCase().includes(indicatorSearch.toLowerCase());
      return matchesDomain && matchesSearch;
    });
  }, [indicators, selectedDomain, indicatorSearch]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCitation(id);
    setTimeout(() => setCopiedCitation(null), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 md:p-10 text-slate-100">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* 1. Header Section */}
        <div className="border-b border-slate-800 pb-6">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-widest mb-1.5">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Institutional Provenance & Scientific Credibility</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Database className="w-8 h-8 text-cyan-400" />
            Authoritative Data Sources & Credibility
          </h1>
          <p className="text-sm text-slate-400 mt-2 max-w-3xl leading-relaxed">
            The Global Health Atlas provides high-precision geospatial visualization of global public-health data.
            Every metric presented is strictly ingested from official international health bodies and multilateral organizations.
            We maintain an uncompromising <strong className="text-slate-200">Zero Synthetic / Zero Fabrication Policy</strong>.
          </p>
        </div>

        {/* 2. Creator Attribution Card */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-medium">
                <Award className="w-3.5 h-3.5" />
                <span>Project Creator & Lead Architect</span>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white">
                ALEX BRIJO SEBASTIAN
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Conceived, designed, and engineered by <strong>Alex Brijo Sebastian</strong> as a planetary-scale health informatics platform.
                Built to bridge the gap between complex epidemiological statistical registries and intuitive geospatial analysis, enabling researchers,
                policymakers, and students to examine health disparities and disease burden across 200+ nations.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-center">
                <span className="text-[10px] uppercase font-mono text-slate-400 block">Verified Data Policy</span>
                <span className="text-xs font-semibold text-emerald-400">100% Official Sources</span>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-center">
                <span className="text-[10px] uppercase font-mono text-slate-400 block">Active Health Domains</span>
                <span className="text-xs font-semibold text-cyan-400">14 Ingested Domains</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Where Does The Data Come From? (Detailed Explainer) */}
        <div className="space-y-4">
          <div className="text-xs font-mono uppercase tracking-wider text-cyan-400">
            Data Provenance Framework
          </div>
          <h2 className="text-xl font-bold text-white">
            Where Does the Data Come From?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Database className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-slate-200 text-sm">WHO Global Health Observatory</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ingested directly via the official WHO GHO OData API endpoints (<code className="text-cyan-400 font-mono text-[11px]">ghoapi.azureedge.net</code>).
                Includes verified time-series indicators for malaria, tuberculosis, child stunting, maternal mortality, and universal health coverage.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-slate-200 text-sm">UN Inter-agency Working Groups</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Incorporates gold-standard estimates from UN IGME (Child Mortality Estimation), UNICEF/WHO/World Bank Joint Malnutrition Estimates,
                and the WHO/UNICEF Joint Monitoring Programme (JMP) for Water Supply & Sanitation.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-slate-200 text-sm">World Bank Open Data</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Harmonized with the World Bank World Development Indicators (WDI) and Health, Nutrition and Population databases for national healthcare
                financing, physician densities, and demographic structures.
              </p>
            </div>
          </div>
        </div>

        {/* 4. The 4 Pillars of Data Credibility */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">Scientific Rigor</span>
            <h2 className="text-xl font-bold text-white mt-1">
              The 4 Pillars of Atlas Data Credibility
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-xs">
            <div className="space-y-2 p-4 bg-slate-950 border border-slate-800 rounded-xl">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>1. Zero Fabrication</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Zero AI hallucinations or synthetic estimates. If an official value does not exist for a given country-year,
                it is clearly flagged as unrecorded rather than fabricated.
              </p>
            </div>

            <div className="space-y-2 p-4 bg-slate-950 border border-slate-800 rounded-xl">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>2. Uncertainty Bounds</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Epidemiological 95% Uncertainty Intervals ($[Low, High]$) are stored and visualized on country profiles to represent
                measurement uncertainty transparently.
              </p>
            </div>

            <div className="space-y-2 p-4 bg-slate-950 border border-slate-800 rounded-xl">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>3. Status Auditing</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Every observation is cataloged with its empirical status: <span className="text-slate-200">Reported</span> (vital statistics),
                <span className="text-slate-200"> Estimated</span> (survey-adjusted), or <span className="text-slate-200">Modeled</span>.
              </p>
            </div>

            <div className="space-y-2 p-4 bg-slate-950 border border-slate-800 rounded-xl">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                <span>4. Spatial Standards</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Harmonized against UN M49 / ISO 3166-1 alpha-3 boundaries and WHO continental groupings (AFRO, AMRO, EMRO, EURO, SEARO, WPRO).
              </p>
            </div>
          </div>
        </div>

        {/* 5. Authoritative Institutional Source Credentials */}
        <div className="space-y-4">
          <div className="text-xs font-mono uppercase tracking-wider text-cyan-400">
            Institutional Open Data Licensure
          </div>
          <h2 className="text-xl font-bold text-white">
            Primary Institutional Providers & Terms of Use
          </h2>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">Loading source credentials...</div>
          ) : (
            <div className="grid gap-6">
              {sources.map((src) => (
                <div
                  key={src.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
                    <div>
                      <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
                        Primary Multilateral Provider
                      </span>
                      <h3 className="text-lg font-bold text-white mt-0.5">{src.name}</h3>
                      <div className="text-xs text-slate-400">{src.organization}</div>
                    </div>

                    <a
                      href={src.website_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-cyan-400 transition-colors"
                    >
                      <span>Official Data Portal</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-mono text-slate-400">
                        License & Open Access Terms
                      </span>
                      <div className="font-semibold text-slate-200">{src.license_name}</div>
                      <p className="text-slate-400 leading-relaxed text-[11px]">{src.terms_summary}</p>
                      {src.license_url && (
                        <a
                          href={src.license_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-cyan-400 hover:underline inline-flex items-center gap-1 mt-1"
                        >
                          Read official license terms <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    <div className="space-y-1.5 bg-slate-950 border border-slate-800/80 rounded-lg p-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-mono text-slate-400">
                          Standard Academic Citation
                        </span>
                        <button
                          onClick={() => handleCopy(src.attribution_requirement, src.id)}
                          className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                        >
                          {copiedCitation === src.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Citation</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="font-mono text-slate-300 text-[11px] bg-slate-900 p-2.5 rounded border border-slate-800 select-all">
                        {src.attribution_requirement}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 6. Directory of Ingested Indicators & Source Endpoints */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                Indicator Transparency Registry
              </span>
              <h2 className="text-xl font-bold text-white mt-1">
                Ingested Indicators & Authoritative Endpoints ({filteredIndicators.length} Active)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Explore every indicator currently loaded into the Global Health Atlas along with its official WHO code and source agency.
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search indicator or code..."
                  value={indicatorSearch}
                  onChange={(e) => setIndicatorSearch(e.target.value)}
                  className="pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-56"
                />
              </div>

              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">All Health Domains ({indicators.length})</option>
                {domains.map((dom) => (
                  <option key={dom} value={dom}>
                    {dom}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                <tr>
                  <th className="py-3 px-4">Indicator Name</th>
                  <th className="py-3 px-3">Domain</th>
                  <th className="py-3 px-3">GHO Code</th>
                  <th className="py-3 px-3">Unit</th>
                  <th className="py-3 px-3">Provider</th>
                  <th className="py-3 px-3 text-right">Official Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
                {filteredIndicators.map((ind) => (
                  <tr key={ind.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{ind.name}</div>
                      {ind.short_name && ind.short_name !== ind.name && (
                        <div className="text-[11px] text-slate-400">{ind.short_name}</div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                        {ind.category_name}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-cyan-400 text-[11px]">
                      {ind.code}
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                      {ind.unit}
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {ind.source_name || 'WHO GHO'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <a
                        href={ind.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline"
                      >
                        <span>GHO Portal</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
                {filteredIndicators.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No indicators found matching the criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 7. Non-Clinical Public Health Research Disclaimer */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-3 text-xs text-slate-400">
          <h3 className="font-bold text-slate-200 flex items-center gap-2 text-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Medical Informatics Ethics & Non-Clinical Disclaimer
          </h3>
          <p className="leading-relaxed">
            The Global Health Atlas is designed exclusively for public health research, epidemiological visualization,
            and health policy education. It does NOT provide individual clinical medical advice, diagnostic recommendations,
            or personal patient risk assessment.
          </p>
          <p className="leading-relaxed">
            All geographic correlations represent macro-level population associations and must not be interpreted as direct
            individual causation. For personal medical inquiries, always consult qualified healthcare professionals.
          </p>
        </div>

        {/* Bottom Attribution Footer inside page */}
        <div className="border-t border-slate-800/80 pt-6 pb-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <div>
            Global Health Atlas · Created by <strong className="text-slate-300">ALEX BRIJO SEBASTIAN</strong>
          </div>
          <div className="text-[11px] font-mono">
            Data Licensed under WHO Open Access & Creative Commons Standards
          </div>
        </div>

      </div>
    </div>
  );
};
