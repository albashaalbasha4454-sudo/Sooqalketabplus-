import React, { useState } from 'react';
import type { User } from '../types';
import Modal from './Modal';
import InputField from './common/InputField';

interface UsersViewProps {
  users: User[];
  addUser: (user: Omit<User, 'id' | 'passwordHash' | 'salt'> & { password: string }) => User;
  updateUser: (id: string, user: Partial<Omit<User, 'id' | 'passwordHash' | 'salt'>> & { password?: string }) => void;
  deleteUser: (id: string) => void;
  currentUser: User;
}

const UsersView: React.FC<UsersViewProps> = ({ users, addUser, updateUser, deleteUser, currentUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const handleOpenModal = (user: User | null = null) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingUser(null);
    setIsModalOpen(false);
  };

  const handleSave = (userData: any) => {
    if (editingUser) {
      updateUser(editingUser.id, userData);
    } else {
      addUser(userData);
    }
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (id === currentUser.id) {
        alert("لا يمكنك حذف حسابك الخاص.");
        return;
    }
    if (window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      deleteUser(id);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">المستخدمون</h2>
      <div className="bg-white shadow-md rounded-lg p-4">
        <div className="flex justify-end mb-4">
          <button onClick={() => handleOpenModal()} className="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700">
            + إضافة مستخدم جديد
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto text-right">
            <thead className="bg-gray-100 text-gray-600 uppercase text-sm">
              <tr>
                <th className="py-3 px-6">اسم المستخدم</th>
                <th className="py-3 px-6">الدور</th>
                <th className="py-3 px-6 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 text-sm">
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-6 font-semibold">{user.username}</td>
                  <td className="py-3 px-6">{user.role === 'admin' ? 'مدير' : 'كاشير'}</td>
                  <td className="py-3 px-6 text-center">
                    <button onClick={() => handleOpenModal(user)} className="text-blue-600 hover:text-blue-800 font-semibold mr-4">تعديل</button>
                    {user.id !== currentUser.id && (
                        <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-800 font-semibold">حذف</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {isModalOpen && (
        <UserModal
          user={editingUser}
          onClose={handleCloseModal}
          onSave={handleSave}
          isEditing={!!editingUser}
        />
      )}
    </div>
  );
};

// UserModal component
const UserModal: React.FC<{
  user: User | null;
  onClose: () => void;
  onSave: (data: any) => void;
  isEditing: boolean;
}> = ({ user, onClose, onSave, isEditing }) => {
  const [username, setUsername] = useState(user?.username || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'cashier'>(user?.role || 'cashier');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};
    if (!username.trim()) newErrors.username = 'اسم المستخدم مطلوب.';
    if (!isEditing && !password) {
      newErrors.password = 'كلمة المرور مطلوبة للمستخدم الجديد.';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const dataToSave: any = { username, role };
    if (password) {
      dataToSave.password = password;
    }
    
    onSave(dataToSave);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={user ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}>
      <form onSubmit={handleSubmit}>
        <InputField id="username" label="اسم المستخدم" value={username} onChange={(e) => setUsername(e.target.value)} error={errors.username}/>
        <InputField id="password" label={`كلمة المرور ${isEditing ? '(اتركه فارغاً لعدم التغيير)' : ''}`} value={password} onChange={(e) => setPassword(e.target.value)} type="password" error={errors.password}/>
        <div className="mb-4">
            <label htmlFor="role" className="block text-gray-700 text-sm font-bold mb-2">الدور</label>
            <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'cashier')}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
            >
                <option value="cashier">كاشير</option>
                <option value="admin">مدير</option>
            </select>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="bg-gray-500 text-white font-bold py-2 px-4 rounded hover:bg-gray-600">إلغاء</button>
          <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700">حفظ</button>
        </div>
      </form>
    </Modal>
  );
};

export default UsersView;
