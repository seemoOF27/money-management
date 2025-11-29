import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

app.use('*', cors());
app.use('*', logger(console.log));

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Helper to log operations
async function logOperation(userId: string, action: string, entity: string, oldValue: any, newValue: any) {
  const operations = await kv.get(`operations:${userId}`) || [];
  operations.unshift({
    id: crypto.randomUUID(),
    action,
    entity,
    oldValue,
    newValue,
    timestamp: new Date().toISOString()
  });
  // Keep last 100 operations
  await kv.set(`operations:${userId}`, operations.slice(0, 100));
}

// ============== Auth Routes ==============

app.post('/make-server-5e068ea9/signup', async (c) => {
  try {
    const { email, password, name, salary } = await c.req.json();

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.log('Error creating user during signup:', error);
      return c.json({ error: error.message }, 400);
    }

    // Initialize user data
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email,
      name,
      salary: parseFloat(salary) || 0,
      additionalIncome: 0,
      investmentPercentage: 10,
      emergencyPercentage: 10,
      remainingTarget: 'emergency', // 'emergency' or 'investment'
      createdAt: new Date().toISOString()
    });

    await kv.set(`budgets:${data.user.id}`, []);
    await kv.set(`expenses:${data.user.id}`, []);
    await kv.set(`bills:${data.user.id}`, []);
    await kv.set(`debts:${data.user.id}`, []);
    await kv.set(`investments:${data.user.id}`, []);
    await kv.set(`operations:${data.user.id}`, []);
    await kv.set(`incomeSources:${data.user.id}`, []);

    return c.json({ success: true, user: data.user });
  } catch (error) {
    console.log('Error in signup route:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// ============== User Routes ==============

app.get('/make-server-5e068ea9/user', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    return c.json({ user: userData });
  } catch (error) {
    console.log('Error fetching user:', error);
    return c.json({ error: String(error) }, 500);
  }
});

app.put('/make-server-5e068ea9/user', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const updates = await c.req.json();
    const oldData = await kv.get(`user:${user.id}`);
    const newData = { ...oldData, ...updates };
    await kv.set(`user:${user.id}`, newData);

    await logOperation(user.id, 'تحديث', 'إعدادات المستخدم', oldData, newData);

    return c.json({ user: newData });
  } catch (error) {
    console.log('Error updating user:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// ============== Budget Routes ==============

app.get('/make-server-5e068ea9/budgets', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const budgets = await kv.get(`budgets:${user.id}`) || [];
    return c.json({ budgets });
  } catch (error) {
    console.log('Error fetching budgets:', error);
    return c.json({ error: String(error) }, 500);
  }
});

app.post('/make-server-5e068ea9/budgets', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const budgetData = await c.req.json();
    const budgets = await kv.get(`budgets:${user.id}`) || [];
    
    const newBudget = {
      id: crypto.randomUUID(),
      ...budgetData,
      spent: 0,
      createdAt: new Date().toISOString()
    };

    budgets.push(newBudget);
    await kv.set(`budgets:${user.id}`, budgets);

    await logOperation(user.id, 'إضافة', 'ميزانية', null, newBudget);

    return c.json({ budget: newBudget });
  } catch (error) {
    console.log('Error creating budget:', error);
    return c.json({ error: String(error) }, 500);
  }
});

app.put('/make-server-5e068ea9/budgets/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const budgetId = c.req.param('id');
    const updates = await c.req.json();
    const budgets = await kv.get(`budgets:${user.id}`) || [];
    
    const index = budgets.findIndex((b: any) => b.id === budgetId);
    if (index === -1) {
      return c.json({ error: 'Budget not found' }, 404);
    }

    const oldBudget = budgets[index];
    budgets[index] = { ...oldBudget, ...updates };
    await kv.set(`budgets:${user.id}`, budgets);

    await logOperation(user.id, 'تعديل', 'ميزانية', oldBudget, budgets[index]);

    return c.json({ budget: budgets[index] });
  } catch (error) {
    console.log('Error updating budget:', error);
    return c.json({ error: String(error) }, 500);
  }
});

