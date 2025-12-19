
import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Wrench, 
  Clock, 
  History, 
  FileText, 
  LogOut,
  X
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
      fixed lg:sticky top-0 z-50 w-64 bg-slate-900 text-white flex flex-col h-screen overflow-y-auto transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      <div className="p-6 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold shadow-lg shadow-blue-500/20">M</div>
          <span className="font-bold text-lg tracking-wide">Manager Tool</span>
        </div>
        <button onClick={onClose} className="lg:hidden p-1 hover:bg-slate-800 rounded transition-colors">
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {filteredItems.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.path)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20 transform scale-[1.02]' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                <span className="font-medium text-sm tracking-tight">{item.label}</span>
              </div>
              
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full text-[10px] font-black border-2 animate-pulse ${
                  isActive ? 'bg-white text-blue-600 border-blue-400' : 'bg-red-600 text-white border-red-500'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-rose-400 hover:bg-rose-900/20 hover:text-rose-300 rounded-xl transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm tracking-tight">Đăng xuất</span>
        </button>
      </div>
    </div>
  );
};
