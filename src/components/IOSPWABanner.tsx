import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';

export function IOSPWABanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    // Check if not in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone;
    
    // Check if banner was dismissed
    const wasDismissed = localStorage.getItem('ios-pwa-banner-dismissed');
    
    // Show banner if iOS, not standalone, and not dismissed
    if (isIOS && !isStandalone && !wasDismissed) {
      setShowBanner(true);
    }
  }, []);

  const dismissBanner = () => {
    localStorage.setItem('ios-pwa-banner-dismissed', 'true');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-lg animate-slideDown">
      <div className="max-w-4xl mx-auto flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          <Download className="text-white" size={24} />
        </div>
        <div className="flex-1">
          <h3 className="font-bold mb-1">قم بتثبيت التطبيق على iPhone</h3>
          <p className="text-sm opacity-90 mb-2">
            للحصول على تجربة أفضل، قم بإضافة التطبيق إلى الشاشة الرئيسية
          </p>
          <p className="text-xs opacity-75">
            اضغط زر المشاركة 📤 ثم اختر "أضف إلى الشاشة الرئيسية" ➕
          </p>
        </div>
        <button
          onClick={dismissBanner}
          className="flex-shrink-0 text-white hover:bg-white/20 rounded-full p-1 transition-colors"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
