import { detectInvolvedCountries, cleanHeadlineForAnalysis, detectIsOpinion, detectIsSportsOrEntertainment } from '../src/services/countryDetector';
import { getOutletMetadata } from '../src/data/outlets';
import { calculateImportanceScore, deduplicateAndClusterArticles, ensureRegionalDiversity, isSameEvent } from '../src/services/newsRanking';

interface TestCase {
  name: string;
  headline: string;
  summary?: string;
  expectedCountry?: string;
  expectedRegion: string;
  expectedRelatedRegions?: string[];
  expectedMinConfidence?: 'high' | 'medium' | 'low' | 'unclassified';
  expectedIsMultilateral?: boolean;
  expectedIsOpinion?: boolean;
}

const testCases: TestCase[] = [
  // 1 & 2. Sports & Athlete stories must NEVER appear in Global & Multilateral News
  {
    name: '1. Ordinary Darts Competition (Fallon Sherrock) -> Unclassified (NEVER Global)',
    headline: 'Fallon Sherrock pulls off shock defeat of world champion in darts tournament',
    summary: 'The English competitor advanced to the quarter-finals after a dramatic sudden death leg.',
    expectedCountry: undefined,
    expectedRegion: 'Unclassified',
    expectedIsMultilateral: false,
    expectedMinConfidence: 'unclassified',
  },
  {
    name: '2. Individual Athlete Story (Hypoxic Athlete) -> Unclassified (NEVER Global)',
    headline: "'I made the wrong decision': Hypoxic athlete reflects on high-altitude marathon",
    summary: 'The long-distance runner recounts altitude sickness and recovery in personal interview.',
    expectedCountry: undefined,
    expectedRegion: 'Unclassified',
    expectedIsMultilateral: false,
    expectedMinConfidence: 'unclassified',
  },

  // 3 & 4. Domestic US Elections must NEVER appear in Global & Multilateral News
  {
    name: '3. Texas Election (Talarico) -> US / North America (NEVER Global)',
    headline: 'Talarico Makes Final Election Pitch to Texans',
    summary: 'Democratic candidate addresses voters at campaign rally in Austin.',
    expectedCountry: 'US',
    expectedRegion: 'North America',
    expectedMinConfidence: 'high',
    expectedIsMultilateral: false,
  },
  {
    name: '4. Alaska Senate Race -> US / North America (NEVER Global)',
    headline: 'Alaska Senate candidate denies knowing about alleged plot in Anchorage',
    summary: 'Congressional campaign responds to federal inquiry regarding political donations.',
    expectedCountry: 'US',
    expectedRegion: 'North America',
    expectedMinConfidence: 'high',
    expectedIsMultilateral: false,
  },

  // 5. Foreign travel / diplomatic cancellation: Actor vs Destination Context
  {
    name: '5. Polish Crisis & Senegal trip cancellation -> Poland/Europe (primary), Senegal/Africa (secondary)',
    headline: 'Polish president cancels visit to Senegal amid Warsaw political crisis',
    summary: 'The head of state called an emergency cabinet meeting in Warsaw following parliamentary gridlock.',
    expectedCountry: 'PL',
    expectedRegion: 'Europe',
    expectedRelatedRegions: ['Africa'],
    expectedMinConfidence: 'high',
    expectedIsMultilateral: false,
  },

  // 6 & 7. Genuine Multilateral & International Summits
  {
    name: '6. Genuine Multilateral: UN Security Council -> Global (verified multilateral)',
    headline: 'UN Security Council adopts binding resolution on maritime navigation safety',
    summary: 'Multilateral delegates from 15 member states voted unanimously in New York.',
    expectedCountry: undefined,
    expectedRegion: 'Global',
    expectedIsMultilateral: true,
    expectedMinConfidence: 'high',
  },
  {
    name: '7. Genuine Multilateral: G20 Leaders Summit -> Global (verified multilateral)',
    headline: 'G20 leaders commit to coordinated international taxation and climate framework',
    summary: 'Heads of state concluded the multilateral summit with a shared declaration.',
    expectedCountry: undefined,
    expectedRegion: 'Global',
    expectedIsMultilateral: true,
    expectedMinConfidence: 'high',
  },
  {
    name: '8. Genuine Multilateral: UN Climate Summit Accord -> Global (verified multilateral)',
    headline: 'UN Climate Summit delegates reach consensus on global loss and damage fund',
    summary: 'Multilateral negotiators signed the landmark international environmental agreement.',
    expectedCountry: undefined,
    expectedRegion: 'Global',
    expectedIsMultilateral: true,
    expectedMinConfidence: 'high',
  },

  // 9 & 10. Supranational Regional Entities (Africa & Oceania)
  {
    name: '9. Regional Intergovernmental Entity: Sahel & African Union -> Africa',
    headline: 'Sahel regional summit in Niamey concludes with joint defense and security accord',
    summary: 'African Union observers welcomed the multilateral counter-insurgency framework.',
    expectedRegion: 'Africa',
    expectedIsMultilateral: false,
    expectedMinConfidence: 'high',
  },
  {
    name: '10. Regional Intergovernmental Entity: Pacific Island Forum -> Oceania',
    headline: 'Pacific island leaders demand binding global emissions targets at Suva summit',
    summary: 'The regional leaders urged maritime powers to enforce ocean conservation treaties.',
    expectedRegion: 'Oceania',
    expectedIsMultilateral: false,
    expectedMinConfidence: 'high',
  },

  // Geographic Precision Baseline Across All 7 Continents
  {
    name: '11. Indian domestic political news -> Asia (never Europe)',
    headline: 'India Modi cabinet announces nationwide infrastructure reform - BBC News',
    summary: 'New Delhi unveiled a multi-billion dollar highway and semiconductor package.',
    expectedCountry: 'IN',
    expectedRegion: 'Asia',
    expectedMinConfidence: 'high',
  },
  {
    name: '12. North Korean denuclearization -> Asia (never Middle East)',
    headline: 'North Korea Pyongyang tests tactical guided weapons - Al Jazeera',
    summary: 'Kim Jong Un observed the military drills from the northern command post.',
    expectedCountry: 'KP',
    expectedRegion: 'Asia',
    expectedMinConfidence: 'high',
  },
  {
    name: '13. Western Sahara news -> Africa (never Middle East)',
    headline: 'Western Sahara Polisario front issues statement on diplomatic talks - France 24',
    summary: 'Sahrawi representatives called on the UN envoy for renewed consultations.',
    expectedCountry: 'EH',
    expectedRegion: 'Africa',
    expectedMinConfidence: 'high',
  },
  {
    name: '14. Morocco news -> Africa (never Middle East)',
    headline: 'Morocco announces major solar energy initiative in Rabat - Le Monde',
    summary: 'Moroccan officials highlighted green transition goals at the ministerial meeting.',
    expectedCountry: 'MA',
    expectedRegion: 'Africa',
    expectedMinConfidence: 'high',
  },
  {
    name: '15. Germany news -> Europe',
    headline: 'Germany Bundestag passes economic package in Berlin - Deutsche Welle',
    summary: 'Chancellor Scholz spoke on industrial competitiveness and workforce training.',
    expectedCountry: 'DE',
    expectedRegion: 'Europe',
    expectedMinConfidence: 'high',
  },
  {
    name: '16. Brazil news -> Latin America and the Caribbean',
    headline: 'Brazil Lula unveils federal plan for Amazon biodiversity in Brasília - Reuters',
    summary: 'Brazilian environment ministry pledges strict enforcement against deforestation.',
    expectedCountry: 'BR',
    expectedRegion: 'Latin America and the Caribbean',
    expectedMinConfidence: 'high',
  },
  {
    name: '17. Australia news -> Oceania',
    headline: 'Australia Canberra government launches new renewable energy grid - ABC News',
    summary: 'Australian federal ministers confirmed clean energy investments in Queensland.',
    expectedCountry: 'AU',
    expectedRegion: 'Oceania',
    expectedMinConfidence: 'high',
  },
  {
    name: '18. Senegal news -> Africa',
    headline: 'Sénégal Bassirou Diomaye Faye préside le conseil des ministres à Dakar - RFI',
    summary: 'Le président sénégalais a fixé les priorités budgétaires pour la jeunesse.',
    expectedCountry: 'SN',
    expectedRegion: 'Africa',
    expectedMinConfidence: 'high',
  },
  {
    name: '19. Non-Geographic Item -> Unclassified (NEVER Global)',
    headline: 'Annual artisanal sourdough baking contest announces winning master baker',
    summary: 'Judges praised the hydration technique and crust texture of the winning loaf.',
    expectedCountry: undefined,
    expectedRegion: 'Unclassified',
    expectedMinConfidence: 'unclassified',
    expectedIsMultilateral: false,
  },
  {
    name: '20. Opinion piece distinction',
    headline: 'Opinion: The future of multilateral climate diplomacy in a fragmented world',
    summary: 'An editorial perspective on modern international climate commitments.',
    expectedRegion: 'Global',
    expectedIsOpinion: true,
  },
  {
    name: '21. Supertanker mine strike in Hormuz -> IR / Middle East (NEVER Oceania despite ABC Australia publisher)',
    headline: 'Supertanker strikes mine in Hormuz, losing two million barrels of oil',
    summary: 'Naval authorities dispatched salvage vessels to the Persian Gulf chokepoint after the hull breach.',
    expectedCountry: 'IR',
    expectedRegion: 'Middle East',
    expectedMinConfidence: 'high',
    expectedIsMultilateral: false,
  },
  {
    name: '22. Pope Leo XIV voting in US -> US / North America with Vatican secondary involvement',
    headline: 'Pope Leo XIV urges Catholics in US election to vote with conscience',
    summary: 'Speaking from the Vatican, the pontiff addressed moral considerations ahead of the presidential ballot.',
    expectedCountry: 'US',
    expectedRegion: 'North America',
    expectedRelatedRegions: ['Europe'],
    expectedMinConfidence: 'high',
    expectedIsMultilateral: false,
  },
];

