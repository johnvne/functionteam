
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { BorrowRequest, User } from '../../../types';
import { Card } from '../ui/Card';
import { 
  Check, X, Trash2, Clock, RotateCcw, 
  CheckCircle2, User as UserIcon, ShieldCheck, 
  AlertTriangle, Loader2, Search, Filter, 
  Calendar, Wrench, Ban, Info, XCircle,
  ChevronRight, ArrowUpCircle, History, AlertCircle, Bookmark,
  ChevronDown, RefreshCw, ChevronLeft, ChevronsLeft, ChevronsRight,
  ThumbsUp, ThumbsDown, PackageCheck, Timer, MapPin, Undo2
} from 'lucide-react';

interface RequestManagerProps { user: User; }

interface RequestWithImage extends BorrowRequest {
  tool_image?: string;
}

const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error' | 'info', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgClass = type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-rose-600' : 'bg-blue-600';

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${bgClass} text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in-up max-w-[calc(100vw-3rem)] border border-white/20 backdrop-blur-md`}>
      {type === 'success' && <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
      {type === 'error' && <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
      {type === 'info' && <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />}
      <p className="text-xs md:text-sm font-bold tracking-tight">{message}</p>
      <button onClick={onClose} className="ml-auto p-1.5 hover:bg-white/20 rounded-full transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

type ConfirmActionType = 
  | { type: 'approve'; req: BorrowRequest }
  | { type: 'reject'; req: BorrowRequest }
  | { type: 'return'; req: BorrowRequest }
  | { type: 'cancel'; id: string }
  | null;

export const RequestManager: React.FC<RequestManagerProps> = ({ user }) => {
  const [requests, setRequests] = useState<RequestWithImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'personal'>(user.role === 'admin' ? 'all' : 'personal');

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [confirmAction, setConfirmAction] = useState<ConfirmActionType>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
  };

  const fetchRequests = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    
    try {
      let query = supabase.from('requests').select('*');
      
      const isAdminView = user.role === 'admin' && activeTab === 'all';
      if (!isAdminView) {
          query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      const fetchedData = data as BorrowRequest[] || [];
      const toolIds = [...new Set(fetchedData.map(r => r.tool_id))];
      
      const { data: toolsData } = await supabase.from('tools').select('id, image').in('id', toolIds);
      
      const toolImageMap = new Map();
      if (toolsData) {
        toolsData.forEach((t: any) => toolImageMap.set(t.id, t.image));
      }

      const enrichedData: RequestWithImage[] = fetchedData.map(req => ({
        ...req,
        tool_image: toolImageMap.get(req.tool_id)
      }));

      setRequests(enrichedData);
    } catch (err: any) {
        showToast("Không thể tải dữ liệu: " + err.message, "error");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user, activeTab]);

  const filteredRequests = useMemo(() => {
    let result = requests.filter(req => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        req.user_name.toLowerCase().includes(searchLower) ||
        req.employee_id.toLowerCase().includes(searchLower) ||
        req.tool_name.toLowerCase().includes(searchLower);

      const matchesStatus = filterStatus === 'all' || req.status === filterStatus;

      let matchesDateOrBorrowed = true;
      if (filterStartDate) {
        const reqDateStr = new Date(req.borrow_date).toISOString().split('T')[0];
        const isSelectedDate = reqDateStr === filterStartDate;
        const isCurrentlyBorrowed = req.status === 'approved';
        
        if (filterStatus === 'all') {
            matchesDateOrBorrowed = isSelectedDate || isCurrentlyBorrowed;
        } else {
            matchesDateOrBorrowed = isSelectedDate;
        }
      }

      return matchesSearch && matchesStatus && matchesDateOrBorrowed;
    });

    return result.sort((a, b) => {
        const statusOrder: Record<string, number> = { 'pending': 0, 'approved': 1, 'returned': 2, 'rejected': 3 };
        const orderA = statusOrder[a.status] ?? 99;
        const orderB = statusOrder[b.status] ?? 99;
        
        if (orderA !== orderB) return orderA - orderB;
        return new Date(b.borrow_date).getTime() - new Date(a.borrow_date).getTime();
    });
  }, [requests, searchTerm, filterStatus, filterStartDate]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const currentRequests = filteredRequests.slice(startIndex, startIndex + pageSize);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterStartDate, activeTab]);

  const updateLocalRequestStatus = (id: string, newStatus: string, extraData = {}) => {
    setRequests(prev => prev.map(req => req.id === id ? { ...req, status: newStatus as any, ...extraData } : req));
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    const action = confirmAction;
    setConfirmAction(null);
    setProcessingId(action.type === 'cancel' ? action.id : action.req.id);
    
    try {
        if (action.type === 'approve') {
            const { data: tool } = await supabase.from('tools').select('available').eq('id', action.req.tool_id).single();
            if ((tool?.available || 0) <= 0) throw new Error("Hết hàng trong kho");
            await supabase.from('tools').update({ available: (tool?.available || 1) - 1 }).eq('id', action.req.tool_id);
            await supabase.from('requests').update({ status: 'approved' }).eq('id', action.req.id);
            updateLocalRequestStatus(action.req.id, 'approved');
        } else if (action.type === 'return') {
            const { data: tool } = await supabase.from('tools').select('available').eq('id', action.req.tool_id).single();
            await supabase.from('tools').update({ available: (tool?.available || 0) + 1 }).eq('id', action.req.tool_id);
            await supabase.from('requests').update({ status: 'returned', returned_at: new Date().toISOString() }).eq('id', action.req.id);
            updateLocalRequestStatus(action.req.id, 'returned');
        } else if (action.type === 'cancel') {
            await supabase.from('requests').delete().eq('id', action.id);
            setRequests(prev => prev.filter(r => r.id !== action.id));
        } else if (action.type === 'reject') {
            await supabase.from('requests').update({ status: 'rejected' }).eq('id', action.req.id);
            updateLocalRequestStatus(action.req.id, 'rejected');
        }

        window.dispatchEvent(new CustomEvent('refresh-counts'));
        showToast("Thao tác thành công!", "success");
    } catch (e: any) {
        showToast(e.message, "error");
    } finally {
        setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending': 
        return {
            className: 'bg-amber-50 text-amber-700 border-amber-200 ring-2 ring-amber-500/10 shadow-sm shadow-amber-100/50 font-black',
            icon: <Timer className="w-3.5 h-3.5 animate-pulse" />,
            label: 'Chờ duyệt'
        };
      case 'approved': 
        return {
            className: 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-200/50 ring-2 ring-emerald-500/20 font-black',
            icon: <PackageCheck className="w-3.5 h-3.5" />,
            label: 'Đang mượn'
        };
      case 'returned': 
        return {
            className: 'bg-blue-50 text-blue-700 border-blue-200 font-bold',
            icon: <RotateCcw className="w-3.5 h-3.5" />,
            label: 'Đã trả'
        };
      case 'rejected': 
        return {
            className: 'bg-rose-50 text-rose-700 border-rose-200 font-bold',
            icon: <XCircle className="w-3.5 h-3.5" />,
            label: 'Từ chối'
        };
      default: 
        return {
            className: 'bg-gray-100 text-gray-700 border-gray-200',
            icon: <Info className="w-3.5 h-3.5" />,
            label: '—'
        };
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-3 md:space-y-6 animate-fade-in w-full pb-20 px-1 md:px-0">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 md:gap-6 bg-white p-3 md:p-6 rounded-[1.2rem] md:rounded-[2.5rem] shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 md:gap-5">
            <div className="p-2.5 md:p-4 bg-blue-600 rounded-xl md:rounded-[1.5rem] shadow-lg shadow-blue-100">
              <Wrench className="w-5 h-5 md:w-8 md:h-8 text-white" />
            </div>
            <div>
              <h2 className="text-base md:text-2xl font-black text-gray-900 tracking-tight leading-none">
                {activeTab === 'personal' ? 'Đơn của tôi' : 'Quản lý mượn'}
              </h2>
              <p className="text-[8px] md:text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1 md:mt-2 opacity-70">
                {activeTab === 'personal' ? 'Theo dõi mượn trả' : 'Phê duyệt hệ thống'}
              </p>
            </div>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-xl md:rounded-2xl border border-gray-200 shadow-inner w-full lg:w-auto overflow-hidden">
            {user.role === 'admin' && (
              <button 
                onClick={() => setActiveTab('all')} 
                className={`flex-1 lg:flex-none px-3 md:px-8 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'all' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500'}`}
              >
                HỆ THỐNG
              </button>
            )}
            <button 
              onClick={() => setActiveTab('personal')} 
              className={`flex-1 lg:flex-none px-3 md:px-8 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'personal' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500'}`}
            >
              CỦA TÔI
            </button>
        </div>
      </div>

      {/* Search & Filter Section */}
      <div className="bg-white p-2.5 md:p-6 rounded-[1.2rem] md:rounded-[2.5rem] border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 group-focus-within:text-blue-500" />
          <input 
            type="text" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            placeholder="Tìm nhân viên, đồ..." 
            className="w-full pl-10 pr-4 py-2.5 md:py-4 bg-gray-50 border-none rounded-xl md:rounded-2xl text-[11px] md:text-sm font-bold focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-2 md:col-span-2">
            <div className="relative group">
              <select 
                value={filterStatus} 
                onChange={e => setFilterStatus(e.target.value)} 
                className="w-full px-4 py-2.5 md:py-4 bg-gray-50 border-none rounded-xl md:rounded-2xl text-[11px] md:text-sm font-bold appearance-none outline-none focus:ring-2 focus:ring-blue-500/10 transition-all cursor-pointer"
              >
                <option value="all">Trạng thái</option>
                <option value="pending">⏳ Chờ duyệt</option>
                <option value="approved">✅ Đang mượn</option>
                <option value="returned">↩️ Đã trả</option>
                <option value="rejected">❌ Từ chối</option>
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
            </div>

            <div className="relative group">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
              <input 
                type="date" 
                value={filterStartDate} 
                onChange={e => setFilterStartDate(e.target.value)} 
                className="w-full pl-10 pr-4 py-2.5 md:py-4 bg-gray-50 border-none rounded-xl md:rounded-2xl text-[11px] md:text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
              />
            </div>
        </div>
      </div>
      
      {/* Desktop View (Table) */}
      <div className="hidden md:block bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-100">
        <div className="overflow-x-auto w-full no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-8 py-5 text-gray-400 font-black uppercase text-[10px] tracking-[0.2em]">Người mượn</th>
                <th className="px-8 py-5 text-gray-400 font-black uppercase text-[10px] tracking-[0.2em]">Thiết bị</th>
                <th className="px-8 py-5 text-gray-400 font-black uppercase text-[10px] tracking-[0.2em]">Thời gian</th>
                <th className="px-8 py-5 text-gray-400 font-black uppercase text-[10px] tracking-[0.2em] text-center">Trạng thái</th>
                <th className="px-8 py-5 text-gray-400 font-black uppercase text-[10px] tracking-[0.2em] text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={5} className="p-32 text-center"><Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto opacity-20" /></td></tr>
              ) : currentRequests.length === 0 ? (
                <tr><td colSpan={5} className="p-32 text-center text-gray-300 font-black italic uppercase tracking-widest opacity-50">Trống</td></tr>
              ) : (
                currentRequests.map((req) => {
                  const badge = getStatusBadge(req.status);
                  return (
                    <tr key={req.id} className="hover:bg-blue-50/20 transition-all duration-300 group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-base shadow-md border-2 border-indigo-400 group-hover:scale-105 transition-transform">
                            {req.user_name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-gray-900 text-[13px] tracking-tight">{req.user_name}</p>
                            <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest opacity-70 mt-0.5">{req.employee_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                           <div className="w-12 h-12 bg-white border-2 border-gray-50 rounded-xl flex items-center justify-center overflow-hidden p-1.5 shadow-sm">
                             {req.tool_image ? <img src={req.tool_image} alt="" className="w-full h-full object-contain" /> : <Wrench className="w-5 h-5 text-gray-200" />}
                           </div>
                           <p className="font-black text-gray-800 text-[13px] leading-tight max-w-[180px] uppercase tracking-tight">{req.tool_name}</p>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-tighter">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 opacity-30" />
                          {new Date(req.borrow_date).toLocaleDateString('vi-VN')}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest border transition-all shadow-sm ${badge.className}`}>
                          {badge.icon}
                          {badge.label}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-2 items-center">
                          {processingId === req.id ? (
                            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                          ) : (
                            <>
                              {user.role === 'admin' && activeTab === 'all' && req.status === 'pending' && (
                                <div className="flex items-center gap-2">
                                  <button onClick={() => setConfirmAction({ type: 'approve', req })} className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md hover:bg-emerald-700 active:scale-95 transition-all">
                                    <Check className="w-3.5 h-3.5" /> DUYỆT
                                  </button>
                                  <button onClick={() => setConfirmAction({ type: 'reject', req })} className="flex items-center gap-1.5 px-4 py-2.5 bg-white text-rose-600 border border-rose-100 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-rose-50 active:scale-95 transition-all">
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                              
                              {user.role === 'admin' && activeTab === 'all' && req.status === 'approved' && (
                                <button onClick={() => setConfirmAction({ type: 'return', req })} className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-blue-700 active:scale-95 transition-all">
                                  <RotateCcw className="w-4 h-4" /> THU HỒI
                                </button>
                              )}

                              {req.user_id === user.id && req.status === 'pending' && (
                                <button onClick={() => setConfirmAction({ type: 'cancel', id: req.id })} className="flex items-center gap-2 px-5 py-3 bg-white text-rose-600 border border-rose-100 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-50 active:scale-95 transition-all">
                                  <Trash2 className="w-4 h-4" /> HỦY ĐƠN
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile View (Cards) */}
      <div className="md:hidden space-y-3 px-1">
        {loading ? (
            <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto opacity-20" /></div>
        ) : currentRequests.length === 0 ? (
            <div className="py-20 text-center text-gray-300 font-black italic uppercase tracking-widest opacity-50">Không tìm thấy yêu cầu</div>
        ) : (
            currentRequests.map((req) => {
                const badge = getStatusBadge(req.status);
                const isApproved = req.status === 'approved';
                const isPending = req.status === 'pending';
                return (
                    <Card key={req.id} className={`p-3 rounded-[1.2rem] border-none shadow-md space-y-3 transition-all ${isApproved ? 'bg-emerald-50/20 ring-1 ring-emerald-500/20' : isPending ? 'bg-amber-50/20 ring-1 ring-amber-500/20' : ''}`}>
                        {/* Card Header: User Info + Status */}
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                                    {req.user_name?.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-black text-gray-900 text-[11px] leading-tight truncate max-w-[120px]">{req.user_name}</p>
                                    <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest mt-0.5">{req.employee_id}</p>
                                </div>
                            </div>
                            <div className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[7px] font-black uppercase tracking-widest border shadow-sm ${badge.className}`}>
                                {badge.icon}
                                {badge.label}
                            </div>
                        </div>

                        {/* Card Body: Tool Info */}
                        <div className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                             <div className="w-11 h-11 bg-white rounded-lg flex items-center justify-center overflow-hidden p-1.5 shadow-sm flex-shrink-0">
                                {req.tool_image ? <img src={req.tool_image} alt="" className="w-full h-full object-contain" /> : <Wrench className="w-4 h-4 text-gray-200" />}
                             </div>
                             <div className="flex-1 min-w-0">
                                <p className="font-black text-gray-800 text-[10px] uppercase truncate tracking-tight">{req.tool_name}</p>
                                <div className="flex items-center gap-1.5 mt-1 text-[8px] font-bold text-gray-400">
                                    <Calendar className="w-2.5 h-2.5 opacity-50" />
                                    {new Date(req.borrow_date).toLocaleDateString('vi-VN')}
                                </div>
                             </div>
                        </div>

                        {/* Card Footer: Actions */}
                        <div className="flex gap-2 pt-1">
                            {processingId === req.id ? (
                                <div className="w-full flex justify-center py-2"><Loader2 className="w-5 h-5 animate-spin text-blue-600" /></div>
                            ) : (
                                <>
                                    {user.role === 'admin' && activeTab === 'all' && req.status === 'pending' && (
                                        <>
                                            <button onClick={() => setConfirmAction({ type: 'approve', req })} className="flex-[2] flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                                                <Check className="w-3.5 h-3.5" /> DUYỆT
                                            </button>
                                            <button onClick={() => setConfirmAction({ type: 'reject', req })} className="flex-1 flex items-center justify-center gap-2 py-3 bg-white text-rose-600 border border-rose-100 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm active:scale-95 transition-all">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                    
                                    {user.role === 'admin' && activeTab === 'all' && isApproved && (
                                        <button 
                                          onClick={() => setConfirmAction({ type: 'return', req })} 
                                          className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-100 active:scale-95 transition-all"
                                        >
                                            <RotateCcw className="w-4 h-4" /> THU HỒI NGAY
                                        </button>
                                    )}

                                    {req.user_id === user.id && req.status === 'pending' && (
                                        <button onClick={() => setConfirmAction({ type: 'cancel', id: req.id })} className="w-full flex items-center justify-center gap-2 py-3.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm active:scale-95 transition-all">
                                            <Trash2 className="w-4 h-4" /> HỦY ĐƠN MƯỢN
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </Card>
                );
            })
        )}
      </div>

      {/* Pagination Section */}
      {filteredRequests.length > 0 && (
          <div className="bg-white border border-gray-100 p-3 md:p-6 rounded-[1.2rem] md:rounded-[3rem] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 md:gap-6 px-4 md:px-10">
            <div className="flex items-center gap-3">
              <span className="text-[9px] md:text-[10px] text-gray-400 font-black uppercase tracking-widest tabular-nums">
                {startIndex + 1}-{Math.min(filteredRequests.length, startIndex + pageSize)} / {filteredRequests.length}
              </span>
              <div className="h-3 w-[1px] bg-gray-200"></div>
              <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-lg text-[9px] md:text-[10px] font-black border border-blue-100 tabular-nums">Trang {currentPage}</span>
            </div>

            <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto">
              <button onClick={() => handlePageChange(1)} disabled={currentPage === 1} className="flex-1 sm:flex-none p-2 md:p-3 rounded-lg md:rounded-xl border border-gray-100 bg-white disabled:opacity-30 hover:bg-blue-50 transition-all active:scale-95"><ChevronsLeft className="w-4 h-4 md:w-5 md:h-5 mx-auto" /></button>
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="flex-1 sm:flex-none p-2 md:p-3 rounded-lg md:rounded-xl border border-gray-100 bg-white disabled:opacity-30 hover:bg-blue-50 transition-all active:scale-95"><ChevronLeft className="w-4 h-4 md:w-5 md:h-5 mx-auto" /></button>
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="flex-1 sm:flex-none p-2 md:p-3 rounded-lg md:rounded-xl border border-gray-100 bg-white disabled:opacity-30 hover:bg-blue-50 transition-all active:scale-95"><ChevronRight className="w-4 h-4 md:w-5 md:h-5 mx-auto" /></button>
              <button onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} className="flex-1 sm:flex-none p-2 md:p-3 rounded-lg md:rounded-xl border border-gray-100 bg-white disabled:opacity-30 hover:bg-blue-50 transition-all active:scale-95"><ChevronsRight className="w-4 h-4 md:w-5 md:h-5 mx-auto" /></button>
            </div>
          </div>
      )}

      {/* Action Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-end md:items-center justify-center p-0 md:p-6 backdrop-blur-xl animate-fade-in">
          <div className="bg-white rounded-t-[2rem] md:rounded-[3.5rem] shadow-2xl w-full max-w-sm overflow-hidden animate-slide-up md:animate-zoom-in border border-white/20">
            <div className="p-8 md:p-12 text-center">
              <div className={`w-20 h-20 md:w-24 md:h-24 rounded-[1.8rem] md:rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-2xl rotate-12 ${
                confirmAction.type === 'approve' ? 'bg-emerald-100 text-emerald-600' : 
                confirmAction.type === 'reject' ? 'bg-rose-100 text-rose-600' :
                'bg-blue-100 text-blue-600'
              }`}>
                {confirmAction.type === 'approve' ? <ThumbsUp className="w-10 h-10 md:w-12 md:h-12" /> : 
                 confirmAction.type === 'reject' ? <ThumbsDown className="w-10 h-10 md:w-12 md:h-12" /> :
                 <RotateCcw className="w-10 h-10 md:w-12 md:h-12" />}
              </div>
              <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-3 uppercase tracking-tighter">Xác nhận đơn?</h3>
              <p className="text-[9px] md:text-[11px] text-gray-400 font-bold leading-relaxed px-4 md:px-6 uppercase tracking-widest opacity-80 italic">
                {confirmAction.type === 'approve' ? 'Duyệt yêu cầu mượn thiết bị.' : 
                 confirmAction.type === 'reject' ? 'Từ chối yêu cầu mượn đồ.' : 
                 confirmAction.type === 'return' ? 'Xác nhận thu hồi thiết bị.' : 'Hủy yêu cầu mượn hiện tại.'}
              </p>
            </div>
            <div className="bg-gray-50/50 p-6 md:p-8 flex flex-col gap-3 md:gap-4 border-t border-gray-100 pb-10 md:pb-8">
              <button 
                onClick={handleConfirmAction} 
                className={`w-full py-4 md:py-5 text-white font-black rounded-2xl md:rounded-3xl text-[10px] md:text-xs uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all ${
                  confirmAction.type === 'approve' ? 'bg-emerald-600 shadow-emerald-100' : 
                  confirmAction.type === 'reject' ? 'bg-rose-600 shadow-rose-100' :
                  'bg-blue-600 shadow-blue-100'
                }`}
              >
                Xác nhận
              </button>
              <button 
                onClick={() => setConfirmAction(null)} 
                className="w-full py-4 md:py-5 bg-white text-gray-400 font-black rounded-2xl md:rounded-3xl border border-gray-200 text-[10px] md:text-xs uppercase tracking-[0.2em] active:scale-95 transition-all"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
