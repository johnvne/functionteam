
import React, { useState, useEffect, useCallback } from 'react';
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
import { Bot, X, Send, Menu, Gift } from 'lucide-react';
import { supabase } from './src/lib/supabase';
import { User } from './types';

// Seasonal Effects Component
const SeasonalEffects = () => {
  const month = new Date().getMonth(); // 0-11
  const isNoel = month === 11; // December
  const isTet = month === 0 || month === 1; // Jan or Feb

  useEffect(() => {
    if (!isNoel && !isTet) return;

    const container = document.createElement('div');
    container.className = isNoel ? 'snow-container' : 'blossom-container';
    document.body.appendChild(container);

    const createParticle = () => {
      const p = document.createElement('div');
      p.className = isNoel ? 'snowflake' : 'petal';
      if (isNoel) p.innerText = '❄';
      
      const startLeft = Math.random() * 100;
      const duration = Math.random() * 5 + 5;
      const size = Math.random() * 10 + 10;

      p.style.left = startLeft + 'vw';
      p.style.animationDuration = duration + 's';
      p.style.fontSize = size + 'px';
      if (isTet) {
        p.style.width = size + 'px';
        p.style.height = size + 'px';
        p.style.backgroundColor = Math.random() > 0.5 ? '#ffb7c5' : '#ffd700'; // Pink or Gold
      }

      container.appendChild(p);
      setTimeout(() => p.remove(), duration * 1000);
    };

    const interval = setInterval(createParticle, 300);
    return () => {
      clearInterval(interval);
      document.body.removeChild(container);
    };
  }, [isNoel, isTet]);

  return null;
};

const MainLayout: React.FC<{ children: React.ReactNode; user: User; onLogout: () => void }> = ({ children, user, onLogout }) => {
  const location = useLocation();
  const [currentPath, setCurrentPath] = useState(location.pathname);
  const [showAiChat, setShowAiChat] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [pendingBorrowCount, setPendingBorrowCount] = useState(0);
  const [pendingOTCount, setPendingOTCount] = useState(0);

  // Festive detection
  const month = new Date().getMonth();
  const festiveClass = month === 11 ? 'festive-christmas' : (month === 0 || month === 1 ? 'festive-tet' : 'festive-default');

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
    const context = `User Role: ${user.role}. Current Month: ${month + 1}.`;
    const result = await generateManagerInsight(context, aiQuery);
    setAiResponse(result || "Không có phản hồi.");
    setAiLoading(false);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 transition-colors">
      <SeasonalEffects />
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
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <Header user={user} onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>

      <div className="fixed bottom-6 right-6 z-50">
        {!showAiChat ? (
          <button 
            onClick={() => setShowAiChat(true)}
            className="w-14 h-14 bg-gradient-to-r from-red-600 to-orange-600 rounded-full shadow-2xl flex items-center justify-center text-white hover:shadow-xl transition-all transform hover:scale-110 active:scale-95 border-4 border-white"
          >
            <Bot className="w-7 h-7" />
          </button>
        ) : (
          <div className="bg-white rounded-2xl shadow-2xl w-[calc(100vw-2rem)] sm:w-96 flex flex-col border border-gray-200 overflow-hidden animate-fade-in-up origin-bottom-right">
            <div className="bg-gradient-to-r from-red-600 to-orange-600 p-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                <span className="font-semibold text-sm">Trợ lý Lễ hội</span>
              </div>
              <button onClick={() => setShowAiChat(false)} className="hover:bg-white/20 p-1 rounded transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 h-64 overflow-y-auto bg-gray-50 text-sm">
              {!aiResponse && !aiLoading && (
                <p className="text-gray-500 text-center mt-20 italic">Chúc mừng ngày mới! Hãy hỏi tôi về hệ thống...</p>
              )}
              {aiLoading && (
                <div className="flex items-center justify-center h-full">
                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                </div>
              )}
              {aiResponse && (
                <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-line">
                  {aiResponse}
                </div>
              )}
            </div>

            <form onSubmit={handleAiAsk} className="p-3 border-t bg-white flex gap-2">
              <input 
                type="text" 
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="Hỏi trợ lý..."
                className="flex-1 px-3 py-2 border rounded-xl focus:outline-none focus:border-red-500 text-sm shadow-inner"
              />
              <button 
                type="submit" 
                disabled={aiLoading}
                className="bg-red-600 text-white p-2.5 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors shadow-md"
              >
                <Send className="w-4 h-4" />
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
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-red-700 font-bold text-xs uppercase tracking-widest italic">Đang tải ngày hội...</p>
        </div>
      </div>
    );
  }

  return (
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
  );
};

export default App;