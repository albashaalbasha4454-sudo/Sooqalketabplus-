import React, { useRef } from 'react';
import type { User } from '../types';

interface CashierToolsViewProps {
  currentUser: User;
}

const CashierToolsView: React.FC<CashierToolsViewProps> = ({ currentUser }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = () => {
        try {
            const dataToExport: { [key: string]: any } = {};
            const keysToExport = [
                'users', 'products', 'invoices', 'expenses', 'returnRequests',
                'requestedBooks', 'customers', 'suppliers', 'purchases',
                'financialAccounts', 'financialTransactions', 'budgets',
                'tillCloseouts',
                'lowStockThreshold', 'shopName', 'shopAddress'
            ];
            
            keysToExport.forEach(key => {
                const item = localStorage.getItem(key);
                if (item) {
                    dataToExport[key] = JSON.parse(item);
                }
            });

            const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
              JSON.stringify(dataToExport, null, 2)
            )}`;
            const link = document.createElement("a");
            link.href = jsonString;
            const date = new Date().toISOString().split('T')[0];
            link.download = `library_backup_${currentUser.username}_${date}.json`;
            link.click();
            alert('تم بدء تصدير البيانات بنجاح! الملف يحتوي على جميع بيانات التطبيق.');
        } catch (error) {
            console.error('Export failed:', error);
            alert('فشل تصدير البيانات.');
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const translateKeyToArabic = (key: string): string => {
        const map: { [key: string]: string } = {
            'products': 'الكتب',
            'invoices': 'الفواتير والطلبات',
            'users': 'المستخدمون',
            'customers': 'العملاء',
            'suppliers': 'الموردون',
            'purchases': 'المشتريات',
            'expenses': 'المصروفات',
            'financialAccounts': 'الحسابات المالية',
            'financialTransactions': 'الحركات المالية',
            'budgets': 'الميزانيات',
            'tillCloseouts': 'إغلاقات الصناديق',
            'returnRequests': 'طلبات الإرجاع',
            'requestedBooks': 'الكتب المطلوبة',
        };
        return map[key] || key;
    }

    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.json')) {
            alert("الرجاء اختيار ملف JSON صالح.");
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result;
            if (typeof text !== 'string') return;
            
            const confirmation = window.confirm(
                "تحذير! سيؤدي هذا الإجراء إلى حذف جميع البيانات الحالية على هذا الجهاز (بما في ذلك مبيعاتك) واستبدالها بالبيانات الموجودة في الملف.\n\nتأكد من تصدير عملك الحالي أولاً إذا كنت تريد الاحتفاظ به.\n\nهل أنت متأكد من المتابعة؟"
            );
            
            if (confirmation) {
                try {
                    const data = JSON.parse(text);
                    const allAppKeys = [
                        'users', 'products', 'invoices', 'expenses', 'returnRequests',
                        'requestedBooks', 'customers', 'suppliers', 'purchases',
                        'financialAccounts', 'financialTransactions', 'budgets', 'tillCloseouts',
                        'lowStockThreshold', 'shopName', 'shopAddress', 'currentUser'
                    ];

                    const importedKeys = Object.keys(data);
                    const hasAtLeastOneValidKey = importedKeys.some(key => allAppKeys.includes(key));

                    if (typeof data !== 'object' || data === null || !hasAtLeastOneValidKey) {
                        throw new Error("الملف المحدد لا يبدو كملف نسخة احتياطية صالح.");
                    }

                    // Clear existing data
                    allAppKeys.forEach(key => localStorage.removeItem(key));

                    let importSummary = 'تم استيراد البيانات التالية بنجاح:\n\n';
                    let importedSomething = false;

                    // Import new data
                    allAppKeys.forEach(key => {
                        if (data.hasOwnProperty(key) && data[key] !== null) {
                            const value = data[key];
                            localStorage.setItem(key, JSON.stringify(value));
                             if (Array.isArray(value)) {
                                importSummary += `- ${translateKeyToArabic(key)}: ${value.length} سجل\n`;
                            }
                            importedSomething = true;
                        }
                    });

                    if (!importedSomething) {
                        throw new Error("لم يتم العثور على بيانات متوافقة في الملف.");
                    }

                    alert(importSummary + '\nسيتم إعادة تحميل التطبيق الآن لتطبيق التغييرات.');
                    window.location.reload();
                } catch (error) {
                    console.error("Error importing file:", error);
                    alert(`حدث خطأ أثناء استيراد الملف: ${error instanceof Error ? error.message : 'تأكد من أنه ملف تصدير صالح.'}`);
                }
            }
        };
        reader.readAsText(file);
        event.target.value = ''; 
    };

    return (
        <div className="p-6">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">إدارة البيانات</h2>
            <p className="text-sm text-slate-500 max-w-2xl">تصدير نسخة احتياطية من عملك، أو استيراد بيانات محدثة من المدير.</p>
            <div className="max-w-2xl mt-6 space-y-8">
                {/* Export Card */}
                <div className="bg-white shadow-lg rounded-xl p-6">
                    <h3 className="text-xl font-bold text-slate-700 border-b pb-2 mb-4">تصدير البيانات (نسخة احتياطية)</h3>
                     <div className="p-4 bg-blue-50 border-r-4 border-blue-400 text-blue-800 rounded-md">
                        <p className="font-bold flex items-center gap-2"><span className="material-symbols-outlined">info</span> حفظ عملك اليومي</p>
                        <p className="text-sm mt-1">
                        استخدم هذا الخيار لتصدير جميع بياناتك الحالية (بما في ذلك المبيعات) إلى ملف. احتفظ بهذا الملف كنسخة احتياطية قبل استيراد أي بيانات جديدة.
                        </p>
                    </div>
                    <div className="mt-4">
                        <button onClick={handleExport} className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors h-12 flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined">download</span>
                            تصدير نسخة احتياطية الآن
                        </button>
                    </div>
                </div>

                {/* Import Card */}
                <div className="bg-white shadow-lg rounded-xl p-6">
                    <h3 className="text-xl font-bold text-slate-700 border-b pb-2 mb-4">استيراد البيانات (تحديث)</h3>
                    <div className="p-4 bg-red-50 border-r-4 border-red-400 text-red-800 rounded-md">
                        <p className="font-bold flex items-center gap-2"><span className="material-symbols-outlined">warning</span> انتبه!</p>
                        <p className="text-sm mt-1">
                        سيؤدي استيراد البيانات إلى الكتابة فوق **جميع** بياناتك الحالية على هذا الجهاز. استخدم هذه الميزة لاستقبال تحديثات من المدير (مثل قائمة كتب جديدة).
                        </p>
                    </div>
                    <div className="mt-4">
                        <button onClick={handleImportClick} className="w-full bg-amber-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-amber-600 transition-colors h-12 flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined">upload</span>
                            استيراد من ملف
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileImport}
                            className="hidden"
                            accept=".json"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CashierToolsView;