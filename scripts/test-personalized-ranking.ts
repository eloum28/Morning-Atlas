import { classifyArticleTopic, isTopicExcluded, filterExcludedArticles } from '../src/services/topicClassifier';
import { calculateImportanceScore, deduplicateAndClusterArticles } from '../src/services/newsRanking';
import { DEFAULT_TOPIC_PREFERENCES, NewsArticle, TopicPreferenceMap } from '../src/types';
import { getOutletMetadata, isOutletLocalToCountry } from '../src/data/outlets';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName}${details ? ` -> ${details}` : ''}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n--- 1. Testing Subject-Based Topic Classification & Keyword Resilience ---');

  // Test 1: AI in manufacturing mentioning athlete must NOT be classified as Sports!
  const article1 = {
    title: 'Robotics manufacturer trains humanoid factory workers using Olympic athlete motion capture models',
    summary: 'An advanced robotics firm automates automotive assembly using high-precision neural movement models inspired by sprinters.',
  };
  const topic1 = classifyArticleTopic(article1.title, article1.summary, 'Technology', 'US');
  assert(
    topic1 === 'ai-advanced-tech',
    'AI in manufacturing mentioning an athlete is classified as ai-advanced-tech, NOT sports',
    `Got topic: ${topic1}`
  );

  // Test 2: Actual sports match must be classified as Sports
  const article2 = {
    title: 'Arsenal edges Manchester City 2-1 in thrilling Premier League title showdown',
    summary: 'A late penalty kick secured three points in the championship race at Emirates Stadium.',
  };
  const topic2 = classifyArticleTopic(article2.title, article2.summary, 'Sports', 'GB');
  assert(topic2 === 'sports', 'Football match is classified as sports', `Got: ${topic2}`);

  // Test 3: Celebrity gossip is classified as entertainment
  const article3 = {
    title: 'Hollywood couple announces divorce after lavish red carpet award ceremony appearance',
    summary: 'Paparazzi spotted the actors leaving the gala separately amid ongoing dating rumors.',
  };
  const topic3 = classifyArticleTopic(article3.title, article3.summary, 'Culture', 'US');
  assert(topic3 === 'entertainment', 'Celebrity gossip is classified as entertainment', `Got: ${topic3}`);

  // Test 4: China Tech detection
  const article4 = {
    title: 'SMIC and Huawei announce breakthrough in 5nm semiconductor fabrication node in Shanghai',
    summary: 'China accelerates domestic lithography and chip manufacturing to offset Western export restrictions.',
  };
  const topic4 = classifyArticleTopic(article4.title, article4.summary, 'Technology', 'CN');
  assert(topic4 === 'china-tech', 'Chinese semiconductor development is classified as china-tech', `Got: ${topic4}`);

  // Test 5: Renewable Energy detection
  const article5 = {
    title: 'Massive solar and battery storage facility inaugurated in Moroccan desert',
    summary: 'The renewable energy project expands clean grid storage capacity and photovoltaic generation.',
  };
  const topic5 = classifyArticleTopic(article5.title, article5.summary, 'Environment', 'MA');
  assert(topic5 === 'renewable-energy', 'Solar & battery storage is classified as renewable-energy', `Got: ${topic5}`);

  // Test 6: Agriculture and Food Security
  const article6 = {
    title: 'Senegal deploys smart drip irrigation and drought-resilient grain farming in Sahel valley',
    summary: 'Modern agricultural mechanization and crop yield monitoring bolster national food security.',
  };
  const topic6 = classifyArticleTopic(article6.title, article6.summary, 'Economy', 'SN');
  assert(topic6 === 'agriculture', 'Smart farming in Senegal is classified as agriculture', `Got: ${topic6}`);

  // Test 7: Geopolitics & Diplomacy
  const article7 = {
    title: 'UN Security Council votes unanimously on peacekeeping mission renewal and regional ceasefire accord',
    summary: 'Diplomats from major powers finalize treaty negotiations after bilateral summit in Geneva.',
  };
  const topic7 = classifyArticleTopic(article7.title, article7.summary, 'Politics', 'CH');
  assert(topic7 === 'geopolitics', 'UN Security Council diplomacy is classified as geopolitics', `Got: ${topic7}`);

  console.log('\n--- 2. Testing Default Priority Exclusion (Sports & Entertainment Drop) ---');

  // Test 8: Sports and Entertainment excluded by default
  assert(
    DEFAULT_TOPIC_PREFERENCES.sports === 'excluded',
    'Sports preference is "excluded" by default',
    `Got: ${DEFAULT_TOPIC_PREFERENCES.sports}`
  );
  assert(
    DEFAULT_TOPIC_PREFERENCES.entertainment === 'excluded',
    'Entertainment preference is "excluded" by default',
    `Got: ${DEFAULT_TOPIC_PREFERENCES.entertainment}`
  );

  // Test 9: calculateImportanceScore returns -1 for excluded topics
  const sportsArt: Partial<NewsArticle> = {
    title: 'Champions League final preview: team tactics and key player statistics',
    summary: 'Both clubs prepare for Saturday showdown at Wembley.',
    category: 'Sports',
  };
  const sportsScore = calculateImportanceScore(sportsArt, DEFAULT_TOPIC_PREFERENCES);
  assert(sportsScore === -1, 'Excluded sports article receives negative score (-1) to drop it from ranking', `Got score: ${sportsScore}`);

  // Test 10: Very high priority topics receive large boost
  const aiArt: Partial<NewsArticle> = {
    title: 'Research consortium releases open-weights quantum computing algorithm model',
    summary: 'Breakthrough achieves 100x speedup in molecular simulation benchmarks.',
    category: 'Technology',
  };
  const aiScore = calculateImportanceScore(aiArt, DEFAULT_TOPIC_PREFERENCES);
  assert(aiScore > 130, 'Very High priority topic receives strong editorial boost (> 130)', `Got score: ${aiScore}`);

  // Test 11: filterExcludedArticles removes sports and entertainment from array
  const mixedArticles: NewsArticle[] = [
    {
      id: 'a1',
      title: 'Global trade ministers convene at WTO headquarters over tariff dispute',
      link: 'https://example.com/1',
      publisher: 'Reuters',
      region: 'Europe',
      language: 'en',
      category: 'Economy',
      pubDate: new Date().toISOString(),
      classificationConfidence: 'high',
    },
    {
      id: 'a2',
      title: 'Premier league star forward transfers for record 120 million fee',
      link: 'https://example.com/2',
      publisher: 'Sports Weekly',
      region: 'Europe',
      language: 'en',
      category: 'Sports',
      pubDate: new Date().toISOString(),
      classificationConfidence: 'high',
    },
    {
      id: 'a3',
      title: 'Reality TV star launches new cosmetic line amid red carpet controversy',
      link: 'https://example.com/3',
      publisher: 'Gossip Daily',
      region: 'North America',
      language: 'en',
      category: 'Culture',
      pubDate: new Date().toISOString(),
      classificationConfidence: 'high',
    },
    {
      id: 'a4',
      title: 'Chinese space program completes next module docking on Tiangong station',
      link: 'https://example.com/4',
      publisher: 'Xinhua News Agency',
      publisherCountry: 'CN',
      countryCode: 'CN',
      region: 'Asia',
      language: 'en',
      category: 'Technology',
      pubDate: new Date().toISOString(),
      classificationConfidence: 'high',
    },
  ];

  const filtered = filterExcludedArticles(mixedArticles, DEFAULT_TOPIC_PREFERENCES);
  assert(
    filtered.length === 2 && filtered.every((a) => a.id === 'a1' || a.id === 'a4'),
    'filterExcludedArticles strictly drops sports and entertainment stories',
    `Remaining IDs: ${filtered.map((a) => a.id).join(', ')}`
  );

  console.log('\n--- 3. Testing Verified Chinese Tech Publisher Metadata & Ownership ---');

  // Test 12: SCMP is verified private / commercial
  const scmpMeta = getOutletMetadata('South China Morning Post', 'https://www.scmp.com/tech/article');
  assert(
    scmpMeta.isEvaluated && scmpMeta.publisherCountry === 'CN' && scmpMeta.ownershipCategory === 'commercial',
    'SCMP is correctly registered as private/commercial China publisher',
    `Country: ${scmpMeta.publisherCountry}, Category: ${scmpMeta.ownershipCategory}`
  );

  // Test 13: Caixin Global is verified private/independent
  const caixinMeta = getOutletMetadata('Caixin Global', 'https://www.caixinglobal.com/tech/2026');
  assert(
    caixinMeta.isEvaluated && caixinMeta.publisherCountry === 'CN' && caixinMeta.ownership === 'Private',
    'Caixin Global is registered as Private China publisher',
    `Country: ${caixinMeta.publisherCountry}, Ownership: ${caixinMeta.ownership}`
  );

  // Test 14: Xinhua is verified State-Owned
  const xinhuaMeta = getOutletMetadata('Xinhua News Agency', 'http://www.xinhuanet.com/tech');
  assert(
    xinhuaMeta.isEvaluated && xinhuaMeta.ownershipCategory === 'state-owned',
    'Xinhua is registered as state-owned China media agency',
    `OwnershipCategory: ${xinhuaMeta.ownershipCategory}`
  );

  console.log('\n--- 4. Testing Live Backend Endpoints ---');

  // Test 15: /api/news excludes sports by default
  try {
    const res = await fetch('http://localhost:3000/api/news?lang=en&limit=30');
    if (res.ok) {
      const data = await res.json();
      const hasSports = (data.articles || []).some((a: any) => a.category === 'Sports' || a.topicInterest === 'sports');
      assert(!hasSports, 'GET /api/news does not contain sports articles in default feed');
    } else {
      console.warn('  [SKIP] Dev server not reachable on localhost:3000');
    }
  } catch (err) {
    console.warn('  [SKIP] Backend request error:', err);
  }

  // Test 16: /api/news/china-tech endpoint returns articles with ownership classification
  try {
    const res = await fetch('http://localhost:3000/api/news/china-tech?lang=en');
    if (res.ok) {
      const data = await res.json();
      assert(data.topic === 'china-tech', 'GET /api/news/china-tech returns topic china-tech');
      assert(Array.isArray(data.articles) && data.articles.length > 0, `GET /api/news/china-tech returns ${data.articles.length} tech dispatches`);
      const sample = data.articles[0];
      assert(sample.countryCode === 'CN', 'China Tech articles tagged with countryCode CN');
    }
  } catch (err) {
    console.warn('  [SKIP] Backend request error:', err);
  }

  console.log(`\n========================================`);
  console.log(`Results: ${passed} passed, ${failed} failed.`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
