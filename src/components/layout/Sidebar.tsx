
import React, { useContext } from 'react';
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
  Sparkles,
  Gift,
  Coins,
  ChevronRight
} from 'lucide-react';
import { ThemeContext } from '../../../App';

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
  const { theme } = useContext(ThemeContext);
  const isDefault = theme === 'default';
  const isTet = theme === 'tet';
  const isNoel = theme === 'noel';

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['admin', 'manager', 'employee', 'user'] },
    { id: 'employees', label: 'Nhân viên', icon: Users, path: '/employees', roles: ['admin', 'manager'] },
    { id: 'tools', label: 'Công cụ', icon: Wrench, path: '/tools', roles: ['admin', 'manager', 'employee', 'user'] },
    { id: 'requests', label: 'Mượn đồ', icon: FileText, path: '/requests', roles: ['admin', 'manager', 'employee', 'user'], badge: pendingBorrowCount },
    { id: 'history', label: 'Lịch sử', icon: History, path: '/history', roles: ['admin', 'manager', 'employee', 'user'] },
    { id: 'overtime', label: 'Tăng ca', icon: Clock, path: '/overtime', roles: ['admin', 'manager', 'employee', 'user'], badge: pendingOTCount }, 
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(userRole));

  const sidebarBg = isTet 
    ? 'bg-gradient-to-b from-red-900 to-red-950 text-white' 
    : isNoel 
      ? 'bg-gradient-to-b from-slate-900 to-blue-950 text-white' 
      : 'bg-white text-slate-900 border-r border-slate-100';

  return (
    <div className={`
      fixed lg:sticky top-0 z-50 w-72 flex flex-col h-screen overflow-y-auto transition-all duration-300 ease-in-out shadow-2xl lg:shadow-none
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      ${sidebarBg}
    `}>
      <div className={`p-8 flex items-center justify-between border-b ${isDefault ? 'border-slate-100' : 'border-white/10'}`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg transform rotate-6 ${isDefault ? 'bg-indigo-600 text-white' : 'bg-white/20 backdrop-blur-md'}`}>
            {isNoel ? <TreePine className="text-emerald-400" /> : (isTet ? <Coins className="text-yellow-400" /> : 'V1')}
          </div>
          <div className="flex flex-col">
            <span className={`font-extrabold text-xl tracking-tight leading-none ${isDefault ? 'text-slate-900' : 'text-white'}`}>Manager V</span>
            <span className={`text-[9px] font-bold uppercase tracking-widest mt-1.5 ${isDefault ? 'text-slate-400' : 'text-white/50'}`}>
              {isNoel ? '🎄 Holiday Edition' : isTet ? '🧧 Tet Edition' : 'v2.0 Beta 🚀'}
            </span>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden p-2 hover:bg-black/5 rounded-full transition-colors">
          <X className={`w-5 h-5 ${isDefault ? 'text-slate-400' : 'text-white/50'}`} />
        </button>
      </div>

      <nav className="flex-1 p-6 space-y-2">
        {filteredItems.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.path)}
              className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-200 group relative
                ${isActive 
                  ? (isDefault ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 scale-[1.02]' : 'bg-white/20 text-white shadow-xl border border-white/20 scale-[1.02]') 
                  : (isDefault ? 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600' : 'text-white/60 hover:bg-white/5 hover:text-white')
                }`}
            >
              <div className="flex items-center gap-4">
                <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : (isDefault ? 'text-slate-300 group-hover:text-indigo-500' : 'text-white/30 group-hover:text-white')}`} />
                <span className="font-bold text-sm tracking-tight">{item.label}</span>
              </div>
              
              <div className="flex items-center gap-2">
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black shadow-lg ${
                    isActive ? (isDefault ? 'bg-white text-indigo-600' : 'bg-red-500 text-white') : 'bg-rose-500 text-white animate-pulse'
                  }`}>
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-4 h-4 opacity-40" />}
              </div>
            </button>
          );
        })}
      </nav>

      <div className={`p-6 border-t ${isDefault ? 'border-slate-100' : 'border-white/10'}`}>
        <button 
          onClick={onLogout}
          className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${isDefault ? 'text-slate-400 hover:bg-rose-50 hover:text-rose-600' : 'text-white/40 hover:bg-red-600/20 hover:text-red-400'}`}
        >
          <LogOut className="w-5 h-5" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
};
