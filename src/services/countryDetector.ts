import { COUNTRIES, getCountryByCode } from '../data/countries';
import { CountryInfo, Region, ClassificationConfidence } from '../types';

export interface DetectedCountryResult {
  primaryCountry?: CountryInfo;
  secondaryCountries: { code: string; name: string }[];
  involvedCountries: { code: string; name: string }[];
  region: Region;
  relatedRegions: Region[];
  isMultilateral: boolean;
  confidence: ClassificationConfidence;
  classificationReason: string;
  isOpinion: boolean;
}

// Exhaustive dictionary mapping demonyms, leaders, capitals, subnational entities, and keywords to ISO country codes
const COUNTRY_KEYWORD_MAP: Record<string, string> = {
  // AFRICA
  // Senegal
  senegal: 'SN',
  sénégal: 'SN',
  senegalese: 'SN',
  sénégalais: 'SN',
  sénégalaise: 'SN',
  dakar: 'SN',
  diomaye: 'SN',
  sonko: 'SN',

  // Western Sahara & Morocco
  'western sahara': 'EH',
  'sahara occidental': 'EH',
  sahrawi: 'EH',
  saharawi: 'EH',
  polisario: 'EH',
  laayoune: 'EH',
  morocco: 'MA',
  maroc: 'MA',
  moroccan: 'MA',
  marocain: 'MA',
  marocaine: 'MA',
  rabat: 'MA',
  casablanca: 'MA',

  // Nigeria & West Africa
  nigeria: 'NG',
  nigerian: 'NG',
  nigérian: 'NG',
  abuja: 'NG',
  lagos: 'NG',
  tinubu: 'NG',
  ghana: 'GH',
  ghanaian: 'GH',
  accra: 'GH',
  'ivory coast': 'CI',
  "côte d'ivoire": 'CI',
  ivoirian: 'CI',
  ivoirien: 'CI',
  abidjan: 'CI',
  yamoussoukro: 'CI',
  mali: 'ML',
  malian: 'ML',
  bamako: 'ML',
  burkina: 'BF',
  'burkina faso': 'BF',
  ouagadougou: 'BF',
  niger: 'NE',
  niamey: 'NE',
  guinea: 'GN',
  guinée: 'GN',
  conakry: 'GN',

  // North Africa
  algeria: 'DZ',
  algérie: 'DZ',
  algerian: 'DZ',
  algérien: 'DZ',
  algiers: 'DZ',
  alger: 'DZ',
  tunisia: 'TN',
  tunisie: 'TN',
  tunisian: 'TN',
  tunisien: 'TN',
  tunis: 'TN',
  libya: 'LY',
  libye: 'LY',
  tripoli: 'LY',
  egypt: 'EG',
  égypte: 'EG',
  egyptian: 'EG',
  égyptien: 'EG',
  cairo: 'EG',
  sisi: 'EG',

  // East & Central Africa
  kenya: 'KE',
  kenyan: 'KE',
  nairobi: 'KE',
  ruto: 'KE',
  ethiopia: 'ET',
  éthiopie: 'ET',
  ethiopian: 'ET',
  'addis ababa': 'ET',
  sudan: 'SD',
  soudan: 'SD',
  sudanese: 'SD',
  khartoum: 'SD',
  burhan: 'SD',
  darfur: 'SD',
  rwanda: 'RW',
  rwandan: 'RW',
  kigali: 'RW',
  kagame: 'RW',
  uganda: 'UG',
  ouganda: 'UG',
  kampala: 'UG',
  tanzania: 'TZ',
  tanzanie: 'TZ',
  congo: 'CD',
  drc: 'CD',
  rdc: 'CD',
  kinshasa: 'CD',
  tshisekedi: 'CD',
  cameroon: 'CM',
  cameroun: 'CM',
  yaounde: 'CM',
  yaoundé: 'CM',
  somalia: 'SO',
  somalie: 'SO',
  mogadishu: 'SO',

  // Southern Africa
  'south africa': 'ZA',
  'afrique du sud': 'ZA',
  'south african': 'ZA',
  'sud-africain': 'ZA',
  pretoria: 'ZA',
  johannesburg: 'ZA',
  ramaphosa: 'ZA',
  angola: 'AO',
  luanda: 'AO',
  mozambique: 'MOZ',
  maputo: 'MOZ',
  zambia: 'ZM',
  zambie: 'ZM',
  zimbabwe: 'ZW',
  harare: 'ZW',

  // ASIA
  // North Korea
  'north korea': 'KP',
  'corée du nord': 'KP',
  'north korean': 'KP',
  'nord-coréen': 'KP',
  'nord-coréenne': 'KP',
  pyongyang: 'KP',
  'kim jong un': 'KP',
  'kim jong-un': 'KP',
  dprk: 'KP',

  // South Korea
  'south korea': 'KR',
  'corée du sud': 'KR',
  'south korean': 'KR',
  'sud-coréen': 'KR',
  'sud-coréenne': 'KR',
  seoul: 'KR',
  séoul: 'KR',
  korea: 'KR',
  korean: 'KR',

  // Japan
  japan: 'JP',
  japon: 'JP',
  japanese: 'JP',
  japonais: 'JP',
  japonaise: 'JP',
  tokyo: 'JP',
  ishiba: 'JP',

  // China
  china: 'CN',
  chine: 'CN',
  chinese: 'CN',
  chinois: 'CN',
  chinoise: 'CN',
  beijing: 'CN',
  pékin: 'CN',
  shanghai: 'CN',
  'hong kong': 'CN',
  'xi jinping': 'CN',

  // India & South Asia
  india: 'IN',
  inde: 'IN',
  indian: 'IN',
  indien: 'IN',
  indienne: 'IN',
  'new delhi': 'IN',
  delhi: 'IN',
  modi: 'IN',
  mumbai: 'IN',
  'lok sabha': 'IN',
  pakistan: 'PK',
  pakistani: 'PK',
  islamabad: 'PK',
  sharif: 'PK',
  bangladesh: 'BD',
  dhaka: 'BD',
  taiwan: 'TW',
  taïwan: 'TW',
  taiwanese: 'TW',
  taipei: 'TW',

  // Southeast Asia
  indonesia: 'ID',
  indonésie: 'ID',
  indonesian: 'ID',
  jakarta: 'ID',
  prabowo: 'ID',
  vietnam: 'VN',
  'viêt nam': 'VN',
  vietnamese: 'VN',
  hanoi: 'VN',
  thailand: 'TH',
  thaïlande: 'TH',
  thai: 'TH',
  bangkok: 'TH',
  singapore: 'SG',
  singapour: 'SG',
  malaysia: 'MY',
  malaisie: 'MY',
  philippines: 'PH',
  manila: 'PH',
  marcos: 'PH',
  kazakhstan: 'KZ',

  // Asia Strategic Waterways
  'south china sea': 'CN',
  'mer de chine méridionale': 'CN',
  'mer de chine': 'CN',
  'taiwan strait': 'TW',
  'détroit de taïwan': 'TW',
  'malacca strait': 'SG',
  'détroit de malacca': 'SG',

  // EUROPE
  france: 'FR',
  french: 'FR',
  français: 'FR',
  française: 'FR',
  paris: 'FR',
  macron: 'FR',
  elysée: 'FR',
  barnier: 'FR',
  germany: 'DE',
  allemagne: 'DE',
  german: 'DE',
  allemand: 'DE',
  allemande: 'DE',
  berlin: 'DE',
  scholz: 'DE',
  bundestag: 'DE',
  bavaria: 'DE',
  uk: 'GB',
  britain: 'GB',
  british: 'GB',
  britannique: 'GB',
  england: 'GB',
  scotland: 'GB',
  wales: 'GB',
  london: 'GB',
  starmer: 'GB',
  westminster: 'GB',
  ukraine: 'UA',
  ukrainian: 'UA',
  ukrainien: 'UA',
  kyiv: 'UA',
  kiev: 'UA',
  zelensky: 'UA',
  zelenskyy: 'UA',
  russia: 'RU',
  russie: 'RU',
  russian: 'RU',
  russe: 'RU',
  moscow: 'RU',
  moscou: 'RU',
  putin: 'RU',
  poutine: 'RU',
  kremlin: 'RU',
  spain: 'ES',
  espagne: 'ES',
  spanish: 'ES',
  espagnol: 'ES',
  madrid: 'ES',
  catalonia: 'ES',
  barcelona: 'ES',
  italy: 'IT',
  italie: 'IT',
  italian: 'IT',
  italien: 'IT',
  rome: 'IT',
  meloni: 'IT',

  // Poland
  poland: 'PL',
  pologne: 'PL',
  polish: 'PL',
  polonais: 'PL',
  polonaise: 'PL',
  warsaw: 'PL',
  varsovie: 'PL',
  duda: 'PL',
  tusk: 'PL',

  netherlands: 'NL',
  'pays-bas': 'NL',
  dutch: 'NL',
  holland: 'NL',
  amsterdam: 'NL',
  hague: 'NL',
  belgium: 'BE',
  belgique: 'BE',
  belgian: 'BE',
  brussels: 'BE',
  bruxelles: 'BE',
  switzerland: 'CH',
  suisse: 'CH',
  swiss: 'CH',
  geneva: 'CH',
  genève: 'CH',
  zurich: 'CH',
  sweden: 'SE',
  suède: 'SE',
  swedish: 'SE',
  stockholm: 'SE',
  norway: 'NO',
  norvège: 'NO',
  norwegian: 'NO',
  oslo: 'NO',
  finland: 'FI',
  finlande: 'FI',
  helsinki: 'FI',
  greece: 'GR',
  grèce: 'GR',
  athens: 'GR',
  portugal: 'PT',
  lisbon: 'PT',
  ireland: 'IE',
  irlande: 'IE',
  dublin: 'IE',
  austria: 'AT',
  autriche: 'AT',
  vienna: 'AT',

  // Vatican City / Holy See
  vatican: 'VA',
  'holy see': 'VA',
  'saint-siège': 'VA',
  'saint siege': 'VA',
  pope: 'VA',
  pape: 'VA',
  pontiff: 'VA',
  pontife: 'VA',
  papal: 'VA',
  papauté: 'VA',

  // MIDDLE EAST
  israel: 'IL',
  israël: 'IL',
  israeli: 'IL',
  israélien: 'IL',
  telaviv: 'IL',
  'tel aviv': 'IL',
  netanyahu: 'IL',
  knesset: 'IL',
  palestine: 'PS',
  palestinian: 'PS',
  palestinien: 'PS',
  gaza: 'PS',
  'bande de gaza': 'PS',
  'gaza strip': 'PS',
  'west bank': 'PS',
  cisjordanie: 'PS',
  hamas: 'PS',
  ramallah: 'PS',
  rafah: 'PS',
  'khan younis': 'PS',
  'khan younès': 'PS',
  jenin: 'PS',
  hebron: 'PS',
  nablus: 'PS',
  nablous: 'PS',

  // Strategic Waterways & Maritime Chokepoints
  hormuz: 'IR',
  'strait of hormuz': 'IR',
  ormuz: 'IR',
  "détroit d'ormuz": 'IR',
  'persian gulf': 'IR',
  'golfe persique': 'IR',
  'arabian gulf': 'AE',
  'gulf of oman': 'OM',
  "golfe d'oman": 'OM',
  'bab el-mandeb': 'YE',
  'bab al-mandab': 'YE',
  "détroit de bab-el-mandeb": 'YE',
  'red sea': 'YE',
  'mer rouge': 'YE',
  suez: 'EG',
  'suez canal': 'EG',
  'canal de suez': 'EG',
  golan: 'SY',
  'golan heights': 'SY',
  'plateau du golan': 'SY',

  iran: 'IR',
  iranian: 'IR',
  iranien: 'IR',
  tehran: 'IR',
  téhéran: 'IR',
  khamenei: 'IR',
  pezeshkian: 'IR',
  'saudi arabia': 'SA',
  'arabie saoudite': 'SA',
  saudi: 'SA',
  saoudien: 'SA',
  riyadh: 'SA',
  mbs: 'SA',
  türkiye: 'TR',
  turkey: 'TR',
  turquie: 'TR',
  turkish: 'TR',
  turc: 'TR',
  ankara: 'TR',
  istanbul: 'TR',
  erdogan: 'TR',
  erdoğan: 'TR',
  uae: 'AE',
  émirats: 'AE',
  emirati: 'AE',
  'abu dhabi': 'AE',
  dubai: 'AE',
  lebanon: 'LB',
  liban: 'LB',
  lebanese: 'LB',
  libanais: 'LB',
  beirut: 'LB',
  beyrouth: 'LB',
  hezbollah: 'LB',
  iraq: 'IQ',
  irak: 'IQ',
  iraqi: 'IQ',
  baghdad: 'IQ',
  syria: 'SY',
  syrie: 'SY',
  damascus: 'SY',
  jordan: 'JO',
  jordanie: 'JO',
  amman: 'JO',
  qatar: 'QA',
  doha: 'QA',
  yemen: 'YE',
  yémen: 'YE',
  houthi: 'YE',

  // NORTH AMERICA (including US States, Demonyms, Institutions & Figures)
  us: 'US',
  usa: 'US',
  'united states': 'US',
  'états-unis': 'US',
  american: 'US',
  américain: 'US',
  américaine: 'US',
  washington: 'US',
  biden: 'US',
  trump: 'US',
  harris: 'US',
  vance: 'US',
  walz: 'US',
  blinken: 'US',
  pentagon: 'US',
  congress: 'US',
  congressional: 'US',
  congressman: 'US',
  congresswoman: 'US',
  senate: 'US',
  senator: 'US',
  senators: 'US',
  gop: 'US',
  republican: 'US',
  republicans: 'US',
  democrat: 'US',
  democrats: 'US',
  democratic: 'US',
  'white house': 'US',
  'capitol hill': 'US',
  'supreme court': 'US',
  scotus: 'US',
  schumer: 'US',
  mcconnell: 'US',

  // US States & Demonyms
  texas: 'US',
  texan: 'US',
  texans: 'US',
  talarico: 'US',
  alaska: 'US',
  alaskan: 'US',
  alaskans: 'US',
  california: 'US',
  californian: 'US',
  florida: 'US',
  floridian: 'US',
  'new york': 'US',
  pennsylvania: 'US',
  ohio: 'US',
  michigan: 'US',
  georgia: 'US',
  arizona: 'US',
  nevada: 'US',
  illinois: 'US',
  chicago: 'US',
  virginia: 'US',
  carolina: 'US',
  massachusetts: 'US',
  colorado: 'US',
  houston: 'US',
  dallas: 'US',
  austin: 'US',
  miami: 'US',
  'los angeles': 'US',
  anchorage: 'US',

  // Canada
  canada: 'CA',
  canadian: 'CA',
  canadien: 'CA',
  ottawa: 'CA',
  trudeau: 'CA',
  ontario: 'CA',
  quebec: 'CA',
  québec: 'CA',
  alberta: 'CA',
  toronto: 'CA',
  montreal: 'CA',
  vancouver: 'CA',

  // LATIN AMERICA & CARIBBEAN
  brazil: 'BR',
  brésil: 'BR',
  brazilian: 'BR',
  brésilien: 'BR',
  brasilia: 'BR',
  brasília: 'BR',
  'são paulo': 'BR',
  lula: 'BR',
  mexico: 'MX',
  mexique: 'MX',
  mexican: 'MX',
  mexicain: 'MX',
  sheinbaum: 'MX',
  'mexico city': 'MX',
  argentina: 'AR',
  argentine: 'AR',
  argentinean: 'AR',
  'buenos aires': 'AR',
  milei: 'AR',
  colombia: 'CO',
  colombie: 'CO',
  colombian: 'CO',
  bogota: 'CO',
  bogotá: 'CO',
  petro: 'CO',
  chile: 'CL',
  chili: 'CL',
  santiago: 'CL',
  boric: 'CL',
  peru: 'PE',
  pérou: 'PE',
  lima: 'PE',
  venezuela: 'VE',
  caracas: 'VE',
  maduro: 'VE',
  cuba: 'CU',
  havana: 'CU',
  haiti: 'HT',
  haïti: 'HT',
  haitian: 'HT',
  panama: 'PA',
  'panama canal': 'PA',
  'canal de panama': 'PA',
  panamanian: 'PA',

  // OCEANIA
  australia: 'AU',
  australie: 'AU',
  australian: 'AU',
  australien: 'AU',
  canberra: 'AU',
  sydney: 'AU',
  melbourne: 'AU',
  brisbane: 'AU',
  queensland: 'AU',
  albanese: 'AU',
  'new zealand': 'NZ',
  'nouvelle-zélande': 'NZ',
  wellington: 'NZ',
  auckland: 'NZ',
  luxon: 'NZ',
  fiji: 'FJ',
  fidji: 'FJ',
  suva: 'FJ',
  'papua new guinea': 'PG',
  'papouasie-nouvelle-guinée': 'PG',
  perth: 'AU',
  adelaide: 'AU',
  hobart: 'AU',
  darwin: 'AU',
  tasmania: 'AU',
  'new south wales': 'AU',
  nsw: 'AU',
  victoria: 'AU',
  'western australia': 'AU',
  'south australia': 'AU',
  'albanese government': 'AU',
  'reserve bank of australia': 'AU',
  rba: 'AU',
  aussie: 'AU',
  christchurch: 'NZ',
  dunedin: 'NZ',
  'cook islands': 'FJ',
  samoa: 'FJ',
  tonga: 'FJ',
  vanuatu: 'FJ',
  'solomon islands': 'PG',
};

