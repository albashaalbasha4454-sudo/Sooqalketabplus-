import React, { useState, useMemo } from 'react';
import type { Invoice, User } from '../types';
import PrintInvoice from '../PrintInvoice';
import ReturnModal from './ReturnModal';
import RequestReturnModal from './RequestReturnModal';
import Pagination from './common/Pagination';

interface InvoicesViewProps {
  invoices: Invoice[];
  processReturn: (originalInvoiceId: string, returnItems: any[]) => void;
  sendReturnRequest: (originalInvoice: Invoice, returnItems: any[]) => void;
  currentUser: User;
  shopName: string;
  shopAddress: string;
}

const ITEMS_PER_PAGE = 10;

const InvoicesView: React.FC<InvoicesViewProps> = ({ invoices, processReturn, sendReturnRequest, currentUser, shopName, shopAddress }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const [invoiceToPrint, setInvoiceToPrint] = useState<Invoice | null>(null);
  const [invoiceToReturn, setInvoiceToReturn] = useState<Invoice | null>(null);
  const [invoiceToRequestReturn, setInvoiceToRequestReturn] = useState<Invoice | null>(null);

  const sortedInvoices = useMemo(() => {
    return [...invoices].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return sortedInvoices.filter(inv => {
      // FIX: Property 'customerName' does not exist on type 'Invoice'. Use 'customerInfo.name' instead.
      const matchesSearch = inv.id.includes(searchTerm) || inv.customerInfo?.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || inv.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [sortedInvoices, searchTerm, filterType]);
  
  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredInvoices.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredInvoices, currentPage]);

  const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE);

  const handleProcessReturn = (originalInvoiceId: string, returnItems: any[]) => {
    processReturn(originalInvoiceId, returnItems);
    setInvoiceToReturn(null);
  };
  
  const handleSendReturnRequest = (originalInvoice: Invoice, returnItems: any[]) => {
    sendReturnRequest(originalInvoice, returnItems);
    setInvoiceToRequestReturn(null);
  };

  const getInvoiceTypeStyle = (type: Invoice['type']) => {
    // FIX: 'purchase' is not a valid OrderType and was removed.
    const styles: Record<Invoice['type'], {label: string, className: string}> = {
        sale: { label: 'بيع', className: 'bg-green-100 text-green-800'},
        return: { label: 'إرجاع', className: 'bg-red-100 text-red-800'},
        shipping: { label: 'شحن', className: 'bg-sky-100 text-sky-800'},
        reservation: { label: 'حجز', className: 'bg-indigo-100 text-indigo-800'}
    };
    return styles[type] || {label: type, className: 'bg-slate-100 text-slate-800'};
  }

  return (
    <div className="p-6">
      <div className="bg-white shadow-lg rounded-xl">
        <div className="p-6 border-b border-slate-200">
            <h2 className="text-2xl font-bold text-slate-800">سجل الفواتير</h2>
            <p className="text-sm text-slate-500 mt-1">عرض وتصفح جميع الفواتير الصادرة والواردة.</p>
        </div>
        <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <input
            type="text"
            placeholder="ابحث برقم الفاتورة أو اسم العميل..."
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full md:w-1/2 p-2 border border-slate-300 rounded-lg"
          />
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="w-full md:w-1/4 p-2 border border-slate-300 rounded-lg bg-white">
            <option value="all">كل الأنواع</option>
            <option value="sale">بيع</option>
            <option value="return">إرجاع</option>
            <option value="shipping">شحن</option>
            <option value="reservation">حجز</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto text-right">
            <thead className="bg-slate-50 text-slate-600 uppercase text-sm">
              <tr>
                <th className="py-3 px-6">رقم الفاتورة</th>
                <th className="py-3 px-6">التاريخ</th>
                <th className="py-3 px-6">العميل</th>
                <th className="py-3 px-6 text-center">النوع</th>
                <th className="py-3 px-6">الإجمالي</th>
                <th className="py-3 px-6 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 text-sm">
              {paginatedInvoices.map((invoice) => {
                  const typeStyle = getInvoiceTypeStyle(invoice.type);
                  return (
                    <tr key={invoice.id} className="border-b border-slate-200 hover:bg-slate-50">
                        <td className="py-3 px-6 font-mono text-xs">{invoice.id.substring(0, 8)}</td>
                        <td className="py-3 px-6">{new Date(invoice.date).toLocaleString('ar-EG')}</td>
                        {/* FIX: Property 'customerName' does not exist on type 'Invoice'. Use 'customerInfo.name' instead. */}
                        <td className="py-3 px-6">{invoice.customerInfo?.name || '-'}</td>
                        <td className="py-3 px-6 text-center">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${typeStyle.className}`}>
                                {typeStyle.label}
                            </span>
                        </td>
                        <td className="py-3 px-6 font-bold">{invoice.total.toFixed(2)}</td>
                        <td className="py-3 px-6 text-center">
                            <div className="flex items-center justify-center gap-1">
                                <button onClick={() => setInvoiceToPrint(invoice)} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-green-600 transition-colors" title="طباعة">
                                    <span className="material-symbols-outlined text-lg">print</span>
                                </button>
                                {invoice.type === 'sale' && (
                                    currentUser.role === 'admin' ? (
                                    <button onClick={() => setInvoiceToReturn(invoice)} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-red-600 transition-colors" title="إرجاع">
                                        <span className="material-symbols-outlined text-lg">assignment_return</span>
                                    </button>
                                    ) : (
                                    <button onClick={() => setInvoiceToRequestReturn(invoice)} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-orange-600 transition-colors" title="طلب إرجاع">
                                        <span className="material-symbols-outlined text-lg">forward_to_inbox</span>
                                    </button>
                                    )
                                )}
                            </div>
                        </td>
                    </tr>
                  )
              })}
            </tbody>
          </table>
          {filteredInvoices.length === 0 && <p className="text-center py-8 text-slate-500">لا يوجد فواتير لعرضها.</p>}
        </div>
        <div className="p-6 border-t border-slate-200">
             <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={ITEMS_PER_PAGE}
              totalItems={filteredInvoices.length}
            />
        </div>
      </div>

      {invoiceToPrint && <PrintInvoice invoice={invoiceToPrint} onClose={() => setInvoiceToPrint(null)} shopName={shopName} shopAddress={shopAddress} />}
      {invoiceToReturn && <ReturnModal invoice={invoiceToReturn} onClose={() => setInvoiceToReturn(null)} onProcessReturn={handleProcessReturn} />}
      {invoiceToRequestReturn && <RequestReturnModal invoice={invoiceToRequestReturn} onClose={() => setInvoiceToRequestReturn(null)} onSendRequest={handleSendReturnRequest} />}
    </div>
  );
};

export default InvoicesView;