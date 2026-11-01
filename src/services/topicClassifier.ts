import { TopicInterest, TopicPriority, TopicPreferenceMap, DEFAULT_TOPIC_PREFERENCES, NewsArticle, NewsCategory } from '../types';

/**
 * Subject-based topic scoring profiles.
 * Each keyword or pattern has a specific weight.
 * Uses bilingual English and French signals.
 */

// 1. CHINA TECH ADVANCEMENT — Special Priority
const CHINA_TECH_PATTERNS = [
  // China + Technology combos
  /\b(china|chinese|beijing|shenzhen|shanghai|tsinghua|fudan|cas|cnsa|byd|huawei|smic|catl|xiaomi|tencent|baidu|alibaba|dji|zte|nio|xpeng|geely|deepseek|moonshot|zhipu|baichuan|origin quantum)\b/i,
];

const CHINA_TECH_KEYWORDS = [
  'semiconductor', 'chipmaker', 'wafer', 'lithography', 'euv', 'duv', 'smic',
  'artificial intelligence', 'ai model', 'llm', 'generative ai', 'neural',
  'robotics', 'humanoid robot', 'automation', 'industrial robot',
  'electric vehicle', 'ev battery', 'ev sales', 'catl', 'byd', 'blade battery',
  'high-speed rail', 'bullet train', 'maglev', 'crrc',
  'telecom', '5g', '6g', 'quantum computing', 'quantum communication',
  'tiangong', 'space station', 'chang\'e', 'lunar rover', 'long march rocket',
  'solar manufacturing', 'photovoltaic', 'solar cell', 'clean energy manufacturing',
  'tech war', 'chip sanctions', 'export control', 'tech competition', 'advanced manufacturing',
  'supercomputer', 'taiwan strait tech', 'science and technology daily'
];

// 2. AI & ADVANCED TECHNOLOGY
const AI_TECH_KEYWORDS = [
  'artificial intelligence', 'machine learning', 'deep learning', 'large language model',
  'llm', 'neural network', 'chatgpt', 'openai', 'anthropic', 'generative ai', 'robotics',
  'autonomous', 'humanoid', 'semiconductor', 'microchip', 'foundry', 'nvidia', 'tsmc',
  'quantum computer', 'quantum computing', 'quantum supremacy', 'supercomputing',
  'telecommunications', '6g network', 'aerospace', 'space exploration', 'satellite constellation',
  'nanotechnology', 'advanced manufacturing', 'automation', 'cybersecurity', 'algorithm',
  'intelligence artificielle', 'semi-conducteur', 'robotique', 'ordinateur quantique',
  'calcul quantique', 'modèle de langage', 'télécommunications'
];

// 3. RENEWABLE ENERGY & CLEAN TECH
const RENEWABLE_ENERGY_KEYWORDS = [
  'renewable energy', 'solar power', 'photovoltaic', 'solar panels', 'wind farm',
  'offshore wind', 'wind turbine', 'battery storage', 'grid storage', 'energy transition',
  'nuclear energy', 'nuclear fusion', 'small modular reactor', 'clean energy', 'smart grid',
  'green hydrogen', 'electric grid', 'decarbonization', 'clean power', 'energy efficiency',
  'énergie renouvelable', 'énergie solaire', 'panneaux solaires', 'éolien', 'éolienne',
  'batterie', 'stockage d\'énergie', 'fusion nucléaire', 'transition énergétique',
  'hydrogène vert', 'réseau électrique'
];

// 4. AGRICULTURE & FOOD SECURITY
const AGRICULTURE_KEYWORDS = [
  'agriculture', 'farming', 'food security', 'crop yield', 'agritech', 'smart farming',
  'mechanization', 'irrigation', 'fertilizer', 'drought-resistant', 'grain harvest',
  'wheat production', 'rice cultivation', 'livestock', 'agroforestry', 'food supply chain',
  'sustainable agriculture', 'famine prevention', 'fao', 'soil health',
  'sécurité alimentaire', 'agricole', 'récolte', 'irrigation', 'engrais', 'rendement agricole',
  'mécanisation agricole', 'production céréalière', 'élevage', 'fao'
];

