import React, { useState } from 'react';
import Modal from './Modal';
import InputField from './common/InputField';

interface CapitalTransactionModalProps {
  type: 'deposit' | 'withdrawal';
  onClose: () => void;
  onSave: (data: { amount: number, description: string }) => void;
}

const CapitalTransactionModal: React.FC<CapitalTransactionModalProps> = ({ type, onClose, onSave }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('الرجاء إدخال مبلغ صحيح.');
      return;
    }
    if (!description.trim()) {
      setError('الرجاء إدخال بيان/وصف للحركة.');
      return;
    }
    onSave({ amount: numAmount, description: description.trim() });
  };

  const title = type === 'deposit' ? 'إضافة إيداع لرأس المال' : 'سحب من الأرباح';
  const buttonText = type === 'deposit' ? 'تأكيد الإيداع' : 'تأكيد السحب';
  const buttonClass = type === 'deposit' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700';

  return (
    <Modal isOpen={true} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField 
            id="amount" 
            label="المبلغ" 
            value={amount} 
            onChange={e => setAmount(e.target.value)} 
            type="number" 
        />
        <InputField 
            id="description" 
            label="البيان / الوصف" 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
        />
        {error && <p className="text-red-500 text-xs italic">{error}</p>}
        <div className="flex items-center justify-end gap-3 pt-6 mt-4 border-t border-slate-200">
          <button type="button" onClick={onClose} className="bg-slate-100 text-slate-700 font-bold py-2 px-4 rounded-lg hover:bg-slate-200 transition-colors">إلغاء</button>
          <button type="submit" className={`text-white font-bold py-2 px-4 rounded-lg transition-colors ${buttonClass}`}>
            {buttonText}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CapitalTransactionModal;
