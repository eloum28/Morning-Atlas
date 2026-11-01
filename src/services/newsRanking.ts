import { NewsArticle, TopicPreferenceMap, DEFAULT_TOPIC_PREFERENCES } from '../types';
import { classifyArticleTopic } from './topicClassifier';

// High-impact geopolitical, diplomatic, macroeconomic, and humanitarian keywords that elevate international reporting
const HIGH_IMPACT_DIPLOMACY_GOVERNANCE = [
  'summit', 'treaty', 'accord', 'ceasefire', 'diplomacy', 'diplomatic',
  'sanction', 'sanctions', 'united nations', 'security council', 'peace talks',
  'sovereignty', 'ambassador', 'consortium', 'brics', 'g7', 'g20',
  'election', 'parliament', 'prime minister', 'president', 'cabinet', 'head of state',
  'constitutional', 'supreme court', 'coalition', 'referendum'
];

const HIGH_IMPACT_ECONOMY_TRADE = [
  'trade agreement', 'tariff', 'tariffs', 'inflation', 'central bank',
  'interest rate', 'gdp', 'sovereign debt', 'currency crisis', 'recession',
  'macroeconomic', 'monetary policy', 'wto', 'world bank', 'imf'
];

const HIGH_IMPACT_HUMANITARIAN_CONFLICT = [
  'humanitarian', 'refugees', 'displaced', 'famine', 'aid convoy',
  'international court', 'war crime', 'casualty', 'hostage release', 'ceasefire violations',
  'epidemic', 'pandemic', 'who emergency'
];

const HIGH_IMPACT_CLIMATE_SCIENCE = [
  'climate accord', 'paris agreement', 'cop28', 'cop29', 'cop30', 'unfccc',
  'emissions target', 'renewable transition', 'global warming', 'loss and damage fund',
  'space mission', 'telescope discovery', 'nuclear fusion', 'quantum computing breakthrough'
];

// Low-impact routine keywords (entertainment, celebrity gossip, routine sports matches) that demote a story
const ROUTINE_ENTERTAINMENT_SPORTS = [
  'darts', 'fallon sherrock', 'pdc', 'marathon', 'triathlon', 'hypoxic',
  'box office', 'celebrity', 'red carpet', 'dating rumors', 'actor', 'actress',
  'premier league', 'champions league', 'matchday', 'vs', 'scored', 'penalty',
  'quarter-final', 'semi-final', 'finalist', 'trophy', 'nba', 'nfl', 'transfer fee',
  'derby', 'horoscope', 'trailer', 'grammy', 'oscar nomination', 'pop star'
];

/**
 * Calculates a transparent editorial importance score for an article.
 * Higher score = higher priority in the morning international briefing.
 * Incorporates personalized topic preferences, geopolitical salience, and verified credibility.
 * Returns -1 if the article topic is explicitly excluded by the user.
 */