// 5. GEOPOLITICS & INTERNATIONAL RELATIONS
const GEOPOLITICS_KEYWORDS = [
  'geopolitics', 'international relations', 'diplomacy', 'diplomatic', 'foreign policy',
  'summit', 'bilateral talks', 'multilateral', 'treaty', 'accord', 'un security council',
  'united nations', 'general assembly', 'peacekeeping', 'ceasefire', 'sanctions',
  'sovereignty', 'territorial dispute', 'border dispute', 'g7', 'g20', 'brics',
  'nato', 'african union', 'asean', 'european union', 'arab league', 'geopolitical',
  'tensions', 'embassy', 'ambassador', 'arms treaty', 'non-proliferation', 'deterrence',
  'géopolitique', 'relations internationales', 'diplomatie', 'conseil de sécurité',
  'nations unies', 'traité', 'sanctions internationales', 'sommet', 'souveraineté',
  'otan', 'union africaine'
];

// 6. POLITICS & GOVERNMENT
const POLITICS_KEYWORDS = [
  'parliament', 'prime minister', 'president', 'cabinet', 'election', 'voting',
  'legislature', 'legislation', 'supreme court', 'constitutional reform', 'government policy',
  'public administration', 'referendum', 'coalition government', 'opposition party',
  'head of state', 'minister of', 'governor', 'statute', 'regulatory approval',
  'parlement', 'premier ministre', 'président', 'élection', 'gouvernement',
  'législatif', 'cour suprême', 'référendum', 'coalition', 'politique publique'
];

// 7. NATIONAL ECONOMIES & DEVELOPMENT
const ECONOMY_KEYWORDS = [
  'gdp growth', 'inflation rate', 'central bank', 'interest rate', 'monetary policy',
  'macroeconomic', 'fiscal policy', 'sovereign debt', 'currency exchange', 'trade deficit',
  'trade surplus', 'tariff', 'world bank', 'imf', 'wto', 'economic growth',
  'infrastructure investment', 'industrial policy', 'unemployment rate', 'job growth',
  'productivity', 'emerging market', 'african economic', 'croissance pib', 'taux d\'inflation',
  'banque centrale', 'taux d\'intérêt', 'politique monétaire', 'dette souveraine',
  'commerce extérieur', 'investissements d\'infrastructure'
];

// 8. SCIENCE & DISCOVERIES
const SCIENCE_KEYWORDS = [
  'scientific discovery', 'physicists', 'particle physics', 'biotechnology',
  'genetic engineering', 'crispr', 'astronomy', 'astrophysics', 'james webb',
  'deep space', 'exoplanet', 'materials science', 'superconductor', 'chemistry',
  'medical breakthrough', 'clinical trial', 'vaccine research', 'neuroscience',
  'paleontology', 'genome', 'scientific journal', 'decouverte scientifique',
  'physique quantique', 'biotechnologie', 'astronomie', 'essai clinique',
  'recherche médicale', 'génome'
];

// 9. SPORTS (Unwanted by default)
const SPORTS_CORE_SUBJECTS = [
  'football match', 'soccer match', 'premier league', 'champions league', 'la liga',
  'serie a', 'bundesliga', 'world cup qualifier', 'fifa', 'uefa', 'nba game',
  'basketball tournament', 'nfl touchdown', 'quarterback', 'super bowl',
  'tennis grand slam', 'wimbledon', 'roland garros', 'us open tennis', 'australian open',
  'formula 1', 'grand prix', 'podium finish', 'olympic games', 'olympic medal',
  'marathon runner', 'half-marathon', 'triathlon', 'boxing match', 'ufc fight',
  'cricket test', 'rugby championship', 'matchday', 'penalty shootout', 'scored a goal',
  'hat-trick', 'transfer fee', 'relegation zone', 'fixture list', 'league table',
  'match de football', 'ligue des champions', 'coupe du monde', 'tournoi de tennis',
  'jeux olympiques', 'athlétisme', 'podium', 'classement du championnat'
];

