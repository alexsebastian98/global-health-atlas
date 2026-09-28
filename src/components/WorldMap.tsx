/**
 * Global Health Atlas - Primary Geospatial Visual Interface
 * 
 * High-performance D3 geospatial vector engine supporting:
 * - Equal Earth 2D and Orthographic 3D Globe projections
 * - Smooth pan, zoom, and globe drag rotation
 * - Scientific choropleth classification with discrete bins
 * - Transparent 'No data' handling (distinct from zero)
 * - Country hover tooltip with uncertainty intervals and data provenance
 * - Country click selection
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Observation, Indicator, Country } from '../types/atlas';
import { ColorBin, getColorForValue, NO_DATA_COLOR, NO_DATA_HOVER } from '../utils/colorScales';

interface WorldMapProps {
  geoJson: any;
  observations: Record<string, Observation>;
  selectedIndicator: Indicator | null;
  selectedYear: number;
  bins: ColorBin[];
  projectionMode: 'equal-earth' | 'globe';
  onSelectCountry: (country: Country) => void;
  selectedCountryIso3: string | null;
}

interface HoverState {
  x: number;
  y: number;
  countryName: string;
  iso3: string;
  observation?: Observation;
}

export const WorldMap: React.FC<WorldMapProps> = ({
  geoJson,
  observations,
  selectedIndicator,
  selectedYear,
  bins,
  projectionMode,
  onSelectCountry,
  selectedCountryIso3,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 700 });
  const [hoverState, setHoverState] = useState<HoverState | null>(null);
  const [globeRotation, setGlobeRotation] = useState<[number, number]>([0, -15]);

  // Track zoom transform in state/ref
  const zoomBehaviorRef = useRef<any>(null);

  // Measure container dimensions with ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Compute projection based on mode and container dimensions
  const projection = useMemo(() => {
    const { width, height } = dimensions;
    if (projectionMode === 'globe') {
      const radius = Math.min(width, height) / 2.2;
      return d3
        .geoOrthographic()
        .scale(radius)
        .translate([width / 2, height / 2])
        .rotate(globeRotation)
        .clipAngle(90);
    } else {
      // Equal Earth projection
      const scale = Math.min(width / 5.8, height / 3.0);
      return d3
        .geoEqualEarth()
        .scale(scale)
        .translate([width / 2, height / 1.95]);
    }
  }, [dimensions, projectionMode, globeRotation]);

  const pathGenerator = useMemo(() => {
    return d3.geoPath().projection(projection);
  }, [projection]);

  // Set up D3 Zoom & Pan
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const g = svg.select<SVGGElement>('g.map-viewport');

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.8, 8])
      .on('zoom', (event) => {
        g.attr('transform', event.transform.toString());
      });

    zoomBehaviorRef.current = zoom;
    svg.call(zoom);

    // Initial reset
    svg.call(zoom.transform, d3.zoomIdentity);
  }, [projectionMode]);

  // Drag handler for 3D Globe rotation
  useEffect(() => {
    if (projectionMode !== 'globe' || !svgRef.current) return;
    const svg = d3.select(svgRef.current);

    let startX = 0;
    let startY = 0;
    let startRotation = globeRotation;

    const drag = d3
      .drag<SVGSVGElement, unknown>()
      .on('start', (event) => {
        startX = event.x;
        startY = event.y;
        startRotation = globeRotation;
      })
      .on('drag', (event) => {
        const dx = event.x - startX;
        const dy = event.y - startY;
        const sensitivity = 0.35;
        const newLambda = startRotation[0] + dx * sensitivity;
        const newPhi = Math.max(-80, Math.min(80, startRotation[1] - dy * sensitivity));
        setGlobeRotation([newLambda, newPhi]);
      });

    svg.call(drag);
  }, [projectionMode, globeRotation]);

  const handleZoomIn = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 1.4);
  };

  const handleZoomOut = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 0.7);
  };

  const handleReset = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(400).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
    if (projectionMode === 'globe') {
      setGlobeRotation([0, -15]);
    }
  };

  // Graticule lines for scientific coordinate grid
  const graticule = useMemo(() => d3.geoGraticule10(), []);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-slate-950 overflow-hidden select-none">
      {/* Zoom and Navigation HUD */}
      <div className="absolute top-6 right-6 z-20 flex flex-col gap-1.5 bg-slate-900/90 border border-slate-800 rounded-lg p-1.5 shadow-xl backdrop-blur-md">
        <button
          onClick={handleZoomIn}
          title="Zoom in"
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom out"
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleReset}
          title="Reset map view"
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* SVG Canvas Map */}
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        <defs>
          {/* Subtle ocean pattern or glow for globe */}
          <radialGradient id="globe-shading" cx="50%" cy="50%" r="50%">
            <stop offset="70%" stopColor="#0f172a" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0.9" />
          </radialGradient>
        </defs>

        <g className="map-viewport">
          {/* Globe Ocean Background */}
          {projectionMode === 'globe' && (
            <circle
              cx={dimensions.width / 2}
              cy={dimensions.height / 2}
              r={Math.min(dimensions.width, dimensions.height) / 2.2}
              fill="#0b0f19"
              stroke="#1e293b"
              strokeWidth={1.5}
            />
          )}

          {/* Graticule / Coordinate Grid Lines */}
          <path
            d={pathGenerator(graticule) || ''}
            fill="none"
            stroke="#1e293b"
            strokeWidth={0.5}
            strokeDasharray="2,3"
            opacity={0.6}
          />

          {/* Country Polygons */}
          {geoJson &&
            geoJson.features &&
            geoJson.features.map((feature: any, idx: number) => {
              const iso3 = feature.properties?.iso3;
              const countryName = feature.properties?.name || 'Unknown';
              const obs = iso3 ? observations[iso3] : undefined;
              const hasData = obs !== undefined && obs.value !== null;
              const fillColor = hasData ? getColorForValue(obs.value, bins) : NO_DATA_COLOR;
              const isSelected = selectedCountryIso3 === iso3;

              const pathD = pathGenerator(feature);
              if (!pathD) return null;

              return (
                <path
                  key={`${iso3 || idx}`}
                  d={pathD}
                  fill={fillColor}
                  stroke={isSelected ? '#38bdf8' : '#0f172a'}
                  strokeWidth={isSelected ? 2 : 0.6}
                  className="transition-colors duration-150 cursor-pointer hover:stroke-cyan-300 hover:stroke-[1.5]"
                  onMouseEnter={(e) => {
                    const rect = containerRef.current?.getBoundingClientRect();
                    if (rect) {
                      setHoverState({
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top,
                        countryName,
                        iso3,
                        observation: obs,
                      });
                    }
                  }}
                  onMouseMove={(e) => {
                    const rect = containerRef.current?.getBoundingClientRect();
                    if (rect) {
                      setHoverState((prev) =>
                        prev
                          ? {
                              ...prev,
                              x: e.clientX - rect.left,
                              y: e.clientY - rect.top,
                            }
                          : null
                      );
                    }
                  }}
                  onMouseLeave={() => setHoverState(null)}
                  onClick={() => {
                    onSelectCountry({
                      iso3,
                      name: countryName,
                      canonical_name: countryName,
                    });
                  }}
                />
              );
            })}
        </g>
      </svg>

      {/* Country Hover Tooltip (Section 9 Specification) */}
      {hoverState && (
        <div
          className="pointer-events-none absolute z-40 bg-slate-950/95 border border-slate-700/80 rounded-lg p-3 shadow-2xl backdrop-blur-md max-w-xs text-xs -translate-x-1/2 -translate-y-full mb-3"
          style={{
            left: `${Math.max(120, Math.min(dimensions.width - 120, hoverState.x))}px`,
            top: `${Math.max(80, hoverState.y - 12)}px`,
          }}
        >
          {/* Country Header */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5 mb-2">
            <span className="font-bold text-slate-100 text-sm leading-tight">
              {hoverState.countryName}
            </span>
            <span className="font-mono text-cyan-400 text-[10px] uppercase font-semibold">
              {hoverState.iso3}
            </span>
          </div>

          {/* Indicator Value & Confidence Bounds */}
          {hoverState.observation ? (
            <div className="space-y-1.5">
              <div className="text-[11px] text-slate-400 font-medium">
                {selectedIndicator?.short_name || selectedIndicator?.name}
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold font-mono tabular-nums text-white">
                  {hoverState.observation.value >= 1000
                    ? hoverState.observation.value.toLocaleString()
                    : hoverState.observation.value.toFixed(1)}
                </span>
                <span className="text-[11px] text-cyan-400 font-mono">
                  {selectedIndicator?.unit}
                </span>
              </div>

              {/* Uncertainty Interval if available */}
              {hoverState.observation.lower_bound !== null &&
                hoverState.observation.lower_bound !== undefined &&
                hoverState.observation.upper_bound !== null &&
                hoverState.observation.upper_bound !== undefined && (
                  <div className="text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800/80">
                    95% UI: [{hoverState.observation.lower_bound.toFixed(1)} – {hoverState.observation.upper_bound.toFixed(1)}]
                  </div>
                )}

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                <span>Status: <span className="capitalize text-slate-300">{hoverState.observation.data_status}</span></span>
                <span>Source: <span className="text-slate-300">{hoverState.observation.source_name || 'WHO GHO'}</span></span>
              </div>
            </div>
          ) : (
            <div className="py-1 text-slate-400 text-[11px]">
              <div className="text-amber-400/90 font-medium mb-0.5">No reported data</div>
              <p className="text-[10px] text-slate-400 leading-snug">
                Not endemic, not surveyed, or missing from {selectedIndicator?.source_name || 'source'} records for {selectedYear}.
              </p>
            </div>
          )}

          <div className="mt-2 text-[10px] text-cyan-400/80 italic text-center border-t border-slate-800/60 pt-1">
            Click to open country epidemiological dossier
          </div>
        </div>
      )}
    </div>
  );
};