export function calculateImportanceScore(
  article: Partial<NewsArticle>,
  preferences: TopicPreferenceMap = DEFAULT_TOPIC_PREFERENCES
): number {
  const text = `${article.title || ''} ${article.summary || ''}`.toLowerCase();
  
  // 0. Detect and evaluate Topic Interest
  const topic = article.topicInterest || classifyArticleTopic(article.title || '', article.summary, article.category, article.countryCode);
  article.topicInterest = topic;

  const priority = preferences[topic] || 'normal';

  // Strict exclusion: completely drops the story so it never appears in briefings, regions, or player
  if (priority === 'excluded') {
    return -1;
  }

  let score = 50; // Neutral base score

  // Topic Priority Multipliers
  switch (priority) {
    case 'very-high':
      score += 80; // Dominant boost for Geopolitics, Politics, AI, China Tech
      break;
    case 'high':
      score += 45; // Substantial boost for Economy, Science, Renewables, Agriculture
      break;
    case 'normal':
      score += 10;
      break;
    case 'low':
      score -= 25;
      break;
  }

  // 1. Core Category Weight
  switch (article.category) {
    case 'Politics':
      score += 25;
      break;
    case 'Economy':
      score += 20;
      break;
    case 'Environment':
      score += 18;
      break;
    case 'Health':
      score += 15;
      break;
    case 'Science':
      score += 14;
      break;
    case 'Technology':
      score += 18;
      break;
    case 'Society':
      score += 10;
      break;
    case 'Culture':
      score += 2;
      break;
    case 'Sports':
      // Demoted if not excluded
      score -= 50;
      break;
    default:
      score += 5;
  }

  // 2. Geopolitical and Multilateral Salience
  if (article.isMultilateral) {
    score += 12; // True multilateral diplomacy / treaty events
  }

  let highImpactMatched = false;
  for (const kw of HIGH_IMPACT_DIPLOMACY_GOVERNANCE) {
    if (text.includes(kw)) {
      score += 7;
      highImpactMatched = true;
      break;
    }
  }

  for (const kw of HIGH_IMPACT_ECONOMY_TRADE) {
    if (text.includes(kw)) {
      score += 6;
      highImpactMatched = true;
      break;
    }
  }

  for (const kw of HIGH_IMPACT_HUMANITARIAN_CONFLICT) {
    if (text.includes(kw)) {
      score += 7;
      highImpactMatched = true;
      break;
    }
  }

  for (const kw of HIGH_IMPACT_CLIMATE_SCIENCE) {
    if (text.includes(kw)) {
      score += 5;
      highImpactMatched = true;
      break;
    }
  }

  // 3. Routine Sports & Celebrity Demotion
  for (const kw of ROUTINE_ENTERTAINMENT_SPORTS) {
    if (text.includes(kw)) {
      score -= 30;
      break;
    }
  }

  // 4. Source Credibility & Documented Reliability
  if (article.factualReliability === 'Very High') {
    score += 8;
  } else if (article.factualReliability === 'High') {
    score += 5;
  } else if (article.factualReliability === 'Mixed') {
    score -= 12;
  }

  if (article.editorialIndependence === 'Assessed Independent') {
    score += 4;
  } else if (article.editorialIndependence === 'State-Controlled / State-Affiliated') {
    score -= 6;
  }

  // 5. Reporting vs Opinion Distinction: factual news reporting prioritized for lead briefing
  if (article.isOpinion) {
    score -= 10;
  }

  // 6. Corroborating Coverage Availability
  // Articles confirmed by multiple independent newsrooms receive higher priority
  if (article.relatedCount && article.relatedCount > 0) {
    score += Math.min(15, article.relatedCount * 5);
  }

  // 7. Verified Geographic Subject Confidence
  if (article.classificationConfidence === 'high') {
    score += 5;
  } else if (article.classificationConfidence === 'unclassified') {
    score -= 8;
  }

  // 8. Timeliness (Strictly based on verified pubDate)
  if (article.pubDate) {
    try {
      const pubTime = new Date(article.pubDate).getTime();
      if (!isNaN(pubTime)) {
        const ageHours = (Date.now() - pubTime) / (1000 * 60 * 60);
        if (ageHours <= 8) {
          score += 12;
        } else if (ageHours <= 24) {
          score += 8;
        } else if (ageHours <= 48) {
          score += 4;
        } else if (ageHours > 72) {
          score -= 10;
        }
      }
    } catch {
      // Neutral if date cannot be parsed reliably
    }
  }

  return Math.max(0, score);
}

/**
 * Normalizes text, maps bilingual French/English concepts, and stems common suffixes.
 */
