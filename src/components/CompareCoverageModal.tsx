import React, { useState, useEffect } from 'react';
import {
  Scale,
  X,
  ExternalLink,
  Info,
  Clock,
  ShieldCheck,
  Building2,
  AlertCircle,
} from 'lucide-react';
import { NewsArticle } from '../types';
import { fetchCompareCoverage } from '../services/newsService';
import { useApp } from '../context/AppContext';

export const CompareCoverageModal: React.FC = () => {
  const { comparingArticle, closeCompareModal, language, t } = useApp();

  const [relatedArticles, setRelatedArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!comparingArticle) return;

    // 1. Immediately populate with pre-clustered event articles from diverse publishers
    const preClustered: NewsArticle[] = (comparingArticle.relatedArticles || []).map((rel, idx) => ({
      id: rel.id || `rel_${idx}_${Date.now()}`,
      title: rel.title,
      link: rel.link,
      publisher: rel.publisher,
      publisherCountry: rel.publisherCountry,
      countryName: rel.countryName || comparingArticle.countryName,
      countryCode: rel.countryCode || comparingArticle.countryCode,
      pubDate: rel.pubDate || comparingArticle.pubDate,
      summary: rel.summary,
      region: comparingArticle.region,
      classificationConfidence: comparingArticle.classificationConfidence,
      language: comparingArticle.language,
      category: comparingArticle.category,
      politicalPerspective: rel.politicalPerspective || 'Not rated',
      factualReliability: rel.factualReliability || 'Not rated',
      editorialIndependence: rel.editorialIndependence || 'Unknown',
      isOpinion: rel.isOpinion,
    }));

    setRelatedArticles(preClustered);

    // 2. Concurrently fetch complementary cross-publisher perspectives
    let isMounted = true;
    const fetchAlternatives = async () => {
      // Only show full loading spinner if no pre-clustered articles exist yet
      if (preClustered.length === 0) {
        setIsLoading(true);
      }
      setError(null);
      try {
        const cleanTitle = comparingArticle.title
          .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
          .split(' ')
          .filter((w) => w.length > 3)
          .slice(0, 5)
          .join(' ');

        const data = await fetchCompareCoverage(cleanTitle, language);
        if (isMounted) {
          const existingLinks = new Set([comparingArticle.link, ...preClustered.map((p) => p.link)]);
          const existingPublishers = new Set([comparingArticle.publisher, ...preClustered.map((p) => p.publisher)]);

          const complementary = data.articles.filter(
            (a) => !existingLinks.has(a.link) && !existingPublishers.has(a.publisher)
          );

          setRelatedArticles([...preClustered, ...complementary]);
        }
      } catch (err: unknown) {
        if (isMounted && preClustered.length === 0) {
          setError(err instanceof Error ? err.message : 'Unable to retrieve comparative dispatches');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchAlternatives();
    return () => {
      isMounted = false;
    };
  }, [comparingArticle, language]);

  if (!comparingArticle) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 dark:border-stone-800 flex items-start justify-between gap-4 bg-stone-50 dark:bg-stone-800/40">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-500 uppercase tracking-wider">
              <Scale className="w-4 h-4" />
              <span>{t.compareModal.title}</span>
            </div>
            <h2 className="font-serif text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-50 mt-1">
              {t.compareModal.subtitle}
            </h2>
          </div>
          <button
            onClick={closeCompareModal}
            className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
            title={t.compareModal.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Methodology notice */}
        <div className="px-5 py-2.5 bg-amber-50/70 dark:bg-amber-950/30 border-b border-amber-200/50 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-700 dark:text-amber-400" />
          <p className="leading-relaxed">
            {t.perspectives.methodologyNote}
          </p>
        </div>

        {/* Scrollable content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-6">
          {/* 1. Selected Baseline Story */}
          <div className="p-4 rounded-lg bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
            <span className="text-[11px] font-mono uppercase tracking-wider text-stone-500 font-semibold block mb-1">
              {t.compareModal.originalArticle}
            </span>
            <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-300 mb-1.5">
              <strong className="text-stone-900 dark:text-white">{comparingArticle.publisher}</strong>
              <span aria-hidden="true">·</span>
              <span>{comparingArticle.countryName}</span>
              {comparingArticle.politicalPerspective && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="italic">
                    {t.perspectives[comparingArticle.politicalPerspective] || comparingArticle.politicalPerspective}
                  </span>
                </>
              )}
            </div>
            <h3 className="font-serif font-bold text-base text-stone-900 dark:text-white leading-snug">
              {comparingArticle.title}
            </h3>
            {comparingArticle.summary && (
              <p className="text-xs text-stone-600 dark:text-stone-300 mt-2 leading-relaxed">
                {comparingArticle.summary}
              </p>
            )}
            <div className="mt-3">
              <a
                href={comparingArticle.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-800 dark:text-stone-200 hover:underline"
              >
                <span>{t.actions.readOriginal}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* 2. Comparative Coverage List */}
          <div>
            <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 uppercase tracking-wider mb-3">
              {t.compareModal.relatedCoverage}
            </h4>

            {isLoading ? (
              <div className="py-8 text-center text-xs text-stone-500">
                <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-800 rounded-full animate-spin mx-auto mb-2" />
                <p>{t.compareModal.noRelatedFound}</p>
              </div>
            ) : relatedArticles.length === 0 ? (
              <div className="p-4 rounded-lg bg-stone-50 dark:bg-stone-800/40 text-xs text-stone-600 dark:text-stone-400 text-center">
                {language === 'fr'
                  ? 'Aucune autre couverture directe n’a pu être identifiée instantanément pour cette dépêche spécifique. Vous pouvez consulter les médias nationaux dans la section Pays.'
                  : 'No distinct cross-publisher reports were matched automatically for this dispatch. Explore national outlets directly in the Country dashboard.'}
              </div>
            ) : (
              <div className="space-y-3">
                {relatedArticles.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-lg border border-stone-200/90 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-700 transition-colors bg-white dark:bg-stone-900"
                  >
                    {/* Unboxed perspective tags */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-500 mb-1.5">
                      <strong className="text-stone-900 dark:text-white font-medium">
                        {item.publisher}
                      </strong>
                      <span aria-hidden="true">·</span>
                      <span>{item.countryName}</span>
                      {item.politicalPerspective && item.politicalPerspective !== 'Not rated' && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="italic text-stone-700 dark:text-stone-300">
                            {t.perspectives[item.politicalPerspective] || item.politicalPerspective}
                          </span>
                        </>
                      )}
                    </div>

                    <h5 className="font-serif font-semibold text-sm text-stone-900 dark:text-stone-100 leading-snug">
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {item.title}
                      </a>
                    </h5>

                    {item.summary && (
                      <p className="text-xs text-stone-600 dark:text-stone-300 mt-1.5 leading-relaxed line-clamp-2">
                        {item.summary}
                      </p>
                    )}

                    <div className="mt-2.5 flex items-center justify-between text-xs">
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-stone-700 dark:text-stone-300 hover:underline"
                      >
                        <span>{t.actions.readOriginal}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40 flex justify-end">
          <button
            onClick={closeCompareModal}
            className="px-4 py-2 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-md text-xs font-semibold hover:bg-stone-800 dark:hover:bg-white transition cursor-pointer"
          >
            {t.compareModal.close}
          </button>
        </div>
      </div>
    </div>
  );
};
