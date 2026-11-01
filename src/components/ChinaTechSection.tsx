import React, { useState, useEffect, useMemo } from 'react';
import {
  Cpu,
  Sparkles,
  Zap,
  Bot,
  Rocket,
  ShieldCheck,
  RefreshCw,
  Search,
  Languages,
  ExternalLink,
  Volume2,
  Building2,
  Bookmark,
  Share2,
} from 'lucide-react';
import { NewsArticle } from '../types';
import { fetchChinaTechNews } from '../services/newsService';
import { ArticleCard } from './ArticleCard';
import { useApp } from '../context/AppContext';

export const ChinaTechSection: React.FC = () => {
  const { language, t, playArticlesAudio } = useApp();

  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedSubtopic, setSelectedSubtopic] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOwnership, setSelectedOwnership] = useState<string>('all');

  const subtopics = useMemo(() => [
    { id: 'all', label: t.chinaTech.allSubtopics, icon: Sparkles },
    { id: 'ai', label: t.chinaTech.ai, icon: Cpu },
    { id: 'semiconductor', label: t.chinaTech.semiconductors, icon: Cpu },
    { id: 'battery', label: t.chinaTech.evBatteries, icon: Zap },
    { id: 'robotics', label: t.chinaTech.robotics, icon: Bot },
    { id: 'space', label: t.chinaTech.aerospaceSpace, icon: Rocket },
    { id: 'solar', label: t.chinaTech.greenTech, icon: Zap },
  ], [t]);

  const loadChinaTech = async (forceRefresh = false) => {
    if (forceRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const data = await fetchChinaTechNews(language, forceRefresh);
      setArticles(data.articles || []);
    } catch (err) {
      console.error('Failed to load China tech news:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadChinaTech(false);
  }, [language]);

  // Subtopic & Search Filtering
  const filteredArticles = useMemo(() => {
    let result = articles;

    if (selectedSubtopic !== 'all') {
      const q = selectedSubtopic.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.summary && a.summary.toLowerCase().includes(q))
      );
    }

    if (selectedOwnership !== 'all') {
      if (selectedOwnership === 'state-owned') {
        result = result.filter((a) => a.ownership === 'State-Owned');
      } else if (selectedOwnership === 'private') {
        result = result.filter((a) => a.ownership === 'Private' || a.ownershipCategory === 'commercial' || a.ownershipCategory === 'private');
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.summary && a.summary.toLowerCase().includes(q)) ||
          a.publisher.toLowerCase().includes(q)
      );
    }

    return result;
  }, [articles, selectedSubtopic, selectedOwnership, searchQuery]);

  // Lead Story
  const leadArticle = filteredArticles[0];
  const gridArticles = filteredArticles.slice(1);

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Hero Header Banner */}
      <div className="bg-white dark:bg-stone-900/80 rounded-xl border border-stone-200/90 dark:border-stone-800 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-stone-200 dark:border-stone-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest font-bold rounded bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-900/50">
                {language === 'fr' ? 'Dossier Spécial' : 'Special Priority Coverage'}
              </span>
              <span className="text-xs text-stone-500 font-medium">
                {language === 'fr' ? 'Rédactions chinoises & internationales' : 'Verified Domestic & Global Correspondents'}
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 dark:text-stone-50 tracking-tight">
              {t.chinaTech.title}
            </h1>
            <p className="text-stone-600 dark:text-stone-300 text-sm max-w-2xl leading-relaxed mt-1">
              {t.chinaTech.subtitle}
            </p>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex items-center gap-2.5 shrink-0">
            {filteredArticles.length > 0 && (
              <button
                onClick={() => playArticlesAudio(filteredArticles.slice(0, 10))}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-md text-xs font-semibold hover:bg-stone-800 dark:hover:bg-white transition cursor-pointer shadow-xs"
              >
                <Volume2 className="w-3.5 h-3.5 fill-current" />
                <span>{language === 'fr' ? 'Écouter ce dossier' : 'Listen to Brief'}</span>
              </button>
            )}

            <button
              onClick={() => loadChinaTech(true)}
              disabled={isRefreshing}
              className="p-2 border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 rounded-md text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 2. Subtopics Navigation Filter */}
        <div className="mt-5 flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-xs">
          {subtopics.map((sub) => {
            const Icon = sub.icon;
            const isActive = selectedSubtopic === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => setSelectedSubtopic(sub.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-semibold shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{sub.label}</span>
              </button>
            );
          })}
        </div>

        {/* 3. Ownership Category Filter & Search Bar */}
        <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-stone-500 font-medium">
              <Building2 className="w-3.5 h-3.5 inline mr-1 text-stone-400" />
              {language === 'fr' ? 'Propriété du média :' : 'Media Ownership:'}
            </span>
            <div className="flex items-center p-0.5 bg-stone-100 dark:bg-stone-800 rounded-md border border-stone-200 dark:border-stone-700 text-xs">
              <button
                onClick={() => setSelectedOwnership('all')}
                className={`px-2 py-1 rounded font-medium transition ${
                  selectedOwnership === 'all'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs font-semibold'
                    : 'text-stone-600 dark:text-stone-400'
                }`}
              >
                {language === 'fr' ? 'Tous' : 'All'}
              </button>
              <button
                onClick={() => setSelectedOwnership('private')}
                className={`px-2 py-1 rounded font-medium transition ${
                  selectedOwnership === 'private'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs font-semibold'
                    : 'text-stone-600 dark:text-stone-400'
                }`}
                title="Caixin, SCMP, Yicai, 36Kr"
              >
                {language === 'fr' ? 'Privé / Indépendant' : 'Private / Commercial'}
              </button>
              <button
                onClick={() => setSelectedOwnership('state-owned')}
                className={`px-2 py-1 rounded font-medium transition ${
                  selectedOwnership === 'state-owned'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs font-semibold'
                    : 'text-stone-600 dark:text-stone-400'
                }`}
                title="Xinhua, China Daily, Science & Tech Daily"
              >
                {language === 'fr' ? 'Média public d’État' : 'State-Owned'}
              </button>
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'fr' ? 'Rechercher puces, IA, BYD...' : 'Search chips, AI, BYD, CATL...'}
              className="w-full pl-8 pr-3 py-1.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-md text-xs placeholder-stone-400 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 border-2 border-stone-300 dark:border-stone-700 border-t-red-600 rounded-full animate-spin mb-4" />
          <h2 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100 mb-1">
            {language === 'fr' ? 'Chargement des dépêches technologiques chinoises...' : 'Retrieving verified China technology reports...'}
          </h2>
          <p className="text-xs text-stone-500 max-w-md">
            Caixin · SCMP · China Daily · Science & Technology Daily · Yicai · Xinhua
          </p>
        </div>
      )}

      {/* Main Articles Stream */}
      {!isLoading && (
        <div className="space-y-8">
          {leadArticle && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-red-600" />
                <h2 className="text-xs font-mono uppercase tracking-widest text-stone-500 font-semibold">
                  {language === 'fr' ? 'À la une technologique' : 'Featured Technology Dispatch'}
                </h2>
              </div>
              <ArticleCard article={leadArticle} isLead={true} />
            </div>
          )}

          {gridArticles.length > 0 && (
            <div>
              <h3 className="text-xs font-mono uppercase tracking-widest text-stone-500 font-semibold mb-4">
                {language === 'fr' ? 'Dépêches et analyses sectorielles' : 'Sector Breakthroughs & Reports'} ({gridArticles.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {gridArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            </div>
          )}

          {filteredArticles.length === 0 && (
            <div className="p-12 text-center bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">
              <p className="text-sm text-stone-600 dark:text-stone-300 font-medium">
                {language === 'fr'
                  ? 'Aucun article ne correspond à votre filtre actuel.'
                  : 'No technology reports found matching your current subtopic filter.'}
              </p>
              <button
                onClick={() => {
                  setSelectedSubtopic('all');
                  setSelectedOwnership('all');
                  setSearchQuery('');
                }}
                className="mt-3 px-3 py-1.5 text-xs font-semibold text-stone-800 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 rounded-md hover:bg-stone-200 dark:hover:bg-stone-700 transition"
              >
                {language === 'fr' ? 'Réinitialiser les filtres' : 'Reset Filters'}
              </button>
            </div>
          )}

          {/* Editorial Methodology & Sources Disclosure */}
          <div className="p-4 rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-stone-50 dark:bg-stone-900/40 text-xs text-stone-500 leading-relaxed">
            <span className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
              {language === 'fr' ? 'Méthodologie et transparence éditoriale' : 'Editorial Sources & Ownership Transparency'}
            </span>
            <p>{t.chinaTech.disclaimer}</p>
          </div>
        </div>
      )}
    </div>
  );
};
