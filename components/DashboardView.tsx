import React, { useMemo, useState, useEffect, useRef } from 'react';
import type { Invoice, Product, Expense, Customer } from '../types';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const StatCard = ({ title, value, icon, valueClassName, subtext }: { title: string, value: string | number, icon: string, valueClassName?: string, subtext?: string }) => (
    <div className="bg-white p-4 rounded-xl shadow-lg flex items-center gap-4">
        <div className={`p-3 rounded-full ${valueClassName} bg-opacity-10`}>
            <span className={`material-symbols-outlined text-3xl ${valueClassName}`}>{icon}</span>
        </div>
        <div>
            <h3 className="text-slate-500 text-sm">{title}</h3>
            <p className={`text-xl font-bold ${valueClassName || 'text-slate-800'}`}>{value}</p>
            {subtext && <p className="text-xs text-slate-400">{subtext}</p>}
        </div>
    </div>
);

const InfoListCard: React.FC<{ title: string; icon: string; children: React.ReactNode; }> = ({ title, icon, children }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg h-full">
        <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-slate-600">{icon}</span>
            <h3 className="text-xl font-bold text-slate-800">{title}</h3>
        </div>
        <div className="space-y-3 text-sm max-h-64 overflow-y-auto">
            {children}
        </div>
    </div>
);


