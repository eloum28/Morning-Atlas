import express, { Request, Response } from 'express';
import { XMLParser } from 'fast-xml-parser';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { COUNTRIES, getCountryByCode, REGIONS_LIST } from './src/data/countries';
import {
  NEWS_OUTLETS,
  getOutletMetadata,
  getOutletsForCountry,
  findOutletByDomainOrName,
  isOutletLocalToCountry,
} from './src/data/outlets';
import { NewsArticle, Region, NewsCategory, PipelineDiagnostics, SourceOriginMode, TopicInterest } from './src/types';
import { detectInvolvedCountries } from './src/services/countryDetector';
import { calculateImportanceScore, deduplicateAndClusterArticles, ensureRegionalDiversity } from './src/services/newsRanking';
import { classifyArticleTopic } from './src/services/topicClassifier';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// XML Parser for RSS & Atom feeds
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  trimValues: true,
});

// Cache interface
interface CacheEntry {
  timestamp: number;
  data: any;
}

const memoryCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 12 * 60 * 1000; // 12 minutes TTL

// Helper to sanitize and extract plain text from RSS descriptions
function cleanHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

// Categorization helper
function detectCategory(title: string, summary: string): NewsCategory {
  const text = `${title} ${summary}`.toLowerCase();
  if (
    text.includes('election') ||
    text.includes('parliament') ||
    text.includes('president') ||
    text.includes('minister') ||
    text.includes('vote') ||
    text.includes('diplomacy') ||
    text.includes('treaty') ||
    text.includes('sanction') ||
    text.includes('ceasefire') ||
    text.includes('un security')
  ) {
    return 'Politics';
  }
  if (
    text.includes('market') ||
    text.includes('inflation') ||
    text.includes('economy') ||
    text.includes('stock') ||
    text.includes('trade') ||
    text.includes('bank') ||
    text.includes('gdp') ||
    text.includes('oil') ||
    text.includes('tariff') ||
    text.includes('currency')
  ) {
    return 'Economy';
  }
  if (
    text.includes('ai ') ||
    text.includes('artificial intelligence') ||
    text.includes('chip') ||
    text.includes('tech') ||
    text.includes('cyber') ||
    text.includes('software') ||
    text.includes('apple') ||
    text.includes('robot') ||
    text.includes('semiconductor')
  ) {
    return 'Technology';
  }
  if (
    text.includes('space') ||
    text.includes('nasa') ||
    text.includes('physics') ||
    text.includes('biology') ||
    text.includes('fossil') ||
    text.includes('researchers') ||
    text.includes('telescope') ||
    text.includes('quantum')
  ) {
    return 'Science';
  }
  if (
    text.includes('health') ||
    text.includes('virus') ||
    text.includes('hospital') ||
    text.includes('vaccine') ||
    text.includes('medical') ||
    text.includes('who') ||
    text.includes('disease') ||
    text.includes('clinical')
  ) {
    return 'Health';
  }
  if (
    text.includes('climate') ||
    text.includes('emissions') ||
    text.includes('cop') ||
    text.includes('warming') ||
    text.includes('solar') ||
    text.includes('flood') ||
    text.includes('hurricane') ||
    text.includes('wildfire') ||
    text.includes('biodiversity')
  ) {
    return 'Environment';
  }
  if (
    text.includes('court') ||
    text.includes('protest') ||
    text.includes('rights') ||
    text.includes('education') ||
    text.includes('strike') ||
    text.includes('police') ||
    text.includes('poverty') ||
    text.includes('refugee')
  ) {
    return 'Society';
  }
  if (
    text.includes('film') ||
    text.includes('art') ||
    text.includes('museum') ||
    text.includes('music') ||
    text.includes('festival') ||
    text.includes('cinema') ||
    text.includes('theatre') ||
    text.includes('author') ||
    text.includes('heritage')
  ) {
    return 'Culture';
  }
  if (
    text.includes('football') ||
    text.includes('soccer') ||
    text.includes('cup') ||
    text.includes('championship') ||
    text.includes('olympic') ||
    text.includes('tennis') ||
    text.includes('nba') ||
    text.includes('fifa') ||
    text.includes('premier league')
  ) {
    return 'Sports';
  }
  return 'Top Stories';
}

// Extract real publisher name from URL or title without confusing with country name
function deducePublisher(
  rawTitlePublisher: string | undefined,
  sourceObj: any,
  itemLink: string,
  feedDefaultPublisher: string
): string {
  // 1. URL domain match against verified outlets first
  if (itemLink) {
    try {
      const url = new URL(itemLink);
      const host = url.hostname.toLowerCase();
      const matched = findOutletByDomainOrName(host);
      if (matched) return matched.name;
    } catch {
      // ignore
    }
  }

  // 2. Publisher from title suffix
  if (rawTitlePublisher && rawTitlePublisher.trim()) {
    const trimmed = rawTitlePublisher.trim();
    const matched = findOutletByDomainOrName(trimmed);
    if (matched) return matched.name;

    const isCountry = COUNTRIES.some(
      (c) => c.nameEn.toLowerCase() === trimmed.toLowerCase() || c.nameFr.toLowerCase() === trimmed.toLowerCase()
    );
    if (!isCountry && trimmed.length > 1) {
      return trimmed;
    }
  }

  // 3. Source tag in RSS
  if (sourceObj) {
    const s = typeof sourceObj === 'string' ? sourceObj : sourceObj?.['#text'] || '';
    if (s && s.trim()) {
      const matched = findOutletByDomainOrName(s.trim());
      if (matched) return matched.name;

      const isCountry = COUNTRIES.some(
        (c) => c.nameEn.toLowerCase() === s.trim().toLowerCase() || c.nameFr.toLowerCase() === s.trim().toLowerCase()
      );
      if (!isCountry) return s.trim();
    }
  }

  return feedDefaultPublisher || 'International Wire';
}

