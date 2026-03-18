import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, Search, Package, X, AlertTriangle, Layers, Calendar, Wallet, FileText } from 'lucide-react';
import { Product, Sale } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CATEGORIES } from '../constants';

interface ProductsProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (id: string, product: Partial<Product>) => void;
  onDeleteProduct: (id: string) => void;
  onSellProduct: (product: Product) => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
  sales?: Sale[];
}

export const Products: React.FC<ProductsProps> = ({ 
  products, 
  onAddProduct, 
  onUpdateProduct, 
  onDeleteProduct, 
  onSellProduct,
  showToast,
  sales = []
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

  const [showCostTable, setShowCostTable] = useState(false);

  const productMetrics = useMemo(() => {
    let totalInvested = 0;
    let totalStockValue = 0;
    let totalSoldCost = 0;

    products.forEach(p => {
      const soldCount = sales.reduce((sum, s) => {
        const item = s.items.find(i => i.productId === p.id);
        return sum + (item ? item.quantity : 0);
      }, 0);

      const investment = p.cost * (p.stock + soldCount);
      const stockVal = p.cost * p.stock;
      const soldCost = p.cost * soldCount;

      totalInvested += investment;
      totalStockValue += stockVal;
      totalSoldCost += soldCost;
    });

    return { totalInvested, totalStockValue, totalSoldCost };
  }, [products, sales]);

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

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.text('Relatório de Estoque e Movimentação', 14, 22);
      
      doc.setFontSize(11);
      doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);

      // 1. ITEMS IN STOCK
      doc.setFontSize(14);
      doc.text('Itens em Estoque Atual', 14, 42);

      let totalStockCostSum = 0;

      const stockData = products
        .filter(p => p.stock > 0)
        .map(p => {
          const totalCost = p.stock * p.cost;
          totalStockCostSum += totalCost;
          return [
            p.name,
            p.category,
            p.stock.toString(),
            `R$ ${p.cost.toFixed(2)}`,
            `R$ ${totalCost.toFixed(2)}`,
            new Date(p.createdAt || Date.now()).toLocaleDateString('pt-BR')
          ];
        });

      if (stockData.length > 0) {
        stockData.push(['TOTAL', '-', '-', '-', `R$ ${totalStockCostSum.toFixed(2)}`, '-']);
      }

      autoTable(doc, {
        startY: 48,
        head: [['Produto', 'Categoria', 'Qtd', 'Custo Uni.', 'Custo Total', 'Data de Registro']],
        body: stockData.length > 0 ? stockData : [['Nenhum produto com estoque físico', '-', '-', '-', '-', '-']],
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] }, // emerald-500
        styles: { fontSize: 9 },
        willDrawCell: function(data) {
          if (data.row.index === stockData.length - 1 && stockData.length > 1) {
             doc.setFont('', 'bold');
             doc.setFillColor(240, 253, 244);
          }
        },
      });

      // 2. SOLD ITEMS
      let finalY = (doc as any).lastAutoTable.finalY + 15;
      
      doc.setFontSize(14);
      doc.text('Histórico de Vendas (Baixas de Estoque)', 14, finalY);

      // Flatten sales into individual item movements
      let totalSoldCostSum = 0;
      let totalSoldRevenueSum = 0;
      const soldItems: Array<[string, string, string, string, string, string, string]> = [];
      
      sales.forEach(sale => {
        sale.items.forEach(item => {
           // Find category from product DB if possible
           const prod = products.find(p => p.id === item.productId);
           const category = prod ? prod.category : 'N/A';
           const saleDate = new Date(sale.date).toLocaleDateString('pt-BR');
           const regDate = prod ? new Date(prod.createdAt || Date.now()).toLocaleDateString('pt-BR') : 'N/A';

           totalSoldCostSum += item.totalCost;
           totalSoldRevenueSum += item.totalPrice;

           soldItems.push([
             item.productName,
             category,
             item.quantity.toString(),
             regDate,
             saleDate,
             `R$ ${item.totalCost.toFixed(2)}`,
             `R$ ${item.totalPrice.toFixed(2)}`
           ]);
        });
      });

      if (soldItems.length > 0) {
        soldItems.push(['TOTAL', '-', '-', '-', '-', `R$ ${totalSoldCostSum.toFixed(2)}`, `R$ ${totalSoldRevenueSum.toFixed(2)}`]);
      }
      
      autoTable(doc, {
        startY: finalY + 6,
        head: [['Produto Vendido', 'Categoria', 'Qtd Vendida', 'Data Registro', 'Data da Baixa', 'Custo Total', 'Venda Total']],
        body: soldItems.length > 0 ? soldItems : [['Nenhuma venda registrada ainda', '-', '-', '-', '-', '-', '-']],
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] }, // blue-500
        styles: { fontSize: 9 },
        willDrawCell: function(data) {
          if (data.row.index === soldItems.length - 1 && soldItems.length > 1) {
             doc.setFont('', 'bold');
             doc.setFillColor(239, 246, 255);
          }
        },
      });

      // 3. FINAL SUMMARY
      let finaleY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(12);
      doc.setFont('', 'bold');
      doc.text(`Resumo Financeiro (Geral)`, 14, finaleY);
      doc.setFontSize(10);
      doc.setFont('', 'normal');
      doc.text(`Valor de Custo dos Itens Vendidos: R$ ${totalSoldCostSum.toFixed(2)}`, 14, finaleY + 6);
      doc.text(`Valor Total das Vendas (Faturamento): R$ ${totalSoldRevenueSum.toFixed(2)}`, 14, finaleY + 12);
      const profit = totalSoldRevenueSum - totalSoldCostSum;
      doc.text(`Lucro Líquido Parcial (Produtos Fisicos): R$ ${profit.toFixed(2)}`, 14, finaleY + 18);

      doc.save('relatorio_estoque_movimentacao.pdf');
      showToast('success', 'Relatório PDF gerado com sucesso!');
    } catch (e) {
      console.error(e);
      showToast('error', 'Erro ao gerar o PDF.');
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
            onClick={handleExportPDF}
            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg font-medium whitespace-nowrap active:scale-95 transition-transform border border-slate-700"
          >
            <FileText size={20} className="text-blue-400" />
            <span className="hidden md:inline">Exportar PDF</span>
          </button>
          
          <button 
            onClick={handleAddNew}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-[0_10px_20px_-5px_rgba(16,185,129,0.4)] font-medium whitespace-nowrap active:scale-95 transition-transform border-t border-emerald-400"
          >
            <Plus size={20} />
            <span className="hidden md:inline">Adicionar</span>
          </button>
        </div>
      </div>

      {/* Products KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Invested */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-950 p-6 rounded-3xl border-t border-l border-white/5 shadow-xl relative overflow-hidden group transition-all duration-300 hover:-translate-y-1">
          <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110">
            <Wallet size={70} className="text-blue-500" />
          </div>
          <div className="flex items-center gap-4 mb-3">
             <div className="p-2 bg-blue-500/20 rounded-xl">
                <Wallet size={20} className="text-blue-400" />
             </div>
             <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">Investimento Total</p>
          </div>
          <h3 className="text-2xl font-black text-blue-400">
            R$ {productMetrics.totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-slate-500 mt-2 font-medium">Custo total de produtos comprados</p>
        </div>

        {/* Stock Value (Parado) */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-950 p-6 rounded-3xl border-t border-l border-white/5 shadow-xl relative overflow-hidden group transition-all duration-300 hover:-translate-y-1">
          <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110">
            <Package size={70} className="text-amber-500" />
          </div>
          <div className="flex items-center gap-4 mb-3">
             <div className="p-2 bg-amber-500/20 rounded-xl">
                <Package size={20} className="text-amber-400" />
             </div>
             <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">Produto Parado</p>
          </div>
          <h3 className="text-2xl font-black text-amber-400">
            R$ {productMetrics.totalStockValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-slate-500 mt-2 font-medium">Capital em estoque físico atual</p>
        </div>

        {/* Sold Value (Custo) */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-950 p-6 rounded-3xl border-t border-l border-white/5 shadow-xl relative overflow-hidden group transition-all duration-300 hover:-translate-y-1">
          <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110">
            <Layers size={70} className="text-emerald-500" />
          </div>
          <div className="flex items-center gap-4 mb-3">
             <div className="p-2 bg-emerald-500/20 rounded-xl">
                <Layers size={20} className="text-emerald-400" />
             </div>
             <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">Valor Vendido (Custo)</p>
          </div>
          <h3 className="text-2xl font-black text-emerald-400">
            R$ {productMetrics.totalSoldCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-slate-500 mt-2 font-medium">Investimento que já retornou em vendas</p>
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

      {/* Cost List Table - As requested by user */}
      {products.length > 0 && (
        <div className="mt-12 space-y-4">
          <div className="flex items-center justify-between ml-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-800 rounded-lg">
                 <FileText size={18} className="text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-100">Lista de Custos (Geral)</h3>
            </div>
            <button 
              onClick={() => setShowCostTable(!showCostTable)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center gap-2"
            >
              {showCostTable ? 'Ocultar Lista' : 'Ver Lista Completa'}
              <Layers size={14} className={showCostTable ? 'rotate-180 transition-transform' : 'transition-transform'} />
            </button>
          </div>
          
          {showCostTable && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-top-4 duration-300">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-700/50">Produto</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-700/50">Custo Individual</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-700/50 text-right">Total em Estoque</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {[...products].sort((a,b) => a.name.localeCompare(b.name)).map((product) => (
                    <tr key={product.id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-200 group-hover:text-emerald-400 transition-colors uppercase">{product.name}</div>
                        <div className="text-[10px] text-slate-500 font-medium uppercase">{product.category} | {product.stock} un</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-100 font-mono">
                          R$ {product.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-slate-300 font-bold">
                          R$ {(product.cost * product.stock).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-950/60">
                  <tr className="border-b border-slate-800/30">
                    <td className="px-6 py-4 text-slate-400 text-xs uppercase font-bold">Valor em Estoque (Parado)</td>
                    <td className="px-6 py-4 border-l border-slate-800/30"></td>
                    <td className="px-6 py-4 text-right text-lg text-amber-500 font-black">
                      R$ {productMetrics.totalStockValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-6 text-slate-200 text-sm uppercase font-black">Investimento Total (Histórico)</td>
                    <td className="px-6 py-6 border-l border-slate-800/30"></td>
                    <td className="px-6 py-6 text-right text-2xl text-blue-400 font-black drop-shadow-md">
                      R$ {productMetrics.totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
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