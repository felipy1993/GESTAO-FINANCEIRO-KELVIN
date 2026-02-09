const KEYS = {
  CUSTOMERS: 'merchant_customers',
  PRODUCTS: 'merchant_products',
  SALES: 'merchant_sales',
  APPOINTMENTS: 'merchant_appointments',
};

export const storageService = {
  save: (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  },
  load: <T,>(key: string, defaultValue: T): T => {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  },
  KEYS
};