console.log('--- RUNNING MORNING ATLAS REGRESSION TEST SUITE ---');
let passed = 0;
let failed = 0;

for (const tc of testCases) {
  const result = detectInvolvedCountries(tc.headline, tc.summary || '', 'US');

  const regionMatch = result.region === tc.expectedRegion;
  const countryMatch = tc.expectedCountry ? result.primaryCountry?.code === tc.expectedCountry : true;
  const opinionMatch = tc.expectedIsOpinion !== undefined ? result.isOpinion === tc.expectedIsOpinion : true;
  const confidenceMatch = tc.expectedMinConfidence ? result.confidence === tc.expectedMinConfidence : true;
  const multilateralMatch = tc.expectedIsMultilateral !== undefined ? result.isMultilateral === tc.expectedIsMultilateral : true;
  const relatedRegionsMatch = tc.expectedRelatedRegions
    ? tc.expectedRelatedRegions.every((r) => result.relatedRegions.includes(r as any))
    : true;

  if (regionMatch && countryMatch && opinionMatch && confidenceMatch && multilateralMatch && relatedRegionsMatch) {
    console.log(`[PASS] ${tc.name}`);
    console.log(`       -> Country: ${result.primaryCountry?.code || 'none'} | Region: ${result.region} | Reason: ${result.classificationReason} | Conf: ${result.confidence}`);
    passed++;
  } else {
    console.error(`[FAIL] ${tc.name}`);
    console.error(`       Expected: Region=${tc.expectedRegion}, Country=${tc.expectedCountry || 'none'}, Conf=${tc.expectedMinConfidence || 'any'}, Multi=${tc.expectedIsMultilateral}`);
    console.error(`       Got:      Region=${result.region}, Country=${result.primaryCountry?.code || 'none'}, Conf=${result.confidence}, Multi=${result.isMultilateral}`);
    failed++;
  }
}

