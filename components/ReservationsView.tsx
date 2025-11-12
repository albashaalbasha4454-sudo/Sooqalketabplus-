
import React, { useState, useMemo } from 'react';
import type { Invoice } from '../types';
import Pagination from './common/Pagination';

interface ReservationsViewProps {
  reservations: Invoice[];
  onConvertToSale: (reservation: Invoice) => void;
  onCancelReservation: (reservationId: string) => void;
}

const ITEMS_PER_PAGE = 10;

const ReservationsView: React.FC<ReservationsViewProps> = ({ reservations, onConvertToSale, onCancelReservation }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sortedReservations = useMemo(() => {
    return [...reservations].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [reservations]);
  
  const paginatedReservations = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedReservations.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedReservations, currentPage]);

  const totalPages = Math.ceil(sortedReservations.length / ITEMS_PER_PAGE);

  const handleToggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleCancel = (id: string) => {
    if (window.confirm('هل أنت متأكد من إلغاء هذا الحجز؟ ستتم إعادة الكتب إلى المخزون.')) {
        onCancelReservation(id);
    }
  }

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">الحجوزات</h2>
      <div className="bg-white shadow-md rounded-lg p-4">
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-right">
            <thead className="bg-gray-100 text-gray-600 uppercase text-sm">
              <tr>
                <th className="py-3 px-6">تاريخ الحجز</th>
                <th className="py-3 px-6">العميل</th>
                <th className="py-3 px-6">الهاتف</th>
                <th className="py-3 px-6">الإجمالي</th>
                <th className="py-3 px-6 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 text-sm">
              {paginatedReservations.map((res) => (
                <React.Fragment key={res.id}>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-6">{new Date(res.date).toLocaleString('ar-EG')}</td>
                    <td className="py-3 px-6 font-semibold">{res.customerInfo?.name}</td>
                    <td className="py-3 px-6">{res.customerInfo?.phone}</td>
                    <td className="py-3 px-6 font-bold">{res.total.toFixed(2)}</td>
                    <td className="py-3 px-6 text-center whitespace-nowrap">
                      <button onClick={() => handleToggleExpand(res.id)} className="text-gray-600 hover:text-gray-800 font-semibold mr-2">تفاصيل</button>
                      <button onClick={() => onConvertToSale(res)} className="text-green-600 hover:text-green-800 font-semibold mr-2">تحويل لبيع</button>
                      <button onClick={() => handleCancel(res.id)} className="text-red-600 hover:text-red-800 font-semibold">إلغاء</button>
                    </td>
                  </tr>
                  {expandedId === res.id && (
                    <tr className="bg-gray-50">
                        <td colSpan={5} className="p-4">
                            <h4 className="font-bold mb-2">الكتب المحجوزة:</h4>
                            <ul className="list-disc list-inside">
                                {res.items.map(item => (
                                    <li key={item.productId}>{item.productName} (الكمية: {item.quantity}, السعر: {item.price.toFixed(2)})</li>
                                ))}
                            </ul>
                        </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          {sortedReservations.length === 0 && <p className="text-center py-4">لا يوجد حجوزات لعرضها.</p>}
        </div>
         <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={ITEMS_PER_PAGE}
          totalItems={sortedReservations.length}
        />
      </div>
    </div>
  );
};

export default ReservationsView;