import { PaymentMethod } from './types';

export const CATEGORIES = [
  'Eletrônicos',
  'Roupas',
  'Alimentos & Bebidas',
  'Serviços',
  'Casa',
  'Beleza',
  'Automotivo',
  'Outros'
];

export const PAYMENT_METHODS = [
  { value: PaymentMethod.PIX, label: 'PIX' },
  { value: PaymentMethod.CARD, label: 'Cartão de Crédito/Débito' },
  { value: PaymentMethod.CASH, label: 'Dinheiro' },
];

export const MOCK_PRODUCTS = [
  { id: '1', name: 'Smartphone Usado', category: 'Eletrônicos', cost: 150, price: 250, stock: 3 },
  { id: '2', name: 'Camiseta', category: 'Roupas', cost: 10, price: 25, stock: 50 },
  { id: '3', name: 'Hora Técnica', category: 'Serviços', cost: 0, price: 50, stock: 999 },
];