// Test Importance Ranking: verify routine sports are severely demoted below geopolitical news
console.log('\n--- TESTING EDITORIAL IMPORTANCE RANKING ---');
const geoScore = calculateImportanceScore({
  title: 'UN Security Council adopts binding ceasefire resolution',
  summary: 'Delegates agreed on diplomatic protocols and emergency humanitarian corridors.',
  category: 'Politics',
  isMultilateral: true,
  factualReliability: 'Very High',
  classificationConfidence: 'high',
  relatedCount: 3,
});

const dartsScore = calculateImportanceScore({
  title: 'Fallon Sherrock pulls off shock defeat of world champion in darts tournament',
  summary: 'The English competitor advanced to the quarter-finals after a dramatic sudden death leg.',
  category: 'Sports',
  isMultilateral: false,
  factualReliability: 'High',
  classificationConfidence: 'low',
});

if (geoScore > dartsScore + 40) {
  console.log(`[PASS] Geopolitical news score (${geoScore}) ranks decisively above routine sports (${dartsScore})`);
  passed++;
} else {
  console.error(`[FAIL] Ranking inversion! Geopolitical=${geoScore}, Sports=${dartsScore}`);
  failed++;
}

// Test Outlet Metadata & Assessment URLs
console.log('\n--- TESTING OUTLET METADATA & VERIFIABLE CREDIBILITY LABELS ---');
const bbcMeta = getOutletMetadata('BBC News');
if (
  bbcMeta.ownership === 'Public' &&
  bbcMeta.editorialIndependence === 'Assessed Independent' &&
  bbcMeta.politicalPerspective === 'Center' &&
  bbcMeta.publisherCountry === 'GB' &&
  bbcMeta.assessmentProvider &&
  bbcMeta.assessmentUrl
) {
  console.log('[PASS] BBC News evaluated metadata has verifiable provider and URL');
  passed++;
} else {
  console.error('[FAIL] BBC News metadata incomplete or missing URL:', bbcMeta);
  failed++;
}

