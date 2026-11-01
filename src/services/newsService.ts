import { NewsArticle, CountryInfo, Region, PipelineDiagnostics } from '../types';

export interface NewsResponse {
  articles: NewsArticle[];
  articlesByRegion?: Record<Region, NewsArticle[]>;
  total: number;
  diagnostics?: PipelineDiagnostics;
  cachedAt: string;
}

export interface CountryNewsResponse {
  country: CountryInfo;
  articles: NewsArticle[];
  localArticles?: NewsArticle[];
  internationalArticles?: NewsArticle[];
  noLocalAvailable?: boolean;
  mode?: string;
  total: number;
  cachedAt: string;
}

export interface CompareResponse {
  query: string;
  articles: NewsArticle[];
}

export async function fetchGlobalNews(params: {
  lang: 'en' | 'fr';
  refresh?: boolean;
  region?: string;
  category?: string;
  topic?: string;
}): Promise<NewsResponse> {
  const query = new URLSearchParams({
    lang: params.lang,
    refresh: params.refresh ? 'true' : 'false',
  });
  if (params.region && params.region !== 'All') query.set('region', params.region);
  if (params.category && params.category !== 'All') query.set('category', params.category);
  if (params.topic && params.topic !== 'All' && params.topic !== 'all') query.set('topic', params.topic);

  try {
    const res = await fetch(`/api/news?${query.toString()}`);
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.warn('[Morning Atlas] Failed to fetch news from backend proxy, retrying...', error);
    throw error;
  }
}

export async function fetchCountryNews(
  countryCode: string,
  lang: 'en' | 'fr' = 'en',
  refresh = false,
  mode: 'local' | 'all' | 'international' = 'local',
  publisher?: string,
  topic?: string
): Promise<CountryNewsResponse> {
  const query = new URLSearchParams({
    lang,
    refresh: refresh ? 'true' : 'false',
    mode,
  });
  if (publisher) {
    query.set('publisher', publisher);
  }
  if (topic && topic !== 'All' && topic !== 'all') {
    query.set('topic', topic);
  }

  const res = await fetch(`/api/news/country/${countryCode.toUpperCase()}?${query.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch news for ${countryCode}: ${res.status}`);
  }
  return await res.json();
}

export async function fetchChinaTechNews(
  lang: 'en' | 'fr' = 'en',
  refresh = false,
  subtopic = 'all'
): Promise<{ topic: string; title: string; articles: NewsArticle[]; total: number; cachedAt: string }> {
  const query = new URLSearchParams({
    lang,
    refresh: refresh ? 'true' : 'false',
    subtopic,
  });
  const res = await fetch(`/api/news/china-tech?${query.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch China tech headlines: ${res.status}`);
  }
  return await res.json();
}

export interface TranslationResult {
  originalTitle: string;
  originalSummary?: string;
  translatedTitle: string;
  translatedSummary?: string;
  targetLang: 'en' | 'fr';
  isTranslated: boolean;
}

export async function translateArticle(
  title: string,
  summary?: string,
  targetLang: 'en' | 'fr' = 'en'
): Promise<TranslationResult> {
  const res = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, summary, targetLang }),
  });
  if (!res.ok) {
    throw new Error(`Translation request failed: ${res.status}`);
  }
  return await res.json();
}

export async function fetchCompareCoverage(
  topic: string,
  lang: 'en' | 'fr' = 'en'
): Promise<CompareResponse> {
  const query = new URLSearchParams({
    q: topic,
    lang,
  });

  const res = await fetch(`/api/news/compare?${query.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to compare coverage: ${res.status}`);
  }
  return await res.json();
}

// Generate Google Translate URL for an article with source language auto-detected
export function getTranslateUrl(articleUrl: string, targetLang: 'en' | 'fr'): string {
  const encodedUrl = encodeURIComponent(articleUrl);
  return `https://translate.google.com/translate?sl=auto&tl=${targetLang}&u=${encodedUrl}`;
}

export async function fetchPipelineDiagnostics(
  lang: 'en' | 'fr' = 'en'
): Promise<{ status: string; language: string; diagnostics: PipelineDiagnostics }> {
  const res = await fetch(`/api/diagnostics/pipeline?lang=${lang}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch pipeline diagnostics: ${res.status}`);
  }
  return await res.json();
}
