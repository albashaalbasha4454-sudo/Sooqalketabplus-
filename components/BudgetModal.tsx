import React, { useState } from 'react';
import Modal from './Modal';
import InputField from './common/InputField';
import type { Budget } from '../types';

interface BudgetModalProps {
  budget?: Budget | null;
  onClose: () => void;
  onSave: (data: Omit<Budget, 'id'>) => void;
}

const BudgetModal: React.FC<BudgetModalProps> = ({ budget, onClose, onSave }) => {
  const [name, setName] = useState(budget?.name || '');
  const [targetAmount, setTargetAmount] = useState(budget?.targetAmount.toString() || '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const numAmount = parseFloat(targetAmount);
    if (!name.trim()) {
      setError('الرجاء إدخال اسم للمخصص.');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('الرجاء إدخال مبلغ مستهدف صحيح.');
      return;
    }
    onSave({ name: name.trim(), targetAmount: numAmount });
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={budget ? 'تعديل مخصص مالي' : 'إضافة مخصص مالي جديد'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField 
            id="name" 
            label="اسم المخصص (مثال: شراء كتب جديدة، مصاريف تسويق)" 
            value={name} 
            onChange={e => setName(e.target.value)} 
        />
        <InputField 
            id="targetAmount" 
            label="المبلغ المستهدف" 
            value={targetAmount} 
            onChange={e => setTargetAmount(e.target.value)} 
            type="number"
        />
        
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

export default BudgetModal;
