
export interface Customer {
  id: string;
  name: string;
  phone: string;
  cep?: string;
  address?: string;
  number?: string;
  city?: string;
  state?: string;
  notes?: string;
  createdAt: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  cost: number;
  price: number;
  stock: number;
  initialStock: number;
  createdAt: number;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  unitPrice: number;
  totalCost: number;
  totalPrice: number;
}

export enum PaymentMethod {
  PIX = 'PIX',
  CARD = 'CARD',
  CASH = 'CASH',
}

export enum PaymentStatus {
  PAID = 'PAID',
  PENDING = 'PENDING',
}

export type SaleType = 'SALE' | 'COMMISSION';

export interface Installment {
  id: string;
  number: number;
  dueDate: number;
  value: number;
  status: PaymentStatus;
  paidAt?: number;
}

export interface Sale {
  id: string;
  type: SaleType;
  customerId?: string;
  customerName?: string;
  items: SaleItem[];
  totalCost: number;
  totalPrice: number;
  totalProfit: number;
  profitMargin: number;
  downPayment?: number;
  paymentMethod: PaymentMethod;
  installments: number;
  paidInstallments: number;
  isRecurring: boolean;
  status: PaymentStatus;
  date: number;
  dueDate?: number;
  customInstallments?: Installment[];
}

export type AppointmentStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

export interface Appointment {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  customerId?: string;
  customerName?: string;
  notes?: string;
  status: AppointmentStatus;
}

export type ViewState = 'DASHBOARD' | 'SALES' | 'PRODUCTS' | 'CUSTOMERS' | 'AGENDA';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface DataContextType {
  customers: Customer[];
  products: Product[];
  sales: Sale[];
  addCustomer: (c: Omit<Customer, 'id' | 'createdAt'>) => void;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  addProduct: (p: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, data: Partial<Product>) => void;
  addSale: (s: Omit<Sale, 'id' | 'date' | 'totalCost' | 'totalPrice' | 'totalProfit' | 'profitMargin' | 'paidInstallments'>) => void;
  deleteProduct: (id: string) => void;
  deleteCustomer: (id: string) => void;
  deleteSale: (id: string) => void;
  updateSale: (id: string, data: Partial<Sale>) => void;
  togglePaymentStatus: (id: string) => void;
  payInstallment: (id: string) => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}