function normalizeEventTokens(text: string): { tokens: Set<string>; entities: Set<string> } {
  const stopWords = new Set([
    'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'with',
    'by', 'from', 'as', 'is', 'are', 'was', 'were', 'it', 'its', 'has', 'have',
    'had', 'will', 'be', 'after', 'over', 'new', 'says', 'amid', 'into', 'out',
    'about', 'more', 'all', 'any', 'could', 'should', 'would', 'also', 'than',
    'le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'en', 'et', 'au', 'aux',
    'sur', 'pour', 'par', 'dans', 'qui', 'que', 'son', 'sa', 'ses', 'est', 'sont',
    'avec', 'ce', 'cet', 'cette', 'ces', 'mais', 'ou', 'donc', 'or', 'ni', 'car',
    'plus', 'vers', 'sans', 'sous', 'leur', 'leurs', 'comme', 'après'
  ]);

  // Concept mapping between French and English for cross-lingual alignment
  const normalized = text.toLowerCase()
    .replace(/conseil de sécurité/g, 'security council')
    .replace(/sahara occidental/g, 'western sahara')
    .replace(/cessez-le-feu/g, 'ceasefire')
    .replace(/détroit d['’]ormuz/g, 'strait of hormuz')
    .replace(/détroit de bab-el-mandeb/g, 'bab el-mandeb')
    .replace(/pétrolier/g, 'tanker')
    .replace(/pape/g, 'pope')
    .replace(/pontife/g, 'pontiff')
    .replace(/scrutin/g, 'vote')
    .replace(/élection[s]?/g, 'election')
    .replace(/résolution[s]?/g, 'resolution')
    .replace(/mandat/g, 'mandate')
    .replace(/marée noire/g, 'oil spill')
    .replace(/accord[s]?/g, 'agreement')
    .replace(/sommet/g, 'summit')
    .replace(/naufrage/g, 'shipwreck');

  // Specific high-salience named entities & event anchors
  const entities = new Set<string>();
  const entityPatterns: [RegExp, string][] = [
    [/\bminurso\b|\bwestern sahara.*security council\b|\bsecurity council.*western sahara\b|\bconseil de sécurité.*sahara occidental\b/i, 'minurso_unsc_ws'],
    [/\bpolisario\b/i, 'polisario'],
    [/\bpope leo xiv\b|\bpope leo\b|\bleo xiv\b/i, 'pope_leo_xiv'],
    [/\b(strait of hormuz|détroit d['’]ormuz|hormuz|ormuz)\b/i, 'hormuz_strait'],
    [/\bnaval mine\b|\bsea mine\b|\bmines? marines?\b/i, 'naval_mine'],
    [/\btalarico\b/i, 'talarico'],
    [/\bdenucleariz(ation|e)\b|\bdénucléaris/i, 'denuclearization'],
  ];

  for (const [pattern, key] of entityPatterns) {
    if (pattern.test(normalized)) {
      entities.add(key);
    }
  }

  // Tokenization & lightweight suffix stemming
  const words = normalized
    .replace(/[^a-z0-9àâäéèêëîïôöùûüçñ\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w))
    .map((w) => {
      // Basic stemming to collapse plurals, past tense, gerunds
      return w
        .replace(/(ing|ed|es|s|tion|ment|ement)$/, '')
        .replace(/(er|ée|és|ées)$/, '');
    })
    .filter((w) => w.length > 2 && !stopWords.has(w));

  return { tokens: new Set(words), entities };
}

/**
 * Computes Jaccard similarity between two token sets.
 */
function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Determines whether two articles cover the exact same underlying news event development.
 * Never merges unrelated events merely because they share country names or general keywords.
 */
export function isSameEvent(a: NewsArticle, b: NewsArticle): boolean {
  // 1. Same exact URL or ID
  if (a.id === b.id || (a.link && b.link && a.link === b.link)) {
    return true;
  }

  // 2. Publication Date Check: Same event stories generally fall within a 96-hour window
  if (a.pubDate && b.pubDate) {
    const timeA = new Date(a.pubDate).getTime();
    const timeB = new Date(b.pubDate).getTime();
    if (!isNaN(timeA) && !isNaN(timeB)) {
      const diffHours = Math.abs(timeA - timeB) / (1000 * 60 * 60);
      if (diffHours > 96) {
        return false; // Out of temporal event window
      }
    }
  }

  // 3. Geographic Boundary Check:
  // Distinct regions CANNOT be the same event unless one is Global or they share secondary regions
  if (
    a.region !== b.region &&
    a.region !== 'Global' &&
    b.region !== 'Global'
  ) {
    const aRelated = a.relatedRegions || [];
    const bRelated = b.relatedRegions || [];
    const crossRegionalLink = aRelated.includes(b.region) || bRelated.includes(a.region);
    if (!crossRegionalLink) {
      return false;
    }
  }

  // 4. Country / Sovereign State Incompatibility
  // If both have confident primary country codes, they must be geographically compatible
  if (
    a.countryCode &&
    b.countryCode &&
    a.countryCode !== b.countryCode &&
    a.classificationConfidence !== 'unclassified' &&
    b.classificationConfidence !== 'unclassified'
  ) {
    // Check if one country is listed as secondary or involved in the other article
    const aInvolved = new Set([a.countryCode, ...(a.involvedCountries || []).map((c) => c.code)]);
    const bInvolved = new Set([b.countryCode, ...(b.involvedCountries || []).map((c) => c.code)]);
    let hasSharedCountry = false;
    for (const code of aInvolved) {
      if (bInvolved.has(code)) {
        hasSharedCountry = true;
        break;
      }
    }
    // If no shared country anchor and neither is multilateral, they cannot be the same event
    if (!hasSharedCountry && !a.isMultilateral && !b.isMultilateral) {
      return false;
    }
  }

  // 5. Unclassified isolation: generic non-geographic stories should never merge across categories
  if (
    (a.region === 'Unclassified' || b.region === 'Unclassified') &&
    a.region !== b.region
  ) {
    return false;
  }

  // 6. Token & Entity Overlap Analysis
  const normA = normalizeEventTokens(`${a.title} ${a.summary || ''}`);
  const normB = normalizeEventTokens(`${b.title} ${b.summary || ''}`);

  // Count shared named entities
  let sharedEntityCount = 0;
  for (const entity of normA.entities) {
    if (normB.entities.has(entity)) {
      sharedEntityCount++;
    }
  }

  // Count shared stemmed tokens
  let sharedTokenCount = 0;
  for (const token of normA.tokens) {
    if (normB.tokens.has(token)) {
      sharedTokenCount++;
    }
  }

  // Jaccard similarity on stemmed tokens
  const similarity = jaccardSimilarity(normA.tokens, normB.tokens);

  // Case A: High-specificity named event anchors (e.g. Minurso/Western Sahara, Pope Leo XIV, Hormuz naval mine)
  if (sharedEntityCount >= 1) {
    const sameCountry = a.countryCode && b.countryCode && a.countryCode === b.countryCode;
    const bothMultilateral = a.isMultilateral && b.isMultilateral;
    if (sameCountry || bothMultilateral) {
      return sharedTokenCount >= 3 && similarity >= 0.28;
    }
    return sharedTokenCount >= 4 && similarity >= 0.38;
  }

  // Case B: Same country with high thematic and narrative overlap
  if (a.countryCode && b.countryCode && a.countryCode === b.countryCode) {
    // Must have solid similarity (>= 0.48) and at least 4 shared words so distinct stories in the same country are NOT merged
    return sharedTokenCount >= 4 && similarity >= 0.48;
  }

  // Case C: Multilateral stories covering identical event
  if (a.isMultilateral && b.isMultilateral) {
    return sharedTokenCount >= 5 && similarity >= 0.52;
  }

  // Case D: Near-identical articles without country code
  return sharedTokenCount >= 5 && similarity >= 0.65;
}

/**
 * Deduplicates and clusters news articles covering the same underlying event development.
 * Selects one representative headline, counts distinct publications, attaches full attribution,
 * and eliminates duplicate event noise.
 */
export function deduplicateAndClusterArticles(articles: NewsArticle[]): NewsArticle[] {
  if (!articles || articles.length === 0) return [];

  // Strictly filter out any stories with negative score (i.e. excluded categories like Sports and Entertainment)
  const nonExcluded = articles.filter((a) => (a.importanceScore ?? 0) >= 0);
  if (nonExcluded.length === 0) return [];

  // Sort articles by importance score descending
  const sorted = [...nonExcluded].sort((a, b) => (b.importanceScore || 0) - (a.importanceScore || 0));

  interface EventCluster {
    primary: NewsArticle;
    related: NewsArticle[];
  }

  const clusters: EventCluster[] = [];

  for (const article of sorted) {
    let matchedCluster: EventCluster | null = null;

    for (const cluster of clusters) {
      if (isSameEvent(article, cluster.primary)) {
        matchedCluster = cluster;
        break;
      }
    }

    if (matchedCluster) {
      // Don't add exact duplicate URLs
      if (
        matchedCluster.primary.link !== article.link &&
        !matchedCluster.related.some((r) => r.link === article.link)
      ) {
        matchedCluster.related.push(article);
      }
    } else {
      clusters.push({
        primary: { ...article },
        related: [],
      });
    }
  }

  // Format primary articles with clustered related articles attached & distinct publications counted
  return clusters.map((cluster) => {
    const primary = cluster.primary;
    if (cluster.related.length > 0) {
      const distinctPublishers = new Set([
        primary.publisher,
        ...cluster.related.map((r) => r.publisher),
      ]);
      primary.relatedCount = distinctPublishers.size - 1;
      primary.relatedArticles = cluster.related.map((r) => ({
        id: r.id,
        title: r.title,
        publisher: r.publisher,
        publisherCountry: r.publisherCountry,
        link: r.link,
        pubDate: r.pubDate,
        summary: r.summary,
        countryName: r.countryName,
        countryCode: r.countryCode,
        politicalPerspective: r.politicalPerspective,
        factualReliability: r.factualReliability,
        editorialIndependence: r.editorialIndependence,
        isOpinion: r.isOpinion,
      }));
    } else {
      primary.relatedCount = 0;
      primary.relatedArticles = [];
    }
    return primary;
  });
}

/**
 * Reorders regional articles to ensure diverse country representation across headlines.
 * Prevents a single country or event from monopolizing all top spots for a continent.
 */
export function ensureRegionalDiversity(articles: NewsArticle[]): NewsArticle[] {
  if (!articles || articles.length <= 1) return articles;

  const countryBuckets = new Map<string, NewsArticle[]>();
  const unclassifiedArticles: NewsArticle[] = [];

  for (const a of articles) {
    const key = a.countryCode || 'NONE';
    if (key === 'NONE') {
      unclassifiedArticles.push(a);
    } else {
      const bucket = countryBuckets.get(key) || [];
      bucket.push(a);
      countryBuckets.set(key, bucket);
    }
  }

  // Round-robin selection across distinct countries
  const diverseList: NewsArticle[] = [];
  const entries = Array.from(countryBuckets.values());

  // Sort country buckets by the highest importance score of their top article
  entries.sort((a, b) => (b[0]?.importanceScore || 0) - (a[0]?.importanceScore || 0));

  let maxItems = 0;
  for (const bucket of entries) {
    maxItems = Math.max(maxItems, bucket.length);
  }

  // Pick top story from Country 1, Country 2, Country 3... then second stories
  for (let round = 0; round < maxItems; round++) {
    for (const bucket of entries) {
      if (round < bucket.length) {
        diverseList.push(bucket[round]);
      }
    }
  }

  // Append any non-country regional dispatches
  diverseList.push(...unclassifiedArticles);

  return diverseList;
}
