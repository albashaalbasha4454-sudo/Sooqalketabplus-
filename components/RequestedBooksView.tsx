import React, { useState, useMemo } from 'react';
import type { RequestedBook } from '../types';
import Pagination from './common/Pagination';

interface RequestedBooksViewProps {
  requestedBooks: RequestedBook[];
  updateRequestedBookStatus: (id: string, status: 'fulfilled' | 'pending') => void;
}

const ITEMS_PER_PAGE = 10;

const RequestedBooksView: React.FC<RequestedBooksViewProps> = ({ requestedBooks, updateRequestedBookStatus }) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'fulfilled'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  const filteredBooks = useMemo(() => {
    return requestedBooks
        .filter(book => filter === 'all' || book.status === filter)
        .sort((a, b) => new Date(b.lastRequestedDate).getTime() - new Date(a.lastRequestedDate).getTime());
  }, [requestedBooks, filter]);

  const paginatedBooks = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBooks.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredBooks, currentPage]);
  
  const totalPages = Math.ceil(filteredBooks.length / ITEMS_PER_PAGE);

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">الكتب المطلوبة</h2>
      <div className="bg-white shadow-md rounded-lg p-4">
        <div className="flex justify-start mb-4">
            <select value={filter} onChange={e => setFilter(e.target.value as any)} className="p-2 border border-gray-300 rounded-md">
                <option value="all">الكل</option>
                <option value="pending">قيد الانتظار</option>
                <option value="fulfilled">تم توفيره</option>
            </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto text-right">
            <thead className="bg-gray-100 text-gray-600 uppercase text-sm">
              <tr>
                <th className="py-3 px-6">اسم الكتاب</th>
                <th className="py-3 px-6">العميل</th>
                <th className="py-3 px-6">الهاتف</th>
                <th className="py-3 px-6">عدد الطلبات</th>
                <th className="py-3 px-6">آخر تاريخ طلب</th>
                <th className="py-3 px-6">الحالة</th>
                <th className="py-3 px-6 text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 text-sm">
              {paginatedBooks.map((book) => (
                <tr key={book.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-6 font-semibold">{book.name}</td>
                  <td className="py-3 px-6">{book.customerName || '-'}</td>
                  <td className="py-3 px-6">{book.customerPhone || '-'}</td>
                  <td className="py-3 px-6">{book.requestedCount}</td>
                  <td className="py-3 px-6">{new Date(book.lastRequestedDate).toLocaleDateString('ar-EG')}</td>
                  <td className="py-3 px-6">
                    {book.status === 'pending' 
                        ? <span className="bg-yellow-200 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">قيد الانتظار</span> 
                        : <span className="bg-green-200 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">تم توفيره</span>
                    }
                  </td>
                  <td className="py-3 px-6 text-center">
                    {book.status === 'pending' ? (
                      <button onClick={() => updateRequestedBookStatus(book.id, 'fulfilled')} className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold hover:bg-green-600">
                        تم توفيره
                      </button>
                    ) : (
                        <button onClick={() => updateRequestedBookStatus(book.id, 'pending')} className="bg-gray-500 text-white px-3 py-1 rounded-full text-xs font-semibold hover:bg-gray-600">
                         إعادة للانتظار
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredBooks.length === 0 && <p className="text-center py-4">لا يوجد كتب مطلوبة لعرضها.</p>}
        </div>
         <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={ITEMS_PER_PAGE}
          totalItems={filteredBooks.length}
        />
      </div>
    </div>
  );
};

export default RequestedBooksView;