import React, { useMemo } from 'react';
import type { Invoice, User } from '../types';
import Modal from './Modal';

interface TillReportModalProps {
  invoices: Invoice[];
  currentUser: User;
  onClose: () => void;
}

const TillReportModal: React.FC<TillReportModalProps> = ({ invoices, currentUser, onClose }) => {

  const { todaysUserInvoices, totalSales, totalProfit } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysUserInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.paidDate || inv.date);
        return inv.processedBy === currentUser.username &&
               invDate >= today &&
               invDate < tomorrow &&
               (inv.type === 'sale' || (inv.type === 'shipping' && inv.status === 'completed')) &&
               inv.paymentStatus === 'paid';
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalSales = todaysUserInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalProfit = todaysUserInvoices.reduce((sum, inv) => sum + (inv.totalProfit || 0), 0);

    return { todaysUserInvoices, totalSales, totalProfit };
  }, [invoices, currentUser]);


  const handlePrint = () => {
    const printContents = document.getElementById('till-report-print-area')?.innerHTML;
    const originalContents = document.body.innerHTML;
    if (printContents) {
        document.body.innerHTML = `<div dir="rtl" style="font-family: Cairo, sans-serif; padding: 20px;">${printContents}</div>`;
        window.print();
        document.body.innerHTML = originalContents;
        window.location.reload(); // Reload to re-attach React listeners
    }
  };


  return (
    <Modal isOpen={true} onClose={onClose} title={`تقرير الصندوق ليوم ${new Date().toLocaleDateString('ar-EG')}`} size="lg">
        <div id="till-report-print-area">
            <h3 style={{textAlign: 'center', fontSize: '1.5rem', marginBottom: '1rem'}}>تقرير إغلاق الصندوق اليومي</h3>
            <p style={{textAlign: 'center', marginBottom: '1.5rem'}}>
                <strong>الكاشير:</strong> {currentUser.username} | <strong>التاريخ:</strong> {new Date().toLocaleString('ar-EG')}
            </p>
            
            <div className="space-y-4 text-lg mb-6">
                <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                    <span className="font-semibold">إجمالي المبيعات النقدية:</span>
                    <span className="font-bold text-green-700">{totalSales.toFixed(2)}</span>
                </div>
                 <div className="flex justify-between p-3 bg-sky-50 rounded-lg">
                    <span className="font-semibold">إجمالي الربح:</span>
                    <span className="font-bold text-sky-700">{totalProfit.toFixed(2)}</span>
                </div>
                 <div className="flex justify-between p-3 bg-indigo-50 rounded-lg">
                    <span className="font-semibold">عدد الفواتير:</span>
                    <span className="font-bold text-indigo-700">{todaysUserInvoices.length}</span>
                </div>
            </div>

            <h4 className="font-bold text-slate-800 text-lg mb-2 border-t pt-4">تفاصيل الفواتير:</h4>
            <div className="max-h-64 overflow-y-auto border rounded-lg">
                <table className="w-full text-right text-sm">
                    <thead className="bg-slate-100 sticky top-0">
                        <tr>
                            <th className="p-2">الوقت</th>
                            <th className="p-2">رقم الفاتورة</th>
                            <th className="p-2">العميل</th>
                            <th className="p-2">الإجمالي</th>
                        </tr>
                    </thead>
                    <tbody>
                    {todaysUserInvoices.length > 0 ? todaysUserInvoices.map(inv => (
                        <tr key={inv.id} className="border-b">
                           <td className="p-2">{new Date(inv.date).toLocaleTimeString('ar-EG')}</td>
                           <td className="p-2 font-mono">{inv.id.substring(0,8)}</td>
                           <td className="p-2">{inv.customerInfo?.name || 'بيع مباشر'}</td>
                           <td className="p-2 font-semibold">{inv.total.toFixed(2)}</td>
                        </tr>
                    )) : (
                        <tr><td colSpan={4} className="text-center p-4 text-slate-500">لا يوجد فواتير مبيعات لهذا اليوم.</td></tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
       
        <div className="flex items-center justify-end gap-3 pt-6 mt-4 border-t border-slate-200 no-print">
          <button onClick={onClose} className="bg-slate-100 text-slate-700 font-bold py-2 px-4 rounded-lg hover:bg-slate-200 transition-colors">إغلاق</button>
          <button onClick={handlePrint} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined">print</span>
             طباعة
          </button>
        </div>
         <style>{`
            @media print {
                .no-print {
                    display: none !important;
                }
                 body * {
                  visibility: hidden;
                }
                #till-report-print-area, #till-report-print-area * {
                  visibility: visible;
                }
                #till-report-print-area {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                }
            }
        `}</style>
    </Modal>
  );
};

export default TillReportModal;