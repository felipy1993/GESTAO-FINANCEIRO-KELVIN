import React, { useState } from 'react';
import { auth } from '../services/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail 
} from 'firebase/auth';
import { LogIn, UserPlus, Lock, Mail, Loader2, Wallet } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: () => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, showToast }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (forgotPassword) {
        await sendPasswordResetEmail(auth, email);
        showToast('success', 'E-mail de recuperação enviado!');
        setForgotPassword(false);
      } else if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        showToast('success', 'Bem-vindo de volta!');
        onLoginSuccess();
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        showToast('success', 'Conta criada com sucesso!');
        onLoginSuccess();
      }
    } catch (error: any) {
      console.error(error);
      let message = 'Ocorreu um erro. Tente novamente.';
      if (error.code === 'auth/user-not-found') message = 'Usuário não encontrado.';
      if (error.code === 'auth/wrong-password') message = 'Senha incorreta.';
      if (error.code === 'auth/email-already-in-use') message = 'Este e-mail já está em uso.';
      if (error.code === 'auth/invalid-credential') message = 'Credenciais inválidas.';
      
      showToast('error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-md z-10">
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4 transform transition-transform hover:rotate-6">
              <Wallet className="text-slate-900" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-100">Financeiro Kelvin</h1>
            <p className="text-slate-400 text-sm">{forgotPassword ? 'Recupere sua conta' : isLogin ? 'Acesse sua conta' : 'Crie sua conta'}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">E-mail</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            {!forgotPassword && (
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Senha</label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={18} />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-900 font-bold py-3 rounded-xl shadow-lg shadow-emerald-900/20 transition-all active:scale-95 flex items-center justify-center gap-2 group"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  {forgotPassword ? 'Enviar Link' : isLogin ? 'Entrar' : 'Cadastrar'}
                  {isLogin ? <LogIn size={18} className="group-hover:translate-x-1 transition-transform" /> : <UserPlus size={18} />}
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800 space-y-4 text-center">
            {forgotPassword ? (
              <button 
                onClick={() => setForgotPassword(false)}
                className="text-sm text-slate-400 hover:text-emerald-400 transition-colors font-medium"
              >
                Voltar para o Login
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-slate-400 hover:text-emerald-400 transition-colors font-medium"
                >
                  {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça Login'}
                </button>
                <button 
                  onClick={() => setForgotPassword(true)}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Esqueceu sua senha?
                </button>
              </div>
            )}
          </div>
        </div>
        
        <p className="text-center mt-8 text-slate-600 text-xs">
          Gestão Financeira Kelvin &copy; 2026 - PWA Habilitado
        </p>
      </div>
    </div>
  );
};
