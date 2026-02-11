import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, DollarSign, Wallet, AlertTriangle, Calendar, User, FileDown, Download, CheckCircle, Clock, Package } from 'lucide-react';
import { Sale, Product, PaymentStatus } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DashboardProps {
  sales: Sale[];
  products: Product[];
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

export const Dashboard: React.FC<DashboardProps> = ({ sales, products, showToast }) => {

  // --- Export Functions ---
  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      const dateStr = new Date().toLocaleDateString('pt-BR');
      
      // Header
      doc.setFontSize(20);
      doc.setTextColor(16, 185, 129); // Emerald-500
      doc.text('Relatório Financeiro - Kelvin', 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Gerado em: ${dateStr}`, 14, 30);
      
      // Metrics Section
      const totalRevenue = sales.reduce((acc, s) => acc + s.totalPrice, 0);
      const totalCost = sales.reduce((acc, s) => acc + s.totalCost, 0);
      const netProfit = totalRevenue - totalCost;
      
      autoTable(doc, {
        startY: 40,
        head: [['Métrica', 'Valor']],
        body: [
          ['Receita Total', `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
          ['Custo Total', `R$ ${totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
          ['Lucro Líquido', `R$ ${netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
          ['Margem de Lucro', `${totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : 0}%`],
        ],
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] }
      });

      // Sales Table
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text('Detalhamento de Vendas', 14, (doc as any).lastAutoTable.finalY + 15);

      const salesData = sales.map(s => [
        new Date(s.date).toLocaleDateString('pt-BR'),
        s.customerName || 'N/A',
        s.type === 'COMMISSION' ? 'Comissão' : 'Venda',
        `R$ ${s.totalPrice.toFixed(2)}`,
        s.status === PaymentStatus.PAID ? 'Pago' : 'Pendente'
      ]);

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Data', 'Cliente', 'Tipo', 'Total', 'Status']],
        body: salesData,
        theme: 'grid',
        headStyles: { fillColor: [51, 65, 85] }
      });

      doc.save(`relatorio-financeiro-${dateStr.replace(/\//g, '-')}.pdf`);
      showToast('success', 'PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      showToast('error', 'Erro ao gerar PDF');
    }
  };

  const exportToCSV = () => {
    try {
      const headers = ['Data', 'Cliente', 'Tipo', 'Total (R$)', 'Custo (R$)', 'Lucro (R$)', 'Status'];
      const rows = sales.map(s => [
        new Date(s.date).toLocaleDateString('pt-BR'),
        s.customerName || '',
        s.type,
        s.totalPrice.toFixed(2),
        s.totalCost.toFixed(2),
        s.totalProfit.toFixed(2),
        s.status
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      const dateStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
      
      link.setAttribute('href', url);
      link.setAttribute('download', `vendas-kelvin-${dateStr}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast('success', 'CSV exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      showToast('error', 'Erro ao exportar CSV');
    }
  };
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate.getMonth() === selectedMonth && saleDate.getFullYear() === selectedYear;
    });
  }, [sales, selectedMonth, selectedYear]);

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const availableYears = useMemo(() => {
    const years = new Set<number>([new Date().getFullYear()]);
    sales.forEach(sale => years.add(new Date(sale.date).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [sales]);

  // --- Metrics Calculation ---
  const totalStockCost = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.cost * p.stock), 0);
  }, [products]);

  const metrics = useMemo(() => {
    const totalRevenue = filteredSales.reduce((acc, sale) => acc + sale.totalPrice, 0);
    const totalCost = filteredSales.reduce((acc, sale) => acc + sale.totalCost, 0);
    const netProfit = totalRevenue - totalCost;
    const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    
    // Calculate REAL RECEIVED amount in THIS specific filtered month
    // We need to look at down payments OR paid installments that occurred in this month
    const receivedMonth = filteredSales.reduce((acc, s) => {
      let amount = 0;
      
      // If sale date is in this month, add downpayment
      const saleDate = new Date(s.date);
      if (saleDate.getMonth() === selectedMonth && saleDate.getFullYear() === selectedYear) {
        amount += (s.downPayment || 0);
      }

      // If it's fully PAID and in this month, and no custom installments (simple sale)
      if (s.status === PaymentStatus.PAID && !s.customInstallments && saleDate.getMonth() === selectedMonth && saleDate.getFullYear() === selectedYear) {
        amount += (s.totalPrice - (s.downPayment || 0));
      }

      // Check custom installments paid in this month
      if (s.customInstallments) {
        s.customInstallments.forEach(inst => {
          if (inst.status === PaymentStatus.PAID && inst.paidAt) {
            const paidDate = new Date(inst.paidAt);
            if (paidDate.getMonth() === selectedMonth && paidDate.getFullYear() === selectedYear) {
              amount += inst.value;
            }
          }
        });
      }

      return acc + amount;
    }, 0);

    
    const profitMonth = filteredSales.reduce((acc, s) => acc + s.totalProfit, 0);

    // Calculate PENDING amount ONLY for the SELECTED month
    const pendingMonth = sales.reduce((acc, s) => {
      let amount = 0;
      if (s.customInstallments && s.customInstallments.length > 0) {
        s.customInstallments.forEach(inst => {
          if (inst.status !== PaymentStatus.PAID) {
            const dueDate = new Date(inst.dueDate);
            if (dueDate.getMonth() === selectedMonth && dueDate.getFullYear() === selectedYear) {
              amount += inst.value;
            }
          }
        });
      } else if (s.dueDate) {
        const totalToInstall = s.totalPrice - (s.downPayment || 0);
        const installmentsCount = s.installments || 1;
        const installmentValue = totalToInstall / installmentsCount;
        const baseDate = new Date(s.dueDate);
        for (let i = 0; i < installmentsCount; i++) {
          if ((s.paidInstallments || 0) <= i) {
            const instDate = new Date(baseDate);
            instDate.setMonth(instDate.getMonth() + i);
            if (instDate.getMonth() === selectedMonth && instDate.getFullYear() === selectedYear) {
              amount += installmentValue;
            }
          }
        }
      }
      return acc + amount;
    }, 0);
    
    // Calculate pending/overdue sales (Keeping this GLOBAL for visibility)
    const now = Date.now();
    const pendingSales = sales.filter(s => s.status === PaymentStatus.PENDING);
    const pendingTotal = pendingSales.reduce((acc, s) => {
        const totalToInstall = s.totalPrice - (s.downPayment || 0);
        const installmentValue = totalToInstall / (s.installments || 1);
        const paidAmount = installmentValue * (s.paidInstallments || 0);
        const remaining = totalToInstall - paidAmount;
        
        return acc + remaining;
    }, 0);

    // Advanced Alert Logic: Expand Sales into Installments
    let allPendingInstallments: Array<{
      id: string; // Sale ID + Installment Number
      saleId: string;
      customerName: string;
      installmentNumber: number;
      totalInstallments: number;
      value: number;
      dueDate: number;
    }> = [];

    pendingSales.forEach(sale => {
      // Prioritize custom installments if they exist
      if (sale.customInstallments && sale.customInstallments.length > 0) {
        sale.customInstallments.forEach(inst => {
          if (inst.status !== PaymentStatus.PAID) {
            allPendingInstallments.push({
              id: inst.id,
              saleId: sale.id,
              customerName: sale.customerName || 'Cliente',
              installmentNumber: inst.number,
              totalInstallments: sale.installments,
              value: inst.value,
              dueDate: inst.dueDate
            });
          }
        });
        return;
      }

      // Fallback to automatic calculation
      if (!sale.dueDate) return;
      const totalToInstall = sale.totalPrice - (sale.downPayment || 0);
      const installments = sale.installments || 1;
      const installmentValue = totalToInstall / installments;
      const baseDate = new Date(sale.dueDate);

      for (let i = 0; i < installments; i++) {
        if ((sale.paidInstallments || 0) > i) continue;
        const date = new Date(baseDate);
        date.setMonth(date.getMonth() + i);
        allPendingInstallments.push({
          id: `${sale.id}-${i+1}`,
          saleId: sale.id,
          customerName: sale.customerName || 'Cliente',
          installmentNumber: i + 1,
          totalInstallments: installments,
          value: installmentValue,
          dueDate: date.getTime()
        });
      }
    });

    const overdueInstallments = allPendingInstallments.filter(i => i.dueDate < now);
    const upcomingInstallments = allPendingInstallments.filter(i => i.dueDate >= now && i.dueDate <= now + (7 * 24 * 60 * 60 * 1000));

    const alerts = [...overdueInstallments, ...upcomingInstallments].sort((a,b) => a.dueDate - b.dueDate);

    return { totalRevenue, totalCost, netProfit, margin, alerts, pendingTotal, receivedMonth, profitMonth, pendingMonth };
  }, [sales, selectedMonth, selectedYear]);

  // --- Date Helpers ---
  const getDaysDiff = (dueDate: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dueDate);
    target.setHours(0, 0, 0, 0);
    
    const diffTime = target.getTime() - today.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  };

  // --- Charts Data ---
  const salesByDate = useMemo(() => {
    const grouped: Record<string, any> = {};
    const sortedSales = [...filteredSales].sort((a, b) => a.date - b.date);
    
    sortedSales.forEach(sale => {
      const date = new Date(sale.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (!grouped[date]) grouped[date] = { date, revenue: 0, profit: 0 };
      grouped[date].revenue += sale.totalPrice;
      grouped[date].profit += sale.totalProfit;
    });
    return Object.values(grouped); 
  }, [filteredSales]);

  const salesByCategory = useMemo(() => {
    const grouped: Record<string, number> = {};
    
    filteredSales.forEach(sale => {
      if (sale.type === 'COMMISSION') {
        const cat = 'Comissões';
        grouped[cat] = (grouped[cat] || 0) + sale.totalProfit;
      } else {
        sale.items.forEach(item => {
          const product = products.find(p => p.id === item.productId);
          const cat = product ? product.category : 'Outros';
          const itemProfit = item.totalPrice - item.totalCost;
          grouped[cat] = (grouped[cat] || 0) + itemProfit;
        });
      }
    });

    return Object.keys(grouped)
      .map(name => ({ name, value: grouped[name] }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value); 
  }, [sales, products]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      
      {/* Header & Filters */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6 w-full xl:w-auto">
          <div>
            <h2 className="text-3xl font-bold text-slate-100 drop-shadow-lg">Painel de Controle</h2>
            <p className="text-slate-400">Desempenho de {months[selectedMonth]} de {selectedYear}</p>
          </div>
          
          <div className="flex items-center gap-3 bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800 backdrop-blur-sm self-start">
             <select 
               value={selectedMonth} 
               onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
               className="bg-transparent text-slate-200 text-sm font-bold px-3 py-1.5 focus:outline-none cursor-pointer hover:text-emerald-400 transition-colors"
             >
               {months.map((m, i) => (
                 <option key={m} value={i} className="bg-slate-900">{m}</option>
               ))}
             </select>
             <div className="w-[1px] h-6 bg-slate-800"></div>
             <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="bg-transparent text-slate-200 text-sm font-bold px-3 py-1.5 focus:outline-none cursor-pointer hover:text-emerald-400 transition-colors"
             >
               {availableYears.map(y => (
                 <option key={y} value={y} className="bg-slate-900">{y}</option>
               ))}
             </select>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <button 
            onClick={exportToPDF}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-all shadow-lg active:scale-95"
          >
            <FileDown size={18} className="text-rose-400" />
            <span>Exportar PDF</span>
          </button>
          
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-all shadow-lg active:scale-95"
          >
            <Download size={18} className="text-emerald-400" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Alerts Section - 3D Look */}
      {metrics.alerts.length > 0 && (
         <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-black border-t border-l border-slate-700/50 shadow-[0_10px_40px_-10px_rgba(225,29,72,0.3)] rounded-3xl p-6 relative overflow-hidden animate-fade-in-up transform transition-all hover:-translate-y-1">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-rose-500 to-rose-900"></div>
            <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
              <div className="p-2 bg-rose-500/20 rounded-lg shadow-inner shadow-rose-500/10">
                 <AlertTriangle className="text-rose-500" size={20} />
              </div>
              Próximos Vencimentos & Atrasos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-64 overflow-y-auto custom-scrollbar pr-2">
               {metrics.alerts.map(inst => {
                 const daysDiff = getDaysDiff(inst.dueDate);
                 const isOverdue = daysDiff < 0;
                 
                 return (
                   <div key={inst.id} className={`p-4 rounded-xl border border-slate-700/50 flex justify-between items-center transition-all duration-300 hover:scale-[1.02] hover:shadow-lg relative overflow-hidden group ${
                     isOverdue ? 'bg-gradient-to-br from-rose-950/40 to-slate-900' : 'bg-gradient-to-br from-amber-950/40 to-slate-900'
                   }`}>
                      {/* Glossy effect */}
                      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                      
                      <div>
                        <div className="flex items-center gap-2 text-slate-200 font-bold mb-1">
                          <User size={16} className="text-slate-500" />
                          {inst.customerName}
                        </div>
                        <p className="text-xl font-bold text-slate-100 drop-shadow-md">R$ {inst.value.toFixed(2)}</p>
                        <p className="text-xs text-slate-400 mt-1">Parcela {inst.installmentNumber}/{inst.totalInstallments}</p>
                      </div>
                      <div className="text-right z-10">
                        <div className={`text-[10px] font-black px-2 py-1 rounded-md mb-1 inline-block shadow-lg ${isOverdue ? 'bg-rose-600 text-white shadow-rose-900/50' : 'bg-amber-500 text-black shadow-amber-900/50'}`}>
                          {isOverdue ? `ATRASADO ${Math.abs(daysDiff)} DIA(S)` : `VENCE EM ${daysDiff} DIA(S)`}
                        </div>
                        <p className="text-slate-500 text-xs">{new Date(inst.dueDate).toLocaleDateString('pt-BR')}</p>
                      </div>
                   </div>
                 )
               })}
            </div>
         </div>
      )}

      {/* KPI Cards - 3D ANIMATED */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
        {/* Received Month Card */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-950 p-6 rounded-3xl border-t border-l border-white/10 shadow-2xl relative overflow-hidden group transition-all duration-500 hover:-translate-y-2 hover:shadow-emerald-500/10">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 group-hover:rotate-12 duration-500">
            <CheckCircle size={80} className="text-emerald-500" />
          </div>
          <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">Total Recebido (Mês)</p>
          <h3 className="text-2xl md:text-3xl font-black text-emerald-400 mt-2 drop-shadow-sm">
            R$ {metrics.receivedMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <div className="mt-4 flex items-center text-[10px] text-emerald-300 font-bold bg-emerald-500/10 w-fit px-2 py-1 rounded border border-emerald-500/20">
            DINHEIRO NO BOLSO
          </div>
        </div>

        {/* Profit Month Card */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-950 p-6 rounded-3xl border-t border-l border-white/10 shadow-2xl relative overflow-hidden group transition-all duration-500 hover:-translate-y-2 hover:shadow-cyan-500/10">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 group-hover:rotate-12 duration-500">
            <TrendingUp size={80} className="text-cyan-500" />
          </div>
          <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">Lucro do Mês</p>
          <h3 className={`text-2xl md:text-3xl font-black mt-2 drop-shadow-sm ${metrics.profitMonth >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
            R$ {metrics.profitMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <p className="mt-4 text-[10px] text-slate-500 font-bold">MARGEM: {metrics.margin.toFixed(1)}%</p>
        </div>

        {/* Pending Card */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-950 p-6 rounded-3xl border-t border-l border-white/10 shadow-2xl relative overflow-hidden group transition-all duration-500 hover:-translate-y-2 hover:shadow-amber-500/10">
           <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 group-hover:rotate-12 duration-500">
            <Clock size={80} className="text-amber-500" />
          </div>
          <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">A Receber (Mês)</p>
          <h3 className="text-2xl md:text-3xl font-black text-amber-400 mt-2 drop-shadow-sm">
            R$ {metrics.pendingMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <div className="mt-4 text-[10px] text-slate-500 font-bold">
             DÉBITO PENDENTE
          </div>
        </div>

        {/* Total Overall Pending Card */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-950 p-6 rounded-3xl border-t border-l border-white/10 shadow-2xl relative overflow-hidden group transition-all duration-500 hover:-translate-y-2 hover:shadow-rose-500/10">
           <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 group-hover:rotate-12 duration-500">
            <DollarSign size={80} className="text-rose-500" />
          </div>
          <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">Total devedor</p>
          <h3 className="text-2xl md:text-3xl font-black text-rose-400 mt-2 drop-shadow-sm">
            R$ {metrics.pendingTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <div className="mt-4 flex items-center text-[10px] text-slate-500 font-bold">
             GERAL ACUMULADO
          </div>
        </div>

        {/* Total Stock Investment Card */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-950 p-6 rounded-3xl border-t border-l border-white/10 shadow-2xl relative overflow-hidden group transition-all duration-500 hover:-translate-y-2 hover:shadow-blue-500/10">
           <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 group-hover:rotate-12 duration-500">
            <Package size={80} className="text-blue-500" />
          </div>
          <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">Investimento Total (Mês)</p>
          <h3 className="text-2xl md:text-3xl font-black text-blue-400 mt-2 drop-shadow-sm">
            R$ {(totalStockCost + metrics.totalCost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <div className="mt-4 flex items-center text-[10px] text-slate-500 font-bold">
             VENDIDOS + ESTOQUE
          </div>
        </div>
      </div>

      {/* Charts Section - 3D Containers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gradient-to-br from-slate-900 to-black p-6 rounded-3xl border border-slate-800 shadow-2xl relative">
          {/* Top highlight for 3D effect */}
          <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-slate-600 to-transparent opacity-50"></div>
          
          <h3 className="text-lg font-bold text-slate-100 mb-6 drop-shadow-md">Tendência de Receita e Lucro</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByDate}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                <Tooltip 
                  cursor={{fill: '#1e293b', opacity: 0.4}}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                  itemStyle={{ color: '#f1f5f9' }}
                  formatter={(value: number) => [`R$ ${value.toFixed(2)}`]}
                />
                <Bar dataKey="revenue" fill="url(#colorRevenue)" radius={[6, 6, 0, 0]} name="Receita" />
                <Bar dataKey="profit" fill="url(#colorProfit)" radius={[6, 6, 0, 0]} name="Lucro" />
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-black p-6 rounded-3xl border border-slate-800 shadow-2xl relative">
          <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-slate-600 to-transparent opacity-50"></div>
          
          <h3 className="text-lg font-bold text-slate-100 mb-6 drop-shadow-md">Lucro por Categoria</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={salesByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {salesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} style={{filter: 'drop-shadow(0px 3px 3px rgba(0,0,0,0.3))'}} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                   formatter={(value: number) => [`R$ ${value.toFixed(2)}`]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {salesByCategory.map((entry, index) => (
                <div key={index} className="flex items-center text-xs text-slate-400 bg-slate-800/50 px-2 py-1 rounded-full border border-slate-700/50">
                  <span className="w-2 h-2 rounded-full mr-1 shadow-[0_0_5px]" style={{ backgroundColor: COLORS[index % COLORS.length], boxShadow: `0 0 8px ${COLORS[index % COLORS.length]}` }}></span>
                  {entry.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};