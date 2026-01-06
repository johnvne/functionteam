
import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
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
import { Bot, X, Send, Menu, Snowflake, Sparkles } from 'lucide-react';
import { supabase } from './src/lib/supabase';
import { User } from './types';

// Theme Context để quản lý giao diện toàn cục
type ThemeType = 'default' | 'noel' | 'tet';
interface ThemeContextType {
  theme: ThemeType;
  setTheme: (t: ThemeType) => void;
}
export const ThemeContext = createContext<ThemeContextType>({ theme: 'tet', setTheme: () => {} });

const SeasonalEffects = () => {
  const { theme } = useContext(ThemeContext);
  const [particles, setParticles] = useState<{ id: number; left: number; duration: number; size: number; delay: number; type: 'petal' | 'sparkle' | 'snow' }[]>([]);

  useEffect(() => {
    if (theme === 'default') {
      setParticles([]);
      return;
    }

    const initialParticles = Array.from({ length: 45 }).map((_, i) => ({
      id: Math.random(),
      left: Math.random() * 100,
      duration: Math.random() * 14 + 10, // Rơi chậm hơn như bông tuyết
      size: theme === 'noel' ? Math.random() * 10 + 10 : (Math.random() * 14 + 10),
      delay: Math.random() * -25,
      type: theme === 'noel' ? 'snow' : (Math.random() > 0.35 ? 'petal' : 'sparkle') as any
    }));
    setParticles(initialParticles);

    const interval = setInterval(() => {
      setParticles(prev => {
        const newParticle = {
          id: Date.now() + Math.random(),
          left: Math.random() * 100,
          duration: Math.random() * 14 + 10,
          size: theme === 'noel' ? Math.random() * 10 + 10 : (Math.random() * 14 + 10),
          delay: 0,
          type: theme === 'noel' ? 'snow' : (Math.random() > 0.35 ? 'petal' : 'sparkle') as any
        };
        const next = [...prev, newParticle];
        if (next.length > 70) next.shift(); 
        return next;
      });
    }, 900);

    return () => clearInterval(interval);
  }, [theme]);

  if (theme === 'default') return null;

  return (
    <div className={theme === 'noel' ? 'snow-container' : 'blossom-container'}>
      {particles.map(p => (
        <div
          key={p.id}
          className={p.type === 'snow' ? 'snowflake' : (p.type === 'petal' ? 'petal' : 'sparkle-gold')}
          style={{
            left: `${p.left}vw`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            fontSize: p.type === 'snow' ? `${p.size}px` : undefined,
            width: p.type !== 'snow' ? (p.type === 'sparkle' ? `${p.size / 4}px` : `${p.size}px`) : undefined,
            height: p.type !== 'snow' ? (p.type === 'sparkle' ? `${p.size / 4}px` : `${p.size * 1.2}px`) : undefined,
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
  const [currentPath, setCurrentPath] = useState(location.pathname);
  const [showAiChat, setShowAiChat] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [pendingBorrowCount, setPendingBorrowCount] = useState(0);
  const [pendingOTCount, setPendingOTCount] = useState(0);

  const festiveClass = theme === 'noel' ? 'festive-christmas' : (theme === 'tet' ? 'festive-tet' : 'festive-default');

  useEffect(() => {
    setCurrentPath(location.pathname);
    setIsSidebarOpen(false);
    document.body.className = `bg-gray-50 text-gray-900 ${festiveClass}`;
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
      const { count: oCount } = await otQuery;
      setPendingOTCount(oCount || 0);
    } catch (error) {
      console.error("Error fetching badge counts:", error);
    }
  }, [user]);

  useEffect(() => {
    fetchCounts();
    const handleRefresh = () => fetchCounts();
    window.addEventListener('refresh-counts', handleRefresh);
    const interval = setInterval(fetchCounts, 15000);
    return () => {
      window.removeEventListener('refresh-counts', handleRefresh);
      clearInterval(interval);
    };
  }, [fetchCounts]);

  const handleAiAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!aiQuery.trim()) return;
    setAiLoading(true);
    const context = `User Role: ${user.role}. Current Theme: ${theme}.`;
    const result = await generateManagerInsight(context, aiQuery);
    setAiResponse(result || "Không có phản hồi.");
    setAiLoading(false);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 transition-colors duration-700 text-[clamp(0.75rem,2vw,1rem)] relative">
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
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-md transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <Header user={user} onMenuClick={() => setIsSidebarOpen(true)} />
        <main 
          key={location.pathname}
          className="flex-1 p-4 md:p-8 overflow-x-hidden page-transition"
        >
          {children}
        </main>
      </div>

      <div className="fixed bottom-6 right-6 z-50">
        {!showAiChat ? (
          <button 
            onClick={() => setShowAiChat(true)}
            className={`w-14 h-14 md:w-16 md:h-16 rounded-full shadow-2xl flex items-center justify-center text-white hover:shadow-xl transition-all transform hover:scale-110 active:scale-95 border-4 border-white ${theme === 'tet' ? 'bg-gradient-to-r from-red-600 via-red-700 to-orange-800 shadow-red-300' : 'bg-gradient-to-r from-indigo-600 to-blue-700 shadow-blue-200'}`}
          >
            <Bot className="w-7 h-7 md:w-8 md:h-8" />
          </button>
        ) : (
          <div className="bg-white rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.2)] w-[calc(100vw-2rem)] sm:w-96 flex flex-col border border-white overflow-hidden animate-zoom-in origin-bottom-right">
            <div className={`p-5 flex justify-between items-center text-white ${theme === 'tet' ? 'bg-gradient-to-r from-red-700 via-red-800 to-orange-900' : 'bg-gradient-to-r from-indigo-700 to-blue-800'}`}>
              <div className="flex items-center gap-3">
                <Bot className="w-5 h-5" />
                <span className="font-black text-xs uppercase tracking-widest">{theme === 'tet' ? 'Trợ lý Tết Đoàn Viên 🧧' : 'Trợ lý AI Chiến lược'}</span>
              </div>
              <button onClick={() => setShowAiChat(false)} className="hover:bg-white/20 p-2 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 h-64 md:h-80 overflow-y-auto bg-slate-50 text-xs md:text-sm leading-relaxed no-scrollbar">
              {!aiResponse && !aiLoading && (
                <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-4 opacity-70">
                   <div className="p-4 bg-white rounded-full shadow-sm"><Sparkles className="w-8 h-8 text-amber-400" /></div>
                   <p className="text-center italic font-bold max-w-[200px]">Tôi có thể phân tích dữ liệu kho và nhân sự cho bạn!</p>
                </div>
              )}
              {aiLoading && (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                   <div className={`animate-spin rounded-full h-12 w-12 border-b-4 border-t-transparent ${theme === 'tet' ? 'border-red-600' : 'border-indigo-600'}`}></div>
                   <span className="text-[10px] font-black uppercase text-gray-400 animate-pulse tracking-widest">Đang tính toán dữ liệu...</span>
                </div>
              )}
              {aiResponse && (
                <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-line font-medium bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  {aiResponse}
                </div>
              )}
            </div>

            <form onSubmit={handleAiAsk} className="p-4 border-t bg-white flex gap-2">
              <input 
                type="text" 
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="Tra cứu kho, OT, nhân sự..."
                className="flex-1 px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 text-xs md:text-sm font-bold shadow-inner"
              />
              <button 
                type="submit" 
                disabled={aiLoading}
                className={`${theme === 'tet' ? 'bg-red-700' : 'bg-indigo-700'} text-white p-3.5 md:p-4 rounded-2xl hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-black/5 active:scale-90`}
              >
                <Send className="w-5 h-5" />
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
  const [theme, setTheme] = useState<ThemeType>('tet'); // Mặc định theme Tết

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
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 border-[6px] border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-indigo-600 animate-pulse" />
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-indigo-900 font-black text-2xl uppercase tracking-[0.2em] italic">Team V1</h1>
            <p className="text-gray-400 text-[10px] font-bold uppercase mt-2 animate-pulse tracking-widest">Initializing Smart Infrastructure...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
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
  );
};

export default App;
