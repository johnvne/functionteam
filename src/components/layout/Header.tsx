
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, User, Clock, Loader2, Menu, RefreshCw, Trash2, X, CheckCircle2, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { BorrowRequest } from '../../../types';

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
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Lấy danh sách ID thông báo đã bị xóa hoặc đã xem từ localStorage
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
      
      let borrowQuery = supabase.from('requests').select('*').order('borrow_date', { ascending: false }).limit(30);
      
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

          // Bỏ qua nếu thông báo này đã bị người dùng xóa
          if (dismissedIds.includes(uniqueId)) return;
          
          if (isAdmin) {
            if (req.status === 'pending') { 
              shouldNotify = true; 
              title = 'Yêu cầu mượn mới'; 
              message = `${req.user_name} đang chờ mượn ${req.tool_name}`; 
            }
          } else {
            if (req.user_id === user.id && req.status !== 'pending') { 
              shouldNotify = true; 
              title = 'Cập nhật yêu cầu'; 
              const statusText = req.status === 'approved' ? 'đã được DUYỆT' : req.status === 'rejected' ? 'bị TỪ CHỐI' : 'đã HOÀN TRẢ';
              message = `Yêu cầu mượn "${req.tool_name}" ${statusText}`; 
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
      
      // Chỉ đếm những thông báo chưa nằm trong danh sách "đã xem"
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
    const interval = setInterval(fetchNotifications, 20000);
    return () => {
      window.removeEventListener('refresh-counts', handleRefresh);
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  // Xử lý khi click vào chuông
  const handleBellClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Khi mở ra, đánh dấu tất cả hiện tại là đã xem
      const currentIds = notifications.map(n => n.id);
      const seenIds = Array.from(new Set([...getSeenIds(), ...currentIds]));
      localStorage.setItem(`seen_notifs_${user?.id}`, JSON.stringify(seenIds));
      setUnreadCount(0); // Xóa số thông báo ngay lập tức
    }
  };

  // Xử lý xóa một thông báo
  const deleteNotification = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const dismissedIds = [...getDismissedIds(), id];
    localStorage.setItem(`dismissed_notifs_${user?.id}`, JSON.stringify(dismissedIds));
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 h-16 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm transition-all">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden p-2 -ml-2 hover:bg-gray-100 rounded-xl transition-colors">
          <Menu className="w-6 h-6 text-gray-600" />
        </button>
        <span className="hidden sm:block text-xs md:text-sm font-medium text-gray-500 italic">
          {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
        </span>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={handleBellClick} 
            className={`relative p-2.5 rounded-xl transition-all ${isOpen ? 'bg-blue-50 text-blue-600 shadow-inner' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] font-black min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full border-2 border-white shadow-lg animate-bounce-short">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          
          {isOpen && (
            <div className="absolute right-0 top-full mt-3 w-80 sm:w-96 bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden animate-fade-in-up origin-top-right ring-1 ring-black/5">
              <div className="p-5 border-b bg-gray-50/50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-gray-800 text-xs uppercase tracking-widest">Thông báo</h3>
                  <span className="bg-blue-100 text-blue-600 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">Mới nhất</span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); fetchNotifications(); }} 
                  className={`p-2 hover:bg-white rounded-xl transition-all ${loading ? 'animate-spin' : ''}`}
                >
                  <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                </button>
              </div>
              
              <div className="max-h-[400px] overflow-y-auto no-scrollbar bg-white">
                {notifications.length === 0 ? (
                  <div className="p-16 text-center flex flex-col items-center gap-3">
                    <div className="p-4 bg-gray-50 rounded-full">
                       <Bell className="w-8 h-8 text-gray-200" />
                    </div>
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">Không có thông báo mới</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-50">
                    {notifications.map((n) => (
                      <li key={n.id} className="relative p-5 hover:bg-blue-50/30 transition-all border-l-4 border-l-transparent hover:border-l-blue-600 group">
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`w-1.5 h-1.5 rounded-full ${n.status === 'pending' ? 'bg-amber-500' : n.status === 'approved' ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                              <p className="text-xs font-black text-gray-900 leading-tight uppercase tracking-tight">{n.title}</p>
                            </div>
                            <p className="text-[11px] text-gray-500 font-medium leading-relaxed pr-6">{n.message}</p>
                            <div className="flex items-center gap-2 mt-3 text-[9px] font-black text-gray-300 uppercase">
                                <Clock className="w-3 h-3" />
                                {new Date(n.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} • {new Date(n.time).toLocaleDateString('vi-VN')}
                            </div>
                          </div>
                          
                          {/* Nút xóa thông báo */}
                          <button 
                            onClick={(e) => deleteNotification(e, n.id)}
                            className="absolute top-5 right-5 p-1.5 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                            title="Xóa thông báo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              <div className="p-4 bg-gray-50 border-t text-center">
                 <button 
                  onClick={() => setIsOpen(false)}
                  className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-blue-600 transition-colors"
                 >
                   Đóng cửa sổ
                 </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3 pl-4 md:pl-6 border-l border-gray-100">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-black text-gray-900 tracking-tight leading-none">{user?.name || 'Thành viên'}</p>
            <p className="text-[10px] text-blue-600 font-black uppercase tracking-[0.15em] mt-1.5">{user?.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}</p>
          </div>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-200 border-2 border-white transform hover:rotate-6 transition-transform cursor-pointer">
             <User className="w-5 h-5" />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce-short {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-bounce-short {
          animation: bounce-short 2s infinite ease-in-out;
        }
      `}</style>
    </header>
  );
};