// Fetch and parse an RSS feed with timeout and robust attribution
async function fetchRssFeed(
  url: string,
  targetRegion: Region,
  defaultPublisher: string,
  defaultCountryCode: string = 'US',
  defaultLanguage: string = 'en',
  forceDomestic: boolean = false
): Promise<NewsArticle[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return [];
    }

    const xmlText = await res.text();
    const parsed = xmlParser.parse(xmlText);

    // Standard RSS 2.0 or Atom
    const items =
      parsed?.rss?.channel?.item ||
      parsed?.feed?.entry ||
      parsed?.['rdf:RDF']?.item ||
      [];

    const rawArray = Array.isArray(items) ? items : [items];
    const articles: NewsArticle[] = [];

    for (const item of rawArray) {
      if (!item) continue;

      let title = typeof item.title === 'string' ? item.title : item.title?.['#text'] || '';
      let link = typeof item.link === 'string' ? item.link : item.link?.['@_href'] || item.link?.['#text'] || '';
      
      // Real publication date parsing
      let rawDate = item.pubDate || item.published || item.updated || item['dc:date'];
      let pubDateIso: string;
      try {
        const parsedDate = new Date(rawDate);
        if (!isNaN(parsedDate.getTime())) {
          pubDateIso = parsedDate.toISOString();
        } else {
          pubDateIso = new Date().toISOString();
        }
      } catch {
        pubDateIso = new Date().toISOString();
      }

      let rawDesc = item.description || item.summary || item['content:encoded'] || '';
      if (typeof rawDesc !== 'string') rawDesc = rawDesc?.['#text'] || '';

      // Google News or title format often appends " - Publisher Name"
      let rawTitlePublisher: string | undefined;
      if (title.includes(' - ')) {
        const parts = title.split(' - ');
        rawTitlePublisher = parts.pop()?.trim();
        title = parts.join(' - ').trim();
      }

      // Exact publisher attribution without confusing with country name
      const publisher = deducePublisher(rawTitlePublisher, item.source, link, defaultPublisher);

      let summary = cleanHtml(rawDesc);
      // Avoid duplicating the headline if the excerpt merely repeats it
      if (summary.trim().toLowerCase() === title.trim().toLowerCase()) {
        summary = '';
      }

      const category = detectCategory(title, summary);
      const outletMeta = getOutletMetadata(publisher, link);

      // Accurate Country & Region tagging strictly from subject analysis with regional desk fallback
      const geoResult = detectInvolvedCountries(title, summary, defaultCountryCode, targetRegion);

      if (title && link) {
        let pubCountry = outletMeta.publisherCountry;
        if (!pubCountry && forceDomestic) {
          pubCountry = defaultCountryCode;
        }

        const isLocal =
          pubCountry === defaultCountryCode ||
          isOutletLocalToCountry(publisher, defaultCountryCode, link);

        const article: NewsArticle = {
          id: crypto.createHash('sha256').update(`${link}|${title}`).digest('hex').substring(0, 24),
          title,
          link,
          publisher,
          publisherId: outletMeta.publisherId,
          publisherCountry: pubCountry || defaultCountryCode,
          publisherDomain: outletMeta.publisherDomain,
          countryCode: geoResult.primaryCountry?.code || defaultCountryCode,
          countryName: geoResult.primaryCountry?.nameEn || getCountryByCode(defaultCountryCode)?.nameEn,
          secondaryCountries: geoResult.secondaryCountries,
          involvedCountries: geoResult.involvedCountries,
          region: geoResult.region, // Strictly determined by subject or regional desk context
          relatedRegions: geoResult.relatedRegions,
          isMultilateral: geoResult.isMultilateral,
          classificationConfidence: geoResult.confidence,
          classificationReason: geoResult.classificationReason,
          pubDate: pubDateIso,
          summary: summary.length > 280 ? summary.substring(0, 280) + '...' : summary,
          language: defaultLanguage,
          category,
          isOpinion: geoResult.isOpinion,
          ownership: outletMeta.ownership,
          editorialIndependence: outletMeta.editorialIndependence,
          politicalPerspective: outletMeta.politicalPerspective,
          factualReliability: outletMeta.factualReliability,
          assessmentProvider: outletMeta.assessmentProvider,
          assessmentUrl: outletMeta.assessmentUrl,
          isDomestic: isLocal,
          isLocalPublisher: isLocal,
          sourceOrigin: isLocal ? 'local' : 'international',
        };

        const topicInterest = classifyArticleTopic(
          title,
          summary,
          category,
          article.countryCode
        );
        article.topicInterest = topicInterest;

        // Calculate transparent international importance score (reflects topic interest priority)
        article.importanceScore = calculateImportanceScore(article);

        articles.push(article);
      }
    }

    return articles;
  } catch {
    return [];
  }
}

