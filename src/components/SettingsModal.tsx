import React from 'react';
import {
  X,
  Globe,
  Moon,
  Sun,
  Clock,
  Trash2,
  Download,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PWAInstallButton } from './PWAInstallButton';

export const SettingsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const {
    language,
    setLanguage,
    theme,
    toggleTheme,
    readingMode,
    setReadingMode,
    topicPreferences,
    setTopicPreference,
    restoreDefaultTopicPreferences,
    t,
  } = useApp();

  if (!isOpen) return null;

  const handleClearAllData = () => {
    if (
      window.confirm(
        language === 'fr'
          ? 'Voulez-vous réinitialiser vos favoris et vos marque-pages locaux ?'
          : 'Do you want to reset your local bookmarks and preferences?'
      )
    ) {
      try {
        localStorage.removeItem('morning_atlas_saved_articles');
        localStorage.removeItem('morning_atlas_read_ids');
        window.location.reload();
      } catch {
        // ignore
      }
    }
  };

  const priorityOptions: { value: TopicPriority; label: string; color: string }[] = [
    {
      value: 'very-high',
      label: t.interests.priorities['very-high'],
      color: 'text-amber-700 dark:text-amber-400 font-semibold',
    },
    {
      value: 'high',
      label: t.interests.priorities.high,
      color: 'text-blue-700 dark:text-blue-400 font-medium',
    },
    {
      value: 'normal',
      label: t.interests.priorities.normal,
      color: 'text-stone-700 dark:text-stone-300',
    },
    {
      value: 'low',
      label: t.interests.priorities.low,
      color: 'text-stone-500 dark:text-stone-400',
    },
    {
      value: 'excluded',
      label: t.interests.priorities.excluded,
      color: 'text-red-600 dark:text-red-400 font-semibold',
    },
  ];

  const topicsList: TopicInterest[] = [
    'geopolitics',
    'politics',
    'ai-advanced-tech',
    'china-tech',
    'economy',
    'science',
    'renewable-energy',
    'agriculture',
    'sports',
    'entertainment',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-serif text-xl font-bold text-stone-900 dark:text-stone-50">
              {t.nav.settings}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              {language === 'fr' ? 'Personnalisez votre expérience de lecture' : 'Customize your morning reading experience'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-6 space-y-6 text-xs text-stone-700 dark:text-stone-300 overflow-y-auto">
          {/* SECTION: My News Interests / Mes centres d'intérêt */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-200 dark:border-stone-800">
              <div>
                <span className="font-serif text-base font-bold text-stone-900 dark:text-stone-100 block">
                  {t.interests.title}
                </span>
                <span className="text-stone-500 text-[11px] block mt-0.5 max-w-md">
                  {t.interests.subtitle}
                </span>
              </div>
              <button
                onClick={restoreDefaultTopicPreferences}
                className="self-start sm:self-auto px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50 rounded-md transition cursor-pointer"
              >
                {t.interests.restoreDefaults}
              </button>
            </div>

            <div className="space-y-2.5 divide-y divide-stone-100 dark:divide-stone-800/60">
              {topicsList.map((topic) => {
                const topicInfo = t.interests.topics[topic];
                const currentPriority = topicPreferences[topic] || 'normal';
                const isExcluded = currentPriority === 'excluded';
                const isVeryHigh = currentPriority === 'very-high';

                return (
                  <div
                    key={topic}
                    className={`pt-2.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 rounded-lg transition-colors ${
                      isExcluded
                        ? 'bg-red-50/50 dark:bg-red-950/15 border border-red-100 dark:border-red-950/30'
                        : isVeryHigh
                        ? 'bg-amber-50/40 dark:bg-amber-950/15 border border-amber-100/60 dark:border-amber-950/30'
                        : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-900 dark:text-stone-100 text-xs">
                          {topicInfo.title}
                        </span>
                        {isExcluded && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                            {t.interests.priorities.excluded}
                          </span>
                        )}
                        {isVeryHigh && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                            {language === 'fr' ? 'Priorité maximale' : 'Very High'}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-2">
                        {topicInfo.desc}
                      </p>
                    </div>

                    <div className="shrink-0 self-end sm:self-center">
                      <select
                        value={currentPriority}
                        onChange={(e) => setTopicPreference(topic, e.target.value as TopicPriority)}
                        className={`text-xs rounded-md px-2.5 py-1.5 border font-medium focus:outline-hidden cursor-pointer ${
                          isExcluded
                            ? 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800'
                            : isVeryHigh
                            ? 'bg-amber-50 dark:bg-stone-800 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-700/60'
                            : 'bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700'
                        }`}
                      >
                        {priorityOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 1. Language */}
          <div className="flex items-center justify-between pt-4 border-t border-stone-200 dark:border-stone-800">
            <div>
              <span className="font-semibold text-stone-900 dark:text-stone-100 block text-sm">
                {language === 'fr' ? 'Langue de l’interface' : 'Interface Language'}
              </span>
              <span className="text-stone-500 text-[11px]">
                {language === 'fr' ? 'Anglais ou français pour toute la navigation' : 'English or French for complete interface navigation'}
              </span>
            </div>
            <div className="flex items-center bg-stone-100 dark:bg-stone-800 rounded-lg p-0.5 border border-stone-200 dark:border-stone-700 font-semibold">
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 rounded transition ${
                  language === 'en'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                    : 'text-stone-500'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage('fr')}
                className={`px-3 py-1.5 rounded transition ${
                  language === 'fr'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                    : 'text-stone-500'
                }`}
              >
                Français
              </button>
            </div>
          </div>

          {/* 2. Theme */}
          <div className="flex items-center justify-between pt-4 border-t border-stone-100 dark:border-stone-800">
            <div>
              <span className="font-semibold text-stone-900 dark:text-stone-100 block text-sm">
                {language === 'fr' ? 'Apparence et Thème' : 'Appearance Theme'}
              </span>
              <span className="text-stone-500 text-[11px]">
                {language === 'fr' ? 'Papier journal clair ou ardoise de nuit' : 'Editorial parchment light mode or deep dark slate'}
              </span>
            </div>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-medium cursor-pointer"
            >
              {theme === 'dark' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
              <span>{theme === 'dark' ? (language === 'fr' ? 'Mode Sombre' : 'Dark Mode') : (language === 'fr' ? 'Mode Clair' : 'Light Mode')}</span>
            </button>
          </div>

          {/* 3. Default Reading Mode */}
          <div className="flex items-center justify-between pt-4 border-t border-stone-100 dark:border-stone-800">
            <div>
              <span className="font-semibold text-stone-900 dark:text-stone-100 block text-sm">
                {language === 'fr' ? 'Format du Point Quotidien' : 'Default Briefing Format'}
              </span>
              <span className="text-stone-500 text-[11px]">
                {language === 'fr' ? 'Sélectionnez le niveau de synthèse matinal' : 'Choose your morning reading duration'}
              </span>
            </div>
            <select
              value={readingMode}
              onChange={(e) => setReadingMode(e.target.value as any)}
              className="bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-md px-2.5 py-1.5 font-medium focus:outline-hidden"
            >
              <option value="quick">{t.briefing.quick}</option>
              <option value="standard">{t.briefing.standard}</option>
              <option value="deep">{t.briefing.deep}</option>
            </select>
          </div>

          {/* 4. Install App */}
          <div className="flex items-center justify-between pt-4 border-t border-stone-100 dark:border-stone-800">
            <div>
              <span className="font-semibold text-stone-900 dark:text-stone-100 block text-sm">
                {language === 'fr' ? 'Application Web Progressive (PWA)' : 'Progressive Web App (PWA)'}
              </span>
              <span className="text-stone-500 text-[11px]">
                {language === 'fr' ? 'Installer sur votre téléphone ou bureau' : 'Install directly to your home screen or desktop'}
              </span>
            </div>
            <PWAInstallButton />
          </div>

          {/* 5. Clear Local Storage */}
          <div className="flex items-center justify-between pt-4 border-t border-stone-100 dark:border-stone-800">
            <div>
              <span className="font-semibold text-red-600 dark:text-red-400 block text-sm">
                {language === 'fr' ? 'Données Locales' : 'Local Storage'}
              </span>
              <span className="text-stone-500 text-[11px]">
                {language === 'fr' ? 'Effacer les marque-pages et l’historique de lecture' : 'Clear all cached bookmarks and reading history'}
              </span>
            </div>
            <button
              onClick={handleClearAllData}
              className="px-3 py-1.5 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md font-medium transition cursor-pointer"
            >
              Reset Data
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-md text-xs font-semibold hover:bg-stone-800 dark:hover:bg-white transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
