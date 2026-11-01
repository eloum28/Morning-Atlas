import React, { useState, useMemo } from 'react';
import { Filter, Search, Calendar, Globe2, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { NewsArticle, NewsCategory, Region, TimeFilter, PoliticalPerspective, TopicInterest } from '../types';
import { REGIONS_LIST } from '../data/countries';
import { ArticleCard } from './ArticleCard';
import { useApp } from '../context/AppContext';
import { classifyArticleTopic } from '../services/topicClassifier';

interface WorldViewProps {
  articles: NewsArticle[];
  isLoading: boolean;
}

export const WorldView: React.FC<WorldViewProps> = ({ articles, isLoading }) => {
  const {
    language,
    searchQuery,
    setSearchQuery,
    topicPreferences,
    isArticleExcluded,
    selectedTopicFilter,
    setSelectedTopicFilter,
    t,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<NewsCategory | 'All'>('All');
  const [selectedRegion, setSelectedRegion] = useState<Region | 'All'>('All');
  const [selectedTime, setSelectedTime] = useState<TimeFilter>('all');
  const [selectedPerspective, setSelectedPerspective] = useState<string>('all');

  const topicOptions: { id: TopicInterest | 'all'; label: string }[] = [
    { id: 'all', label: language === 'fr' ? 'Tous les sujets' : 'All Topics' },
    { id: 'ai-advanced-tech', label: language === 'fr' ? 'IA & Tech Avancée' : 'AI & Advanced Tech' },
    { id: 'china-tech', label: language === 'fr' ? 'Tech Chine' : 'China Tech' },
    { id: 'science', label: language === 'fr' ? 'Sciences & Découvertes' : 'Science & Discoveries' },
    { id: 'renewable-energy', label: language === 'fr' ? 'Énergies Renouvelables' : 'Renewable Energy' },
    { id: 'economy', label: language === 'fr' ? 'Économie Mondiale' : 'Global Economy' },
    { id: 'agriculture', label: language === 'fr' ? 'Agriculture & Alimentation' : 'Agriculture & Food' },
    { id: 'geopolitics', label: language === 'fr' ? 'Géopolitique' : 'Geopolitics' },
    { id: 'politics', label: language === 'fr' ? 'Politique' : 'Politics' },
  ];

  // Filter logic: strictly exclude unwanted categories (sports/entertainment) across the whole stream
  const filteredArticles = useMemo(() => {
    // 1. Exclude any stories matching user's excluded topics
    let result = articles.filter((a) => !isArticleExcluded(a));

    // 2. Filter by selected Topic Interest
    if (selectedTopicFilter !== 'all') {
      result = result.filter(
        (a) => (a.topicInterest || classifyArticleTopic(a.title, a.summary, a.category, a.countryCode)) === selectedTopicFilter
      );
    }

    // 3. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.summary && a.summary.toLowerCase().includes(q)) ||
          a.publisher.toLowerCase().includes(q) ||
          (a.countryName && a.countryName.toLowerCase().includes(q))
      );
    }

    // 4. Category
    if (selectedCategory !== 'All') {
      result = result.filter((a) => a.category === selectedCategory);
    }

    // 5. Region
    if (selectedRegion !== 'All') {
      result = result.filter((a) => a.region === selectedRegion);
    }

    // 6. Perspective
    if (selectedPerspective !== 'all') {
      result = result.filter((a) => a.politicalPerspective === selectedPerspective);
    }

    // 7. Time filter
    if (selectedTime !== 'all') {
      const now = Date.now();
      const cutoffHours = selectedTime === '24h' ? 24 : selectedTime === '3d' ? 72 : 168;
      const cutoffMs = cutoffHours * 60 * 60 * 1000;
      result = result.filter((a) => {
        const pub = new Date(a.pubDate).getTime();
        return now - pub <= cutoffMs;
      });
    }

    return result;
  }, [
    articles,
    isArticleExcluded,
    selectedTopicFilter,
    searchQuery,
    selectedCategory,
    selectedRegion,
    selectedPerspective,
    selectedTime,
  ]);

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Header & Filter Bar */}
      <div className="bg-white dark:bg-stone-900/80 rounded-xl border border-stone-200/90 dark:border-stone-800 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
          <div>
            <h1 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-50">
              {language === 'fr' ? 'Le Fil d’Actualités Mondial' : 'Global News Stream'}
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              {filteredArticles.length} {language === 'fr' ? 'articles disponibles' : 'dispatches found'}
            </p>
          </div>

          {/* Time Filter Segmented Control */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500 font-medium">
              <Calendar className="w-3.5 h-3.5 inline mr-1 text-stone-400" />
              {language === 'fr' ? 'Période' : 'Timeframe'}:
            </span>
            <div className="flex items-center p-0.5 bg-stone-100 dark:bg-stone-800 rounded-md border border-stone-200 dark:border-stone-700 text-xs">
              {(['24h', '3d', '7d', 'all'] as TimeFilter[]).map((time) => (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={`px-2 py-1 rounded font-medium transition-colors cursor-pointer ${
                    selectedTime === time
                      ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  {time === 'all' ? (language === 'fr' ? 'Tout' : 'All') : time}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Topic Discovery Bar */}
        <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-xs">
          {topicOptions.map((topic) => {
            const isActive = selectedTopicFilter === topic.id;
            return (
              <button
                key={topic.id}
                onClick={() => setSelectedTopicFilter(topic.id)}
                className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-semibold shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                {topic.label}
              </button>
            );
          })}
        </div>

        {/* Region & Perspective secondary filters */}
        <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-stone-500 font-medium">
              <Globe2 className="w-3.5 h-3.5 inline mr-1 text-stone-400" />
              {language === 'fr' ? 'Région' : 'Region'}:
            </span>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value as Region | 'All')}
              className="bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded px-2 py-1 text-stone-800 dark:text-stone-200 focus:outline-hidden"
            >
              <option value="All">{t.regions.All}</option>
              {REGIONS_LIST.map((r) => (
                <option key={r} value={r}>
                  {t.regions[r] || r}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-stone-500 font-medium">
              <SlidersHorizontal className="w-3.5 h-3.5 inline mr-1 text-stone-400" />
              {language === 'fr' ? 'Orientation' : 'Perspective'}:
            </span>
            <select
              value={selectedPerspective}
              onChange={(e) => setSelectedPerspective(e.target.value)}
              className="bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded px-2 py-1 text-stone-800 dark:text-stone-200 focus:outline-hidden"
            >
              <option value="all">{language === 'fr' ? 'Toutes orientations' : 'All perspectives'}</option>
              <option value="Left-leaning">{t.perspectives['Left-leaning']}</option>
              <option value="Center-left">{t.perspectives['Center-left']}</option>
              <option value="Center">{t.perspectives['Center']}</option>
              <option value="Center-right">{t.perspectives['Center-right']}</option>
              <option value="Right-leaning">{t.perspectives['Right-leaning']}</option>
            </select>
          </div>

          {(selectedCategory !== 'All' || selectedRegion !== 'All' || selectedTime !== 'all' || selectedPerspective !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedRegion('All');
                setSelectedTime('all');
                setSelectedPerspective('all');
                setSearchQuery('');
              }}
              className="text-amber-700 dark:text-amber-400 hover:underline font-medium text-xs ml-auto cursor-pointer"
            >
              {language === 'fr' ? 'Réinitialiser les filtres' : 'Reset filters'}
            </button>
          )}
        </div>
      </div>

      {/* 2. Articles Grid */}
      {filteredArticles.length === 0 ? (
        <div className="bg-white dark:bg-stone-900 rounded-xl p-12 text-center border border-stone-200 dark:border-stone-800">
          <p className="font-serif text-lg font-bold text-stone-700 dark:text-stone-300">
            {language === 'fr'
              ? 'Aucun article ne correspond à vos filtres actuels.'
              : 'No articles match your current filter selections.'}
          </p>
          <p className="text-xs text-stone-500 mt-2">
            {language === 'fr'
              ? 'Essayez d’élargir vos filtres de temps ou de sélectionner une autre région.'
              : 'Try broadening your timeframe or clearing subject filters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredArticles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
};