// Independent regional feed configuration with verified geographic representation
function getRegionalFeedConfigs(lang: string) {
  if (lang === 'fr') {
    return {
      Africa: [
        { url: 'https://feeds.bbci.co.uk/afrique/rss.xml', publisher: 'BBC Afrique', code: 'SN' },
        { url: 'https://www.lemonde.fr/afrique/rss_full.xml', publisher: 'Le Monde Afrique', code: 'SN' },
        { url: 'https://news.google.com/rss/search?q=(S%C3%A9n%C3%A9gal+OR+Maroc+OR+"Sahara+occidental"+OR+"C%C3%B4te+d%27Ivoire"+OR+RDC)+when:4d&hl=fr&gl=SN&ceid=SN:fr', publisher: 'Presse Africaine', code: 'SN' },
      ],
      Europe: [
        { url: 'https://www.lemonde.fr/europe/rss_full.xml', publisher: 'Le Monde Europe', code: 'FR' },
        { url: 'https://www.lemonde.fr/international/rss_full.xml', publisher: 'Le Monde International', code: 'FR' },
      ],
      Asia: [
        { url: 'https://www.lemonde.fr/asie-pacifique/rss_full.xml', publisher: 'Le Monde Asie', code: 'JP' },
        { url: 'https://news.google.com/rss/search?q=(Chine+OR+Japon+OR+Inde+OR+"Cor%C3%A9e+du+Nord"+OR+"Cor%C3%A9e+du+Sud"+OR+Ta%C3%AFwan)+when:4d&hl=fr&gl=FR&ceid=FR:fr', publisher: 'Dépêches Asie', code: 'JP' },
      ],
      'Middle East': [
        { url: 'https://www.lemonde.fr/proche-orient/rss_full.xml', publisher: 'Le Monde Proche-Orient', code: 'EG' },
        { url: 'https://news.google.com/rss/search?q=(Moyen-Orient+OR+Gaza+OR+Liban+OR+Syrie+OR+Iran+OR+Isra%C3%ABl+OR+Jordanie)+when:4d&hl=fr&gl=FR&ceid=FR:fr', publisher: 'Moyen-Orient Dispatches', code: 'EG' },
      ],
      'North America': [
        { url: 'https://www.lemonde.fr/ameriques/rss_full.xml', publisher: 'Le Monde Amériques', code: 'US' },
        { url: 'https://news.google.com/rss/search?q=(%C3%89tats-Unis+OR+Canada+OR+Qu%C3%A9bec)+when:4d&hl=fr&gl=FR&ceid=FR:fr', publisher: 'Amérique du Nord', code: 'US' },
      ],
      'Latin America and the Caribbean': [
        { url: 'https://www.lemonde.fr/ameriques/rss_full.xml', publisher: 'Le Monde Amériques', code: 'BR' },
        { url: 'https://news.google.com/rss/search?q=(Br%C3%A9sil+OR+Mexique+OR+Argentine+OR+Colombie+OR+Chili)+when:4d&hl=fr&gl=FR&ceid=FR:fr', publisher: 'Amérique Latine News', code: 'BR' },
      ],
      Oceania: [
        { url: 'https://news.google.com/rss/search?q=(Australie+OR+Nouvelle-Z%C3%A9lande+OR+Pacifique)+when:4d&hl=fr&gl=FR&ceid=FR:fr', publisher: 'Presse Océanienne', code: 'AU' },
      ],
      Global: [
        { url: 'https://news.google.com/rss/search?q=("Nations+Unies"+OR+"Conseil+de+s%C3%A9curit%C3%A9"+OR+G20+OR+OMS+OR+FMI)+when:4d&hl=fr&gl=FR&ceid=FR:fr', publisher: 'Diplomatie Multilatérale', code: 'FR' },
      ],
    };
  }

  // English regional feeds
  return {
    Africa: [
      { url: 'https://feeds.bbci.co.uk/news/world/africa/rss.xml', publisher: 'BBC News', code: 'SN' },
      { url: 'https://news.google.com/rss/search?q=(Senegal+OR+Morocco+OR+"Western+Sahara"+OR+Nigeria+OR+Kenya+OR+Ghana+OR+"South+Africa")+when:4d&hl=en-US&gl=US&ceid=US:en', publisher: 'African Wire', code: 'SN' },
    ],
    Europe: [
      { url: 'https://feeds.bbci.co.uk/news/world/europe/rss.xml', publisher: 'BBC News', code: 'GB' },
      { url: 'https://rss.dw.com/rdf/rss-en-all', publisher: 'Deutsche Welle', code: 'DE' },
      { url: 'https://www.theguardian.com/world/rss', publisher: 'The Guardian', code: 'GB' },
    ],
    Asia: [
      { url: 'https://feeds.bbci.co.uk/news/world/asia/rss.xml', publisher: 'BBC News', code: 'JP' },
      { url: 'https://news.google.com/rss/search?q=(India+OR+China+OR+Japan+OR+"South+Korea"+OR+"North+Korea"+OR+Taiwan)+when:4d&hl=en-US&gl=US&ceid=US:en', publisher: 'Asia-Pacific Wire', code: 'KR' },
    ],
    'Middle East': [
      { url: 'https://feeds.bbci.co.uk/news/world/middle_east/rss.xml', publisher: 'BBC News', code: 'QA' },
      { url: 'https://www.aljazeera.com/xml/rss/all.xml', publisher: 'Al Jazeera English', code: 'QA' },
    ],
    'North America': [
      { url: 'https://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml', publisher: 'BBC News', code: 'US' },
      { url: 'https://feeds.npr.org/1004/rss.xml', publisher: 'NPR', code: 'US' },
    ],
    'Latin America and the Caribbean': [
      { url: 'https://feeds.bbci.co.uk/news/world/latin_america/rss.xml', publisher: 'BBC News', code: 'BR' },
      { url: 'https://en.mercopress.com/rss/', publisher: 'MercoPress', code: 'UY' },
    ],
    Oceania: [
      { url: 'https://www.abc.net.au/news/feed/51120/rss.xml', publisher: 'ABC News Australia', code: 'AU' },
      { url: 'https://www.rnz.co.nz/rss/national.xml', publisher: 'Radio New Zealand', code: 'NZ' },
      { url: 'https://news.google.com/rss/search?q=(Australia+OR+"New+Zealand"+OR+Fiji+OR+"Pacific+Islands")+when:4d&hl=en-US&gl=AU&ceid=AU:en', publisher: 'Pacific Wire', code: 'AU' },
    ],
    Global: [
      { url: 'https://news.google.com/rss/search?q=("United+Nations"+OR+"UN+Security+Council"+OR+G20+OR+G7+OR+WHO+OR+IMF)+when:4d&hl=en-US&gl=US&ceid=US:en', publisher: 'Multilateral Dispatches', code: 'US' },
    ],
  };
}

