import React, { useState, useEffect } from 'react';
import {
  Sun,
  Moon,
  RefreshCw,
  Search,
  Settings as SettingsIcon,
  Globe,
  Compass,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PWAInstallButton } from './PWAInstallButton';
import { ActiveTab } from '../types';

export const Header: React.FC<{
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenSettings: () => void;
}> = ({ onRefresh, isRefreshing, onOpenSettings }) => {
  const {
    language,
    setLanguage,
    theme,
    toggleTheme,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    t,
  } = useApp();

  const [currentDateTime, setCurrentDateTime] = useState('');

  // Update live date and time
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const locale = language === 'fr' ? 'fr-FR' : 'en-US';
      const dateStr = now.toLocaleDateString(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const timeStr = now.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
      });
      setCurrentDateTime(`${dateStr} · ${timeStr}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [language]);

  const navItems: { id: ActiveTab; label: string }[] = [
    { id: 'morning-brief', label: t.nav.morningBrief },
    { id: 'world', label: t.nav.world },
    { id: 'china-tech', label: t.nav.chinaTech },
    { id: 'map', label: t.nav.map },
    { id: 'my-world', label: t.nav.myWorld },
    { id: 'saved', label: t.nav.saved },
  ];

  return (
    <header className="w-full bg-[#FBF9F5] dark:bg-[#0B0F17] border-b border-stone-200 dark:border-stone-800 transition-colors">
      {/* 1. Main Navigation Bar - Strict 3-Zone Contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single Wordmark */}
          <button
            onClick={() => {
              setActiveTab('morning-brief');
              setSearchQuery('');
            }}
            className="text-left group cursor-pointer focus:outline-hidden"
          >
            <span className="font-serif text-2xl lg:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-50 whitespace-nowrap shrink-0 group-hover:text-stone-700 dark:group-hover:text-stone-200 transition-colors">
              Morning Atlas
            </span>
          </button>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSearchQuery('');
                  }}
                  className={`relative py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    isActive
                      ? 'text-stone-900 dark:text-stone-100 font-semibold'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-stone-900 dark:bg-stone-100 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Functional Utilities */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Language Switch: EN | FR */}
            <div className="flex items-center bg-stone-100 dark:bg-stone-800/80 rounded-md p-0.5 border border-stone-200 dark:border-stone-700 text-xs font-semibold">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                  language === 'en'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                    : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white'
                }`}
                title="Switch to English"
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('fr')}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                  language === 'fr'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                    : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white'
                }`}
                title="Passer en français"
              >
                FR
              </button>
            </div>

            {/* Dark / Light Toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-1.5 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* PWA Install */}
            <PWAInstallButton compact />

            {/* Settings */}
            <button
              onClick={onOpenSettings}
              title={t.nav.settings}
              className="p-1.5 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md transition-colors cursor-pointer"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Editorial Broadsheet Masthead Sub-bar */}
      <div className="bg-stone-100/60 dark:bg-stone-900/60 border-t border-stone-200/80 dark:border-stone-800/80 text-xs text-stone-600 dark:text-stone-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Live Date, Time & Edition */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <span className="font-mono tabular-nums text-[11px] uppercase tracking-wider text-stone-500 dark:text-stone-400">
              {currentDateTime || 'Worldwide Edition'}
            </span>
            <span className="text-stone-300 dark:text-stone-700 hidden sm:inline" aria-hidden="true">
              ·
            </span>
            <span className="hidden sm:inline italic text-stone-500 dark:text-stone-400 font-serif">
              {language === 'fr' ? 'Édition Internationale Quotidienne' : 'Daily International Edition'}
            </span>
          </div>

          {/* Search Box & Refresh */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.actions.searchPlaceholder}
                className="w-full pl-8 pr-3 py-1 text-xs bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-md placeholder-stone-400 focus:outline-hidden focus:ring-1 focus:ring-stone-500 dark:text-stone-100"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-[10px]"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title={t.actions.refresh}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-stone-700 dark:text-stone-200 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700/80 border border-stone-300 dark:border-stone-700 rounded-md transition-colors cursor-pointer disabled:opacity-60 shrink-0"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {isRefreshing ? t.actions.refreshing : t.actions.refresh}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Mobile Navigation Strip */}
      <div className="md:hidden border-t border-stone-200 dark:border-stone-800 px-4 py-2 flex items-center justify-around gap-1 text-xs overflow-x-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              setSearchQuery('');
            }}
            className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors ${
              activeTab === item.id
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-semibold'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