// Sorted by length descending so multi-word keywords match before single words
const SORTED_KEYWORDS = Object.keys(COUNTRY_KEYWORD_MAP).sort((a, b) => b.length - a.length);

// Supranational and regional intergovernmental bodies directly tied to a geographic continent
const REGIONAL_ENTITY_MAP: Record<string, Region> = {
  // AFRICA
  'african union': 'Africa',
  'union africaine': 'Africa',
  sahel: 'Africa',
  ecowas: 'Africa',
  cedeao: 'Africa',
  sadc: 'Africa',
  'horn of africa': 'Africa',
  "corne de l'afrique": 'Africa',
  maghreb: 'Africa',
  'east africa': 'Africa',
  'west africa': 'Africa',
  'central africa': 'Africa',
  "afrique de l'ouest": 'Africa',
  'afrique centrale': 'Africa',
  'sub-saharan africa': 'Africa',
  'afrique subsaharienne': 'Africa',

  // EUROPE
  'european union': 'Europe',
  'union européenne': 'Europe',
  'eu summit': 'Europe',
  'eu leaders': 'Europe',
  'eu ministers': 'Europe',
  'european commission': 'Europe',
  'commission européenne': 'Europe',
  eurozone: 'Europe',
  balkans: 'Europe',
  baltics: 'Europe',
  scandinavia: 'Europe',
  'nordic countries': 'Europe',

  // ASIA
  asean: 'Asia',
  'south asia': 'Asia',
  'southeast asia': 'Asia',
  'asie du sud-est': 'Asia',
  'central asia': 'Asia',
  'asie centrale': 'Asia',
  'indo-pacific': 'Asia',
  'east asia': 'Asia',

  // MIDDLE EAST
  'arab league': 'Middle East',
  'ligue arabe': 'Middle East',
  'gulf cooperation council': 'Middle East',
  gcc: 'Middle East',
  'middle east': 'Middle East',
  'moyen-orient': 'Middle East',
  levant: 'Middle East',
  'red sea': 'Middle East',

  // LATIN AMERICA & CARIBBEAN
  mercosur: 'Latin America and the Caribbean',
  caricom: 'Latin America and the Caribbean',
  'latin america': 'Latin America and the Caribbean',
  'amérique latine': 'Latin America and the Caribbean',
  caribbean: 'Latin America and the Caribbean',
  caraïbes: 'Latin America and the Caribbean',
  'south america': 'Latin America and the Caribbean',
  'amérique du sud': 'Latin America and the Caribbean',
  'central america': 'Latin America and the Caribbean',
  'amérique centrale': 'Latin America and the Caribbean',

  // OCEANIA
  'pacific island': 'Oceania',
  'pacific islands': 'Oceania',
  'pacific islanders': 'Oceania',
  'iles du pacifique': 'Oceania',
  micronesia: 'Oceania',
  melanesia: 'Oceania',
  polynesia: 'Oceania',
  'south pacific': 'Oceania',
  australasia: 'Oceania',
};

