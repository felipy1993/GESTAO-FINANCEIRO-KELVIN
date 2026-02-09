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

  // -- Toasts --
  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    const newToast = { id: crypto.randomUUID(), type, message };
    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // -- Data Loading & Migration Logic --
  const initializeUserData = useCallback(async (uid: string) => {
    setLoadingData(true);
    try {
      // 1. Load from Firestore
      let fCustomers = await firestoreService.loadData<Customer>('customers');
      let fProducts = await firestoreService.loadData<Product>('products');
      let fSales = await firestoreService.loadData<Sale>('sales');
      let fAppointments = await firestoreService.loadData<Appointment>('appointments');

      // 2. Migration Check: If Firebase is empty but LocalStorage has data, migrate once
      const localCustomers = storageService.load(storageService.KEYS.CUSTOMERS, []);
      if (fCustomers.length === 0 && localCustomers.length > 0) {
        showToast('info', 'Sincronizando seus dados locais com a nuvem...');
        await firestoreService.bulkSave('customers', localCustomers);
        fCustomers = localCustomers;
        
        const localProducts = storageService.load(storageService.KEYS.PRODUCTS, []);
        if (localProducts.length > 0) await firestoreService.bulkSave('products', localProducts);
        fProducts = localProducts.length > 0 ? localProducts : MOCK_PRODUCTS;

        const localSales = storageService.load(storageService.KEYS.SALES, []);
        if (localSales.length > 0) await firestoreService.bulkSave('sales', localSales);
        fSales = localSales;

        const localApts = storageService.load(storageService.KEYS.APPOINTMENTS, []);
        if (localApts.length > 0) await firestoreService.bulkSave('appointments', localApts);
        fAppointments = localApts;
        
        showToast('success', 'Dados sincronizados com sucesso!');
        // Limpar storage local para evitar migrações repetidas
        localStorage.clear();
      }

      // 3. Fallback to MOCK if everything is empty (first time user)
      if (fProducts.length === 0) {
        fProducts = MOCK_PRODUCTS;
        await firestoreService.bulkSave('products', MOCK_PRODUCTS);
      }

      // 4. Update State
      setCustomers(fCustomers);
      setProducts(fProducts);
      setSales(fSales.map(s => ({
        ...s,
        type: s.type || 'SALE',
        paidInstallments: s.paidInstallments ?? (s.status === PaymentStatus.PAID ? s.installments : 0),
        downPayment: s.downPayment ?? 0
      })));
      setAppointments(fAppointments);

    } catch (error) {
      console.error("Error initializing data:", error);
      showToast('error', 'Erro ao carregar seus dados do servidor.');
    } finally {
      setLoadingData(false);
    }
  }, []);

  // -- Auth Listener --
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        initializeUserData(user.uid);
      }
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, [initializing, initializeUserData]);

  // -- Actions --
  
  const addCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt'>) => {
    const newCustomer: Customer = {
      ...customerData,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    await firestoreService.saveItem('customers', newCustomer.id, newCustomer);
    setCustomers(prev => [...prev, newCustomer]);
    showToast('success', 'Cliente adicionado com sucesso!');
  };

  const updateCustomer = async (id: string, data: Partial<Customer>) => {
    const customer = customers.find(c => c.id === id);
    if (!customer) return;
    const updated = { ...customer, ...data };
    await firestoreService.saveItem('customers', id, updated);
    setCustomers(prev => prev.map(c => c.id === id ? updated : c));
    showToast('success', 'Cliente atualizado com sucesso!');
  };

  const deleteCustomer = async (id: string) => {
    await firestoreService.deleteItem('customers', id);
    setCustomers(prev => prev.filter(c => c.id !== id));
    showToast('info', 'Cliente removido.');
  }

  const addProduct = async (productData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...productData,
      id: crypto.randomUUID(),
    };
    await firestoreService.saveItem('products', newProduct.id, newProduct);
    setProducts(prev => [...prev, newProduct]);
    showToast('success', 'Produto adicionado com sucesso!');
  };

  const updateProduct = async (id: string, data: Partial<Product>) => {
    const product = products.find(p => p.id === id);
    if (!product) return;
    const updated = { ...product, ...data };
    await firestoreService.saveItem('products', id, updated);
    setProducts(prev => prev.map(p => p.id === id ? updated : p));
    showToast('success', 'Produto atualizado com sucesso!');
  };

  const deleteProduct = async (id: string) => {
    await firestoreService.deleteItem('products', id);
    setProducts(prev => prev.filter(p => p.id !== id));
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
    setSales(prev => [...prev, newSale]);

    if (newSale.type === 'SALE') {
      const updatedProducts = products.map(product => {
        const itemSold = saleData.items.find(item => item.productId === product.id);
        if (itemSold) {
          const updated = { ...product, stock: product.stock - itemSold.quantity };
          firestoreService.saveItem('products', product.id, updated);
          return updated;
        }
        return product;
      });
      setProducts(updatedProducts);
    }

    showToast('success', newSale.type === 'COMMISSION' ? 'Comissão registrada!' : 'Venda registrada com sucesso!');
  };

  const updateSale = async (id: string, data: Partial<Sale>) => {
    const sale = sales.find(s => s.id === id);
    if (!sale) return;
    const updated = { ...sale, ...data };
    await firestoreService.saveItem('sales', id, updated);
    setSales(prev => prev.map(s => s.id === id ? updated : s));
    showToast('success', 'Venda atualizada com sucesso!');
  };

  const toggleSaleStatus = async (id: string) => {
    const sale = sales.find(s => s.id === id);
    if (!sale) return;
    
    const newStatus = sale.status === PaymentStatus.PAID ? PaymentStatus.PENDING : PaymentStatus.PAID;
    const updated = { 
      ...sale, 
      status: newStatus,
      paidInstallments: newStatus === PaymentStatus.PAID ? sale.installments : 0
    };
    
    await firestoreService.saveItem('sales', id, updated);
    setSales(prev => prev.map(s => s.id === id ? updated : s));
    showToast('info', 'Status de pagamento atualizado.');
  }

  const payInstallment = async (id: string) => {
    const sale = sales.find(s => s.id === id);
    if (!sale || sale.status === PaymentStatus.PAID) return;

    const newPaidCount = sale.paidInstallments + 1;
    const isFullyPaid = newPaidCount >= sale.installments;

    const updated = {
      ...sale,
      paidInstallments: newPaidCount,
      status: isFullyPaid ? PaymentStatus.PAID : PaymentStatus.PENDING
    };

    await firestoreService.saveItem('sales', id, updated);
    setSales(prev => prev.map(s => s.id === id ? updated : s));
    showToast('success', 'Parcela marcada como paga!');
  };

  const addAppointment = async (aptData: Omit<Appointment, 'id'>) => {
    const newApt: Appointment = {
      ...aptData,
      id: crypto.randomUUID(),
    };
    await firestoreService.saveItem('appointments', newApt.id, newApt);
    setAppointments(prev => [...prev, newApt]);
    showToast('success', 'Compromisso agendado!');
  };

  const updateAppointment = async (id: string, data: Partial<Appointment>) => {
    const apt = appointments.find(a => a.id === id);
    if (!apt) return;
    const updated = { ...apt, ...data };
    await firestoreService.saveItem('appointments', id, updated);
    setAppointments(prev => prev.map(a => a.id === id ? updated : a));
    showToast('success', 'Agenda atualizada.');
  };

  const deleteAppointment = async (id: string) => {
    await firestoreService.deleteItem('appointments', id);
    setAppointments(prev => prev.filter(a => a.id !== id));
    showToast('info', 'Compromisso removido.');
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
          />
        );
      case 'PRODUCTS':
        return (
          <Products 
            products={products} 
            onAddProduct={addProduct} 
            onUpdateProduct={updateProduct}
            onDeleteProduct={deleteProduct} 
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
    <Layout currentView={currentView} onNavigate={setCurrentView} sales={sales}>
      {renderView()}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </Layout>
  );
}

export default App;