import { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { createNumberInputHandler } from '../utils/numberConverter';
import { Loader } from './Loader';
import { TrendingUp, AlertCircle, ArrowRightLeft, DollarSign, X, Settings } from 'lucide-react';

type Transaction = {
  id: string;
  type: 'investment' | 'emergency' | 'emergency_withdrawal' | 'monthly_transfer';
  amount: number;
  note?: string;
  date: string;
};

export function InvestmentsTab({ userData, onUpdateUser }: { userData: any; onUpdateUser: () => void }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [transferForm, setTransferForm] = useState({
    type: 'investment' as 'investment' | 'emergency',
    amount: '',
    note: ''
  });

  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: '',
    note: ''
  });

  const [settingsForm, setSettingsForm] = useState({
    investmentPercentage: userData?.investmentPercentage || 10,
    emergencyPercentage: userData?.emergencyPercentage || 10,
    remainingTarget: userData?.remainingTarget || 'emergency'
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    if (userData) {
      setSettingsForm({
        investmentPercentage: userData.investmentPercentage || 10,
        emergencyPercentage: userData.emergencyPercentage || 10,
        remainingTarget: userData.remainingTarget || 'emergency'
      });
    }
  }, [userData]);

  const fetchTransactions = async () => {
    try {
      const { investments } = await apiRequest('/investments');
      setTransactions(investments);
    } catch (error) {
      console.error('Error fetching investments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await apiRequest('/investments/transfer', {
        method: 'POST',
        body: JSON.stringify({
          type: transferForm.type,
          amount: parseFloat(transferForm.amount),
          note: transferForm.note || undefined
        })
      });

      setShowTransferModal(false);
      setTransferForm({
        type: 'investment',
        amount: '',
        note: ''
      });
      await fetchTransactions();
      onUpdateUser();
    } catch (error) {
      console.error('Error adding transfer:', error);
      alert('حدث خطأ أثناء التحويل');
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await apiRequest('/investments/transfer', {
        method: 'POST',
        body: JSON.stringify({
          type: 'emergency_withdrawal',
          amount: parseFloat(withdrawalForm.amount),
          note: withdrawalForm.note || undefined
        })
      });

      setShowWithdrawalModal(false);
      setWithdrawalForm({
        amount: '',
        note: ''
      });
      await fetchTransactions();
      onUpdateUser();
    } catch (error) {
      console.error('Error withdrawing from emergency:', error);
      alert('حدث خطأ أثناء السحب');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await apiRequest('/user', {
        method: 'PUT',
        body: JSON.stringify(settingsForm)
      });

      setShowSettingsModal(false);
      onUpdateUser();
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setActionLoading(false);
    }
  };

  const investmentTotal = transactions
    .filter(t => t.type === 'investment' || t.type === 'monthly_transfer')
    .reduce((sum, t) => sum + t.amount, 0);

  const emergencyTotal = transactions
    .filter(t => t.type === 'emergency' || t.type === 'monthly_transfer')
    .reduce((sum, t) => sum + t.amount, 0) -
    transactions
    .filter(t => t.type === 'emergency_withdrawal')
    .reduce((sum, t) => sum + t.amount, 0);

  // إجمالي الدخل = الراتب + مصدر الدخل الإضافي
  const salary = userData?.salary || 0;
  const additionalIncome = userData?.additionalIncome || 0;
  const totalIncome = salary + additionalIncome;
  
  const monthlyInvestmentAmount = totalIncome * ((userData?.investmentPercentage || 10) / 100);
  const monthlyEmergencyAmount = totalIncome * ((userData?.emergencyPercentage || 10) / 100);

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="text-gray-500">جاري التحميل...</div>
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl">الاستثمار والطوارئ</h2>
        <button
          onClick={() => setShowSettingsModal(true)}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
        >
          <Settings size={18} />
          الإعدادات
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-700">صندوق الاستثمار</span>
            <TrendingUp className="text-blue-600" size={24} />
          </div>
          <div className="text-3xl text-blue-700 mb-1">{investmentTotal.toFixed(2)} ريال</div>
          <p className="text-sm text-blue-600">
            {userData?.investmentPercentage}٪ شهرياً ({monthlyInvestmentAmount.toFixed(2)} ريال)
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 border border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-orange-700">صندوق الطوارئ</span>
            <AlertCircle className="text-orange-600" size={24} />
          </div>
          <div className="text-3xl text-orange-700 mb-1">{emergencyTotal.toFixed(2)} ريال</div>
          <p className="text-sm text-orange-600">
            {userData?.emergencyPercentage}٪ شهرياً ({monthlyEmergencyAmount.toFixed(2)} ريال)
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => setShowTransferModal(true)}
          className="bg-emerald-600 text-white p-4 rounded-xl hover:bg-emerald-700 flex items-center justify-center gap-2"
        >
          <DollarSign size={20} />
          تحويل مبلغ
        </button>
        <button
          onClick={() => setShowWithdrawalModal(true)}
          className="bg-orange-600 text-white p-4 rounded-xl hover:bg-orange-700 flex items-center justify-center gap-2"
        >
          <ArrowRightLeft size={20} />
          سحب من الطوارئ
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="flex items-center gap-2 mb-2">
          <AlertCircle className="text-blue-600" size={20} />
          <span className="text-blue-700">نظام التحو��ل التل��ائي</span>
        </h3>
        <p className="text-sm text-blue-700 mb-3">
          في نهاية كل شهر، يتم تحويل الفائض من إجمالي الدخل تلقائياً إلى صناديق الاستثمار والطوارئ حسب النسب المحددة.
          يمكنك أيضاً إضافة مبالغ إضافية في أي وقت.
        </p>
        <div className="bg-white/50 p-3 rounded-lg">
          <p className="text-sm text-blue-700 mb-1">
            <strong>المبلغ المتبقي من الميزانيات:</strong> عند تصفير الميزانيات شهرياً، سيتم تحويل المبلغ المتبقي إلى 
            <strong className="mx-1">
              {userData?.remainingTarget === 'emergency' ? 'صندوق الطوارئ' : 'صندوق الاستثمار'}
            </strong>
            (يمكن تغيير ذلك من الإعدادات أدناه)
          </p>
        </div>
      </div>

      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-lg mb-4">آخر العمليات</h3>
          <div className="space-y-3">
            {transactions.slice(0, 15).map((transaction) => {
              const isWithdrawal = transaction.type === 'emergency_withdrawal';
              const isInvestment = transaction.type === 'investment' || transaction.type === 'monthly_transfer';
              
              let bgColor = 'bg-blue-50';
              let textColor = 'text-blue-700';
              let icon = <TrendingUp size={20} />;
              let label = 'استثمار';

              if (transaction.type === 'emergency') {
                bgColor = 'bg-orange-50';
                textColor = 'text-orange-700';
                icon = <AlertCircle size={20} />;
                label = 'طوارئ';
              } else if (isWithdrawal) {
                bgColor = 'bg-red-50';
                textColor = 'text-red-700';
                icon = <ArrowRightLeft size={20} />;
                label = 'سحب من الطوارئ';
              } else if (transaction.type === 'monthly_transfer') {
                bgColor = 'bg-emerald-50';
                textColor = 'text-emerald-700';
                icon = <DollarSign size={20} />;
                label = 'تحويل شهري';
              }

              return (
                <div key={transaction.id} className={`flex justify-between items-center p-3 ${bgColor} rounded-lg`}>
                  <div className="flex items-center gap-3">
                    <div className={textColor}>{icon}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${bgColor} ${textColor}`}>
                          {label}
                        </span>
                        <span className="text-sm text-gray-600">
                          {new Date(transaction.date).toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                      {transaction.note && (
                        <p className="text-xs text-gray-600 mt-1">{transaction.note}</p>
                      )}
                    </div>
                  </div>
                  <div className={`text-lg ${isWithdrawal ? 'text-red-600' : textColor}`}>
                    {isWithdrawal ? '-' : '+'}{transaction.amount.toFixed(2)} ريال
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {transactions.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
          <p>لا توجد عمليات بعد</p>
          <p className="text-sm">ابدأ بتحويل مبلغ للاستثمار أو الطوارئ</p>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full relative">
            <button
              onClick={() => {
                setShowTransferModal(false);
                setTransferForm({
                  type: 'investment',
                  amount: '',
                  note: ''
                });
              }}
              className="absolute top-4 left-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="إغلاق"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl mb-4 pr-8">تحويل مبلغ</h3>
            <form onSubmit={handleTransfer} className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">إلى</label>
                <select
                  value={transferForm.type}
                  onChange={(e) => setTransferForm({ ...transferForm, type: e.target.value as 'investment' | 'emergency' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="investment">صندوق الاستثمار</option>
                  <option value="emergency">صندوق الطوارئ</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">المبلغ (ريال)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0.01"
                  value={transferForm.amount}
                  onChange={createNumberInputHandler((val) => setTransferForm({ ...transferForm, amount: val }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">ملاحظات (اختياري)</label>
                <textarea
                  value={transferForm.note}
                  onChange={(e) => setTransferForm({ ...transferForm, note: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={2}
                  placeholder="أي ملاحظات"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700"
                >
                  تحويل
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowTransferModal(false);
                    setTransferForm({
                      type: 'investment',
                      amount: '',
                      note: ''
                    });
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdrawal Modal */}
      {showWithdrawalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full relative">
            <button
              onClick={() => {
                setShowWithdrawalModal(false);
                setWithdrawalForm({
                  amount: '',
                  note: ''
                });
              }}
              className="absolute top-4 left-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="إغلاق"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl mb-4 pr-8">سحب من صندوق الطوارئ</h3>
            <div className="bg-orange-50 p-3 rounded-lg mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">الرصيد المتاح</span>
                <span>{emergencyTotal.toFixed(2)} ريال</span>
              </div>
            </div>
            <form onSubmit={handleWithdrawal} className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">المبلغ (ريال)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0.01"
                  max={emergencyTotal}
                  value={withdrawalForm.amount}
                  onChange={createNumberInputHandler((val) => setWithdrawalForm({ ...withdrawalForm, amount: val }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">سبب السحب (اختياري)</label>
                <textarea
                  value={withdrawalForm.note}
                  onChange={(e) => setWithdrawalForm({ ...withdrawalForm, note: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={2}
                  placeholder="سبب السحب من صندوق الطوارئ"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700"
                >
                  سحب
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowWithdrawalModal(false);
                    setWithdrawalForm({
                      amount: '',
                      note: ''
                    });
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full relative">
            <button
              onClick={() => {
                setShowSettingsModal(false);
                setSettingsForm({
                  investmentPercentage: userData?.investmentPercentage?.toString() || '0',
                  emergencyPercentage: userData?.emergencyPercentage?.toString() || '0'
                });
              }}
              className="absolute top-4 left-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="إغلاق"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl mb-4 pr-8">إعدادات النسب الشهرية</h3>
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">نسبة الاستثمار (%)</label>
                <input
                  type="number"
                  required
                  step="0.1"
                  min="0"
                  max="100"
                  value={settingsForm.investmentPercentage}
                  onChange={createNumberInputHandler((val) => setSettingsForm({ ...settingsForm, investmentPercentage: parseFloat(val || '0') }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-sm text-gray-600 mt-1">
                  {monthlyInvestmentAmount.toFixed(2)} ريال شهرياً من إجمالي دخلك البالغ {totalIncome.toFixed(0)} ريال
                </p>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">نسبة الطوارئ (%)</label>
                <input
                  type="number"
                  required
                  step="0.1"
                  min="0"
                  max="100"
                  value={settingsForm.emergencyPercentage}
                  onChange={createNumberInputHandler((val) => setSettingsForm({ ...settingsForm, emergencyPercentage: parseFloat(val || '0') }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-sm text-gray-600 mt-1">
                  {monthlyEmergencyAmount.toFixed(2)} ريال شهرياً من راتبك البالغ {userData?.salary || 0} ريال
                </p>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">المبلغ المتبقي من الميزانيات يذهب إلى</label>
                <select
                  value={settingsForm.remainingTarget}
                  onChange={(e) => setSettingsForm({ ...settingsForm, remainingTarget: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="emergency">صندوق الطوارئ</option>
                  <option value="investment">صندوق الاستثمار</option>
                </select>
                <p className="text-sm text-gray-600 mt-1">
                  عند تصفير الميزانيات شهرياً، سيُضاف المبلغ المتبقي إلى الصندوق المحدد
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700"
                >
                  حفظ الإعدادات
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSettingsModal(false);
                    setSettingsForm({
                      investmentPercentage: userData?.investmentPercentage || 10,
                      emergencyPercentage: userData?.emergencyPercentage || 10,
                      remainingTarget: userData?.remainingTarget || 'emergency'
                    });
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Action Loader */}
      {actionLoading && <Loader text="جاري التحميل..." />}
    </div>
  );
}