app.delete('/make-server-5e068ea9/budgets/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const budgetId = c.req.param('id');
    const budgets = await kv.get(`budgets:${user.id}`) || [];
    
    const deletedBudget = budgets.find((b: any) => b.id === budgetId);
    const filtered = budgets.filter((b: any) => b.id !== budgetId);
    await kv.set(`budgets:${user.id}`, filtered);

    await logOperation(user.id, 'حذف', 'ميزانية', deletedBudget, null);

    return c.json({ success: true });
  } catch (error) {
    console.log('Error deleting budget:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// ============== Expense Routes ==============

app.get('/make-server-5e068ea9/expenses', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const expenses = await kv.get(`expenses:${user.id}`) || [];
    return c.json({ expenses });
  } catch (error) {
    console.log('Error fetching expenses:', error);
    return c.json({ error: String(error) }, 500);
  }
});

app.post('/make-server-5e068ea9/expenses', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const expenseData = await c.req.json();
    const expenses = await kv.get(`expenses:${user.id}`) || [];
    const budgets = await kv.get(`budgets:${user.id}`) || [];
    
    const newExpense = {
      id: crypto.randomUUID(),
      ...expenseData,
      createdAt: new Date().toISOString()
    };

    // Update budget spent amount
    const budgetIndex = budgets.findIndex((b: any) => b.id === expenseData.budgetId);
    if (budgetIndex !== -1) {
      budgets[budgetIndex].spent = (budgets[budgetIndex].spent || 0) + parseFloat(expenseData.amount);
      await kv.set(`budgets:${user.id}`, budgets);
    }

    expenses.push(newExpense);
    await kv.set(`expenses:${user.id}`, expenses);

    await logOperation(user.id, 'إضافة', 'مصروف', null, newExpense);

    return c.json({ expense: newExpense });
  } catch (error) {
    console.log('Error creating expense:', error);
    return c.json({ error: String(error) }, 500);
  }
});

app.put('/make-server-5e068ea9/expenses/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const expenseId = c.req.param('id');
    const updates = await c.req.json();
    const expenses = await kv.get(`expenses:${user.id}`) || [];
    const budgets = await kv.get(`budgets:${user.id}`) || [];
    
    const index = expenses.findIndex((e: any) => e.id === expenseId);
    if (index === -1) {
      return c.json({ error: 'Expense not found' }, 404);
    }

    const oldExpense = expenses[index];
    
    // Update budget spent amounts
    if (oldExpense.budgetId) {
      const oldBudgetIndex = budgets.findIndex((b: any) => b.id === oldExpense.budgetId);
      if (oldBudgetIndex !== -1) {
        budgets[oldBudgetIndex].spent -= parseFloat(oldExpense.amount);
      }
    }
    
    if (updates.budgetId) {
      const newBudgetIndex = budgets.findIndex((b: any) => b.id === updates.budgetId);
      if (newBudgetIndex !== -1) {
        budgets[newBudgetIndex].spent = (budgets[newBudgetIndex].spent || 0) + parseFloat(updates.amount || oldExpense.amount);
      }
    }
    
    await kv.set(`budgets:${user.id}`, budgets);

    expenses[index] = { ...oldExpense, ...updates };
    await kv.set(`expenses:${user.id}`, expenses);

    await logOperation(user.id, 'تعديل', 'مصروف', oldExpense, expenses[index]);

    return c.json({ expense: expenses[index] });
  } catch (error) {
    console.log('Error updating expense:', error);
    return c.json({ error: String(error) }, 500);
  }
});

app.delete('/make-server-5e068ea9/expenses/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const expenseId = c.req.param('id');
    const expenses = await kv.get(`expenses:${user.id}`) || [];
    const budgets = await kv.get(`budgets:${user.id}`) || [];
    
    const deletedExpense = expenses.find((e: any) => e.id === expenseId);
    
    if (deletedExpense?.budgetId) {
      const budgetIndex = budgets.findIndex((b: any) => b.id === deletedExpense.budgetId);
      if (budgetIndex !== -1) {
        budgets[budgetIndex].spent -= parseFloat(deletedExpense.amount);
        await kv.set(`budgets:${user.id}`, budgets);
      }
    }

    const filtered = expenses.filter((e: any) => e.id !== expenseId);
    await kv.set(`expenses:${user.id}`, filtered);

    await logOperation(user.id, 'حذف', 'مصروف', deletedExpense, null);

    return c.json({ success: true });
  } catch (error) {
    console.log('Error deleting expense:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// ============== Bill Routes ==============

app.get('/make-server-5e068ea9/bills', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const bills = await kv.get(`bills:${user.id}`) || [];
    return c.json({ bills });
  } catch (error) {
    console.log('Error fetching bills:', error);
    return c.json({ error: String(error) }, 500);
  }
});

