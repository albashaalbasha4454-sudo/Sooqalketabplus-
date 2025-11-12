import React, { useState, useMemo } from 'react';
import type { Purchase, Product, Supplier, FinancialAccount } from '../types';
import PurchaseModal from './PurchaseModal';
import AddPaymentModal from './AddPaymentModal';
import Pagination from './common/Pagination';

interface PurchasesViewProps {
  purchases: Purchase[];
  products: Product[];
  suppliers: Supplier[];
  accounts: FinancialAccount[];
  accountBalances: Map<string, number>;
  onAddPurchase: (purchase: Omit<Purchase, 'id'>) => void;
  onUpdatePurchase: (id: string, purchase: Purchase) => void;
  onDeletePurchase: (id: string) => void;
  onAddSupplier: (supplier: Omit<Supplier, 'id'>) => Supplier;
  onStockIn: (purchaseId: string) => void;
  onAddPayment: (purchaseId: string, amount: number, accountId: string) => void;
  createProduct: (product: Omit<Product, 'id'>) => Product;
  updateProduct: (id: string, product: Omit<Product, 'id'>) => void;
}

const ITEMS_PER_PAGE = 10;

const PurchasesView: React.FC<PurchasesViewProps> = ({
  purchases, products, suppliers, accounts, onAddPurchase, onUpdatePurchase, onDeletePurchase, onAddSupplier, onStockIn, onAddPayment, createProduct, updateProduct
}) => {
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [paymentModalPurchase, setPaymentModalPurchase] = useState<Purchase | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const sortedPurchases = useMemo(() => {
    return [...purchases].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [purchases]);

  const paginatedPurchases = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedPurchases.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedPurchases, currentPage]);

  const totalPages = Math.ceil(sortedPurchases.length / ITEMS_PER_PAGE);
  
  const getStatusBadge = (status: Purchase['paymentStatus']) => {
    switch (status) {
      case 'paid': return <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">مدفوع</span>;
      case 'partial': return <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">مدفوع جزئياً</span>;
      case 'unpaid': return <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">غير مدفوع</span>;
    }
  };

  return (
    <div className="p-6">
       <div className="bg-white shadow-lg rounded-xl">
         <div className="p-6 border-b border-slate-200 flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">المشتريات</h2>
                <p className="text-sm text-slate-500 mt-1">إدارة فواتير الشراء من الموردين والناشرين.</p>
            </div>
            <button onClick={() => setIsPurchaseModalOpen(true)} className="flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">
                <span className="material-symbols-outlined">add</span>
                إضافة فاتورة شراء
            </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-right">
            <thead className="bg-slate-50 text-slate-600 uppercase text-sm">
              <tr>
                <th className="py-3 px-6">التاريخ</th>
                <th className="py-3 px-6">المورد</th>
                <th className="py-3 px-6">التكلفة الإجمالية</th>
                <th className="py-3 px-6 text-center">حالة الدفع</th>
                <th className="py-3 px-6 text-center">حالة المخزون</th>
                <th className="py-3 px-6 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 text-sm">
              {paginatedPurchases.map((p) => (
                <tr key={p.id} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="py-3 px-6">{new Date(p.date).toLocaleDateString('ar-EG')}</td>
                  <td className="py-3 px-6 font-semibold">{p.supplierName}</td>
                  <td className="py-3 px-6 font-bold">{p.totalCost.toFixed(2)}</td>
                  <td className="py-3 px-6 text-center">{getStatusBadge(p.paymentStatus)}</td>
                  <td className="py-3 px-6 text-center">
                    {p.isStockedIn 
                      ? <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">أُدخلت المخزون</span> 
                      : <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">لم تدخل المخزون</span>}
                  </td>
                  <td className="py-3 px-6 text-center">
                    <div className="flex items-center justify-center gap-1">
                        {!p.isStockedIn && (
                        <button onClick={() => onStockIn(p.id)} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-green-600 transition-colors" title="إدخال للمخزون">
                            <span className="material-symbols-outlined text-lg">inventory</span>
                        </button>
                        )}
                        {p.paymentStatus !== 'paid' && (
                        <button onClick={() => setPaymentModalPurchase(p)} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors" title="إضافة دفعة">
                            <span className="material-symbols-outlined text-lg">add_card</span>
                        </button>
                        )}
                        <button onClick={() => onDeletePurchase(p.id)} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-red-600 transition-colors" title="حذف">
                            <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sortedPurchases.length === 0 && <p className="text-center py-8 text-slate-500">لا يوجد فواتير شراء لعرضها.</p>}
        </div>
        <div className="p-6 border-t border-slate-200">
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={ITEMS_PER_PAGE}
                totalItems={sortedPurchases.length}
            />
        </div>
      </div>

      {isPurchaseModalOpen && (
        <PurchaseModal
          products={products}
          suppliers={suppliers}
          onSave={(purchase) => {
            onAddPurchase(purchase);
            setIsPurchaseModalOpen(false);
          }}
          onCancel={() => setIsPurchaseModalOpen(false)}
          addSupplier={onAddSupplier}
          createProduct={createProduct}
          updateProduct={updateProduct}
        />
      )}

      {paymentModalPurchase && (
        <AddPaymentModal
          purchase={paymentModalPurchase}
          accounts={accounts}
          onClose={() => setPaymentModalPurchase(null)}
          onAddPayment={onAddPayment}
        />
      )}
    </div>
  );
};

export default PurchasesView;
