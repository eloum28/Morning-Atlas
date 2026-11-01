import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import {
  AppLanguage,
  ActiveTab,
  ReadingMode,
  NewsArticle,
  CountryInfo,
  TopicInterest,
  TopicPriority,
  TopicPreferenceMap,
  DEFAULT_TOPIC_PREFERENCES,
} from '../types';
import { COUNTRIES, getCountryByCode } from '../data/countries';
import { getTranslation } from '../data/translations';
import { classifyArticleTopic } from '../services/topicClassifier';

interface AppContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedCountryCode: string;
  selectCountry: (code: string) => void;
  selectedCountry?: CountryInfo;
  readingMode: ReadingMode;
  setReadingMode: (mode: ReadingMode) => void;
  favorites: string[];
  toggleFavoriteCountry: (code: string) => void;
  isFavoriteCountry: (code: string) => boolean;
  savedArticles: NewsArticle[];
  saveArticle: (article: NewsArticle) => void;
  removeSavedArticle: (id: string) => void;
  isArticleSaved: (id: string) => boolean;
  readArticleIds: Set<string>;
  markArticleAsRead: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  comparingArticle: NewsArticle | null;
  openCompareModal: (article: NewsArticle) => void;
  closeCompareModal: () => void;
  t: ReturnType<typeof getTranslation>;

  // Personalized Topic Preferences
  topicPreferences: TopicPreferenceMap;
  setTopicPreference: (topic: TopicInterest, priority: TopicPriority) => void;
  restoreDefaultTopicPreferences: () => void;
  selectedTopicFilter: TopicInterest | 'all';
  setSelectedTopicFilter: (topic: TopicInterest | 'all') => void;
  isArticleExcluded: (article: NewsArticle) => boolean;
  filterArticlesByPreferences: (articles: NewsArticle[]) => NewsArticle[];
  
  // Audio Speech Synthesis
  isAudioPlaying: boolean;
  isAudioPaused: boolean;
  currentAudioIndex: number;
  speechRate: number;
  setSpeechRate: (rate: number) => void;
  playArticlesAudio: (articles: NewsArticle[]) => void;
  pauseAudio: () => void;
  resumeAudio: () => void;
  stopAudio: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_FAVORITES = ['SN', 'US', 'FR', 'MA', 'KR', 'GB'];

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 1. Language: default to English, with French support
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    try {
      const saved = localStorage.getItem('morning_atlas_lang');
      return saved === 'fr' ? 'fr' : 'en';
    } catch {
      return 'en';
    }
  });

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('morning_atlas_lang', lang);
    } catch {
      // ignore
    }
  };

  // 2. Theme: Light (default editorial paper) / Dark
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('morning_atlas_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('morning_atlas_theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // 3. Navigation
  const [activeTab, setActiveTab] = useState<ActiveTab>('morning-brief');
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('SN'); // default to Senegal as requested

  const selectCountry = (code: string) => {
    setSelectedCountryCode(code.toUpperCase());
    setActiveTab('country');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const selectedCountry = getCountryByCode(selectedCountryCode);

  // 4. Reading Mode
  const [readingMode, setReadingMode] = useState<ReadingMode>(() => {
    try {
      return (localStorage.getItem('morning_atlas_reading_mode') as ReadingMode) || 'standard';
    } catch {
      return 'standard';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('morning_atlas_reading_mode', readingMode);
    } catch {
      // ignore
    }
  }, [readingMode]);

  // 5. Favorites
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('morning_atlas_favorites');
      return saved ? JSON.parse(saved) : DEFAULT_FAVORITES;
    } catch {
      return DEFAULT_FAVORITES;
    }
  });

  const toggleFavoriteCountry = (code: string) => {
    const upper = code.toUpperCase();
    setFavorites((prev) => {
      const updated = prev.includes(upper) ? prev.filter((c) => c !== upper) : [...prev, upper];
      try {
        localStorage.setItem('morning_atlas_favorites', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const isFavoriteCountry = (code: string) => favorites.includes(code.toUpperCase());

  // 6. Bookmarks
  const [savedArticles, setSavedArticles] = useState<NewsArticle[]>(() => {
    try {
      const saved = localStorage.getItem('morning_atlas_saved_articles');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveArticle = (article: NewsArticle) => {
    setSavedArticles((prev) => {
      if (prev.some((a) => a.id === article.id || a.link === article.link)) return prev;
      const updated = [article, ...prev];
      try {
        localStorage.setItem('morning_atlas_saved_articles', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const removeSavedArticle = (id: string) => {
    setSavedArticles((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      try {
        localStorage.setItem('morning_atlas_saved_articles', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const isArticleSaved = (id: string) => savedArticles.some((a) => a.id === id);

  // 7. Read state
  const [readArticleIds, setReadArticleIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('morning_atlas_read_ids');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const markArticleAsRead = (id: string) => {
    setReadArticleIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem('morning_atlas_read_ids', JSON.stringify(Array.from(next)));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // 8. Search query
  const [searchQuery, setSearchQuery] = useState('');

  // 9. Compare Coverage modal
  const [comparingArticle, setComparingArticle] = useState<NewsArticle | null>(null);

  const openCompareModal = (article: NewsArticle) => {
    setComparingArticle(article);
  };

  const closeCompareModal = () => {
    setComparingArticle(null);
  };

  // 10. Personalized News Topic Interests
  const [topicPreferences, setTopicPreferencesState] = useState<TopicPreferenceMap>(() => {
    try {
      const saved = localStorage.getItem('morning_atlas_topic_prefs');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_TOPIC_PREFERENCES, ...parsed };
      }
      return DEFAULT_TOPIC_PREFERENCES;
    } catch {
      return DEFAULT_TOPIC_PREFERENCES;
    }
  });

  const setTopicPreference = (topic: TopicInterest, priority: TopicPriority) => {
    setTopicPreferencesState((prev) => {
      const updated = { ...prev, [topic]: priority };
      try {
        localStorage.setItem('morning_atlas_topic_prefs', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const restoreDefaultTopicPreferences = () => {
    setTopicPreferencesState(DEFAULT_TOPIC_PREFERENCES);
    try {
      localStorage.setItem('morning_atlas_topic_prefs', JSON.stringify(DEFAULT_TOPIC_PREFERENCES));
    } catch {
      // ignore
    }
  };

  const [selectedTopicFilter, setSelectedTopicFilter] = useState<TopicInterest | 'all'>('all');

  const isArticleExcluded = (article: NewsArticle): boolean => {
    const topic = article.topicInterest || classifyArticleTopic(article.title, article.summary, article.category, article.countryCode);
    return topicPreferences[topic] === 'excluded';
  };

  const filterArticlesByPreferences = (articles: NewsArticle[]): NewsArticle[] => {
    if (!articles || articles.length === 0) return [];
    return articles.filter((a) => !isArticleExcluded(a));
  };

  // 11. Audio Speech Synthesis
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isAudioPaused, setIsAudioPaused] = useState(false);
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
  const [speechRate, setSpeechRate] = useState(1.0);
  const speechQueueRef = useRef<NewsArticle[]>([]);
  const currentIndexRef = useRef(0);

  const stopAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsAudioPlaying(false);
    setIsAudioPaused(false);
    setCurrentAudioIndex(0);
    currentIndexRef.current = 0;
    speechQueueRef.current = [];
  };

  const speakArticleAtIndex = (index: number) => {
    if (index >= speechQueueRef.current.length) {
      stopAudio();
      return;
    }

    const article = speechQueueRef.current[index];
    setCurrentAudioIndex(index);
    currentIndexRef.current = index;

    const utteranceText = `${article.region}. ${article.publisher}. ${article.title}. ${article.summary || ''}`;
    const utterance = new SpeechSynthesisUtterance(utteranceText);
    utterance.rate = speechRate;
    utterance.lang = language === 'fr' ? 'fr-FR' : 'en-US';

    utterance.onend = () => {
      if (currentIndexRef.current + 1 < speechQueueRef.current.length) {
        speakArticleAtIndex(currentIndexRef.current + 1);
      } else {
        stopAudio();
      }
    };

    utterance.onerror = () => {
      stopAudio();
    };

    window.speechSynthesis.speak(utterance);
  };

  const playArticlesAudio = (articles: NewsArticle[]) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }

    // Exclude unwanted topics (e.g. Sports and Entertainment) from audio brief
    const eligible = filterArticlesByPreferences(articles);

    window.speechSynthesis.cancel();
    speechQueueRef.current = eligible.slice(0, 15); // read up to 15 key headlines
    setIsAudioPlaying(true);
    setIsAudioPaused(false);
    speakArticleAtIndex(0);
  };

  const pauseAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      setIsAudioPaused(true);
    }
  };

  const resumeAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
      setIsAudioPaused(false);
    }
  };

  const t = getTranslation(language);

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        theme,
        toggleTheme,
        activeTab,
        setActiveTab,
        selectedCountryCode,
        selectCountry,
        selectedCountry,
        readingMode,
        setReadingMode,
        favorites,
        toggleFavoriteCountry,
        isFavoriteCountry,
        savedArticles,
        saveArticle,
        removeSavedArticle,
        isArticleSaved,
        readArticleIds,
        markArticleAsRead,
        searchQuery,
        setSearchQuery,
        comparingArticle,
        openCompareModal,
        closeCompareModal,
        t,
        topicPreferences,
        setTopicPreference,
        restoreDefaultTopicPreferences,
        selectedTopicFilter,
        setSelectedTopicFilter,
        isArticleExcluded,
        filterArticlesByPreferences,
        isAudioPlaying,
        isAudioPaused,
        currentAudioIndex,
        speechRate,
        setSpeechRate,
        playArticlesAudio,
        pauseAudio,
        resumeAudio,
        stopAudio,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
