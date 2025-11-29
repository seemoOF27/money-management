import { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export function PWAStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is installed (PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');
    
    setIsInstalled(isStandalone);

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Don't show anything if online and not installed
  if (isOnline && !isInstalled) return null;

  return (
    <div className="fixed bottom-20 left-4 z-50">
      {!isOnline && (
        <div className="bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-slideUp">
          <WifiOff size={18} />
          <span className="text-sm">غير متصل</span>
        </div>
      )}
      
      {isInstalled && isOnline && (
        <div className="bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 opacity-50">
          <Wifi size={18} />
          <span className="text-sm">متصل</span>
        </div>
      )}
    </div>
  );
}
