import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/ui/Layout';
import { Dashboard } from './components/Dashboard';
import { Sales } from './components/Sales';
import { Products } from './components/Products';
import { Customers } from './components/Customers';
import { Agenda } from './components/Agenda';
import { Login } from './components/Login';
import { ToastContainer } from './components/ui/Toast';
import { ViewState, Customer, Product, Sale, PaymentStatus, ToastMessage, Appointment } from './types';
import { storageService } from './services/storageService';
import { firestoreService } from './services/firestoreService';
import { MOCK_PRODUCTS } from './constants';
import { auth } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [user, setUser] = useState<any>(null);
  const [initializing, setInitializing] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  
  // -- State --
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [quickSaleProductId, setQuickSaleProductId] = useState<string | undefined>(undefined);

  // -- Toasts --
  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    const newToast = { id: crypto.randomUUID(), type, message };
    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // -- Auth & Real-time Listeners --
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (initializing) setInitializing(false);
    });

    return unsubscribeAuth;
  }, [initializing]);

  useEffect(() => {
    if (!user) return;

    setLoadingData(true);

    // Initial Migration Logic (Run once)
    const runMigration = async () => {
      try {
        const fCustomers = await firestoreService.loadData<Customer>('customers');
        const localCustomers = storageService.load(storageService.KEYS.CUSTOMERS, []);
        
        if (fCustomers.length === 0 && localCustomers.length > 0) {
          showToast('info', 'Sincronizando dados locais...');
          await firestoreService.bulkSave('customers', localCustomers);
          
          const localProducts = storageService.load(storageService.KEYS.PRODUCTS, []);
          if (localProducts.length > 0) await firestoreService.bulkSave('products', localProducts);

          const localSales = storageService.load(storageService.KEYS.SALES, []);
          if (localSales.length > 0) await firestoreService.bulkSave('sales', localSales);

          const localApts = storageService.load(storageService.KEYS.APPOINTMENTS, []);
          if (localApts.length > 0) await firestoreService.bulkSave('appointments', localApts);
          
          localStorage.clear();
          showToast('success', 'Dados sincronizados!');
        }
      } catch (e) {
        console.error("Migration error", e);
      } finally {
        setLoadingData(false);
      }
    };

    runMigration();

    // Real-time Subscriptions
    const unsubCustomers = firestoreService.subscribeToData('customers', (data) => setCustomers(data));
    const unsubProducts = firestoreService.subscribeToData('products', (data) => {
      if (data.length === 0) {
        firestoreService.bulkSave('products', MOCK_PRODUCTS);
      } else {
        setProducts(data);
      }
    });
    const unsubSales = firestoreService.subscribeToData('sales', (data) => {
      setSales(data.map(s => ({
        ...s,
        type: s.type || 'SALE',
        paidInstallments: s.paidInstallments ?? (s.status === PaymentStatus.PAID ? s.installments : 0),
        downPayment: s.downPayment ?? 0
      })));
    });
    const unsubApts = firestoreService.subscribeToData('appointments', (data) => setAppointments(data));

    return () => {
      unsubCustomers();
      unsubProducts();
      unsubSales();
      unsubApts();
    };
  }, [user]);

  // -- Actions (Instantly update UI via Real-time Listeners) --
  
  const addCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt'>) => {
    const newCustomer: Customer = {
      ...customerData,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    firestoreService.saveItem('customers', newCustomer.id, newCustomer);
    showToast('success', 'Cliente adicionado!');
  };

  const updateCustomer = async (id: string, data: Partial<Customer>) => {
    const customer = customers.find(c => c.id === id);
    if (!customer) return;
    firestoreService.saveItem('customers', id, { ...customer, ...data });
    showToast('success', 'Cliente atualizado!');
  };

  const deleteCustomer = async (id: string) => {
    if (!confirm('Excluir este cliente?')) return;
    firestoreService.deleteItem('customers', id);
    showToast('info', 'Cliente removido.');
  }

  const addProduct = async (productData: Omit<Product, 'id'>) => {
    const newProduct: Product = { ...productData, id: crypto.randomUUID() };
    firestoreService.saveItem('products', newProduct.id, newProduct);
    showToast('success', 'Produto adicionado!');
  };

  const updateProduct = async (id: string, data: Partial<Product>) => {
    const product = products.find(p => p.id === id);
    if (!product) return;
    firestoreService.saveItem('products', id, { ...product, ...data });
    showToast('success', 'Produto atualizado!');
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Excluir este produto?')) return;
    firestoreService.deleteItem('products', id);
    showToast('info', 'Produto removido.');
  };

  const addSale = async (saleData: Omit<Sale, 'id' | 'date' | 'totalCost' | 'totalPrice' | 'totalProfit' | 'profitMargin' | 'paidInstallments'>) => {
    const totalCost = saleData.items.reduce((sum, item) => sum + item.totalCost, 0);
    const totalPrice = saleData.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalProfit = totalPrice - totalCost;
    const profitMargin = totalPrice > 0 ? (totalProfit / totalPrice) * 100 : 0;

    const newSale: Sale = {
      ...saleData,
      type: saleData.type || 'SALE',
      id: crypto.randomUUID(),
      date: Date.now(),
      totalCost,
      totalPrice,
      totalProfit,
      profitMargin,
      downPayment: saleData.downPayment || 0,
      paidInstallments: saleData.status === PaymentStatus.PAID ? saleData.installments : 0
    };

    await firestoreService.saveItem('sales', newSale.id, newSale);

    if (newSale.type === 'SALE') {
      saleData.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          firestoreService.saveItem('products', product.id, { ...product, stock: product.stock - item.quantity });
        }
      });
    }

    showToast('success', newSale.type === 'COMMISSION' ? 'Comissão registrada!' : 'Venda registrada!');
  };

  const updateSale = async (id: string, data: Partial<Sale>) => {
    const sale = sales.find(s => s.id === id);
    if (!sale) return;
    firestoreService.saveItem('sales', id, { ...sale, ...data });
    showToast('success', 'Venda atualizada!');
  };

  const toggleSaleStatus = async (id: string) => {
    const sale = sales.find(s => s.id === id);
    if (!sale) return;
    
    const newStatus = sale.status === PaymentStatus.PAID ? PaymentStatus.PENDING : PaymentStatus.PAID;
    firestoreService.saveItem('sales', id, { 
      ...sale, 
      status: newStatus,
      paidInstallments: newStatus === PaymentStatus.PAID ? sale.installments : 0
    });
  }

  const payInstallment = async (id: string) => {
    const sale = sales.find(s => s.id === id);
    if (!sale || sale.status === PaymentStatus.PAID) return;

    const newPaidCount = sale.paidInstallments + 1;
    const isFullyPaid = newPaidCount >= sale.installments;

    firestoreService.saveItem('sales', id, {
      ...sale,
      paidInstallments: newPaidCount,
      status: isFullyPaid ? PaymentStatus.PAID : PaymentStatus.PENDING
    });
    showToast('success', 'Parcela paga!');
  };

  const addAppointment = async (aptData: Omit<Appointment, 'id'>) => {
    const newApt: Appointment = { ...aptData, id: crypto.randomUUID() };
    firestoreService.saveItem('appointments', newApt.id, newApt);
    showToast('success', 'Compromisso agendado!');
  };

  const updateAppointment = async (id: string, data: Partial<Appointment>) => {
    const apt = appointments.find(a => a.id === id);
    if (!apt) return;
    firestoreService.saveItem('appointments', id, { ...apt, ...data });
    showToast('success', 'Agenda atualizada.');
  };

  const deleteAppointment = async (id: string) => {
    if (!confirm('Remover agendamento?')) return;
    firestoreService.deleteItem('appointments', id);
    showToast('info', 'Compromisso removido.');
  };

  const handleSellProduct = (product: Product) => {
    setQuickSaleProductId(product.id);
    setCurrentView('SALES');
  };

  // -- Render --
  
  if (initializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="text-slate-400 font-medium animate-pulse">Iniciando sistema...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Login onLoginSuccess={() => setCurrentView('DASHBOARD')} showToast={showToast} />
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </>
    );
  }

  if (loadingData) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
        <p className="text-slate-400 font-medium animate-pulse">Conectando ao banco de dados...</p>
      </div>
    );
  }
  
  const renderView = () => {
    switch (currentView) {
      case 'DASHBOARD':
        return <Dashboard sales={sales} products={products} showToast={showToast} />;
      case 'SALES':
        return (
          <Sales 
            sales={sales} 
            products={products} 
            customers={customers} 
            onAddSale={addSale}
            onUpdateSale={updateSale}
            onToggleStatus={toggleSaleStatus} 
            onPayInstallment={payInstallment}
            showToast={showToast}
            initialProductId={quickSaleProductId}
            onClearQuickSale={() => setQuickSaleProductId(undefined)}
          />
        );
      case 'PRODUCTS':
        return (
          <Products 
            products={products} 
            onAddProduct={addProduct} 
            onUpdateProduct={updateProduct}
            onDeleteProduct={deleteProduct} 
            onSellProduct={handleSellProduct}
            showToast={showToast}
          />
        );
      case 'CUSTOMERS':
        return (
          <Customers 
            customers={customers} 
            onAddCustomer={addCustomer} 
            onUpdateCustomer={updateCustomer}
            onDeleteCustomer={deleteCustomer} 
            showToast={showToast}
          />
        );
      case 'AGENDA':
        return (
          <Agenda 
            appointments={appointments}
            customers={customers}
            onAddAppointment={addAppointment}
            onUpdateAppointment={updateAppointment}
            onDeleteAppointment={deleteAppointment}
            showToast={showToast}
          />
        )
      default:
        return <Dashboard sales={sales} products={products} showToast={showToast} />;
    }
  };

  return (
    <Layout currentView={currentView} onNavigate={(view) => {
      if (view !== 'SALES') setQuickSaleProductId(undefined);
      setCurrentView(view);
    }} sales={sales}>
      {renderView()}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </Layout>
  );
}

export default App;