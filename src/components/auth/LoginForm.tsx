
import React, { useState, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { LucideLoader2, UserCircle, ShieldCheck, Lock, AlertCircle, Snowflake, Sparkles, TreePine, Gift } from 'lucide-react';

interface LoginFormProps {
  onLoginSuccess: (user: any) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [employeeCode, setEmployeeCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const month = new Date().getMonth();
  const isNoel = month === 11;
  const isTet = month === 0 || month === 1;

  const festiveConfig = useMemo(() => {
    if (isNoel) return {
      bg: 'bg-red-50',
      accent: 'bg-red-600',
      shadow: 'shadow-red-200',
      button: 'bg-red-600 hover:bg-red-700 shadow-red-100',
      border: 'border-red-100',
      icon: <TreePine className="text-white w-8 h-8" />,
      tag: "Christmas Season ❄️"
    };
    if (isTet) return {
      bg: 'bg-orange-50',
      accent: 'bg-red-700',
      shadow: 'shadow-red-200',
      button: 'bg-red-700 hover:bg-red-800 shadow-red-100',
      border: 'border-orange-100',
      icon: <Sparkles className="text-white w-8 h-8" />,
      tag: "Lunar New Year 🧧"
    };
    return {
      bg: 'bg-gray-50',
      accent: 'bg-blue-600',
      shadow: 'shadow-blue-200',
      button: 'bg-blue-600 hover:bg-blue-700 shadow-blue-100',
      border: 'border-gray-100',
      icon: <ShieldCheck className="text-white w-8 h-8" />,
      tag: "Hệ thống quản lý công cụ & nhân sự"
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
    <div className={`min-h-screen ${festiveConfig.bg} flex items-center justify-center p-4 transition-colors duration-500 overflow-hidden relative`}>
      {/* Decorative Floating Icons */}
      {isNoel && <div className="absolute top-10 left-10 text-red-100"><Snowflake size={120} /></div>}
      {isTet && <div className="absolute top-10 left-10 text-orange-100"><Gift size={120} /></div>}

      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl border border-white/50 overflow-hidden relative z-10 animate-zoom-in">
        <div className="p-10 text-center">
          <div className={`mx-auto ${festiveConfig.accent} w-20 h-20 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl ${festiveConfig.shadow} rotate-6 hover:rotate-0 transition-transform`}>
            {festiveConfig.icon}
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">Manager Tool</h2>
          <p className={`text-[10px] font-black uppercase tracking-[0.2em] mt-2 ${isNoel || isTet ? 'text-red-500' : 'text-gray-400'}`}>
            {festiveConfig.tag}
          </p>
        </div>

        <div className="px-10 pb-12">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mã nhân viên</label>
              <div className="relative group">
                <UserCircle className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5 group-focus-within:text-red-500 transition-colors" />
                <input
                  type="text"
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value.toUpperCase())}
                  className="w-full pl-14 pr-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-red-500/20 focus:ring-4 focus:ring-red-500/5 outline-none transition-all shadow-inner"
                  placeholder="VD: VT008010"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mật khẩu bảo mật</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5 group-focus-within:text-red-500 transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-red-500/20 focus:ring-4 focus:ring-red-500/5 outline-none transition-all shadow-inner"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-2xl border border-red-100 flex items-center gap-3 animate-shake">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full ${festiveConfig.button} text-white font-black py-5 rounded-[2rem] shadow-2xl transition-all active:scale-[0.95] disabled:opacity-50 flex items-center justify-center gap-3 uppercase text-xs tracking-[0.2em] border-b-4 border-black/20`}
            >
              {loading ? <LucideLoader2 className="w-5 h-5 animate-spin" /> : 'Xác nhận truy cập'}
            </button>
          </form>
          <p className="text-center text-[9px] text-gray-300 font-bold uppercase tracking-widest mt-8">Manager Tool Team v1.0 • 2024</p>
        </div>
      </div>
    </div>
  );
};
