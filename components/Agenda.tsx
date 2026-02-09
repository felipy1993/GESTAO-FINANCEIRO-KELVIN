import React, { useState, useMemo } from 'react';
import { 
  CalendarDays, Plus, Clock, MapPin, User, FileText, 
  Trash2, CheckCircle, X, ChevronRight, AlertCircle 
} from 'lucide-react';
import { Appointment, Customer, AppointmentStatus } from '../types';

interface AgendaProps {
  appointments: Appointment[];
  customers: Customer[];
  onAddAppointment: (apt: Omit<Appointment, 'id'>) => void;
  onUpdateAppointment: (id: string, apt: Partial<Appointment>) => void;
  onDeleteAppointment: (id: string) => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const Agenda: React.FC<AgendaProps> = ({ 
  appointments, 
  customers, 
  onAddAppointment, 
  onUpdateAppointment, 
  onDeleteAppointment, 
  showToast 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState<string>(''); // Empty = All upcoming

  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '12:00',
    customerId: '',
    notes: '',
    status: 'SCHEDULED' as AppointmentStatus
  });

  // Sort and group appointments
  const groupedAppointments = useMemo(() => {
    const sorted = [...appointments].sort((a, b) => {
      // Compare dates first, then times
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    });

    const groups: Record<string, Appointment[]> = {};
    const today = new Date().toISOString().split('T')[0];

    sorted.forEach(apt => {
      if (filterDate && apt.date !== filterDate) return;
      
      let groupKey = apt.date;
      if (apt.date === today) groupKey = 'Hoje';
      
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(apt);
    });

    return groups;
  }, [appointments, filterDate]);

