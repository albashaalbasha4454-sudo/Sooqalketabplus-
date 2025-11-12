import type { User, Product, Customer, Supplier, FinancialAccount } from './types';

// Hashing function for demonstration.
const simpleHash = (password: string, salt: string) => `hashed_${password}_with_${salt}`;

const createInitialUsers = (): User[] => {
    // USE STATIC SALTS FOR PRE-DEFINED USERS
    const adminSalt = 'static_salt_for_admin_user_123';
    const cashierSalt = 'static_salt_for_cashier_user_456';
    return [
        { id: 'user-1', username: 'admin', passwordHash: simpleHash('albasha.123', adminSalt), salt: adminSalt, role: 'admin' },
        { id: 'user-2', username: 'cashier', passwordHash: simpleHash('123', cashierSalt), salt: cashierSalt, role: 'cashier' },
    ];
};

const createInitialProducts = (): Product[] => {
    return [
        { id: 'prod-1', name: 'كتاب ألف ليلة وليلة', author: 'غير معروف', category: 'أدب عربي', quantity: 15, price: 80, costPrice: 50 },
        { id: 'prod-2', name: 'مقدمة ابن خلدون', author: 'ابن خلدون', category: 'تاريخ', quantity: 8, price: 120, costPrice: 85 },
        { id: 'prod-3', name: 'لا تحزن', author: 'عائض القرني', category: 'تنمية بشرية', quantity: 25, price: 60, costPrice: 40 },
        { id: 'prod-4', name: 'ثلاثية غرناطة', author: 'رضوى عاشور', category: 'روايات', quantity: 3, price: 95, costPrice: 65 },
        { id: 'prod-5', name: 'الأمير الصغير', author: 'أنطوان دو سانت إكزوبيري', category: 'أدب أطفال', quantity: 0, price: 45, costPrice: 30 },
    ];
};

const createInitialCustomers = (): Customer[] => {
    return [
        { id: 'cust-1', name: 'أحمد محمود', phone: '01012345678', address: '123 شارع النصر، القاهرة', email: 'ahmed@email.com', notes: 'عميل دائم' },
        { id: 'cust-2', name: 'فاطمة علي', phone: '01298765432', address: '456 شارع الحرية، الإسكندرية', email: 'fatima@email.com', notes: '' },
    ];
};

const createInitialSuppliers = (): Supplier[] => {
    return [
        { id: 'sup-1', name: 'دار الشروق', contactPerson: 'محمد علي', phone: '0223456789' },
        { id: 'sup-2', name: 'دار المعارف', contactPerson: 'سارة حسن', phone: '0229876543' },
    ];
};

const createInitialAccounts = (): FinancialAccount[] => {
    return [
        { id: 'cash-default', name: 'الخزينة الرئيسية (للإدارة)', type: 'cash' },
        { id: 'bank-default', name: 'الحساب البنكي', type: 'bank' },
    ];
}


export const initialUsers = createInitialUsers();
export const initialProducts = createInitialProducts();
export const initialCustomers = createInitialCustomers();
export const initialSuppliers = createInitialSuppliers();
export const initialAccounts = createInitialAccounts();