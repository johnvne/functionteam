
import React, { useState, useMemo, useContext } from 'react';
import { supabase } from '../../lib/supabase';
import { LucideLoader2, UserCircle, ShieldCheck, Lock, AlertCircle, Snowflake, Sparkles, TreePine, Gift, Coins, Heart } from 'lucide-react';
import { ThemeContext } from '../../../App';

interface LoginFormProps {
  onLoginSuccess: (user: any) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const { theme } = useContext(ThemeContext);
  const [employeeCode, setEmployeeCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isNoel = theme === 'noel';
  const isTet = theme === 'tet';

  const festiveConfig = useMemo(() => {
    if (isNoel) return {
      bg: 'bg-red-50',
      accent: 'bg-gradient-to-br from-red-700 to-red-900',
      shadow: 'shadow-red-200',
      button: 'bg-red-700 hover:bg-red-800 shadow-red-300',
      border: 'border-red-100',
      icon: <TreePine className="text-white w-10 h-10" />,
      tag: "Christmas Season 🎄",
      textColor: 'text-red-950',
      labelColor: 'text-gray-700'
    };
    if (isTet) return {
      bg: 'bg-[#fff5f5]',
      accent: 'bg-gradient-to-br from-red-700 via-red-800 to-amber-900',
      shadow: 'shadow-red-400',
      button: 'bg-red-700 hover:bg-red-800 shadow-red-400',
      border: 'border-amber-200',
      icon: <Gift className="text-yellow-400 w-10 h-10 animate-bounce" />,
      tag: "Lunar New Year 🧧 Team V1",
      textColor: 'text-red-950',
      labelColor: 'text-red-900'
    };
    return {
      bg: 'bg-slate-50',
      accent: 'bg-gradient-to-br from-indigo-700 to-blue-900',
      shadow: 'shadow-indigo-300',
      button: 'bg-indigo-700 hover:bg-indigo-800 shadow-indigo-300',
      border: 'border-gray-200',
      icon: <ShieldCheck className="text-white w-10 h-10" />,
      tag: "Manager V - Smart Infrastructure",
      textColor: 'text-indigo-950',
      labelColor: 'text-gray-800'
    };
  }, [isNoel, isTet]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        employeeCode,
        password,
      });

      if (error) {
        setError(error.message);
      } else if (data?.user) {
        localStorage.setItem('sb-session', JSON.stringify(data.session));
        onLoginSuccess(data.user);
      }
    } catch (err) {
      setError('Lỗi kết nối server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${festiveConfig.bg} flex items-center justify-center p-4 transition-colors duration-700 overflow-hidden relative`}>
      <div className={`absolute top-[-5%] left-[-5%] w-72 h-72 ${isTet ? 'bg-red-500/10' : 'bg-indigo-500/5'} rounded-full blur-3xl animate-pulse`}></div>
      <div className={`absolute bottom-[-5%] right-[-5%] w-[30rem] h-[30rem] ${isTet ? 'bg-amber-500/10' : 'bg-blue-500/5'} rounded-full blur-3xl animate-pulse`}></div>

      <div className="max-w-md w-full bg-white rounded-[3.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.2)] border-[6px] border-white overflow-hidden relative z-10 animate-zoom-in">
        <div className="p-10 pt-16 text-center">
          <div className={`mx-auto ${festiveConfig.accent} w-24 h-24 rounded-[2.5rem] flex items-center justify-center mb-10 shadow-2xl ${festiveConfig.shadow} rotate-6 hover:rotate-0 transition-all duration-500 border-4 border-white/20`}>
            {festiveConfig.icon}
          </div>
          <h2 className={`text-5xl font-black ${isTet ? 'text-red-950' : 'text-gray-900'} tracking-tighter uppercase italic leading-none drop-shadow-sm`}>Manager V</h2>
          <p className={`text-[10px] font-black uppercase tracking-[0.4em] mt-6 ${festiveConfig.textColor} opacity-90 flex items-center justify-center gap-3`}>
             <span className="w-6 h-[2px] bg-current opacity-20"></span>
             {festiveConfig.tag}
             <span className="w-6 h-[2px] bg-current opacity-20"></span>
          </p>
        </div>

        <div className="px-8 pb-16 md:px-14">
          <form onSubmit={handleLogin} className="space-y-7">
            <div className="space-y-2.5">
              <label className={`text-[11px] font-black uppercase tracking-widest ml-1 ${festiveConfig.labelColor}`}>Mã định danh</label>
              <div className="relative group">
                <UserCircle className={`absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 transition-colors ${isTet || isNoel ? 'group-focus-within:text-red-700' : 'group-focus-within:text-indigo-700'}`} />
                <input
                  type="text"
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value.toUpperCase())}
                  className={`w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent rounded-[2rem] text-sm font-black text-gray-900 focus:bg-white focus:ring-[12px] outline-none transition-all shadow-inner ${isTet || isNoel ? 'focus:border-red-600/30 focus:ring-red-500/5' : 'focus:border-indigo-600/30 focus:ring-indigo-500/5'}`}
                  placeholder="Mã nhân viên (V001...)"
                  required
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <label className={`text-[11px] font-black uppercase tracking-widest ml-1 ${festiveConfig.labelColor}`}>Mật khẩu truy cập</label>
              <div className="relative group">
                <Lock className={`absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 transition-colors ${isTet || isNoel ? 'group-focus-within:text-red-700' : 'group-focus-within:text-indigo-700'}`} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent rounded-[2rem] text-sm font-black text-gray-900 focus:bg-white focus:ring-[12px] outline-none transition-all shadow-inner ${isTet || isNoel ? 'focus:border-red-600/30 focus:ring-red-500/5' : 'focus:border-indigo-600/30 focus:ring-indigo-500/5'}`}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-5 bg-rose-50 text-rose-950 text-[10px] font-black uppercase tracking-[0.1em] rounded-[1.5rem] border-2 border-rose-200 flex items-center gap-4 animate-shake shadow-sm">
                <div className="bg-rose-200 p-2 rounded-xl text-rose-800 shrink-0"><AlertCircle className="w-5 h-5" /></div>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full ${festiveConfig.button} text-white font-black py-6 md:py-7 rounded-[2.5rem] shadow-2xl transition-all active:scale-[0.96] disabled:opacity-50 flex items-center justify-center gap-4 uppercase text-xs md:text-sm tracking-[0.3em] border-b-4 border-black/20`}
            >
              {loading ? <LucideLoader2 className="w-7 h-7 animate-spin" /> : 'Đăng nhập hệ thống'}
            </button>
          </form>
          {/* ... keeping other footer info ... */}
        </div>
      </div>
    </div>
  );
};
