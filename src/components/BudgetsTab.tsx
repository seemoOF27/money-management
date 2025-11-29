import { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { createNumberInputHandler } from '../utils/numberConverter';
import { Loader, ButtonLoader } from './Loader';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { 
  Plus, Edit2, Trash2, DollarSign, ShoppingCart, Coffee, Car, 
  Home, Smartphone, Heart, Utensils, Film, GraduationCap,
  ShoppingBag, Zap, Wifi, CheckCircle, XCircle, ChevronDown, ChevronUp, X,
  Wallet, Receipt, TrendingUp, TrendingDown, AlertCircle, PiggyBank
} from 'lucide-react';

type Budget = {
  id: string;
  name: string;
  type: 'fixed' | 'percentage';
  amount?: number;
  percentage?: number;
  resetMonthly: boolean;
  carryOver: boolean;
  spent: number;
  icon?: string;
  color?: string;
  tags?: string[];
};

type Bill = {
  id: string;
  name: string;
  amount: number;
  isPaid: boolean;
  icon?: string;
  color?: string;
  dueDay?: number;
};

type Expense = {
  id: string;
  budgetId: string;
  amount: number;
  merchant: string;
  item?: string;
  note?: string;
  createdAt: string;
};

const iconOptions = [
  { value: 'shopping-cart', label: 'تسوق', icon: ShoppingCart },
  { value: 'coffee', label: 'مقهى', icon: Coffee },
  { value: 'car', label: 'مواصلات', icon: Car },
  { value: 'home', label: 'منزل', icon: Home },
  { value: 'smartphone', label: 'تقنية', icon: Smartphone },
  { value: 'heart', label: 'صحة', icon: Heart },
  { value: 'utensils', label: 'طعام', icon: Utensils },
  { value: 'film', label: 'ترفيه', icon: Film },
  { value: 'graduation-cap', label: 'تعليم', icon: GraduationCap },
  { value: 'shopping-bag', label: 'ملابس', icon: ShoppingBag },
  { value: 'zap', label: 'كهرباء', icon: Zap },
  { value: 'wifi', label: 'اتصالات', icon: Wifi },
];

const colorOptions = [
  { value: 'emerald', label: 'أخضر', bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-500', color: '#10b981' },
  { value: 'blue', label: 'أزرق', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-500', color: '#3b82f6' },
  { value: 'purple', label: 'بنفسجي', bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-500', color: '#9333ea' },
  { value: 'pink', label: 'وردي', bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-500', color: '#ec4899' },
  { value: 'orange', label: 'برتقالي', bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-500', color: '#f97316' },
  { value: 'red', label: 'أحمر', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-500', color: '#ef4444' },
  { value: 'yellow', label: 'أصفر', bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-500', color: '#eab308' },
  { value: 'teal', label: 'تركواز', bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-500', color: '#14b8a6' },
];

const iconMap: { [key: string]: any } = {
  'shopping-cart': ShoppingCart,
  'coffee': Coffee,
  'car': Car,
  'home': Home,
  'smartphone': Smartphone,
  'heart': Heart,
  'utensils': Utensils,
  'film': Film,
  'graduation-cap': GraduationCap,
  'shopping-bag': ShoppingBag,
  'zap': Zap,
  'wifi': Wifi,
};

const getIconComponent = (iconName?: string) => {
  const iconOption = iconOptions.find(opt => opt.value === iconName);
  return iconOption ? iconOption.icon : DollarSign;
};

const getColorClasses = (colorName?: string) => {
  const colorOption = colorOptions.find(opt => opt.value === colorName);
  return colorOption || colorOptions[0];
};

export function BudgetsTab({ userData }: { userData: any }) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [expandedBudgets, setExpandedBudgets] = useState<Set<string>>(new Set());
  const [billsExpanded, setBillsExpanded] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);
  const [deleteOption, setDeleteOption] = useState<'transfer' | 'delete'>('transfer');
  const [transferToBudgetId, setTransferToBudgetId] = useState('');
  const [showQuickExpenseModal, setShowQuickExpenseModal] = useState(false);

  const [budgetForm, setBudgetForm] = useState({
    name: '',
    type: 'fixed' as 'fixed' | 'percentage',
    amount: '',
    percentage: '',
    resetMonthly: true,
    carryOver: false,
    icon: 'shopping-cart',
    color: 'emerald',
    tags: [] as string[]
  });

  const [tagInput, setTagInput] = useState('');

  const [billForm, setBillForm] = useState({
    name: '',
    amount: '',
    icon: 'zap',
    color: 'orange',
    dueDay: ''
  });

  const [expenseForm, setExpenseForm] = useState({
    budgetId: '',
    amount: '',
    merchant: '',
    item: '',
    note: '',
    filterTag: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Close quick expense modal when expense modal opens
    if (showExpenseModal) {
      setShowQuickExpenseModal(false);
    }
  }, [showExpenseModal]);

  const fetchData = async () => {
    try {
      const [budgetsRes, billsRes, expensesRes] = await Promise.all([
        apiRequest('/budgets'),
        apiRequest('/bills'),
        apiRequest('/expenses')
      ]);
      setBudgets(budgetsRes.budgets);
      setBills(billsRes.bills);
      setExpenses(expensesRes.expenses);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const budgetData = {
        name: budgetForm.name,
        type: budgetForm.type,
        amount: budgetForm.type === 'fixed' ? parseFloat(budgetForm.amount) : undefined,
        percentage: budgetForm.type === 'percentage' ? parseFloat(budgetForm.percentage) : undefined,
        resetMonthly: budgetForm.resetMonthly,
        carryOver: budgetForm.carryOver,
        icon: budgetForm.icon,
        color: budgetForm.color,
        tags: budgetForm.tags
      };

      if (editingBudget) {
        await apiRequest(`/budgets/${editingBudget.id}`, {
          method: 'PUT',
          body: JSON.stringify(budgetData)
        });
      } else {
        await apiRequest('/budgets', {
          method: 'POST',
          body: JSON.stringify(budgetData)
        });
      }

      setShowBudgetModal(false);
      setEditingBudget(null);
      setTagInput('');
      setBudgetForm({
        name: '',
        type: 'fixed',
        amount: '',
        percentage: '',
        resetMonthly: true,
        carryOver: false,
        icon: 'shopping-cart',
        color: 'emerald',
        tags: []
      });
      await fetchData();
    } catch (error) {
      console.error('Error saving budget:', error);
      alert('حدث خطأ أثناء حفظ الميزانية');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveBill = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const billData = {
        name: billForm.name,
        amount: parseFloat(billForm.amount),
        icon: billForm.icon,
        color: billForm.color,
        dueDay: billForm.dueDay ? parseInt(billForm.dueDay) : undefined
      };

      if (editingBill) {
        await apiRequest(`/bills/${editingBill.id}`, {
          method: 'PUT',
          body: JSON.stringify({ ...billData, isPaid: editingBill.isPaid })
        });
      } else {
        await apiRequest('/bills', {
          method: 'POST',
          body: JSON.stringify(billData)
        });
      }

      setShowBillModal(false);
      setEditingBill(null);
      setBillForm({
        name: '',
        amount: '',
        icon: 'zap',
        color: 'orange',
        dueDay: ''
      });
      await fetchData();
    } catch (error) {
      console.error('Error saving bill:', error);
      alert('حدث خطأ أثناء حفظ الفاتورة');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleBillPaid = async (bill: Bill) => {
    setActionLoading(true);
    try {
      await apiRequest(`/bills/${bill.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isPaid: !bill.isPaid })
      });
      await fetchData();
    } catch (error) {
      console.error('Error toggling bill:', error);
      alert('حدث خطأ أثناء تحديث الفاتورة');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBudget = async (budget: Budget) => {
    // Check if there are expenses linked to this budget
    const budgetExpenses = expenses.filter(exp => exp.budgetId === budget.id);
    
    if (budgetExpenses.length > 0) {
      // Show modal to ask user what to do with expenses
      setBudgetToDelete(budget);
      setDeleteOption('transfer');
      setTransferToBudgetId('');
      setShowDeleteModal(true);
    } else {
      // No expenses, just confirm and delete
      if (!confirm('هل أنت متأكد من حذف هذه الميزانية؟')) return;
      await performDelete(budget.id, null);
    }
  };

  const performDelete = async (budgetId: string, transferTo: string | null) => {
    setActionLoading(true);
    try {
      // If transferring, update expenses first
      if (transferTo && deleteOption === 'transfer') {
        const budgetExpenses = expenses.filter(exp => exp.budgetId === budgetId);
        for (const expense of budgetExpenses) {
          await apiRequest(`/expenses/${expense.id}`, {
            method: 'PUT',
            body: JSON.stringify({ ...expense, budgetId: transferTo })
          });
        }
      }
      
      // Delete the budget (this will also delete expenses if deleteOption is 'delete')
      await apiRequest(`/budgets/${budgetId}`, { method: 'DELETE' });
      await fetchData();
      setShowDeleteModal(false);
      setBudgetToDelete(null);
    } catch (error) {
      console.error('Error deleting budget:', error);
      alert('حدث خطأ أثناء حذف الميزانية');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBill = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) return;
    setActionLoading(true);
    try {
      await apiRequest(`/bills/${id}`, { method: 'DELETE' });
      await fetchData();
    } catch (error) {
      console.error('Error deleting bill:', error);
      alert('حدث خطأ أثناء حذف الفاتورة');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!expenseForm.budgetId) {
      alert('يرجى اختيار ميزانية');
      return;
    }
    
    setActionLoading(true);
    try {
      const expenseData = {
        budgetId: expenseForm.budgetId,
        amount: parseFloat(expenseForm.amount),
        merchant: expenseForm.merchant,
        item: expenseForm.item || undefined,
        note: expenseForm.note || undefined
      };

      if (editingExpense) {
        await apiRequest(`/expenses/${editingExpense.id}`, {
          method: 'PUT',
          body: JSON.stringify(expenseData)
        });
      } else {
        await apiRequest('/expenses', {
          method: 'POST',
          body: JSON.stringify(expenseData)
        });
      }

      setShowExpenseModal(false);
      setEditingExpense(null);
      setExpenseForm({
        budgetId: '',
        amount: '',
        merchant: '',
        item: '',
        note: '',
        filterTag: ''
      });
      await fetchData();
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('حدث خطأ أثناء حفظ المصروف');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المصروف؟')) return;
    setActionLoading(true);
    try {
      await apiRequest(`/expenses/${id}`, { method: 'DELETE' });
      await fetchData();
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('حدث خطأ أثناء حذف المصروف');
    } finally {
      setActionLoading(false);
    }
  };

  const getBudgetAmount = (budget: Budget) => {
    if (budget.type === 'fixed') return budget.amount || 0;
    // استخدام إجمالي الدخل (الراتب + المصدر الإضافي) لحساب النسبة
    const salary = userData?.salary || 0;
    const additionalIncome = userData?.additionalIncome || 0;
    const totalIncome = salary + additionalIncome;
    return totalIncome * ((budget.percentage || 0) / 100);
  };

  const getBudgetProgress = (budget: Budget) => {
    const total = getBudgetAmount(budget);
    return total > 0 ? (budget.spent / total) * 100 : 0;
  };

  const toggleBudgetExpanded = (budgetId: string) => {
    const newExpanded = new Set(expandedBudgets);
    if (newExpanded.has(budgetId)) {
      newExpanded.delete(budgetId);
    } else {
      newExpanded.add(budgetId);
    }
    setExpandedBudgets(newExpanded);
  };

  const getBudgetExpenses = (budgetId: string) => {
    return expenses.filter(e => e.budgetId === budgetId);
  };

  // Get all existing tags from budgets
  const getAllExistingTags = () => {
    const allTags = budgets.flatMap(b => b.tags || []);
    return Array.from(new Set(allTags));
  };

  // Filter tags based on input
  const getFilteredTags = () => {
    const existingTags = getAllExistingTags();
    if (!tagInput.trim()) return existingTags;
    return existingTags.filter(tag => 
      tag.toLowerCase().includes(tagInput.toLowerCase()) &&
      !budgetForm.tags.includes(tag)
    );
  };

  const handleAddTag = () => {
    const value = tagInput.trim();
    if (value && !budgetForm.tags.includes(value)) {
      setBudgetForm({ ...budgetForm, tags: [...budgetForm.tags, value] });
      setTagInput('');
    }
  };

  // Dashboard calculations
  const totalBudgetAmount = budgets.reduce((sum, b) => sum + getBudgetAmount(b), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = totalBudgetAmount - totalSpent;
  const totalBills = bills.reduce((sum, b) => sum + b.amount, 0);
  const paidBills = bills.filter(b => b.isPaid).reduce((sum, b) => sum + b.amount, 0);
  const unpaidBills = totalBills - paidBills;
  
  // إجمالي الدخل = الراتب + مصدر الدخل الإضافي
  const salary = userData?.salary || 0;
  const additionalIncome = userData?.additionalIncome || 0;
  const totalIncome = salary + additionalIncome;
  
  // المتبقي من إجمالي الدخل = إجمالي الدخل - الميزانيات - الفواتير المسددة
  const remainingFromIncome = totalIncome - totalBudgetAmount - paidBills;

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="text-gray-500">جاري التحميل...</div>
    </div>;
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl">الميزانيات والنفقات</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBillModal(true)}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-700"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">فاتورة ثابتة</span>
          </button>
          <button
            onClick={() => {
              setTagInput('');
              setShowBudgetModal(true);
            }}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">ميزانية</span>
          </button>
        </div>
      </div>

      {/* Dashboard - إجمالي الدخل والملخص */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* الكاردات الأربعة */}
        <div className="grid grid-cols-2 gap-3 flex-1">
          {/* الصف الأول */}
          <div className="bg-white rounded-xl p-4 border-r-4 border-purple-500 shadow-sm">
            <div className="flex items-start justify-between mb-1">
              <p className="text-sm text-gray-600">إجمالي الدخل</p>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Wallet size={20} className="text-purple-600" />
              </div>
            </div>
            <p className="text-2xl text-purple-700">{totalIncome.toFixed(0)}</p>
            <p className="text-xs text-gray-500">ريال</p>
            {additionalIncome > 0 && (
              <p className="text-xs text-purple-600 mt-1">
                ({salary.toFixed(0)} + {additionalIncome.toFixed(0)})
              </p>
            )}
          </div>
          <div className="bg-white rounded-xl p-4 border-r-4 border-orange-500 shadow-sm">
            <div className="flex items-start justify-between mb-1">
              <p className="text-sm text-gray-600">فواتير مسددة</p>
              <div className="p-2 bg-orange-100 rounded-lg">
                <Receipt size={20} className="text-orange-600" />
              </div>
            </div>
            <p className="text-2xl text-orange-700">{paidBills.toFixed(0)}</p>
            <p className="text-xs text-gray-500">ريال</p>
          </div>
          
          {/* الصف الثاني */}
          <div className="bg-white rounded-xl p-4 border-r-4 border-emerald-500 shadow-sm">
            <div className="flex items-start justify-between mb-1">
              <p className="text-sm text-gray-600">الميزانيات</p>
              <div className="p-2 bg-emerald-100 rounded-lg">
                <PiggyBank size={20} className="text-emerald-600" />
              </div>
            </div>
            <p className="text-2xl text-emerald-700">{totalBudgetAmount.toFixed(0)}</p>
            <p className="text-xs text-gray-500">ريال</p>
          </div>
          <div className="bg-white rounded-xl p-4 border-r-4 border-teal-500 shadow-sm">
            <div className="flex items-start justify-between mb-1">
              <p className="text-sm text-gray-600">متبقي الميزانيات</p>
              <div className="p-2 bg-teal-100 rounded-lg">
                <TrendingUp size={20} className="text-teal-600" />
              </div>
            </div>
            <p className="text-2xl text-teal-700">{Math.max(0, totalBudgetAmount - totalSpent).toFixed(0)}</p>
            <p className="text-xs text-gray-500">ريال</p>
          </div>
          
          {/* الصف الثالث */}
          <div className="bg-white rounded-xl p-4 border-r-4 border-red-500 shadow-sm">
            <div className="flex items-start justify-between mb-1">
              <p className="text-sm text-gray-600">المنصرف فعلياً</p>
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown size={20} className="text-red-600" />
              </div>
            </div>
            <p className="text-2xl text-red-700">{totalSpent.toFixed(0)}</p>
            <p className="text-xs text-gray-500">ريال</p>
          </div>
          <div className={`bg-white rounded-xl p-4 shadow-sm border-r-4 ${
            remainingFromIncome >= 0 
              ? 'border-blue-500' 
              : 'border-red-500'
          }`}>
            <div className="flex items-start justify-between mb-1">
              <p className="text-sm text-gray-600">المتبقي</p>
              <div className={`p-2 rounded-lg ${remainingFromIncome >= 0 ? 'bg-blue-100' : 'bg-red-100'}`}>
                {remainingFromIncome >= 0 ? (
                  <AlertCircle size={20} className="text-blue-600" />
                ) : (
                  <AlertCircle size={20} className="text-red-600" />
                )}
              </div>
            </div>
            <p className={`text-2xl ${remainingFromIncome >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
              {remainingFromIncome.toFixed(0)}
            </p>
            <p className="text-xs text-gray-500">ريال</p>
          </div>
        </div>

        {/* Donut Chart - ملخص التوزيع */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 lg:w-80">
          <h4 className="text-sm mb-2 text-center text-gray-700">توزيع الدخل</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={[
                  { name: 'المنصرف فعلياً', value: totalSpent, color: '#ef4444' },
                  { name: 'الفواتير المسددة', value: paidBills, color: '#f97316' },
                  { name: 'مخصص للميزانيات', value: Math.max(0, totalBudgetAmount - totalSpent), color: '#10b981' },
                  { name: 'المتبقي', value: Math.max(0, remainingFromIncome), color: '#3b82f6' }
                ].filter(item => item.value > 0)}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
                labelLine={false}
              >
                {[
                  { name: 'المنصرف فعلياً', value: totalSpent, color: '#ef4444' },
                  { name: 'الفواتير المسددة', value: paidBills, color: '#f97316' },
                  { name: 'مخصص للميزانيات', value: Math.max(0, totalBudgetAmount - totalSpent), color: '#10b981' },
                  { name: 'المتبقي', value: Math.max(0, remainingFromIncome), color: '#3b82f6' }
                ].filter(item => item.value > 0).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ direction: 'rtl', textAlign: 'right', fontSize: '12px' }}
                formatter={(value: any) => `${parseFloat(value).toFixed(0)} ريال`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Fixed Bills */}
      {bills.length > 0 && (() => {
        const unpaidBillsCount = bills.filter(bill => !bill.isPaid).length;
        
        return (
          <div>
            <div 
              onClick={() => setBillsExpanded(!billsExpanded)}
              className="flex items-center gap-2 mb-3 cursor-pointer hover:opacity-70 transition-opacity"
            >
              <h3 className="text-lg">الفواتير الثابتة</h3>
              {unpaidBillsCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {unpaidBillsCount}
                </span>
              )}
              {billsExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            
            {billsExpanded && (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {bills.map((bill) => {
                  const Icon = getIconComponent(bill.icon);
                  const colors = getColorClasses(bill.color);

                  return (
                    <div
                      key={bill.id}
                      className={`rounded-xl p-4 bg-white border-r-4 ${colors.border}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg ${colors.text} ${colors.bg}`}>
                            <Icon size={20} />
                          </div>
                          <div>
                            <h4>{bill.name}</h4>
                            <p className={`text-sm ${colors.text}`}>{bill.amount.toFixed(0)} ريال</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => toggleBillPaid(bill)}
                            className={`p-1.5 rounded ${bill.isPaid ? 'bg-emerald-500 text-white' : 'bg-white/50 text-gray-600'}`}
                            title={bill.isPaid ? 'تم السداد' : 'غير مسدد'}
                          >
                            {bill.isPaid ? <CheckCircle size={16} /> : <XCircle size={16} />}
                          </button>
                          <button
                            onClick={() => {
                              setEditingBill(bill);
                              setBillForm({
                                name: bill.name,
                                amount: bill.amount.toString(),
                                icon: bill.icon || 'zap',
                                color: bill.color || 'orange',
                                dueDay: bill.dueDay?.toString() || ''
                              });
                              setShowBillModal(true);
                            }}
                            className="p-1.5 bg-white/50 rounded hover:bg-white"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteBill(bill.id)}
                            className="p-1.5 bg-white/50 rounded hover:bg-white text-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      {bill.dueDay && (
                        <p className="text-xs text-gray-600">يوم الاستحقاق: {bill.dueDay} من كل شهر</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        );
      })()}

{/* Budgets List */}
      <div>
        <h3 className="text-lg mb-3">الميزانيات</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {budgets.map((budget) => {
            const total = getBudgetAmount(budget);
            const remaining = total - budget.spent;
            const progress = getBudgetProgress(budget);
            const Icon = getIconComponent(budget.icon);
            const colors = getColorClasses(budget.color);

            return (
              <div key={budget.id} className={`rounded-xl p-5 shadow-sm bg-white border-r-4 ${colors.border}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`p-3 rounded-xl ${colors.text} ${colors.bg}`}>
                      <Icon size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg mb-1">{budget.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded ${colors.bg} ${colors.text}`}>
                        {budget.type === 'fixed' ? `${total} ريال` : `${budget.percentage}٪ من إجمالي الدخل`}
                      </span>
                      {budget.tags && budget.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {budget.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingBudget(budget);
                        setBudgetForm({
                          name: budget.name,
                          type: budget.type,
                          amount: budget.amount?.toString() || '',
                          percentage: budget.percentage?.toString() || '',
                          resetMonthly: budget.resetMonthly,
                          carryOver: budget.carryOver,
                          icon: budget.icon || 'shopping-cart',
                          color: budget.color || 'emerald',
                          tags: budget.tags || []
                        });
                        setTagInput('');
                        setShowBudgetModal(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteBudget(budget)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Progress Bar with Labels */}
                <div className="mb-4">
                  {/* Labels */}
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-right">
                      <p className="text-xs text-gray-600">المنصرف</p>
                      <p className="text-sm text-gray-800">{budget.spent.toFixed(0)} ريال</p>
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-gray-600">المتبقي</p>
                      <p className={`text-sm ${remaining < 0 ? 'text-red-600' : colors.text}`}>
                        {remaining.toFixed(0)} ريال
                      </p>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="relative w-full h-8 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-500"
                      style={{ 
                        width: `${Math.max(0, Math.min(100, ((total - budget.spent) / total) * 100))}%`,
                        backgroundColor: remaining < 0 ? '#ef4444' : colors.color
                      }}
                    >
                      <div className="h-full flex items-center justify-center">
                        <span className="text-xs text-white px-2">
                          {Math.max(0, Math.min(100, ((total - budget.spent) / total) * 100)).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="mt-4">
                  {getBudgetExpenses(budget.id).length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setExpenseForm({ ...expenseForm, budgetId: budget.id });
                          setShowExpenseModal(true);
                        }}
                        className={`py-2 border ${colors.border} ${colors.text} rounded-lg hover:bg-white/50 flex items-center justify-center gap-2`}
                      >
                        <Plus size={18} />
                        إضافة
                      </button>
                      <button
                        onClick={() => toggleBudgetExpanded(budget.id)}
                        className={`py-2 border ${colors.border} ${colors.text} rounded-lg hover:bg-white/50 flex items-center justify-center gap-2`}
                      >
                        {expandedBudgets.has(budget.id) ? (
                          <>
                            <ChevronUp size={18} />
                            إخفاء ({getBudgetExpenses(budget.id).length})
                          </>
                        ) : (
                          <>
                            <ChevronDown size={18} />
                            عرض ({getBudgetExpenses(budget.id).length})
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setExpenseForm({ ...expenseForm, budgetId: budget.id });
                        setShowExpenseModal(true);
                      }}
                      className={`w-full py-2 border ${colors.border} ${colors.text} rounded-lg hover:bg-white/50 flex items-center justify-center gap-2`}
                    >
                      <Plus size={18} />
                      إضافة مصروف
                    </button>
                  )}

                  {/* Expenses list - collapsible */}
                  {expandedBudgets.has(budget.id) && getBudgetExpenses(budget.id).length > 0 && (
                    <div className="bg-white/50 rounded-lg p-3 space-y-2 max-h-64 overflow-y-auto mt-2">
                      {getBudgetExpenses(budget.id).map((expense) => (
                        <div key={expense.id} className="bg-white rounded p-2 text-sm border border-gray-200">
                          <div className="flex justify-between items-start mb-1">
                            <div className="flex-1">
                              <p className="font-medium">{expense.merchant}</p>
                              {expense.item && <p className="text-xs text-gray-600">{expense.item}</p>}
                            </div>
                            <span className="font-medium">{expense.amount} ر.س</span>
                          </div>
                          {expense.note && <p className="text-xs text-gray-500 mb-1">{expense.note}</p>}
                          <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>{new Date(expense.createdAt).toLocaleDateString('ar-SA')}</span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  setEditingExpense(expense);
                                  setExpenseForm({
                                    budgetId: expense.budgetId,
                                    amount: expense.amount.toString(),
                                    merchant: expense.merchant,
                                    item: expense.item || '',
                                    note: expense.note || ''
                                  });
                                  setShowExpenseModal(true);
                                }}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(expense.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {budgets.length === 0 && bills.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <DollarSign size={48} className="mx-auto mb-4 opacity-50" />
          <p>لا توجد ميزانيات أو فواتير بعد</p>
          <p className="text-sm">ابد�� بإضافة ميزانية أو فاتورة ثابتة</p>
        </div>
      )}

      {/* Recent Expenses */}
      {expenses.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-lg mb-4">آخر المصروفات</h3>
          <div className="space-y-3">
            {expenses.slice(0, 10).map((expense) => {
              const budget = budgets.find(b => b.id === expense.budgetId);
              const colors = budget ? getColorClasses(budget.color) : getColorClasses('emerald');
              const IconComponent = budget?.icon ? iconMap[budget.icon] : ShoppingCart;
              
              return (
                <div 
                  key={expense.id} 
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group cursor-pointer"
                  onClick={() => {
                    setEditingExpense(expense);
                    setExpenseForm({
                      budgetId: expense.budgetId,
                      amount: expense.amount.toString(),
                      merchant: expense.merchant,
                      item: expense.item || '',
                      note: expense.note || '',
                      filterTag: ''
                    });
                    setShowExpenseModal(true);
                  }}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {/* Budget Icon */}
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: colors.color }}
                    >
                      <IconComponent size={20} className="text-white" />
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{expense.merchant}</span>
                      </div>
                      <span className={`text-sm ${colors.text}`}>
                        {budget?.name}
                      </span>
                    </div>
                  </div>
                  
                  {/* Amount and Actions */}
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{expense.amount} ر.س</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteExpense(expense.id);
                      }}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title="حذف"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Budget Modal */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => {
                setShowBudgetModal(false);
                setEditingBudget(null);
                setTagInput('');
                setBudgetForm({
                  name: '',
                  type: 'fixed',
                  amount: '',
                  percentage: '',
                  resetMonthly: true,
                  carryOver: false,
                  icon: 'shopping-cart',
                  color: 'emerald',
                  tags: []
                });
              }}
              className="absolute top-4 left-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="إغلاق"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl mb-4 pr-8">{editingBudget ? 'تعديل الميزانية' : 'ميزانية جديدة'}</h3>
            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">اسم الميزانية</label>
                <input
                  type="text"
                  required
                  value={budgetForm.name}
                  onChange={(e) => setBudgetForm({ ...budgetForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="مثال: طعام، مواصلات، ترفيه"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">الأيقونة</label>
                <div className="grid grid-cols-6 gap-2">
                  {iconOptions.map((opt) => {
                    const IconComponent = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setBudgetForm({ ...budgetForm, icon: opt.value })}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          budgetForm.icon === opt.value
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                        title={opt.label}
                      >
                        <IconComponent size={24} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">اللون</label>
                <div className="flex gap-2 flex-wrap">
                  {colorOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setBudgetForm({ ...budgetForm, color: opt.value })}
                      className={`w-12 h-12 rounded-lg border-2 transition-all ${
                        budgetForm.color === opt.value
                          ? 'border-gray-800 scale-110'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: opt.color }}
                      title={opt.label}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">الوسوم (Tags) - اختياري</label>
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="اكتب وسماً واضغط Enter (مثال: يومي، أسبوعي، ضروري)"
                    />
                    
                    {/* Tag Suggestions */}
                    {tagInput && getFilteredTags().length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                        {getFilteredTags().map((tag, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              setBudgetForm({ ...budgetForm, tags: [...budgetForm.tags, tag] });
                              setTagInput('');
                            }}
                            className="w-full px-4 py-2 text-right hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Display existing tags from all budgets */}
                  {!tagInput && getAllExistingTags().length > 0 && (
                    <div className="text-xs text-gray-500">
                      <p className="mb-1">وسوم موجودة (اضغط للإضافة):</p>
                      <div className="flex flex-wrap gap-1">
                        {getAllExistingTags()
                          .filter(tag => !budgetForm.tags.includes(tag))
                          .map((tag, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => {
                                setBudgetForm({ ...budgetForm, tags: [...budgetForm.tags, tag] });
                              }}
                              className="px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-emerald-100 hover:text-emerald-700 transition-colors"
                            >
                              + {tag}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Selected tags */}
                  {budgetForm.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {budgetForm.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => {
                              setBudgetForm({
                                ...budgetForm,
                                tags: budgetForm.tags.filter((_, i) => i !== index)
                              });
                            }}
                            className="hover:text-emerald-900 font-bold"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">نوع الميزانية</label>
                <div className="flex gap-3">
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      name="budgetType"
                      value="fixed"
                      checked={budgetForm.type === 'fixed'}
                      onChange={(e) => setBudgetForm({ ...budgetForm, type: 'fixed' })}
                      className="sr-only"
                    />
                    <div className={`p-3 rounded-lg border-2 text-center transition-all ${
                      budgetForm.type === 'fixed'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}>
                      مبلغ ثابت
                    </div>
                  </label>
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      name="budgetType"
                      value="percentage"
                      checked={budgetForm.type === 'percentage'}
                      onChange={(e) => setBudgetForm({ ...budgetForm, type: 'percentage' })}
                      className="sr-only"
                    />
                    <div className={`p-3 rounded-lg border-2 text-center transition-all ${
                      budgetForm.type === 'percentage'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}>
                      نسبة من إجمالي الدخل
                    </div>
                  </label>
                </div>
              </div>

              {budgetForm.type === 'fixed' ? (
                <div>
                  <label className="block text-gray-700 mb-2">المبلغ (ريال)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={budgetForm.amount}
                    onChange={createNumberInputHandler((val) => setBudgetForm({ ...budgetForm, amount: val }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="0"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-gray-700 mb-2">النسبة (%)</label>
                  <input
                    type="number"
                    required
                    step="0.1"
                    min="0"
                    max="100"
                    value={budgetForm.percentage}
                    onChange={createNumberInputHandler((val) => setBudgetForm({ ...budgetForm, percentage: val }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="0"
                  />
                </div>
              )}

              <div>
                <label className="block text-gray-700 mb-2">المتبقي في نهاية الشهر</label>
                <div className="flex gap-3">
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      name="carryOverOption"
                      checked={budgetForm.resetMonthly && !budgetForm.carryOver}
                      onChange={() => setBudgetForm({ ...budgetForm, resetMonthly: true, carryOver: false })}
                      className="sr-only"
                    />
                    <div className={`p-3 rounded-lg border-2 text-center transition-all ${
                      budgetForm.resetMonthly && !budgetForm.carryOver
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}>
                      تصفير (للطوارئ)
                    </div>
                  </label>
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      name="carryOverOption"
                      checked={budgetForm.carryOver}
                      onChange={() => setBudgetForm({ ...budgetForm, resetMonthly: false, carryOver: true })}
                      className="sr-only"
                    />
                    <div className={`p-3 rounded-lg border-2 text-center transition-all ${
                      budgetForm.carryOver
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}>
                      للشهر القادم
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700"
                >
                  {editingBudget ? 'حفظ التعديلات' : 'إضافة'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBudgetModal(false);
                    setEditingBudget(null);
                    setTagInput('');
                    setBudgetForm({
                      name: '',
                      type: 'fixed',
                      amount: '',
                      percentage: '',
                      resetMonthly: true,
                      carryOver: false,
                      icon: 'shopping-cart',
                      color: 'emerald',
                      tags: []
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

      {/* Bill Modal */}
      {showBillModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full relative">
            <button
              onClick={() => {
                setShowBillModal(false);
                setEditingBill(null);
                setBillForm({
                  name: '',
                  amount: ''
                });
              }}
              className="absolute top-4 left-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="إغلاق"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl mb-4 pr-8">{editingBill ? 'تعديل الفاتورة' : 'فاتورة ثابتة جديدة'}</h3>
            <form onSubmit={handleSaveBill} className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">اسم الفاتورة</label>
                <input
                  type="text"
                  required
                  value={billForm.name}
                  onChange={(e) => setBillForm({ ...billForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="مثال: كهرباء، ماء، إنترنت"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">المبلغ (ريال)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={billForm.amount}
                  onChange={createNumberInputHandler((val) => setBillForm({ ...billForm, amount: val }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">الأيقونة</label>
                <div className="grid grid-cols-6 gap-2">
                  {iconOptions.map((opt) => {
                    const IconComponent = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setBillForm({ ...billForm, icon: opt.value })}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          billForm.icon === opt.value
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                        title={opt.label}
                      >
                        <IconComponent size={24} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">اللون</label>
                <div className="flex gap-2 flex-wrap">
                  {colorOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setBillForm({ ...billForm, color: opt.value })}
                      className={`w-12 h-12 rounded-lg border-2 transition-all ${
                        billForm.color === opt.value
                          ? 'border-gray-800 scale-110'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: opt.color }}
                      title={opt.label}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">يوم الاستحقاق (اختياري)</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={billForm.dueDay}
                  onChange={createNumberInputHandler((val) => setBillForm({ ...billForm, dueDay: val }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="مثال: 5 (اليوم الخامس من كل شهر)"
                />
                <p className="text-sm text-gray-600 mt-1">أدخل رقم اليوم من 1 إلى 31</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700"
                >
                  {editingBill ? 'حفظ التعديلات' : 'إضافة'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBillModal(false);
                    setEditingBill(null);
                    setBillForm({
                      name: '',
                      amount: '',
                      icon: 'zap',
                      color: 'orange',
                      dueDay: ''
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

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => {
                setShowExpenseModal(false);
                setEditingExpense(null);
                setExpenseForm({
                  budgetId: '',
                  amount: '',
                  merchant: '',
                  item: '',
                  note: '',
                  filterTag: ''
                });
              }}
              className="absolute top-4 left-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors z-10"
              title="إغلاق"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl mb-4 pr-8">{editingExpense ? 'تعديل المصروف' : 'مصروف جديد'}</h3>
            <form onSubmit={handleSaveExpense} className="space-y-4">
              {/* Filter by tags */}
              {!editingExpense && (() => {
                const allTags = Array.from(new Set(budgets.flatMap(b => b.tags || [])));
                return allTags.length > 0 ? (
                  <div>
                    <label className="block text-gray-700 mb-2">تصفية حسب الوسم</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setExpenseForm({ ...expenseForm, filterTag: '' })}
                        className={`px-3 py-1 rounded-full text-sm transition-all ${
                          expenseForm.filterTag === ''
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        الكل
                      </button>
                      {allTags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setExpenseForm({ ...expenseForm, filterTag: tag })}
                          className={`px-3 py-1 rounded-full text-sm transition-all ${
                            expenseForm.filterTag === tag
                              ? 'bg-emerald-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              <div>
                <label className="block text-gray-700 mb-2">الميزانية</label>
                {/* Visual Budget Selection with Icons */}
                <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-300 rounded-lg p-2">
                  {budgets
                    .filter(budget => 
                      !expenseForm.filterTag || 
                      (budget.tags && budget.tags.includes(expenseForm.filterTag))
                    )
                    .map((budget) => {
                      const Icon = getIconComponent(budget.icon);
                      const colors = getColorClasses(budget.color);
                      const total = getBudgetAmount(budget);
                      const remaining = total - budget.spent;
                      const isSelected = expenseForm.budgetId === budget.id;
                      
                      return (
                        <button
                          key={budget.id}
                          type="button"
                          onClick={() => setExpenseForm({ ...expenseForm, budgetId: budget.id })}
                          className={`w-full p-3 rounded-lg border-2 transition-all text-right ${
                            isSelected 
                              ? `${colors.border} ${colors.bg}` 
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${colors.bg} ${colors.text}`}>
                              <Icon size={20} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className={isSelected ? colors.text : 'text-gray-900'}>
                                  {budget.name}
                                </span>
                                {isSelected && (
                                  <CheckCircle size={16} className={colors.text} />
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-gray-600">
                                  متبقي: {remaining.toFixed(0)} ريال
                                </span>
                                {budget.tags && budget.tags.length > 0 && (
                                  <span className="text-xs text-gray-500">
                                    • {budget.tags.join(', ')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                </div>
                {!expenseForm.budgetId && (
                  <p className="text-xs text-red-500 mt-1">يرجى اختيار ميزانية</p>
                )}
              </div>

              {/* Show date when editing */}
              {editingExpense && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">التاريخ:</span>
                    <span className="font-medium">
                      {new Date(editingExpense.createdAt).toLocaleString('ar-SA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-gray-700 mb-2">المبلغ (ريال)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={expenseForm.amount}
                  onChange={createNumberInputHandler((val) => setExpenseForm({ ...expenseForm, amount: val }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">التاجر</label>
                <input
                  type="text"
                  required
                  value={expenseForm.merchant}
                  onChange={(e) => setExpenseForm({ ...expenseForm, merchant: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="اسم المتجر أو الخدمة"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">العنصر (اختياري)</label>
                <input
                  type="text"
                  value={expenseForm.item}
                  onChange={(e) => setExpenseForm({ ...expenseForm, item: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="مثال: وجبة عشاء، تعبئة وقود"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">ملاحظات (اختياري)</label>
                <textarea
                  value={expenseForm.note}
                  onChange={(e) => setExpenseForm({ ...expenseForm, note: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={3}
                  placeholder="أي ملاحظات إضافية"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700"
                >
                  {editingExpense ? 'حفظ التعديلات' : 'إضافة'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExpenseModal(false);
                    setEditingExpense(null);
                    setExpenseForm({
                      budgetId: '',
                      amount: '',
                      merchant: '',
                      item: '',
                      note: '',
                      filterTag: ''
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

      {/* Delete Budget Confirmation Modal */}
      {showDeleteModal && budgetToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full relative">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setBudgetToDelete(null);
                setDeleteOption('transfer');
                setTransferToBudgetId('');
              }}
              className="absolute top-4 left-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="إغلاق"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl mb-4 text-red-600 pr-8">تأكيد حذف الميزانية</h3>
            
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-gray-700">
                يوجد <span className="font-bold">{expenses.filter(exp => exp.budgetId === budgetToDelete.id).length}</span> مصروف
                مرتبط بميزانية "{budgetToDelete.name}"
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <label className="flex items-start gap-3 cursor-pointer p-3 border-2 rounded-lg transition-all hover:bg-gray-50" 
                     style={{ borderColor: deleteOption === 'transfer' ? '#10b981' : '#e5e7eb' }}>
                <input
                  type="radio"
                  name="deleteOption"
                  checked={deleteOption === 'transfer'}
                  onChange={() => setDeleteOption('transfer')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">نقل المصروفات لميزانية أخرى</div>
                  <div className="text-sm text-gray-600 mt-1">سيتم الحفاظ على جميع المصروفات في ميزانية أخرى</div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer p-3 border-2 rounded-lg transition-all hover:bg-gray-50"
                     style={{ borderColor: deleteOption === 'delete' ? '#10b981' : '#e5e7eb' }}>
                <input
                  type="radio"
                  name="deleteOption"
                  checked={deleteOption === 'delete'}
                  onChange={() => setDeleteOption('delete')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">حذف المصروفات نهائياً</div>
                  <div className="text-sm text-red-600 mt-1">⚠️ سيتم حذف جميع المصروفات ولا يمكن التراجع</div>
                </div>
              </label>
            </div>

            {deleteOption === 'transfer' && (
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">نقل المصروفات إلى</label>
                <select
                  value={transferToBudgetId}
                  onChange={(e) => setTransferToBudgetId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="">اختر الميزانية</option>
                  {budgets
                    .filter(b => b.id !== budgetToDelete.id)
                    .map(budget => (
                      <option key={budget.id} value={budget.id}>{budget.name}</option>
                    ))}
                </select>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (deleteOption === 'transfer' && !transferToBudgetId) {
                    alert('الرجاء اختيار ميزانية لنقل المصروفات إليها');
                    return;
                  }
                  performDelete(budgetToDelete.id, deleteOption === 'transfer' ? transferToBudgetId : null);
                }}
                disabled={actionLoading}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                تأكيد الحذف
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setBudgetToDelete(null);
                }}
                disabled={actionLoading}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Expense Modal - Budget Selection */}
      {showQuickExpenseModal && !expenseForm.budgetId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto relative">
            <button
              onClick={() => {
                setShowQuickExpenseModal(false);
                setExpenseForm({
                  budgetId: '',
                  amount: '',
                  merchant: '',
                  item: '',
                  note: '',
                  filterTag: ''
                });
              }}
              className="absolute top-4 left-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="إغلاق"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl mb-4 pr-8">اختر الميزانية</h3>
            {budgets.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">لا توجد ميزانيات متاحة</p>
                <button
                  onClick={() => {
                    setShowQuickExpenseModal(false);
                    setTagInput('');
                    setShowBudgetModal(true);
                  }}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
                >
                  إضافة ميزانية جديدة
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {budgets.map((budget) => {
                const Icon = getIconComponent(budget.icon);
                const colors = getColorClasses(budget.color);
                const total = getBudgetAmount(budget);
                const remaining = total - budget.spent;
                
                return (
                  <button
                    key={budget.id}
                    onClick={() => {
                      setExpenseForm({ ...expenseForm, budgetId: budget.id });
                      setShowExpenseModal(true);
                    }}
                    className={`w-full p-4 rounded-lg border-2 hover:shadow-md transition-all text-right ${colors.border} hover:bg-gray-50`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg ${colors.bg} ${colors.text}`}>
                        <Icon size={24} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{budget.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-gray-600">
                            متبقي: {remaining.toFixed(0)} ريال
                          </span>
                          {budget.tags && budget.tags.length > 0 && (
                            <span className="text-xs text-gray-500">
                              • {budget.tags.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
              </div>
            )}
            <button
              onClick={() => {
                setShowQuickExpenseModal(false);
                setExpenseForm({
                  budgetId: '',
                  amount: '',
                  merchant: '',
                  item: '',
                  note: '',
                  filterTag: ''
                });
              }}
              className="w-full mt-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setShowQuickExpenseModal(true)}
        className="fixed bottom-6 right-6 bg-emerald-600 text-white px-5 py-4 rounded-full shadow-lg hover:bg-emerald-700 hover:shadow-xl transition-all z-40 flex items-center gap-2 active:scale-95"
        title="إضافة مصروف سريع"
      >
        <Plus size={24} />
        <span className="hidden sm:inline font-medium">مصروف سريع</span>
      </button>

      {/* Action Loader */}
      {actionLoading && <Loader text="جاري التحميل..." />}
    </div>
  );
}
