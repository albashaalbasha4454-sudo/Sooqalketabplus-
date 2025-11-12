import React, { useState, useMemo } from 'react';
import type { FinancialAccount, FinancialTransaction, Budget } from '../types';
import AccountModal from './AccountModal';
import FinancialTransactionModal from './FinancialTransactionModal';
import BudgetModal from './BudgetModal';

interface FinanceViewProps {
  accounts: FinancialAccount[];
  accountBalances: Map<string, number>;
  transactions: FinancialTransaction[];
  budgets: Budget[];
  onSaveAccount: (data: Omit<FinancialAccount, 'id'>) => void;
  onSaveTransaction: (data: any) => void;
  onSaveBudget: (data: Omit<Budget, 'id'>) => void;
}

const FinanceView: React.FC<FinanceViewProps> = ({ accounts, accountBalances, transactions, budgets, onSaveAccount, onSaveTransaction, onSaveBudget }) => {
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<any>('expense');

  const handleOpenTransactionModal = (type: any) => {
    setTransactionType(type);
    setIsTransactionModalOpen(true);
  };
  
  const budgetProgress = useMemo(() => {
    const progress = new Map<string, number>();
    budgets.forEach(b => {
        const fundedAmount = transactions
            .filter(tx => tx.category === `تمويل: ${b.name}` && tx.type === 'transfer')
            .reduce((sum, tx) => sum + tx.amount, 0);
        progress.set(b.id, fundedAmount);
    });
    return progress;
  }, [budgets, transactions]);
  
  const getTransactionDescription = (tx: FinancialTransaction): string => {
    const from = accounts.find(a => a.id === tx.fromAccountId)?.name;
    const to = accounts.find(a => a.id === tx.toAccountId)?.name;
    switch(tx.type) {
        case 'sale_income': return `إيراد مبيعات ${tx.description}`;
        case 'expense': return `مصروف: ${tx.description} (من ${from})`;
        case 'expense_reversal': return `إلغاء مصروف: ${tx.description} (إلى ${to})`;
        case 'capital_deposit': return `إيداع رأس مال في ${to}`;
        case 'profit_withdrawal': return `سحب أرباح من ${from}`;
        case 'supplier_payment': return `دفعة لمورد من ${from}`;
        case 'transfer': return `تحويل من ${from} إلى ${to}`;
        default: return tx.description;
    }
  }


  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white shadow-lg rounded-xl p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-4">أرصدة الحسابات</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {accounts.map(acc => (
                        <div key={acc.id} className="bg-slate-50 p-4 rounded-lg border">
                            <h4 className="font-semibold text-slate-600">{acc.name}</h4>
                            <p className="text-2xl font-bold text-green-600 mt-1">{(accountBalances.get(acc.id) || 0).toFixed(2)}</p>
                        </div>
                    ))}
                     <button onClick={() => setIsAccountModalOpen(true)} className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 text-slate-500 rounded-lg hover:bg-slate-100 hover:border-slate-400 transition">
                        <span className="material-symbols-outlined">add</span>
                        <span>إضافة حساب</span>
                    </button>
                </div>
            </div>

            <div className="bg-white shadow-lg rounded-xl p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-4">المخصصات المالية (الميزانيات)</h3>
                <div className="space-y-4">
                    {budgets.map(b => {
                        const funded = budgetProgress.get(b.id) || 0;
                        const percentage = b.targetAmount > 0 ? (funded / b.targetAmount) * 100 : 0;
                        const isLow = percentage < 25;
                        return (
                           <div key={b.id} className="p-4 border rounded-lg">
                               <div className="flex justify-between items-center mb-2">
                                   <span className="font-semibold">{b.name}</span>
                                   <span className={`font-bold text-sm ${isLow ? 'text-red-600' : 'text-slate-600'}`}>{funded.toFixed(2)} / {b.targetAmount.toFixed(2)}</span>
                               </div>
                               <div className="w-full bg-slate-200 rounded-full h-2.5">
                                   <div className={`h-2.5 rounded-full ${isLow ? 'bg-red-500' : 'bg-indigo-600'}`} style={{width: `${percentage}%`}}></div>
                               </div>
                               {isLow && <p className="text-xs text-red-500 mt-1">تنبيه: الرصيد الممول منخفض.</p>}
                           </div>
                        );
                    })}
                     <button onClick={() => setIsBudgetModalOpen(true)} className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 text-slate-500 rounded-lg hover:bg-slate-100 hover:border-slate-400 transition py-4">
                        <span className="material-symbols-outlined">add</span>
                        <span>إضافة مخصص جديد</span>
                    </button>
                </div>
            </div>
            
            <div className="bg-white shadow-lg rounded-xl p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-4">آخر الحركات المالية</h3>
                 <div className="overflow-x-auto max-h-96">
                  <table className="w-full table-auto text-right text-sm">
                    <thead className="bg-slate-50 text-slate-600 uppercase sticky top-0">
                      <tr>
                        <th className="py-2 px-4">التاريخ</th>
                        <th className="py-2 px-4">البيان</th>
                        <th className="py-2 px-4">المبلغ</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-700">
                      {[...transactions].reverse().slice(0, 20).map(tx => (
                        <tr key={tx.id} className="border-b border-slate-200 hover:bg-slate-50">
                          <td className="py-2 px-4 whitespace-nowrap">{new Date(tx.date).toLocaleString('ar-EG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="py-2 px-4">{getTransactionDescription(tx)}</td>
                          <td className={`py-2 px-4 font-bold ${tx.toAccountId && !tx.fromAccountId ? 'text-green-600' : 'text-red-600'}`}>{tx.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            </div>
        </div>
        {/* Actions Column */}
        <div className="lg:col-span-1 space-y-4">
            <div className="bg-white shadow-lg rounded-xl p-6">
                 <h3 className="text-xl font-bold text-slate-800 mb-4">إجراءات سريعة</h3>
                 <div className="flex flex-col gap-3">
                     <button onClick={() => handleOpenTransactionModal('expense')} className="w-full text-right flex items-center gap-3 p-3 bg-slate-100 hover:bg-slate-200 rounded-lg transition">
                        <span className="material-symbols-outlined text-red-600">arrow_upward</span> <span>تسجيل مصروف</span>
                     </button>
                     <button onClick={() => handleOpenTransactionModal('capital_deposit')} className="w-full text-right flex items-center gap-3 p-3 bg-slate-100 hover:bg-slate-200 rounded-lg transition">
                        <span className="material-symbols-outlined text-green-600">arrow_downward</span> <span>إيداع رأس مال</span>
                     </button>
                     <button onClick={() => handleOpenTransactionModal('profit_withdrawal')} className="w-full text-right flex items-center gap-3 p-3 bg-slate-100 hover:bg-slate-200 rounded-lg transition">
                        <span className="material-symbols-outlined text-orange-600">arrow_upward</span> <span>سحب أرباح</span>
                     </button>
                      <button onClick={() => handleOpenTransactionModal('transfer')} className="w-full text-right flex items-center gap-3 p-3 bg-slate-100 hover:bg-slate-200 rounded-lg transition">
                        <span className="material-symbols-outlined text-blue-600">sync_alt</span> <span>تحويل بين الحسابات</span>
                     </button>
                 </div>
            </div>
        </div>

        {isAccountModalOpen && <AccountModal account={null} onClose={() => setIsAccountModalOpen(false)} onSave={onSaveAccount} />}
        {isTransactionModalOpen && <FinancialTransactionModal type={transactionType} accounts={accounts} budgets={budgets} onClose={() => setIsTransactionModalOpen(false)} onSave={onSaveTransaction} />}
        {isBudgetModalOpen && <BudgetModal onClose={() => setIsBudgetModalOpen(false)} onSave={onSaveBudget} />}
    </div>
  );
};

export default FinanceView;