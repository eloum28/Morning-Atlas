import React, { useState, useEffect, useCallback } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { MorningBrief } from './components/MorningBrief';
import { WorldView } from './components/WorldView';
import { InteractiveMap } from './components/InteractiveMap';
import { CountryPage } from './components/CountryPage';
import { MyWorld } from './components/MyWorld';
import { CompareCoverageModal } from './components/CompareCoverageModal';
import { SettingsModal } from './components/SettingsModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ChinaTechSection } from './components/ChinaTechSection';
import { fetchGlobalNews } from './services/newsService';
import { NewsArticle } from './types';
import { COUNTRIES } from './data/countries';
import { Globe, BookOpen, Compass, Shield, ArrowUp } from 'lucide-react';

const MainContent: React.FC = () => {
  const {
    language,
    activeTab,
    setActiveTab,
    selectCountry,
    t,
  } = useApp();

  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [articlesByRegion, setArticlesByRegion] = useState<Record<any, NewsArticle[]> | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load global news
  const loadNews = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const data = await fetchGlobalNews({ lang: language, refresh });
      setArticles(data.articles || []);
      if (data.articlesByRegion) {
        setArticlesByRegion(data.articlesByRegion);
      }
    } catch (err: unknown) {
      console.error('Error fetching global news:', err);
      setError(err instanceof Error ? err.message : 'Error fetching news');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [language]);

  useEffect(() => {
    loadNews(false);
  }, [loadNews]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F5] text-[#1C1917] dark:bg-[#0B0F17] dark:text-[#F3F4F6] transition-colors">
      {/* 1. Header with 3-Zone Contract & Editorial Sub-bar */}
      <Header
        onRefresh={() => loadNews(true)}
        isRefreshing={isRefreshing}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* 2. Main Content Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between">
            <div>
              <strong className="font-semibold block mb-0.5">{t.status.errorTitle}</strong>
              <span>{t.status.errorDescription}</span>
            </div>
            <button
              onClick={() => loadNews(true)}
              className="px-3 py-1 bg-amber-900 text-white dark:bg-amber-100 dark:text-amber-900 rounded font-medium ml-4 shrink-0 cursor-pointer"
            >
              {t.status.retry}
            </button>
          </div>
        )}

        {/* Tab Routing */}
        {activeTab === 'morning-brief' && (
          <MorningBrief
            articles={articles}
            articlesByRegion={articlesByRegion}
            isLoading={isLoading}
          />
        )}
        {activeTab === 'world' && (
          <WorldView articles={articles} isLoading={isLoading} />
        )}
        {activeTab === 'china-tech' && <ChinaTechSection />}
        {activeTab === 'map' && <InteractiveMap />}
        {activeTab === 'country' && <CountryPage />}
        {(activeTab === 'my-world' || activeTab === 'saved') && <MyWorld />}
      </main>

      {/* 3. Editorial Broadsheet Footer */}
      <footer className="w-full bg-white dark:bg-stone-900/90 border-t border-stone-200 dark:border-stone-800 text-xs text-stone-500 dark:text-stone-400 mt-16 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-stone-200 dark:border-stone-800">
            {/* Col 1: Wordmark & Philosophy */}
            <div className="md:col-span-1 space-y-2">
              <span className="font-serif text-xl font-bold text-stone-900 dark:text-white">
                Morning Atlas
              </span>
              <p className="text-xs leading-relaxed text-stone-600 dark:text-stone-400">
                {language === 'fr'
                  ? 'Votre fenêtre quotidienne sur l’actualité internationale. Un journalisme mondial équilibré, affranchi des prismes uniques.'
                  : 'Your daily window to world events. Balanced international journalism representing every continent, free from single-region dominance.'}
              </p>
            </div>

            {/* Col 2: Geographic Hubs */}
            <div>
              <h4 className="font-serif font-bold text-stone-900 dark:text-stone-100 mb-3 uppercase tracking-wider text-[11px]">
                {language === 'fr' ? 'Grands Foyers Géographiques' : 'Geographic Regions'}
              </h4>
              <ul className="space-y-1.5 text-xs">
                <li>
                  <button onClick={() => selectCountry('SN')} className="hover:underline cursor-pointer">
                    🇸🇳 Sénégal (West Africa)
                  </button>
                </li>
                <li>
                  <button onClick={() => selectCountry('FR')} className="hover:underline cursor-pointer">
                    🇫🇷 France (Europe)
                  </button>
                </li>
                <li>
                  <button onClick={() => selectCountry('KR')} className="hover:underline cursor-pointer">
                    🇰🇷 South Korea (East Asia)
                  </button>
                </li>
                <li>
                  <button onClick={() => selectCountry('MA')} className="hover:underline cursor-pointer">
                    🇲🇦 Morocco (North Africa & Middle East)
                  </button>
                </li>
                <li>
                  <button onClick={() => selectCountry('US')} className="hover:underline cursor-pointer">
                    🇺🇸 United States (North America)
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Media Integrity & Standards */}
            <div>
              <h4 className="font-serif font-bold text-stone-900 dark:text-stone-100 mb-3 uppercase tracking-wider text-[11px]">
                {language === 'fr' ? 'Déontologie et Méthodologie' : 'Methodology & Standards'}
              </h4>
              <p className="text-[11px] leading-relaxed text-stone-500">
                {language === 'fr'
                  ? 'Les dépêches sont agrégées auprès d’agences de presse et de quotidiens authentiques. Les évaluations d’orientation éditoriale proviennent d’observatoires publics (AllSides, Ad Fontes Media).'
                  : 'Dispatches are retrieved from verified news organizations. Editorial orientation classifications cite established public registries (AllSides, Ad Fontes Media).'}
              </p>
            </div>

            {/* Col 4: Quick Navigation & Top */}
            <div>
              <h4 className="font-serif font-bold text-stone-900 dark:text-stone-100 mb-3 uppercase tracking-wider text-[11px]">
                {language === 'fr' ? 'Navigation' : 'Quick Navigation'}
              </h4>
              <div className="flex flex-col gap-2 text-xs">
                <button
                  onClick={() => { setActiveTab('morning-brief'); scrollToTop(); }}
                  className="text-left hover:underline cursor-pointer"
                >
                  {t.nav.morningBrief}
                </button>
                <button
                  onClick={() => { setActiveTab('map'); scrollToTop(); }}
                  className="text-left hover:underline cursor-pointer"
                >
                  {t.nav.map}
                </button>
                <button
                  onClick={() => { setActiveTab('my-world'); scrollToTop(); }}
                  className="text-left hover:underline cursor-pointer"
                >
                  {t.nav.myWorld}
                </button>
                <button
                  onClick={scrollToTop}
                  className="inline-flex items-center gap-1 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white mt-2 cursor-pointer font-medium"
                >
                  <span>{language === 'fr' ? 'Haut de page' : 'Back to top'}</span>
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-stone-400">
            <p>© {new Date().getFullYear()} Morning Atlas. All original rights belong to respective publishers.</p>
            <p className="italic">EN | FR Bilingual International Edition</p>
          </div>
        </div>
      </footer>

      {/* 4. Global Modals and Indicators */}
      <CompareCoverageModal />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <OfflineIndicator />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
