
<<<<<<< HEAD
import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
=======
import React, { useState, useEffect, useCallback } from 'react';
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './src/components/layout/Sidebar';
import { Header } from './src/components/layout/Header';
import { LoginForm } from './src/components/auth/LoginForm';
import { DashboardStats } from './src/components/dashboard/DashboardStats';
import { EmployeeList } from './src/components/employees/EmployeeList';
import { ToolInventory } from './src/components/tools/ToolInventory';
import { RequestManager } from './src/components/requests/RequestManager';
import { HistoryLog } from './src/components/history/HistoryLog';
import { OvertimeRegistration } from './src/components/overtime/OvertimeRegistration';
import { generateManagerInsight } from './src/services/geminiService';
<<<<<<< HEAD
import { Bot, X, Send, Menu, Snowflake, Sparkles } from 'lucide-react';
import { supabase } from './src/lib/supabase';
import { User } from './types';

// Theme Context để quản lý giao diện toàn cục
type ThemeType = 'default' | 'noel' | 'tet';
interface ThemeContextType {
  theme: ThemeType;
  setTheme: (t: ThemeType) => void;
}
export const ThemeContext = createContext<ThemeContextType>({ theme: 'default', setTheme: () => {} });

const SeasonalEffects = () => {
  const { theme } = useContext(ThemeContext);
  const [particles, setParticles] = useState<{ id: number; left: number; duration: number; size: number; delay: number; opacity: number; type: 'petal' | 'sparkle' | 'snow' }[]>([]);

  useEffect(() => {
    if (theme === 'default') {
      setParticles([]);
      return;
    }

    // Tạo các hạt ban đầu
    const initialParticles = Array.from({ length: 30 }).map((_, i) => ({
      id: Math.random(),
      left: Math.random() * 100,
      duration: Math.random() * 10 + 8,
      size: theme === 'noel' ? Math.random() * 15 + 10 : Math.random() * 12 + 10,
      delay: Math.random() * -20,
      opacity: Math.random() * 0.5 + 0.3,
      type: theme === 'noel' ? 'snow' : (Math.random() > 0.4 ? 'petal' : 'sparkle') as any
    }));
    setParticles(initialParticles);

    const interval = setInterval(() => {
      setParticles(prev => {
        const newParticle = {
          id: Date.now() + Math.random(),
          left: Math.random() * 100,
          duration: Math.random() * 10 + 8,
          size: theme === 'noel' ? Math.random() * 15 + 10 : Math.random() * 12 + 10,
          delay: 0,
          opacity: Math.random() * 0.5 + 0.3,
          type: theme === 'noel' ? 'snow' : (Math.random() > 0.4 ? 'petal' : 'sparkle') as any
        };
        const next = [...prev, newParticle];
        if (next.length > 50) next.shift(); 
        return next;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [theme]);

  if (theme === 'default') return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 99 }}>
      {particles.map(p => (
        <div
          key={p.id}
          className={p.type === 'snow' ? 'snowflake' : (p.type === 'petal' ? 'petal' : 'sparkle-gold')}
          style={{
            left: `${p.left}vw`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            opacity: p.opacity,
            fontSize: p.type === 'snow' ? `${p.size}px` : undefined,
            width: p.type !== 'snow' ? (p.type === 'sparkle' ? `${p.size / 3}px` : `${p.size}px`) : undefined,
            height: p.type !== 'snow' ? (p.type === 'sparkle' ? `${p.size / 3}px` : `${p.size * 1.2}px`) : undefined,
          } as any}
        >
          {p.type === 'snow' ? '❄' : null}
        </div>
      ))}
    </div>
  );
};

const MainLayout: React.FC<{ children: React.ReactNode; user: User; onLogout: () => void }> = ({ children, user, onLogout }) => {
  const location = useLocation();
  const { theme } = useContext(ThemeContext);
=======
import { Bot, X, Send, Menu } from 'lucide-react';
import { supabase } from './src/lib/supabase';
import { User } from './types';

const MainLayout: React.FC<{ children: React.ReactNode; user: User; onLogout: () => void }> = ({ children, user, onLogout }) => {
  const location = useLocation();
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
  const [currentPath, setCurrentPath] = useState(location.pathname);
  const [showAiChat, setShowAiChat] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [pendingBorrowCount, setPendingBorrowCount] = useState(0);
  const [pendingOTCount, setPendingOTCount] = useState(0);

<<<<<<< HEAD
  const festiveClass = theme === 'noel' ? 'festive-christmas' : (theme === 'tet' ? 'festive-tet' : 'festive-default');

  useEffect(() => {
    setCurrentPath(location.pathname);
    setIsSidebarOpen(false);
    document.body.className = `${festiveClass}`;
  }, [location, festiveClass]);

  const fetchCounts = useCallback(async () => {
    if (!user) return;
    const isAdmin = user.role === 'admin';
    try {
      let borrowQuery = supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      if (!isAdmin) borrowQuery = borrowQuery.eq('user_id', user.id);
      const { count: bCount } = await borrowQuery;
      setPendingBorrowCount(bCount || 0);

      let otQuery = supabase.from('ot_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      if (!isAdmin) otQuery = otQuery.eq('user_id', user.id);
=======
  useEffect(() => {
    setCurrentPath(location.pathname);
    setIsSidebarOpen(false);
  }, [location]);

  const fetchCounts = useCallback(async () => {
    if (!user) return;
    
    const isAdmin = user.role === 'admin';
    
    try {
      // Truy vấn số lượng đơn mượn đồ đang chờ (pending)
      let borrowQuery = supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      if (!isAdmin) {
        borrowQuery = borrowQuery.eq('user_id', user.id);
      }
      const { count: bCount } = await borrowQuery;
      setPendingBorrowCount(bCount || 0);

      // Truy vấn số lượng đơn tăng ca đang chờ (nếu có logic pending)
      let otQuery = supabase.from('ot_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      if (!isAdmin) {
        otQuery = otQuery.eq('user_id', user.id);
      }
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
      const { count: oCount } = await otQuery;
      setPendingOTCount(oCount || 0);
    } catch (error) {
      console.error("Error fetching badge counts:", error);
    }
  }, [user]);

  useEffect(() => {
    fetchCounts();
<<<<<<< HEAD
    const handleRefresh = () => fetchCounts();
    window.addEventListener('refresh-counts', handleRefresh);
    const interval = setInterval(fetchCounts, 30000);
=======

    // Lắng nghe sự kiện tùy chỉnh để cập nhật badge ngay lập tức
    const handleRefresh = () => fetchCounts();
    window.addEventListener('refresh-counts', handleRefresh);

    // Polling định kỳ mỗi 15 giây để đảm bảo dữ liệu mới nhất
    const interval = setInterval(fetchCounts, 15000);
    
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
    return () => {
      window.removeEventListener('refresh-counts', handleRefresh);
      clearInterval(interval);
    };
  }, [fetchCounts]);

  const handleAiAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!aiQuery.trim()) return;
<<<<<<< HEAD
    setAiLoading(true);
    const context = `User Role: ${user.role}. System: Inventory and Overtime tracking. Current theme: ${theme}.`;
=======
    
    setAiLoading(true);
    const context = `User Role: ${user.role}.`;
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
    const result = await generateManagerInsight(context, aiQuery);
    setAiResponse(result || "Không có phản hồi.");
    setAiLoading(false);
  };

  return (
<<<<<<< HEAD
    <div className="flex min-h-screen transition-all duration-1000 bg-slate-50 relative">
=======
    <div className="flex min-h-screen bg-gray-50">
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
      <Sidebar 
        currentPath={currentPath} 
        onNavigate={(path) => window.location.hash = path} 
        onLogout={onLogout}
        userRole={user.role}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        pendingBorrowCount={pendingBorrowCount}
        pendingOTCount={pendingOTCount}
      />
      
      {isSidebarOpen && (
        <div 
<<<<<<< HEAD
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-sm transition-opacity"
=======
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <Header user={user} onMenuClick={() => setIsSidebarOpen(true)} />
<<<<<<< HEAD
        <main 
          key={location.pathname}
          className="flex-1 px-4 md:px-8 py-4 md:py-8 overflow-x-hidden page-transition"
        >
=======
        <main className="flex-1 p-4 md:p-8">
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
          {children}
        </main>
      </div>

<<<<<<< HEAD
      {/* AI Chat Bot UI Refined */}
=======
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
      <div className="fixed bottom-6 right-6 z-50">
        {!showAiChat ? (
          <button 
            onClick={() => setShowAiChat(true)}
<<<<<<< HEAD
            className={`w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center text-white transition-all transform hover:scale-110 active:scale-95 border-2 border-white/50 ${theme === 'tet' ? 'bg-gradient-to-tr from-red-600 to-amber-500' : 'bg-gradient-to-tr from-indigo-600 to-violet-500'}`}
=======
            className="w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full shadow-2xl flex items-center justify-center text-white hover:shadow-xl transition-all transform hover:scale-110 active:scale-95 border-4 border-white"
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
          >
            <Bot className="w-7 h-7" />
          </button>
        ) : (
<<<<<<< HEAD
          <div className="bg-white/95 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] w-[calc(100vw-2rem)] sm:w-[380px] flex flex-col border border-white overflow-hidden animate-zoom-in origin-bottom-right">
            <div className={`p-5 flex justify-between items-center text-white ${theme === 'tet' ? 'bg-gradient-to-r from-red-600 to-orange-500' : 'bg-gradient-to-r from-indigo-600 to-violet-600'}`}>
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-white/20 rounded-lg"><Bot className="w-4 h-4" /></div>
                <span className="font-bold text-xs uppercase tracking-wider">{theme === 'tet' ? 'Trợ lý Tết' : 'Trợ lý AI'}</span>
              </div>
              <button onClick={() => setShowAiChat(false)} className="hover:bg-white/20 p-1.5 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 h-80 md:h-[400px] overflow-y-auto bg-slate-50/50 leading-relaxed no-scrollbar">
              {!aiResponse && !aiLoading && (
                <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-4 opacity-70">
                   <div className="p-5 bg-white rounded-full shadow-sm"><Sparkles className="w-8 h-8 text-indigo-400" /></div>
                   <p className="text-center font-bold text-[10px] uppercase tracking-widest max-w-[200px]">Tôi có thể giúp gì cho bạn hôm nay?</p>
                </div>
              )}
              {aiLoading && (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                   <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                   <span className="text-[10px] font-black uppercase text-slate-400 animate-pulse">Đang suy nghĩ...</span>
                </div>
              )}
              {aiResponse && (
                <div className="prose prose-xs max-w-none text-slate-700 whitespace-pre-line font-medium bg-white p-5 rounded-2xl shadow-sm border border-slate-100 animate-zoom-in">
=======
          <div className="bg-white rounded-2xl shadow-2xl w-[calc(100vw-2rem)] sm:w-96 flex flex-col border border-gray-200 overflow-hidden animate-fade-in-up origin-bottom-right">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                <span className="font-semibold text-sm">Trợ lý Quản lý</span>
              </div>
              <button onClick={() => setShowAiChat(false)} className="hover:bg-white/20 p-1 rounded transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 h-64 overflow-y-auto bg-gray-50 text-sm">
              {!aiResponse && !aiLoading && (
                <p className="text-gray-500 text-center mt-20 italic">Hãy hỏi tôi về dữ liệu hệ thống...</p>
              )}
              {aiLoading && (
                <div className="flex items-center justify-center h-full">
                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              )}
              {aiResponse && (
                <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-line">
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
                  {aiResponse}
                </div>
              )}
            </div>

<<<<<<< HEAD
            <form onSubmit={handleAiAsk} className="p-5 border-t border-slate-100 bg-white flex gap-2">
=======
            <form onSubmit={handleAiAsk} className="p-3 border-t bg-white flex gap-2">
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
              <input 
                type="text" 
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
<<<<<<< HEAD
                placeholder="Tra cứu nhanh..."
                className="flex-1 px-5 py-3.5 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold outline-none"
=======
                placeholder="Hỏi trợ lý AI..."
                className="flex-1 px-3 py-2 border rounded-xl focus:outline-none focus:border-blue-500 text-sm shadow-inner"
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
              />
              <button 
                type="submit" 
                disabled={aiLoading}
<<<<<<< HEAD
                className={`p-3.5 rounded-xl text-white transition-all shadow-lg active:scale-90 ${theme === 'tet' ? 'bg-red-600' : 'bg-indigo-600'}`}
              >
                <Send className="w-5 h-5" />
=======
                className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md"
              >
                <Send className="w-4 h-4" />
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
<<<<<<< HEAD
  const [theme, setTheme] = useState<ThemeType>('default');
=======
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        setUser(data.session.user);
      }
      setLoading(false);
    };
    checkUser();
  }, []);

  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('sb-session');
    setUser(null);
  };

  if (loading) {
    return (
<<<<<<< HEAD
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-indigo-600/10 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] animate-pulse">Hệ thống đang sẵn sàng</p>
=======
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Đang tải hệ thống...</p>
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
        </div>
      </div>
    );
  }

  return (
<<<<<<< HEAD
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <SeasonalEffects />
      <HashRouter>
        <Routes>
          <Route path="/login" element={
            !user ? <LoginForm onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/dashboard" />
          } />
          
          <Route path="/dashboard" element={
            user ? <MainLayout user={user} onLogout={handleLogout}><DashboardStats /></MainLayout> : <Navigate to="/login" />
          } />
          
          <Route path="/employees" element={
            user ? (
               user.role === 'admin' ? (
                  <MainLayout user={user} onLogout={handleLogout}><EmployeeList /></MainLayout>
               ) : <Navigate to="/dashboard" />
            ) : <Navigate to="/login" />
          } />

          <Route path="/tools" element={
            user ? <MainLayout user={user} onLogout={handleLogout}><ToolInventory user={user} /></MainLayout> : <Navigate to="/login" />
          } />

          <Route path="/requests" element={
              user ? <MainLayout user={user} onLogout={handleLogout}><RequestManager user={user} /></MainLayout> : <Navigate to="/login" />
          } />

          <Route path="/history" element={
              user ? <MainLayout user={user} onLogout={handleLogout}><HistoryLog user={user} /></MainLayout> : <Navigate to="/login" />
          } />

          <Route path="/overtime" element={
              user ? <MainLayout user={user} onLogout={handleLogout}><OvertimeRegistration user={user} /></MainLayout> : <Navigate to="/login" />
          } />

          <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
        </Routes>
      </HashRouter>
    </ThemeContext.Provider>
=======
    <HashRouter>
      <Routes>
        <Route path="/login" element={
          !user ? <LoginForm onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/dashboard" />
        } />
        
        <Route path="/dashboard" element={
          user ? <MainLayout user={user} onLogout={handleLogout}><DashboardStats /></MainLayout> : <Navigate to="/login" />
        } />
        
        <Route path="/employees" element={
          user ? (
             user.role === 'admin' ? (
                <MainLayout user={user} onLogout={handleLogout}><EmployeeList /></MainLayout>
             ) : <Navigate to="/dashboard" />
          ) : <Navigate to="/login" />
        } />

        <Route path="/tools" element={
          user ? <MainLayout user={user} onLogout={handleLogout}><ToolInventory user={user} /></MainLayout> : <Navigate to="/login" />
        } />

        <Route path="/requests" element={
            user ? <MainLayout user={user} onLogout={handleLogout}><RequestManager user={user} /></MainLayout> : <Navigate to="/login" />
        } />

        <Route path="/history" element={
            user ? <MainLayout user={user} onLogout={handleLogout}><HistoryLog user={user} /></MainLayout> : <Navigate to="/login" />
        } />

        <Route path="/overtime" element={
            user ? <MainLayout user={user} onLogout={handleLogout}><OvertimeRegistration user={user} /></MainLayout> : <Navigate to="/login" />
        } />

        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      </Routes>
    </HashRouter>
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
  );
};

export default App;
