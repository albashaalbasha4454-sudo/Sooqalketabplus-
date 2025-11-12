import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Product, InvoiceItem, Customer } from '../types';
import ShippingOrderModal from './ShippingOrderModal';
import ReservationModal from './ReservationModal';
import Modal from './Modal';
import InputField from './common/InputField';


const RequestBookModal: React.FC<{
  bookName: string;
  onClose: () => void;
  onConfirm: (customerName: string, customerPhone: string) => void;
}> = ({ bookName, onClose, onConfirm }) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      setError('اسم العميل ورقم هاتفه مطلوبان.');
      return;
    }
    onConfirm(customerName, customerPhone);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`طلب حجز للكتاب: ${bookName}`}>
      <form onSubmit={handleSubmit}>
        <p className="mb-4 text-sm text-slate-600">سيتم إرسال طلب للمدير لتوفير هذا الكتاب. الرجاء إدخال بيانات العميل.</p>
        <InputField id="customerName" label="اسم العميل" value={customerName} onChange={e => setCustomerName(e.target.value)} />
        <InputField id="customerPhone" label="رقم هاتف العميل" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} type="tel" />
        {error && <p className="text-red-500 text-xs italic">{error}</p>}
        <div className="flex items-center justify-end gap-3 pt-6 mt-4 border-t border-slate-200">
          <button type="button" onClick={onClose} className="bg-slate-100 text-slate-700 font-bold py-2 px-4 rounded-lg hover:bg-slate-200 transition-colors">إلغاء</button>
          <button type="submit" className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">إرسال الطلب</button>
        </div>
      </form>
    </Modal>
  );
};


interface POSViewProps {
  products: Product[];
  customers: Customer[];
  onCompleteSale: (items: InvoiceItem[]) => void;
  onCreateShippingOrder: (cart: InvoiceItem[], customerInfo: any, shippingFee: number, source: any) => void;
  onCreateReservation: (cart: InvoiceItem[], customerInfo: any) => void;
  onAddRequestedBook: (bookName: string, customerName: string, customerPhone: string) => void;
}