app.post('/make-server-5e068ea9/bills', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const billData = await c.req.json();
    const bills = await kv.get(`bills:${user.id}`) || [];
    
    const newBill = {
      id: crypto.randomUUID(),
      ...billData,
      isPaid: false,
      createdAt: new Date().toISOString()
    };

    bills.push(newBill);
    await kv.set(`bills:${user.id}`, bills);

    await logOperation(user.id, 'إضافة', 'فاتورة ثابتة', null, newBill);

    return c.json({ bill: newBill });
  } catch (error) {
    console.log('Error creating bill:', error);
    return c.json({ error: String(error) }, 500);
  }
});

app.put('/make-server-5e068ea9/bills/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const billId = c.req.param('id');
    const updates = await c.req.json();
    const bills = await kv.get(`bills:${user.id}`) || [];
    
    const index = bills.findIndex((b: any) => b.id === billId);
    if (index === -1) {
      return c.json({ error: 'Bill not found' }, 404);
    }

    const oldBill = bills[index];
    bills[index] = { ...oldBill, ...updates };
    await kv.set(`bills:${user.id}`, bills);

    await logOperation(user.id, 'تعديل', 'فاتورة ثابتة', oldBill, bills[index]);

    return c.json({ bill: bills[index] });
  } catch (error) {
    console.log('Error updating bill:', error);
    return c.json({ error: String(error) }, 500);
  }
});

app.delete('/make-server-5e068ea9/bills/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const billId = c.req.param('id');
    const bills = await kv.get(`bills:${user.id}`) || [];
    
    const deletedBill = bills.find((b: any) => b.id === billId);
    const filtered = bills.filter((b: any) => b.id !== billId);
    await kv.set(`bills:${user.id}`, filtered);

    await logOperation(user.id, 'حذف', 'فاتورة ثابتة', deletedBill, null);

    return c.json({ success: true });
  } catch (error) {
    console.log('Error deleting bill:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// ============== Debt Routes ==============

app.get('/make-server-5e068ea9/debts', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const debts = await kv.get(`debts:${user.id}`) || [];
    return c.json({ debts });
  } catch (error) {
    console.log('Error fetching debts:', error);
    return c.json({ error: String(error) }, 500);
  }
});

app.post('/make-server-5e068ea9/debts', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const debtData = await c.req.json();
    const debts = await kv.get(`debts:${user.id}`) || [];
    
    const newDebt = {
      id: crypto.randomUUID(),
      ...debtData,
      paid: 0,
      payments: [],
      status: 'active',
      createdAt: new Date().toISOString()
    };

    debts.push(newDebt);
    await kv.set(`debts:${user.id}`, debts);

    await logOperation(user.id, 'إضافة', 'دين', null, newDebt);

    return c.json({ debt: newDebt });
  } catch (error) {
    console.log('Error creating debt:', error);
    return c.json({ error: String(error) }, 500);
  }
});

app.post('/make-server-5e068ea9/debts/:id/payment', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const debtId = c.req.param('id');
    const { amount, note } = await c.req.json();
    const debts = await kv.get(`debts:${user.id}`) || [];
    
    const index = debts.findIndex((d: any) => d.id === debtId);
    if (index === -1) {
      return c.json({ error: 'Debt not found' }, 404);
    }

    const oldDebt = { ...debts[index] };
    const payment = {
      id: crypto.randomUUID(),
      amount: parseFloat(amount),
      note,
      date: new Date().toISOString()
    };

    debts[index].payments.push(payment);
    debts[index].paid = (debts[index].paid || 0) + parseFloat(amount);
    
    if (debts[index].paid >= debts[index].amount) {
      debts[index].status = 'completed';
    }

    await kv.set(`debts:${user.id}`, debts);

    await logOperation(user.id, 'إضافة سداد', 'دين', oldDebt, debts[index]);

    return c.json({ debt: debts[index] });
  } catch (error) {
    console.log('Error adding payment:', error);
    return c.json({ error: String(error) }, 500);
  }
});

app.put('/make-server-5e068ea9/debts/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const debtId = c.req.param('id');
    const updates = await c.req.json();
    const debts = await kv.get(`debts:${user.id}`) || [];
    
    const index = debts.findIndex((d: any) => d.id === debtId);
    if (index === -1) {
      return c.json({ error: 'Debt not found' }, 404);
    }

    const oldDebt = debts[index];
    debts[index] = { ...oldDebt, ...updates };
    await kv.set(`debts:${user.id}`, debts);

    await logOperation(user.id, 'تعديل', 'دين', oldDebt, debts[index]);

    return c.json({ debt: debts[index] });
  } catch (error) {
    console.log('Error updating debt:', error);
    return c.json({ error: String(error) }, 500);
  }
});

