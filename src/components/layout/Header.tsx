
import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { Bell, User, Clock, Loader2, Menu, RefreshCw, Trash2, X, CheckCircle2, AlertTriangle, Snowflake, Sparkles, Layout, Gift, Search, Palette, Timer, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { BorrowRequest } from '../../../types';
import { ThemeContext } from '../../../App';

interface HeaderProps {
  user: any;
  onMenuClick?: () => void;
}

interface NotificationItem {
  id: string;
  type: 'borrow' | 'overtime';
  title: string;
  message: string;
  time: string;
  status: 'pending' | 'approved' | 'rejected' | 'returned';
  isRead: boolean;
}

export const Header: React.FC<HeaderProps> = ({ user, onMenuClick }) => {
  const { theme, setTheme } = useContext(ThemeContext);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isTet = theme === 'tet';
  const isNoel = theme === 'noel';

  const getDismissedIds = (): string[] => {
    const stored = localStorage.getItem(`dismissed_notifs_${user?.id}`);
    return stored ? JSON.parse(stored) : [];
  };

  const getSeenIds = (): string[] => {
    const stored = localStorage.getItem(`seen_notifs_${user?.id}`);
    return stored ? JSON.parse(stored) : [];
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const isAdmin = user.role === 'admin';
      const dismissedIds = getDismissedIds();
      const seenIds = getSeenIds();
      const notifs: NotificationItem[] = [];
      
      let borrowQuery = supabase.from('requests').select('*').order('borrow_date', { ascending: false }).limit(20);
      
      if (!isAdmin) {
        borrowQuery = borrowQuery.eq('user_id', user.id);
      }

      const { data: borrowData } = await borrowQuery;
      
      if (borrowData) {
        (borrowData as BorrowRequest[]).forEach(req => {
          let shouldNotify = false; 
          let title = ''; 
          let message = '';
          const uniqueId = `borrow-${req.id}-${req.status}`;

          if (dismissedIds.includes(uniqueId)) return;
          
          if (isAdmin) {
            if (req.status === 'pending') { 
              shouldNotify = true; 
              title = 'Đơn mượn mới'; 
              message = `${req.user_name} cần mượn ${req.tool_name}`; 
            }
          } else {
            if (req.user_id === user.id && req.status !== 'pending') { 
              shouldNotify = true; 
              title = 'Trạng thái yêu cầu'; 
              const statusText = req.status === 'approved' ? 'đã được DUYỆT' : req.status === 'rejected' ? 'bị TỪ CHỐI' : 'đã HOÀN TRẢ';
              message = `Mượn "${req.tool_name}" ${statusText}`; 
            }
          }
          
          if (shouldNotify) {
            notifs.push({ 
              id: uniqueId, 
              type: 'borrow', 
              title, 
              message, 
              time: req.status === 'returned' ? (req.returned_at || req.borrow_date) : req.borrow_date, 
              status: req.status, 
              isRead: seenIds.includes(uniqueId)
            });
          }
        });
      }
      
      const sortedNotifs = notifs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setNotifications(sortedNotifs);
      
      const unread = sortedNotifs.filter(n => !seenIds.includes(n.id)).length;
      setUnreadCount(unread);
    } catch (error) { 
      console.error("Lỗi thông báo:", error); 
    } finally { 
      setLoading(false); 
    }
  }, [user]);

  useEffect(() => { 
    fetchNotifications(); 
    const handleRefresh = () => fetchNotifications();
    window.addEventListener('refresh-counts', handleRefresh);
    const interval = setInterval(fetchNotifications, 30000);
    return () => {
      window.removeEventListener('refresh-counts', handleRefresh);
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  const handleBellClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      const currentIds = notifications.map(n => n.id);
      const seenIds = Array.from(new Set([...getSeenIds(), ...currentIds]));
      localStorage.setItem(`seen_notifs_${user?.id}`, JSON.stringify(seenIds));
      setUnreadCount(0);
    }
  };

  const deleteNotification = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const dismissedIds = [...getDismissedIds(), id];
    localStorage.setItem(`dismissed_notifs_${user?.id}`, JSON.stringify(dismissedIds));
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <header className="h-20 px-4 md:px-8 flex items-center justify-between sticky top-0 z-40">
      <div className="glass-card absolute inset-x-4 md:inset-x-8 top-3 bottom-0 rounded-[2rem] -z-10 border border-white/60"></div>
      
      <div className="flex items-center gap-4 ml-6">
        <button onClick={onMenuClick} className="lg:hidden p-2.5 hover:bg-slate-100 rounded-xl transition-colors">
          <Menu className="w-5 h-5 text-slate-600" />
        </button>
        
        <div className="hidden sm:flex items-center gap-1.5 bg-slate-100/60 p-1.5 rounded-2xl border border-white shadow-inner">
           <button onClick={() => setTheme('default')} className={`p-2 rounded-xl transition-all ${theme === 'default' ? 'bg-white text-indigo-600 shadow-sm scale-105' : 'text-slate-400 hover:text-slate-600'}`} title="Cơ bản"><Palette className="w-4 h-4" /></button>
           <button onClick={() => setTheme('tet')} className={`p-2 rounded-xl transition-all ${theme === 'tet' ? 'bg-white text-red-600 shadow-sm scale-105' : 'text-slate-400 hover:text-slate-600'}`} title="Tết Đoàn Viên"><Gift className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-6 mr-6">
        <div className="relative group hidden lg:block">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
           <input type="text" placeholder="Tìm kiếm nhanh..." className="pl-11 pr-4 py-2.5 bg-slate-50/50 border border-white rounded-2xl text-[11px] font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all w-40 xl:w-56" />
        </div>

        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={handleBellClick} 
            className={`relative p-2.5 rounded-2xl transition-all duration-300 ${isOpen ? (isTet ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600') : 'text-slate-400 hover:bg-white hover:text-slate-900 hover:shadow-sm'}`}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className={`absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full border-2 border-white animate-pulse ${isTet ? 'bg-red-600' : 'bg-rose-500'}`}></span>
            )}
          </button>
          
          {isOpen && (
            <div className="absolute right-0 top-full mt-4 w-[calc(100vw-2rem)] sm:w-96 bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border border-white/60 overflow-hidden animate-zoom-in origin-top-right">
              <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-900 italic">Hộp thư hệ thống</h3>
                <button onClick={(e) => { e.stopPropagation(); fetchNotifications(); }} className={`p-2 hover:bg-white rounded-xl transition-all ${loading ? 'animate-spin' : ''}`}>
                  <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
              
              <div className="max-h-[420px] overflow-y-auto no-scrollbar bg-white/50 p-3">
                {notifications.length === 0 ? (
                  <div className="py-20 text-center flex flex-col items-center gap-4 opacity-30">
                    <div className="p-5 bg-slate-50 rounded-full"><Bell className="w-10 h-10 text-slate-300" /></div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Tất cả đã xử lý xong</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {notifications.map((n) => (
                      <li key={n.id} className="relative p-4 bg-white/50 hover:bg-white hover:shadow-md rounded-2xl border border-transparent hover:border-slate-100 transition-all group">
                        <div className="flex justify-between items-start gap-4">
                          <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center border shadow-sm ${n.status === 'pending' ? 'bg-amber-50 border-amber-100 text-amber-500' : 'bg-indigo-50 border-indigo-100 text-indigo-500'}`}>
                             {n.status === 'pending' ? <Timer className="w-4.5 h-4.5" /> : <Clock className="w-4.5 h-4.5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight mb-1">{n.title}</p>
                            <p className="text-[11px] text-slate-500 font-medium leading-relaxed truncate">{n.message}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-[8px] font-black text-slate-300 uppercase tabular-nums">
                                    {new Date(n.time).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})} • {new Date(n.time).toLocaleDateString('vi-VN')}
                                </span>
                            </div>
                          </div>
                          <button onClick={(e) => deleteNotification(e, n.id)} className="p-1.5 text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"><X className="w-4 h-4" /></button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4 pl-4 border-l border-slate-100">
          <div className="text-right hidden md:block">
            <p className="text-xs font-black text-slate-900 tracking-tighter uppercase leading-none">{user?.name || 'User'}</p>
            <p className={`text-[8px] font-black uppercase tracking-widest mt-2 ${isTet ? 'text-red-600' : 'text-indigo-600'}`}>{user?.role}</p>
          </div>
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-lg border-2 border-white transition-all hover:scale-105 active:scale-95 cursor-pointer bg-gradient-to-br ${isTet ? 'from-red-600 to-orange-500' : 'from-indigo-500 to-purple-600'}`}>
             <User className="w-5 h-5" />
          </div>
        </div>
      </div>
    </header>
  );
};
