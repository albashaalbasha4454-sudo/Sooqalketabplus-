
import React from 'react';
import type { User } from '../types';

interface HeaderProps {
  currentUser: User;
  onLogout: () => void;
  toggleSidebar: () => void;
  onOpenCloseTillModal: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentUser, onLogout, toggleSidebar, onOpenCloseTillModal }) => {
  return (
    <header className="bg-white shadow-md h-16 flex items-center justify-between px-6 z-10 sticky top-0 flex-shrink-0">
        <div className="flex items-center gap-4">
            <button onClick={toggleSidebar} className="md:hidden p-2 rounded-full hover:bg-gray-100">
                <span className="material-symbols-outlined">menu</span>
            </button>
            <h1 className="text-xl font-bold text-gray-800">نظام إدارة المكتبة</h1>
        </div>
        <div className="flex items-center gap-4">
            {currentUser.role === 'cashier' && (
                <button 
                    onClick={onOpenCloseTillModal} 
                    className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 p-2 rounded-lg hover:bg-indigo-50 transition-colors"
                    title="تقرير إغلاق الصندوق اليومي"
                >
                    <span className="material-symbols-outlined">receipt_long</span>
                    <span className="hidden sm:inline">إغلاق الصندوق</span>
                </button>
            )}
            <div className="text-right">
                <p className="font-semibold text-gray-700">{currentUser.username}</p>
                <p className="text-xs text-gray-500">{currentUser.role === 'admin' ? 'مدير' : 'كاشير'}</p>
            </div>
            <button onClick={onLogout} className="flex items-center gap-2 text-gray-600 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors">
                <span className="material-symbols-outlined">logout</span>
                <span className="hidden sm:inline">تسجيل الخروج</span>
            </button>
        </div>
    </header>
  );
};

export default Header;