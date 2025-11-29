import { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { createNumberInputHandler } from '../utils/numberConverter';
import { Loader } from './Loader';
import { Plus, Edit2, Trash2, TrendingUp, TrendingDown, CheckCircle, X } from 'lucide-react';

type Debt = {
  id: string;
  name: string;
  type: 'creditor' | 'debtor'; // دائن أو مديون
  amount: number;
  paid: number;
  status: 'active' | 'completed';
  payments: Payment[];
  note?: string;
  createdAt: string;
};

type Payment = {
  id: string;
  amount: number;
  note?: string;
  date: string;
};

export function DebtsTab() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [loading, setLoading] = useState(true);

  const [debtForm, setDebtForm] = useState({
    name: '',
    type: 'debtor' as 'creditor' | 'debtor',
    amount: '',
    note: ''
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    note: ''
  });

  useEffect(() => {
    fetchDebts();
  }, []);

  const fetchDebts = async () => {
    try {
      const { debts } = await apiRequest('/debts');
      setDebts(debts);
    } catch (error) {
      console.error('Error fetching debts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const debtData = {
        name: debtForm.name,
        type: debtForm.type,
        amount: parseFloat(debtForm.amount),
        note: debtForm.note || undefined
      };

      if (editingDebt) {
        await apiRequest(`/debts/${editingDebt.id}`, {
          method: 'PUT',
          body: JSON.stringify(debtData)
        });
      } else {
        await apiRequest('/debts', {
          method: 'POST',
          body: JSON.stringify(debtData)
        });
      }

      setShowDebtModal(false);
      setEditingDebt(null);
      setDebtForm({
        name: '',
        type: 'debtor',
        amount: '',
        note: ''
      });
      fetchDebts();
    } catch (error) {
      console.error('Error saving debt:', error);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebt) return;

    try {
      await apiRequest(`/debts/${selectedDebt.id}/payment`, {
        method: 'POST',
        body: JSON.stringify({
          amount: parseFloat(paymentForm.amount),
          note: paymentForm.note || undefined
        })
      });

      setShowPaymentModal(false);
      setSelectedDebt(null);
      setPaymentForm({
        amount: '',
        note: ''
      });
      fetchDebts();
    } catch (error) {
      console.error('Error adding payment:', error);
    }
  };

  const handleDeleteDebt = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الدين؟')) return;
    try {
      await apiRequest(`/debts/${id}`, { method: 'DELETE' });
      fetchDebts();
    } catch (error) {
      console.error('Error deleting debt:', error);
    }
  };

  const activeDebts = debts.filter(d => d.status === 'active');
  const completedDebts = debts.filter(d => d.status === 'completed');
  
  const totalCreditor = activeDebts
    .filter(d => d.type === 'creditor')
    .reduce((sum, d) => sum + (d.amount - d.paid), 0);
  
  const totalDebtor = activeDebts
    .filter(d => d.type === 'debtor')
    .reduce((sum, d) => sum + (d.amount - d.paid), 0);

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="text-gray-500">جاري التحميل...</div>
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl">إدارة الديون</h2>
        <button
          onClick={() => setShowDebtModal(true)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700"
        >
          <Plus size={20} />
          دين جديد
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-5 border border-red-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-red-700">أنا مديون</span>
            <TrendingDown className="text-red-600" size={24} />
          </div>
          <div className="text-3xl text-red-700">{totalDebtor.toFixed(2)} ريال</div>
          <p className="text-sm text-red-600 mt-1">المبلغ المتبقي للسداد</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-5 border border-emerald-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-emerald-700">أنا دائن</span>
            <TrendingUp className="text-emerald-600" size={24} />
          </div>
          <div className="text-3xl text-emerald-700">{totalCreditor.toFixed(2)} ريال</div>
          <p className="text-sm text-emerald-600 mt-1">المبلغ المتبقي للاستلام</p>
        </div>
      </div>

      {/* Active Debts */}
      {activeDebts.length > 0 && (
        <div>
          <h3 className="text-lg mb-3">الديون النشطة</h3>
          <div className="space-y-3">
            {activeDebts.map((debt) => {
              const remaining = debt.amount - debt.paid;
              const progress = (debt.paid / debt.amount) * 100;

              return (
                <div
                  key={debt.id}
                  className={`bg-white rounded-xl p-5 shadow-sm border ${
                    debt.type === 'debtor' ? 'border-red-100' : 'border-emerald-100'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-lg">{debt.name}</h4>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            debt.type === 'debtor'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {debt.type === 'debtor' ? 'مديون' : 'دائن'}
                        </span>
                      </div>
                      {debt.note && <p className="text-sm text-gray-600">{debt.note}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingDebt(debt);
                          setDebtForm({
                            name: debt.name,
                            type: debt.type,
                            amount: debt.amount.toString(),
                            note: debt.note || ''
                          });
                          setShowDebtModal(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteDebt(debt.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">المبلغ الكلي</span>
                      <span>{debt.amount.toFixed(2)} ريال</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">المسدد</span>
                      <span>{debt.paid.toFixed(2)} ريال</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">المتبقي</span>
                      <span className={debt.type === 'debtor' ? 'text-red-600' : 'text-emerald-600'}>
                        {remaining.toFixed(2)} ريال
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          debt.type === 'debtor' ? 'bg-red-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {debt.payments.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 mb-2">آخر السدادات:</p>
                      <div className="space-y-1">
                        {debt.payments.slice(0, 3).map((payment) => (
                          <div key={payment.id} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                            <span>{new Date(payment.date).toLocaleDateString('ar-SA')}</span>
                            <span>{payment.amount.toFixed(2)} ريال</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setSelectedDebt(debt);
                      setShowPaymentModal(true);
                    }}
                    className="w-full py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-2"
                  >
                    <Plus size={18} />
                    إضافة سداد
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Debts */}
      {completedDebts.length > 0 && (
        <div>
          <h3 className="text-lg mb-3 flex items-center gap-2">
            <CheckCircle className="text-emerald-600" size={20} />
            الديون المكتملة
          </h3>
          <div className="space-y-3">
            {completedDebts.map((debt) => (
              <div
                key={debt.id}
                className="bg-gray-50 rounded-xl p-4 border border-gray-200"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4>{debt.name}</h4>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          debt.type === 'debtor'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {debt.type === 'debtor' ? 'مديون' : 'دائن'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{debt.amount.toFixed(2)} ريال</p>
                  </div>
                  <CheckCircle className="text-emerald-600" size={24} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {debts.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
          <p>لا توجد ديون مسجلة</p>
          <p className="text-sm">ابدأ بإضافة دين جديد</p>
        </div>
      )}

      {/* Debt Modal */}
      {showDebtModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDebtModal(false);
              setEditingDebt(null);
              setDebtForm({
                name: '',
                type: 'creditor',
                amount: '',
                note: ''
              });
            }
          }}
        >
          <div className="bg-white rounded-xl p-6 max-w-md w-full relative">
            <button
              onClick={() => {
                setShowDebtModal(false);
                setEditingDebt(null);
                setDebtForm({
                  name: '',
                  type: 'creditor',
                  amount: '',
                  note: ''
                });
              }}
              className="absolute top-4 left-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="إغلاق"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl mb-4 pr-8">{editingDebt ? 'تعديل الدين' : 'دين جديد'}</h3>
            <form onSubmit={handleSaveDebt} className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">الاسم</label>
                <input
                  type="text"
                  required
                  value={debtForm.name}
                  onChange={(e) => setDebtForm({ ...debtForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="مثال: قرض سيارة، دين صديق"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">النوع</label>
                <div className="space-y-2">
                  <label className="flex items-start gap-3 cursor-pointer p-3 border-2 rounded-lg transition-all hover:bg-gray-50" 
                         style={{ borderColor: debtForm.type === 'debtor' ? '#10b981' : '#e5e7eb' }}>
                    <input
                      type="radio"
                      name="debtType"
                      value="debtor"
                      checked={debtForm.type === 'debtor'}
                      onChange={(e) => setDebtForm({ ...debtForm, type: e.target.value as 'creditor' | 'debtor' })}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">أنا مديون (علي دين)</div>
                      <div className="text-sm text-gray-600">دين يجب عليك سداده</div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer p-3 border-2 rounded-lg transition-all hover:bg-gray-50"
                         style={{ borderColor: debtForm.type === 'creditor' ? '#10b981' : '#e5e7eb' }}>
                    <input
                      type="radio"
                      name="debtType"
                      value="creditor"
                      checked={debtForm.type === 'creditor'}
                      onChange={(e) => setDebtForm({ ...debtForm, type: e.target.value as 'creditor' | 'debtor' })}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">أنا دائن (لي دين)</div>
                      <div className="text-sm text-gray-600">دين يجب على شخص آخر سداده لك</div>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">المبلغ (ريال)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={debtForm.amount}
                  onChange={createNumberInputHandler((val) => setDebtForm({ ...debtForm, amount: val }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">ملاحظات (اختياري)</label>
                <textarea
                  value={debtForm.note}
                  onChange={(e) => setDebtForm({ ...debtForm, note: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={3}
                  placeholder="أي مل��حظات إضافية"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700"
                >
                  {editingDebt ? 'حفظ التعديلات' : 'إضافة'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDebtModal(false);
                    setEditingDebt(null);
                    setDebtForm({
                      name: '',
                      type: 'debtor',
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

      {/* Payment Modal */}
      {showPaymentModal && selectedDebt && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPaymentModal(false);
              setSelectedDebt(null);
              setPaymentAmount('');
            }
          }}
        >
          <div className="bg-white rounded-xl p-6 max-w-md w-full relative">
            <button
              onClick={() => {
                setShowPaymentModal(false);
                setSelectedDebt(null);
                setPaymentAmount('');
              }}
              className="absolute top-4 left-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="إغلاق"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl mb-4 pr-8">إضافة سداد - {selectedDebt.name}</h3>
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">المبلغ المتبقي</span>
                <span>{(selectedDebt.amount - selectedDebt.paid).toFixed(2)} ريال</span>
              </div>
            </div>
            <form onSubmit={handleAddPayment} className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">مبلغ السداد (ريال)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0.01"
                  max={selectedDebt.amount - selectedDebt.paid}
                  value={paymentForm.amount}
                  onChange={createNumberInputHandler((val) => setPaymentForm({ ...paymentForm, amount: val }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">ملاحظات (اختياري)</label>
                <textarea
                  value={paymentForm.note}
                  onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={2}
                  placeholder="أي ملاحظات عن السداد"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700"
                >
                  إضافة السداد
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedDebt(null);
                    setPaymentForm({
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
    </div>
  );
}