// 10. ENTERTAINMENT & CELEBRITY GOSSIP (Unwanted by default)
const ENTERTAINMENT_CORE_SUBJECTS = [
  'celebrity romance', 'dating rumors', 'red carpet fashion', 'hollywood premiere',
  'box office gross', 'movie trailer', 'tv series finale', 'reality tv star',
  'influencer drama', 'pop star concert', 'music album release', 'grammy awards',
  'oscar nominations', 'academy awards', 'cannes film festival', 'film review',
  'album review', 'paparazzi', 'celebrity wedding', 'soap opera', 'gossip columnist',
  'tapis rouge', 'célébrité', 'rumeurs de couple', 'box-office', 'festival de cannes',
  'remise des prix', 'star de télé-réalité'
];

/**
 * Accurately detects the primary topic of an article based on its actual subject matter.
 * Uses weighted scoring to prevent accidental keyword collisions.
 */
export function classifyArticleTopic(
  title: string,
  summary: string = '',
  category?: NewsCategory,
  countryCode?: string
): TopicInterest {
  const text = `${title} ${summary}`.toLowerCase();
  const titleLower = title.toLowerCase();

  // 1. Check for Sports: must be the PRIMARY theme of the article
  let sportsScore = 0;
  for (const phrase of SPORTS_CORE_SUBJECTS) {
    if (titleLower.includes(phrase)) sportsScore += 8;
    else if (text.includes(phrase)) sportsScore += 3;
  }
  if (category === 'Sports') sportsScore += 10;

  // 2. Check for Entertainment: must be the PRIMARY theme of the article
  let entertainmentScore = 0;
  for (const phrase of ENTERTAINMENT_CORE_SUBJECTS) {
    if (titleLower.includes(phrase)) entertainmentScore += 8;
    else if (text.includes(phrase)) entertainmentScore += 3;
  }
  if (category === 'Culture' && (text.includes('star') || text.includes('celebrity') || text.includes('actor') || text.includes('gossip'))) {
    entertainmentScore += 6;
  }

  // 3. Check for China Tech
  let chinaTechScore = 0;
  const isChinaRelated = countryCode === 'CN' || CHINA_TECH_PATTERNS.some((p) => p.test(text));
  if (isChinaRelated) {
    for (const kw of CHINA_TECH_KEYWORDS) {
      if (titleLower.includes(kw)) chinaTechScore += 6;
      else if (text.includes(kw)) chinaTechScore += 2;
    }
    // High boost if China is involved in technology, chip, EV, AI, or space
    if (chinaTechScore >= 4 || (countryCode === 'CN' && (category === 'Technology' || category === 'Science'))) {
      chinaTechScore += 8;
    }
  }

  // 4. Check for AI & Advanced Tech
  let aiTechScore = 0;
  for (const kw of AI_TECH_KEYWORDS) {
    if (titleLower.includes(kw)) aiTechScore += 5;
    else if (text.includes(kw)) aiTechScore += 2;
  }
  if (category === 'Technology') aiTechScore += 4;

  // 5. Check for Renewable Energy & Clean Tech
  let renewableScore = 0;
  for (const kw of RENEWABLE_ENERGY_KEYWORDS) {
    if (titleLower.includes(kw)) renewableScore += 6;
    else if (text.includes(kw)) renewableScore += 2;
  }
  if (category === 'Environment' && (text.includes('solar') || text.includes('wind') || text.includes('grid') || text.includes('nuclear') || text.includes('clean'))) {
    renewableScore += 6;
  }

  // 6. Check for Agriculture & Food Security
  let agricultureScore = 0;
  for (const kw of AGRICULTURE_KEYWORDS) {
    if (titleLower.includes(kw)) agricultureScore += 6;
    else if (text.includes(kw)) agricultureScore += 2;
  }

  // 7. Check for Geopolitics
  let geopoliticsScore = 0;
  for (const kw of GEOPOLITICS_KEYWORDS) {
    if (titleLower.includes(kw)) geopoliticsScore += 5;
    else if (text.includes(kw)) geopoliticsScore += 2;
  }

  // 8. Check for Politics & Government
  let politicsScore = 0;
  for (const kw of POLITICS_KEYWORDS) {
    if (titleLower.includes(kw)) politicsScore += 4;
    else if (text.includes(kw)) politicsScore += 2;
  }
  if (category === 'Politics') politicsScore += 4;

  // 9. Check for Economy
  let economyScore = 0;
  for (const kw of ECONOMY_KEYWORDS) {
    if (titleLower.includes(kw)) economyScore += 5;
    else if (text.includes(kw)) economyScore += 2;
  }
  if (category === 'Economy') economyScore += 4;

  // 10. Check for Science
  let scienceScore = 0;
  for (const kw of SCIENCE_KEYWORDS) {
    if (titleLower.includes(kw)) scienceScore += 5;
    else if (text.includes(kw)) scienceScore += 2;
  }
  if (category === 'Science') scienceScore += 4;

  // Subject-based guard: If an article mentions an athlete or game as a secondary example
  // but scores much higher in AI, Manufacturing, or Politics, DO NOT classify it as sports!
  const nonSportsMax = Math.max(
    chinaTechScore,
    aiTechScore,
    renewableScore,
    agricultureScore,
    geopoliticsScore,
    politicsScore,
    economyScore,
    scienceScore
  );

  if (sportsScore > 0 && nonSportsMax >= sportsScore) {
    sportsScore = 0; // Peripheral sports reference overridden by core substantive subject
  }

  if (entertainmentScore > 0 && nonSportsMax >= entertainmentScore) {
    entertainmentScore = 0; // Peripheral celebrity reference overridden
  }

  // Determine top-scoring topic
  const candidates: { topic: TopicInterest; score: number }[] = [
    { topic: 'china-tech', score: chinaTechScore },
    { topic: 'ai-advanced-tech', score: aiTechScore },
    { topic: 'renewable-energy', score: renewableScore },
    { topic: 'agriculture', score: agricultureScore },
    { topic: 'geopolitics', score: geopoliticsScore },
    { topic: 'politics', score: politicsScore },
    { topic: 'economy', score: economyScore },
    { topic: 'science', score: scienceScore },
    { topic: 'sports', score: sportsScore },
    { topic: 'entertainment', score: entertainmentScore },
  ];

  candidates.sort((a, b) => b.score - a.score);

  if (candidates[0].score >= 3) {
    return candidates[0].topic;
  }

  // Fallback to Category inference
  if (category === 'Politics') return 'politics';
  if (category === 'Economy') return 'economy';
  if (category === 'Technology') return 'ai-advanced-tech';
  if (category === 'Science') return 'science';
  if (category === 'Environment') return 'renewable-energy';
  if (category === 'Sports') return 'sports';
  if (category === 'Culture') return 'entertainment';

  return 'geopolitics'; // Default to international relations / geopolitics
}

/**
 * Checks if a topic is marked as 'excluded' by the user's preference map.
 */
export function isTopicExcluded(topic: TopicInterest, preferences: TopicPreferenceMap = DEFAULT_TOPIC_PREFERENCES): boolean {
  return preferences[topic] === 'excluded';
}

/**
 * Filters out articles whose classified topic is marked as 'excluded' in user preferences.
 * By default, Sports and Entertainment are strictly excluded across the entire application.
 */
export function filterExcludedArticles(
  articles: NewsArticle[],
  preferences: TopicPreferenceMap = DEFAULT_TOPIC_PREFERENCES
): NewsArticle[] {
  if (!articles || articles.length === 0) return [];
  return articles.filter((article) => {
    const topic = article.topicInterest || classifyArticleTopic(article.title, article.summary, article.category, article.countryCode);
    return preferences[topic] !== 'excluded';
  });
}