// --- Primary API Endpoints ---

// 1. GET /api/news - Morning briefing with guaranteed geographic diversity across all 7 regions
async function buildAggregatedNews(langKey: 'en' | 'fr') {
  const regionalConfigs = getRegionalFeedConfigs(langKey);

  // Fetch headlines from independent regional feeds
  const allFeedPromises: Promise<NewsArticle[]>[] = [];
  const regionsToFetch = [...REGIONS_LIST, 'Global' as Region];
  for (const reg of regionsToFetch) {
    const feeds = (regionalConfigs as any)[reg] || [];
    for (const f of feeds) {
      allFeedPromises.push(fetchRssFeed(f.url, reg, f.publisher, f.code, langKey));
    }
  }

  const fetchedLists = await Promise.all(allFeedPromises);
  const flatArticles = fetchedLists.flat();
  const rawRetrieved = flatArticles.length;

  // Global cross-region deduplication (Priority 5)
  const allArticles = deduplicateAndClusterArticles(flatArticles);
  const deduplicatedCount = allArticles.length;
  const rejectedDuplicates = rawRetrieved - deduplicatedCount;

  // Sort by importanceScore descending
  allArticles.sort((a, b) => (b.importanceScore || 0) - (a.importanceScore || 0));

  const articlesByRegion: Record<Region, NewsArticle[]> = {
    Africa: [],
    Europe: [],
    Asia: [],
    'Middle East': [],
    'North America': [],
    'Latin America and the Caribbean': [],
    Oceania: [],
    Global: [],
    Unclassified: [],
  };

  // Populate each region's collection strictly based on verified subject region with guaranteed country diversity
  for (const reg of REGIONS_LIST) {
    const regional = allArticles.filter((a) => a.region === reg);
    articlesByRegion[reg] = ensureRegionalDiversity(regional);
  }
  // Genuine multilateral and international organization dispatches only (never sports, routine entertainment, or unclassified items)
  articlesByRegion['Global'] = allArticles.filter(
    (a) => a.region === 'Global' && a.isMultilateral === true && a.category !== 'Sports'
  );
  // Separate unclassified articles internally (never in Global)
  articlesByRegion['Unclassified'] = allArticles.filter((a) => a.region === 'Unclassified');

  const geographicBreakdown: Record<string, number> = {};
  for (const reg of REGIONS_LIST) {
    geographicBreakdown[reg] = articlesByRegion[reg].length;
  }
  geographicBreakdown['Global'] = articlesByRegion['Global'].length;
  geographicBreakdown['Unclassified'] = articlesByRegion['Unclassified'].length;

  const pipelineDiagnostics: PipelineDiagnostics = {
    rawRetrieved,
    deduplicatedCount,
    rejectedDuplicates,
    geographicBreakdown,
    unclassifiedCount: articlesByRegion['Unclassified'].length,
    evaluatedAt: new Date().toISOString(),
  };

  return { allArticles, articlesByRegion, pipelineDiagnostics };
}

// 1. GET /api/news - Global aggregated news
app.get('/api/news', async (req: Request, res: Response) => {
  const { lang = 'en', refresh = 'false', region, category, topic, limit = '60' } = req.query;
  const langKey = lang === 'fr' ? 'fr' : 'en';
  const cacheKey = `briefing_all_regions_${langKey}`;

  let allArticles: NewsArticle[] = [];
  let articlesByRegion: Record<Region, NewsArticle[]> = {
    Africa: [],
    Europe: [],
    Asia: [],
    'Middle East': [],
    'North America': [],
    'Latin America and the Caribbean': [],
    Oceania: [],
    Global: [],
    Unclassified: [],
  };
  let pipelineDiagnostics: PipelineDiagnostics | undefined = undefined;

  if (refresh !== 'true' && memoryCache.has(cacheKey)) {
    const cached = memoryCache.get(cacheKey)!;
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      allArticles = cached.data.allArticles;
      articlesByRegion = cached.data.articlesByRegion;
      pipelineDiagnostics = cached.data.pipelineDiagnostics;
    }
  }

  if (allArticles.length === 0) {
    const result = await buildAggregatedNews(langKey);
    allArticles = result.allArticles;
    articlesByRegion = result.articlesByRegion;
    pipelineDiagnostics = result.pipelineDiagnostics;

    memoryCache.set(cacheKey, {
      timestamp: Date.now(),
      data: { allArticles, articlesByRegion, pipelineDiagnostics },
    });
  }

  // Filter if specific region, category, or topic was requested
  let filtered = allArticles;
  if (region && typeof region === 'string' && region !== 'All') {
    filtered = filtered.filter((a) => a.region.toLowerCase() === region.toLowerCase());
  }
  if (category && typeof category === 'string' && category !== 'All') {
    filtered = filtered.filter((a) => a.category.toLowerCase() === category.toLowerCase());
  }
  if (topic && typeof topic === 'string' && topic !== 'all' && topic !== 'All') {
    filtered = filtered.filter((a) => a.topicInterest === topic);
  }

  const numLimit = Math.min(parseInt(limit as string, 10) || 60, 150);

  res.json({
    articles: filtered.slice(0, numLimit),
    articlesByRegion,
    total: filtered.length,
    diagnostics: pipelineDiagnostics,
    cachedAt: new Date(memoryCache.get(cacheKey)?.timestamp || Date.now()).toISOString(),
  });
});

