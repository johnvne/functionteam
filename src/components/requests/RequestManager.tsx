
import React, { useEffect, useState, useMemo, useContext } from 'react';
import { supabase } from '../../lib/supabase';
import { BorrowRequest, User } from '../../../types';
import { Card } from '../ui/Card';
import { 
  Check, X, Trash2, RotateCcw, 
  Loader2, Search, RefreshCw,
  PackageCheck, Timer, XCircle,
  Calendar, Wrench, User as UserIcon, Snowflake, Sparkles, Gift,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CalendarDays, Filter,
  AlertCircle, ArrowRight, Clock, ChevronDown
} from 'lucide-react';
import { ThemeContext } from '../../../App';

interface RequestManagerProps { user: User; }

const ITEMS_PER_PAGE = 10;
const todayStr = new Date().toISOString().split('T')[0];

const ToolTableImage = ({ toolId, toolName }: { toolId: string, toolName: string }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchToolImage = async () => {
      const { data } = await supabase.from('tools').select('image').eq('id', toolId).single();
      if (data?.image) setImageUrl(data.image);
    };
    fetchToolImage();
  }, [toolId]);

  return (
    <div className="w-12 h-12 md:w-16 md:h-16 bg-white border-2 border-gray-100 rounded-2xl overflow-hidden flex items-center justify-center p-1.5 shadow-sm shrink-0 group-hover:scale-105 transition-transform">
      {imageUrl ? (
        <img src={imageUrl} alt={toolName} className="w-full h-full object-contain" />
      ) : (
        <Wrench className="w-5 h-5 text-gray-300" />
      )}
    </div>
  );
};

