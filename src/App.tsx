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
import { Wallet, TrendingUp, AlertCircle, FileText, LogOut, Settings, X, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, ChevronUp } from 'lucide-react';

type Tab = 'budgets' | 'debts' | 'investments' | 'operations';

type IncomeSource = {
  id: string;
  name: string;
  amount: number;
  isActive: boolean;
};

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
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeSource | null>(null);
  const [settingsForm, setSettingsForm] = useState({
    name: '',
    email: '',
    salary: ''
  });
  const [incomeForm, setIncomeForm] = useState({
    name: '',
    amount: ''
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
        email: user.email || '',
        salary: user.salary?.toString() || ''
      });
      // Fetch income sources after user data
      await fetchIncomeSources();
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchIncomeSources = async () => {
    try {
      // Try API first
      try {
        const { incomeSources } = await apiRequest('/income-sources');
        setIncomeSources(incomeSources || []);
        
        // Update userData with computed additionalIncome
        if (userData) {
          const activeIncomeSources = (incomeSources || []).filter((source: IncomeSource) => source.isActive);
          const additionalIncome = activeIncomeSources.reduce((sum: number, source: IncomeSource) => sum + source.amount, 0);
          setUserData({
            ...userData,
            additionalIncome
          });
        }
        return;
      } catch (apiError) {
        console.log('API not available, using localStorage fallback');
      }
      
      // Fallback to localStorage
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        const stored = localStorage.getItem(`incomeSources:${user.id}`);
        const sources = stored ? JSON.parse(stored) : [];
        setIncomeSources(sources);
        
        // Update userData with computed additionalIncome
        if (userData) {
          const activeIncomeSources = sources.filter((source: IncomeSource) => source.isActive);
          const additionalIncome = activeIncomeSources.reduce((sum: number, source: IncomeSource) => sum + source.amount, 0);
          setUserData({
            ...userData,
            additionalIncome
          });
        }
      }
    } catch (error) {
      console.error('Error fetching income sources:', error);
      setIncomeSources([]);
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
          email: settingsForm.email,
          salary: parseFloat(settingsForm.salary)
        })
      });
      setShowSettingsModal(false);
      fetchUserData();
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  const handleSaveIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!incomeForm.name.trim()) {
      alert('الرجاء إدخال اسم مصدر الدخل');
      return;
    }
    
    const amount = parseFloat(incomeForm.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('الرجاء إدخال مبلغ صحيح أكبر من صفر');
      return;
    }
    
    // Check authentication
    const token = localStorage.getItem('access_token');
    if (!token) {
      alert('يجب تسجيل الدخول أولاً');
      return;
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        alert('يجب تسجيل الدخول أولاً');
        return;
      }

      const incomeData = {
        name: incomeForm.name.trim(),
        amount: amount,
        isActive: true
      };

      console.log('Saving income source:', incomeData);

      // Try API first
      try {
        if (editingIncome) {
          await apiRequest(`/income-sources/${editingIncome.id}`, {
            method: 'PUT',
            body: JSON.stringify(incomeData)
          });
        } else {
          await apiRequest('/income-sources', {
            method: 'POST',
            body: JSON.stringify(incomeData)
          });
        }
      } catch (apiError) {
        console.log('API not available, using localStorage fallback');
        
        // Fallback to localStorage
        const stored = localStorage.getItem(`incomeSources:${user.id}`);
        const sources = stored ? JSON.parse(stored) : [];
        
        if (editingIncome) {
          const index = sources.findIndex((s: IncomeSource) => s.id === editingIncome.id);
          if (index !== -1) {
            sources[index] = { ...sources[index], ...incomeData };
          }
        } else {
          const newSource = {
            id: crypto.randomUUID(),
            ...incomeData,
            createdAt: new Date().toISOString()
          };
          sources.push(newSource);
        }
        
        localStorage.setItem(`incomeSources:${user.id}`, JSON.stringify(sources));
      }

      setShowIncomeForm(false);
      setEditingIncome(null);
      setIncomeForm({ name: '', amount: '' });
      await fetchIncomeSources();
      await fetchUserData();
      
      alert('تم حفظ مصدر الدخل بنجاح!');
    } catch (error) {
      console.error('Full error details:', error);
      alert('حدث خطأ أثناء حفظ مصدر الدخل:\n' + (error instanceof Error ? error.message : 'خطأ غير معروف'));
    }
  };

  const toggleIncomeActive = async (income: IncomeSource) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;

      // Try API first
      try {
        await apiRequest(`/income-sources/${income.id}`, {
          method: 'PUT',
          body: JSON.stringify({ 
            name: income.name,
            amount: income.amount,
            isActive: !income.isActive 
          })
        });
      } catch (apiError) {
        // Fallback to localStorage
        const stored = localStorage.getItem(`incomeSources:${user.id}`);
        const sources = stored ? JSON.parse(stored) : [];
        const index = sources.findIndex((s: IncomeSource) => s.id === income.id);
        if (index !== -1) {
          sources[index].isActive = !sources[index].isActive;
          localStorage.setItem(`incomeSources:${user.id}`, JSON.stringify(sources));
        }
      }

      await fetchIncomeSources();
      await fetchUserData();
    } catch (error) {
      console.error('Error toggling income:', error);
      alert('حدث خطأ أثناء تحديث الحالة');
    }
  };

  const deleteIncomeSource = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف مصدر الدخل هذا؟')) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;

      // Try API first
      try {
        await apiRequest(`/income-sources/${id}`, {
          method: 'DELETE'
        });
      } catch (apiError) {
        // Fallback to localStorage
        const stored = localStorage.getItem(`incomeSources:${user.id}`);
        const sources = stored ? JSON.parse(stored) : [];
        const filtered = sources.filter((s: IncomeSource) => s.id !== id);
        localStorage.setItem(`incomeSources:${user.id}`, JSON.stringify(filtered));
      }

      await fetchIncomeSources();
      await fetchUserData();
    } catch (error) {
      console.error('Error deleting income source:', error);
      alert('حدث خطأ أثناء حذف مصدر الدخل');
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
              setShowIncomeForm(false);
              setSettingsForm({
                name: userData?.name || '',
                email: userData?.email || '',
                salary: userData?.salary?.toString() || ''
              });
            }
          }}
        >
          <div className="bg-white rounded-xl p-6 max-w-md w-full relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowSettingsModal(false);
                setShowIncomeForm(false);
                setSettingsForm({
                  name: userData?.name || '',
                  email: userData?.email || '',
                  salary: userData?.salary?.toString() || ''
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
                <label className="block text-gray-700 mb-2">البريد الإلكتروني</label>
                <input
                  type="email"
                  required
                  value={settingsForm.email}
                  onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="example@email.com"
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

            {/* Income Sources Section */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-gray-800">مصادر الدخل الإضافية</h4>
                <button
                  type="button"
                  onClick={() => {
                    if (showIncomeForm) {
                      setShowIncomeForm(false);
                      setEditingIncome(null);
                      setIncomeForm({ name: '', amount: '' });
                    } else {
                      setShowIncomeForm(true);
                      setEditingIncome(null);
                      setIncomeForm({ name: '', amount: '' });
                    }
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm"
                >
                  {showIncomeForm ? (
                    <>
                      <ChevronUp size={16} />
                      إخفاء
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      إضافة
                    </>
                  )}
                </button>
              </div>

              {/* Collapsible Income Form */}
              {showIncomeForm && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h5 className="text-md font-semibold text-gray-800 mb-3">
                    {editingIncome ? 'تعديل مصدر دخل' : 'مصدر دخل جديد'}
                  </h5>
                  <form onSubmit={handleSaveIncome} className="space-y-3">
                    <div>
                      <label className="block text-gray-700 mb-1 text-sm">اسم مصدر الدخل</label>
                      <input
                        type="text"
                        required
                        value={incomeForm.name}
                        onChange={(e) => setIncomeForm({ ...incomeForm, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                        placeholder="مثال: مشروع جانبي، استثمار، إيجار"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 mb-1 text-sm">المبلغ الشهري (ريال)</label>
                      <input
                        type="number"
                        required
                        step="0.01"
                        value={incomeForm.amount}
                        onChange={createNumberInputHandler((val) => setIncomeForm({ ...incomeForm, amount: val }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                        placeholder="0"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        className="flex-1 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 text-sm"
                      >
                        {editingIncome ? 'حفظ التعديلات' : 'إضافة'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowIncomeForm(false);
                          setEditingIncome(null);
                          setIncomeForm({ name: '', amount: '' });
                        }}
                        className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 text-sm"
                      >
                        إلغاء
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Income Sources List */}
              {incomeSources.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">لا توجد مصادر دخل إضافية</p>
              ) : (
                <div className="space-y-2">
                  {incomeSources.map((income) => (
                    <div
                      key={income.id}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        income.isActive
                          ? 'border-emerald-200 bg-emerald-50'
                          : 'border-gray-200 bg-gray-50 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{income.name}</div>
                          <div className="text-sm text-gray-600">{income.amount.toFixed(2)} ريال</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => toggleIncomeActive(income)}
                            className={`p-1.5 rounded ${
                              income.isActive
                                ? 'text-emerald-600 hover:bg-emerald-100'
                                : 'text-gray-400 hover:bg-gray-200'
                            }`}
                            title={income.isActive ? 'تعطيل' : 'تفعيل'}
                          >
                            {income.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingIncome(income);
                              setIncomeForm({
                                name: income.name,
                                amount: income.amount.toString()
                              });
                              setShowIncomeForm(true);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            title="تعديل"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteIncomeSource(income.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            title="حذف"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
