import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X, Volume2, VolumeX } from 'lucide-react';
import { ToastMessage } from '../../types';

// Sound Service
export const playNotificationSound = (type: 'success' | 'error' | 'info' | 'alert') => {
  const isEnabled = localStorage.getItem('financeiro_kelvin_sound') !== 'false';
  if (!isEnabled) return;

  try {
    let url = '';
    switch(type) {
      case 'success': url = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'; break;
      case 'error': url = 'https://assets.mixkit.co/active_storage/sfx/2870/2870-preview.mp3'; break;
      case 'alert': url = 'https://assets.mixkit.co/active_storage/sfx/1003/1003-preview.mp3'; break;
      default: url = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';
    }
    const audio = new Audio(url);
    audio.volume = 0.4;
    audio.play().catch(() => { /* Silent fail if interaction required */ });
  } catch (e) {
    console.error("Sound error", e);
  }
};

interface ToastProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, removeToast }) => {
  const [soundEnabled, setSoundEnabled] = React.useState(localStorage.getItem('financeiro_kelvin_sound') !== 'false');

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    localStorage.setItem('financeiro_kelvin_sound', newState.toString());
  };

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
    // playNotificationSound(toast.type); // Som desativado conforme solicitado
    const timer = setTimeout(() => {
      onRemove();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove, toast.type]);

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