// 2. GET /api/news/country/:code - Country-specific dashboard news with verified local outlets
app.get('/api/news/country/:code', async (req: Request, res: Response) => {
  const code = (req.params.code || 'US').toUpperCase();
  const { lang = 'en', mode = 'local', publisher = '', topic = '', refresh = 'false' } = req.query;
  const country = getCountryByCode(code);

  if (!country) {
    res.status(404).json({ error: 'Country not found' });
    return;
  }

  const langKey = lang === 'fr' ? 'fr' : 'en';
  const cacheKey = `country_local_v3_${code}_${langKey}`;
  let cachedData: any = null;

  if (refresh !== 'true' && memoryCache.has(cacheKey)) {
    const cached = memoryCache.get(cacheKey)!;
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      cachedData = cached.data;
    }
  }

  if (!cachedData) {
    const localOutlets = getOutletsForCountry(code);
    const localPromises: Promise<NewsArticle[]>[] = [];

    // A. Direct verified RSS feeds for national outlets
    for (const outlet of localOutlets) {
      if (outlet.feedUrl) {
        localPromises.push(
          fetchRssFeed(outlet.feedUrl, country.region, outlet.name, code, outlet.language || langKey, true)
            .then((items) =>
              items.map((it) => ({
                ...it,
                publisher: outlet.name,
                publisherId: outlet.id,
                publisherCountry: code,
                publisherDomain: outlet.domain,
                isDomestic: true,
                isLocalPublisher: true,
                sourceOrigin: 'local' as const,
                countryCode: code,
                countryName: country.nameEn,
                region: country.region,
              }))
            )
            .catch(() => [])
        );
      }
    }

    // B. Domain-targeted discovery for verified domestic outlets
    const verifiedDomains = localOutlets
      .map((o) => o.domain || (o.domains && o.domains[0]))
      .filter(Boolean) as string[];

    if (verifiedDomains.length > 0) {
      // Chunk domains into sets of up to 6
      const domainChunks: string[][] = [];
      for (let i = 0; i < verifiedDomains.length; i += 6) {
        domainChunks.push(verifiedDomains.slice(i, i + 6));
      }

      for (const chunk of domainChunks) {
        const domainQuery = chunk.map((d) => `site:${d}`).join(' OR ');

        // Language & regional parameters
        let queryHl = 'en-US';
        let queryGl = code;
        let queryCeid = `${code}:en`;

        if (code === 'SA') {
          queryHl = 'ar';
          queryCeid = 'SA:ar';
        } else if (code === 'IL') {
          queryHl = 'he';
          queryCeid = 'IL:he';
        } else if (code === 'SN' || code === 'FR' || code === 'MA') {
          queryHl = 'fr';
          queryCeid = `${code}:fr`;
        } else if (code === 'KR') {
          queryHl = 'ko';
          queryCeid = 'KR:ko';
        } else if (code === 'JP') {
          queryHl = 'ja';
          queryCeid = 'JP:ja';
        } else if (code === 'DE') {
          queryHl = 'de';
          queryCeid = 'DE:de';
        } else if (code === 'BR') {
          queryHl = 'pt-BR';
          queryCeid = 'BR:pt-419';
        } else if (code === 'MX' || code === 'AR') {
          queryHl = 'es-419';
          queryCeid = `${code}:es-419`;
        }

        const nativeSearchUrl = `https://news.google.com/rss/search?q=(${encodeURIComponent(domainQuery)})+when:7d&hl=${queryHl}&gl=${queryGl}&ceid=${queryCeid}`;
        localPromises.push(
          fetchRssFeed(nativeSearchUrl, country.region, `${country.nameEn} Press`, code, queryHl, false)
            .then((items) =>
              items.map((it) => {
                const matched = findOutletByDomainOrName(it.link) || findOutletByDomainOrName(it.publisher);
                const isLocal = isOutletLocalToCountry(it.publisher, code, it.link) || (matched && matched.countryCode === code);
                return {
                  ...it,
                  publisher: matched ? matched.name : it.publisher,
                  publisherId: matched?.id,
                  publisherCountry: matched?.countryCode || (isLocal ? code : 'US'),
                  publisherDomain: matched?.domain,
                  isDomestic: Boolean(isLocal),
                  isLocalPublisher: Boolean(isLocal),
                  sourceOrigin: isLocal ? ('local' as const) : ('international' as const),
                  countryCode: code,
                  countryName: country.nameEn,
                  region: country.region,
                };
              })
            )
            .catch(() => [])
        );

        // Also retrieve English/French editions for outlets that publish multi-language editions
        if (queryHl !== 'en-US' && (langKey === 'en' || country.languages.includes('English'))) {
          const engSearchUrl = `https://news.google.com/rss/search?q=(${encodeURIComponent(domainQuery)})+when:7d&hl=en-US&gl=${code}&ceid=${code}:en`;
          localPromises.push(
            fetchRssFeed(engSearchUrl, country.region, `${country.nameEn} English Press`, code, 'en', false)
              .then((items) =>
                items.map((it) => {
                  const matched = findOutletByDomainOrName(it.link) || findOutletByDomainOrName(it.publisher);
                  const isLocal = isOutletLocalToCountry(it.publisher, code, it.link) || (matched && matched.countryCode === code);
                  return {
                    ...it,
                    publisher: matched ? matched.name : it.publisher,
                    publisherId: matched?.id,
                    publisherCountry: matched?.countryCode || (isLocal ? code : 'US'),
                    publisherDomain: matched?.domain,
                    isDomestic: Boolean(isLocal),
                    isLocalPublisher: Boolean(isLocal),
                    sourceOrigin: isLocal ? ('local' as const) : ('international' as const),
                    countryCode: code,
                    countryName: country.nameEn,
                    region: country.region,
                  };
                })
              )
              .catch(() => [])
          );
        }
      }
    }

    // C. International coverage of the selected country (Foreign news organizations reporting about this country)
    const encodedCountryName = encodeURIComponent(country.nameEn);
    const intlUrl =
      langKey === 'fr'
        ? `https://news.google.com/rss/search?q=${encodedCountryName}+when:7d&hl=fr&gl=FR&ceid=FR:fr`
        : `https://news.google.com/rss/search?q=${encodedCountryName}+when:7d&hl=en-US&gl=US&ceid=US:en`;

    const intlPromise = fetchRssFeed(intlUrl, country.region, 'International Wire', 'US', langKey, false)
      .then((items) =>
        items.map((it) => {
          const isActuallyLocal = isOutletLocalToCountry(it.publisher, code, it.link);
          if (isActuallyLocal) {
            return {
              ...it,
              isDomestic: true,
              isLocalPublisher: true,
              sourceOrigin: 'local' as const,
              publisherCountry: code,
              countryCode: code,
              countryName: country.nameEn,
            };
          }
          return {
            ...it,
            isDomestic: false,
            isLocalPublisher: false,
            sourceOrigin: 'international' as const,
            countryCode: code,
            countryName: country.nameEn,
          };
        })
      )
      .catch(() => []);

    const [localResultsNested, intlResults] = await Promise.all([
      Promise.all(localPromises),
      intlPromise,
    ]);

    const rawLocal: NewsArticle[] = localResultsNested.flat();
    const rawIntl: NewsArticle[] = intlResults;

    // Strict local isolation: ONLY articles published by outlets based in this country
    const verifiedLocal = rawLocal.filter(
      (a) => a.publisherCountry === code || isOutletLocalToCountry(a.publisher, code, a.link)
    );
    // International: Foreign outlets reporting on this country
    const foreignFromLocal = rawLocal.filter(
      (a) => a.publisherCountry !== code && !isOutletLocalToCountry(a.publisher, code, a.link)
    );
    const verifiedIntl = [...rawIntl, ...foreignFromLocal].filter(
      (a) => a.publisherCountry !== code && !isOutletLocalToCountry(a.publisher, code, a.link)
    );

    const dedupedLocal = deduplicateAndClusterArticles(verifiedLocal);
    const dedupedIntl = deduplicateAndClusterArticles(verifiedIntl);

    dedupedLocal.sort((a, b) => (b.importanceScore || 0) - (a.importanceScore || 0));
    dedupedIntl.sort((a, b) => (b.importanceScore || 0) - (a.importanceScore || 0));

    cachedData = {
      localArticles: dedupedLocal,
      internationalArticles: dedupedIntl,
      noLocalAvailable: dedupedLocal.length === 0,
    };

    memoryCache.set(cacheKey, { timestamp: Date.now(), data: cachedData });
  }

  const { localArticles, internationalArticles, noLocalAvailable } = cachedData;

  // Filter by publisher if requested
  let filteredLocal = localArticles;
  let filteredIntl = internationalArticles;

  if (publisher && typeof publisher === 'string') {
    const pubQ = publisher.toLowerCase().trim();
    filteredLocal = filteredLocal.filter(
      (a: NewsArticle) =>
        a.publisherId === pubQ ||
        a.publisher.toLowerCase().includes(pubQ) ||
        (a.publisherDomain && a.publisherDomain.toLowerCase().includes(pubQ))
    );
    filteredIntl = filteredIntl.filter(
      (a: NewsArticle) =>
        a.publisherId === pubQ ||
        a.publisher.toLowerCase().includes(pubQ) ||
        (a.publisherDomain && a.publisherDomain.toLowerCase().includes(pubQ))
    );
  }

  // Filter by topic if requested (e.g. Saudi Arabia + Renewable Energy, Senegal + Agriculture, etc.)
  if (topic && typeof topic === 'string' && topic !== 'all' && topic !== 'All') {
    const topicQ = topic.toLowerCase();
    filteredLocal = filteredLocal.filter(
      (a: NewsArticle) => (a.topicInterest || classifyArticleTopic(a.title, a.summary, a.category, code)) === topicQ
    );
    filteredIntl = filteredIntl.filter(
      (a: NewsArticle) => (a.topicInterest || classifyArticleTopic(a.title, a.summary, a.category, code)) === topicQ
    );
  }

  // Handle source mode: 'local' (DEFAULT), 'all' (LOCAL + INTERNATIONAL), 'international'
  let returnedArticles: NewsArticle[] = [];
  const reqMode = ((mode as string) || 'local').toLowerCase();

  if (reqMode === 'international') {
    returnedArticles = filteredIntl;
  } else if (reqMode === 'all') {
    returnedArticles = [...filteredLocal, ...filteredIntl];
  } else {
    // 'local' - DEFAULT: Show ONLY news from verified domestic outlets
    // RULE 8: If no recent local feed results, DO NOT silently substitute international articles!
    returnedArticles = filteredLocal;
  }

  res.json({
    country,
    articles: returnedArticles,
    localArticles: filteredLocal,
    internationalArticles: filteredIntl,
    noLocalAvailable: filteredLocal.length === 0,
    mode: reqMode,
    total: returnedArticles.length,
    cachedAt: new Date().toISOString(),
  });
});

