
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
    <header className="h-16 md:h-20 px-4 md:px-8 flex items-center justify-between sticky top-0 z-40">
      <div className="glass-card absolute inset-x-2 md:inset-x-8 top-2 bottom-0 rounded-2xl md:rounded-[2rem] -z-10 border border-white/80 shadow-[0_15px_30px_rgba(99,102,241,0.02)]"></div>
      
      <div className="flex items-center gap-2 md:gap-4 ml-2 md:ml-6">
        <button onClick={onMenuClick} className="lg:hidden p-2 hover:bg-slate-100 rounded-xl transition-colors">
          <Menu className="w-5 h-5 text-slate-600" />
        </button>
        
        <div className="hidden xs:flex items-center gap-1 bg-slate-100/40 backdrop-blur-md p-1 rounded-xl border border-white/60 shadow-inner">
           <button onClick={() => setTheme('default')} className={`p-1.5 rounded-lg transition-all ${theme === 'default' ? 'bg-white text-indigo-600 shadow-sm border border-slate-100/50' : 'text-slate-500 hover:text-slate-800'}`} title="Cơ bản"><Palette className="w-3.5 h-3.5" /></button>
           <button onClick={() => setTheme('tet')} className={`p-1.5 rounded-lg transition-all ${theme === 'tet' ? 'bg-white text-red-600 shadow-sm border border-slate-100/50' : 'text-slate-500 hover:text-slate-800'}`} title="Tết"><Gift className="w-3.5 h-3.5" /></button>
           <button onClick={() => setTheme('noel')} className={`p-1.5 rounded-lg transition-all ${theme === 'noel' ? 'bg-white text-blue-600 shadow-sm border border-slate-100/50' : 'text-slate-500 hover:text-slate-800'}`} title="Giáng Sinh"><Snowflake className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-6 mr-2 md:mr-6">
        <div className="relative group hidden lg:block">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
           <input type="text" placeholder="Tìm kiếm..." className="pl-9 pr-3 py-2 bg-slate-50/30 border border-white/80 rounded-xl text-[10px] font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all w-42 xl:w-48 shadow-inner" />
        </div>

        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={handleBellClick} 
            className={`relative p-2.5 rounded-xl transition-all ${isOpen ? (isTet ? 'bg-red-50 text-red-600 border border-red-100/50' : 'bg-indigo-50 text-indigo-600 border border-indigo-100/50') : 'text-slate-500 hover:bg-slate-100/50 border border-transparent'}`}
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full border-2 border-white animate-pulse ${isTet ? 'bg-red-600' : 'bg-indigo-600'}`}></span>
            )}
          </button>
          
          {isOpen && (
            <div className="absolute right-0 top-full mt-4 w-[calc(100vw-2rem)] sm:w-80 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 overflow-hidden animate-zoom-in origin-top-right">
              <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-400">
                <span>Thông báo</span>
                <button onClick={(e) => { e.stopPropagation(); fetchNotifications(); }} className={loading ? 'animate-spin' : ''}><RefreshCw className="w-3.5 h-3.5" /></button>
              </div>
              
              <div className="max-h-80 overflow-y-auto no-scrollbar p-2">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center opacity-30 italic text-[10px]">Trống</div>
                ) : (
                  <ul className="space-y-1">
                    {notifications.map((n) => (
                      <li key={n.id} className="p-3 hover:bg-slate-50 rounded-xl transition-all group pointer-events-none">
                        <div className="flex justify-between items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${n.status === 'pending' ? 'bg-amber-50 text-amber-500' : 'bg-indigo-50 text-indigo-500'}`}>
                             <Timer className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-slate-900 uppercase leading-none mb-1">{n.title}</p>
                            <p className="text-[9px] text-slate-500 truncate">{n.message}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 md:gap-4 pl-2 md:pl-4 border-l border-slate-100">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black text-slate-900 tracking-tighter uppercase leading-none">{user?.name || 'User'}</p>
            <p className={`text-[7px] font-black uppercase tracking-widest mt-1.5 ${isTet ? 'text-red-600' : 'text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded'}`}>{user?.role}</p>
          </div>
          <div className={`w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-md border-2 border-white bg-gradient-to-br ${isTet ? 'from-red-600 to-orange-500' : 'from-indigo-500 via-indigo-600 to-violet-600 shadow-lg shadow-indigo-200 hover:scale-105 transition-transform'}`}>
             <User className="w-4 h-4 md:w-5 md:h-5" />
          </div>
        </div>
      </div>
    </header>
  );
};
