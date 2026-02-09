import React, { useState, useMemo } from 'react';
import { Users, Phone, FileText, Plus, Trash2, Edit2, Search, X, MapPin, Loader2 } from 'lucide-react';
import { Customer } from '../types';

interface CustomersProps {
  customers: Customer[];
  onAddCustomer: (c: Omit<Customer, 'id' | 'createdAt'>) => void;
  onUpdateCustomer: (id: string, c: Partial<Customer>) => void;
  onDeleteCustomer: (id: string) => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

const BRAZIL_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export const Customers: React.FC<CustomersProps> = ({ customers, onAddCustomer, onUpdateCustomer, onDeleteCustomer, showToast }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  const [formData, setFormData] = useState({ 
    name: '', 
    phone: '', 
    cep: '',
    address: '',
    number: '',
    city: '',
    state: '',
    notes: '' 
  });

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.city || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customers, searchTerm]);

  const handleEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      cep: customer.cep || '',
      address: customer.address || '',
      number: customer.number || '',
      city: customer.city || '',
      state: customer.state || '',
      notes: customer.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({ 
      name: '', 
      phone: '', 
      cep: '',
      address: '',
      number: '',
      city: '',
      state: '',
      notes: '' 
    });
    setIsModalOpen(true);
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');

    // Máscara visual 00000-000
    if (numbers.length > 5) {
      value = numbers.substring(0, 5) + '-' + numbers.substring(5, 8);
    } else {
      value = numbers;
    }

    setFormData(prev => ({ ...prev, cep: value }));

    // Se tiver 8 dígitos, busca na API
    if (numbers.length === 8) {
      setIsLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${numbers}/json/`);
        const data = await response.json();

        if (data.erro) {
          showToast('error', 'CEP não encontrado.');
        } else {
          setFormData(prev => ({
            ...prev,
            address: data.logradouro,
            city: data.localidade,
            state: data.uf,
            // Adicionamos o bairro nas observações se quiser, ou ignoramos
          }));
          showToast('success', 'Endereço encontrado!');
        }
      } catch (error) {
        console.error(error);
        showToast('error', 'Erro ao buscar CEP. Verifique a conexão.');
      } finally {
        setIsLoadingCep(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onUpdateCustomer(editingId, formData);
    } else {
      onAddCustomer(formData);
    }
    setIsModalOpen(false);
  };

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone) {
      window.open(`https://wa.me/55${cleanPhone}`, '_blank');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-100">Clientes</h2>
          <p className="text-slate-400">Gerencie sua base de clientes</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
             <input 
              type="text" 
              placeholder="Buscar por nome, tel ou cidade..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <button 
            onClick={handleAddNew}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 font-medium whitespace-nowrap"
          >
            <Plus size={20} />
            <span className="hidden md:inline">Adicionar</span>
          </button>
        </div>
      </div>

      {customers.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
          <Users size={48} className="mx-auto text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-300">Nenhum cliente cadastrado</h3>
          <p className="text-slate-500 mb-4">Adicione clientes para agilizar suas vendas e entregas.</p>
          <button onClick={handleAddNew} className="text-emerald-400 hover:text-emerald-300 font-medium">
            Cadastrar primeiro cliente
          </button>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-12">
           <p className="text-slate-500">Nenhum cliente encontrado para "{searchTerm}"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map(customer => (
            <div key={customer.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl hover:border-slate-600 transition-all group relative">
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleEdit(customer)}
                  className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Edit2 size={16} />
                </button>
                 <button 
                  onClick={() => {
                    if(window.confirm('Tem certeza que deseja excluir?')) onDeleteCustomer(customer.id);
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-800 rounded-lg transition-colors"
                  title="Excluir"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/20 shrink-0">
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100 line-clamp-1">{customer.name}</h3>
                  <p className="text-xs text-slate-500">Cliente desde {new Date(customer.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div 
                  className="flex items-center gap-3 text-slate-400 text-sm bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/50 cursor-pointer hover:bg-slate-800 transition-colors"
                  onClick={() => openWhatsApp(customer.phone)}
                  title="Abrir WhatsApp"
                >
                  <Phone size={16} className="text-emerald-500" />
                  <span className="flex-1">{customer.phone || 'Sem WhatsApp'}</span>
                </div>
                
                {(customer.address || customer.city) && (
                  <div className="flex items-start gap-3 text-slate-400 text-sm bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/50">
                    <MapPin size={16} className="mt-0.5 shrink-0 text-slate-500" />
                    <div>
                      {customer.address && <span className="block">{customer.address}, {customer.number}</span>}
                      {customer.city && <span className="block text-xs text-slate-500">{customer.city} - {customer.state}</span>}
                      {customer.cep && <span className="block text-xs text-slate-600 mt-1">CEP: {customer.cep}</span>}
                    </div>
                  </div>
                )}

                {customer.notes && (
                  <div className="flex items-start gap-3 text-slate-400 text-sm bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/50">
                    <FileText size={16} className="mt-0.5 shrink-0 text-slate-500" />
                    <span className="line-clamp-2">{customer.notes}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

       {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-100">
                {editingId ? 'Editar Cliente' : 'Novo Cliente'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-300">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4">
              {/* Dados Pessoais */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-emerald-500 uppercase tracking-wider">Dados Pessoais</h4>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Nome Completo</label>
                  <input 
                    required
                    autoFocus
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: Maria Silva"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">WhatsApp / Telefone</label>
                  <input 
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    placeholder="(00) 90000-0000"
                  />
                </div>
              </div>

              {/* Endereço */}
              <div className="space-y-4 pt-2">
                <h4 className="text-sm font-bold text-emerald-500 uppercase tracking-wider">Endereço</h4>
                <div className="grid grid-cols-3 gap-3">
                   <div className="col-span-1 relative">
                    <label className="block text-sm text-slate-400 mb-1">CEP</label>
                    <div className="relative">
                      <input 
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none"
                        value={formData.cep}
                        onChange={handleCepChange}
                        placeholder="00000-000"
                        maxLength={9}
                      />
                      {isLoadingCep && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 size={16} className="animate-spin text-emerald-500" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="col-span-2">
                     <label className="block text-sm text-slate-400 mb-1">Cidade</label>
                     <input 
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none"
                      value={formData.city}
                      onChange={e => setFormData({...formData, city: e.target.value})}
                      placeholder="Cidade"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div className="col-span-3">
                    <label className="block text-sm text-slate-400 mb-1">Logradouro / Rua</label>
                    <input 
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none"
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                      placeholder="Nome da Rua"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-sm text-slate-400 mb-1">Número</label>
                    <input 
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none"
                      value={formData.number}
                      onChange={e => setFormData({...formData, number: e.target.value})}
                      placeholder="Nº"
                    />
                  </div>
                </div>

                 <div>
                    <label className="block text-sm text-slate-400 mb-1">Estado (UF)</label>
                    <select 
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none"
                      value={formData.state}
                      onChange={e => setFormData({...formData, state: e.target.value})}
                    >
                      <option value="">Selecione...</option>
                      {BRAZIL_STATES.map(uf => (
                        <option key={uf} value={uf}>{uf}</option>
                      ))}
                    </select>
                  </div>
              </div>

              {/* Obs */}
              <div className="pt-2">
                <label className="block text-sm text-slate-400 mb-1">Observações</label>
                <textarea 
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none h-20 resize-none"
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  placeholder="Ponto de referência, preferências..."
                />
              </div>

              <div className="pt-4 flex gap-3">
                 <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20"
                >
                  {editingId ? 'Salvar Alterações' : 'Salvar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};