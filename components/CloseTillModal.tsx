import React, { useMemo, useState } from 'react';
import type { Invoice, User, TillCloseout } from '../types';
import Modal from './Modal';
import InputField from './common/InputField';

interface CloseTillModalProps {
  invoices: Invoice[];
  currentUser: User;
  onClose: () => void;
  onConfirmCloseout: (data: Omit<TillCloseout, 'id'>) => void;
}

const CloseTillModal: React.FC<CloseTillModalProps> = ({ invoices, currentUser, onClose, onConfirmCloseout }) => {

  const [countedCash, setCountedCash] = useState('');
  const [notes, setNotes] = useState('');

  const { todaysSales, todaysReturns, totalSales, totalReturns, netCashExpected, todaysInvoiceIds } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysUserInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.paidDate || inv.date);
        return inv.processedBy === currentUser.username &&
               invDate >= today &&
               invDate < tomorrow;
    });

    const todaysSales = todaysUserInvoices.filter(inv => inv.type === 'sale' || (inv.type === 'shipping' && inv.status === 'completed' && inv.paymentStatus === 'paid'));
    const todaysReturns = todaysUserInvoices.filter(inv => inv.type === 'return');
    
    const totalSales = todaysSales.reduce((sum, inv) => sum + inv.total, 0);
    const totalReturns = todaysReturns.reduce((sum, inv) => sum + inv.total, 0); // is negative

    const netCashExpected = totalSales + totalReturns;
    const todaysInvoiceIds = todaysUserInvoices.map(inv => inv.id);

    return { todaysSales, todaysReturns, totalSales, totalReturns: Math.abs(totalReturns), netCashExpected, todaysInvoiceIds };
  }, [invoices, currentUser]);
  
  const difference = useMemo(() => {
      const counted = parseFloat(countedCash);
      if (isNaN(counted)) return 0;
      return counted - netCashExpected;
  }, [countedCash, netCashExpected]);


  const handleConfirm = () => {
    const counted = parseFloat(countedCash);
    if(isNaN(counted) || counted < 0) {
        alert("الرجاء إدخال مبلغ صحيح تم جرده.");
        return;
    }

    onConfirmCloseout({
        date: new Date().toISOString(),
        closedByUserId: currentUser.id,
        closedByUsername: currentUser.username,
        forDate: new Date().toISOString().split('T')[0],
        totalSales,
        totalReturns,
        netCashExpected,
        countedCash: counted,
        difference,
        notes,
        invoiceIds: todaysInvoiceIds
    });
    alert("تم حفظ تقرير الإغلاق بنجاح.");
    onClose();
  };

  const SummaryRow: React.FC<{label: string, value: number, color?: string}> = ({label, value, color = 'text-slate-800'}) => (
      <div className={`flex justify-between p-3 bg-slate-50 rounded-lg ${color}`}>
          <span className="font-semibold">{label}:</span>
          <span className="font-bold">{value.toFixed(2)}</span>
      </div>
  );

  return (
    <Modal isOpen={true} onClose={onClose} title={`إغلاق الصندوق ليوم ${new Date().toLocaleDateString('ar-EG')}`} size="lg">
        <div id="till-closeout-area">
            <h3 className="text-center text-xl font-bold mb-1">تقرير إغلاق الصندوق اليومي</h3>
            <p className="text-center text-sm text-slate-600 mb-4">
                <strong>الكاشير:</strong> {currentUser.username} | <strong>التاريخ:</strong> {new Date().toLocaleString('ar-EG')}
            </p>
            
            <div className="space-y-3 text-base mb-6">
                <SummaryRow label="إجمالي المبيعات النقدية" value={totalSales} color="text-green-700" />
                <SummaryRow label="إجمالي المرتجعات النقدية" value={totalReturns} color="text-red-700" />
                <SummaryRow label="صافي النقد المتوقع في الصندوق" value={netCashExpected} color="text-indigo-700" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                <InputField 
                    id="countedCash"
                    label="المبلغ الفعلي المعدود"
                    value={countedCash}
                    onChange={(e) => setCountedCash(e.target.value)}
                    type="number"
                />
                 <div className="mb-4">
                    <label className="block text-slate-700 text-sm font-bold mb-2">الفارق (عجز/زيادة)</label>
                    <div className={`p-2 rounded-lg text-center font-bold text-lg ${difference === 0 ? 'bg-slate-100' : difference > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {difference.toFixed(2)}
                    </div>
                </div>
            </div>
             <div className="mb-4">
                <label htmlFor="notes" className="block text-slate-700 text-sm font-bold mb-2">ملاحظات (اختياري)</label>
                <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg" rows={2}></textarea>
            </div>
        </div>
       
        <div className="flex items-center justify-end gap-3 pt-6 mt-4 border-t border-slate-200 no-print">
          <button onClick={onClose} className="bg-slate-100 text-slate-700 font-bold py-2 px-4 rounded-lg hover:bg-slate-200 transition-colors">إلغاء</button>
          <button onClick={handleConfirm} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined">save</span>
             تأكيد وحفظ الإغلاق
          </button>
        </div>
    </Modal>
  );
};

export default CloseTillModal;
