import React, { useState } from 'react';
import Modal from './Modal';
import InputField from './common/InputField';
import type { Purchase, FinancialAccount } from '../types';

interface AddPaymentModalProps {
  purchase: Purchase;
  accounts: FinancialAccount[];
  onClose: () => void;
  onAddPayment: (purchaseId: string, amount: number, accountId: string) => void;
}

const AddPaymentModal: React.FC<AddPaymentModalProps> = ({ purchase, accounts, onClose, onAddPayment }) => {
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState(accounts.find(a => a.type === 'cash')?.id || '');
  const [error, setError] = useState('');

  const totalPaid = purchase.payments.reduce((sum, p) => sum + p.amount, 0);
  const remainingAmount = purchase.totalCost - totalPaid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('الرجاء إدخال مبلغ صحيح.');
      return;
    }
    if (numAmount > remainingAmount + 0.01) { // Add tolerance for float issues
      setError(`المبلغ المدفوع أكبر من المبلغ المتبقي (${remainingAmount.toFixed(2)}).`);
      return;
    }
    if (!accountId) {
      setError('الرجاء اختيار حساب الدفع.');
      return;
    }
    onAddPayment(purchase.id, numAmount, accountId);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`إضافة دفعة لفاتورة ${purchase.supplierName}`}>
      <div className="mb-4 p-3 bg-slate-100 rounded-lg text-sm">
        <p><strong>التكلفة الإجمالية:</strong> {purchase.totalCost.toFixed(2)}</p>
        <p><strong>المبلغ المدفوع:</strong> {totalPaid.toFixed(2)}</p>
        <p className="font-bold text-indigo-600">المبلغ المتبقي: {remainingAmount.toFixed(2)}</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          id="amount"
          label="مبلغ الدفعة"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          error={error}
          type="number"
        />
        <div>
            <label htmlFor="accountId" className="block text-slate-700 text-sm font-bold mb-2">الدفع من حساب</label>
            <select
                id="accountId"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="appearance-none border rounded-lg w-full py-2 px-3 text-slate-700 bg-white"
            >
                <option value="">-- اختر الحساب --</option>
                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>)}
            </select>
        </div>
        <div className="flex items-center justify-end gap-3 pt-6 mt-4 border-t border-slate-200">
          <button type="button" onClick={onClose} className="bg-slate-100 text-slate-700 font-bold py-2 px-4 rounded-lg hover:bg-slate-200 transition-colors">إلغاء</button>
          <button type="submit" className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">إضافة الدفعة</button>
        </div>
      </form>
    </Modal>
  );
};

export default AddPaymentModal;
