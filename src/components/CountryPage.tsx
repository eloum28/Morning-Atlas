import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Star,
  ExternalLink,
  Search,
  Building2,
  Languages,
  Calendar,
  Filter,
  RefreshCw,
  Globe,
  Radio,
  FileText,
  Tv,
  CheckCircle2,
  X,
} from 'lucide-react';
import { NewsArticle, NewsCategory, SourceOriginMode, PublisherType, TopicInterest } from '../types';
import { getCountryByCode } from '../data/countries';
import { getOutletsForCountry } from '../data/outlets';
import { fetchCountryNews } from '../services/newsService';
import { ArticleCard } from './ArticleCard';
import { useApp } from '../context/AppContext';
import { classifyArticleTopic } from '../services/topicClassifier';

export const CountryPage: React.FC = () => {
  const {
    language,
    selectedCountryCode,
    setActiveTab,
    isFavoriteCountry,
    toggleFavoriteCountry,
    filterArticlesByPreferences,
    t,
  } = useApp();

  const country = getCountryByCode(selectedCountryCode);
  const outlets = useMemo(() => getOutletsForCountry(selectedCountryCode), [selectedCountryCode]);

  // Persistent Source Mode: 'local' (DEFAULT), 'all' (LOCAL + INTERNATIONAL), 'international'
  const [sourceMode, setSourceMode] = useState<SourceOriginMode>(() => {
    try {
      const saved = localStorage.getItem('morning_atlas_country_source_mode');
      if (saved === 'local' || saved === 'all' || saved === 'international') {
        return saved;
      }
      return 'local';
    } catch {
      return 'local';
    }
  });

  const handleSetSourceMode = (mode: SourceOriginMode) => {
    setSourceMode(mode);
    try {
      localStorage.setItem('morning_atlas_country_source_mode', mode);
    } catch {
      // ignore
    }
  };

  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [localArticles, setLocalArticles] = useState<NewsArticle[]>([]);
  const [internationalArticles, setInternationalArticles] = useState<NewsArticle[]>([]);
  const [noLocalAvailable, setNoLocalAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters within country page
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory | 'All'>('All');
  const [selectedPublisher, setSelectedPublisher] = useState<string>('All');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [selectedSourceType, setSelectedSourceType] = useState<PublisherType | 'All'>('All');
  const [selectedDateFilter, setSelectedDateFilter] = useState<'all' | '24h' | '3d' | '7d'>('all');
  const [countrySearch, setCountrySearch] = useState('');

  // Fetch real country news
  const loadCountryNews = async (forceRefresh = false) => {
    if (forceRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const data = await fetchCountryNews(
        selectedCountryCode,
        language,
        forceRefresh,
        sourceMode,
        selectedPublisher !== 'All' ? selectedPublisher : undefined
      );

      setArticles(data.articles || []);
      setLocalArticles(data.localArticles || []);
      setInternationalArticles(data.internationalArticles || []);
      setNoLocalAvailable(Boolean(data.noLocalAvailable));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch country headlines');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadCountryNews(false);
  }, [selectedCountryCode, language, sourceMode, selectedPublisher]);

  const isFav = isFavoriteCountry(selectedCountryCode);
  const countryName = country ? (language === 'fr' ? country.nameFr : country.nameEn) : selectedCountryCode;

  // Filter helper applied to any article list
  const filterList = (list: NewsArticle[]) => {
    let result = list;

    // Filter by Category
    if (selectedCategory !== 'All') {
      result = result.filter((a) => a.category === selectedCategory);
    }

    // Filter by Publisher
    if (selectedPublisher !== 'All') {
      const p = selectedPublisher.toLowerCase();
      result = result.filter(
        (a) =>
          a.publisherId === selectedPublisher ||
          a.publisher.toLowerCase().includes(p) ||
          (a.publisherDomain && a.publisherDomain.toLowerCase().includes(p))
      );
    }

    // Filter by Language
    if (selectedLanguage !== 'All') {
      result = result.filter(
        (a) =>
          a.language?.toLowerCase() === selectedLanguage.toLowerCase() ||
          a.originalLanguage?.toLowerCase() === selectedLanguage.toLowerCase()
      );
    }

    // Filter by Source Type
    if (selectedSourceType !== 'All') {
      const matchedOutlets = outlets.filter((o) => o.publisherType === selectedSourceType);
      const outletNames = new Set(matchedOutlets.map((o) => o.name.toLowerCase()));
      const outletIds = new Set(matchedOutlets.map((o) => o.id));
      result = result.filter(
        (a) =>
          (a.publisherId && outletIds.has(a.publisherId)) ||
          outletNames.has(a.publisher.toLowerCase())
      );
    }

    // Filter by Date
    if (selectedDateFilter !== 'all') {
      const now = Date.now();
      const maxAgeMs =
        selectedDateFilter === '24h'
          ? 24 * 60 * 60 * 1000
          : selectedDateFilter === '3d'
          ? 3 * 24 * 60 * 60 * 1000
          : 7 * 24 * 60 * 60 * 1000;
      result = result.filter((a) => {
        try {
          const pub = new Date(a.pubDate).getTime();
          return now - pub <= maxAgeMs;
        } catch {
          return true;
        }
      });
    }

    // Search query
    if (countrySearch.trim()) {
      const q = countrySearch.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.summary && a.summary.toLowerCase().includes(q)) ||
          a.publisher.toLowerCase().includes(q)
      );
    }

    return result;
  };

  const filteredLocalArticles = useMemo(() => filterList(localArticles), [
    localArticles,
    selectedCategory,
    selectedPublisher,
    selectedLanguage,
    selectedSourceType,
    selectedDateFilter,
    countrySearch,
    outlets,
  ]);

  const filteredIntlArticles = useMemo(() => filterList(internationalArticles), [
    internationalArticles,
    selectedCategory,
    selectedPublisher,
    selectedLanguage,
    selectedSourceType,
    selectedDateFilter,
    countrySearch,
    outlets,
  ]);

  const filteredArticles = useMemo(() => {
    if (sourceMode === 'local') return filteredLocalArticles;
    if (sourceMode === 'international') return filteredIntlArticles;
    return filterList(articles);
  }, [sourceMode, filteredLocalArticles, filteredIntlArticles, articles]);

  // Extract distinct languages from country outlets
  const availableLanguages = useMemo(() => {
    const set = new Set<string>();
    outlets.forEach((o) => {
      if (o.language) set.add(o.language);
      if (o.languages) o.languages.forEach((l) => set.add(l));
    });
    return Array.from(set);
  }, [outlets]);

  if (!country) {
    return (
      <div className="py-20 text-center">
        <p className="text-stone-500">Country not found.</p>
        <button
          onClick={() => setActiveTab('world')}
          className="mt-4 px-4 py-2 bg-stone-900 text-white rounded text-xs"
        >
          {t.actions.backToWorld}
        </button>
      </div>
    );
  }

  const activeFiltersCount =
    (selectedCategory !== 'All' ? 1 : 0) +
    (selectedPublisher !== 'All' ? 1 : 0) +
    (selectedLanguage !== 'All' ? 1 : 0) +
    (selectedSourceType !== 'All' ? 1 : 0) +
    (selectedDateFilter !== 'all' ? 1 : 0) +
    (countrySearch.trim() ? 1 : 0);

  const resetAllFilters = () => {
    setSelectedCategory('All');
    setSelectedPublisher('All');
    setSelectedLanguage('All');
    setSelectedSourceType('All');
    setSelectedDateFilter('all');
    setCountrySearch('');
  };

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Return button & Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveTab('morning-brief')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t.actions.backToWorld}</span>
        </button>

        {/* Refresh button */}
        <button
          onClick={() => loadCountryNews(true)}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer"
          title={t.actions.refresh}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isRefreshing ? t.actions.refreshing : t.actions.refresh}</span>
        </button>
      </div>

      {/* 2. Country Header Masthead */}
      <div className="bg-white dark:bg-stone-900/90 rounded-xl border border-stone-200/90 dark:border-stone-800 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-start gap-4">
            <span className="text-4xl sm:text-5xl shrink-0" role="img" aria-label={countryName}>
              {country.flag}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-widest text-amber-700 dark:text-amber-500 font-semibold">
                  {country.region} · {country.code}
                </span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 dark:text-stone-50 mt-1">
                {countryName} — {t.countryPage.todaysNews}
              </h1>
              {/* Unboxed facts */}
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500 dark:text-stone-400">
                <span>{t.countryPage.capital}: <strong className="text-stone-700 dark:text-stone-300 font-medium">{country.capital}</strong></span>
                <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">·</span>
                <span>{t.countryPage.languages}: <strong className="text-stone-700 dark:text-stone-300 font-medium">{country.languages.join(', ')}</strong></span>
                <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">·</span>
                <span>{outlets.length} {language === 'fr' ? 'sources locales vérifiées' : 'verified local sources'}</span>
              </div>
            </div>
          </div>

          {/* Favorite Country Toggle */}
          <button
            onClick={() => toggleFavoriteCountry(country.code)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer self-start sm:self-center shrink-0 ${
              isFav
                ? 'bg-amber-50 dark:bg-stone-800 border-amber-300 dark:border-amber-600/50 text-amber-900 dark:text-amber-400'
                : 'bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-500 text-amber-500' : ''}`} />
            <span>
              {isFav
                ? (language === 'fr' ? 'Pays favori' : 'Favorite Country')
                : (language === 'fr' ? 'Ajouter aux favoris' : 'Add to Favorites')}
            </span>
          </button>
        </div>

        {/* 3. Three Source-Origin Tabs (LOCAL ONLY [DEFAULT] | LOCAL + INTERNATIONAL | INTERNATIONAL ONLY) */}
        <div className="mt-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 p-1 bg-stone-100 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 text-xs font-medium">
            <button
              onClick={() => handleSetSourceMode('local')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                sourceMode === 'local'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs font-semibold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <span>{t.countryPage.localOnly}</span>
              <span className="text-[10px] uppercase font-mono px-1 py-0.2 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded font-normal">
                {language === 'fr' ? 'Défaut' : 'Default'}
              </span>
            </button>

            <button
              onClick={() => handleSetSourceMode('all')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                sourceMode === 'all'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs font-semibold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              {t.countryPage.localAndInternational}
            </button>

            <button
              onClick={() => handleSetSourceMode('international')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                sourceMode === 'international'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs font-semibold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              {t.countryPage.internationalOnly}
            </button>
          </div>

          {/* Search bar */}
          <div className="relative sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
            <input
              type="text"
              value={countrySearch}
              onChange={(e) => setCountrySearch(e.target.value)}
              placeholder={t.countryPage.searchInCountry}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-md focus:outline-hidden text-stone-900 dark:text-stone-100"
            />
          </div>
        </div>

        {/* 4. Filter Bar: Publication, Language, Category, Date, Source Type */}
        <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center gap-2 text-xs">
          {/* Publication Filter */}
          <div className="flex items-center gap-1">
            <span className="text-stone-400 font-medium">{t.countryPage.filterByOutlet}:</span>
            <select
              value={selectedPublisher}
              onChange={(e) => setSelectedPublisher(e.target.value)}
              className="bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded px-2 py-1 text-xs text-stone-800 dark:text-stone-200 focus:outline-hidden cursor-pointer"
            >
              <option value="All">{t.countryPage.allOutlets}</option>
              {outlets.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          {/* Language Filter */}
          {availableLanguages.length > 1 && (
            <div className="flex items-center gap-1">
              <span className="text-stone-400 font-medium">{t.countryPage.filterByLanguage}:</span>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded px-2 py-1 text-xs text-stone-800 dark:text-stone-200 focus:outline-hidden cursor-pointer"
              >
                <option value="All">{t.countryPage.allLanguages}</option>
                {availableLanguages.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Source Type Filter */}
          <div className="flex items-center gap-1">
            <span className="text-stone-400 font-medium">{t.countryPage.filterByType}:</span>
            <select
              value={selectedSourceType}
              onChange={(e) => setSelectedSourceType(e.target.value as any)}
              className="bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded px-2 py-1 text-xs text-stone-800 dark:text-stone-200 focus:outline-hidden cursor-pointer"
            >
              <option value="All">{t.countryPage.allTypes}</option>
              <option value="newspaper">Newspaper</option>
              <option value="agency">News Agency</option>
              <option value="broadcaster">Broadcaster</option>
              <option value="digital">Digital Media</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-1">
            <span className="text-stone-400 font-medium">{t.countryPage.filterByDate}:</span>
            <select
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value as any)}
              className="bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded px-2 py-1 text-xs text-stone-800 dark:text-stone-200 focus:outline-hidden cursor-pointer"
            >
              <option value="all">{t.countryPage.allDates}</option>
              <option value="24h">{t.countryPage.past24h}</option>
              <option value="3d">{t.countryPage.past3d}</option>
              <option value="7d">{t.countryPage.past7d}</option>
            </select>
          </div>

          {/* Active filter count & reset */}
          {activeFiltersCount > 0 && (
            <button
              onClick={resetAllFilters}
              className="inline-flex items-center gap-1 text-[11px] text-amber-800 dark:text-amber-400 hover:underline cursor-pointer ml-auto"
            >
              <X className="w-3 h-3" />
              <span>Reset filters ({activeFiltersCount})</span>
            </button>
          )}
        </div>

        {/* Categories Bar */}
        <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {(['All', 'Politics', 'Economy', 'Society', 'Technology', 'Science', 'Sports'] as (NewsCategory | 'All')[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-semibold'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              {cat === 'All' ? (language === 'fr' ? 'Toutes rubriques' : 'All Sections') : (t.categories[cat] || cat)}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Headlines Section based on Source Mode */}
      {isLoading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-2 border-stone-300 dark:border-stone-700 border-t-stone-900 dark:border-t-stone-100 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-stone-500">
            {language === 'fr'
              ? `Collecte des dépêches locales pour ${countryName}...`
              : `Retrieving local reporting for ${countryName}...`}
          </p>
        </div>
      ) : sourceMode === 'local' ? (
        /* LOCAL ONLY (DEFAULT) */
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-xl font-bold text-stone-900 dark:text-stone-100">
                {t.countryPage.localReportingTitle.replace('{country}', countryName)}
              </h2>
              <span className="text-[11px] font-mono text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/50">
                {language === 'fr' ? 'Presse nationale' : 'Domestic sources'}
              </span>
            </div>
            <span className="text-xs text-stone-500 font-mono">
              {filteredLocalArticles.length} {language === 'fr' ? 'articles' : 'articles'}
            </span>
          </div>

          {/* RULE 8: Empty local state fallback - Do NOT silently substitute international reporting! */}
          {filteredLocalArticles.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 rounded-xl p-8 text-center border border-stone-200 dark:border-stone-800 space-y-4">
              <div className="max-w-md mx-auto space-y-2">
                <Globe className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                  {t.countryPage.noLocalAvailable.replace('{country}', countryName)}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                  {language === 'fr'
                    ? `Les flux directs pour les journaux de ${countryName} ne renvoient pas de dépêches récentes en ce moment. Vous pouvez consulter directement leurs sites officiels ci-dessous ou basculer sur la couverture internationale.`
                    : `Direct RSS feeds from domestic ${countryName} publications currently have no fresh items. You can visit their verified websites below, trigger a refresh, or view international reporting.`}
                </p>
              </div>

              {/* Action buttons: Refresh & View International */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => loadCountryNews(true)}
                  disabled={isRefreshing}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-md text-xs font-semibold hover:bg-stone-800 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>{isRefreshing ? t.actions.refreshing : t.actions.refresh}</span>
                </button>

                <button
                  onClick={() => handleSetSourceMode('international')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-700 rounded-md text-xs font-semibold hover:bg-stone-200 cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5 text-amber-600" />
                  <span>{t.countryPage.viewInternationalCoverage}</span>
                </button>
              </div>

              {/* Quick links to verified local newspapers */}
              {outlets.length > 0 && (
                <div className="pt-4 border-t border-stone-100 dark:border-stone-800 text-left">
                  <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-2">
                    {language === 'fr' ? 'Consulter les rédactions officielles :' : 'Browse official newspaper websites:'}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {outlets.slice(0, 6).map((o) => (
                      <a
                        key={o.id}
                        href={o.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded text-xs text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white"
                      >
                        <span>{o.name}</span>
                        <ExternalLink className="w-2.5 h-2.5 text-stone-400" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredLocalArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </section>
      ) : sourceMode === 'international' ? (
        /* INTERNATIONAL ONLY */
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-xl font-bold text-stone-900 dark:text-stone-100">
                {t.countryPage.internationalReportingTitle.replace('{country}', countryName)}
              </h2>
              <span className="text-[11px] font-mono text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded border border-stone-200 dark:border-stone-700">
                {language === 'fr' ? 'Presse étrangère' : 'Foreign publishers'}
              </span>
            </div>
            <span className="text-xs text-stone-500 font-mono">
              {filteredIntlArticles.length} {language === 'fr' ? 'articles' : 'articles'}
            </span>
          </div>

          {filteredIntlArticles.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 rounded-xl p-8 text-center border border-stone-200 dark:border-stone-800">
              <p className="text-sm text-stone-600 dark:text-stone-400">
                {t.countryPage.noArticlesFound}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredIntlArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </section>
      ) : (
        /* LOCAL + INTERNATIONAL: Two clearly separated sections */
        <div className="space-y-10">
          {/* Section 1: Local reporting from domestic publishers */}
          <section className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <h2 className="font-serif text-xl font-bold text-stone-900 dark:text-stone-100">
                  {t.countryPage.localReportingTitle.replace('{country}', countryName)}
                </h2>
              </div>
              <span className="text-xs text-stone-500 font-mono">
                {filteredLocalArticles.length} {language === 'fr' ? 'dépêches locales' : 'local reports'}
              </span>
            </div>

            {filteredLocalArticles.length === 0 ? (
              <div className="bg-stone-50 dark:bg-stone-900/60 rounded-lg p-6 border border-stone-200 dark:border-stone-800 text-center">
                <p className="text-xs text-stone-500">
                  {t.countryPage.noLocalAvailable.replace('{country}', countryName)}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredLocalArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            )}
          </section>

          {/* Section 2: International reporting about the selected country */}
          <section className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <h2 className="font-serif text-xl font-bold text-stone-900 dark:text-stone-100">
                  {t.countryPage.internationalReportingTitle.replace('{country}', countryName)}
                </h2>
              </div>
              <span className="text-xs text-stone-500 font-mono">
                {filteredIntlArticles.length} {language === 'fr' ? 'dépêches internationales' : 'international reports'}
              </span>
            </div>

            {filteredIntlArticles.length === 0 ? (
              <div className="bg-stone-50 dark:bg-stone-900/60 rounded-lg p-6 border border-stone-200 dark:border-stone-800 text-center">
                <p className="text-xs text-stone-500">
                  {language === 'fr'
                    ? 'Aucun article international disponible pour le moment.'
                    : 'No foreign reporting currently available for this country.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredIntlArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* 6. Directory: "News Outlets in This Country" */}
      <section className="bg-white dark:bg-stone-900/90 rounded-xl border border-stone-200/90 dark:border-stone-800 p-6 sm:p-8 shadow-xs">
        <div className="border-b border-stone-200 dark:border-stone-800 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
              {t.countryPage.outletsInThisCountry} — {countryName}
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              {language === 'fr'
                ? 'Répertoire officiel des rédactions nationales, agences de presse et médias indépendants.'
                : 'Verified domestic news organizations, press agencies, and independent publications operating in this nation.'}
            </p>
          </div>

          {selectedPublisher !== 'All' && (
            <button
              onClick={() => setSelectedPublisher('All')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded text-xs hover:bg-stone-200 cursor-pointer self-start sm:self-auto"
            >
              <X className="w-3.5 h-3.5" />
              <span>{t.countryPage.clearFilter}</span>
            </button>
          )}
        </div>

        {outlets.length === 0 ? (
          <div className="text-center py-8 text-xs text-stone-500">
            {language === 'fr'
              ? "Le répertoire direct de ce pays est en cours d'expansion. Utilisez la recherche de couverture internationale."
              : "Direct outlet database for this nation is currently expanding. International reporting is actively tracked above."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {outlets.map((outlet) => {
              const isSelected = selectedPublisher === outlet.id;

              return (
                <div
                  key={outlet.id}
                  className={`rounded-lg border p-4 flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'bg-amber-50/60 dark:bg-stone-800 border-amber-300 dark:border-amber-600 ring-1 ring-amber-300'
                      : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200/80 dark:border-stone-700/80 hover:border-stone-400'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-serif font-bold text-stone-900 dark:text-white text-base">
                          {outlet.name}
                        </h3>
                        {outlet.domain && (
                          <span className="text-[11px] font-mono text-stone-400">
                            {outlet.domain}
                          </span>
                        )}
                      </div>
                      <a
                        href={outlet.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1"
                        title={t.actions.visitWebsite}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    {outlet.description && (
                      <p className="text-xs text-stone-600 dark:text-stone-300 mt-2 line-clamp-2 leading-relaxed">
                        {outlet.description}
                      </p>
                    )}

                    {/* Metadata Strip */}
                    <div className="mt-3 pt-2.5 border-t border-stone-200/60 dark:border-stone-700/60 text-[11px] text-stone-500 dark:text-stone-400 space-y-1">
                      <div className="flex items-center justify-between">
                        <span>
                          {(t.mediaCategories as Record<string, string>)[outlet.category] || outlet.category}
                        </span>
                        <span className="font-medium text-stone-700 dark:text-stone-300">{outlet.language}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span>{outlet.ownership}</span>
                        <span>
                          {(t.paywall as Record<string, string>)[outlet.paywallStatus] || outlet.paywallStatus}
                        </span>
                      </div>

                      {outlet.assessmentProvider && (
                        <div className="text-[10px] text-stone-400 pt-1 italic">
                          Audit: {outlet.assessmentProvider}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions: View Latest Articles & Visit Website */}
                  <div className="mt-4 pt-2 border-t border-stone-200/60 dark:border-stone-700/60 flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedPublisher(isSelected ? 'All' : outlet.id);
                        window.scrollTo({ top: 300, behavior: 'smooth' });
                      }}
                      className={`flex-1 py-1.5 px-2 rounded text-xs font-semibold transition-colors cursor-pointer text-center ${
                        isSelected
                          ? 'bg-amber-600 text-white hover:bg-amber-700'
                          : 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 hover:bg-stone-800'
                      }`}
                    >
                      {isSelected
                        ? (language === 'fr' ? 'Filtre actif' : 'Filtered')
                        : t.countryPage.latestArticles}
                    </button>

                    <a
                      href={outlet.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 border border-stone-300 dark:border-stone-600 rounded text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700"
                      title={t.actions.visitWebsite}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
