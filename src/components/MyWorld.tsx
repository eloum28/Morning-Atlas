import React, { useState } from 'react';
import {
  Star,
  Plus,
  Trash2,
  Bookmark,
  ExternalLink,
  History,
  Download,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { COUNTRIES, getCountryByCode } from '../data/countries';
import { ArticleCard } from './ArticleCard';
import { useApp } from '../context/AppContext';

export const MyWorld: React.FC = () => {
  const {
    language,
    favorites,
    toggleFavoriteCountry,
    savedArticles,
    removeSavedArticle,
    selectCountry,
    t,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'favorites' | 'saved' | 'history'>('favorites');
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchNewCountry, setSearchNewCountry] = useState('');

  // Countries available to add
  const availableToAdd = COUNTRIES.filter((c) => !favorites.includes(c.code));
  const filteredAvailable = availableToAdd.filter((c) => {
    const q = searchNewCountry.toLowerCase().trim();
    if (!q) return true;
    return (
      c.nameEn.toLowerCase().includes(q) ||
      c.nameFr.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.capital.toLowerCase().includes(q)
    );
  });

  const exportSavedArticles = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(savedArticles, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `morning_atlas_saved_articles_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Header & Navigation Tabs */}
      <div className="bg-white dark:bg-stone-900/80 rounded-xl border border-stone-200/90 dark:border-stone-800 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-50">
              {t.myWorld.title}
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1">
              {t.myWorld.subtitle}
            </p>
          </div>

          {/* Sub-tabs: Favorites / Saved / History */}
          <div className="flex items-center p-1 bg-stone-100 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 text-xs font-medium">
            <button
              onClick={() => setActiveSubTab('favorites')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeSubTab === 'favorites'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              <span>{t.myWorld.favorites} ({favorites.length})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('saved')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeSubTab === 'saved'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{t.myWorld.savedArticles} ({savedArticles.length})</span>
            </button>
          </div>
        </div>

        {/* 2. Sub-Tab: Favorite Countries */}
        {activeSubTab === 'favorites' && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                {language === 'fr' ? 'Vos Pays Sélectionnés' : 'Curated Nations'}
              </span>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-md text-xs font-medium hover:bg-stone-800 dark:hover:bg-white transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.myWorld.addFavorite}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {favorites.map((code) => {
                const country = getCountryByCode(code);
                if (!country) return null;
                const name = language === 'fr' ? country.nameFr : country.nameEn;

                return (
                  <div
                    key={country.code}
                    className="bg-stone-50 dark:bg-stone-800/60 rounded-lg border border-stone-200/80 dark:border-stone-700/80 p-4 flex flex-col justify-between hover:border-stone-400 dark:hover:border-stone-600 transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <span className="text-3xl">{country.flag}</span>
                        <button
                          onClick={() => toggleFavoriteCountry(country.code)}
                          className="text-stone-400 hover:text-red-500 p-1"
                          title={t.myWorld.removeFavorite}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-white mt-2">
                        {name}
                      </h3>
                      <p className="text-xs text-stone-500">
                        {country.capital} · {country.region}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-200/60 dark:border-stone-700/60">
                      <button
                        onClick={() => selectCountry(country.code)}
                        className="inline-flex items-center justify-between w-full py-1.5 text-xs font-semibold text-stone-800 dark:text-stone-200 hover:text-amber-700 dark:hover:text-amber-400 transition-colors cursor-pointer"
                      >
                        <span>{t.actions.viewAllCountryNews}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Sub-Tab: Saved Articles */}
        {activeSubTab === 'saved' && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                {savedArticles.length} {language === 'fr' ? 'articles sauvegardés' : 'saved dispatches'}
              </span>
              {savedArticles.length > 0 && (
                <button
                  onClick={exportSavedArticles}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 dark:text-stone-300 hover:underline cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export JSON</span>
                </button>
              )}
            </div>

            {savedArticles.length === 0 ? (
              <div className="py-12 text-center text-stone-500 text-sm">
                <Bookmark className="w-8 h-8 mx-auto text-stone-300 dark:text-stone-700 mb-2" />
                <p>{t.myWorld.noSaved}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Country Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl dark:bg-stone-900 border border-stone-200 dark:border-stone-800 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-white">
                {t.myWorld.addFavorite}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-stone-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="my-3">
              <input
                type="text"
                value={searchNewCountry}
                onChange={(e) => setSearchNewCountry(e.target.value)}
                placeholder={language === 'fr' ? 'Rechercher parmi les 195 pays...' : 'Search from 195 nations...'}
                className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-md focus:outline-hidden"
              />
            </div>

            <div className="overflow-y-auto flex-1 space-y-1.5 pr-1 divide-y divide-stone-100 dark:divide-stone-800">
              {filteredAvailable.slice(0, 30).map((c) => (
                <div
                  key={c.code}
                  className="pt-1.5 flex items-center justify-between py-1 px-2 rounded hover:bg-stone-50 dark:hover:bg-stone-800 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{c.flag}</span>
                    <span className="font-medium text-stone-800 dark:text-stone-200">
                      {language === 'fr' ? c.nameFr : c.nameEn}
                    </span>
                    <span className="text-stone-400 text-[11px]">({c.region})</span>
                  </div>
                  <button
                    onClick={() => {
                      toggleFavoriteCountry(c.code);
                      setShowAddModal(false);
                    }}
                    className="px-2.5 py-1 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded font-semibold text-[11px] hover:bg-stone-800 transition cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