const SORTED_REGIONAL_ENTITIES = Object.keys(REGIONAL_ENTITY_MAP).sort((a, b) => b.length - a.length);

// Regex patterns to detect genuine multilateral / international organizations and topics
const MULTILATERAL_PATTERNS: RegExp[] = [
  /\b(un|united nations|nations unies|u\.n\.)\b/i,
  /\b(un security council|conseil de sécurité|un general assembly|assemblée générale des nations unies)\b/i,
  /\b(unhcr|unicef|unesco|who|world health organization|oms)\b/i,
  /\b(imf|international monetary fund|fmi|world bank|banque mondiale)\b/i,
  /\b(wto|world trade organization|omc)\b/i,
  /\b(icc|international criminal court|cour pénale internationale|cpi|icj|international court of justice)\b/i,
  /\b(iaea|aiea|atomic energy agency)\b/i,
  /\b(g7|g-7|g20|g-20|brics)\b/i,
  /\b(cop28|cop29|cop30|unfccc|paris climate accord|paris agreement|accord de paris|loss and damage fund)\b/i,
  /\b(multilateral treaty|global treaty|international accord|multinational accord|global pact|traité multilatéral|global treaty on|multilateral diplomacy|multilateral climate|multilateral negotiations|diplomatie multilatérale|climate diplomacy)\b/i,
  /\b(antónio guterres|antonio guterres)\b/i,
];

