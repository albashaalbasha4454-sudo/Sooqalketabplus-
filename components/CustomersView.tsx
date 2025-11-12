import React, { useState, useMemo } from 'react';
import type { Customer } from '../types';
import Modal from './Modal';
import InputField from './common/InputField';
import Pagination from './common/Pagination';

interface CustomersViewProps {
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id'>) => void;
  updateCustomer: (id: string, customer: Omit<Customer, 'id'>) => void;
  deleteCustomer: (id: string) => void;
}

const ITEMS_PER_PAGE = 10;

const CustomersView: React.FC<CustomersViewProps> = ({ customers, addCustomer, updateCustomer, deleteCustomer }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredCustomers = useMemo(() => {
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm)
    ).sort((a,b) => a.name.localeCompare(b.name));
  }, [customers, searchTerm]);

  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCustomers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredCustomers, currentPage]);

  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);
  
  const handleOpenModal = (customer: Customer | null = null) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingCustomer(null);
    setIsModalOpen(false);
  };

  const handleSave = (customerData: Omit<Customer, 'id'>) => {
    if (editingCustomer) {
      updateCustomer(editingCustomer.id, customerData);
    } else {
      addCustomer(customerData);
    }
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا العميل؟')) {
      deleteCustomer(id);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">العملاء</h2>
      <div className="bg-white shadow-md rounded-lg p-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
          <input
            type="text"
            placeholder="ابحث بالاسم أو رقم الهاتف..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full md:w-1/3 p-2 border border-gray-300 rounded-md"
          />
          <button onClick={() => handleOpenModal()} className="w-full md:w-auto bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700">
            + إضافة عميل جديد
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto text-right">
            <thead className="bg-gray-100 text-gray-600 uppercase text-sm">
              <tr>
                <th className="py-3 px-6">الاسم</th>
                <th className="py-3 px-6">الهاتف</th>
                <th className="py-3 px-6">العنوان</th>
                <th className="py-3 px-6">البريد الإلكتروني</th>
                <th className="py-3 px-6 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 text-sm">
              {paginatedCustomers.map((customer) => (
                <tr key={customer.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-6 font-semibold">{customer.name}</td>
                  <td className="py-3 px-6">{customer.phone}</td>
                  <td className="py-3 px-6">{customer.address || '-'}</td>
                  <td className="py-3 px-6">{customer.email || '-'}</td>
                  <td className="py-3 px-6 text-center">
                    <button onClick={() => handleOpenModal(customer)} className="text-blue-600 hover:text-blue-800 font-semibold mr-4">تعديل</button>
                    <button onClick={() => handleDelete(customer.id)} className="text-red-600 hover:text-red-800 font-semibold">حذف</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCustomers.length === 0 && <p className="text-center py-4">لا يوجد عملاء لعرضهم.</p>}
        </div>
         <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={ITEMS_PER_PAGE}
          totalItems={filteredCustomers.length}
        />
      </div>
      {isModalOpen && (
        <CustomerModal
          customer={editingCustomer}
          onClose={handleCloseModal}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

// CustomerModal component (kept in the same file for simplicity)
const CustomerModal: React.FC<{
  customer: Customer | null;
  onClose: () => void;
  onSave: (customer: Omit<Customer, 'id'>) => void;
}> = ({ customer, onClose, onSave }) => {
  const [name, setName] = useState(customer?.name || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [address, setAddress] = useState(customer?.address || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [notes, setNotes] = useState(customer?.notes || '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError('الاسم ورقم الهاتف حقول إلزامية.');
      return;
    }
    onSave({ name, phone, address, email, notes });
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={customer ? 'تعديل عميل' : 'إضافة عميل جديد'}>
      <form onSubmit={handleSubmit}>
        <InputField id="name" label="الاسم" value={name} onChange={(e) => setName(e.target.value)} />
        <InputField id="phone" label="الهاتف" value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" />
        <InputField id="address" label="العنوان" value={address} onChange={(e) => setAddress(e.target.value)} />
        <InputField id="email" label="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
        <div className="mb-4">
          <label htmlFor="notes" className="block text-gray-700 text-sm font-bold mb-2">ملاحظات</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        {error && <p className="text-red-500 text-xs mb-4">{error}</p>}
        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="bg-gray-500 text-white font-bold py-2 px-4 rounded hover:bg-gray-600">إلغاء</button>
          <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700">حفظ</button>
        </div>
      </form>
    </Modal>
  );
};

export default CustomersView;
