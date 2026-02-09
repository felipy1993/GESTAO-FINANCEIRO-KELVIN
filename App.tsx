import React, { useState, useEffect } from 'react';
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
import { MOCK_PRODUCTS } from './constants';
import { auth } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [user, setUser] = useState<any>(null);
  const [initializing, setInitializing] = useState(true);
  
  // -- Auth Listener --
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, [initializing]);

  // -- State --
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // -- Initialization --
  useEffect(() => {
    setCustomers(storageService.load(storageService.KEYS.CUSTOMERS, []));
    setAppointments(storageService.load(storageService.KEYS.APPOINTMENTS, []));
    
    // Load products, or seed with mock data if empty
    const loadedProducts = storageService.load(storageService.KEYS.PRODUCTS, []);
    if (loadedProducts.length === 0) {
      setProducts(MOCK_PRODUCTS);
      storageService.save(storageService.KEYS.PRODUCTS, MOCK_PRODUCTS);
    } else {
      setProducts(loadedProducts);
    }

    // Load sales and migrate data if necessary (add paidInstallments, downPayment, type)
    const loadedSales = storageService.load<Sale[]>(storageService.KEYS.SALES, []);
    const migratedSales = loadedSales.map(s => ({
      ...s,
      type: s.type || 'SALE', // Default to SALE for existing records
      paidInstallments: s.paidInstallments ?? (s.status === PaymentStatus.PAID ? s.installments : 0),
      downPayment: s.downPayment ?? 0
    }));
    
    if (JSON.stringify(loadedSales) !== JSON.stringify(migratedSales)) {
       storageService.save(storageService.KEYS.SALES, migratedSales);
    }
    setSales(migratedSales);
  }, []);

  // -- Toasts --
  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    const newToast = { id: crypto.randomUUID(), type, message };
    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // -- Actions --
  
  const addCustomer = (customerData: Omit<Customer, 'id' | 'createdAt'>) => {
    const newCustomer: Customer = {
      ...customerData,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    const updated = [...customers, newCustomer];
    setCustomers(updated);
    storageService.save(storageService.KEYS.CUSTOMERS, updated);
    showToast('success', 'Cliente adicionado com sucesso!');
  };

  const updateCustomer = (id: string, data: Partial<Customer>) => {
    const updated = customers.map(c => c.id === id ? { ...c, ...data } : c);
    setCustomers(updated);
    storageService.save(storageService.KEYS.CUSTOMERS, updated);
    showToast('success', 'Cliente atualizado com sucesso!');
  };

  const deleteCustomer = (id: string) => {
    const updated = customers.filter(c => c.id !== id);
    setCustomers(updated);
    storageService.save(storageService.KEYS.CUSTOMERS, updated);
    showToast('info', 'Cliente removido.');
  }

  const addProduct = (productData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...productData,
      id: crypto.randomUUID(),
    };
    const updated = [...products, newProduct];
    setProducts(updated);
    storageService.save(storageService.KEYS.PRODUCTS, updated);
    showToast('success', 'Produto adicionado com sucesso!');
  };

  const updateProduct = (id: string, data: Partial<Product>) => {
    const updated = products.map(p => p.id === id ? { ...p, ...data } : p);
    setProducts(updated);
    storageService.save(storageService.KEYS.PRODUCTS, updated);
    showToast('success', 'Produto atualizado com sucesso!');
  };

  const deleteProduct = (id: string) => {
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    storageService.save(storageService.KEYS.PRODUCTS, updated);
    showToast('info', 'Produto removido.');
  };

  const addSale = (saleData: Omit<Sale, 'id' | 'date' | 'totalCost' | 'totalPrice' | 'totalProfit' | 'profitMargin' | 'paidInstallments'>) => {
    // Calculate final totals
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

    // Update Sales State
    const updatedSales = [...sales, newSale];
    setSales(updatedSales);
    storageService.save(storageService.KEYS.SALES, updatedSales);

    // Update Products Stock (ONLY IF IT IS A PRODUCT SALE)
    if (newSale.type === 'SALE') {
      const updatedProducts = products.map(product => {
        const itemSold = saleData.items.find(item => item.productId === product.id);
        if (itemSold) {
          return { ...product, stock: product.stock - itemSold.quantity };
        }
        return product;
      });
      setProducts(updatedProducts);
      storageService.save(storageService.KEYS.PRODUCTS, updatedProducts);
    }

    showToast('success', newSale.type === 'COMMISSION' ? 'Comissão registrada!' : 'Venda registrada com sucesso!');
  };

  const updateSale = (id: string, data: Partial<Sale>) => {
    const updated = sales.map(s => s.id === id ? { ...s, ...data } : s);
    setSales(updated);
    storageService.save(storageService.KEYS.SALES, updated);
    showToast('success', 'Venda atualizada com sucesso!');
  };

  const toggleSaleStatus = (id: string) => {
    const updated = sales.map(s => {
      if (s.id === id) {
        const newStatus = s.status === PaymentStatus.PAID ? PaymentStatus.PENDING : PaymentStatus.PAID;
        return { 
          ...s, 
          status: newStatus,
          paidInstallments: newStatus === PaymentStatus.PAID ? s.installments : 0
        };
      }
      return s;
    });
    setSales(updated);
    storageService.save(storageService.KEYS.SALES, updated);
    showToast('info', 'Status de pagamento atualizado.');
  }

  const payInstallment = (id: string) => {
    const updated = sales.map(s => {
      if (s.id === id) {
        if (s.status === PaymentStatus.PAID) return s; // Já está tudo pago

        const newPaidCount = s.paidInstallments + 1;
        const isFullyPaid = newPaidCount >= s.installments;

        return {
          ...s,
          paidInstallments: newPaidCount,
          status: isFullyPaid ? PaymentStatus.PAID : PaymentStatus.PENDING
        };
      }
      return s;
    });
    setSales(updated);
    storageService.save(storageService.KEYS.SALES, updated);
    showToast('success', 'Parcela marcada como paga!');
  };

  // -- Agenda Actions --

  const addAppointment = (aptData: Omit<Appointment, 'id'>) => {
    const newApt: Appointment = {
      ...aptData,
      id: crypto.randomUUID(),
    };
    const updated = [...appointments, newApt];
    setAppointments(updated);
    storageService.save(storageService.KEYS.APPOINTMENTS, updated);
    showToast('success', 'Compromisso agendado!');
  };

  const updateAppointment = (id: string, data: Partial<Appointment>) => {
    const updated = appointments.map(a => a.id === id ? { ...a, ...data } : a);
    setAppointments(updated);
    storageService.save(storageService.KEYS.APPOINTMENTS, updated);
    showToast('success', 'Agenda atualizada.');
  };

  const deleteAppointment = (id: string) => {
    const updated = appointments.filter(a => a.id !== id);
    setAppointments(updated);
    storageService.save(storageService.KEYS.APPOINTMENTS, updated);
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