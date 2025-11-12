import React, { useMemo, useState, useEffect, useRef } from 'react';
import type { Invoice, Product, Expense } from '../types';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const ReportsView: React.FC<{
  invoices: Invoice[];
  products: Product[];
  expenses: Expense[];
}> = ({ invoices, products, expenses }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const salesByCategoryChartRef = useRef<HTMLCanvasElement>(null);
  const topProductsChartRef = useRef<HTMLCanvasElement>(null);
  const profitExpenseChartRef = useRef<HTMLCanvasElement>(null);

  const chartInstances = useRef<{ [key: string]: Chart | null }>({});

  const reportData = useMemo(() => {
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (start) start.setHours(0, 0, 0, 0);
    if (end) end.setHours(23, 59, 59, 999);

    const dateFilter = (itemDateStr: string) => {
        const itemDate = new Date(itemDateStr);
        if (start && itemDate < start) return false;
        if (end && itemDate > end) return false;
        return true;
    };
    
    const completedSales = invoices.filter(inv => 
        ((inv.type === 'sale' || inv.type === 'shipping') && inv.status === 'completed' && inv.paymentStatus === 'paid') && inv.paidDate && dateFilter(inv.paidDate)
    );

    const returns = invoices.filter(inv => inv.type === 'return' && dateFilter(inv.date));
    const filteredExpenses = expenses.filter(exp => dateFilter(exp.date));

    const totalSalesValue = completedSales.reduce((sum, inv) => sum + inv.total, 0);
    const totalReturnsValue = returns.reduce((sum, inv) => sum + inv.total, 0); // Note: total is negative
    const netSales = totalSalesValue + totalReturnsValue;

    const cogs = completedSales.reduce((sum, inv) => sum + (inv.totalCost || 0), 0);
    const grossProfit = netSales - cogs;
    
    const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const netProfit = grossProfit - totalExpenses;

    const transactionCount = completedSales.length;
    const avgTransactionValue = transactionCount > 0 ? netSales / transactionCount : 0;

    // Chart Data
    const salesByCategory: { [key: string]: number } = {};
    const productSales: { [key: string]: { name: string, revenue: number } } = {};
    completedSales.forEach(inv => {
        inv.items.forEach(item => {
            const product = products.find(p => p.id === item.productId);
            const category = product?.category || 'غير مصنف';
            const revenue = item.quantity * (item.price - (item.discount || 0));
            
            salesByCategory[category] = (salesByCategory[category] || 0) + revenue;
            
            if (!productSales[item.productId]) {
              productSales[item.productId] = { name: item.productName, revenue: 0 };
            }
            productSales[item.productId].revenue += revenue;
        });
    });
    
    const topProducts = Object.values(productSales).sort((a,b) => b.revenue - a.revenue).slice(0, 5);

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
        netSales, cogs, grossProfit, totalExpenses, netProfit, transactionCount, avgTransactionValue,
        chartData: { salesByCategory, topProducts, dailyData }
    };
  }, [invoices, expenses, products, startDate, endDate]);

  useEffect(() => {
    // FIX: Using Object.keys to iterate and destroy charts to ensure proper type inference.
    Object.keys(chartInstances.current).forEach(key => chartInstances.current[key]?.destroy());
    
    const createChart = (ref: React.RefObject<HTMLCanvasElement>, key: string, config: any) => {
        const ctx = ref.current?.getContext('2d');
        if (ctx) chartInstances.current[key] = new Chart(ctx, config);
    };

    // Sales by Category Chart
    createChart(salesByCategoryChartRef, 'salesByCategory', {
      type: 'doughnut',
      data: {
        labels: Object.keys(reportData.chartData.salesByCategory),
        datasets: [{
          data: Object.values(reportData.chartData.salesByCategory),
          backgroundColor: ['#4f46e5', '#10b981', '#f59e0b', '#3b82f6', '#ef4444'],
        }],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });

    // Top Products Chart
    createChart(topProductsChartRef, 'topProducts', {
      type: 'bar',
      data: {
        labels: reportData.chartData.topProducts.map(p => p.name),
        datasets: [{
          label: 'الإيرادات',
          data: reportData.chartData.topProducts.map(p => p.revenue),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderRadius: 4
        }],
      },
      options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y' }
    });

    // Profit vs Expense Chart
    const sortedDays = Object.keys(reportData.chartData.dailyData).sort();
    createChart(profitExpenseChartRef, 'profitExpense', {
      type: 'line',
      data: {
        labels: sortedDays,
        datasets: [
          {
            label: 'إجمالي الربح',
            data: sortedDays.map(day => reportData.chartData.dailyData[day].profit),
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            fill: true,
            tension: 0.3,
          },
          {
            label: 'المصروفات',
            data: sortedDays.map(day => reportData.chartData.dailyData[day].expense),
            borderColor: 'rgb(239, 68, 68)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            fill: true,
            tension: 0.3,
          }
        ],
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
    
    return () => {
      // FIX: Using Object.keys to iterate and destroy charts to ensure proper type inference.
      Object.keys(chartInstances.current).forEach(key => chartInstances.current[key]?.destroy());
    }
  }, [reportData]);

  const StatCard = ({ title, value, icon, valueClassName }: { title: string, value: string | number, icon: string, valueClassName?: string }) => (
    <div className="bg-white p-4 rounded-xl shadow-lg flex items-center gap-4">
        <div className={`p-3 rounded-full ${valueClassName} bg-opacity-10`}>
            <span className={`material-symbols-outlined text-3xl ${valueClassName}`}>{icon}</span>
        </div>
        <div>
            <h3 className="text-slate-500 text-sm">{title}</h3>
            <p className={`text-xl font-bold ${valueClassName || 'text-slate-800'}`}>{value}</p>
        </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="bg-white shadow-lg rounded-xl mb-6">
        <div className="p-6 border-b border-slate-200">
            <h2 className="text-2xl font-bold text-slate-800">التقارير ولوحة التحكم</h2>
            <p className="text-sm text-slate-500 mt-1">نظرة شاملة ودقيقة على أداء محلك التجاري.</p>
        </div>
        <div className="p-6 flex flex-col md:flex-row gap-4 items-center">
            <InputField label="من تاريخ" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            <InputField label="إلى تاريخ" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-6">
        <StatCard title="صافي المبيعات" value={`${reportData.netSales.toFixed(2)}`} icon="monitoring" valueClassName="text-indigo-600" />
        <StatCard title="تكلفة البضاعة المباعة" value={`${reportData.cogs.toFixed(2)}`} icon="sell" valueClassName="text-orange-600" />
        <StatCard title="إجمالي الربح" value={`${reportData.grossProfit.toFixed(2)}`} icon="account_balance" valueClassName="text-sky-600" />
        <StatCard title="المصروفات" value={`${reportData.totalExpenses.toFixed(2)}`} icon="receipt_long" valueClassName="text-red-500" />
        <StatCard title="صافي الربح" value={`${reportData.netProfit.toFixed(2)}`} icon="trending_up" valueClassName={reportData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}/>
        <StatCard title="متوسط الفاتورة" value={`${reportData.avgTransactionValue.toFixed(2)}`} icon="payments" valueClassName="text-fuchsia-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-lg h-96">
            <h3 className="text-xl font-bold text-slate-800 mb-4">إجمالي الربح والمصروفات خلال الفترة</h3>
            <div className="relative h-72"><canvas ref={profitExpenseChartRef}></canvas></div>
          </div>
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg h-96">
            <h3 className="text-xl font-bold text-slate-800 mb-4">أعلى 5 كتب مبيعاً (حسب الإيراد)</h3>
            <div className="relative h-72"><canvas ref={topProductsChartRef}></canvas></div>
          </div>
          <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg h-96">
            <h3 className="text-xl font-bold text-slate-800 mb-4">المبيعات حسب التصنيف</h3>
             <div className="relative h-72"><canvas ref={salesByCategoryChartRef}></canvas></div>
          </div>
      </div>
    </div>
  );
};

const InputField: React.FC<{label: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, type?: string}> = ({label, value, onChange, type="text"}) => (
    <div className="flex-1 w-full">
        <label className="block text-sm font-medium text-slate-700">{label}</label>
        <input type={type} value={value} onChange={onChange} className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"/>
    </div>
);


export default ReportsView;