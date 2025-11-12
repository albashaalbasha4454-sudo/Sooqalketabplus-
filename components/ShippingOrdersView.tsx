import React, { useState, useMemo } from 'react';
import type { Invoice, PaymentStatus } from '../types';
import Pagination from './common/Pagination';

interface ShippingOrdersViewProps {
  shippingOrders: Invoice[];
  onUpdateStatus: (orderId: string, status: 'shipped' | 'completed' | 'cancelled') => void;
  onUpdatePaymentStatus: (orderId: string, paymentStatus: 'paid' | 'unpaid') => void;
}

const ITEMS_PER_PAGE = 10;

const ShippingOrdersView: React.FC<ShippingOrdersViewProps> = ({ shippingOrders, onUpdateStatus, onUpdatePaymentStatus }) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'unpaid' | 'shipped' | 'completed' | 'cancelled'>('all');
  const [filterPayment, setFilterPayment] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredOrders = useMemo(() => {
    return shippingOrders
        .filter(order => filterStatus === 'all' || order.status === filterStatus)
        .filter(order => filterPayment === 'all' || order.paymentStatus === filterPayment)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [shippingOrders, filterStatus, filterPayment]);
  
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);
  
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  
  const getShippingStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      // FIX: The status for 'قيد التجهيز' should be 'pending', not 'unpaid'.
      case 'pending': return <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">قيد التجهيز</span>;
      case 'shipped': return <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">تم الشحن</span>;
      case 'completed': return <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">مكتمل</span>;
      case 'cancelled': return <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">ملغي</span>;
      default: return null;
    }
  };

  // FIX: The function signature was updated to accept all PaymentStatus types, and a case for 'partial' was added.
  const getPaymentStatusBadge = (status?: PaymentStatus) => {
      if (status === 'paid') return <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">مدفوع</span>;
      if (status === 'unpaid') return <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">غير مدفوع</span>;
      if (status === 'partial') return <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">مدفوع جزئياً</span>;
      return null;
  }

  return (
    <div className="p-6">
       <div className="bg-white shadow-lg rounded-xl">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-800">طلبات الشحن</h2>
          <p className="text-sm text-slate-500 mt-1">عرض وإدارة جميع طلبات الشحن والتوصيل.</p>
        </div>
        <div className="p-6 flex flex-col md:flex-row justify-start items-center gap-4">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="w-full md:w-auto p-2 border border-slate-300 rounded-lg bg-white">
            <option value="all">كل حالات الشحن</option>
            <option value="pending">قيد التجهيز</option>
            <option value="shipped">تم الشحن</option>
            <option value="completed">مكتمل</option>
            <option value="cancelled">ملغي</option>
          </select>
          <select value={filterPayment} onChange={e => setFilterPayment(e.target.value as any)} className="w-full md:w-auto p-2 border border-slate-300 rounded-lg bg-white">
            <option value="all">كل حالات الدفع</option>
            <option value="paid">مدفوع</option>
            <option value="unpaid">غير مدفوع</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-right">
            <thead className="bg-slate-50 text-slate-600 uppercase text-sm">
              <tr>
                <th className="py-3 px-6">تاريخ الطلب</th>
                <th className="py-3 px-6">العميل</th>
                <th className="py-3 px-6">الإجمالي</th>
                <th className="py-3 px-6 text-center">حالة الشحن</th>
                <th className="py-3 px-6 text-center">حالة الدفع</th>
                <th className="py-3 px-6 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 text-sm">
              {paginatedOrders.map((order) => (
                <React.Fragment key={order.id}>
                    <tr className="border-b border-slate-200 hover:bg-slate-50">
                        <td className="py-3 px-6">{new Date(order.date).toLocaleString('ar-EG')}</td>
                        <td className="py-3 px-6 font-semibold">{order.customerInfo?.name}</td>
                        <td className="py-3 px-6 font-bold">{order.total.toFixed(2)}</td>
                        <td className="py-3 px-6 text-center">{getShippingStatusBadge(order.status)}</td>
                        <td className="py-3 px-6 text-center">{getPaymentStatusBadge(order.paymentStatus)}</td>
                        <td className="py-3 px-6 text-center">
                            <div className="flex items-center justify-center gap-1">
                                <button onClick={() => setExpandedId(expandedId === order.id ? null : order.id)} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors" title="تفاصيل">
                                    <span className="material-symbols-outlined text-lg">info</span>
                                </button>
                                {order.paymentStatus === 'unpaid' && (
                                    <button onClick={() => onUpdatePaymentStatus(order.id, 'paid')} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-green-600 transition-colors" title="تمييز كمدفوع">
                                        <span className="material-symbols-outlined text-lg">payments</span>
                                    </button>
                                )}
                                {/* FIX: Corrected status check from 'unpaid' to 'pending'. */}
                                {order.status === 'pending' && <button onClick={() => onUpdateStatus(order.id, 'shipped')} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors" title="شحن الطلب"><span className="material-symbols-outlined text-lg">local_shipping</span></button>}
                                {order.status === 'shipped' && <button onClick={() => onUpdateStatus(order.id, 'completed')} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-green-600 transition-colors" title="إكمال الطلب"><span className="material-symbols-outlined text-lg">task_alt</span></button>}
                                {order.status !== 'completed' && order.status !== 'cancelled' && <button onClick={() => onUpdateStatus(order.id, 'cancelled')} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-red-600 transition-colors" title="إلغاء الطلب"><span className="material-symbols-outlined text-lg">cancel</span></button>}
                            </div>
                        </td>
                    </tr>
                    {expandedId === order.id && (
                        <tr className="bg-slate-50">
                            <td colSpan={6} className="p-4 text-xs">
                                <p><strong>الهاتف:</strong> {order.customerInfo?.phone}</p>
                                <p><strong>العنوان:</strong> {order.customerInfo?.address}</p>
                                <p><strong>مصدر الطلب:</strong> {order.source}</p>
                                <h4 className="font-bold mt-2 mb-1">الكتب:</h4>
                                <ul className="list-disc list-inside">
                                    {order.items.map(item => (
                                        <li key={item.productId}>{item.productName} (الكمية: {item.quantity})</li>
                                    ))}
                                </ul>
                            </td>
                        </tr>
                    )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          {filteredOrders.length === 0 && <p className="text-center py-8 text-slate-500">لا يوجد طلبات شحن لعرضها.</p>}
        </div>
        <div className="p-6 border-t border-slate-200">
            <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={ITEMS_PER_PAGE}
            totalItems={filteredOrders.length}
            />
        </div>
      </div>
    </div>
  );
};

export default ShippingOrdersView;