// 2b. GET /api/news/china-tech - Dedicated China Technology & Innovation reporting
app.get('/api/news/china-tech', async (req: Request, res: Response) => {
  const { lang = 'en', refresh = 'false', subtopic = 'all' } = req.query;
  const langKey = lang === 'fr' ? 'fr' : 'en';
  const cacheKey = `china_tech_feed_${langKey}`;
  let cachedData: NewsArticle[] | null = null;

  if (refresh !== 'true' && memoryCache.has(cacheKey)) {
    const cached = memoryCache.get(cacheKey)!;
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      cachedData = cached.data;
    }
  }

  if (!cachedData) {
    const chinaTechPromises: Promise<NewsArticle[]>[] = [];

    // Query verified Chinese tech and business publications
    const chineseTechDomains = [
      'site:scmp.com',
      'site:caixinglobal.com',
      'site:chinadaily.com.cn',
      'site:xinhuanet.com',
      'site:yicaiglobal.com',
    ].join(' OR ');

    const techKeywords = [
      'artificial intelligence', 'AI', 'semiconductor', 'chip', 'robotics',
      'electric vehicle', 'EV', 'battery', 'CATL', 'BYD', 'Huawei', 'SMIC',
      'quantum', 'space', 'telecom', '6G', 'solar'
    ].map((k) => `"${k}"`).join(' OR ');

    const searchUrlEn = `https://news.google.com/rss/search?q=(${encodeURIComponent(chineseTechDomains)})+(${encodeURIComponent(techKeywords)})+when:7d&hl=en-US&gl=US&ceid=US:en`;
    chinaTechPromises.push(
      fetchRssFeed(searchUrlEn, 'Asia', 'Chinese Tech Monitor', 'CN', 'en', false)
    );

    // Global coverage of Chinese technology advancement
    const intlTechSearch = `("China" OR "Chinese")+("semiconductor" OR "AI model" OR "robotics" OR "BYD" OR "Huawei" OR "SMIC" OR "CATL" OR "quantum computing" OR "Tiangong" OR "DeepSeek")+when:7d`;
    const intlSearchUrl = `https://news.google.com/rss/search?q=(${encodeURIComponent(intlTechSearch)})&hl=en-US&gl=US&ceid=US:en`;
    chinaTechPromises.push(
      fetchRssFeed(intlSearchUrl, 'Asia', 'Global China Tech Coverage', 'CN', 'en', false)
    );

    if (langKey === 'fr') {
      const frTechSearch = `(Chine OR chinois)+("intelligence artificielle" OR "semi-conducteur" OR "robotique" OR "véhicule électrique" OR "batterie" OR "Huawei" OR "BYD" OR "spatial" OR "quantique")+when:7d`;
      const frSearchUrl = `https://news.google.com/rss/search?q=(${encodeURIComponent(frTechSearch)})&hl=fr&gl=FR&ceid=FR:fr`;
      chinaTechPromises.push(
        fetchRssFeed(frSearchUrl, 'Asia', 'Veille Tech Chine', 'CN', 'fr', false)
      );
    }

    const nested = await Promise.all(chinaTechPromises);
    const flat = nested.flat().map((art) => {
      const meta = getOutletMetadata(art.publisher, art.link);
      const isDomesticChinese =
        meta.publisherCountry === 'CN' ||
        art.publisherCountry === 'CN' ||
        isOutletLocalToCountry(art.publisher, 'CN', art.link);

      return {
        ...art,
        topicInterest: 'china-tech' as const,
        countryCode: 'CN',
        countryName: 'China',
        region: 'Asia' as Region,
        isDomestic: Boolean(isDomesticChinese),
        isLocalPublisher: Boolean(isDomesticChinese),
        sourceOrigin: isDomesticChinese ? ('local' as const) : ('international' as const),
        ownership: meta.ownership,
        ownershipCategory: meta.ownershipCategory,
        editorialIndependence: meta.editorialIndependence,
        factualReliability: meta.factualReliability,
        politicalPerspective: meta.politicalPerspective,
      };
    });

    const deduped = deduplicateAndClusterArticles(flat);
    deduped.sort((a, b) => (b.importanceScore || 0) - (a.importanceScore || 0));

    cachedData = deduped;
    memoryCache.set(cacheKey, { timestamp: Date.now(), data: cachedData });
  }

  let articles = cachedData;
  if (subtopic && subtopic !== 'all' && typeof subtopic === 'string') {
    const subQ = subtopic.toLowerCase();
    articles = articles.filter((a) =>
      a.title.toLowerCase().includes(subQ) || (a.summary && a.summary.toLowerCase().includes(subQ))
    );
  }

  res.json({
    topic: 'china-tech',
    title: langKey === 'fr' ? 'Technologie et innovation en Chine' : 'China Technology & Innovation',
    articles,
    total: articles.length,
    cachedAt: new Date().toISOString(),
  });
});

