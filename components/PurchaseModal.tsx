import React, { useState } from 'react';
import type { Purchase, Product, Supplier } from '../types';
import Modal from './Modal';
import InputField from './common/InputField';

interface PurchaseModalProps {
  products: Product[];
  suppliers: Supplier[];
  onSave: (purchase: Omit<Purchase, 'id'>) => void;
  onCancel: () => void;
  addSupplier: (supplier: Omit<Supplier, 'id'>) => Supplier;
  createProduct: (product: Omit<Product, 'id'>) => Product;
  updateProduct: (id: string, product: Omit<Product, 'id'>) => void;
}

type PurchaseItemState = {
    key: number;
    productId: string; // ID or '--NEW--'
    newProductName: string;
    quantity: string;
    costPrice: string;
    price: string; // Selling price
    category: string;
}

const PurchaseModal: React.FC<PurchaseModalProps> = ({ products, suppliers, onSave, onCancel, addSupplier, createProduct, updateProduct }) => {
  const [supplierId, setSupplierId] = useState('');
  const [newSupplierName, setNewSupplierName] = useState('');
  const [items, setItems] = useState<PurchaseItemState[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleAddItem = () => {
    setItems([...items, { key: Date.now(), productId: '', newProductName: '', quantity: '1', costPrice: '', price: '', category: '' }]);
  };

  const handleItemChange = (key: number, field: keyof PurchaseItemState, value: string | number) => {
    const newItems = items.map(item => {
        if (item.key === key) {
            const updatedItem = { ...item, [field]: value };
            // Auto-fill fields when an existing product is selected
            if (field === 'productId' && value !== '--NEW--' && value !== '') {
                const product = products.find(p => p.id === value);
                if(product) {
                    updatedItem.costPrice = product.costPrice?.toString() || '';
                    updatedItem.price = product.price.toString() || '';
                    updatedItem.category = product.category || '';
                }
            }
            return updatedItem;
        }
        return item;
    });
    setItems(newItems);
  };


  const handleRemoveItem = (key: number) => {
    setItems(items.filter((item) => item.key !== key));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalSupplierId = supplierId;
    let finalSupplierName = suppliers.find(s => s.id === supplierId)?.name || '';

    if (supplierId === 'new' && newSupplierName.trim()) {
      const newSupplier = addSupplier({ name: newSupplierName.trim() });
      finalSupplierId = newSupplier.id;
      finalSupplierName = newSupplier.name;
    } else if (!finalSupplierId) {
      alert('الرجاء اختيار مورد أو إضافة مورد جديد.');
      return;
    }
    
    if (items.length === 0) {
      alert('الرجاء إضافة صنف واحد على الأقل.');
      return;
    }

    const finalItems: Purchase['items'] = [];

    // Process all items
    for (const item of items) {
        let currentProductId = item.productId;
        let currentProductName = '';

        const quantity = parseInt(item.quantity, 10);
        const costPrice = parseFloat(item.costPrice);
        const price = parseFloat(item.price);

        if (isNaN(quantity) || isNaN(costPrice) || quantity <= 0 || costPrice < 0) {
            alert('الرجاء التأكد من إدخال كميات وأسعار تكلفة صحيحة.');
            return;
        }

        // Handle new product creation
        if (item.productId === '--NEW--') {
            if (!item.newProductName.trim()) {
                alert('الرجاء إدخال اسم للكتاب الجديد.');
                return;
            }
            const newProductData = {
                name: item.newProductName.trim(),
                quantity: 0, // Initial quantity is 0, will be updated on stock-in
                price: !isNaN(price) ? price : 0,
                costPrice: costPrice,
                category: item.category.trim()
            };
            const newProduct = createProduct(newProductData);
            currentProductId = newProduct.id;
            currentProductName = newProduct.name;
        } else {
             const product = products.find(p => p.id === currentProductId);
             if (!product) continue; // Skip if product not found
             currentProductName = product.name;
             
             // Check if product data needs update
             const needsUpdate = product.costPrice !== costPrice || (!isNaN(price) && product.price !== price) || (item.category && product.category !== item.category);
             if(needsUpdate) {
                updateProduct(product.id, {
                    name: product.name,
                    author: product.author,
                    quantity: product.quantity,
                    costPrice: costPrice,
                    price: !isNaN(price) ? price : product.price,
                    category: item.category || product.category,
                });
             }
        }
        
        finalItems.push({
            productId: currentProductId,
            productName: currentProductName,
            quantity,
            costPrice,
            price: !isNaN(price) ? price : undefined,
            category: item.category.trim() || undefined
        });
    }

    if(finalItems.length === 0) {
        alert('لم تتم إضافة أي أصناف صالحة.');
        return;
    }

    const totalCost = finalItems.reduce((sum, item) => sum + item.quantity * item.costPrice, 0);

    onSave({
      date: new Date(date).toISOString(),
      supplierId: finalSupplierId,
      supplierName: finalSupplierName,
      items: finalItems,
      totalCost,
      paymentStatus: 'unpaid',
      payments: [],
      isStockedIn: false,
    });
  };
  
  const totalCost = items.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.costPrice) || 0), 0);

  return (
    <Modal isOpen={true} onClose={onCancel} title="إضافة فاتورة شراء جديدة" size="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="supplier" className="block text-slate-700 text-sm font-bold mb-2">المورد / الناشر</label>
                <select id="supplier" value={supplierId} onChange={e => setSupplierId(e.target.value)} className="w-full p-2 border rounded-lg bg-white border-slate-300">
                    <option value="">-- اختر مورد --</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    <option value="new">-- إضافة مورد جديد --</option>
                </select>
            </div>
            {supplierId === 'new' ? (
                <InputField id="newSupplier" label="اسم المورد الجديد" value={newSupplierName} onChange={e => setNewSupplierName(e.target.value)} />
            ) : (
                <InputField id="date" label="تاريخ الفاتورة" value={date} onChange={e => setDate(e.target.value)} type="date" />
            )}
        </div>
        
        <div className="border-t pt-4">
            <h4 className="font-bold mb-2 text-slate-800">الأصناف المشتراة</h4>
            <div className="space-y-4 max-h-72 overflow-y-auto p-2 bg-slate-50 rounded-lg">
                {items.map((item) => (
                <div key={item.key} className="p-3 bg-white border rounded-lg shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-start">
                        <div className="md:col-span-2">
                           <label className="text-xs font-medium text-slate-600">الكتاب</label>
                           <select value={item.productId} onChange={e => handleItemChange(item.key, 'productId', e.target.value)} className="w-full p-2 mt-1 border rounded-lg bg-white border-slate-300 text-sm">
                                <option value="">اختر كتابًا...</option>
                                <option value="--NEW--">-- إضافة كتاب جديد --</option>
                                {products.sort((a,b) => a.name.localeCompare(b.name)).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                           </select>
                           {item.productId === '--NEW--' && (
                               <input type="text" placeholder="اسم الكتاب الجديد" value={item.newProductName} onChange={e => handleItemChange(item.key, 'newProductName', e.target.value)} className="w-full p-2 mt-2 border rounded-lg border-slate-300 text-sm" />
                           )}
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600">الكمية</label>
                            <input type="number" placeholder="الكمية" value={item.quantity} onChange={e => handleItemChange(item.key, 'quantity', e.target.value)} className="w-full p-2 mt-1 border rounded-lg border-slate-300 text-sm" min="1" />
                        </div>
                         <div>
                            <label className="text-xs font-medium text-slate-600">سعر التكلفة</label>
                            <input type="number" placeholder="التكلفة" value={item.costPrice} onChange={e => handleItemChange(item.key, 'costPrice', e.target.value)} className="w-full p-2 mt-1 border rounded-lg border-slate-300 text-sm" step="0.01" min="0" />
                        </div>
                        <div className="text-right">
                           <label className="text-xs font-medium text-slate-600">الإجمالي</label>
                           <p className="font-semibold text-slate-800 p-2 mt-1">
                                {((parseFloat(item.quantity) || 0) * (parseFloat(item.costPrice) || 0)).toFixed(2)}
                           </p>
                        </div>
                        <div className="md:col-span-2">
                             <label className="text-xs font-medium text-slate-600">سعر البيع (اختياري)</label>
                             <input type="number" placeholder="سعر البيع" value={item.price} onChange={e => handleItemChange(item.key, 'price', e.target.value)} className="w-full p-2 mt-1 border rounded-lg border-slate-300 text-sm" step="0.01" min="0" />
                        </div>
                        <div className="md:col-span-2">
                             <label className="text-xs font-medium text-slate-600">التصنيف (اختياري)</label>
                             <input type="text" placeholder="التصنيف" value={item.category} onChange={e => handleItemChange(item.key, 'category', e.target.value)} className="w-full p-2 mt-1 border rounded-lg border-slate-300 text-sm" />
                        </div>
                    </div>
                    <div className="flex justify-end mt-2">
                        <button type="button" onClick={() => handleRemoveItem(item.key)} className="text-red-500 hover:text-red-700 text-xs font-semibold">إزالة</button>
                    </div>
                </div>
              ))}
            </div>
            
            <button type="button" onClick={handleAddItem} className="bg-slate-200 text-sm py-1 px-3 rounded-lg hover:bg-slate-300 mt-2 text-slate-700 font-semibold">
              + إضافة صنف
            </button>
        </div>


        <div className="mt-4 p-3 bg-slate-100 rounded-lg text-right font-bold text-lg text-slate-800">
            الإجمالي: {totalCost.toFixed(2)}
        </div>

        <div className="flex items-center justify-end gap-3 pt-6 mt-4 border-t border-slate-200">
          <button type="button" onClick={onCancel} className="bg-slate-100 text-slate-700 font-bold py-2 px-4 rounded-lg hover:bg-slate-200 transition-colors">إلغاء</button>
          <button type="submit" className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">حفظ الفاتورة</button>
        </div>
      </form>
    </Modal>
  );
};

export default PurchaseModal;