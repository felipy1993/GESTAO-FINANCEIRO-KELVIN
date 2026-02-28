import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, Search, Package, X, AlertTriangle, Layers, Calendar } from 'lucide-react';
import { Product } from '../types';
import { CATEGORIES } from '../constants';

interface ProductsProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (id: string, product: Partial<Product>) => void;
  onDeleteProduct: (id: string) => void;
  onSellProduct: (product: Product) => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const Products: React.FC<ProductsProps> = ({ 
  products, 
  onAddProduct, 
  onUpdateProduct, 
  onDeleteProduct, 
  onSellProduct,
  showToast 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    category: CATEGORIES[0],
    cost: '',
    price: '',
    stock: '',
    date: new Date().toISOString().split('T')[0]
  });

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      category: product.category,
      cost: product.cost.toString(),
      price: product.price.toString(),
      stock: product.stock.toString(),
      date: new Date(product.createdAt || Date.now()).toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({ 
      name: '', 
      category: CATEGORIES[0], 
      cost: '', 
      price: '', 
      stock: '0',
      date: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const productData = {
      name: formData.name,
      category: formData.category,
      cost: Number(formData.cost),
      price: Number(formData.price),
      stock: Number(formData.stock),
      initialStock: Number(formData.stock),
      createdAt: new Date(formData.date + 'T12:00:00').getTime()
    };

    if (editingId) {
      onUpdateProduct(editingId, productData);
    } else {
      onAddProduct(productData);
    }
    
    setIsModalOpen(false);
  };

  const confirmDelete = () => {
    if (deleteConfirmationId) {
      onDeleteProduct(deleteConfirmationId);
      setDeleteConfirmationId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-100 drop-shadow-md">Produtos</h2>
          <p className="text-slate-400">Gerencie seu estoque</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Buscar produto..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all shadow-inner"
            />
          </div>
          <button 
            onClick={handleAddNew}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-[0_10px_20px_-5px_rgba(16,185,129,0.4)] font-medium whitespace-nowrap active:scale-95 transition-transform border-t border-emerald-400"
          >
            <Plus size={20} />
            <span className="hidden md:inline">Adicionar</span>
          </button>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
          <Package size={48} className="mx-auto text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-300">Nenhum produto cadastrado</h3>
          <p className="text-slate-500 mb-4">Comece adicionando itens ao seu estoque.</p>
          <button onClick={handleAddNew} className="text-emerald-400 hover:text-emerald-300 font-medium">
            Adicionar meu primeiro produto
          </button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500">Nenhum produto encontrado para "{searchTerm}"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => {
            const margin = product.price > 0 
              ? ((product.price - product.cost) / product.price) * 100 
              : 0;

            const isLowStock = product.stock <= 5;

            return (
              <div key={product.id} className="bg-gradient-to-br from-slate-800 to-slate-950 border-t border-l border-slate-700/50 p-5 rounded-3xl transition-all group relative duration-300 hover:scale-[1.02] hover:-translate-y-2 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)] shadow-lg overflow-hidden">
                {/* 3D Reflection */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-2xl -mr-16 -mt-16 rounded-full pointer-events-none"></div>

                {/* Actions - Always Visible now */}
                <div className="absolute top-4 right-4 flex gap-2 z-10">
                   <button 
                    onClick={() => handleEdit(product)}
                    className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors bg-slate-900/50 backdrop-blur-sm"
                    title="Editar"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => setDeleteConfirmationId(product.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-500 hover:bg-slate-800 rounded-lg transition-colors bg-slate-900/50 backdrop-blur-sm"
                    title="Excluir"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <div className="flex items-start justify-between mb-4 relative z-0">
                  <div className="p-3 bg-slate-800 rounded-2xl text-slate-300 group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-colors shadow-inner border border-slate-700/50">
                    <Package size={24} />
                  </div>
                  <span className="text-xs font-bold px-2 py-1 bg-slate-800/80 text-slate-400 rounded-md mr-14 border border-slate-700/50">
                    {product.category}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-slate-100 mb-1 line-clamp-1 drop-shadow-md">{product.name}</h3>
                
                {/* Stock Indicator */}
                <div className="flex items-center gap-2 mb-3">
                  <div className={`px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 shadow-sm ${isLowStock ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                    <Layers size={12} />
                    {product.stock} em estoque
                  </div>
                  {isLowStock && (
                     <span className="text-xs text-rose-500 font-medium animate-pulse">Estoque Baixo</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-800/50 relative">
                  <div>
                    <p className="text-xs text-slate-500 mb-1 font-medium">Custo</p>
                    <p className="text-slate-300 font-bold">R$ {product.cost.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1 font-medium">Preço</p>
                    <p className="text-emerald-400 font-black text-xl drop-shadow-sm">R$ {product.price.toFixed(2)}</p>
                  </div>
                </div>
                
                <div className="mt-5 pt-2">
                  <button 
                    onClick={() => product.stock > 0 ? onSellProduct(product) : showToast('error', 'Produto sem estoque!')}
                    disabled={product.stock <= 0}
                    className={`w-full font-black py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all border-t ${
                      product.stock > 0 
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-emerald-500/20 border-emerald-400' 
                        : 'bg-slate-800 text-slate-500 shadow-none border-slate-700 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <Plus size={20} strokeWidth={3} />
                    {product.stock > 0 ? 'VENDER AGORA' : 'SEM ESTOQUE'}
                  </button>
                </div>
                
                <div className="mt-4 flex items-center justify-between text-xs bg-slate-900/30 p-2 rounded-lg">
                   <span className="text-slate-500 font-medium">Margem Estimada</span>
                   <span className={`font-bold px-2 py-0.5 rounded ${margin >= 30 ? 'text-emerald-400 bg-emerald-500/10' : margin > 0 ? 'text-amber-400 bg-amber-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                     {margin.toFixed(1)}%
                   </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit/Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-100">
                {editingId ? 'Editar Produto' : 'Novo Produto'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-300">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Nome do Produto</label>
                <input 
                  required
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-inner"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})}
                  placeholder="Ex: Carregador USB-C"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Categoria</label>
                <select 
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:border-emerald-500 focus:outline-none shadow-sm"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Custo (R$)</label>
                  <input 
                    required type="number" step="0.01" min="0"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:border-emerald-500 focus:outline-none shadow-inner"
                    value={formData.cost}
                    onChange={e => setFormData({...formData, cost: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Preço Venda (R$)</label>
                  <input 
                    required type="number" step="0.01" min="0"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:border-emerald-500 focus:outline-none shadow-inner"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              {/* Stock and Date Input */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Qtd Estoque</label>
                  <input 
                    required type="number" step="1"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:border-emerald-500 focus:outline-none shadow-inner text-sm"
                    value={formData.stock}
                    onChange={e => setFormData({...formData, stock: e.target.value})}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Data de Compra</label>
                  <input 
                    required type="date"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:border-emerald-500 focus:outline-none shadow-inner text-sm"
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-6 flex gap-3">
                 <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95 border-t border-emerald-400"
                >
                  {editingId ? 'Salvar Alterações' : 'Adicionar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmationId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mb-4 shadow-inner">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-100 mb-2">Excluir Produto?</h3>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Esta ação não pode ser desfeita. O produto será removido permanentemente do seu estoque.
              </p>
              
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setDeleteConfirmationId(null)}
                  className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors shadow-sm"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-medium transition-colors shadow-lg shadow-rose-500/20 border-t border-rose-400"
                >
                  Sim, Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};