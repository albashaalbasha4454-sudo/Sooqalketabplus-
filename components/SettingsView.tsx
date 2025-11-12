import React, { useState, useRef } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import InputField from './common/InputField';

interface SettingsViewProps {
  onUpdatePrices: (operation: 'multiply' | 'divide', factor: number) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onUpdatePrices }) => {
  const [lowStockThreshold, setLowStockThreshold] = useLocalStorage<number>('lowStockThreshold', 5);
  const [shopName, setShopName] = useLocalStorage<string>('shopName', 'اسم المحل');
  const [shopAddress, setShopAddress] = useLocalStorage<string>('shopAddress', 'تفاصيل العنوان ورقم الهاتف');
  
  const [priceFactor, setPriceFactor] = useState('1.0');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePriceUpdate = (operation: 'multiply' | 'divide') => {
    const factor = parseFloat(priceFactor);
    if(confirm(`هل أنت متأكد من ${operation === 'multiply' ? 'ضرب' : 'قسمة'} جميع أسعار البيع والتكلفة على المعامل ${factor}؟ هذا الإجراء لا يمكن التراجع عنه.`)) {
        onUpdatePrices(operation, factor);
    }
  }

  const handleExport = () => {
    try {
        const dataToExport: { [key: string]: any } = {};
        const keysToExport = [
            'users', 'products', 'invoices', 'expenses', 'returnRequests',
            'requestedBooks', 'customers', 'suppliers', 'purchases',
            'financialAccounts', 'financialTransactions', 'budgets',
            'tillCloseouts', // Export new data
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
        link.download = `library_backup_${date}.json`;
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
            "تحذير شديد! سيؤدي استيراد البيانات إلى حذف جميع البيانات الحالية على هذا الجهاز واستبدالها بالبيانات الموجودة في الملف.\n\nهل أنت متأكد من أنك تريد المتابعة؟"
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
                    throw new Error("الملف المحدد لا يبدو كملف نسخة احتياطية صالح. قد يكون تالفًا أو من تطبيق مختلف.");
                }

                allAppKeys.forEach(key => localStorage.removeItem(key));

                let importSummary = 'تم استيراد البيانات التالية بنجاح:\n\n';
                let importedSomething = false;

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

                alert(importSummary + '\nسيتم إعادة تحميل التطبيق الآن.');
                window.location.reload();
            } catch (error) {
                console.error("Error parsing or importing file:", error);
                alert(`حدث خطأ أثناء استيراد الملف: ${error instanceof Error ? error.message : 'تأكد من أنه ملف تصدير صالح.'}`);
            }
        }
    };
    reader.readAsText(file);
    event.target.value = ''; 
  };


  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-slate-800 mb-6">الإعدادات</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
        <div className="space-y-8">
            <div className="bg-white shadow-lg rounded-xl p-6">
                <h3 className="text-xl font-bold text-slate-700 border-b pb-2 mb-4">بيانات الفاتورة</h3>
                <div className="space-y-4">
                    <InputField id="shopName" label="اسم المحل" value={shopName} onChange={(e) => setShopName(e.target.value)} />
                    <InputField id="shopAddress" label="العنوان وبيانات التواصل" value={shopAddress} onChange={(e) => setShopAddress(e.target.value)} />
                </div>
            </div>

            <div className="bg-white shadow-lg rounded-xl p-6">
                <h3 className="text-xl font-bold text-slate-700 border-b pb-2 mb-4">إعدادات المخزون</h3>
                <div className="space-y-4">
                    <InputField id="lowStockThreshold" label="حد المخزون المنخفض (للتنبيهات)" type="number" value={lowStockThreshold.toString()} onChange={(e) => setLowStockThreshold(parseInt(e.target.value, 10) || 0)} />
                </div>
            </div>
            
            <div className="bg-white shadow-lg rounded-xl p-6">
                <h3 className="text-xl font-bold text-slate-700 border-b pb-2 mb-4">تحديث أسعار الكتب بالجملة</h3>
                <div className="p-4 bg-amber-50 border-r-4 border-amber-400 text-amber-800 rounded-md">
                    <p className="font-bold">تحذير:</p>
                    <p className="text-sm">هذا الإجراء سيقوم بتحديث أسعار البيع والتكلفة لـ **جميع** الكتب في المخزون. لا يمكن التراجع عن هذا التغيير.</p>
                </div>
                <div className="flex items-end gap-4 mt-4">
                    <InputField id="priceFactor" label="معامل التغيير" type="number" value={priceFactor} onChange={e => setPriceFactor(e.target.value)} />
                    <button onClick={() => handlePriceUpdate('multiply')} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors h-10">ضرب الأسعار</button>
                    <button onClick={() => handlePriceUpdate('divide')} className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors h-10">قسمة الأسعار</button>
                </div>
            </div>
        </div>
        
        <div className="bg-white shadow-lg rounded-xl p-6">
            <h3 className="text-xl font-bold text-slate-700 border-b pb-2 mb-4">إدارة بيانات التطبيق</h3>
            <div className="p-4 bg-blue-50 border-r-4 border-blue-400 text-blue-800 rounded-md">
                <p className="font-bold flex items-center gap-2"><span className="material-symbols-outlined">info</span> تصدير البيانات</p>
                <p className="text-sm mt-1">
                يمكنك تصدير جميع بيانات التطبيق إلى ملف واحد للحفظ كنسخة احتياطية أو لنقل البيانات إلى جهاز آخر. احتفظ بهذا الملف في مكان آمن.
                </p>
            </div>
             <div className="mt-4">
                <button onClick={handleExport} className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors h-12 flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined">download</span>
                    تصدير نسخة احتياطية الآن
                </button>
            </div>

            <div className="p-4 bg-red-50 border-r-4 border-red-400 text-red-800 rounded-md mt-6">
                <p className="font-bold flex items-center gap-2"><span className="material-symbols-outlined">warning</span> استيراد البيانات</p>
                <p className="text-sm mt-1">
                استيراد البيانات سيقوم بالكتابة فوق **جميع** البيانات الحالية على هذا الجهاز. استخدم هذه الميزة بحذر شديد.
                </p>
            </div>
            <div className="mt-4">
                <button onClick={handleImportClick} className="w-full bg-amber-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-amber-600 transition-colors h-12 flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined">upload</span>
                    استيراد من ملف نسخة احتياطية
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

export default SettingsView;