const POSView: React.FC<POSViewProps> = ({ products, customers, onCompleteSale, onCreateShippingOrder, onCreateReservation, onAddRequestedBook }) => {
  const [cart, setCart] = useState<InvoiceItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [bookToRequest, setBookToRequest] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) && p.quantity > 0).slice(0, 10); // Limit results for performance
  }, [products, searchTerm]);

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.productId === product.id);
    if (existingItem) {
      if (existingItem.quantity < product.quantity) {
        setCart(cart.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      } else {
        alert('الكمية المطلوبة غير متوفرة في المخزون.');
      }
    } else {
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        price: product.price,
        costPrice: product.costPrice,
      }]);
    }
    setSearchTerm('');
    searchInputRef.current?.focus();
  };

  const updateCartItem = (productId: string, newQuantity: number, newDiscount: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (newQuantity > product.quantity) {
        alert('الكمية المطلوبة غير متوفرة في المخزون.');
        newQuantity = product.quantity;
    }
    
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.productId !== productId));
    } else {
      setCart(cart.map(item => item.productId === productId ? { ...item, quantity: newQuantity, discount: newDiscount } : item));
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price - (item.discount || 0)) * item.quantity, 0);

  const handleCompleteSale = () => {
    if (cart.length === 0) return;
    onCompleteSale(cart);
    setCart([]);
  };

  const handleCreateShippingOrder = (customerInfo: any, shippingFee: number, source: any) => {
      onCreateShippingOrder(cart, customerInfo, shippingFee, source);
      setIsShippingModalOpen(false);
      setCart([]);
  }
  
  const handleCreateReservation = (customerInfo: any) => {
      onCreateReservation(cart, customerInfo);
      setIsReservationModalOpen(false);
      setCart([]);
  }

  const handleRequestBookClick = () => {
    if(searchTerm.trim()) {
        setBookToRequest(searchTerm.trim());
        setIsRequestModalOpen(true);
    }
  }

  const handleConfirmRequest = (customerName: string, customerPhone: string) => {
    onAddRequestedBook(bookToRequest, customerName, customerPhone);
    setIsRequestModalOpen(false);
    setSearchTerm('');
    searchInputRef.current?.focus();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 p-6 h-[calc(100vh-76px)]">
      {/* Product Search Area */}
      <div className="lg:col-span-3 bg-white shadow-lg rounded-xl flex flex-col p-6">
        <div className="relative mb-4">
          <span className="material-symbols-outlined absolute top-1/2 -translate-y-1/2 right-4 text-slate-400">search</span>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="ابحث عن كتاب بالاسم..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 ps-12 border border-slate-300 rounded-lg text-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
          {searchTerm && (
            <div className="absolute z-10 w-full bg-white border border-slate-300 rounded-md mt-1 max-h-96 overflow-y-auto shadow-lg">
              {filteredProducts.map(p => (
                <div key={p.id} onClick={() => addToCart(p)} className="p-4 hover:bg-indigo-50 cursor-pointer flex justify-between items-center transition-colors">
                  <div>
                      <p className="font-semibold text-slate-800">{p.name}</p>
                      <p className="text-sm text-slate-500">{p.author}</p>
                  </div>
                  <div className="text-left">
                      <p className="font-bold text-indigo-600">{p.price.toFixed(2)}</p>
                      <p className="text-xs text-slate-400">المخزون: {p.quantity}</p>
                  </div>
                </div>
              ))}
              {filteredProducts.length === 0 && (
                <div className="p-4 text-center text-slate-500">
                    <p>الكتاب غير موجود.</p>
                    <button onClick={handleRequestBookClick} className="text-indigo-600 hover:underline font-semibold mt-1">هل تريد طلبه؟</button>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex-1 flex items-center justify-center bg-slate-50 rounded-lg">
            <div className="text-center text-slate-400">
                <span className="material-symbols-outlined text-6xl">search</span>
                <p>ابحث عن كتاب لإضافته إلى السلة</p>
            </div>
        </div>
      </div>

      {/* Cart Area */}
      <div className="lg:col-span-2 bg-white shadow-lg rounded-xl flex flex-col h-full">
        <h3 className="text-2xl font-bold p-4 border-b border-slate-200 flex-shrink-0">سلة المشتريات</h3>
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <span className="material-symbols-outlined text-6xl">shopping_cart_off</span>
                <p>السلة فارغة</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.productId} className="mb-3 p-3 border-b border-slate-200">
                <p className="font-bold text-slate-800">{item.productName}</p>
                <div className="flex items-center justify-between gap-2 mt-2 text-sm">
                  <div className="flex items-center gap-1">
                      <input type="number" value={item.quantity} onChange={e => updateCartItem(item.productId, parseInt(e.target.value) || 1, item.discount || 0)} className="w-16 p-1 border rounded text-center" />
                      <span className="text-slate-500">x {item.price.toFixed(2)}</span>
                  </div>
                  <input type="number" placeholder="خصم" value={item.discount || ''} onChange={e => updateCartItem(item.productId, item.quantity, parseFloat(e.target.value) || 0)} className="w-20 p-1 border rounded text-center" />
                  <span className="font-bold text-lg text-slate-900">{((item.price - (item.discount || 0)) * item.quantity).toFixed(2)}</span>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-4 border-t border-slate-200 mt-auto flex-shrink-0 bg-slate-50 rounded-b-xl">
          <div className="text-3xl font-bold flex justify-between mb-4 text-slate-800">
            <span>الإجمالي:</span>
            <span>{cartTotal.toFixed(2)}</span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <button onClick={handleCompleteSale} disabled={cart.length === 0} className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors text-lg flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">check_circle</span>
              إتمام البيع
            </button>
            <div className="grid grid-cols-2 gap-3">
                 <button onClick={() => setIsReservationModalOpen(true)} disabled={cart.length === 0} className="w-full bg-indigo-100 text-indigo-700 font-bold py-3 px-4 rounded-lg hover:bg-indigo-200 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined">event_available</span>
                    حجز
                </button>
                <button onClick={() => setIsShippingModalOpen(true)} disabled={cart.length === 0} className="w-full bg-sky-100 text-sky-700 font-bold py-3 px-4 rounded-lg hover:bg-sky-200 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined">local_shipping</span>
                    شحن
                </button>
            </div>
          </div>
        </div>
      </div>
       {isShippingModalOpen && <ShippingOrderModal cart={cart} customers={customers} onClose={() => setIsShippingModalOpen(false)} onConfirm={handleCreateShippingOrder} />}
       {isReservationModalOpen && <ReservationModal cart={cart} customers={customers} onClose={() => setIsReservationModalOpen(false)} onConfirm={handleCreateReservation} />}
       {isRequestModalOpen && <RequestBookModal bookName={bookToRequest} onClose={() => setIsRequestModalOpen(false)} onConfirm={handleConfirmRequest} />}
    </div>
  );
};

export default POSView;