import React, { useState, useMemo } from 'react';
import type { TillCloseout } from '../types';
import Pagination from './common/Pagination';

interface TillCloseoutsViewProps {
  tillCloseouts: TillCloseout[];
}

const ITEMS_PER_PAGE = 10;

const TillCloseoutsView: React.FC<TillCloseoutsViewProps> = ({ tillCloseouts }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const sortedCloseouts = useMemo(() => {
    return [...tillCloseouts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [tillCloseouts]);

  const paginatedCloseouts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedCloseouts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedCloseouts, currentPage]);
  
  const totalPages = Math.ceil(sortedCloseouts.length / ITEMS_PER_PAGE);

  return (
    <div className="p-6">
      <div className="bg-white shadow-lg rounded-xl">
        <div className="p-6 border-b border-slate-200">
            <h2 className="text-2xl font-bold text-slate-800">تقارير إغلاق الصناديق</h2>
            <p className="text-sm text-slate-500 mt-1">عرض ومراجعة جميع عمليات إغلاق الصناديق اليومية.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto text-right">
            <thead className="bg-slate-50 text-slate-600 uppercase text-sm">
              <tr>
                <th className="py-3 px-6">تاريخ الإغلاق</th>
                <th className="py-3 px-6">الكاشير</th>
                <th className="py-3 px-6">المبلغ المتوقع</th>
                <th className="py-3 px-6">المبلغ المعدود</th>
                <th className="py-3 px-6">الفارق</th>
                <th className="py-3 px-6 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 text-sm">
              {paginatedCloseouts.map((c) => {
                  const diffColor = c.difference === 0 ? 'text-slate-700' : c.difference > 0 ? 'text-green-600' : 'text-red-600';
                  return (
                    <React.Fragment key={c.id}>
                        <tr className="border-b border-slate-200 hover:bg-slate-50">
                            <td className="py-3 px-6">{new Date(c.date).toLocaleString('ar-EG')}</td>
                            <td className="py-3 px-6 font-semibold">{c.closedByUsername}</td>
                            <td className="py-3 px-6">{c.netCashExpected.toFixed(2)}</td>
                            <td className="py-3 px-6">{c.countedCash.toFixed(2)}</td>
                            <td className={`py-3 px-6 font-bold ${diffColor}`}>{c.difference.toFixed(2)}</td>
                            <td className="py-3 px-6 text-center">
                                <button onClick={() => setExpandedId(expandedId === c.id ? null : c.id)} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors" title="تفاصيل">
                                    <span className="material-symbols-outlined text-lg">info</span>
                                </button>
                            </td>
                        </tr>
                        {expandedId === c.id && (
                            <tr className="bg-slate-50">
                                <td colSpan={6} className="p-4 text-xs">
                                    <p><strong>صافي المبيعات:</strong> {c.totalSales.toFixed(2)}</p>
                                    <p><strong>صافي المرتجعات:</strong> {c.totalReturns.toFixed(2)}</p>
                                    <p><strong>عدد الفواتير:</strong> {c.invoiceIds.length}</p>
                                    <p><strong>الملاحظات:</strong> {c.notes || 'لا يوجد'}</p>
                                </td>
                            </tr>
                        )}
                    </React.Fragment>
                  );
              })}
            </tbody>
          </table>
          {sortedCloseouts.length === 0 && <p className="text-center py-8 text-slate-500">لا يوجد تقارير إغلاق لعرضها.</p>}
        </div>

        <div className="p-6 border-t border-slate-200">
            <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={ITEMS_PER_PAGE}
            totalItems={sortedCloseouts.length}
            />
        </div>
      </div>
    </div>
  );
};

export default TillCloseoutsView;
