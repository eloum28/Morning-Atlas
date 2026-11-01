import React, { useState, useMemo } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  Clock,
  Compass,
  Sparkles,
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import { NewsArticle, Region, ReadingMode } from '../types';
import { REGIONS_LIST } from '../data/countries';
import { ArticleCard } from './ArticleCard';
import { useApp } from '../context/AppContext';
import { ensureRegionalDiversity } from '../services/newsRanking';

interface MorningBriefProps {
  articles: NewsArticle[];
  articlesByRegion?: Record<Region, NewsArticle[]>;
  isLoading: boolean;
}

export const MorningBrief: React.FC<MorningBriefProps> = ({
  articles,
  articlesByRegion,
  isLoading,
}) => {
  const {
    language,
    readingMode,
    setReadingMode,
    t,
    isAudioPlaying,
    isAudioPaused,
    currentAudioIndex,
    speechRate,
    setSpeechRate,
    playArticlesAudio,
    pauseAudio,
    resumeAudio,
    stopAudio,
    selectCountry,
    setActiveTab,
    isArticleExcluded,
    setSelectedTopicFilter,
  } = useApp();

  // State to track expanded regions for deeper reading
  const [expandedRegions, setExpandedRegions] = useState<Record<string, boolean>>({});

  const toggleRegionExpand = (region: string) => {
    setExpandedRegions((prev) => ({
      ...prev,
      [region]: !prev[region],
    }));
  };

  // Dynamic greeting based on time of day
  const greetingText = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t.greeting;
    if (hour < 18) return t.greetingAfternoon;
    return t.greetingEvening;
  }, [t]);

  // Reading mode configuration: controls article depth and count per region
  const readingModeConfig = useMemo(() => {
    switch (readingMode) {
      case 'quick':
        return {
          label: '5 Min',
          countPerRegion: 1,
          totalTarget: 8,
          description:
            language === 'fr'
              ? 'Point express : les 8 événements essentiels du monde'
              : 'Express brief: the 8 essential global developments',
        };
      case 'deep':
        return {
          label: '30 Min',
          countPerRegion: 5,
          totalTarget: 35,
          description:
            language === 'fr'
              ? 'Lecture approfondie : analyses complètes et perspectives croisées'
              : 'Deep reading: comprehensive analyses and multi-perspective coverage',
        };
      case 'standard':
      default:
        return {
          label: '15 Min',
          countPerRegion: 2,
          totalTarget: 15,
          description:
            language === 'fr'
              ? 'Point équilibré : panorama des 7 continents avec contextes'
              : 'Balanced brief: panoramic review across all 7 continents with context',
        };
    }
  }, [readingMode, language]);

  // Organize stories: separate lead story and regional groups without duplication
  const { leadArticle, regionGroups, briefingArticles } = useMemo(() => {
    // 1. Strictly exclude unwanted topics (sports, entertainment) across the entire briefing
    const eligibleArticles = (articles || []).filter((a) => !isArticleExcluded(a));

    if (eligibleArticles.length === 0) {
      return {
        leadArticle: null,
        regionGroups: {} as Record<Region, NewsArticle[]>,
        briefingArticles: [],
      };
    }

    // Lead story: highest importance score among eligible stories
    const lead = eligibleArticles[0];

    // Build region groups with guaranteed country diversity, strictly excluding the lead story and excluded topics
    const groups: Record<string, NewsArticle[]> = {};
    for (const region of REGIONS_LIST) {
      if (articlesByRegion && articlesByRegion[region]) {
        groups[region] = ensureRegionalDiversity(
          articlesByRegion[region].filter((a) => a.id !== lead.id && !isArticleExcluded(a))
        );
      } else {
        groups[region] = ensureRegionalDiversity(
          eligibleArticles.filter((a) => a.region === region && a.id !== lead.id)
        );
      }
    }

    // Global & multilateral dispatches strictly verified for international/multilateral scope (never sports or unclassified)
    if (articlesByRegion && articlesByRegion['Global']) {
      groups['Global'] = articlesByRegion['Global'].filter(
        (a) => a.id !== lead.id && a.isMultilateral === true && !isArticleExcluded(a)
      );
    } else {
      groups['Global'] = eligibleArticles.filter(
        (a) => a.region === 'Global' && a.id !== lead.id && a.isMultilateral === true && !isArticleExcluded(a)
      );
    }

    // Compile active briefing playlist for audio and summary
    const count = readingModeConfig.countPerRegion;
    const playlist: NewsArticle[] = [lead];

    for (const r of REGIONS_LIST) {
      const items = groups[r] || [];
      playlist.push(...items.slice(0, count));
    }

    // If verified global/multilateral dispatches exist, add top dispatches to playlist
    if (groups['Global'] && groups['Global'].length > 0) {
      playlist.push(...groups['Global'].slice(0, Math.min(2, count)));
    }

    return {
      leadArticle: lead,
      regionGroups: groups as Record<Region, NewsArticle[]>,
      briefingArticles: playlist,
    };
  }, [articles, articlesByRegion, readingModeConfig, isArticleExcluded]);

  // Actual estimated reading time based on real content word count
  const calculatedReadingMinutes = useMemo(() => {
    let totalWords = 0;
    for (const a of briefingArticles) {
      totalWords += (a.title || '').split(/\s+/).length;
      totalWords += (a.summary || '').split(/\s+/).length;
    }
    return Math.max(2, Math.round(totalWords / 160));
  }, [briefingArticles]);

  if (isLoading && articles.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center">
        <div className="w-10 h-10 border-2 border-stone-300 dark:border-stone-700 border-t-stone-900 dark:border-t-stone-100 rounded-full animate-spin mb-4" />
        <h2 className="font-serif text-xl font-bold text-stone-900 dark:text-stone-100 mb-1">
          {t.status.loading}
        </h2>
        <p className="text-xs text-stone-500 max-w-md">{t.status.cachedNotice}</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-16">
      {/* 1. Welcoming Hero & Briefing Control Bar */}
      <section className="bg-white dark:bg-stone-900/80 rounded-xl border border-stone-200/90 dark:border-stone-800 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-stone-200 dark:border-stone-800">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-amber-700 dark:text-amber-500 font-semibold">
              {t.briefing.title}
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 dark:text-stone-50 mt-1 mb-2 tracking-tight">
              {greetingText}
            </h1>
            <p className="text-stone-600 dark:text-stone-300 text-sm max-w-2xl leading-relaxed">
              {readingModeConfig.description}
            </p>
          </div>

          {/* Reading Mode Segmented Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              {t.briefing.readingTime}: ~{calculatedReadingMinutes} min
            </span>
            <div className="flex items-center p-1 bg-stone-100 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 text-xs">
              <button
                onClick={() => setReadingMode('quick')}
                className={`px-3 py-1.5 font-medium rounded-md transition-colors cursor-pointer ${
                  readingMode === 'quick'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs font-semibold'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                {t.briefing.quick.split(' ')[0]} 5 Min
              </button>
              <button
                onClick={() => setReadingMode('standard')}
                className={`px-3 py-1.5 font-medium rounded-md transition-colors cursor-pointer ${
                  readingMode === 'standard'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs font-semibold'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                {t.briefing.standard.split(' ')[0]} 15 Min
              </button>
              <button
                onClick={() => setReadingMode('deep')}
                className={`px-3 py-1.5 font-medium rounded-md transition-colors cursor-pointer ${
                  readingMode === 'deep'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs font-semibold'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                {t.briefing.deep.split(' ')[0]} 30 Min
              </button>
            </div>
          </div>
        </div>

        {/* 2. "Listen to the News" Audio Bar */}
        <div className="mt-5 pt-1 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300 font-medium">
              <Volume2 className="w-4 h-4 text-amber-600 dark:text-amber-500" />
              <span>{t.briefing.audioTitle}</span>
            </div>

            {/* Play / Pause / Stop controls */}
            {!isAudioPlaying ? (
              <button
                onClick={() => playArticlesAudio(briefingArticles)}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-md font-medium hover:bg-stone-800 dark:hover:bg-white transition-colors cursor-pointer shadow-xs"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>
                  {t.briefing.play} ({briefingArticles.length}{' '}
                  {language === 'fr' ? 'dépêches' : 'stories'})
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                {isAudioPaused ? (
                  <button
                    onClick={resumeAudio}
                    className="p-1.5 bg-amber-600 text-white rounded hover:bg-amber-700 transition cursor-pointer"
                    title="Resume"
                  >
                    <Play className="w-3 h-3 fill-current" />
                  </button>
                ) : (
                  <button
                    onClick={pauseAudio}
                    className="p-1.5 bg-stone-800 text-white rounded hover:bg-stone-700 transition cursor-pointer"
                    title={t.briefing.pause}
                  >
                    <Pause className="w-3 h-3 fill-current" />
                  </button>
                )}
                <button
                  onClick={stopAudio}
                  className="p-1.5 bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded hover:bg-stone-300 dark:hover:bg-stone-700 transition cursor-pointer"
                  title={t.briefing.stop}
                >
                  <Square className="w-3 h-3 fill-current" />
                </button>
                <span className="font-mono text-[11px] text-amber-700 dark:text-amber-400 pl-2">
                  Reading dispatch {currentAudioIndex + 1} of {briefingArticles.length}
                </span>
              </div>
            )}
          </div>

          {/* Speed selector */}
          <div className="flex items-center gap-2">
            <span className="text-stone-500 text-[11px]">{t.briefing.speed}:</span>
            {[0.9, 1.0, 1.25, 1.5].map((rate) => (
              <button
                key={rate}
                onClick={() => setSpeechRate(rate)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer ${
                  speechRate === rate
                    ? 'bg-stone-200 dark:bg-stone-700 font-bold text-stone-900 dark:text-white'
                    : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>

        {/* 2b. Topic Discovery Strip */}
        <div className="mt-4 pt-3 border-t border-stone-200/70 dark:border-stone-800/80 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-stone-400 font-medium text-[11px] uppercase tracking-wider mr-1 shrink-0">
            {language === 'fr' ? 'Centres d’intérêt :' : 'Featured Subjects:'}
          </span>
          <button
            onClick={() => setActiveTab('china-tech')}
            className="px-2.5 py-1 rounded bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300 font-semibold border border-red-200 dark:border-red-900/60 whitespace-nowrap transition cursor-pointer"
          >
            {language === 'fr' ? '🇨🇳 Tech Chine (Dossier spécial)' : '🇨🇳 China Tech & Innovation'}
          </button>
          <button
            onClick={() => {
              setSelectedTopicFilter('ai-advanced-tech');
              setActiveTab('world');
            }}
            className="px-2.5 py-1 rounded bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-medium whitespace-nowrap transition cursor-pointer"
          >
            {language === 'fr' ? 'IA & Tech Avancée' : 'AI & Advanced Tech'}
          </button>
          <button
            onClick={() => {
              setSelectedTopicFilter('renewable-energy');
              setActiveTab('world');
            }}
            className="px-2.5 py-1 rounded bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-medium whitespace-nowrap transition cursor-pointer"
          >
            {language === 'fr' ? 'Énergies Renouvelables' : 'Renewable Energy'}
          </button>
          <button
            onClick={() => {
              setSelectedTopicFilter('economy');
              setActiveTab('world');
            }}
            className="px-2.5 py-1 rounded bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-medium whitespace-nowrap transition cursor-pointer"
          >
            {language === 'fr' ? 'Économie Mondiale' : 'Global Economy'}
          </button>
          <button
            onClick={() => {
              setSelectedTopicFilter('agriculture');
              setActiveTab('world');
            }}
            className="px-2.5 py-1 rounded bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-medium whitespace-nowrap transition cursor-pointer"
          >
            {language === 'fr' ? 'Agriculture & Alimentation' : 'Agriculture & Food'}
          </button>
          <button
            onClick={() => {
              setSelectedTopicFilter('geopolitics');
              setActiveTab('world');
            }}
            className="px-2.5 py-1 rounded bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-medium whitespace-nowrap transition cursor-pointer"
          >
            {language === 'fr' ? 'Géopolitique' : 'Geopolitics'}
          </button>
        </div>
      </section>

      {/* 3. Lead Story Presentation (Tier 1 Salience) */}
      {leadArticle && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-500" />
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
                {language === 'fr' ? 'La Dépêche Principale' : 'Lead International Report'}
              </h2>
            </div>
            <span className="text-xs font-mono text-stone-500 tabular-nums">
              {briefingArticles.length} {t.briefing.storiesCount}
            </span>
          </div>

          <ArticleCard article={leadArticle} featured={true} />
        </section>
      )}

      {/* 4. Dedicated Sections for ALL 7 Geographic Regions (Priority 1) */}
      <section className="space-y-10">
        <div className="border-b border-stone-200 dark:border-stone-800 pb-3 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
              {language === 'fr'
                ? 'Le Tour du Monde par Région'
                : 'Panoramic Dispatches Across All 7 Continents'}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              {language === 'fr'
                ? 'Flux indépendants garantissant une présence équilibrée de chaque continent'
                : 'Independent regional feeds ensuring verified coverage from every continent'}
            </p>
          </div>
        </div>

        {REGIONS_LIST.map((region) => {
          const regionArticles = regionGroups[region] || [];
          const countLimit = readingModeConfig.countPerRegion;
          const isExpanded = !!expandedRegions[region];
          const displayedArticles = isExpanded
            ? regionArticles
            : regionArticles.slice(0, countLimit);
          const hasMore = regionArticles.length > countLimit;

          return (
            <div
              key={region}
              className="space-y-4 pt-4 border-t border-stone-200/60 dark:border-stone-800/60 first:border-t-0 first:pt-0"
            >
              {/* Region Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-600 dark:bg-amber-500" />
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
                    {t.regions[region] || region}
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-stone-400 font-mono tabular-nums">
                    {regionArticles.length}{' '}
                    {language === 'fr' ? 'dépêches' : 'dispatches'}
                  </span>
                </div>
              </div>

              {/* Empty state check per region (Priority 1) */}
              {regionArticles.length === 0 ? (
                <div className="p-6 rounded-lg bg-stone-50 dark:bg-stone-900/40 border border-stone-200/80 dark:border-stone-800 text-center">
                  <AlertCircle className="w-5 h-5 mx-auto text-stone-400 mb-1.5" />
                  <p className="text-xs text-stone-600 dark:text-stone-400 font-medium">
                    {language === 'fr'
                      ? `Aucune nouvelle dépêche enregistrée pour la région ${t.regions[region] || region} dans le cycle actuel.`
                      : `No fresh dispatches reported for ${region} in the current ingestion cycle.`}
                  </p>
                  <p className="text-[11px] text-stone-400 mt-1">
                    {language === 'fr'
                      ? 'Consultez les tableaux de bord nationaux sur la Carte ou actualisez les flux.'
                      : 'Explore national newsrooms directly on the Map or use the refresh button above.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {displayedArticles.map((article) => (
                      <ArticleCard key={article.id} article={article} />
                    ))}
                  </div>

                  {/* Expand/Collapse extra articles within region (Priority 6) */}
                  {hasMore && (
                    <div className="pt-2 text-center">
                      <button
                        onClick={() => toggleRegionExpand(region)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 rounded-md text-xs font-medium transition-colors cursor-pointer"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-3.5 h-3.5" />
                            <span>
                              {language === 'fr'
                                ? `Réduire les dépêches de ${t.regions[region] || region}`
                                : `Collapse ${region} dispatches`}
                            </span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3.5 h-3.5" />
                            <span>
                              {language === 'fr'
                                ? `Voir ${regionArticles.length - countLimit} autres dépêches en ${t.regions[region] || region}`
                                : `Show ${regionArticles.length - countLimit} more dispatches in ${region}`}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}

        {/* Global / Multilateral Verified Dispatches Section */}
        <div className="space-y-4 pt-4 border-t border-stone-200/60 dark:border-stone-800/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-stone-500" />
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
                {language === 'fr' ? 'Dépêches Mondiales & Multilatérales' : 'Global & Multilateral Dispatches'}
              </h3>
            </div>
            <span className="text-xs text-stone-400 font-mono tabular-nums">
              {(regionGroups['Global'] || []).length}{' '}
              {language === 'fr' ? 'dépêches vérifiées' : 'verified dispatches'}
            </span>
          </div>

          {!regionGroups['Global'] || regionGroups['Global'].length === 0 ? (
            <div className="p-5 rounded-lg bg-stone-50 dark:bg-stone-900/40 border border-stone-200/80 dark:border-stone-800 text-center">
              <p className="text-xs text-stone-600 dark:text-stone-400 font-medium">
                {language === 'fr'
                  ? 'Aucune dépêche multilatérale majeure ne répond aux critères de vérification globale dans le cycle actuel.'
                  : 'No major multilateral dispatches meeting global verification criteria in the current briefing cycle.'}
              </p>
              <p className="text-[11px] text-stone-400 mt-1">
                {language === 'fr'
                  ? 'Les résolutions de l’ONU, du G20 ou les traités internationaux vérifiés apparaîtront ici dès leur adoption.'
                  : 'Verified international treaties, UN, G20, and WHO developments will appear here as soon as published.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {regionGroups['Global'].slice(0, readingModeConfig.countPerRegion).map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 5. Geographic Exploration Callout */}
      <section className="bg-stone-100/70 dark:bg-stone-900/50 rounded-xl p-6 border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
            {language === 'fr' ? 'Explorer la Carte du Monde' : 'Explore the Interactive World Map'}
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1">
            {language === 'fr'
              ? "Cliquez sur n'importe quel pays sur le globe pour consulter ses gros titres et son répertoire de presse nationale."
              : 'Click any sovereign state on the global atlas to access dedicated national news and media directories.'}
          </p>
        </div>
        <button
          onClick={() => setActiveTab('map')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-md text-xs font-semibold hover:bg-stone-800 dark:hover:bg-white transition-colors cursor-pointer shrink-0"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>{t.nav.map}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </section>
    </div>
  );
};