const DashboardView: React.FC<{
  invoices: Invoice[];
  products: Product[];
  expenses: Expense[];
  customers: Customer[];
  lowStockThreshold: number;
}> = ({ invoices, products, expenses, customers, lowStockThreshold }) => {
  const [dateRange, setDateRange] = useState<'all' | '7' | '30'>('30');

  const profitExpenseChartRef = useRef<HTMLCanvasElement>(null);
  const chartInstances = useRef<{ [key: string]: Chart | null }>({});

  const {
    netSales, grossProfit, totalExpenses, netProfit, 
    pendingOrders, recentSales, lowStockProducts, dailyData
  } = useMemo(() => {
    const today = new Date();
    const rangeStart = new Date();
    if (dateRange !== 'all') {
        rangeStart.setDate(today.getDate() - parseInt(dateRange));
    } else {
        rangeStart.setFullYear(1970);
    }
    rangeStart.setHours(0,0,0,0);
    
    const dateFilter = (itemDateStr: string | undefined) => {
        if (!itemDateStr) return false;
        const itemDate = new Date(itemDateStr);
        return itemDate >= rangeStart;
    };
    
    const completedSales = invoices.filter(inv => 
        (inv.type === 'sale' || (inv.type === 'shipping' && inv.status === 'completed' && inv.paymentStatus === 'paid')) && dateFilter(inv.paidDate)
    );

    const returns = invoices.filter(inv => inv.type === 'return' && dateFilter(inv.date));
    const filteredExpenses = expenses.filter(exp => dateFilter(exp.date));

    const totalSalesValue = completedSales.reduce((sum, inv) => sum + inv.total, 0);
    const totalReturnsValue = returns.reduce((sum, inv) => sum + inv.total, 0); 
    const netSales = totalSalesValue + totalReturnsValue;

    const cogs = completedSales.reduce((sum, inv) => sum + (inv.totalCost || 0), 0);
    const grossProfit = netSales - cogs;
    
    const totalExpensesValue = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const netProfit = grossProfit - totalExpensesValue;
    
    const pendingOrders = invoices.filter(inv => inv.status === 'pending' && (inv.type === 'shipping' || inv.type === 'reservation')).length;

    const recentSales = invoices
        .filter(i => i.type === 'sale' || (i.type === 'shipping' && i.status === 'completed'))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);
        
    const lowStockProducts = products
        .filter(p => p.quantity > 0 && p.quantity <= lowStockThreshold)
        .sort((a, b) => a.quantity - b.quantity);

    const dailyData: { [date: string]: { profit: number, expense: number } } = {};
     [...completedSales, ...returns].forEach(inv => {
        const day = new Date(inv.date).toISOString().split('T')[0];
        if (!dailyData[day]) dailyData[day] = { profit: 0, expense: 0 };
        dailyData[day].profit += inv.totalProfit || 0;
    });
    filteredExpenses.forEach(exp => {
        const day = new Date(exp.date).toISOString().split('T')[0];
        if (!dailyData[day]) dailyData[day] = { profit: 0, expense: 0 };
        dailyData[day].expense += exp.amount;
    });

    return {
        netSales, grossProfit, totalExpenses: totalExpensesValue, netProfit, 
        pendingOrders, recentSales, lowStockProducts,
        dailyData
    };
  }, [invoices, expenses, products, lowStockThreshold, dateRange]);

  useEffect(() => {
    // FIX: Using Object.keys to iterate and destroy charts to ensure proper type inference.
    Object.keys(chartInstances.current).forEach(key => chartInstances.current[key]?.destroy());
    
    const ctx = profitExpenseChartRef.current?.getContext('2d');
    if (ctx) {
        const sortedDays = Object.keys(dailyData).sort();
        chartInstances.current['profitExpense'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: sortedDays.map(d => new Date(d).toLocaleDateString('ar-EG', {month: 'short', day: 'numeric'})),
                datasets: [
                {
                    label: 'إجمالي الربح',
                    data: sortedDays.map(day => dailyData[day].profit),
                    borderColor: 'rgb(34, 197, 94)',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    fill: true,
                    tension: 0.3,
                },
                {
                    label: 'المصروفات',
                    data: sortedDays.map(day => dailyData[day].expense),
                    borderColor: 'rgb(239, 68, 68)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: true,
                    tension: 0.3,
                }
                ],
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
        });
    }
    
    return () => {
        // FIX: Using Object.keys to iterate and destroy charts to ensure proper type inference.
        Object.keys(chartInstances.current).forEach(key => chartInstances.current[key]?.destroy());
    }
  }, [dailyData]);
  
  const dateRangeText = dateRange === 'all' ? 'كل الأوقات' : `آخر ${dateRange} يوم`;

  return (
    <div className="p-6 bg-slate-100">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">لوحة التحكم</h2>
            <p className="text-sm text-slate-500 mt-1">نظرة شاملة ودقيقة على أداء محلك التجاري.</p>
          </div>
          <div className="flex items-center gap-2 bg-white p-1 rounded-lg shadow-sm mt-4 md:mt-0">
              <button onClick={() => setDateRange('7')} className={`px-3 py-1 rounded-md text-sm font-semibold ${dateRange === '7' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}>آخر 7 أيام</button>
              <button onClick={() => setDateRange('30')} className={`px-3 py-1 rounded-md text-sm font-semibold ${dateRange === '30' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}>آخر 30 يوم</button>
              <button onClick={() => setDateRange('all')} className={`px-3 py-1 rounded-md text-sm font-semibold ${dateRange === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}>كل الأوقات</button>
          </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-6">
        <StatCard title="صافي المبيعات" value={`${netSales.toFixed(2)}`} icon="monitoring" valueClassName="text-indigo-600" subtext={dateRangeText} />
        <StatCard title="إجمالي الربح" value={`${grossProfit.toFixed(2)}`} icon="account_balance" valueClassName="text-sky-600" subtext={dateRangeText} />
        <StatCard title="المصروفات" value={`${totalExpenses.toFixed(2)}`} icon="receipt_long" valueClassName="text-red-500" subtext={dateRangeText} />
        <StatCard title="صافي الربح" value={`${netProfit.toFixed(2)}`} icon="trending_up" valueClassName={netProfit >= 0 ? 'text-green-600' : 'text-red-600'} subtext={dateRangeText}/>
        <StatCard title="العملاء" value={customers.length} icon="groups" valueClassName="text-fuchsia-600" subtext="الإجمالي" />
        <StatCard title="طلبات معلقة" value={pendingOrders} icon="pending_actions" valueClassName="text-orange-600" subtext="شحن/حجز" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-lg h-96">
            <h3 className="text-xl font-bold text-slate-800 mb-4">الأرباح والمصروفات ({dateRangeText})</h3>
            <div className="relative h-72"><canvas ref={profitExpenseChartRef}></canvas></div>
          </div>
          <div className="lg:col-span-2">
             <InfoListCard title="تنبيهات المخزون" icon="notification_important">
                 {lowStockProducts.length > 0 ? lowStockProducts.map(p => (
                     <div key={p.id} className="flex justify-between items-center p-2 rounded-md hover:bg-slate-50">
                         <span>{p.name}</span>
                         <span className="font-bold text-red-600">الكمية: {p.quantity}</span>
                     </div>
                 )) : <p className="text-slate-500 p-2">لا يوجد كتب على وشك النفاذ حالياً.</p>}
             </InfoListCard>
          </div>
           <div className="lg:col-span-1">
             <InfoListCard title="آخر المبيعات" icon="receipt_long">
                 {recentSales.map(inv => (
                     <div key={inv.id} className="flex justify-between items-center p-2 rounded-md hover:bg-slate-50">
                         <div>
                            <p className="font-semibold">{inv.customerInfo?.name || "بيع مباشر"}</p>
                            <p className="text-xs text-slate-400">{new Date(inv.date).toLocaleDateString()}</p>
                         </div>
                         <span className="font-bold text-green-600">{inv.total.toFixed(2)}</span>
                     </div>
                 ))}
             </InfoListCard>
          </div>
      </div>
    </div>
  );
};

export default DashboardView;
