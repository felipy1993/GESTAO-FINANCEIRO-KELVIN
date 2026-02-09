import React, { useState, useEffect } from 'react';
import { auth } from '../services/firebase';
import { 
  signInWithEmailAndPassword
} from 'firebase/auth';
import { LogIn, Lock, User, Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: () => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, showToast }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Carregar usuário lembrado
  useEffect(() => {
    const savedUser = localStorage.getItem('remembered_user');
    if (savedUser) {
      setUsername(savedUser);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const virtualEmail = `${username.trim().toLowerCase()}@kelvin.com`;

    try {
      await signInWithEmailAndPassword(auth, virtualEmail, password);
      
      if (rememberMe) {
        localStorage.setItem('remembered_user', username);
      } else {
        localStorage.removeItem('remembered_user');
      }

      showToast('success', 'Acesso autorizado. Bem-vindo!');
      onLoginSuccess();
    } catch (error: any) {
      console.error(error);
      let message = 'Acesso negado. Verifique suas credenciais.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') message = 'Nome ou senha incorretos.';
      
      showToast('error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Elementos Decorativos de Fundo */}
      <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none"></div>

      <div className="w-full max-w-[440px] z-10">
        {/* Card Principal com Glassmorphism Pesado */}
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] relative group overflow-hidden">
          
          {/* Brilho na borda superior */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent"></div>

          <div className="flex flex-col items-center mb-10">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full animate-pulse"></div>
              <div className="w-24 h-24 bg-slate-950 rounded-[2rem] flex items-center justify-center shadow-2xl border border-white/10 relative z-10 transform transition-transform group-hover:scale-105 duration-500">
                <img src="/logo.png" alt="Logo" className="w-16 h-16 object-contain" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-slate-950 p-1.5 rounded-lg shadow-lg z-20">
                <ShieldCheck size={18} strokeWidth={3} />
              </div>
            </div>
            
            <h1 className="text-3xl font-black tracking-tight text-white mb-2">
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">FINANCEIRO</span> KELVIN
            </h1>
            <p className="text-slate-400 text-sm font-medium tracking-wide">GESTÃO ESTRATÉGICA ATIVADA</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Identificação</label>
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-4 flex items-center text-slate-500 group-focus-within/input:text-emerald-400 transition-colors">
                  <User size={20} />
                </div>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950/60 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-300"
                  placeholder="Nome de usuário"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Chave de Acesso</label>
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-4 flex items-center text-slate-500 group-focus-within/input:text-emerald-400 transition-colors">
                  <Lock size={20} />
                </div>
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/5 rounded-2xl py-4 pl-12 pr-12 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-300"
                  placeholder="••••••••"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-4 flex items-center text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-3 cursor-pointer group/check">
                <div className="relative flex items-center">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <div className="w-5 h-5 bg-slate-950 border border-white/10 rounded-md peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all duration-300"></div>
                  <svg className="absolute w-3.5 h-3.5 text-slate-900 hidden peer-checked:block left-[3px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm text-slate-400 group-hover/check:text-slate-200 transition-colors">Lembrar-me</span>
              </label>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full relative group/btn overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500 group-hover/btn:scale-110"></div>
              <div className="relative bg-transparent hover:bg-black/5 flex items-center justify-center gap-3 py-4 rounded-2xl text-slate-950 font-black uppercase tracking-widest text-sm shadow-[0_10px_30px_-10px_rgba(16,185,129,0.5)] transition-all">
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    Acessar Sistema
                    <LogIn size={20} strokeWidth={3} className="group-hover/btn:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </button>
          </form>
        </div>
        
        <div className="mt-10 flex flex-col items-center gap-2">
          <div className="flex items-center gap-4 text-slate-500">
            <div className="h-[1px] w-8 bg-slate-800"></div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em]">Ambiente Seguro</p>
            <div className="h-[1px] w-8 bg-slate-800"></div>
          </div>
          <p className="text-slate-600 text-[10px] font-medium tracking-tight">
            PLATAFORMA KELVIN PRO 2026 &copy; TODOS OS RECURSOS MONITORADOS
          </p>
        </div>
      </div>
    </div>
  );
};
