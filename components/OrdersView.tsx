import React, { useState, useMemo } from 'react';
import type { Invoice, OrderStatus, OrderType, PaymentStatus, User } from '../types';
import PrintInvoice from '../PrintInvoice';
import ReturnModal from './ReturnModal';
import RequestReturnModal from './RequestReturnModal';
import Pagination from './common/Pagination';

interface OrdersViewProps {
  invoices: Invoice[];
  users: User[];
  onUpdateStatus: (orderId: string, status: OrderStatus, paymentStatus?: PaymentStatus) => void;
  onConvertToSale: (reservation: Invoice) => void;
  processReturn: (originalInvoiceId: string, returnItems: any[]) => void;
  sendReturnRequest: (originalInvoice: Invoice, returnItems: any[]) => void;
  currentUser: User;
  shopName: string;
  shopAddress: string;
}

const ITEMS_PER_PAGE = 15;

const OrdersView: React.FC<OrdersViewProps> = ({ invoices, users, onUpdateStatus, onConvertToSale, processReturn, sendReturnRequest, currentUser, shopName, shopAddress }) => {
  const [filters, setFilters] = useState({ type: 'all', status: 'all', payment: 'all', search: '', user: 'all' });
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [invoiceToPrint, setInvoiceToPrint] = useState<Invoice | null>(null);
  const [invoiceToReturn, setInvoiceToReturn] = useState<Invoice | null>(null);
  const [invoiceToRequestReturn, setInvoiceToRequestReturn] = useState<Invoice | null>(null);


  const filteredInvoices = useMemo(() => {
    return invoices
      .filter(inv => {
        const { type, status, payment, search, user } = filters;
        if (type !== 'all' && inv.type !== type) return false;
        if (status !== 'all' && inv.status !== status) return false;
        if (payment !== 'all' && inv.paymentStatus !== payment) return false;
        if (user !== 'all' && inv.processedBy !== user) return false;
        if (search && !(inv.id.includes(search) || inv.customerInfo?.name.toLowerCase().includes(search.toLowerCase()) || inv.customerInfo?.phone.includes(search))) return false;
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [invoices, filters]);

  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredInvoices.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredInvoices, currentPage]);

  const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE);

  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
    setCurrentPage(1);
  };

  const handleProcessReturn = (originalInvoiceId: string, returnItems: any[]) => {
    processReturn(originalInvoiceId, returnItems);
    setInvoiceToReturn(null);
  };
  
  const handleSendReturnRequest = (originalInvoice: Invoice, returnItems: any[]) => {
    sendReturnRequest(originalInvoice, returnItems);
    setInvoiceToRequestReturn(null);
  };

  const typeMap: Record<OrderType, { label: string, className: string }> = {
    sale: { label: 'بيع سريع', className: 'bg-green-100 text-green-800' },
    shipping: { label: 'شحن', className: 'bg-sky-100 text-sky-800' },
    reservation: { label: 'حجز', className: 'bg-indigo-100 text-indigo-800' },
    return: { label: 'مرتجع', className: 'bg-red-100 text-red-800' },
  };
  
  const statusMap: Record<OrderStatus, { label: string, className: string }> = {
    pending: { label: 'قيد الانتظار', className: 'bg-yellow-100 text-yellow-800' },
    shipped: { label: 'تم الشحن', className: 'bg-blue-100 text-blue-800' },
    completed: { label: 'مكتمل', className: 'bg-green-100 text-green-800' },
    cancelled: { label: 'ملغي', className: 'bg-gray-100 text-gray-800' },
  };

  const paymentMap: Record<PaymentStatus, { label: string, className: string }> = {
    paid: { label: 'مدفوع', className: 'bg-green-100 text-green-800' },
    unpaid: { label: 'غير مدفوع', className: 'bg-red-100 text-red-800' },
    partial: { label: 'جزئي', className: 'bg-orange-100 text-orange-800' },
  };
  
  const Badge: React.FC<{ data: { label: string, className: string } }> = ({ data }) => (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${data.className}`}>{data.label}</span>
  );

  return (
    <div className="p-6">
      <div className="bg-white shadow-lg rounded-xl">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-800">إدارة الطلبات</h2>
          <p className="text-sm text-slate-500 mt-1">عرض وتصفح جميع أنواع الطلبات من مكان واحد.</p>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <input type="text" placeholder="ابحث بالرقم، اسم العميل، أو الهاتف..." value={filters.search} onChange={e => handleFilterChange('search', e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg lg:col-span-2" />
          <select value={filters.type} onChange={e => handleFilterChange('type', e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg bg-white">
            <option value="all">كل الأنواع</option>
            <option value="sale">بيع سريع</option>
            <option value="shipping">شحن</option>
            <option value="reservation">حجز</option>
            <option value="return">مرتجع</option>
          </select>
          <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg bg-white">
             <option value="all">كل الحالات</option>
             <option value="pending">قيد الانتظار</option>
             <option value="shipped">تم الشحن</option>
             <option value="completed">مكتمل</option>
             <option value="cancelled">ملغي</option>
          </select>
           <select value={filters.payment} onChange={e => handleFilterChange('payment', e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg bg-white">
             <option value="all">كل حالات الدفع</option>
             <option value="paid">مدفوع</option>
             <option value="unpaid">غير مدفوع</option>
             <option value="partial">جزئي</option>
          </select>
          {currentUser.role === 'admin' && (
             <select value={filters.user} onChange={e => handleFilterChange('user', e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg bg-white">
                <option value="all">كل الموظفين</option>
                {users.map(user => <option key={user.id} value={user.username}>{user.username}</option>)}
             </select>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto text-right">
            <thead className="bg-slate-50 text-slate-600 uppercase text-sm">
              <tr>
                <th className="py-3 px-6">الطلب</th>
                <th className="py-3 px-6">التاريخ</th>
                <th className="py-3 px-6">العميل</th>
                <th className="py-3 px-6">الإجمالي</th>
                <th className="py-3 px-6">الموظف</th>
                <th className="py-3 px-6 text-center">النوع</th>
                <th className="py-3 px-6 text-center">الحالة</th>
                <th className="py-3 px-6 text-center">الدفع</th>
                <th className="py-3 px-6 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 text-sm">
              {paginatedInvoices.map((inv) => (
                <React.Fragment key={inv.id}>
                    <tr className="border-b border-slate-200 hover:bg-slate-50">
                        <td className="py-3 px-6 font-mono text-xs">{inv.id.substring(0, 12)}</td>
                        <td className="py-3 px-6">{new Date(inv.date).toLocaleString('ar-EG')}</td>
                        <td className="py-3 px-6">{inv.customerInfo?.name || '-'}</td>
                        <td className="py-3 px-6 font-bold">{inv.total.toFixed(2)}</td>
                        <td className="py-3 px-6">{inv.processedBy || '-'}</td>
                        <td className="py-3 px-6 text-center"><Badge data={typeMap[inv.type]} /></td>
                        <td className="py-3 px-6 text-center"><Badge data={statusMap[inv.status]} /></td>
                        <td className="py-3 px-6 text-center"><Badge data={paymentMap[inv.paymentStatus]} /></td>
                        <td className="py-3 px-6 text-center">
                            <div className="flex items-center justify-center gap-1">
                                <button onClick={() => setExpandedId(expandedId === inv.id ? null : inv.id)} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors" title="تفاصيل"><span className="material-symbols-outlined text-lg">info</span></button>
                                <button onClick={() => setInvoiceToPrint(inv)} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-green-600 transition-colors" title="طباعة"><span className="material-symbols-outlined text-lg">print</span></button>
                                
                                {(inv.type === 'sale' || (inv.type === 'shipping' && inv.status === 'completed')) && (
                                    currentUser.role === 'admin' ? (
                                        <button onClick={() => setInvoiceToReturn(inv)} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-red-600 transition-colors" title="إرجاع">
                                            <span className="material-symbols-outlined text-lg">assignment_return</span>
                                        </button>
                                    ) : (
                                        <button onClick={() => setInvoiceToRequestReturn(inv)} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-orange-600 transition-colors" title="طلب إرجاع">
                                            <span className="material-symbols-outlined text-lg">forward_to_inbox</span>
                                        </button>
                                    )
                                )}

                                {inv.type === 'shipping' && inv.status === 'pending' && <button onClick={() => onUpdateStatus(inv.id, 'shipped')} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors" title="تم الشحن"><span className="material-symbols-outlined text-lg">local_shipping</span></button>}
                                {inv.type === 'shipping' && inv.status === 'shipped' && <button onClick={() => onUpdateStatus(inv.id, 'completed', 'paid')} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-green-600 transition-colors" title="اكتمل & تم الدفع"><span className="material-symbols-outlined text-lg">task_alt</span></button>}
                                {inv.type === 'reservation' && inv.status === 'pending' && <button onClick={() => onConvertToSale(inv)} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-green-600 transition-colors" title="تحويل لبيع"><span className="material-symbols-outlined text-lg">storefront</span></button>}
                                {inv.status === 'pending' && <button onClick={() => onUpdateStatus(inv.id, 'cancelled')} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-red-600 transition-colors" title="إلغاء"><span className="material-symbols-outlined text-lg">cancel</span></button>}
                            </div>
                        </td>
                    </tr>
                    {expandedId === inv.id && (
                        <tr className="bg-slate-50">
                            <td colSpan={9} className="p-4 text-xs">
                                <p><strong>الهاتف:</strong> {inv.customerInfo?.phone}</p>
                                <p><strong>العنوان:</strong> {inv.customerInfo?.address}</p>
                                <p><strong>مصدر الطلب:</strong> {inv.source}</p>
                                <p><strong>أجور الشحن:</strong> {inv.shippingFee?.toFixed(2) || '0.00'}</p>
                                <h4 className="font-bold mt-2 mb-1">الأصناف:</h4>
                                <ul className="list-disc list-inside">
                                    {inv.items.map(item => <li key={item.productId}>{item.productName} (الكمية: {item.quantity})</li>)}
                                </ul>
                            </td>
                        </tr>
                    )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          {filteredInvoices.length === 0 && <p className="text-center py-8 text-slate-500">لا يوجد طلبات تطابق الفلترة.</p>}
        </div>
        <div className="p-6 border-t border-slate-200">
             <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={ITEMS_PER_PAGE} totalItems={filteredInvoices.length} />
        </div>
      </div>

      {invoiceToPrint && <PrintInvoice invoice={invoiceToPrint} onClose={() => setInvoiceToPrint(null)} shopName={shopName} shopAddress={shopAddress} />}
      {invoiceToReturn && <ReturnModal invoice={invoiceToReturn} onClose={() => setInvoiceToReturn(null)} onProcessReturn={handleProcessReturn} />}
      {invoiceToRequestReturn && <RequestReturnModal invoice={invoiceToRequestReturn} onClose={() => setInvoiceToRequestReturn(null)} onSendRequest={handleSendReturnRequest} />}
    </div>
  );
};

export default OrdersView;