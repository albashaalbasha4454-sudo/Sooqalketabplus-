import React, { useState, useMemo } from 'react';
import type { Supplier } from '../types';
import Modal from './Modal';
import InputField from './common/InputField';
import Pagination from './common/Pagination';

interface SuppliersViewProps {
  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id'>) => Supplier;
  updateSupplier: (id: string, supplier: Omit<Supplier, 'id'>) => void;
  deleteSupplier: (id: string) => void;
}

const ITEMS_PER_PAGE = 10;

const SuppliersView: React.FC<SuppliersViewProps> = ({ suppliers, addSupplier, updateSupplier, deleteSupplier }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a,b) => a.name.localeCompare(b.name));
  }, [suppliers, searchTerm]);

  const paginatedSuppliers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSuppliers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredSuppliers, currentPage]);

  const totalPages = Math.ceil(filteredSuppliers.length / ITEMS_PER_PAGE);

  const handleOpenModal = (supplier: Supplier | null = null) => {
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingSupplier(null);
    setIsModalOpen(false);
  };

  const handleSave = (supplierData: Omit<Supplier, 'id'>) => {
    if (editingSupplier) {
      updateSupplier(editingSupplier.id, supplierData);
    } else {
      addSupplier(supplierData);
    }
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المورد؟')) {
      deleteSupplier(id);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">الموردون</h2>
      <div className="bg-white shadow-md rounded-lg p-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
          <input
            type="text"
            placeholder="ابحث بالاسم..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full md:w-1/3 p-2 border border-gray-300 rounded-md"
          />
          <button onClick={() => handleOpenModal()} className="w-full md:w-auto bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700">
            + إضافة مورد جديد
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto text-right">
            <thead className="bg-gray-100 text-gray-600 uppercase text-sm">
              <tr>
                <th className="py-3 px-6">الاسم</th>
                <th className="py-3 px-6">مسؤول التواصل</th>
                <th className="py-3 px-6">الهاتف</th>
                <th className="py-3 px-6">البريد الإلكتروني</th>
                <th className="py-3 px-6 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 text-sm">
              {paginatedSuppliers.map((supplier) => (
                <tr key={supplier.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-6 font-semibold">{supplier.name}</td>
                  <td className="py-3 px-6">{supplier.contactPerson || '-'}</td>
                  <td className="py-3 px-6">{supplier.phone || '-'}</td>
                  <td className="py-3 px-6">{supplier.email || '-'}</td>
                  <td className="py-3 px-6 text-center">
                    <button onClick={() => handleOpenModal(supplier)} className="text-blue-600 hover:text-blue-800 font-semibold mr-4">تعديل</button>
                    <button onClick={() => handleDelete(supplier.id)} className="text-red-600 hover:text-red-800 font-semibold">حذف</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredSuppliers.length === 0 && <p className="text-center py-4">لا يوجد موردون لعرضهم.</p>}
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={ITEMS_PER_PAGE}
          totalItems={filteredSuppliers.length}
        />
      </div>
      {isModalOpen && (
        <SupplierModal
          supplier={editingSupplier}
          onClose={handleCloseModal}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

// SupplierModal component
const SupplierModal: React.FC<{
  supplier: Supplier | null;
  onClose: () => void;
  onSave: (supplier: Omit<Supplier, 'id'>) => void;
}> = ({ supplier, onClose, onSave }) => {
  const [name, setName] = useState(supplier?.name || '');
  const [contactPerson, setContactPerson] = useState(supplier?.contactPerson || '');
  const [phone, setPhone] = useState(supplier?.phone || '');
  const [email, setEmail] = useState(supplier?.email || '');
  const [address, setAddress] = useState(supplier?.address || '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('اسم المورد حقل إلزامي.');
      return;
    }
    onSave({ name, contactPerson, phone, email, address });
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={supplier ? 'تعديل مورد' : 'إضافة مورد جديد'}>
      <form onSubmit={handleSubmit}>
        <InputField id="name" label="الاسم" value={name} onChange={(e) => setName(e.target.value)} />
        <InputField id="contactPerson" label="مسؤول التواصل" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
        <InputField id="phone" label="الهاتف" value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" />
        <InputField id="email" label="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
        <InputField id="address" label="العنوان" value={address} onChange={(e) => setAddress(e.target.value)} />
        {error && <p className="text-red-500 text-xs mb-4">{error}</p>}
        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="bg-gray-500 text-white font-bold py-2 px-4 rounded hover:bg-gray-600">إلغاء</button>
          <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700">حفظ</button>
        </div>
      </form>
    </Modal>
  );
};

export default SuppliersView;
