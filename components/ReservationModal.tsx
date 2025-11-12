import React, { useState, useMemo, useEffect } from 'react';
import type { InvoiceItem, Customer } from '../types';
import Modal from './Modal';
import InputField from './common/InputField';

interface ReservationModalProps {
  cart: InvoiceItem[];
  customers: Customer[];
  onClose: () => void;
  onConfirm: (customerInfo: { id: string | null; name: string; phone: string; address?: string }) => void;
}

const ReservationModal: React.FC<ReservationModalProps> = ({ cart, customers, onClose, onConfirm }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
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
    setSearchTerm('');
  };
  
  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = 'اسم العميل مطلوب.';
    if (!phone.trim()) newErrors.phone = 'رقم هاتف العميل مطلوب.';
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
      };
      onConfirm(customerInfo);
    }
  };
  
  useEffect(() => {
    if (!name.trim()) {
      setSelectedCustomer(null);
    }
  }, [name]);


  return (
    <Modal isOpen={true} onClose={onClose} title="إنشاء حجز جديد">
      <form onSubmit={handleSubmit}>
        <div className="mb-4 p-4 bg-gray-100 rounded-lg">
            <h4 className="font-bold text-gray-700">ملخص الحجز</h4>
            <p>عدد الأصناف: {cart.length}</p>
            <p className="font-bold">المبلغ الإجمالي المطلوب: {cartTotal.toFixed(2)}</p>
        </div>
        
        <div className="relative">
             <InputField 
                id="customer-search" 
                label="ابحث عن عميل بالاسم أو الهاتف" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
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
        
        <div className="flex items-center justify-end gap-2 mt-6">
          <button type="button" onClick={onClose} className="bg-gray-500 text-white font-bold py-2 px-4 rounded hover:bg-gray-600">إلغاء</button>
          <button type="submit" className="bg-indigo-600 text-white font-bold py-2 px-4 rounded hover:bg-indigo-700">تأكيد الحجز</button>
        </div>
      </form>
    </Modal>
  );
};

export default ReservationModal;