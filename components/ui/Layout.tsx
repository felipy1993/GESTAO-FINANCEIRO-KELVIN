import React, { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, ShoppingCart, Package, Users, LogOut, Menu, X, Bell, AlertTriangle, CheckCircle, CalendarDays, Maximize, Minimize } from 'lucide-react';
import { ViewState, Sale, PaymentStatus } from '../../types';
import { playNotificationSound } from './Toast';

interface LayoutProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  children: React.ReactNode;
  sales?: Sale[];
}

const NavItem = ({ 
  icon: Icon, 
  label, 
  active, 
  onClick 
}: { 
  icon: any, 
  label: string, 
  active: boolean, 
  onClick: () => void 
}) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl transition-all duration-200 group ${
      active 
        ? 'bg-emerald-500/10 text-emerald-400 font-medium shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
    }`}
  >
    <Icon size={20} className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
    <span>{label}</span>
  </button>
);

export const Layout: React.FC<LayoutProps> = ({ currentView, onNavigate, children, sales = [] }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [hasPlayedSound, setHasPlayedSound] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(e => {
        console.error(`Error attempting to enable full-screen mode: ${e.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Calculate Overdue Items
  const overdueItems = useMemo(() => {
    const now = Date.now();
    const items: Array<{
      saleId: string;
      customer: string;
      amount: number;
      date: number;
      installment: number;
      daysOverdue: number;
    }> = [];

    sales.forEach(sale => {
      if (sale.status === PaymentStatus.PAID || !sale.dueDate) return;

      const baseDate = new Date(sale.dueDate);
      const remainingAmount = sale.totalPrice - (sale.downPayment || 0);
      const installmentValue = remainingAmount / sale.installments;

      for (let i = 0; i < sale.installments; i++) {
        // Skip paid installments
        if (i < sale.paidInstallments) continue;

        // Calculate date for this specific installment
        const dueDate = new Date(baseDate);
        dueDate.setMonth(dueDate.getMonth() + i);

        // Check if overdue
        if (dueDate.getTime() < now) {
          const diffTime = now - dueDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
          
          items.push({
            saleId: sale.id,
            customer: sale.customerName || 'Cliente',
            amount: installmentValue,
            date: dueDate.getTime(),
            installment: i + 1,
            daysOverdue: diffDays
          });
        }
      }
    });

    return items.sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [sales]);

  // Play Sound on Overdue Detection
  useEffect(() => {
    if (overdueItems.length > 0 && !hasPlayedSound) {
      playNotificationSound('alert');
      setHasPlayedSound(true);
    }
  }, [overdueItems, hasPlayedSound]);

  const getPageTitle = () => {
    switch(currentView) {
      case 'DASHBOARD': return 'Painel de Controle';
      case 'SALES': return 'Vendas & Cobranças';
      case 'PRODUCTS': return 'Gerenciamento de Produtos';
      case 'CUSTOMERS': return 'Meus Clientes';
      case 'AGENDA': return 'Agenda de Compromissos';
      default: return 'Gestão Financeira Kelvin';
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-800 bg-slate-900/50 backdrop-blur-xl shrink-0">
        <div className="p-6 flex items-center space-x-3">
          <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-lg object-contain" />
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent transform transition-all hover:scale-105 cursor-default leading-tight">
              Financeiro Kelvin
            </h1>
            <p className="text-[10px] text-slate-500">Gestão Inteligente</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <NavItem 
            icon={LayoutDashboard} 
            label="Painel" 
            active={currentView === 'DASHBOARD'} 
            onClick={() => onNavigate('DASHBOARD')} 
          />
          <NavItem 
            icon={ShoppingCart} 
            label="Vendas" 
            active={currentView === 'SALES'} 
            onClick={() => onNavigate('SALES')} 
          />
          <NavItem 
            icon={Package} 
            label="Produtos" 
            active={currentView === 'PRODUCTS'} 
            onClick={() => onNavigate('PRODUCTS')} 
          />
          <NavItem 
            icon={Users} 
            label="Clientes" 
            active={currentView === 'CUSTOMERS'} 
            onClick={() => onNavigate('CUSTOMERS')} 
          />
           <NavItem 
            icon={CalendarDays} 
            label="Agenda" 
            active={currentView === 'AGENDA'} 
            onClick={() => onNavigate('AGENDA')} 
          />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center space-x-3 text-slate-500 text-sm px-4">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300 ring-2 ring-slate-700">
              C
            </div>
            <div>
              <p className="text-slate-200 font-medium">Financeiro Kelvin</p>
              <p className="text-xs text-emerald-500">Online</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-50 shadow-lg">
        <div className="flex items-center gap-2">
          <img src="/icon.png" alt="Logo" className="w-8 h-8 rounded-lg" />
          <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Financeiro Kelvin</h1>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleFullScreen}
            className="text-slate-300 p-2 hover:bg-slate-800 rounded-lg transition-colors"
            title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
          >
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
          {/* Mobile Bell */}
          <button 
             onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
             className="relative text-slate-300 p-2"
          >
            <Bell size={24} />
            {overdueItems.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full animate-pulse shadow-lg shadow-rose-500/50">
                {overdueItems.length > 9 ? '9+' : overdueItems.length}
              </span>
            )}
          </button>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-300">
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/95 z-40 md:hidden pt-20 px-6 space-y-4 animate-in slide-in-from-right">
           <NavItem 
            icon={LayoutDashboard} 
            label="Painel" 
            active={currentView === 'DASHBOARD'} 
            onClick={() => { onNavigate('DASHBOARD'); setIsMobileMenuOpen(false); }} 
          />
          <NavItem 
            icon={ShoppingCart} 
            label="Vendas" 
            active={currentView === 'SALES'} 
            onClick={() => { onNavigate('SALES'); setIsMobileMenuOpen(false); }} 
          />
          <NavItem 
            icon={Package} 
            label="Produtos" 
            active={currentView === 'PRODUCTS'} 
            onClick={() => { onNavigate('PRODUCTS'); setIsMobileMenuOpen(false); }} 
          />
          <NavItem 
            icon={Users} 
            label="Clientes" 
            active={currentView === 'CUSTOMERS'} 
            onClick={() => { onNavigate('CUSTOMERS'); setIsMobileMenuOpen(false); }} 
          />
          <NavItem 
            icon={CalendarDays} 
            label="Agenda" 
            active={currentView === 'AGENDA'} 
            onClick={() => { onNavigate('AGENDA'); setIsMobileMenuOpen(false); }} 
          />
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full bg-slate-950 relative overflow-hidden">
        
        {/* Desktop Header / Top Bar */}
        <header className="hidden md:flex h-16 border-b border-slate-800 bg-slate-900/30 backdrop-blur-sm items-center justify-between px-8 shrink-0">
           <h2 className="text-xl font-bold text-slate-200 tracking-tight">{getPageTitle()}</h2>
           
           <div className="flex items-center gap-4">
              {/* Fullscreen Toggle */}
              <button 
                onClick={toggleFullScreen}
                className="p-2 rounded-full text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
                title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
              >
                {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
              </button>

              {/* Notifications Desktop */}
              <div className="relative">
                <button 
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className={`p-2 rounded-full transition-colors relative ${isNotificationsOpen ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                >
                   <Bell size={20} />
                   {overdueItems.length > 0 && (
                      <span className="absolute top-0 right-0 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-lg shadow-rose-500/50 animate-pulse">
                        {overdueItems.length > 9 ? '9+' : overdueItems.length}
                      </span>
                   )}
                </button>

                {/* Notification Dropdown */}
                {isNotificationsOpen && (
                   <>
                     <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsNotificationsOpen(false)}
                     ></div>
                     <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                        <div className="p-3 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
                           <span className="font-bold text-sm text-slate-200">Notificações</span>
                           {overdueItems.length > 0 && (
                              <span className="text-xs bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded font-bold">
                                 {overdueItems.length} Atrasos
                              </span>
                           )}
                        </div>
                        <div className="max-h-80 overflow-y-auto custom-scrollbar">
                           {overdueItems.length === 0 ? (
                              <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                                 <CheckCircle size={32} className="mb-2 opacity-50 text-emerald-500" />
                                 <p className="text-sm">Tudo em dia!</p>
                              </div>
                           ) : (
                              <div className="divide-y divide-slate-800/50">
                                 {overdueItems.map((item, idx) => (
                                    <div 
                                      key={`${item.saleId}-${idx}`} 
                                      className="p-4 hover:bg-slate-800/50 transition-colors cursor-pointer group"
                                      onClick={() => {
                                         onNavigate('SALES');
                                         setIsNotificationsOpen(false);
                                      }}
                                    >
                                       <div className="flex justify-between items-start mb-1">
                                          <span className="font-bold text-slate-200 text-sm">{item.customer}</span>
                                          <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded">
                                             {item.daysOverdue}d atraso
                                          </span>
                                       </div>
                                       <div className="flex justify-between items-center text-xs text-slate-400">
                                          <span>Parcela {item.installment}</span>
                                          <span className="text-slate-300 font-bold">R$ {item.amount.toFixed(2)}</span>
                                       </div>
                                       <p className="text-[10px] text-slate-500 mt-1">
                                          Venceu em: {new Date(item.date).toLocaleDateString('pt-BR')}
                                       </p>
                                    </div>
                                 ))}
                              </div>
                           )}
                        </div>
                     </div>
                   </>
                )}
              </div>
           </div>
        </header>

        {/* Mobile Notification Dropdown (Full width overlay) */}
        {isNotificationsOpen && (
           <div className="md:hidden absolute inset-0 bg-slate-950 z-50 flex flex-col pt-16 animate-in slide-in-from-right">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                 <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
                    <AlertTriangle size={18} className="text-rose-500"/>
                    Cobranças Pendentes
                 </h3>
                 <button onClick={() => setIsNotificationsOpen(false)} className="text-slate-400">
                    <X size={24} />
                 </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                 {overdueItems.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">
                       <p>Nenhuma pendência encontrada.</p>
                    </div>
                 ) : (
                    overdueItems.map((item, idx) => (
                       <div 
                          key={`${item.saleId}-${idx}`} 
                          className="p-4 bg-slate-900 border border-rose-900/30 rounded-xl shadow-lg"
                          onClick={() => {
                             onNavigate('SALES');
                             setIsNotificationsOpen(false);
                          }}
                       >
                          <div className="flex justify-between items-start mb-2">
                             <span className="font-bold text-slate-100">{item.customer}</span>
                             <span className="bg-rose-500 text-white text-xs px-2 py-1 rounded font-bold">
                                {item.daysOverdue} dias
                             </span>
                          </div>
                          <div className="flex justify-between text-sm text-slate-400">
                             <span>Parcela {item.installment}</span>
                             <span className="font-bold text-emerald-400">R$ {item.amount.toFixed(2)}</span>
                          </div>
                          <div className="mt-2 pt-2 border-t border-slate-800 text-xs text-slate-500 text-right">
                             Vencimento: {new Date(item.date).toLocaleDateString('pt-BR')}
                          </div>
                       </div>
                    ))
                 )}
              </div>
           </div>
        )}

        <div className="flex-1 overflow-y-auto overflow-x-hidden md:p-8 p-4 pt-20 md:pt-0">
          {children}
        </div>
      </main>
    </div>
  );
};