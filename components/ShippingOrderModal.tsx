import React, { useState, useMemo, useEffect } from 'react';
import type { InvoiceItem, Invoice, Customer } from '../types';
import Modal from './Modal';
import InputField from './common/InputField';

interface ShippingOrderModalProps {
  cart: InvoiceItem[];
  customers: Customer[];
  onClose: () => void;
  onConfirm: (customerInfo: { id: string | null; name: string; phone: string; address?: string }, shippingFee: number, source: Invoice['source']) => void;
}

const ShippingOrderModal: React.FC<ShippingOrderModalProps> = ({ cart, customers, onClose, onConfirm }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  const [shippingFee, setShippingFee] = useState('');
  const [source, setSource] = useState<Invoice['source']>('other');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [searchTerm, setSearchTerm] = useState('');

  const cartTotal = cart.reduce((sum, item) => sum + (item.price - (item.discount || 0)) * item.quantity, 0);

  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return customers.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.phone.includes(searchTerm)
    );
  }, [searchTerm, customers]);

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setName(customer.name);
    setPhone(customer.phone);
    setAddress(customer.address || '');
    setSearchTerm(''); // Clear search results after selection
  };
  
  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = 'اسم العميل مطلوب.';
    if (!phone.trim()) newErrors.phone = 'رقم هاتف العميل مطلوب.';
    if (!address.trim()) newErrors.address = 'عنوان العميل مطلوب.';
    const fee = parseFloat(shippingFee);
    if (!shippingFee.trim() || isNaN(fee) || fee < 0) {
        newErrors.shippingFee = 'أجور الشحن يجب أن تكون رقمًا موجبًا.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
        const customerInfo = {
            id: selectedCustomer?.id || null,
            name: name.trim(),
            phone: phone.trim(),
            address: address.trim(),
        };
      onConfirm(customerInfo, parseFloat(shippingFee), source);
    }
  };
  
  useEffect(() => {
    // If user clears the name field, deselect the customer
    if (!name.trim()) {
      setSelectedCustomer(null);
    }
  }, [name]);


  return (
    <Modal isOpen={true} onClose={onClose} title="إنشاء طلب شحن جديد">
      <form onSubmit={handleSubmit}>
        <div className="mb-4 p-4 bg-gray-100 rounded-lg">
            <h4 className="font-bold text-gray-700">ملخص الطلب</h4>
            <p>عدد الأصناف: {cart.length}</p>
            <p>مجموع الأصناف: {cartTotal.toFixed(2)}</p>
        </div>

        <div className="relative">
            <InputField 
                id="customer-search" 
                label="ابحث عن عميل بالاسم أو الهاتف" 
                value={searchTerm} 
                onChange={e => { setSearchTerm(e.target.value); }} 
            />
            {filteredCustomers.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-[-1rem] max-h-40 overflow-y-auto shadow-lg">
                    {filteredCustomers.map(c => (
                        <li key={c.id} onClick={() => handleSelectCustomer(c)} className="p-2 hover:bg-blue-100 cursor-pointer">
                            {c.name} - {c.phone}
                        </li>
                    ))}
                </ul>
            )}
        </div>
        
        <h4 className="font-semibold text-gray-700 mt-4 border-t pt-2">بيانات العميل</h4>
        <InputField id="name" label="الاسم الكامل" value={name} onChange={e => setName(e.target.value)} error={errors.name} />
        <InputField id="phone" label="رقم الهاتف" value={phone} onChange={e => setPhone(e.target.value)} error={errors.phone} type="tel" />
        <InputField id="address" label="العنوان الكامل" value={address} onChange={e => setAddress(e.target.value)} error={errors.address} />
        <InputField id="shippingFee" label="أجور الشحن" value={shippingFee} onChange={e => setShippingFee(e.target.value)} error={errors.shippingFee} type="number" />
        
        <div className="mb-4">
            <label htmlFor="source" className="block text-gray-700 text-sm font-bold mb-2">مصدر الطلب</label>
            <select
                id="source"
                value={source}
                onChange={(e) => setSource(e.target.value as Invoice['source'])}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
                <option value="other">أخرى</option>
                <option value="in-store">المحل</option>
                <option value="facebook">فيسبوك</option>
                <option value="instagram">انستجرام</option>
                <option value="whatsapp">واتساب</option>
            </select>
        </div>

        <div className="mt-6 p-4 bg-blue-100 rounded-lg text-blue-800 font-bold text-lg text-center">
            المبلغ الإجمالي المطلوب من العميل: {(cartTotal + (parseFloat(shippingFee) || 0)).toFixed(2)}
        </div>

        <div className="flex items-center justify-end gap-2 mt-6">
          <button type="button" onClick={onClose} className="bg-gray-500 text-white font-bold py-2 px-4 rounded hover:bg-gray-600">إلغاء</button>
          <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700">تأكيد وإنشاء الطلب</button>
        </div>
      </form>
    </Modal>
  );
};

export default ShippingOrderModal;