export const RequestManager: React.FC<RequestManagerProps> = ({ user }) => {
  const { theme } = useContext(ThemeContext);
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'personal'>(user.role === 'admin' ? 'all' : 'personal');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState(todayStr); 
  const [currentPage, setCurrentPage] = useState(1);

  const isTet = theme === 'tet';

  const fetchRequests = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      let query = supabase.from('requests').select('*');
      if (user.role !== 'admin' || activeTab === 'personal') {
        query = query.eq('user_id', user.id);
      }
      const { data, error } = await query;
      if (error) throw error;
      setRequests(data as BorrowRequest[] || []);
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user, activeTab]);

  const filteredRequests = useMemo(() => {
    const statusPriority: Record<string, number> = {
      pending: 0,
      approved: 1,
      rejected: 2,
      returned: 3
    };

    return requests.filter(req => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        req.user_name.toLowerCase().includes(searchLower) ||
        req.tool_name.toLowerCase().includes(searchLower) ||
        req.employee_id.toLowerCase().includes(searchLower);
      const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
      const matchesDate = !filterDate || req.borrow_date.startsWith(filterDate);
      
      return matchesSearch && matchesStatus && matchesDate;
    }).sort((a, b) => {
      const priorityA = statusPriority[a.status] ?? 99;
      const priorityB = statusPriority[b.status] ?? 99;
      if (priorityA !== priorityB) return priorityA - priorityB;
      return new Date(b.borrow_date).getTime() - new Date(a.borrow_date).getTime();
    });
  }, [requests, searchTerm, filterStatus, filterDate]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / ITEMS_PER_PAGE));
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRequests.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRequests, currentPage]);

  useEffect(() => {
    setCurrentPage(1); 
  }, [searchTerm, filterStatus, filterDate, activeTab]);

  const handleAction = async (id: string, toolId: string, action: 'approve' | 'reject' | 'return' | 'cancel') => {
    setProcessingId(id);
    const oldRequests = [...requests];

    try {
      if (action === 'approve') {
        const { data: tool } = await supabase.from('tools').select('available').eq('id', toolId).single();
        if ((tool?.available || 0) <= 0) throw new Error("Hết hàng trong kho");
        await supabase.from('tools').update({ available: (tool?.available || 1) - 1 }).eq('id', toolId);
        await supabase.from('requests').update({ status: 'approved' }).eq('id', id);
      } else if (action === 'return') {
        const { data: tool } = await supabase.from('tools').select('available').eq('id', toolId).single();
        await supabase.from('tools').update({ available: (tool?.available || 0) + 1 }).eq('id', toolId);
        await supabase.from('requests').update({ status: 'returned', returned_at: new Date().toISOString() }).eq('id', id);
      } else if (action === 'reject') {
        await supabase.from('requests').update({ status: 'rejected' }).eq('id', id);
      } else if (action === 'cancel') {
        await supabase.from('requests').delete().eq('id', id);
      }
      window.dispatchEvent(new CustomEvent('refresh-counts'));
      await fetchRequests(true);
    } catch (e: any) {
      alert(e.message);
      setRequests(oldRequests);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: any = {
      pending: { color: 'bg-amber-700 text-white', icon: <Timer className="w-3 h-3 animate-pulse" />, label: 'CHỜ DUYỆT' },
      approved: { color: 'bg-indigo-700 text-white', icon: <PackageCheck className="w-3 h-3" />, label: 'ĐANG MƯỢN' },
      returned: { color: 'bg-emerald-700 text-white', icon: <RotateCcw className="w-3 h-3" />, label: 'ĐÃ TRẢ' },
      rejected: { color: 'bg-rose-700 text-white', icon: <XCircle className="w-3 h-3" />, label: 'TỪ CHỐI' }
    };
    const c = configs[status] || configs.pending;
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black border-2 border-white shadow-md ${c.color}`}>
        {c.icon} {c.label}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-24 px-2 md:px-0">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-2xl shadow-xl text-white transform hover:rotate-3 transition-transform ${isTet ? 'bg-red-700 shadow-red-100' : 'bg-indigo-600 shadow-indigo-100'}`}>
            <RefreshCw className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl md:text-3xl font-black text-gray-900 tracking-tight uppercase flex items-center gap-2 italic">
               Mượn tài sản
               {isTet && <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" />}
            </h2>
            <p className="text-[10px] md:text-xs text-gray-400 font-black uppercase tracking-widest mt-1 opacity-70">Điều hành xuất nhập kho Team V1</p>
          </div>
        </div>
        <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200 shadow-inner w-full lg:w-auto">
            {user.role === 'admin' && (
              <button onClick={() => setActiveTab('all')} className={`flex-1 lg:flex-none px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'all' ? (isTet ? 'bg-red-700 text-white shadow-lg' : 'bg-white text-indigo-700 shadow-lg') : 'text-gray-600 hover:text-gray-900'}`}>Hệ thống</button>
            )}
            <button onClick={() => setActiveTab('personal')} className={`flex-1 lg:flex-none px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'personal' ? (isTet ? 'bg-red-700 text-white shadow-lg' : 'bg-white text-indigo-700 shadow-lg') : 'text-gray-600 hover:text-gray-900'}`}>Cá nhân</button>
        </div>
      </div>

      {/* FILTERS SECTION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 relative group">
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors ${isTet ? 'group-focus-within:text-red-700' : 'group-focus-within:text-indigo-700'}`} />
          <input 
            type="text" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            placeholder="Tìm mã nhân viên, tên, hoặc thiết bị..." 
            className={`w-full pl-12 pr-4 py-5 bg-white border border-gray-100 rounded-[1.5rem] text-sm font-bold outline-none focus:ring-8 transition-all shadow-sm ${isTet ? 'focus:ring-red-500/5 focus:border-red-600/40' : 'focus:ring-indigo-500/5 focus:border-indigo-600/40'}`} 
          />
        </div>
        
        <div className="lg:col-span-4 flex items-center gap-3 bg-white p-3 border border-gray-100 rounded-[1.5rem] shadow-sm">
           <CalendarDays className="w-6 h-6 text-gray-400 ml-2" />
           <input 
            type="date" 
            value={filterDate} 
            onChange={e => setFilterDate(e.target.value)}
            className={`flex-1 bg-transparent border-none text-[12px] font-black uppercase outline-none cursor-pointer text-gray-900`}
           />
           {filterDate !== todayStr && (
             <button onClick={() => setFilterDate(todayStr)} className="px-3 py-1.5 bg-gray-200 text-gray-800 text-[10px] font-black rounded-xl hover:bg-gray-300 transition-colors">HÔM NAY</button>
           )}
        </div>

        <div className="lg:col-span-3">
          <div className="relative group">
            <select 
              value={filterStatus} 
              onChange={e => setFilterStatus(e.target.value)} 
              className="w-full pl-6 pr-10 py-5 bg-white border border-gray-100 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest outline-none cursor-pointer shadow-sm appearance-none text-gray-800"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">⏳ Đang chờ</option>
              <option value="approved">📦 Đang mượn</option>
              <option value="returned">✅ Đã trả</option>
              <option value="rejected">❌ Từ chối</option>
            </select>
            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none group-focus-within:rotate-180 transition-transform" />
          </div>
        </div>
      </div>

      {/* REQUESTS LIST - Mobile Cards / Desktop Table */}
      <div className="space-y-4">
        {loading ? (
            <div className="py-32 text-center flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-indigo-600 opacity-20" />
              <p className="text-xs font-black uppercase tracking-widest text-gray-300">Đang tải yêu cầu...</p>
            </div>
        ) : paginatedRequests.length === 0 ? (
            <div className="py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
               <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                 <AlertCircle className="w-10 h-10 text-gray-200" />
               </div>
               <p className="text-[11px] md:text-sm font-black text-gray-400 uppercase tracking-[0.2em] italic">Không tìm thấy dữ liệu phù hợp</p>
            </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:gap-0 lg:bg-white lg:rounded-[3rem] lg:shadow-2xl lg:overflow-hidden lg:border-none">
            {/* Desktop Table Header */}
            <div className="hidden lg:grid grid-cols-12 bg-gray-50/80 border-b border-gray-100 px-10 py-8">
               <div className="col-span-3 text-[11px] font-black text-gray-400 uppercase tracking-widest">Người mượn</div>
               <div className="col-span-3 text-[11px] font-black text-gray-400 uppercase tracking-widest">Thiết bị</div>
               <div className="col-span-2 text-[11px] font-black text-gray-400 uppercase tracking-widest">Thời gian</div>
               <div className="col-span-2 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Trạng thái</div>
               <div className="col-span-2 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Thao tác</div>
            </div>

            {paginatedRequests.map((req) => (
              <div 
                key={req.id} 
                className={`bg-white rounded-[2.5rem] p-6 lg:p-0 lg:rounded-none lg:grid lg:grid-cols-12 lg:items-center lg:px-10 lg:py-7 lg:border-b lg:border-gray-50 transition-all group relative border-4 border-transparent shadow-xl lg:shadow-none
                  ${isTet ? 'hover:bg-red-50/60' : 'hover:bg-indigo-50/40'}
                  hover:shadow-2xl lg:hover:shadow-none hover:scale-[1.01] lg:hover:scale-[1.002] active:scale-[0.99] lg:active:scale-100 z-0 hover:z-10`}
              >
                {/* Mobile View: User Info Header */}
                <div className="lg:hidden flex items-center justify-between mb-6 pb-4 border-b border-gray-50">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-xl ${isTet ? 'bg-red-700' : 'bg-indigo-700'}`}>{req.user_name.charAt(0)}</div>
                    <div>
                      <p className="font-black text-sm uppercase italic text-gray-900 leading-tight">{req.user_name}</p>
                      <p className="text-[10px] text-gray-400 font-bold tracking-widest mt-1 uppercase">{req.employee_id}</p>
                    </div>
                  </div>
                  {getStatusBadge(req.status)}
                </div>

                {/* Grid Item: User Info (Desktop only) */}
                <div className="hidden lg:col-span-3 lg:flex items-center gap-5">
                   <div className={`w-14 h-14 text-white rounded-[1.2rem] flex items-center justify-center font-black text-xl shadow-lg transition-transform group-hover:rotate-3 ${isTet ? 'bg-red-700' : 'bg-indigo-700'}`}>{req.user_name.charAt(0)}</div>
                   <div>
                     <p className="font-black text-sm md:text-base uppercase italic text-gray-900 truncate leading-none mb-1.5">{req.user_name}</p>
                     <p className="text-[10px] text-gray-400 font-black tracking-widest uppercase">{req.employee_id}</p>
                   </div>
                </div>

                {/* Grid Item: Tool Info */}
                <div className="lg:col-span-3 flex items-center gap-5 mb-6 lg:mb-0">
                  <ToolTableImage toolId={req.tool_id} toolName={req.tool_name} />
                  <div>
                    <p className="lg:hidden text-[10px] font-black text-gray-400 uppercase mb-1">Thiết bị mượn:</p>
                    <p className="font-black text-sm md:text-lg uppercase tracking-tighter text-gray-800 leading-tight italic group-hover:text-indigo-700 transition-colors">{req.tool_name}</p>
                  </div>
                </div>

                {/* Grid Item: Date Info */}
                <div className="lg:col-span-2 flex flex-col justify-center gap-1.5 mb-6 lg:mb-0">
                  <div className="flex items-center gap-2 text-xs font-black text-gray-800 tabular-nums">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{new Date(req.borrow_date).toLocaleDateString('vi-VN')}</span>
                  </div>
                  {req.returned_at && (
                    <div className="flex items-center gap-2 text-[11px] font-black text-emerald-700 tabular-nums">
                       <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                       <span>{new Date(req.returned_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                  )}
                </div>

                {/* Grid Item: Status (Desktop only) */}
                <div className="hidden lg:col-span-2 lg:flex justify-center">
                  {getStatusBadge(req.status)}
                </div>

                {/* Grid Item: Actions */}
                <div className="lg:col-span-2 flex justify-end lg:pr-2">
                   {processingId === req.id ? (
                      <div className="p-4 bg-gray-50 rounded-2xl"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
                   ) : (
                      <div className="flex gap-3 w-full lg:w-auto">
                        {activeTab === 'all' && user.role === 'admin' && req.status === 'pending' && (
                          <>
                            <button onClick={() => handleAction(req.id, req.tool_id, 'approve')} className="flex-1 lg:flex-none p-5 lg:p-3.5 bg-emerald-700 text-white rounded-2xl shadow-xl shadow-emerald-200/50 hover:bg-emerald-800 transition-all active:scale-90" title="Duyệt"><Check className="w-6 h-6 lg:w-5 lg:h-5" /></button>
                            <button onClick={() => handleAction(req.id, req.tool_id, 'reject')} className="flex-1 lg:flex-none p-5 lg:p-3.5 bg-rose-700 text-white rounded-2xl shadow-xl shadow-rose-200/50 hover:bg-rose-800 transition-all active:scale-90" title="Từ chối"><X className="w-6 h-6 lg:w-5 lg:h-5" /></button>
                          </>
                        )}
                        {activeTab === 'all' && user.role === 'admin' && req.status === 'approved' && (
                          <button onClick={() => handleAction(req.id, req.tool_id, 'return')} className="w-full lg:w-auto px-10 lg:px-6 py-5 lg:py-3.5 bg-gray-900 text-white font-black rounded-2xl text-[11px] uppercase tracking-widest shadow-2xl hover:bg-black transition-all active:scale-95 border-b-4 border-white/10">THU HỒI</button>
                        )}
                        {req.user_id === user.id && req.status === 'pending' && (
                          <button onClick={() => handleAction(req.id, req.tool_id, 'cancel')} className="w-full lg:w-auto p-5 lg:p-3.5 bg-rose-50 text-rose-700 rounded-2xl border-2 border-rose-200 hover:bg-rose-700 hover:text-white transition-all active:scale-90 shadow-lg" title="Hủy yêu cầu"><Trash2 className="w-6 h-6 lg:w-5 lg:h-5" /></button>
                        )}
                      </div>
                   )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PAGINATION FOOTER */}
      {filteredRequests.length > 0 && (
        <Card className="p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl border-none bg-white flex flex-col sm:flex-row items-center justify-between gap-8 px-12">
          <div className="text-[11px] md:text-sm text-gray-500 font-black uppercase tracking-[0.2em] flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
             Trang <span className="text-gray-900 tabular-nums font-black">{currentPage} / {totalPages}</span>
             <span className="text-gray-300 font-medium ml-2">|</span>
             <span className="text-indigo-700 tabular-nums font-black ml-2">{filteredRequests.length} đơn mượn</span>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-4 rounded-2xl border-2 border-gray-100 bg-white text-gray-800 disabled:opacity-20 hover:bg-indigo-50 transition-all active:scale-90 shadow-sm"
            >
              <ChevronsLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-4 rounded-2xl border-2 border-gray-100 bg-white text-gray-800 disabled:opacity-20 hover:bg-indigo-50 transition-all active:scale-90 shadow-sm"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            <div className={`w-14 h-14 rounded-2xl font-black text-xl flex items-center justify-center shadow-2xl transform transition-transform hover:scale-110 border-4 border-white ring-2 ring-indigo-600/10 mx-4 ${isTet ? 'bg-red-700 text-white' : 'bg-indigo-700 text-white'}`}>
                {currentPage}
            </div>

            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-4 rounded-2xl border-2 border-gray-100 bg-white text-gray-800 disabled:opacity-20 hover:bg-indigo-50 transition-all active:scale-90 shadow-sm"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-4 rounded-2xl border-2 border-gray-100 bg-white text-gray-800 disabled:opacity-20 hover:bg-indigo-50 transition-all active:scale-90 shadow-sm"
            >
              <ChevronsRight className="w-6 h-6" />
            </button>
          </div>
        </Card>
      )}
      
      <div className="flex justify-center gap-16 py-12 opacity-10 select-none pointer-events-none">
         {isTet ? Array.from({length: 4}).map((_, i) => <Gift key={i} className="w-12 h-12 text-yellow-600" />) : Array.from({length: 4}).map((_, i) => <Snowflake key={i} className="w-12 h-12 text-blue-600" />)}
      </div>
    </div>
  );
};
