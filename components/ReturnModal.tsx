
import React, { useState } from 'react';
import type { Invoice, InvoiceItem } from '../types';

interface ReturnModalProps {
  invoice: Invoice;
  onClose: () => void;
  onProcessReturn: (originalInvoiceId: string, returnItems: InvoiceItem[]) => void;
}

const ReturnModal: React.FC<ReturnModalProps> = ({ invoice, onClose, onProcessReturn }) => {
  const [returnQuantities, setReturnQuantities] = useState<{ [productId: string]: number }>({});

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    const originalItem = invoice.items.find(item => item.productId === productId);
    if (!originalItem) return;

    if (newQuantity >= 0 && newQuantity <= originalItem.quantity) {
      setReturnQuantities(prev => ({
        ...prev,
        [productId]: newQuantity,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const returnItems: InvoiceItem[] = invoice.items
      .map(item => ({
        ...item,
        quantity: returnQuantities[item.productId] || 0,
      }))
      .filter(item => item.quantity > 0);

    if (returnItems.length === 0) {
      alert('الرجاء تحديد كمية لمنتج واحد على الأقل.');
      return;
    }

    onProcessReturn(invoice.id, returnItems);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-bold text-gray-800">
            إرجاع من الفاتورة <span className="font-mono text-sm">{invoice.id.substring(0, 8)}</span>
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            <p className="text-sm text-gray-600 mb-4">حدد الكميات التي تريد إرجاعها من كل صنف.</p>
            <table className="w-full text-right">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="p-2">الصنف</th>
                        <th className="p-2">الكمية المباعة</th>
                        <th className="p-2">الكمية المرتجعة</th>
                    </tr>
                </thead>
                <tbody>
                    {invoice.items.map(item => (
                        <tr key={item.productId} className="border-b">
                            <td className="p-2 font-semibold">{item.productName}</td>
                            <td className="p-2">{item.quantity}</td>
                            <td className="p-2">
                                <input 
                                    type="number"
                                    min="0"
                                    max={item.quantity}
                                    value={returnQuantities[item.productId] || 0}
                                    onChange={(e) => handleQuantityChange(item.productId, parseInt(e.target.value, 10) || 0)}
                                    className="w-20 p-1 border border-gray-300 rounded-md text-center"
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
          <div className="flex items-center justify-end gap-2 p-4 border-t bg-gray-50">
            <button type="button" onClick={onClose} className="bg-gray-500 text-white font-bold py-2 px-4 rounded hover:bg-gray-600">
              إلغاء
            </button>
            <button type="submit" className="bg-red-600 text-white font-bold py-2 px-4 rounded hover:bg-red-700">
              تأكيد الإرجاع
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReturnModal;
