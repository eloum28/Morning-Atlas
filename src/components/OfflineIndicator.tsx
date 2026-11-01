import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const OfflineIndicator: React.FC = () => {
  const { t } = useApp();
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-md bg-stone-900 text-stone-100 dark:bg-stone-100 dark:text-stone-900 px-3 py-2 text-xs font-medium shadow-lg border border-stone-700 dark:border-stone-300">
      <WifiOff className="w-3.5 h-3.5 text-amber-500" />
      <span>{t.status.offlineNotice}</span>
    </div>
  );
};
