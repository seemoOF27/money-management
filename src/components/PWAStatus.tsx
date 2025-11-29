import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export function PWAStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
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

  // Only show when offline
  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-4 z-50">
      <div className="bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-slideUp">
        <WifiOff size={18} />
        <span className="text-sm">غير متصل</span>
      </div>
    </div>
  );
}