// Patterns indicating travel / visit destination context (Country is destination, not actor)
const DESTINATION_PREFIX_REGEX =
  /(?:cancels?\s+(?:a\s+)?(?:trip|visit|travel)\s+to|postpones?\s+(?:a\s+)?(?:trip|visit)\s+to|trip\s+to|visit\s+to|travels?\s+to|heads?\s+to|flies\s+to|arrives?\s+in|en\s+route\s+to|visite\s+(?:au|en|à|du)|voyage\s+(?:au|en|à)|annule\s+sa\s+visite\s+(?:au|en|à))\s+([a-z\s'-]+)/i;

/**
 * Checks if a headline/article belongs to ordinary sports or entertainment competitions.
 * Such stories MUST NEVER be classified as Global & Multilateral News!
 */
export function detectIsSportsOrEntertainment(title: string, summary: string = ''): boolean {
  const text = `${title} ${summary}`.toLowerCase();
  const patterns: RegExp[] = [
    /\b(darts?|fallon sherrock|pdc|world darts championship)\b/i,
    /\b(hypoxic athlete|athlete reflects|marathoner|sprinter|runner reflects|pole vault|triathlete|decathlon)\b/i,
    /\b(football|soccer|premier league|champions league|la liga|serie a|bundesliga|ligue 1|mls)\b/i,
    /\b(nba|nfl|mlb|nhl|basketball|baseball|cricket|rugby|tennis|wimbledon|atp tour|wta|golf|pga tour|ryder cup)\b/i,
    /\b(formula 1|f1|grand prix|motogp|nascar|boxing|ufc|mma|wrestling)\b/i,
    /\b(quarter-final|semi-final|finalist|trophy|matchday|penalty shootout|scored a goal|defeat of world champion)\b/i,
    /\b(celebrity|hollywood|box office|grammy|oscar nomination|emmy|red carpet|dating rumors|pop star)\b/i,
  ];
  return patterns.some((p) => p.test(text));
}

/**
 * Checks if text references genuinely multilateral or global institutions
 */
export function detectIsMultilateral(text: string): boolean {
  for (const regex of MULTILATERAL_PATTERNS) {
    if (regex.test(text)) return true;
  }
  return false;
}

/**
 * Checks if a headline or article is an opinion piece.
 */
export function detectIsOpinion(title: string): boolean {
  const t = title.toLowerCase();
  return (
    t.startsWith('opinion:') ||
    t.startsWith('opinion :') ||
    t.startsWith('editorial:') ||
    t.startsWith('éditorial :') ||
    t.startsWith('analysis:') ||
    t.startsWith('analyse :') ||
    t.startsWith('column:') ||
    t.startsWith('tribune :') ||
    t.startsWith('chronique :') ||
    t.startsWith('op-ed:') ||
    t.includes(' (opinion)') ||
    t.includes(' [opinion]') ||
    t.includes(' | opinion')
  );
}

/**
 * Strips publisher suffixes from a headline (e.g., "- BBC News", "- The Guardian", "| Reuters")
 * to avoid falsely attributing the story's subject to the publisher's country!
 */
export function cleanHeadlineForAnalysis(rawTitle: string): string {
  let cleaned = rawTitle;
  if (cleaned.includes(' - ')) {
    const parts = cleaned.split(' - ');
    parts.pop(); // remove last part (usually publisher)
    cleaned = parts.join(' - ');
  } else if (cleaned.includes(' | ')) {
    const parts = cleaned.split(' | ');
    parts.pop();
    cleaned = parts.join(' | ');
  }
  return cleaned.trim();
}

/**
 * Analyzes article text and extracts geographic subject with confidence score and machine-readable reason.
 * Never overrides subject region with publisher headquarters!
 * Correctly distinguishes actor from destination in foreign travel / diplomatic stories.
 * Properly isolates Unclassified stories from Global & Multilateral Dispatches.
 */
export function detectInvolvedCountries(
  rawTitle: string,
  summary: string = '',
  _publisherCountryCode?: string,
  targetRegion?: Region
): DetectedCountryResult {
  const title = cleanHeadlineForAnalysis(rawTitle);
  const isOpinion = detectIsOpinion(rawTitle);
  const fullText = `${title} ${summary}`;
  const isSportsOrEnt = detectIsSportsOrEntertainment(title, summary);

  // Sports and routine entertainment can NEVER be multilateral or Global News!
  const isMultilateral = !isSportsOrEnt && detectIsMultilateral(fullText);

  // Normalize text for word-boundary matching
  const normTitle = ` ${title.toLowerCase().replace(/[^a-z0-9àâäéèêëîïôöùûüçñ\s]/g, ' ')} `;
  const normSummary = ` ${summary.toLowerCase().replace(/[^a-z0-9àâäéèêëîïôöùûüçñ\s]/g, ' ')} `;

  const countryScores = new Map<string, number>();
  const firstMentionIndex = new Map<string, number>();

  // Check where destination prepositions appear (e.g. "trip to Senegal", "visite au Sénégal")
  let destinationCode: string | undefined;
  const destMatch = title.match(DESTINATION_PREFIX_REGEX);
  if (destMatch && destMatch[1]) {
    const candidateTarget = destMatch[1].toLowerCase().trim();
    for (const kw of SORTED_KEYWORDS) {
      if (candidateTarget.startsWith(kw) || candidateTarget.includes(kw)) {
        destinationCode = COUNTRY_KEYWORD_MAP[kw];
        break;
      }
    }
  }

  // Helper to score keywords
  const checkMatches = (text: string, weightMultiplier: number, isTitle: boolean) => {
    for (const keyword of SORTED_KEYWORDS) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      const match = regex.exec(text);
      if (match) {
        const code = COUNTRY_KEYWORD_MAP[keyword];
        let score = weightMultiplier;

        // Give extra boost to multi-word specific entities (e.g. "North Korea", "Western Sahara", "New Delhi", "White House")
        if (keyword.includes(' ')) {
          score += 2;
        }

        if (isTitle && !firstMentionIndex.has(code)) {
          firstMentionIndex.set(code, match.index);
        }

        const current = countryScores.get(code) || 0;
        countryScores.set(code, current + score);
      }
    }
  };

  // Headline matches have 5x higher weight than summary matches
  checkMatches(normTitle, 5, true);
  checkMatches(normSummary, 1, false);

  // Special disambiguation:
  // If 'north korea' was matched, ensure 'KP' takes precedence over 'KR' (Korea general)
  if (countryScores.has('KP') && countryScores.has('KR')) {
    countryScores.delete('KR');
  }

  // If 'western sahara' was matched, ensure 'EH' takes precedence over Morocco
  if (countryScores.has('EH')) {
    countryScores.set('EH', (countryScores.get('EH') || 0) + 12);
  }

  // Actor vs Destination disambiguation:
  // If Country A is the actor/initiator and Country B is the destination of travel/cancellation,
  // ensure Country A is prioritized as the primary country
  if (destinationCode && countryScores.has(destinationCode)) {
    for (const [code, score] of countryScores.entries()) {
      if (code !== destinationCode) {
        const otherIndex = firstMentionIndex.get(code) ?? 9999;
        const destIndex = firstMentionIndex.get(destinationCode) ?? 9999;
        if (otherIndex < destIndex) {
          // The other country is the actor! Boost its score over the destination
          countryScores.set(code, Math.max(score, (countryScores.get(destinationCode) || 0) + 6));
        }
      }
    }
  }

  // Domestic political crisis driver weighting (e.g. "Warsaw political crisis", "Bundestag")
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('warsaw') || lowerTitle.includes('varsovie') || lowerTitle.includes('polish')) {
    if (countryScores.has('PL')) {
      countryScores.set('PL', (countryScores.get('PL') || 0) + 4);
    }
  }

  // National election / voting event priority:
  // When an external figure (e.g. Pope, foreign leader) comments on or addresses an election in a sovereign nation
  // (e.g. "Pope urges Catholics in US election", "voting in United States"),
  // the sovereign nation whose ballot/election is taking place is the primary geographic subject
  if (lowerTitle.includes('election') || lowerTitle.includes('vote') || lowerTitle.includes('ballot') || lowerTitle.includes('scrutin')) {
    if (countryScores.has('US') && (lowerTitle.includes('us election') || lowerTitle.includes('united states') || lowerTitle.includes('american presidential') || lowerTitle.includes('in us'))) {
      countryScores.set('US', (countryScores.get('US') || 0) + 6);
    }
  }

  // If headline is a genuine multilateral action (UN, G20, WHO, etc.) and no country is in the headline itself,
  // do NOT let an incidental mention of the host seat in the summary (e.g. "voted in New York", "met in Geneva")
  // misclassify the international resolution as a domestic story!
  if (isMultilateral) {
    const titleCountries = Array.from(firstMentionIndex.keys());
    if (titleCountries.length === 0) {
      return {
        primaryCountry: undefined,
        secondaryCountries: [],
        involvedCountries: [],
        region: 'Global',
        relatedRegions: [],
        isMultilateral: true,
        confidence: 'high',
        classificationReason: 'multilateral_institution_headline: UN/G20/Treaty',
        isOpinion,
      };
    }
  }

  // Sort matched countries by score descending
  const sortedMatches = Array.from(countryScores.entries()).sort((a, b) => b[1] - a[1]);

  // If NO sovereign country matched:
  if (sortedMatches.length === 0) {
    // 1. Check if regional supranational entity matched (e.g. African Union, EU, ASEAN, Mercosur)
    for (const entity of SORTED_REGIONAL_ENTITIES) {
      const regRegex = new RegExp(`\\b${entity}\\b`, 'i');
      if (regRegex.test(normTitle) || regRegex.test(normSummary)) {
        const entityRegion = REGIONAL_ENTITY_MAP[entity];
        return {
          primaryCountry: undefined,
          secondaryCountries: [],
          involvedCountries: [],
          region: entityRegion,
          relatedRegions: [],
          isMultilateral: false,
          confidence: 'high',
          classificationReason: `supranational_entity: ${entity} -> ${entityRegion}`,
          isOpinion,
        };
      }
    }

    // 2. Check if genuine multilateral topic (UN, G20, international accords)
    if (isMultilateral) {
      return {
        primaryCountry: undefined,
        secondaryCountries: [],
        involvedCountries: [],
        region: 'Global',
        relatedRegions: [],
        isMultilateral: true,
        confidence: 'high',
        classificationReason: 'multilateral_organization_topic: global_scope',
        isOpinion,
      };
    }

    // 3. Genuine Unclassified story (Stories without confirmed geographic subject evidence)
    // NEVER placed in Global & Multilateral, and NEVER assumed based on publisher location or feed!
    return {
      primaryCountry: undefined,
      secondaryCountries: [],
      involvedCountries: [],
      region: 'Unclassified',
      relatedRegions: [],
      isMultilateral: false,
      confidence: 'unclassified',
      classificationReason: isSportsOrEnt
        ? 'sports_or_entertainment_competition'
        : 'insufficient_geographic_evidence',
      isOpinion,
    };
  }

  const [topCode, topScore] = sortedMatches[0];
  const primaryCountry = getCountryByCode(topCode);

  if (!primaryCountry) {
    return {
      primaryCountry: undefined,
      secondaryCountries: [],
      involvedCountries: [],
      region: 'Unclassified',
      relatedRegions: [],
      isMultilateral: false,
      confidence: 'unclassified',
      classificationReason: 'country_lookup_unmatched',
      isOpinion,
    };
  }

  // Secondary countries
  const secondaryMatches = sortedMatches.slice(1);
  const secondaryCountries = secondaryMatches
    .map(([code]) => {
      const c = getCountryByCode(code);
      return c ? { code, name: c.nameEn } : null;
    })
    .filter((c): c is { code: string; name: string } => c !== null);

  // All involved countries array
  const involvedCountries = [
    { code: primaryCountry.code, name: primaryCountry.nameEn },
    ...secondaryCountries,
  ];

  // Distinct related regions from secondary countries
  const relatedRegionsSet = new Set<Region>();
  for (const sc of secondaryCountries) {
    const c = getCountryByCode(sc.code);
    if (c && c.region !== primaryCountry.region && c.region !== 'Global' && c.region !== 'Unclassified') {
      relatedRegionsSet.add(c.region);
    }
  }
  const relatedRegions = Array.from(relatedRegionsSet);

  // Confidence assessment
  let confidence: ClassificationConfidence = 'low';
  if (topScore >= 5) {
    confidence = 'high';
  } else if (topScore >= 2) {
    confidence = 'medium';
  }

  let classificationReason = `country_actor: ${primaryCountry.code} (${primaryCountry.nameEn})`;
  if (destinationCode && destinationCode !== primaryCountry.code) {
    classificationReason += ` | destination: ${destinationCode}`;
  }

  return {
    primaryCountry,
    secondaryCountries,
    involvedCountries,
    region: primaryCountry.region, // Region determined strictly by subject country!
    relatedRegions,
    isMultilateral,
    confidence,
    classificationReason,
    isOpinion,
  };
}
