export type Region =
  | 'Africa'
  | 'Europe'
  | 'Asia'
  | 'Middle East'
  | 'North America'
  | 'Latin America and the Caribbean'
  | 'Oceania'
  | 'Global'
  | 'Unclassified';

export type ClassificationConfidence = 'high' | 'medium' | 'low' | 'unclassified';

export type TopicInterest =
  | 'geopolitics'
  | 'politics'
  | 'ai-advanced-tech'
  | 'china-tech'
  | 'economy'
  | 'science'
  | 'renewable-energy'
  | 'agriculture'
  | 'sports'
  | 'entertainment';

export type TopicPriority = 'very-high' | 'high' | 'normal' | 'low' | 'excluded';

export type TopicPreferenceMap = Record<TopicInterest, TopicPriority>;

export const DEFAULT_TOPIC_PREFERENCES: TopicPreferenceMap = {
  geopolitics: 'very-high',
  politics: 'very-high',
  'ai-advanced-tech': 'very-high',
  'china-tech': 'very-high',
  economy: 'high',
  science: 'high',
  'renewable-energy': 'high',
  agriculture: 'high',
  sports: 'excluded',
  entertainment: 'excluded',
};

export type NewsCategory =
  | 'Top Stories'
  | 'Politics'
  | 'Economy'
  | 'Technology'
  | 'Science'
  | 'Health'
  | 'Environment'
  | 'Society'
  | 'Culture'
  | 'Sports';

export type PoliticalPerspective =
  | 'Left-leaning'
  | 'Center-left'
  | 'Center'
  | 'Center-right'
  | 'Right-leaning'
  | 'Not rated';

export type OwnershipType =
  | 'Public'
  | 'Private'
  | 'State-Owned'
  | 'Non-Profit / Trust'
  | 'Unknown';

export type EditorialIndependence =
  | 'Assessed Independent'
  | 'State-Controlled / State-Affiliated'
  | 'Unknown';

export type FactualReliability =
  | 'Very High'
  | 'High'
  | 'Mixed'
  | 'Not rated';

export type MediaCategory =
  | 'Public Broadcaster'
  | 'News Agency'
  | 'Independent Publisher'
  | 'Private Newspaper'
  | 'State-Owned'
  | 'Digital Media';

export type PaywallStatus = 'Free' | 'Freemium' | 'Subscription' | 'Metered';

export type PublisherType = 'newspaper' | 'agency' | 'broadcaster' | 'digital';

export type OwnershipCategory =
  | 'state-owned'
  | 'public-broadcaster'
  | 'private'
  | 'independent'
  | 'commercial'
  | 'non-profit'
  | 'unknown';

export type SourceOriginMode = 'local' | 'all' | 'international';

export interface NewsOutlet {
  id: string;
  name: string;
  countryCode: string; // ISO 2-letter country of operation
  countryName: string;
  url: string;         // Official website
  domain?: string;     // Primary verified domain (e.g. spa.gov.sa)
  domains?: string[];  // Known domains and subdomains
  language: string;    // Primary language
  languages?: string[];
  englishEditionUrl?: string;
  frenchEditionUrl?: string;
  feedUrl?: string;    // Direct verified RSS/Atom feed URL
  feedUrls?: string[];
  publisherType?: PublisherType;
  category: MediaCategory;
  ownership: OwnershipType;
  ownershipCategory?: OwnershipCategory;
  editorialIndependence: EditorialIndependence;
  politicalPerspective: PoliticalPerspective;
  factualReliability: FactualReliability;
  paywallStatus: PaywallStatus;
  assessmentProvider?: string;
  assessmentUrl?: string;
  description?: string;
  isLocalPublisher?: boolean; // Verified local domestic publisher for this country
  verificationStatus?: 'verified' | 'provisional';
  verificationDate?: string;
  lastSuccessfulFeedRetrieval?: string;
  isAvailable?: boolean;
}

export interface NewsArticle {
  id: string;
  title: string;
  link: string;
  publisher: string;
  publisherId?: string;
  publisherCountry?: string; // Stored separately from subject country
  publisherDomain?: string;
  countryCode?: string;      // Primary subject country code
  countryName?: string;      // Primary subject country name
  secondaryCountries?: { code: string; name: string }[];
  involvedCountries?: { code: string; name: string }[];
  region: Region;            // Primary geographic region determined by subject
  relatedRegions?: Region[]; // Secondary geographic regions involved
  isMultilateral?: boolean;  // True for international bodies, treaties, multi-region summits
  classificationConfidence: ClassificationConfidence;
  classificationReason?: string; // Machine-readable reason for audit and diagnostic review
  pubDate: string;           // ISO 8601
  summary?: string;
  language: string;
  category: NewsCategory;
  isOpinion?: boolean;       // Distinguished from news reporting
  ownership?: OwnershipType;
  editorialIndependence?: EditorialIndependence;
  politicalPerspective?: PoliticalPerspective;
  factualReliability?: FactualReliability;
  assessmentProvider?: string;
  assessmentUrl?: string;
  isDomestic?: boolean;
  isLocalPublisher?: boolean; // True if published by a domestic outlet in the country
  sourceOrigin?: 'local' | 'international';
  originalLanguage?: string;
  originalTitle?: string;
  originalSummary?: string;
  isTranslated?: boolean;
  translatedLanguage?: 'en' | 'fr';
  topic?: string;
  topicInterest?: TopicInterest;
  importanceScore?: number;
  relatedCount?: number;
  relatedArticles?: ClusteredRelatedArticle[];
}

export interface ClusteredRelatedArticle {
  id?: string;
  title: string;
  publisher: string;
  publisherCountry?: string;
  link: string;
  pubDate?: string;
  summary?: string;
  countryName?: string;
  countryCode?: string;
  politicalPerspective?: PoliticalPerspective;
  factualReliability?: FactualReliability;
  editorialIndependence?: EditorialIndependence;
  isOpinion?: boolean;
}

export interface CountryInfo {
  code: string; // ISO 2-letter
  code3: string; // ISO 3-letter
  nameEn: string;
  nameFr: string;
  region: Region;
  continent: string;
  capital: string;
  languages: string[];
  flag: string;
  lat: number;
  lng: number;
}

export type AppLanguage = 'en' | 'fr';

export type TimeFilter = '24h' | '3d' | '7d' | 'all';

export type ReadingMode = 'quick' | 'standard' | 'deep'; // 5-min, 15-min, 30-min

export type ActiveTab =
  | 'morning-brief'
  | 'world'
  | 'china-tech'
  | 'map'
  | 'country'
  | 'my-world'
  | 'saved'
  | 'settings';

export interface CountryNewsResponse {
  country: CountryInfo;
  articles: NewsArticle[];
  localArticles?: NewsArticle[];
  internationalArticles?: NewsArticle[];
  noLocalAvailable?: boolean;
  total: number;
  cachedAt: string;
}

export interface PipelineDiagnostics {
  rawRetrieved: number;
  deduplicatedCount: number;
  rejectedDuplicates: number;
  geographicBreakdown: Record<string, number>;
  unclassifiedCount: number;
  evaluatedAt: string;
}
