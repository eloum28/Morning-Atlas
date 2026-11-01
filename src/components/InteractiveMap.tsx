import React, { useState, useMemo } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Search,
  MapPin,
  List,
  Compass,
  ArrowRight,
  Globe2,
} from 'lucide-react';
import { COUNTRIES, REGIONS_LIST } from '../data/countries';
import { WORLD_COUNTRY_PATHS, projectCoords } from '../data/worldMapSvg';
import { CountryInfo, Region } from '../types';
import { useApp } from '../context/AppContext';

export const InteractiveMap: React.FC = () => {
  const { language, selectCountry, t } = useApp();

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hoveredCountry, setHoveredCountry] = useState<CountryInfo | null>(null);
  const [mapSearch, setMapSearch] = useState('');
  const [selectedContinent, setSelectedContinent] = useState<Region | 'All'>('All');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  // Filtered countries for search and continent
  const displayedCountries = useMemo(() => {
    let list = COUNTRIES;
    if (selectedContinent !== 'All') {
      list = list.filter((c) => c.region === selectedContinent);
    }
    if (mapSearch.trim()) {
      const q = mapSearch.toLowerCase();
      list = list.filter(
        (c) =>
          c.nameEn.toLowerCase().includes(q) ||
          c.nameFr.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.capital.toLowerCase().includes(q)
      );
    }
    return list;
  }, [selectedContinent, mapSearch]);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.35, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.35, 0.8));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header & Controls */}
      <div className="bg-white dark:bg-stone-900/80 rounded-xl border border-stone-200/90 dark:border-stone-800 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
          <div>
            <h1 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-50">
              {language === 'fr' ? 'Atlas Mondial Interactif' : 'Interactive World Atlas'}
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              {language === 'fr'
                ? 'Sélectionnez un pays sur le globe ou dans l’annuaire pour afficher ses actualités nationales.'
                : 'Click any nation on the globe or browse the regional directory to explore dedicated dispatches.'}
            </p>
          </div>

          {/* View Mode Toggle & Search */}
          <div className="flex items-center gap-2">
            <div className="flex items-center p-0.5 bg-stone-100 dark:bg-stone-800 rounded-md border border-stone-200 dark:border-stone-700 text-xs">
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition-colors cursor-pointer ${
                  viewMode === 'map'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                <Globe2 className="w-3.5 h-3.5" />
                <span>{language === 'fr' ? 'Carte' : 'Map View'}</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>{language === 'fr' ? 'Liste des pays' : 'Country List'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search & Continent Tabs */}
        <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedContinent('All')}
              className={`px-3 py-1 rounded font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedContinent === 'All'
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              {t.regions.All}
            </button>
            {REGIONS_LIST.map((reg) => (
              <button
                key={reg}
                onClick={() => setSelectedContinent(reg)}
                className={`px-3 py-1 rounded font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedContinent === reg
                    ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                {t.regions[reg] || reg}
              </button>
            ))}
          </div>

          <div className="relative sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
            <input
              type="text"
              value={mapSearch}
              onChange={(e) => setMapSearch(e.target.value)}
              placeholder={language === 'fr' ? 'Rechercher un pays...' : 'Search country or capital...'}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-md focus:outline-hidden focus:ring-1 focus:ring-stone-500 text-stone-900 dark:text-stone-100"
            />
          </div>
        </div>
      </div>

      {/* 2. Interactive SVG Map View */}
      {viewMode === 'map' ? (
        <div className="relative bg-[#F4F1EA] dark:bg-[#070A0F] rounded-xl border border-stone-300 dark:border-stone-800 overflow-hidden shadow-inner">
          {/* Zoom controls */}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-1 bg-white/90 dark:bg-stone-900/90 backdrop-blur-xs p-1 rounded-lg border border-stone-200 dark:border-stone-800 shadow-md">
            <button
              onClick={handleZoomIn}
              className="p-1.5 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white rounded hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white rounded hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1.5 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white rounded hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              title="Reset View"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Tooltip for Hovered Country */}
          {hoveredCountry && (
            <div className="absolute top-4 left-4 z-10 bg-white dark:bg-stone-900 px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 shadow-lg pointer-events-none animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <span className="text-xl">{hoveredCountry.flag}</span>
                <div>
                  <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-white leading-tight">
                    {language === 'fr' ? hoveredCountry.nameFr : hoveredCountry.nameEn}
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    {hoveredCountry.capital} · {hoveredCountry.region}
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 font-medium">
                {language === 'fr' ? 'Cliquer pour ouvrir les actualités' : 'Click to view country news'}
              </p>
            </div>
          )}

          {/* SVG Map Canvas */}
          <div className="w-full overflow-hidden cursor-crosshair">
            <svg
              viewBox="0 0 1000 500"
              className="w-full h-auto max-h-[640px] select-none transition-transform duration-200"
              style={{
                transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                transformOrigin: '50% 50%',
              }}
            >
              <defs>
                {/* Ocean Grid lines */}
                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="currentColor" className="text-stone-300/40 dark:text-stone-800/40" strokeWidth="0.5" />
                </pattern>
              </defs>

              <rect width="1000" height="500" fill="url(#grid)" />

              {/* Equator & Prime Meridian subtle guide lines */}
              <line x1="0" y1="250" x2="1000" y2="250" stroke="currentColor" className="text-stone-300/60 dark:text-stone-800/60" strokeDasharray="4 4" strokeWidth="0.8" />
              <line x1="500" y1="0" x2="500" y2="500" stroke="currentColor" className="text-stone-300/60 dark:text-stone-800/60" strokeDasharray="4 4" strokeWidth="0.8" />

              {/* Vector Country Polygons */}
              {Object.entries(WORLD_COUNTRY_PATHS).map(([code, pathD]) => {
                const country = COUNTRIES.find((c) => c.code === code);
                const isHovered = hoveredCountry?.code === code;
                return (
                  <path
                    key={code}
                    d={pathD}
                    onClick={() => selectCountry(code)}
                    onMouseEnter={() => country && setHoveredCountry(country)}
                    onMouseLeave={() => setHoveredCountry(null)}
                    className={`cursor-pointer transition-colors duration-150 ${
                      isHovered
                        ? 'fill-amber-600 dark:fill-amber-500 stroke-amber-800 dark:stroke-amber-300 stroke-[1.5]'
                        : 'fill-stone-300/80 dark:fill-stone-800 hover:fill-amber-200 dark:hover:fill-stone-700 stroke-stone-400 dark:stroke-stone-700 stroke-[0.8]'
                    }`}
                  />
                );
              })}

              {/* Country interactive pin nodes for all 190+ sovereign countries */}
              {COUNTRIES.map((c) => {
                const [cx, cy] = projectCoords(c.lat, c.lng);
                const isHovered = hoveredCountry?.code === c.code;
                const isFiltered = selectedContinent === 'All' || c.region === selectedContinent;
                if (!isFiltered) return null;

                return (
                  <g
                    key={c.code}
                    transform={`translate(${cx}, ${cy})`}
                    onClick={() => selectCountry(c.code)}
                    onMouseEnter={() => setHoveredCountry(c)}
                    onMouseLeave={() => setHoveredCountry(null)}
                    className="cursor-pointer group/pin"
                  >
                    <circle
                      r={isHovered ? 6 : 3}
                      className={`transition-all duration-150 ${
                        isHovered
                          ? 'fill-amber-500 stroke-white dark:stroke-stone-900 stroke-2'
                          : 'fill-stone-700/70 dark:fill-stone-300/70 hover:fill-amber-600'
                      }`}
                    />
                    {isHovered && (
                      <text
                        y="-10"
                        textAnchor="middle"
                        className="text-[9px] font-sans font-bold fill-stone-900 dark:fill-white"
                        style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))' }}
                      >
                        {c.code}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="p-3 bg-white/70 dark:bg-stone-900/70 backdrop-blur-xs border-t border-stone-200 dark:border-stone-800 text-[11px] text-stone-500 flex items-center justify-between">
            <span>
              {language === 'fr'
                ? 'Conseil : Cliquez sur un pays pour ouvrir sa page dédiée. Pointez pour voir les détails.'
                : 'Tip: Click any country marker or territory to open its dedicated morning newspaper.'}
            </span>
            <span className="font-mono tabular-nums">{COUNTRIES.length} sovereign states</span>
          </div>
        </div>
      ) : null}

      {/* 3. Country Atlas Grid (Alphabetical & Searchable directory) */}
      <div className="bg-white dark:bg-stone-900/80 rounded-xl border border-stone-200/90 dark:border-stone-800 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-200 dark:border-stone-800">
          <h2 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
            {language === 'fr' ? 'Répertoire des Pays' : 'Country Atlas Directory'}
          </h2>
          <span className="text-xs text-stone-500 font-mono">
            {displayedCountries.length} {language === 'fr' ? 'pays' : 'countries'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
          {displayedCountries.map((c) => (
            <button
              key={c.code}
              onClick={() => selectCountry(c.code)}
              className="flex items-center gap-2 p-2 rounded-md border border-stone-200/80 dark:border-stone-800 hover:border-amber-500/70 dark:hover:border-amber-500/70 hover:bg-stone-50 dark:hover:bg-stone-800/80 transition-all text-left cursor-pointer group"
            >
              <span className="text-xl shrink-0">{c.flag}</span>
              <div className="overflow-hidden">
                <span className="block text-xs font-semibold text-stone-800 dark:text-stone-200 group-hover:text-amber-800 dark:group-hover:text-amber-400 truncate">
                  {language === 'fr' ? c.nameFr : c.nameEn}
                </span>
                <span className="block text-[10px] text-stone-400 truncate">
                  {c.capital}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
