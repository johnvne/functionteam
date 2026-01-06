
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
    const interval = setInterval(fetchCounts, 30000);
    return () => {
      window.removeEventListener('refresh-counts', handleRefresh);
      clearInterval(interval);
    };
  }, [fetchCounts]);

  const handleAiAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!aiQuery.trim()) return;
    setAiLoading(true);
    const context = `User Role: ${user.role}. System: Inventory and Overtime tracking. Current theme: ${theme}.`;
    const result = await generateManagerInsight(context, aiQuery);
    setAiResponse(result || "Không có phản hồi.");
    setAiLoading(false);
  };

  return (
    <div className="flex min-h-screen transition-all duration-1000 bg-slate-50 relative">
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
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <Header user={user} onMenuClick={() => setIsSidebarOpen(true)} />
        <main 
          key={location.pathname}
          className="flex-1 px-4 md:px-8 py-4 md:py-8 overflow-x-hidden page-transition"
        >
          {children}
        </main>
      </div>

      {/* AI Chat Bot UI Refined */}
      <div className="fixed bottom-6 right-6 z-50">
        {!showAiChat ? (
          <button 
            onClick={() => setShowAiChat(true)}
            className={`w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center text-white transition-all transform hover:scale-110 active:scale-95 border-2 border-white/50 ${theme === 'tet' ? 'bg-gradient-to-tr from-red-600 to-amber-500' : 'bg-gradient-to-tr from-indigo-600 to-violet-500'}`}
          >
            <Bot className="w-7 h-7" />
          </button>
        ) : (
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
                  {aiResponse}
                </div>
              )}
            </div>

            <form onSubmit={handleAiAsk} className="p-5 border-t border-slate-100 bg-white flex gap-2">
              <input 
                type="text" 
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="Tra cứu nhanh..."
                className="flex-1 px-5 py-3.5 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold outline-none"
              />
              <button 
                type="submit" 
                disabled={aiLoading}
                className={`p-3.5 rounded-xl text-white transition-all shadow-lg active:scale-90 ${theme === 'tet' ? 'bg-red-600' : 'bg-indigo-600'}`}
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
  const [theme, setTheme] = useState<ThemeType>('default');

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
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-indigo-600/10 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] animate-pulse">Hệ thống đang sẵn sàng</p>
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