app.delete('/make-server-5e068ea9/debts/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const debtId = c.req.param('id');
    const debts = await kv.get(`debts:${user.id}`) || [];
    
    const deletedDebt = debts.find((d: any) => d.id === debtId);
    const filtered = debts.filter((d: any) => d.id !== debtId);
    await kv.set(`debts:${user.id}`, filtered);

    await logOperation(user.id, 'حذف', 'دين', deletedDebt, null);

    return c.json({ success: true });
  } catch (error) {
    console.log('Error deleting debt:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// ============== Investment Routes ==============

app.get('/make-server-5e068ea9/investments', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const investments = await kv.get(`investments:${user.id}`) || [];
    return c.json({ investments });
  } catch (error) {
    console.log('Error fetching investments:', error);
    return c.json({ error: String(error) }, 500);
  }
});

app.post('/make-server-5e068ea9/investments/transfer', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { type, amount, note } = await c.req.json();
    const investments = await kv.get(`investments:${user.id}`) || [];
    
    const transaction = {
      id: crypto.randomUUID(),
      type,
      amount: parseFloat(amount),
      note,
      date: new Date().toISOString()
    };

    investments.push(transaction);
    await kv.set(`investments:${user.id}`, investments);

    await logOperation(user.id, 'إضافة', type === 'investment' ? 'استثمار' : 'صندوق الطوارئ', null, transaction);

    return c.json({ transaction });
  } catch (error) {
    console.log('Error creating investment:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// ============== Income Sources Routes ==============

app.get('/make-server-5e068ea9/income-sources', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const incomeSources = await kv.get(`incomeSources:${user.id}`) || [];
    return c.json({ incomeSources });
  } catch (error) {
    console.log('Error fetching income sources:', error);
    return c.json({ error: String(error) }, 500);
  }
});

app.post('/make-server-5e068ea9/income-sources', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const incomeData = await c.req.json();
    const incomeSources = await kv.get(`incomeSources:${user.id}`) || [];
    
    const newIncomeSource = {
      id: crypto.randomUUID(),
      ...incomeData,
      createdAt: new Date().toISOString()
    };

    incomeSources.push(newIncomeSource);
    await kv.set(`incomeSources:${user.id}`, incomeSources);

    await logOperation(user.id, 'إضافة', 'مصدر دخل', null, newIncomeSource);

    return c.json({ incomeSource: newIncomeSource });
  } catch (error) {
    console.log('Error creating income source:', error);
    return c.json({ error: String(error) }, 500);
  }
});

app.put('/make-server-5e068ea9/income-sources/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const incomeId = c.req.param('id');
    const updates = await c.req.json();
    const incomeSources = await kv.get(`incomeSources:${user.id}`) || [];
    
    const index = incomeSources.findIndex((i: any) => i.id === incomeId);
    if (index === -1) {
      return c.json({ error: 'Income source not found' }, 404);
    }

    const oldIncomeSource = incomeSources[index];
    incomeSources[index] = { ...oldIncomeSource, ...updates };
    await kv.set(`incomeSources:${user.id}`, incomeSources);

    await logOperation(user.id, 'تعديل', 'مصدر دخل', oldIncomeSource, incomeSources[index]);

    return c.json({ incomeSource: incomeSources[index] });
  } catch (error) {
    console.log('Error updating income source:', error);
    return c.json({ error: String(error) }, 500);
  }
});

app.delete('/make-server-5e068ea9/income-sources/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const incomeId = c.req.param('id');
    const incomeSources = await kv.get(`incomeSources:${user.id}`) || [];
    
    const deletedIncomeSource = incomeSources.find((i: any) => i.id === incomeId);
    const filtered = incomeSources.filter((i: any) => i.id !== incomeId);
    await kv.set(`incomeSources:${user.id}`, filtered);

    await logOperation(user.id, 'حذف', 'مصدر دخل', deletedIncomeSource, null);

    return c.json({ success: true });
  } catch (error) {
    console.log('Error deleting income source:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// ============== Operations Routes ==============

app.get('/make-server-5e068ea9/operations', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const operations = await kv.get(`operations:${user.id}`) || [];
    return c.json({ operations });
  } catch (error) {
    console.log('Error fetching operations:', error);
    return c.json({ error: String(error) }, 500);
  }
});

Deno.serve(app.fetch);
