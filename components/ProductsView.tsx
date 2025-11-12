import React, { useState, useMemo } from 'react';
import type { Product } from '../types';
import Modal from './Modal';
import InputField from './common/InputField';
import Pagination from './common/Pagination';

interface ProductsViewProps {
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Omit<Product, 'id'>) => void;
  deleteProduct: (id: string) => void;
  lowStockThreshold: number;
}

const ITEMS_PER_PAGE = 10;

// Reusable Stat Card component, styled consistently with ReportsView
const StatCard = ({ title, value, icon, valueClassName }: { title: string; value: string | number; icon: string; valueClassName?: string }) => (
    <div className="bg-slate-50 p-4 rounded-xl shadow-sm flex items-center gap-4 border border-slate-200">
        <div className={`p-3 rounded-full ${valueClassName} bg-opacity-10`}>
            <span className={`material-symbols-outlined text-3xl ${valueClassName}`}>{icon}</span>
        </div>
        <div>
            <h3 className="text-slate-500 text-sm">{title}</h3>
            <p className={`text-xl font-bold ${valueClassName || 'text-slate-800'}`}>{value}</p>
        </div>
    </div>
);


const ProductsView: React.FC<ProductsViewProps> = ({ products, addProduct, updateProduct, deleteProduct, lowStockThreshold }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const totalUniqueBooks = useMemo(() => products.length, [products]);
  const totalBookQuantity = useMemo(() => products.reduce((sum, p) => sum + p.quantity, 0), [products]);
  const lowStockCount = useMemo(() => products.filter(p => p.quantity > 0 && p.quantity <= lowStockThreshold).length, [products, lowStockThreshold]);

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        const lowerSearchTerm = searchTerm.toLowerCase();
        const matchesSearch = p.name.toLowerCase().includes(lowerSearchTerm) ||
          p.author?.toLowerCase().includes(lowerSearchTerm) ||
          p.category?.toLowerCase().includes(lowerSearchTerm);
        
        if (!matchesSearch) return false;

        switch (filter) {
          case 'low':
            return p.quantity > 0 && p.quantity <= lowStockThreshold;
          case 'out':
            return p.quantity === 0;
          default:
            return true;
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, searchTerm, filter, lowStockThreshold]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  const handleOpenModal = (product: Product | null = null) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingProduct(null);
    setIsModalOpen(false);
  };

  const handleSave = (productData: Omit<Product, 'id'>) => {
    if (editingProduct) {
      updateProduct(editingProduct.id, productData);
    } else {
      addProduct(productData);
    }
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      deleteProduct(id);
    }
  };

  const getStockClass = (quantity: number) => {
    if (quantity === 0) return 'text-red-600 bg-red-100 px-2 py-0.5 rounded-full';
    if (quantity <= lowStockThreshold) return 'text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full';
    return 'text-slate-700';
  };

  return (
    <div className="p-6">
      <div className="bg-white shadow-lg rounded-xl">
        <div className="p-6 border-b border-slate-200">
            <h2 className="text-2xl font-bold text-slate-800">إدارة الكتب (المخزون)</h2>
            <p className="text-sm text-slate-500 mt-1">إضافة وتعديل وحذف الكتب من المخزون.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-slate-50">
            <StatCard title="عناوين الكتب" value={totalUniqueBooks} icon="library_books" valueClassName="text-indigo-600" />
            <StatCard title="إجمالي النسخ المتوفرة" value={totalBookQuantity} icon="inventory" valueClassName="text-green-600" />
            <StatCard title="عناوين على وشك النفاذ" value={lowStockCount} icon="notification_important" valueClassName="text-orange-600" />
        </div>
        
        <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-4 border-t border-slate-200">
            <div className="flex items-center gap-4 w-full md:w-auto">
                <input
                    type="text"
                    placeholder="ابحث بالاسم, المؤلف, التصنيف..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full md:w-64 p-2 border border-slate-300 rounded-lg"
                />
                <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="p-2 border border-slate-300 rounded-lg bg-white">
                    <option value="all">كل المنتجات</option>
                    <option value="low">مخزون منخفض</option>
                    <option value="out">نفذ من المخزون</option>
                </select>
            </div>
            <button onClick={() => handleOpenModal()} className="w-full md:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">
                <span className="material-symbols-outlined">add</span>
                إضافة كتاب جديد
            </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto text-right">
            <thead className="bg-slate-50 text-slate-600 uppercase text-sm">
              <tr>
                <th className="py-3 px-6">اسم الكتاب</th>
                <th className="py-3 px-6">المؤلف</th>
                <th className="py-3 px-6">التصنيف</th>
                <th className="py-3 px-6 text-center">الكمية</th>
                <th className="py-3 px-6">السعر</th>
                <th className="py-3 px-6">التكلفة</th>
                <th className="py-3 px-6 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 text-sm">
              {paginatedProducts.map((p) => (
                <tr key={p.id} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="py-3 px-6 font-semibold">{p.name}</td>
                  <td className="py-3 px-6">{p.author || '-'}</td>
                  <td className="py-3 px-6">{p.category || '-'}</td>
                  <td className="py-3 px-6 text-center"><span className={`inline-block text-xs font-medium ${getStockClass(p.quantity)}`}>{p.quantity}</span></td>
                  <td className="py-3 px-6">{p.price.toFixed(2)}</td>
                  <td className="py-3 px-6">{(p.costPrice || 0).toFixed(2)}</td>
                  <td className="py-3 px-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleOpenModal(p)} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors" title="تعديل">
                            <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-red-600 transition-colors" title="حذف">
                            <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredProducts.length === 0 && <p className="text-center py-8 text-slate-500">لا يوجد كتب تطابق البحث.</p>}
        </div>

        <div className="p-6 border-t border-slate-200">
            <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={ITEMS_PER_PAGE}
            totalItems={filteredProducts.length}
            />
        </div>
      </div>
      {isModalOpen && <ProductModal product={editingProduct} onClose={handleCloseModal} onSave={handleSave} />}
    </div>
  );
};


const ProductModal: React.FC<{
  product: Product | null;
  onClose: () => void;
  onSave: (product: Omit<Product, 'id'>) => void;
}> = ({ product, onClose, onSave }) => {
  const [name, setName] = useState(product?.name || '');
  const [author, setAuthor] = useState(product?.author || '');
  const [quantity, setQuantity] = useState(product?.quantity.toString() || '0');
  const [price, setPrice] = useState(product?.price.toString() || '');
  const [costPrice, setCostPrice] = useState(product?.costPrice?.toString() || '');
  const [category, setCategory] = useState(product?.category || '');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = 'اسم الكتاب مطلوب.';
    const numQuantity = parseInt(quantity, 10);
    if (isNaN(numQuantity) || numQuantity < 0) newErrors.quantity = 'الكمية يجب أن تكون رقماً موجباً.';
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) newErrors.price = 'السعر يجب أن يكون رقماً موجباً.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onSave({
      name, author, category,
      quantity: parseInt(quantity, 10),
      price: parseFloat(price),
      costPrice: costPrice ? parseFloat(costPrice) : undefined,
    });
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={product ? 'تعديل كتاب' : 'إضافة كتاب جديد'} size="lg">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
            <InputField id="name" label="اسم الكتاب" value={name} onChange={e => setName(e.target.value)} error={errors.name} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField id="quantity" label="الكمية" value={quantity} onChange={e => setQuantity(e.target.value)} error={errors.quantity} type="number" />
              <InputField id="price" label="سعر البيع" value={price} onChange={e => setPrice(e.target.value)} error={errors.price} type="number" />
            </div>
            <InputField id="costPrice" label="سعر التكلفة (اختياري)" value={costPrice} onChange={e => setCostPrice(e.target.value)} type="number" />
            <InputField id="author" label="المؤلف (اختياري)" value={author} onChange={e => setAuthor(e.target.value)} />
            <InputField id="category" label="التصنيف (اختياري)" value={category} onChange={e => setCategory(e.target.value)} />
        </div>
        
        <div className="flex items-center justify-end gap-3 pt-6 mt-4 border-t border-slate-200">
          <button type="button" onClick={onClose} className="bg-slate-100 text-slate-700 font-bold py-2 px-4 rounded-lg hover:bg-slate-200 transition-colors">إلغاء</button>
          <button type="submit" className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">حفظ</button>
        </div>
      </form>
    </Modal>
  );
};

export default ProductsView;