const apMeta = getOutletMetadata('Associated Press (AP)');
if (
  apMeta.ownership === 'Non-Profit / Trust' &&
  apMeta.editorialIndependence === 'Assessed Independent' &&
  apMeta.factualReliability === 'Very High' &&
  apMeta.assessmentProvider?.includes('AllSides') &&
  apMeta.assessmentUrl
) {
  console.log('[PASS] AP evaluated metadata has verified rating with AllSides link');
  passed++;
} else {
  console.error('[FAIL] AP metadata verification failed:', apMeta);
  failed++;
}

const unknownMeta = getOutletMetadata('Random Unregistered Blog');
if (
  unknownMeta.ownership === 'Unknown' &&
  unknownMeta.editorialIndependence === 'Unknown' &&
  unknownMeta.politicalPerspective === 'Not rated' &&
  unknownMeta.factualReliability === 'Not rated' &&
  unknownMeta.isEvaluated === false
) {
  console.log('[PASS] Unknown outlet defaults strictly to Unknown / Not rated (No ungrounded ratings)');
  passed++;
} else {
  console.error('[FAIL] Unknown outlet has improper assumptions:', unknownMeta);
  failed++;
}

// Test Pipeline Deduplication & Clustering
console.log('\n--- TESTING PIPELINE DEDUPLICATION & METRICS ---');
const rawItems = [
  {
    id: '1',
    title: 'G20 Summit opens in Rio with global poverty initiative',
    link: 'https://example.com/1',
    publisher: 'Reuters',
    pubDate: new Date().toISOString(),
    region: 'Global' as any,
    classificationConfidence: 'high' as any,
    language: 'en',
    category: 'Politics' as any,
  },
  {
    id: '2',
    title: 'G20 Summit opens in Rio with global anti-poverty pledge',
    link: 'https://example.com/2',
    publisher: 'Associated Press',
    pubDate: new Date().toISOString(),
    region: 'Global' as any,
    classificationConfidence: 'high' as any,
    language: 'en',
    category: 'Politics' as any,
  },
];
const deduplicated = deduplicateAndClusterArticles(rawItems);
if (deduplicated.length === 1 && deduplicated[0].relatedCount === 1) {
  console.log('[PASS] Cross-feed duplicate clustered correctly (rejected duplicate converted to related count)');
  passed++;
} else {
  console.error('[FAIL] Deduplication failed to cluster similar headlines:', deduplicated);
  failed++;
}

// Test Western Sahara UNSC Dispute Clustering (Requirement B)
console.log('\n--- TESTING EVENT CLUSTERING: WESTERN SAHARA UNSC DISPUTE ---');
const wsEventItems = [
  {
    id: 'ws1',
    title: 'Western Sahara: UN Security Council extends Minurso mandate amid diplomatic dispute',
    link: 'https://lemonde.fr/ws-unsc',
    publisher: 'Le Monde',
    countryCode: 'EH',
    countryName: 'Western Sahara',
    region: 'Africa' as any,
    classificationConfidence: 'high' as any,
    pubDate: new Date().toISOString(),
    language: 'fr',
    category: 'Politics' as any,
    importanceScore: 120,
  },
  {
    id: 'ws2',
    title: 'Security Council votes to renew Western Sahara Minurso peace mission',
    link: 'https://reuters.com/ws-mandate',
    publisher: 'Reuters',
    countryCode: 'EH',
    countryName: 'Western Sahara',
    region: 'Africa' as any,
    classificationConfidence: 'high' as any,
    pubDate: new Date().toISOString(),
    language: 'en',
    category: 'Politics' as any,
    importanceScore: 110,
  },
];
const wsClustered = deduplicateAndClusterArticles(wsEventItems);
if (wsClustered.length === 1 && wsClustered[0].relatedCount === 1 && wsClustered[0].relatedArticles?.length === 1) {
  console.log('[PASS] Western Sahara UNSC stories clustered into single event with distinct publisher attribution preserved');
  passed++;
} else {
  console.error('[FAIL] Western Sahara UNSC dispute stories failed to cluster:', wsClustered);
  failed++;
}

