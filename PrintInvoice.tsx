

import React, { useEffect } from 'react';
import type { Invoice } from './types';

interface PrintInvoiceProps {
  invoice: Invoice;
  onClose: () => void;
  shopName: string;
  shopAddress: string;
}

const PrintInvoice: React.FC<PrintInvoiceProps> = ({ invoice, onClose, shopName, shopAddress }) => {
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, [onClose]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 p-4 sm:p-8 overflow-y-auto">
      <div className="max-w-3xl mx-auto bg-white shadow-lg p-6 sm:p-10 relative">
        <div id="print-area">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">فاتورة ضريبية مبسطة</h1>
            <p className="text-gray-600">{shopName}</p>
            <p className="text-gray-500 text-sm">{shopAddress}</p>
          </div>
          <div className="flex justify-between mb-6 border-b pb-4">
            <div>
              <p><span className="font-bold">رقم الفاتورة:</span> {invoice.id.substring(0,8)}</p>
            </div>
            <div>
              <p><span className="font-bold">التاريخ:</span> {new Date(invoice.date).toLocaleDateString('ar-EG')}</p>
              <p><span className="font-bold">الوقت:</span> {new Date(invoice.date).toLocaleTimeString('ar-EG')}</p>
            </div>
          </div>
          <table className="w-full text-right mb-8">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2">الصنف</th>
                <th className="p-2">الكمية</th>
                <th className="p-2">سعر الوحدة</th>
                <th className="p-2">الخصم</th>
                <th className="p-2">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.productId} className="border-b">
                  <td className="p-2">{item.productName}</td>
                  <td className="p-2">{item.quantity}</td>
                  <td className="p-2">{item.price.toFixed(2)}</td>
                  <td className="p-2">{(item.discount || 0).toFixed(2)}</td>
                  <td className="p-2">{((item.price - (item.discount || 0)) * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end">
            <div className="w-full max-w-xs">
              <div className="flex justify-between text-lg font-bold p-2 bg-gray-100">
                <span>المجموع الإجمالي:</span>
                <span>{invoice.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute top-4 end-4 print:hidden flex gap-2">
           <button
            onClick={handlePrint}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            طباعة
          </button>
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintInvoice;