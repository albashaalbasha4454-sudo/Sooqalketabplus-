import React from 'react';
import type { ReturnRequest } from '../types';

interface ReturnRequestsViewProps {
  requests: ReturnRequest[];
  approveRequest: (requestId: string) => void;
  rejectRequest: (requestId: string) => void;
}

const ReturnRequestsView: React.FC<ReturnRequestsViewProps> = ({ requests, approveRequest, rejectRequest }) => {

  const getStatusBadge = (status: ReturnRequest['status']) => {
    switch (status) {
      case 'pending':
        return <span className="bg-yellow-200 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">معلق</span>;
      case 'approved':
        return <span className="bg-green-200 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">مقبول</span>;
      case 'rejected':
        return <span className="bg-red-200 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">مرفوض</span>;
    }
  };

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">طلبات الإرجاع</h2>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-right">
            <thead className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
              <tr>
                <th className="py-3 px-6">تاريخ الطلب</th>
                <th className="py-3 px-6">رقم الفاتورة الأصلية</th>
                <th className="py-3 px-6">مقدم الطلب</th>
                <th className="py-3 px-6">الحالة</th>
                <th className="py-3 px-6 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 text-sm font-light">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-6">
                    لا يوجد طلبات إرجاع لعرضها.
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr key={request.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-6">{new Date(request.requestDate).toLocaleString('ar-EG')}</td>
                    <td className="py-3 px-6 font-mono text-xs">{request.originalInvoiceId.substring(0, 8)}</td>
                    <td className="py-3 px-6">{request.requestedBy}</td>
                    <td className="py-3 px-6">{getStatusBadge(request.status)}</td>
                    <td className="py-3 px-6 text-center">
                      {request.status === 'pending' ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => approveRequest(request.id)}
                            className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold hover:bg-green-600"
                          >
                            قبول
                          </button>
                          <button
                            onClick={() => rejectRequest(request.id)}
                            className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold hover:bg-red-600"
                          >
                            رفض
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-xs">
                          {`تمت المعالجة بواسطة ${request.processedBy} في ${new Date(request.processedDate!).toLocaleDateString('ar-EG')}`}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReturnRequestsView;