// 2b. GET /api/outlets/:code - Verified publisher directory for a country
app.get('/api/outlets/:code', (req: Request, res: Response) => {
  const code = (req.params.code || '').toUpperCase();
  const country = getCountryByCode(code);
  if (!country) {
    res.status(404).json({ error: 'Country not found' });
    return;
  }
  const outlets = getOutletsForCountry(code);
  res.json({ country, outlets, total: outlets.length });
});

// 2c. POST /api/translate - High-fidelity in-app translation endpoint
app.post('/api/translate', async (req: Request, res: Response) => {
  const { title = '', summary = '', targetLang = 'en' } = req.body;
  if (!title || typeof title !== 'string') {
    res.status(400).json({ error: 'Title is required' });
    return;
  }

  const tLang = targetLang === 'fr' ? 'fr' : 'en';
  const cacheKey = `trans_${tLang}_${crypto.createHash('md5').update(`${title}|${summary}`).digest('hex')}`;

  if (memoryCache.has(cacheKey)) {
    res.json(memoryCache.get(cacheKey)!.data);
    return;
  }

  try {
    const translateText = async (text: string) => {
      if (!text || !text.trim()) return '';
      const gtxUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${tLang}&dt=t&q=${encodeURIComponent(text)}`;
      const gtxRes = await fetch(gtxUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: '*/*',
        },
      });
      if (!gtxRes.ok) return text;
      const json = await gtxRes.json();
      if (Array.isArray(json) && Array.isArray(json[0])) {
        return json[0].map((part: any) => part[0]).join('');
      }
      return text;
    };

    const [translatedTitle, translatedSummary] = await Promise.all([
      translateText(title),
      summary ? translateText(summary) : Promise.resolve(''),
    ]);

    const result = {
      originalTitle: title,
      originalSummary: summary,
      translatedTitle: translatedTitle || title,
      translatedSummary: translatedSummary || summary,
      targetLang: tLang,
      isTranslated: true,
    };

    memoryCache.set(cacheKey, { timestamp: Date.now(), data: result });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Translation failed', details: err.message });
  }
});

// 3. GET /api/news/compare - Multi-perspective coverage search
app.get('/api/news/compare', async (req: Request, res: Response) => {
  const { q = '', lang = 'en' } = req.query;
  const queryStr = (q as string).trim();

  if (!queryStr) {
    res.status(400).json({ error: 'Query parameter q is required' });
    return;
  }

  const cacheKey = `compare_${encodeURIComponent(queryStr)}_${lang}`;
  if (memoryCache.has(cacheKey)) {
    const cached = memoryCache.get(cacheKey)!;
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      res.json({ articles: cached.data });
      return;
    }
  }

  const encodedQuery = encodeURIComponent(queryStr.substring(0, 80));
  const url =
    lang === 'fr'
      ? `https://news.google.com/rss/search?q=${encodedQuery}+when:7d&hl=fr&gl=FR&ceid=FR:fr`
      : `https://news.google.com/rss/search?q=${encodedQuery}+when:7d&hl=en-US&gl=US&ceid=US:en`;

  const items = await fetchRssFeed(url, 'Europe', 'International Desk', 'US', lang as string);

  // Group by distinct publishers
  const byPublisher = new Map<string, NewsArticle>();
  for (const item of items) {
    if (!byPublisher.has(item.publisher)) {
      byPublisher.set(item.publisher, item);
    }
  }

  const results = Array.from(byPublisher.values());
  memoryCache.set(cacheKey, { timestamp: Date.now(), data: results });

  res.json({ query: queryStr, articles: results });
});

// 4. GET /api/diagnostics/pipeline - Data integrity and geographic classification metrics
app.get('/api/diagnostics/pipeline', async (req: Request, res: Response) => {
  const { lang = 'en', refresh = 'false' } = req.query;
  const langKey = lang === 'fr' ? 'fr' : 'en';
  const cacheKey = `briefing_all_regions_${langKey}`;

  let diagnostics: PipelineDiagnostics | undefined = undefined;

  if (refresh !== 'true' && memoryCache.has(cacheKey)) {
    const cached = memoryCache.get(cacheKey)!;
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      diagnostics = cached.data.pipelineDiagnostics;
    }
  }

  if (!diagnostics) {
    try {
      const result = await buildAggregatedNews(langKey);
      memoryCache.set(cacheKey, {
        timestamp: Date.now(),
        data: result,
      });
      diagnostics = result.pipelineDiagnostics;
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to evaluate pipeline diagnostics', details: err.message });
      return;
    }
  }

  res.json({
    status: 'ok',
    language: langKey,
    diagnostics,
  });
});

// 5. GET /api/health - Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// --- Server & Vite Mounting ---
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Morning Atlas] Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Morning Atlas] Failed to start server:', err);
});
