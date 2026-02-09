import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Search, CheckCircle, Clock, ShoppingCart, AlertCircle, 
  Calendar, Filter, X, ChevronDown, ChevronUp, DollarSign, 
  Edit2, Briefcase, FileText, Printer, TrendingUp, Wallet, AlertTriangle
} from 'lucide-react';
import { Sale, Product, Customer, PaymentMethod, SaleItem, PaymentStatus, SaleType } from '../types';
import { PAYMENT_METHODS } from '../constants';

interface SalesProps {
  sales: Sale[];
  products: Product[];
  customers: Customer[];
  onAddSale: (sale: any) => void;
  onUpdateSale: (id: string, sale: Partial<Sale>) => void;
  onToggleStatus: (id: string) => void;
  onPayInstallment: (id: string) => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

// --- Subcomponents ---

const SummaryCard = ({ title, value, subtext, icon: Icon, colorClass, bgClass, shadowColor }: any) => (
  <div className={`bg-gradient-to-br from-slate-800 to-slate-950 border-t border-l border-slate-700/50 p-5 rounded-3xl flex items-start justify-between shadow-[0_15px_30px_-10px_rgba(0,0,0,0.5)] relative overflow-hidden group transition-all duration-300 hover:scale-[1.03] hover:-translate-y-2 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)] ${shadowColor}`}>
    <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-15 transition-opacity transform group-hover:scale-125 group-hover:rotate-12 duration-500 ${colorClass}`}>
      <Icon size={70} />
    </div>
    <div className="z-10">
      <p className="text-slate-400 text-sm font-medium mb-1 tracking-wide">{title}</p>
      <h3 className={`text-2xl font-extrabold ${colorClass} drop-shadow-sm`}>{value}</h3>
      {subtext && <p className="text-xs text-slate-500 mt-1 font-medium">{subtext}</p>}
    </div>
    <div className={`p-3 rounded-2xl ${bgClass} ${colorClass} shadow-inner group-hover:scale-110 transition-transform duration-300`}>
      <Icon size={24} />
    </div>
  </div>
);

const ReceiptModal = ({ sale, onClose }: { sale: Sale; onClose: () => void }) => {
  const subtotal = sale.totalPrice;
  const discount = 0; // Future proofing
  const total = subtotal - discount;

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white text-slate-900 w-full max-w-md rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 transform-gpu">
        <div className="bg-slate-100 p-4 border-b border-slate-200 flex justify-between items-center print:hidden">
          <h3 className="font-bold text-slate-700 flex items-center gap-2">
            <FileText size={18} /> Visualizar Recibo
          </h3>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="p-2 hover:bg-slate-200 rounded-full text-slate-600" title="Imprimir">
              <Printer size={20} />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-600">
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="p-8 font-mono text-sm leading-relaxed" id="printable-receipt">
          <div className="text-center mb-6 border-b border-slate-300 pb-4">
            <div className="flex flex-col items-center mb-4">
              <img src="/logo.png" alt="Logo" className="w-16 h-16 object-contain mb-2" />
              <h2 className="text-xl font-bold uppercase tracking-wider mb-1">Financeiro Kelvin</h2>
              <p className="text-xs text-slate-500">Gestão Inteligente</p>
            </div>
            <p className="text-xs text-slate-400 mt-1">{new Date(sale.date).toLocaleString('pt-BR')}</p>
          </div>

          <div className="mb-6">
            <div className="flex justify-between mb-1">
              <span className="text-slate-500">Cliente:</span>
              <span className="font-bold uppercase">{sale.customerName || 'Consumidor Final'}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-slate-500">ID Venda:</span>
              <span>#{sale.id.slice(0, 8)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Pagamento:</span>
              <span>{sale.paymentMethod === 'CARD' ? 'Cartão' : sale.paymentMethod === 'PIX' ? 'PIX' : 'Dinheiro'}</span>
            </div>
          </div>

          <table className="w-full mb-6">
            <thead>
              <tr className="border-b border-slate-300 text-left">
                <th className="py-2">Item</th>
                <th className="py-2 text-right">Qtd</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sale.items.map((item, i) => (
                <tr key={i}>
                  <td className="py-2">{item.productName}</td>
                  <td className="py-2 text-right">x{item.quantity}</td>
                  <td className="py-2 text-right">R$ {item.totalPrice.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t-2 border-slate-800 pt-4 space-y-2">
            <div className="flex justify-between text-lg font-bold">
              <span>TOTAL</span>
              <span>R$ {total.toFixed(2)}</span>
            </div>
            {sale.downPayment && sale.downPayment > 0 ? (
               <div className="flex justify-between text-slate-500 text-xs">
                 <span>Entrada/Pago:</span>
                 <span>R$ {sale.downPayment.toFixed(2)}</span>
               </div>
            ) : null}
            {sale.installments > 1 && (
               <div className="text-right text-xs text-slate-500 mt-2">
                 Parcelado em {sale.installments}x
               </div>
            )}
          </div>

          <div className="mt-8 text-center text-xs text-slate-400">
            <p>Obrigado pela preferência!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---

export const Sales: React.FC<SalesProps> = ({ sales, products, customers, onAddSale, onUpdateSale, onToggleStatus, onPayInstallment, showToast }) => {
  // UI States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [receiptSale, setReceiptSale] = useState<Sale | null>(null);
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SaleType>('SALE'); // For New Sale Modal
  const [statusTab, setStatusTab] = useState<'ALL' | 'PENDING' | 'OVERDUE' | 'PAID'>('ALL'); // For Filter

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  
  // Date Edit State
  const [dateEditSale, setDateEditSale] = useState<Sale | null>(null);
  const [newDueDate, setNewDueDate] = useState('');

  // New Sale Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [cartItems, setCartItems] = useState<SaleItem[]>([]);
  const [currentProductId, setCurrentProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [installments, setInstallments] = useState<number>(1);
  const [downPayment, setDownPayment] = useState<number>(0); 
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [dueDate, setDueDate] = useState<string>('');
  const [status, setStatus] = useState<PaymentStatus>(PaymentStatus.PAID);
  
  // Commission Form State
  const [commissionDescription, setCommissionDescription] = useState('');
  const [commissionValue, setCommissionValue] = useState<string>('');

  // --- Effects ---
  useEffect(() => {
    const today = new Date();
    if (status === PaymentStatus.PENDING) {
       today.setDate(today.getDate() + 30);
    }
    setDueDate(today.toISOString().split('T')[0]);
  }, [status, isModalOpen]);

  // --- Helpers ---
  
  const getDueStatus = (sale: Sale) => {
    if (sale.status === PaymentStatus.PAID) return null;
    if (!sale.dueDate) return null;
    
    // Simple logic: check first unpaid installment date
    // (Replicating logic from previous code for consistency)
    const baseDate = new Date(sale.dueDate);
    let firstUnpaidDate = new Date(baseDate);
    
    // Find roughly the correct month for the next installment
    firstUnpaidDate.setMonth(baseDate.getMonth() + sale.paidInstallments);

    const now = Date.now();
    const diffTime = firstUnpaidDate.getTime() - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: 'ATRASADO', color: 'text-rose-400', bg: 'bg-rose-500/10', days: Math.abs(diffDays), isOverdue: true };
    if (diffDays <= 3) return { label: 'VENCE EM BREVE', color: 'text-amber-400', bg: 'bg-amber-500/10', days: diffDays, isOverdue: false };
    return { label: 'NO PRAZO', color: 'text-slate-400', bg: 'bg-slate-800', days: diffDays, isOverdue: false };
  };

  const generateDisplayInstallments = (sale: Sale) => {
    const parts = [];
    if (sale.downPayment && sale.downPayment > 0) {
       parts.push({
         number: 0, label: 'Entrada', date: new Date(sale.date), value: sale.downPayment,
         isOverdue: false, isPaid: true, isEntry: true, isNextToPay: false
       });
    }
    if (!sale.dueDate) return parts;
    const baseDate = new Date(sale.dueDate);
    const remaining = sale.totalPrice - (sale.downPayment || 0);
    const value = remaining / (sale.installments || 1);

    for (let i = 0; i < (sale.installments || 1); i++) {
       const date = new Date(baseDate);
       date.setMonth(date.getMonth() + i);
       const isPaid = (i + 1) <= sale.paidInstallments;
       const isNextToPay = (i + 1) === (sale.paidInstallments + 1);
       parts.push({ 
         number: i + 1, label: `Parcela ${i + 1}`, date: date, value: value,
         isOverdue: !isPaid && date.getTime() < Date.now(),
         isPaid, isEntry: false, isNextToPay
       });
    }
    return parts;
  };

  // --- Calculations & Filtering ---

  const summary = useMemo(() => {
    const today = new Date().setHours(0,0,0,0);
    const salesToday = sales.filter(s => new Date(s.date).setHours(0,0,0,0) === today);
    const revenueToday = salesToday.reduce((acc, s) => acc + s.totalPrice, 0);

    const pendingSales = sales.filter(s => s.status === PaymentStatus.PENDING);
    let totalPending = 0;
    let totalOverdue = 0;

    pendingSales.forEach(s => {
       const paidAmount = (s.downPayment || 0) + ((s.totalPrice - (s.downPayment || 0)) / s.installments) * s.paidInstallments;
       const remaining = s.totalPrice - paidAmount;
       totalPending += remaining;

       const status = getDueStatus(s);
       if (status?.isOverdue) {
         // Rough estimate of overdue amount (just the next installment or full remaining? let's do next installment)
         const installValue = (s.totalPrice - (s.downPayment || 0)) / s.installments;
         totalOverdue += installValue;
       }
    });

    return { revenueToday, totalPending, totalOverdue, countToday: salesToday.length };
  }, [sales]);

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      // Search Filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        (s.customerName || '').toLowerCase().includes(searchLower) || 
        s.items.some(i => i.productName.toLowerCase().includes(searchLower)) ||
        s.id.includes(searchTerm);
      
      if (!matchesSearch) return false;

      // Status Tab Filter
      if (statusTab === 'ALL') return true;
      if (statusTab === 'PAID') return s.status === PaymentStatus.PAID;
      
      const dueData = getDueStatus(s);
      if (statusTab === 'PENDING') return s.status === PaymentStatus.PENDING && !dueData?.isOverdue;
      if (statusTab === 'OVERDUE') return s.status === PaymentStatus.PENDING && dueData?.isOverdue;

      return true;
    }).sort((a, b) => b.date - a.date);
  }, [sales, searchTerm, statusTab]);

  const cartTotals = useMemo(() => {
    if (activeTab === 'COMMISSION') {
      const val = parseFloat(commissionValue) || 0;
      return { totalCost: 0, totalPrice: val, totalProfit: val };
    }
    const totalCost = cartItems.reduce((acc, item) => acc + item.totalCost, 0);
    const totalPrice = cartItems.reduce((acc, item) => acc + item.totalPrice, 0);
    const totalProfit = totalPrice - totalCost;
    return { totalCost, totalPrice, totalProfit };
  }, [cartItems, activeTab, commissionValue]);

  const installmentPlan = useMemo(() => {
    if (installments <= 0 || !dueDate || cartTotals.totalPrice === 0) return [];
    const actualDownPayment = Math.min(downPayment, cartTotals.totalPrice);
    const remainingAmount = cartTotals.totalPrice - actualDownPayment;
    if (remainingAmount <= 0) return [];

    const plans = [];
    const [y, m, d] = dueDate.split('-').map(Number);
    const valuePerInstallment = remainingAmount / installments;

    for (let i = 0; i < installments; i++) {
      const date = new Date(y, (m - 1) + i, d);
      plans.push({ number: i + 1, date: date, value: valuePerInstallment });
    }
    return plans;
  }, [installments, dueDate, cartTotals.totalPrice, downPayment]);


  // --- Actions ---

  const handleAddItem = () => {
    const product = products.find(p => p.id === currentProductId);
    if (!product) return;
    const newItem: SaleItem = {
      productId: product.id, productName: product.name, quantity,
      unitCost: product.cost, unitPrice: product.price,
      totalCost: product.cost * quantity, totalPrice: product.price * quantity,
    };
    setCartItems([...cartItems, newItem]);
    setCurrentProductId(''); setQuantity(1);
    showToast('info', 'Item adicionado');
  };

  const handleSubmitSale = () => {
    const customer = customers.find(c => c.id === selectedCustomerId);
    const dueTimestamp = dueDate ? new Date(dueDate).setHours(23, 59, 59, 999) : undefined;
    const finalDownPayment = Math.min(downPayment, cartTotals.totalPrice);
    
    let finalStatus = status;
    let finalInstallments = installments;
    if (finalDownPayment >= cartTotals.totalPrice) {
       finalStatus = PaymentStatus.PAID;
       finalInstallments = 1; 
    }

    let itemsToSave = cartItems;
    let customerName = customer ? customer.name : 'Cliente Balcão';

    if (activeTab === 'COMMISSION') {
      if (!commissionDescription || !commissionValue) {
        showToast('error', 'Preencha descrição e valor.');
        return;
      }
      const val = parseFloat(commissionValue);
      itemsToSave = [{
        productId: 'commission_ref', productName: commissionDescription, quantity: 1,
        unitCost: 0, unitPrice: val, totalCost: 0, totalPrice: val
      }];
      customerName = commissionDescription;
      if (selectedCustomerId && customer) customerName = customer.name;
    } else {
      if (cartItems.length === 0) return;
    }

    onAddSale({
      type: activeTab,
      customerId: selectedCustomerId || undefined,
      customerName, items: itemsToSave,
      paymentMethod, installments: finalInstallments,
      downPayment: finalDownPayment, isRecurring,
      status: finalStatus, dueDate: dueTimestamp
    });

    // Reset
    setCartItems([]); setSelectedCustomerId(''); setStatus(PaymentStatus.PAID);
    setInstallments(1); setDownPayment(0); setCommissionDescription(''); setCommissionValue('');
    setIsModalOpen(false);
  };

  const handleSaveNewDate = () => {
    if (!dateEditSale || !newDueDate) return;
    const [y, m, d] = newDueDate.split('-').map(Number);
    const newDateTs = new Date(y, m - 1, d, 23, 59, 59).getTime();
    onUpdateSale(dateEditSale.id, { dueDate: newDateTs });
    setDateEditSale(null); setNewDueDate('');
    showToast('success', 'Data atualizada.');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      
      {/* 1. Top Section with Summary Cards */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-100 drop-shadow-md">Gerenciamento de Vendas</h2>
            <p className="text-slate-400">Controle financeiro e cobranças</p>
          </div>
          <button 
            onClick={() => { setActiveTab('SALE'); setIsModalOpen(true); }}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-2xl flex items-center gap-2 shadow-[0_10px_20px_-5px_rgba(16,185,129,0.4)] font-bold transition-transform hover:scale-105 active:scale-95 border-t border-emerald-400"
          >
            <Plus size={20} /> Nova Venda
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SummaryCard 
            title="Vendas Hoje" 
            value={`R$ ${summary.revenueToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            subtext={`${summary.countToday} transações`}
            icon={TrendingUp} colorClass="text-emerald-400" bgClass="bg-emerald-500/10" shadowColor="hover:shadow-emerald-500/10"
          />
          <SummaryCard 
            title="A Receber (Total)" 
            value={`R$ ${summary.totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            subtext="Valores pendentes futuros"
            icon={Wallet} colorClass="text-blue-400" bgClass="bg-blue-500/10" shadowColor="hover:shadow-blue-500/10"
          />
          <SummaryCard 
            title="Em Atraso" 
            value={`R$ ${summary.totalOverdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            subtext="Parcelas vencidas"
            icon={AlertTriangle} colorClass="text-rose-400" bgClass="bg-rose-500/10" shadowColor="hover:shadow-rose-500/10"
          />
        </div>
      </div>

      {/* 2. Status Tabs & Search */}
      <div className="bg-slate-900/40 p-2 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-4 items-center shadow-lg backdrop-blur-sm">
         <div className="flex bg-slate-950 p-1.5 rounded-xl w-full md:w-auto overflow-x-auto shadow-inner border border-slate-800">
            {(['ALL', 'PENDING', 'OVERDUE', 'PAID'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setStatusTab(tab)}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                  statusTab === tab 
                    ? 'bg-slate-800 text-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.5)] border border-slate-700' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab === 'ALL' && 'Todas'}
                {tab === 'PENDING' && 'Pendentes'}
                {tab === 'OVERDUE' && 'Atrasadas'}
                {tab === 'PAID' && 'Pagas'}
              </button>
            ))}
         </div>
         <div className="relative flex-1 w-full group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Buscar cliente, produto ou valor..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all shadow-inner"
            />
         </div>
      </div>

      {/* 3. Sales List - 3D Items */}
      <div className="space-y-4">
        {filteredSales.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-3xl opacity-50">
            <Search size={48} className="mx-auto mb-4" />
            <p className="text-xl font-bold">Nenhum registro encontrado</p>
            <p className="text-sm">Tente mudar os filtros ou adicione uma nova venda.</p>
          </div>
        ) : (
          filteredSales.map(sale => {
            const dueData = getDueStatus(sale);
            const isExpanded = expandedSaleId === sale.id;
            const displayInstallments = isExpanded ? generateDisplayInstallments(sale) : [];
            const isCommission = sale.type === 'COMMISSION';

            return (
              <div key={sale.id} className="bg-gradient-to-r from-slate-900 to-slate-900 border border-slate-800/60 rounded-2xl overflow-hidden hover:border-slate-700 transition-all shadow-md hover:shadow-xl hover:shadow-black/40 group transform hover:-translate-y-1 duration-300">
                
                {/* 3D Highlight Edge */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-700 to-transparent opacity-50"></div>

                {/* Main Row */}
                <div className="p-5 flex flex-col md:flex-row items-center gap-6 relative z-10">
                   {/* Date & Icon */}
                   <div className="flex items-center gap-4 w-full md:w-auto">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0 shadow-lg ${
                        isCommission 
                            ? 'bg-gradient-to-br from-purple-500/20 to-purple-900/20 text-purple-400 border border-purple-500/30' 
                            : 'bg-gradient-to-br from-emerald-500/20 to-emerald-900/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {isCommission ? <Briefcase size={24} /> : <ShoppingCart size={24} />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-200 text-lg">{new Date(sale.date).toLocaleDateString('pt-BR')}</p>
                        <p className="text-xs text-slate-500 font-medium">{new Date(sale.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      </div>
                   </div>

                   {/* Customer Info */}
                   <div className="flex-1 w-full md:w-auto border-l border-slate-800 pl-0 md:pl-6 border-none md:border-solid">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 border border-slate-700 shadow-sm">
                          {sale.customerName ? sale.customerName.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-200 text-lg">{sale.customerName || 'Cliente Balcão'}</p>
                          <p className="text-xs text-slate-500 truncate max-w-[200px]">
                            {isCommission ? 'Comissão Externa' : `${sale.items.length} itens • ${sale.items[0]?.productName}${sale.items.length > 1 ? '...' : ''}`}
                          </p>
                        </div>
                      </div>
                   </div>

                   {/* Value & Status */}
                   <div className="flex flex-col md:items-end w-full md:w-auto gap-1">
                      <p className={`text-2xl font-black tracking-tight ${isCommission ? 'text-purple-400' : 'text-emerald-400'} drop-shadow-sm`}>
                        R$ {sale.totalPrice.toFixed(2)}
                      </p>
                      <div className="flex gap-2">
                        {sale.status === PaymentStatus.PAID ? (
                           <span className="text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-1 rounded flex items-center gap-1 shadow-sm">
                             <CheckCircle size={12} /> PAGO
                           </span>
                        ) : (
                          <span className={`text-xs font-bold px-2 py-1 rounded flex items-center gap-1 border shadow-sm ${dueData?.bg} ${dueData?.color} border-current border-opacity-20`}>
                             {dueData?.isOverdue ? <AlertTriangle size={12}/> : <Clock size={12}/>}
                             {dueData?.label}
                          </span>
                        )}
                        {sale.installments > 1 && (
                          <span className="text-xs bg-slate-800 border border-slate-700 text-slate-400 px-2 py-1 rounded font-medium">
                            {sale.paidInstallments}/{sale.installments}x
                          </span>
                        )}
                      </div>
                   </div>

                   {/* Actions */}
                   <div className="flex gap-2 w-full md:w-auto justify-end border-t border-slate-800 pt-4 md:pt-0 md:border-none">
                      <button 
                        onClick={() => setReceiptSale(sale)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        title="Ver Recibo"
                      >
                        <FileText size={20} />
                      </button>
                      
                      {sale.status === PaymentStatus.PENDING ? (
                        <button 
                          onClick={() => setExpandedSaleId(isExpanded ? null : sale.id)}
                          className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 shadow-sm"
                        >
                          {isExpanded ? 'Ocultar' : 'Pagar'} <ChevronDown size={16} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      ) : (
                        <button 
                           onClick={() => onToggleStatus(sale.id)}
                           className="text-slate-500 hover:text-slate-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                           Desmarcar
                        </button>
                      )}
                   </div>
                </div>

                {/* Expanded Details (Payments) */}
                {isExpanded && (
                   <div className="bg-slate-950/50 border-t border-slate-800 p-6 animate-in slide-in-from-top-2 shadow-inner">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-slate-300 flex items-center gap-2">
                          <Calendar size={16} /> Cronograma de Pagamentos
                        </h4>
                        <button 
                           onClick={() => { setDateEditSale(sale); setNewDueDate(new Date(sale.dueDate || Date.now()).toISOString().split('T')[0]); }}
                           className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
                        >
                          <Edit2 size={12} /> Editar Data Base
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                         {displayInstallments.map((inst, idx) => (
                           <div key={idx} className={`p-4 rounded-xl border relative shadow-md transition-transform hover:scale-105 ${
                             inst.isPaid ? 'border-emerald-500/20 bg-emerald-900/10' : 
                             inst.isOverdue ? 'border-rose-500/30 bg-rose-900/10' : 'border-slate-700 bg-slate-900'
                           }`}>
                              <div className="flex justify-between items-start mb-2">
                                <span className={`text-xs font-bold ${inst.isPaid ? 'text-emerald-400' : 'text-slate-400'}`}>
                                   {inst.label}
                                </span>
                                {inst.isPaid && <CheckCircle size={14} className="text-emerald-500" />}
                              </div>
                              <p className="text-lg font-bold text-slate-200">R$ {inst.value.toFixed(2)}</p>
                              <p className={`text-xs mt-1 ${inst.isOverdue ? 'text-rose-400 font-bold' : 'text-slate-500'}`}>
                                {inst.date.toLocaleDateString('pt-BR')}
                              </p>
                              
                              {inst.isNextToPay && !inst.isPaid && !inst.isEntry && (
                                <button 
                                  onClick={() => onPayInstallment(sale.id)}
                                  className="mt-3 w-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 border-t border-emerald-400"
                                >
                                  <DollarSign size={12} /> Pagar
                                </button>
                              )}
                           </div>
                         ))}
                      </div>
                   </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* --- Modals --- */}
      
      {receiptSale && <ReceiptModal sale={receiptSale} onClose={() => setReceiptSale(null)} />}

      {dateEditSale && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl">
             <h3 className="text-lg font-bold text-slate-100 mb-4">Alterar Vencimento</h3>
             <input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 mb-4 text-slate-100" />
             <div className="flex gap-2">
               <button onClick={() => setDateEditSale(null)} className="flex-1 py-2 bg-slate-800 rounded-lg text-slate-300">Cancelar</button>
               <button onClick={handleSaveNewDate} className="flex-1 py-2 bg-emerald-500 text-white rounded-lg">Salvar</button>
             </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
           <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200 overflow-hidden">
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                 <h3 className="text-xl font-bold text-slate-100">Registrar Nova Transação</h3>
                 <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X /></button>
              </div>

              {/* Tabs */}
              <div className="flex p-1 bg-slate-950 mx-6 mt-6 rounded-xl border border-slate-800">
                 <button onClick={() => setActiveTab('SALE')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'SALE' ? 'bg-slate-800 text-emerald-400 shadow-md border border-slate-700' : 'text-slate-500 hover:text-slate-300'}`}>Venda de Produtos</button>
                 <button onClick={() => setActiveTab('COMMISSION')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'COMMISSION' ? 'bg-slate-800 text-purple-400 shadow-md border border-slate-700' : 'text-slate-500 hover:text-slate-300'}`}>Comissão Externa</button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6">
                 {/* Product Sale Logic */}
                 {activeTab === 'SALE' && (
                    <div className="bg-slate-800/30 p-4 rounded-2xl border border-slate-700/50 shadow-inner">
                       <div className="flex gap-2 mb-4">
                          <select className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 outline-none focus:border-emerald-500 shadow-sm" value={currentProductId} onChange={(e) => setCurrentProductId(e.target.value)}>
                             <option value="">Selecione o Produto...</option>
                             {products.map(p => <option key={p.id} value={p.id}>{p.name} - R$ {p.price.toFixed(2)}</option>)}
                          </select>
                          <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="w-20 bg-slate-950 border border-slate-700 rounded-xl px-2 text-center text-slate-100 outline-none focus:border-emerald-500 shadow-sm" />
                          <button onClick={handleAddItem} disabled={!currentProductId} className="bg-emerald-500 text-white p-3 rounded-xl disabled:opacity-50 shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform"><Plus /></button>
                       </div>
                       <div className="space-y-2 max-h-32 overflow-y-auto">
                          {cartItems.map((item, idx) => (
                             <div key={idx} className="flex justify-between bg-slate-900 p-3 rounded-lg border border-slate-800 items-center shadow-sm">
                                <span className="text-sm text-slate-300">{item.quantity}x {item.productName}</span>
                                <span className="text-sm font-bold text-slate-100">R$ {item.totalPrice.toFixed(2)}</span>
                             </div>
                          ))}
                          {cartItems.length === 0 && <p className="text-center text-slate-600 text-sm py-2">Nenhum item adicionado</p>}
                       </div>
                    </div>
                 )}

                 {/* Commission Logic */}
                 {activeTab === 'COMMISSION' && (
                    <div className="bg-purple-900/10 p-4 rounded-2xl border border-purple-500/20 grid grid-cols-2 gap-4 shadow-inner">
                       <div className="col-span-2 md:col-span-1">
                          <label className="text-xs text-purple-300 font-bold mb-1 block">Descrição</label>
                          <input className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 outline-none focus:border-purple-500 shadow-sm" placeholder="Ex: Venda Shopee" value={commissionDescription} onChange={(e) => setCommissionDescription(e.target.value)} />
                       </div>
                       <div className="col-span-2 md:col-span-1">
                          <label className="text-xs text-purple-300 font-bold mb-1 block">Valor (R$)</label>
                          <input type="number" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 outline-none focus:border-purple-500 shadow-sm" placeholder="0.00" value={commissionValue} onChange={(e) => setCommissionValue(e.target.value)} />
                       </div>
                    </div>
                 )}

                 {/* Shared Details */}
                 <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 md:col-span-1">
                       <label className="text-xs text-slate-500 font-bold mb-1 block">Cliente</label>
                       <select className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-slate-100 outline-none focus:border-emerald-500 shadow-sm" value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)}>
                          <option value="">{activeTab === 'SALE' ? 'Cliente Balcão' : 'Sem vínculo'}</option>
                          {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                       </select>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                       <label className="text-xs text-slate-500 font-bold mb-1 block">Status</label>
                       <select className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-slate-100 outline-none focus:border-emerald-500 shadow-sm" value={status} onChange={(e) => setStatus(e.target.value as PaymentStatus)}>
                          <option value={PaymentStatus.PAID}>Pago (Recebido)</option>
                          <option value={PaymentStatus.PENDING}>Pendente (A Receber)</option>
                       </select>
                    </div>

                    {(status === PaymentStatus.PENDING || (activeTab === 'SALE' && paymentMethod === PaymentMethod.CARD)) && (
                       <div className="col-span-2 bg-slate-950 p-4 rounded-xl border border-slate-800 grid grid-cols-2 gap-4 shadow-inner">
                          <div>
                             <label className="text-xs text-slate-500 mb-1 block">Entrada (R$)</label>
                             <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-slate-100" value={downPayment} onChange={(e) => setDownPayment(Number(e.target.value))} />
                          </div>
                          <div>
                             <label className="text-xs text-slate-500 mb-1 block">Parcelas</label>
                             <select className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-slate-100" value={installments} onChange={(e) => setInstallments(Number(e.target.value))}>
                                {[1,2,3,4,5,6,7,8,9,10,12].map(i => <option key={i} value={i}>{i}x</option>)}
                             </select>
                          </div>
                          <div className="col-span-2">
                             <label className="text-xs text-slate-500 mb-1 block">Vencimento / 1ª Parcela</label>
                             <input type="date" className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-slate-100" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                          </div>
                       </div>
                    )}
                 </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-800 flex justify-between items-center bg-slate-900/50">
                 <div>
                    <p className="text-sm text-slate-500 font-medium">Total Final</p>
                    <p className={`text-2xl font-black ${activeTab === 'COMMISSION' ? 'text-purple-400' : 'text-emerald-400'} drop-shadow-sm`}>R$ {cartTotals.totalPrice.toFixed(2)}</p>
                 </div>
                 <button 
                    onClick={handleSubmitSale}
                    disabled={activeTab === 'SALE' ? cartItems.length === 0 : (!commissionDescription || !commissionValue)}
                    className={`${activeTab === 'SALE' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30' : 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/30'} text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95`}
                 >
                    Confirmar
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};