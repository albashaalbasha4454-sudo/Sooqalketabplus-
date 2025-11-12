import React, { useState, useMemo } from 'react';
import Modal from './Modal';
import InputField from './common/InputField';
import type { FinancialAccount, Budget } from '../types';

interface FinancialTransactionModalProps {
  type: 'expense' | 'capital_deposit' | 'profit_withdrawal' | 'transfer';
  accounts: FinancialAccount[];
  budgets: Budget[];
  onClose: () => void;
  onSave: (data: any) => void;
}

const FinancialTransactionModal: React.FC<FinancialTransactionModalProps> = ({ type, accounts, budgets, onClose, onSave }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [fromAccountId, setFromAccountId] = useState(accounts.find(a => a.type === 'cash')?.id || '');
  const [toAccountId, setToAccountId] = useState(accounts.find(a => a.type === 'cash')?.id || '');
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');
  
  const { title, fields } = useMemo(() => {
    switch (type) {
      case 'expense':
        return { title: 'تسجيل مصروف جديد', fields: ['description', 'amount', 'from', 'category'] };
      case 'capital_deposit':
        return { title: 'إيداع في رأس المال', fields: ['amount', 'to', 'description'] };
      case 'profit_withdrawal':
        return { title: 'سحب من الأرباح', fields: ['amount', 'from', 'description'] };
      case 'transfer':
        return { title: 'تحويل بين الحسابات', fields: ['amount', 'from', 'to', 'description', 'category'] }; // Category can be used for budgeting
      default:
        return { title: 'حركة مالية', fields: [] };
    }
  }, [type]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('المبلغ يجب أن يكون رقماً موجباً.'); return;
    }
    if (fields.includes('description') && !description.trim()) {
      setError('البيان مطلوب.'); return;
    }
    if ((type === 'expense' || type === 'profit_withdrawal' || type === 'transfer') && !fromAccountId) {
        setError('يجب تحديد الحساب المصدر.'); return;
    }
    if ((type === 'capital_deposit' || type === 'transfer') && !toAccountId) {
        setError('يجب تحديد الحساب الهدف.'); return;
    }
    if (type === 'transfer' && fromAccountId === toAccountId) {
        setError('لا يمكن التحويل من وإلى نفس الحساب.'); return;
    }

    onSave({
        type, 
        description: description.trim() || `حركة من نوع ${title}`, 
        amount: numAmount, 
        category: category.trim(),
        fromAccountId: (type === 'expense' || type === 'profit_withdrawal' || type === 'transfer') ? fromAccountId : undefined,
        toAccountId: (type === 'capital_deposit' || type === 'transfer') ? toAccountId : undefined,
    });
    onClose();
  };
  
  const accountSelector = (id: string, label: string, value: string, setValue: (val: string) => void) => (
     <div>
        <label htmlFor={id} className="block text-slate-700 text-sm font-bold mb-2">{label}</label>
        <select id={id} value={value} onChange={e => setValue(e.target.value)} className="w-full p-2 border rounded-lg bg-white border-slate-300">
            <option value="">-- اختر --</option>
            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
        </select>
    </div>
  );

  return (
    <Modal isOpen={true} onClose={onClose} title={title} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.includes('description') && <InputField id="description" label="البيان / الوصف" value={description} onChange={e => setDescription(e.target.value)} />}
        {fields.includes('amount') && <InputField id="amount" label="المبلغ" value={amount} onChange={e => setAmount(e.target.value)} type="number" />}
        {fields.includes('from') && accountSelector('fromAccount', 'من حساب', fromAccountId, setFromAccountId)}
        {fields.includes('to') && accountSelector('toAccount', 'إلى حساب', toAccountId, setToAccountId)}
        {fields.includes('category') && (
            <div>
                <label htmlFor="category" className="block text-slate-700 text-sm font-bold mb-2">التصنيف / الغرض</label>
                <input list="categories" id="category-input" value={category} onChange={e => setCategory(e.target.value)} className="appearance-none border rounded-lg w-full py-2 px-3 text-slate-700" />
                <datalist id="categories">
                    <option value="مصاريف تشغيلية" />
                    <option value="إيجار" />
                    <option value="فواتير" />
                    {budgets.map(b => <option key={b.id} value={`تمويل: ${b.name}`} />)}
                </datalist>
            </div>
        )}
        
        {error && <p className="text-red-500 text-xs italic mt-1">{error}</p>}
        <div className="flex items-center justify-end gap-3 pt-6 mt-4 border-t border-slate-200">
          <button type="button" onClick={onClose} className="bg-slate-100 text-slate-700 font-bold py-2 px-4 rounded-lg hover:bg-slate-200 transition-colors">إلغاء</button>
          <button type="submit" className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">حفظ الحركة</button>
        </div>
      </form>
    </Modal>
  );
};

export default FinancialTransactionModal;
