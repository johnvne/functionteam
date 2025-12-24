
import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Wrench, 
  Clock, 
  History, 
  FileText, 
  LogOut,
  X,
  TreePine,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  userRole: string;
  isOpen?: boolean;
  onClose?: () => void;
  pendingBorrowCount?: number;
  pendingOTCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentPath, 
  onNavigate, 
  onLogout, 
  userRole, 
  isOpen, 
  onClose,
  pendingBorrowCount = 0,
  pendingOTCount = 0
}) => {
  const month = new Date().getMonth();
  const isNoel = month === 11;
  const isTet = month === 0 || month === 1;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['admin', 'manager', 'employee', 'user'] },
    { id: 'employees', label: 'Nhân viên', icon: Users, path: '/employees', roles: ['admin', 'manager'] },
    { id: 'tools', label: 'Công cụ', icon: Wrench, path: '/tools', roles: ['admin', 'manager', 'employee', 'user'] },
    { id: 'requests', label: 'Yêu cầu mượn', icon: FileText, path: '/requests', roles: ['admin', 'manager', 'employee', 'user'], badge: pendingBorrowCount },
    { id: 'history', label: 'Lịch sử', icon: History, path: '/history', roles: ['admin', 'manager', 'employee', 'user'] },
    { id: 'overtime', label: 'Tăng ca', icon: Clock, path: '/overtime', roles: ['admin', 'manager', 'employee', 'user'], badge: pendingOTCount }, 
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <div className={`
      fixed lg:sticky top-0 z-50 w-64 festive-sidebar text-white flex flex-col h-screen overflow-y-auto transition-transform duration-300 ease-in-out shadow-2xl
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center font-black text-xl shadow-inner group overflow-hidden">
            {isNoel ? <TreePine className="text-emerald-400 group-hover:scale-125 transition-transform" /> : (isTet ? <Sparkles className="text-yellow-400" /> : 'M')}
          </div>
          <div className="flex flex-col">
            <span className="font-black text-lg tracking-tighter uppercase italic">Manager_V</span>
            {isNoel && <span className="text-[8px] font-bold text-red-300 uppercase tracking-widest">Merry Xmas! ❄️</span>}
            {isTet && <span className="text-[8px] font-bold text-yellow-300 uppercase tracking-widest">Happy Tet! 🧧</span>}
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden p-1 hover:bg-white/10 rounded transition-colors">
          <X className="w-5 h-5 text-white/50" />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {filteredItems.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.path)}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-200 group relative ${
                isActive 
                  ? 'bg-white/10 text-white shadow-xl backdrop-blur-md border border-white/20 transform scale-[1.05]' 
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-white/30 group-hover:text-white'}`} />
                <span className="font-black text-xs uppercase tracking-widest">{item.label}</span>
              </div>
              
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[9px] font-black border-2 shadow-lg animate-pulse ${
                  isActive ? 'bg-white text-red-600 border-red-200' : 'bg-red-600 text-white border-red-400'
                }`}>
                  {item.badge}
                </span>
              )}
              {isActive && <div className="absolute left-0 w-1 h-6 bg-yellow-400 rounded-full"></div>}
            </button>
          );
        })}
      </nav>

      <div className="p-5 border-t border-white/10">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-white/40 hover:bg-red-600/20 hover:text-red-400 rounded-2xl transition-all font-black uppercase text-[10px] tracking-widest"
        >
          <LogOut className="w-5 h-5" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
};