// Test Pope Leo XIV US Election Clustering (Requirement B)
console.log('\n--- TESTING EVENT CLUSTERING: POPE LEO XIV IN US ELECTION ---');
const popeItems = [
  {
    id: 'pope1',
    title: 'Pope Leo XIV urges Catholics in US election to vote with conscience',
    link: 'https://cna.org/pope-us',
    publisher: 'Catholic News Agency',
    countryCode: 'US',
    countryName: 'United States',
    region: 'North America' as any,
    classificationConfidence: 'high' as any,
    pubDate: new Date().toISOString(),
    language: 'en',
    category: 'Politics' as any,
    importanceScore: 115,
  },
  {
    id: 'pope2',
    title: 'US Presidential Election: Pope Leo XIV weighs in on Catholic vote',
    link: 'https://wapo.com/pope-election',
    publisher: 'Washington Post',
    countryCode: 'US',
    countryName: 'United States',
    region: 'North America' as any,
    classificationConfidence: 'high' as any,
    pubDate: new Date().toISOString(),
    language: 'en',
    category: 'Politics' as any,
    importanceScore: 105,
  },
];
const popeClustered = deduplicateAndClusterArticles(popeItems);
if (popeClustered.length === 1 && popeClustered[0].relatedCount === 1) {
  console.log('[PASS] Pope Leo XIV US election stories clustered into single event group');
  passed++;
} else {
  console.error('[FAIL] Pope Leo XIV stories failed to cluster:', popeClustered);
  failed++;
}

// Test Negative Constraint: Never merge unrelated events merely sharing country name
console.log('\n--- TESTING NEGATIVE MERGE CONSTRAINT: UNRELATED EVENTS ---');
const wsFisheriesItem = {
  id: 'ws3',
  title: 'Artisanal fishermen report record sardine catch off Dakhla in Western Sahara',
  link: 'https://example.com/ws-fish',
  publisher: 'Maghreb Press',
  countryCode: 'EH',
  countryName: 'Western Sahara',
  region: 'Africa' as any,
  classificationConfidence: 'high' as any,
  pubDate: new Date().toISOString(),
  language: 'en',
  category: 'Economy' as any,
  importanceScore: 80,
};
const unrelatedClustered = deduplicateAndClusterArticles([wsEventItems[0], wsFisheriesItem]);
if (unrelatedClustered.length === 2) {
  console.log('[PASS] Unrelated stories sharing country name are correctly kept separate');
  passed++;
} else {
  console.error('[FAIL] Unrelated stories were falsely merged:', unrelatedClustered);
  failed++;
}

// Test Regional Diversity: Prevent single country from dominating regional headlines (Requirement C)
console.log('\n--- TESTING REGIONAL GEOGRAPHIC DIVERSITY ---');
const regionalSample = [
  { id: '1', title: 'Western Sahara UNSC dispute', countryCode: 'EH', region: 'Africa' as any, importanceScore: 120, link: '', publisher: '', pubDate: '', language: 'en', category: 'Politics' as any, classificationConfidence: 'high' as any },
  { id: '2', title: 'Western Sahara phosphate port expansion', countryCode: 'EH', region: 'Africa' as any, importanceScore: 115, link: '', publisher: '', pubDate: '', language: 'en', category: 'Economy' as any, classificationConfidence: 'high' as any },
  { id: '3', title: 'Senegal opens solar microgrid in Dakar', countryCode: 'SN', region: 'Africa' as any, importanceScore: 110, link: '', publisher: '', pubDate: '', language: 'en', category: 'Technology' as any, classificationConfidence: 'high' as any },
  { id: '4', title: 'Nigeria monetary policy review in Abuja', countryCode: 'NG', region: 'Africa' as any, importanceScore: 105, link: '', publisher: '', pubDate: '', language: 'en', category: 'Economy' as any, classificationConfidence: 'high' as any },
];
const diverseAfrica = ensureRegionalDiversity(regionalSample);
const top3Countries = diverseAfrica.slice(0, 3).map((a) => a.countryCode);
if (top3Countries[0] !== top3Countries[1] && top3Countries[1] !== top3Countries[2]) {
  console.log(`[PASS] Regional diversity guaranteed across headlines: ${top3Countries.join(' -> ')}`);
  passed++;
} else {
  console.error('[FAIL] Regional diversity failed, single country dominated:', top3Countries);
  failed++;
}

console.log(`\nTEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
