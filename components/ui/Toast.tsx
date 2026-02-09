import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { ToastMessage } from '../../types';

interface ToastProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onRemove: () => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const icons = {
    success: <CheckCircle className="text-emerald-400" size={20} />,
    error: <AlertCircle className="text-rose-400" size={20} />,
    info: <Info className="text-blue-400" size={20} />,
  };

  const bgColors = {
    success: 'bg-slate-900 border-emerald-500/30',
    error: 'bg-slate-900 border-rose-500/30',
    info: 'bg-slate-900 border-blue-500/30',
  };

  return (
    <div className={`flex items-center gap-3 min-w-[300px] p-4 rounded-xl border shadow-xl shadow-black/50 animate-in slide-in-from-right-full transition-all ${bgColors[toast.type]}`}>
      {icons[toast.type]}
      <p className="text-slate-200 text-sm font-medium flex-1">{toast.message}</p>
      <button onClick={onRemove} className="text-slate-500 hover:text-slate-300">
        <X size={16} />
      </button>
    </div>
  );
};