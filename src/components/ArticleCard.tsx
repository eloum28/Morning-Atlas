import React, { useState } from 'react';
import {
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Scale,
  Languages,
  Clock,
  MapPin,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { NewsArticle } from '../types';
import { useApp } from '../context/AppContext';
import { getTranslateUrl, translateArticle } from '../services/newsService';

interface ArticleCardProps {
  article: NewsArticle;
  featured?: boolean;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article, featured = false }) => {
  const {
    language,
    saveArticle,
    removeSavedArticle,
    isArticleSaved,
    markArticleAsRead,
    openCompareModal,
    selectCountry,
    t,
  } = useApp();

  const isSaved = isArticleSaved(article.id);

  // In-card translation state
  const [translatedTitle, setTranslatedTitle] = useState<string | null>(null);
  const [translatedSummary, setTranslatedSummary] = useState<string | null>(null);
  const [translatedTargetLang, setTranslatedTargetLang] = useState<'en' | 'fr' | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslated, setShowTranslated] = useState(false);
  const [showTranslateMenu, setShowTranslateMenu] = useState(false);

  // Format relative or clean date
  const formatTimeAgo = (dateStr: string) => {
    try {
      const pub = new Date(dateStr);
      const diffMs = Date.now() - pub.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 60) {
        return language === 'fr' ? `il y a ${Math.max(1, diffMins)}m` : `${Math.max(1, diffMins)}m ago`;
      }
      if (diffHours < 24) {
        return language === 'fr' ? `il y a ${diffHours}h` : `${diffHours}h ago`;
      }
      if (diffDays === 1) {
        return language === 'fr' ? 'hier' : 'yesterday';
      }
      return pub.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const handleLinkClick = () => {
    markArticleAsRead(article.id);
  };

  const handleInAppTranslate = async (targetLang: 'en' | 'fr') => {
    setShowTranslateMenu(false);
    if (translatedTargetLang === targetLang && translatedTitle) {
      setShowTranslated(true);
      return;
    }

    setIsTranslating(true);
    try {
      const res = await translateArticle(article.title, article.summary, targetLang);
      if (res && res.translatedTitle) {
        setTranslatedTitle(res.translatedTitle);
        setTranslatedSummary(res.translatedSummary || null);
        setTranslatedTargetLang(targetLang);
        setShowTranslated(true);
      }
    } catch {
      // Fallback to opening Google Translate in new tab
      const url = getTranslateUrl(article.link, targetLang);
      window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleShowOriginal = () => {
    setShowTranslated(false);
  };

  const currentTitle = showTranslated && translatedTitle ? translatedTitle : article.title;
  const currentSummary = showTranslated && translatedSummary !== null ? translatedSummary : article.summary;

  return (
    <article
      className={`group flex flex-col justify-between bg-white dark:bg-stone-900/90 rounded-lg border border-stone-200/90 dark:border-stone-800 p-5 transition-all duration-200 hover:border-stone-400 dark:hover:border-stone-700 hover:shadow-xs ${
        featured ? 'lg:col-span-2 bg-[#FDFCFA] dark:bg-stone-900' : ''
      }`}
    >
      <div>
        {/* Unboxed Metadata Strip (Zero-Pill Rule) */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-500 dark:text-stone-400 mb-2.5">
          {/* Translation Status Badge */}
          {showTranslated && translatedTargetLang && (
            <>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400 text-[11px]">
                <Sparkles className="w-3 h-3" />
                <span>
                  {language === 'fr'
                    ? `[Traduit en ${translatedTargetLang === 'fr' ? 'français' : 'anglais'}]`
                    : `[Translated to ${translatedTargetLang === 'fr' ? 'French' : 'English'}]`}
                </span>
              </span>
              <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">·</span>
            </>
          )}

          {/* Local vs International Origin Badge */}
          {article.isLocalPublisher && (
            <>
              <span className="font-semibold text-stone-700 dark:text-stone-300 text-[11px]">
                {language === 'fr' ? '[Presse Locale]' : '[Local Publisher]'}
              </span>
              <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">·</span>
            </>
          )}

          {/* Opinion / Editorial Tag */}
          {article.isOpinion && (
            <>
              <span className="font-semibold text-amber-700 dark:text-amber-400 text-[11px]">
                {language === 'fr' ? '[Opinion]' : '[Opinion]'}
              </span>
              <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">·</span>
            </>
          )}

          {/* Principal involved country / countries */}
          {article.countryName ? (
            <div className="flex items-center gap-1.5 font-medium text-stone-700 dark:text-stone-300">
              <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
              <button
                onClick={() => article.countryCode && selectCountry(article.countryCode)}
                className="hover:underline cursor-pointer"
                title={`View news from ${article.countryName}`}
              >
                {article.countryName}
              </button>
              {article.involvedCountries && article.involvedCountries.length > 1 && (
                <span
                  className="text-stone-400 font-normal cursor-help"
                  title={article.involvedCountries.map((c) => c.name).join(', ')}
                >
                  +{article.involvedCountries.length - 1}
                </span>
              )}
            </div>
          ) : (
            <span className="italic text-stone-500 dark:text-stone-400">
              {language === 'fr' ? 'International' : 'Global Dispatch'}
            </span>
          )}

          <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">·</span>
          <span>{article.region}</span>

          <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">·</span>
          <span className="font-semibold text-stone-900 dark:text-stone-100">
            {article.publisher}
            {article.publisherCountry && article.countryCode && article.publisherCountry !== article.countryCode && (
              <span className="font-normal text-stone-400 ml-1">
                ({article.publisherCountry})
              </span>
            )}
          </span>

          {/* Editorial Independence & Ownership if evaluated */}
          {article.editorialIndependence && article.editorialIndependence !== 'Unknown' && (
            <>
              <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">·</span>
              <span className="text-stone-600 dark:text-stone-400">
                {article.editorialIndependence}
              </span>
            </>
          )}

          {article.ownership && article.ownership !== 'Unknown' && (
            <>
              <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">·</span>
              <span className="text-stone-500 dark:text-stone-400">
                {article.ownership}
              </span>
            </>
          )}

          {/* Political Perspective */}
          {article.politicalPerspective && article.politicalPerspective !== 'Not rated' && (
            <>
              <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">·</span>
              <span className="italic text-stone-600 dark:text-stone-400">
                {t.perspectives[article.politicalPerspective] || article.politicalPerspective}
              </span>
            </>
          )}

          {/* Factual Reliability with verified assessment link */}
          {article.factualReliability && article.factualReliability !== 'Not rated' && (
            <>
              <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">·</span>
              {article.assessmentUrl ? (
                <a
                  href={article.assessmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline text-stone-500 dark:text-stone-400 inline-flex items-center gap-0.5"
                  title={`Audit: ${article.assessmentProvider || 'Verified source review'}`}
                >
                  <span>{article.factualReliability} {language === 'fr' ? 'fiabilité' : 'reliability'}</span>
                </a>
              ) : (
                <span className="text-stone-500 dark:text-stone-400">
                  {article.factualReliability} {language === 'fr' ? 'fiabilité' : 'reliability'}
                </span>
              )}
            </>
          )}

          {/* Related secondary regions (cross-region discovery) */}
          {article.relatedRegions && article.relatedRegions.length > 0 && (
            <>
              <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">·</span>
              <span
                className="text-stone-400 dark:text-stone-500 text-[11px]"
                title={`Secondary geopolitical scope: ${article.relatedRegions.join(', ')}`}
              >
                {language === 'fr' ? 'Lien :' : 'Rel:'} {article.relatedRegions.join(', ')}
              </span>
            </>
          )}

          <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">·</span>
          <span className="flex items-center gap-1 font-mono text-[11px] tabular-nums text-stone-500 dark:text-stone-400">
            <Clock className="w-2.5 h-2.5 text-stone-400" />
            {formatTimeAgo(article.pubDate)}
          </span>
        </div>

        {/* Headline */}
        <h3
          className={`font-serif font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-800 dark:group-hover:text-amber-400 transition-colors leading-snug tracking-tight mb-2 ${
            featured ? 'text-xl sm:text-2xl lg:text-3xl' : 'text-base sm:text-lg'
          }`}
          style={{ textWrap: 'balance' }}
        >
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleLinkClick}
            className="hover:underline focus:outline-hidden"
          >
            {currentTitle}
          </a>
        </h3>

        {/* Summary Excerpt */}
        {currentSummary && (
          <p
            className={`text-stone-600 dark:text-stone-300 leading-relaxed text-sm ${
              featured ? 'line-clamp-4 text-base' : 'line-clamp-3'
            }`}
          >
            {currentSummary}
          </p>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Left Actions: Read Original & Compare Coverage */}
        <div className="flex items-center gap-2">
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleLinkClick}
            className="inline-flex items-center gap-1 px-2.5 py-1 font-medium text-stone-800 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded transition-colors"
          >
            <span>{t.actions.readOriginal}</span>
            <ExternalLink className="w-3 h-3 text-stone-500" />
          </a>

          {/* If currently viewing in-place translation, allow toggle to original text */}
          {showTranslated && (
            <button
              onClick={handleShowOriginal}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded transition-colors cursor-pointer"
              title={t.countryPage.showOriginal}
            >
              <RotateCcw className="w-3 h-3 text-stone-400" />
              <span>{t.countryPage.showOriginal}</span>
            </button>
          )}

          <button
            onClick={() => openCompareModal(article)}
            className="inline-flex items-center gap-1 px-2 py-1 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded transition-colors cursor-pointer"
            title={t.actions.compare}
          >
            <Scale className="w-3 h-3 text-amber-600 dark:text-amber-500" />
            <span>
              {article.relatedCount && article.relatedCount > 0
                ? (language === 'fr' ? `Comparer (${article.relatedCount + 1} rédactions)` : `Compare (${article.relatedCount + 1} outlets)`)
                : t.actions.compare}
            </span>
          </button>
        </div>

        {/* Right Actions: Translate & Bookmark */}
        <div className="flex items-center gap-1.5">
          {/* Translation Controls */}
          <div className="relative">
            <button
              onClick={() => setShowTranslateMenu((prev) => !prev)}
              disabled={isTranslating}
              className={`flex items-center gap-1 px-2 py-1 rounded transition-colors cursor-pointer text-xs font-medium ${
                showTranslated
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
              title="Translate options"
            >
              <Languages className="w-3.5 h-3.5" />
              <span>
                {isTranslating
                  ? t.countryPage.translating
                  : showTranslated
                  ? (translatedTargetLang === 'fr' ? 'FR' : 'EN')
                  : (language === 'fr' ? 'Traduire' : 'Translate')}
              </span>
            </button>

            {/* Translation Dropdown Menu */}
            {showTranslateMenu && (
              <div className="absolute right-0 bottom-full mb-1.5 w-44 bg-white dark:bg-stone-800 rounded-lg shadow-lg border border-stone-200 dark:border-stone-700 py-1 z-30 text-xs">
                <button
                  onClick={() => handleInAppTranslate('en')}
                  className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 flex items-center justify-between"
                >
                  <span>Translate to English</span>
                  {showTranslated && translatedTargetLang === 'en' && <span className="text-emerald-600 text-xs">✓</span>}
                </button>
                <button
                  onClick={() => handleInAppTranslate('fr')}
                  className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 flex items-center justify-between"
                >
                  <span>Traduire en français</span>
                  {showTranslated && translatedTargetLang === 'fr' && <span className="text-emerald-600 text-xs">✓</span>}
                </button>
                {showTranslated && (
                  <button
                    onClick={() => {
                      handleShowOriginal();
                      setShowTranslateMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 border-t border-stone-100 dark:border-stone-700 text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-700/60"
                  >
                    {t.countryPage.showOriginal}
                  </button>
                )}
                <div className="border-t border-stone-100 dark:border-stone-700 pt-1">
                  <a
                    href={getTranslateUrl(article.link, language === 'fr' ? 'fr' : 'en')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full text-left px-3 py-1 text-[11px] text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 flex items-center gap-1"
                  >
                    <span>Full Google Translate</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Bookmark Button */}
          <button
            onClick={() => (isSaved ? removeSavedArticle(article.id) : saveArticle(article))}
            className={`p-1 rounded transition-colors cursor-pointer ${
              isSaved
                ? 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-stone-800'
                : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
            title={isSaved ? t.actions.unsave : t.actions.save}
          >
            {isSaved ? <BookmarkCheck className="w-3.5 h-3.5 fill-current" /> : <Bookmark className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </article>
  );
};
