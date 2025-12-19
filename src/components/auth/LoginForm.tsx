
import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { LucideLayoutDashboard, LucideLoader2, UserCircle } from 'lucide-react';

interface LoginFormProps {
  onLoginSuccess: (user: any) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [employeeCode, setEmployeeCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Gọi hàm mock signInWithPassword nhưng truyền employeeCode
      const { data, error } = await supabase.auth.signInWithPassword({
        employeeCode,
        password,
      });

      if (error) {
        setError(error.message);
      } else if (data?.user) {
        // Lưu session giả
        localStorage.setItem('sb-session', JSON.stringify(data.session));
        onLoginSuccess(data.user);
      }
    } catch (err) {
      setError('Đã xảy ra lỗi không mong muốn.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-blue-800 p-8 text-center relative overflow-hidden">
            {/* Decoration */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-[-50px] left-[-50px] w-32 h-32 bg-white rounded-full"></div>
                <div className="absolute bottom-[-30px] right-[-30px] w-24 h-24 bg-white rounded-full"></div>
            </div>

          <div className="mx-auto bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm border border-white/30 shadow-lg relative z-10">
            <LucideLayoutDashboard className="text-white w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-1 relative z-10">Manager Tool</h2>
          <p className="text-blue-200 text-sm relative z-10">Hệ thống quản lý nội bộ</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Mã nhân viên</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserCircle className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value.toUpperCase())}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all uppercase placeholder:normal-case text-gray-900 shadow-sm"
                  placeholder="Nhập mã NV..."
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Mật khẩu</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 shadow-sm"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3.5 px-4 rounded-lg transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-700/30"
            >
              {loading ? (
                <>
                  <LucideLoader2 className="w-5 h-5 animate-spin mr-2" />
                  Đang xác thực...
                </>
              ) : (
                'Đăng nhập hệ thống'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
