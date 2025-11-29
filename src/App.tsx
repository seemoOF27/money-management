import { useState, useEffect } from 'react';
import { supabase } from './utils/supabase/client';
import { apiRequest } from './utils/api';
import { createNumberInputHandler } from './utils/numberConverter';
import { AuthForm } from './components/AuthForm';
import { BudgetsTab } from './components/BudgetsTab';
import { DebtsTab } from './components/DebtsTab';
import { InvestmentsTab } from './components/InvestmentsTab';
import { OperationsTab } from './components/OperationsTab';
import { Logo, LogoWithText } from './components/Logo';
import { PWAStatus } from './components/PWAStatus';
import { IOSPWABanner } from './components/IOSPWABanner';
import IconsDownloader from './IconsDownloader';
import { Wallet, TrendingUp, AlertCircle, FileText, LogOut, Settings, X } from 'lucide-react';

type Tab = 'budgets' | 'debts' | 'investments' | 'operations';

export default function App() {
  // Check if we should show the icons downloader page
  if (window.location.hash === '#download-icons' || window.location.pathname === '/download-icons') {
    return <IconsDownloader />;
  }

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('budgets');
  const [userData, setUserData] = useState<any>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [settingsForm, setSettingsForm] = useState({
    name: '',
    salary: '',
    additionalIncome: ''
  });

  useEffect(() => {
    checkAuth();
    
    // PWA install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        localStorage.setItem('access_token', session.access_token);
        setIsAuthenticated(true);
        await fetchUserData();
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = async () => {
    try {
      const { user } = await apiRequest('/user');
      setUserData(user);
      setSettingsForm({
        name: user.name || '',
        salary: user.salary?.toString() || '',
        additionalIncome: user.additionalIncome?.toString() || ''
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('access_token');
    setIsAuthenticated(false);
    setUserData(null);
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/user', {
        method: 'PUT',
        body: JSON.stringify({
          name: settingsForm.name,
          salary: parseFloat(settingsForm.salary),
          additionalIncome: parseFloat(settingsForm.additionalIncome) || 0
        })
      });
      setShowSettingsModal(false);
      fetchUserData();
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-gray-500">جاري التحميل...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthForm onAuth={() => { setIsAuthenticated(true); fetchUserData(); }} />;
  }

  const tabs = [
    { id: 'budgets' as Tab, label: 'الميزانيات', icon: Wallet },
    { id: 'debts' as Tab, label: 'الديون', icon: TrendingUp },
    { id: 'investments' as Tab, label: 'الاستثمار', icon: AlertCircle },
    { id: 'operations' as Tab, label: 'العمليات', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Logo size={48} />
              <div>
                <h1 className="text-2xl text-emerald-600">إدارة الأموال</h1>
                {userData && (
                  <p className="text-sm text-gray-600">مرحباً، {userData.name}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSettingsModal(true)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                title="الإعدادات"
              >
                <Settings size={24} />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                title="تسجيل الخروج"
              >
                <LogOut size={24} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Tabs */}
      <div className="sticky top-16 z-30 bg-white border-b border-gray-200 md:hidden">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[80px] flex flex-col items-center gap-1 py-3 px-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-emerald-600 text-emerald-600 bg-emerald-50'
                    : 'border-transparent text-gray-600'
                }`}
              >
                <Icon size={20} />
                <span className="text-xs">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Desktop Sidebar */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sticky top-24">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-emerald-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon size={20} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              {activeTab === 'budgets' && <BudgetsTab userData={userData} />}
              {activeTab === 'debts' && <DebtsTab />}
              {activeTab === 'investments' && (
                <InvestmentsTab userData={userData} onUpdateUser={fetchUserData} />
              )}
              {activeTab === 'operations' && <OperationsTab />}
            </div>
          </main>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSettingsModal(false);
              setSettingsForm({
                name: userData?.name || '',
                salary: userData?.salary?.toString() || '',
                additionalIncome: userData?.additionalIncome?.toString() || '0'
              });
            }
          }}
        >
          <div className="bg-white rounded-xl p-6 max-w-md w-full relative">
            <button
              onClick={() => {
                setShowSettingsModal(false);
                setSettingsForm({
                  name: userData?.name || '',
                  salary: userData?.salary?.toString() || '',
                  additionalIncome: userData?.additionalIncome?.toString() || '0'
                });
              }}
              className="absolute top-4 left-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="إغلاق"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl mb-4 pr-8">إعدادات الحساب</h3>
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">الاسم</label>
                <input
                  type="text"
                  required
                  value={settingsForm.name}
                  onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="الاسم"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">الراتب الشهري (ريال)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={settingsForm.salary}
                  onChange={createNumberInputHandler((val) => setSettingsForm({ ...settingsForm, salary: val }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">مصدر دخل إضافي (ريال) - اختياري</label>
                <input
                  type="number"
                  step="0.01"
                  value={settingsForm.additionalIncome}
                  onChange={createNumberInputHandler((val) => setSettingsForm({ ...settingsForm, additionalIncome: val }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">مثل: دخل من مشاريع جانبية أو استثمارات</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700"
                >
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PWA Install Prompt */}
      {showInstallPrompt && (
        <div className="fixed bottom-4 left-4 right-4 bg-white rounded-xl shadow-2xl p-4 border border-emerald-200 z-50 animate-slideUp">
          <div className="flex items-start gap-3">
            <Logo size={48} />
            <div className="flex-1">
              <h3 className="font-semibold text-emerald-700 mb-1">تثبيت التطبيق</h3>
              <p className="text-sm text-gray-600 mb-3">
                قم بتثبيت التطبيق على جهازك للوصول السريع والعمل بدون اتصال
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleInstallClick}
                  className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  تثبيت الآن
                </button>
                <button
                  onClick={() => setShowInstallPrompt(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  لاحقاً
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PWA Status Indicator */}
      <PWAStatus />
      
      {/* iOS PWA Banner */}
      <IOSPWABanner />
    </div>
  );
}