  const handleEdit = (apt: Appointment) => {
    setEditingId(apt.id);
    setFormData({
      title: apt.title,
      date: apt.date,
      time: apt.time,
      customerId: apt.customerId || '',
      notes: apt.notes || '',
      status: apt.status
    });
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({
      title: '',
      date: new Date().toISOString().split('T')[0],
      time: '09:00',
      customerId: '',
      notes: '',
      status: 'SCHEDULED'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Find customer name if ID is selected
    const customer = customers.find(c => c.id === formData.customerId);
    
    const appointmentData = {
      title: formData.title,
      date: formData.date,
      time: formData.time,
      customerId: formData.customerId,
      customerName: customer ? customer.name : undefined,
      notes: formData.notes,
      status: formData.status
    };

    if (editingId) {
      onUpdateAppointment(editingId, appointmentData);
    } else {
      onAddAppointment(appointmentData);
    }
    setIsModalOpen(false);
  };

  const toggleStatus = (apt: Appointment) => {
    const newStatus = apt.status === 'SCHEDULED' ? 'COMPLETED' : 'SCHEDULED';
    onUpdateAppointment(apt.id, { status: newStatus });
    showToast('info', newStatus === 'COMPLETED' ? 'Compromisso concluído!' : 'Compromisso reaberto.');
  };

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case 'COMPLETED': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'CANCELLED': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-100 drop-shadow-md">Agenda</h2>
          <p className="text-slate-400">Organize seus compromissos e visitas</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <input 
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 outline-none focus:border-emerald-500 shadow-inner"
          />
          <button 
            onClick={handleAddNew}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-[0_10px_20px_-5px_rgba(16,185,129,0.4)] font-medium whitespace-nowrap active:scale-95 transition-transform border-t border-emerald-400"
          >
            <Plus size={20} />
            <span className="hidden md:inline">Novo Compromisso</span>
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {Object.keys(groupedAppointments).length === 0 ? (
           <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
            <CalendarDays size={48} className="mx-auto text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-slate-300">Nenhum compromisso encontrado</h3>
            <p className="text-slate-500 mb-4">Adicione tarefas ou visitas à sua agenda.</p>
            <button onClick={handleAddNew} className="text-emerald-400 hover:text-emerald-300 font-medium">
              Agendar agora
            </button>
          </div>
        ) : (
          Object.entries(groupedAppointments).map(([dateLabel, groupItems]: [string, Appointment[]]) => (
            <div key={dateLabel} className="space-y-4">
              <div className="flex items-center gap-4">
                <h3 className="text-xl font-bold text-slate-200 capitalize">
                  {dateLabel === 'Hoje' ? 'Hoje' : new Date(dateLabel + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h3>
                <div className="h-px flex-1 bg-gradient-to-r from-slate-800 to-transparent"></div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {groupItems.map((apt: Appointment) => (
                  <div 
                    key={apt.id} 
                    className={`relative p-5 rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900 to-slate-950 shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all group overflow-hidden ${apt.status === 'COMPLETED' ? 'opacity-60' : 'opacity-100'}`}
                  >
                     {/* 3D Highlight */}
                     <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-700 to-transparent opacity-50"></div>
                     <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-2xl -mr-16 -mt-16 rounded-full pointer-events-none"></div>

                     <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                        {/* Time Box */}
                        <div className={`p-3 rounded-xl border flex flex-col items-center justify-center min-w-[80px] ${getStatusColor(apt.status)}`}>
                           <Clock size={18} className="mb-1" />
                           <span className="font-bold text-lg">{apt.time}</span>
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                           <h4 className={`text-lg font-bold mb-1 ${apt.status === 'CANCELLED' ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                             {apt.title}
                           </h4>
                           
                           <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                              {apt.customerName && (
                                <div className="flex items-center gap-1">
                                  <User size={14} className="text-emerald-500" />
                                  <span>{apt.customerName}</span>
                                </div>
                              )}
                              {apt.notes && (
                                <div className="flex items-center gap-1">
                                  <FileText size={14} className="text-blue-500" />
                                  <span className="truncate max-w-[200px]">{apt.notes}</span>
                                </div>
                              )}
                           </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                           <button 
                             onClick={() => toggleStatus(apt)}
                             className={`p-2 rounded-lg transition-colors ${apt.status === 'COMPLETED' ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10'}`}
                             title={apt.status === 'COMPLETED' ? 'Reabrir' : 'Concluir'}
                           >
                             <CheckCircle size={20} />
                           </button>
                           <button 
                             onClick={() => handleEdit(apt)}
                             className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                             title="Editar"
                           >
                             <ChevronRight size={20} />
                           </button>
                           <button 
                             onClick={() => {
                               if(window.confirm('Excluir este compromisso?')) onDeleteAppointment(apt.id);
                             }}
                             className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                             title="Excluir"
                           >
                             <Trash2 size={20} />
                           </button>
                        </div>
                     </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-100">
                {editingId ? 'Editar Compromisso' : 'Novo Compromisso'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-300">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Título / Assunto</label>
                <input 
                  required
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:border-emerald-500 focus:outline-none shadow-inner"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value.toUpperCase()})}
                  placeholder="Ex: Visita Cobrança, Entrega..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm text-slate-400 mb-1">Data</label>
                    <input 
                      required
                      type="date"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:border-emerald-500 focus:outline-none shadow-inner"
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-sm text-slate-400 mb-1">Hora</label>
                    <input 
                      required
                      type="time"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:border-emerald-500 focus:outline-none shadow-inner"
                      value={formData.time}
                      onChange={e => setFormData({...formData, time: e.target.value})}
                    />
                 </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Cliente (Opcional)</label>
                <select 
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:border-emerald-500 focus:outline-none shadow-sm"
                  value={formData.customerId}
                  onChange={e => setFormData({...formData, customerId: e.target.value})}
                >
                  <option value="">Selecione...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Notas</label>
                <textarea 
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:border-emerald-500 focus:outline-none h-24 resize-none shadow-inner"
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value.toUpperCase()})}
                  placeholder="Detalhes adicionais..."
                />
              </div>

              {editingId && (
                <div>
                   <label className="block text-sm text-slate-400 mb-1">Status</label>
                   <div className="flex gap-2">
                      {(['SCHEDULED', 'COMPLETED', 'CANCELLED'] as const).map(s => (
                        <button
                          type="button"
                          key={s}
                          onClick={() => setFormData({...formData, status: s})}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold border ${formData.status === s ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400' : 'border-slate-700 bg-slate-900 text-slate-500'}`}
                        >
                          {s === 'SCHEDULED' ? 'Agendado' : s === 'COMPLETED' ? 'Concluído' : 'Cancelado'}
                        </button>
                      ))}
                   </div>
                </div>
              )}

              <div className="pt-4 flex gap-3">
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
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};