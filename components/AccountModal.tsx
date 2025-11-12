
import React, { useState } from 'react';
import Modal from './Modal';
import InputField from './common/InputField';
import type { FinancialAccount } from '../types';

interface AccountModalProps {
  account: FinancialAccount | null;
  onClose: () => void;
  onSave: (data: Omit<FinancialAccount, 'id' | 'balance'>) => void;
}

const AccountModal: React.FC<AccountModalProps> = ({ account, onClose, onSave }) => {
  const [name, setName] = useState(account?.name || '');
  const [type, setType] = useState<FinancialAccount['type']>(account?.type || 'cash');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('الرجاء إدخال اسم للحساب.');
      return;
    }
    onSave({ name: name.trim(), type });
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={account ? 'تعديل حساب مالي' : 'إضافة حساب مالي جديد'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField 
            id="name" 
            label="اسم الحساب" 
            value={name} 
            onChange={e => setName(e.target.value)} 
        />
        
        <div>
            <label htmlFor="type" className="block text-slate-700 text-sm font-bold mb-2">نوع الحساب</label>
            <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value as FinancialAccount['type'])}
                className="appearance-none border rounded-lg w-full py-2 px-3 text-slate-700 bg-white"
            >
                <option value="cash">صندوق (كاش)</option>
                <option value="bank">بنك</option>
                <option value="other">أخرى</option>
            </select>
        </div>

        {error && <p className="text-red-500 text-xs italic">{error}</p>}
        <div className="flex items-center justify-end gap-3 pt-6 mt-4 border-t border-slate-200">
          <button type="button" onClick={onClose} className="bg-slate-100 text-slate-700 font-bold py-2 px-4 rounded-lg hover:bg-slate-200 transition-colors">إلغاء</button>
          <button type="submit" className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">
            حفظ
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AccountModal;
