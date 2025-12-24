
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { BorrowRequest, User } from '../../../types';
import { Card } from '../ui/Card';
import { 
  Check, X, Trash2, RotateCcw, 
  Loader2, Search, RefreshCw,
  PackageCheck, Timer, XCircle,
  Calendar, Wrench, User as UserIcon, Snowflake, Sparkles, Gift,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CalendarDays, Filter
} from 'lucide-react';

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
    <div className="w-12 h-12 bg-white border border-gray-100 rounded-xl overflow-hidden flex items-center justify-center p-1 shadow-sm transition-transform group-hover:scale-110 duration-300">
      {imageUrl ? (
        <img src={imageUrl} alt={toolName} className="w-full h-full object-contain" />
      ) : (
        <Wrench className="w-5 h-5 text-gray-300" />
      )}
    </div>
  );
};

export const RequestManager: React.FC<RequestManagerProps> = ({ user }) => {
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'personal'>(user.role === 'admin' ? 'all' : 'personal');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState(todayStr); // Mặc định là ngày hôm nay
  const [currentPage, setCurrentPage] = useState(1);

  const month = new Date().getMonth();
  const isNoel = month === 11;
  const isTet = month === 0 || month === 1;

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
      returned: 2,
      rejected: 3
    };

    return requests.filter(req => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        req.user_name.toLowerCase().includes(searchLower) ||
        req.tool_name.toLowerCase().includes(searchLower) ||
        req.employee_id.toLowerCase().includes(searchLower);
      const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
      // Lọc theo ngày (chỉ lấy phần YYYY-MM-DD từ borrow_date)
      const matchesDate = !filterDate || req.borrow_date.startsWith(filterDate);
      
      return matchesSearch && matchesStatus && matchesDate;
    }).sort((a, b) => {
      const priorityA = statusPriority[a.status] ?? 99;
      const priorityB = statusPriority[b.status] ?? 99;
      if (priorityA !== priorityB) return priorityA - priorityB;
      return new Date(b.borrow_date).getTime() - new Date(a.borrow_date).getTime();
    });
  }, [requests, searchTerm, filterStatus, filterDate]);

  // Logic phân trang
  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / ITEMS_PER_PAGE));
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRequests.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRequests, currentPage]);

  useEffect(() => {
    setCurrentPage(1); // Reset trang khi đổi bộ lọc
  }, [searchTerm, filterStatus, filterDate, activeTab]);

  const handleAction = async (id: string, toolId: string, action: 'approve' | 'reject' | 'return' | 'cancel') => {
    setProcessingId(id);
    const oldRequests = [...requests];

    let newStatus: BorrowRequest['status'] = 'pending';
    if (action === 'approve') newStatus = 'approved';
    else if (action === 'reject') newStatus = 'rejected';
    else if (action === 'return') newStatus = 'returned';
    
    if (action === 'cancel') {
      setRequests(prev => prev.filter(r => r.id !== id));
    } else {
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus, returned_at: action === 'return' ? new Date().toISOString() : r.returned_at } : r));
    }

    try {
      if (action === 'approve') {
        const { data: tool } = await supabase.from('tools').select('available').eq('id', toolId).single();
        if ((tool?.available || 0) <= 0) {
           setRequests(oldRequests);
           throw new Error("Hết hàng trong kho");
        }
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
    } catch (e: any) {
      alert(e.message);
      setRequests(oldRequests);
    } finally {
      setProcessingId(null);
      fetchRequests(true);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: any = {
      pending: { color: 'bg-amber-500 text-white', icon: <Timer className="w-4 h-4 animate-pulse" />, label: 'CHỜ DUYỆT' },
      approved: { color: 'bg-emerald-600 text-white', icon: <PackageCheck className="w-4 h-4" />, label: 'ĐANG MƯỢN' },
      returned: { color: 'bg-blue-500 text-white', icon: <RotateCcw className="w-4 h-4" />, label: 'ĐÃ TRẢ' },
      rejected: { color: 'bg-red-500 text-white', icon: <XCircle className="w-4 h-4" />, label: 'TỪ CHỐI' }
    };
    const c = configs[status] || configs.pending;
    return (
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black shadow-sm transition-all duration-300 group-hover:scale-105 ${c.color}`}>
        {c.icon} {c.label}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className={`p-3 md:p-4 rounded-2xl shadow-xl text-white transform hover:rotate-3 transition-transform ${isNoel ? 'bg-red-600' : (isTet ? 'bg-red-700' : 'bg-blue-600')}`}>
            <RefreshCw className="w-6 h-6 md:w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight uppercase flex items-center gap-2 italic">
               Duyệt mượn thiết bị
               {isNoel && <Snowflake className="w-5 h-5 text-blue-300 animate-spin-slow" />}
               {isTet && <Sparkles className="w-5 h-5 text-yellow-400" />}
            </h2>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1 opacity-70">
              {filterDate === todayStr ? 'Đang hiển thị đơn hôm nay 📅' : `Đang hiển thị đơn ngày ${filterDate.split('-').reverse().join('/')}`}
            </p>
          </div>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200 shadow-inner">
            {user.role === 'admin' && (
              <button onClick={() => setActiveTab('all')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'all' ? (isNoel || isTet ? 'bg-red-600 text-white' : 'bg-white text-blue-600 shadow-md') : 'text-gray-500 hover:text-gray-700'}`}>Toàn bộ</button>
            )}
            <button onClick={() => setActiveTab('personal')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'personal' ? (isNoel || isTet ? 'bg-red-600 text-white' : 'bg-white text-blue-600 shadow-md') : 'text-gray-500 hover:text-gray-700'}`}>Của tôi</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-5 relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-blue-600 transition-colors" />
          <input 
            type="text" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            placeholder="Tìm mã NV, tên, thiết bị..." 
            className="w-full pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-red-500/5 focus:border-red-500 transition-all shadow-sm" 
          />
        </div>
        
        <div className="md:col-span-4 flex items-center gap-2 bg-white p-2 border border-gray-100 rounded-2xl shadow-sm">
           <CalendarDays className="w-5 h-5 text-gray-400 ml-2" />
           <input 
            type="date" 
            value={filterDate} 
            onChange={e => setFilterDate(e.target.value)}
            className="flex-1 bg-transparent border-none text-[11px] font-black uppercase outline-none focus:text-red-600 cursor-pointer"
           />
           {filterDate !== todayStr && (
             <button onClick={() => setFilterDate(todayStr)} className="px-3 py-1 bg-gray-100 text-[8px] font-black rounded-lg hover:bg-gray-200 transition-colors">HÔM NAY</button>
           )}
        </div>

        <div className="md:col-span-3">
          <select 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value)} 
            className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer shadow-sm focus:border-red-500 transition-all"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">⏳ Chờ duyệt</option>
            <option value="approved">📦 Đang mượn</option>
            <option value="returned">✅ Đã trả đồ</option>
            <option value="rejected">❌ Từ chối</option>
          </select>
        </div>
      </div>

      <Card className="p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-white animate-zoom-in min-h-[400px]">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Người mượn</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Thiết bị</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Thời gian</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Trạng thái</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50/50">
              {loading ? (
                <tr><td colSpan={5} className="py-32 text-center"><Loader2 className="w-10 h-10 animate-spin text-red-600 mx-auto opacity-20" /></td></tr>
              ) : paginatedRequests.length === 0 ? (
                <tr><td colSpan={5} className="py-32 text-center text-gray-300 font-black italic uppercase tracking-widest opacity-50">Không tìm thấy yêu cầu nào</td></tr>
              ) : (
                paginatedRequests.map((req) => (
                  <tr 
                    key={req.id} 
                    className="group relative transition-all duration-500 ease-out hover:bg-blue-50/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:translate-x-1 border-l-4 border-l-transparent hover:border-l-blue-600 cursor-default"
                  >
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-11 h-11 text-white rounded-2xl flex items-center justify-center font-black text-sm shadow-lg group-hover:scale-110 transition-transform ${isNoel ? 'bg-red-700' : (isTet ? 'bg-red-800' : 'bg-indigo-600')}`}>
                          {req.user_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-black text-gray-900 text-sm group-hover:text-blue-700 transition-colors uppercase italic">{req.user_name}</div>
                          <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">{req.employee_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <ToolTableImage toolId={req.tool_id} toolName={req.tool_name} />
                        <div className="font-black text-gray-800 text-sm uppercase tracking-tighter line-clamp-1 group-hover:text-blue-600 transition-colors">{req.tool_name}</div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-gray-700 font-black text-[10px] uppercase tracking-widest">
                          <Calendar className="w-3.5 h-3.5 text-blue-500" />
                          {new Date(req.borrow_date).toLocaleDateString('vi-VN')}
                        </div>
                        {req.returned_at && (
                          <div className="text-[8px] font-black text-emerald-600 italic">Trả lúc: {new Date(req.returned_at).toLocaleTimeString('vi-VN')}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-10 py-6 text-center">
                      {getStatusBadge(req.status)}
                    </td>
                    <td className="px-10 py-6 text-right">
                      {processingId === req.id ? (
                        <Loader2 className="w-6 h-6 animate-spin ml-auto text-red-600" />
                      ) : (
                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          {activeTab === 'all' && user.role === 'admin' && req.status === 'pending' && (
                            <>
                              <button onClick={() => handleAction(req.id, req.tool_id, 'approve')} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-700 active:scale-90 transition-all border-b-4 border-emerald-800">DUYỆT</button>
                              <button onClick={() => handleAction(req.id, req.tool_id, 'reject')} className="p-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm active:scale-90 border-b-4 border-rose-200" title="Từ chối"><X className="w-4 h-4" /></button>
                            </>
                          )}
                          {activeTab === 'all' && user.role === 'admin' && req.status === 'approved' && (
                            <button onClick={() => handleAction(req.id, req.tool_id, 'return')} className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] shadow-xl shadow-red-200 hover:bg-red-700 active:scale-95 transition-all border-b-4 border-red-900">
                              <RotateCcw className="w-4 h-4" /> THU HỒI
                            </button>
                          )}
                          {req.user_id === user.id && req.status === 'pending' && (
                            <button onClick={() => handleAction(req.id, req.tool_id, 'cancel')} className="p-2.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all active:scale-90"><Trash2 className="w-4 h-4" /></button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang Footer */}
        {filteredRequests.length > 0 && (
          <div className="bg-gray-50/50 border-t border-gray-100 p-8 flex flex-col sm:flex-row items-center justify-between gap-6 px-10">
            <div className="text-[10px] text-gray-400 font-black uppercase tracking-[0.15em]">
              Hiển thị <span className="text-gray-900 tabular-nums">{(currentPage-1)*ITEMS_PER_PAGE + 1}-{Math.min(filteredRequests.length, currentPage*ITEMS_PER_PAGE)}</span> trong {filteredRequests.length} yêu cầu
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-3 rounded-xl border border-gray-100 bg-white disabled:opacity-30 hover:bg-blue-50 transition-all shadow-sm active:scale-90"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-3 rounded-xl border border-gray-100 bg-white disabled:opacity-30 hover:bg-blue-50 transition-all shadow-sm active:scale-90"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-1.5 px-2">
                 {Array.from({length: totalPages}, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1).map((p, idx, arr) => (
                    <React.Fragment key={p}>
                        {idx > 0 && arr[idx-1] !== p - 1 && <span className="text-gray-300 font-black">...</span>}
                        <button 
                            onClick={() => setCurrentPage(p)}
                            className={`w-9 h-9 rounded-xl font-black text-[10px] transition-all border-2 tabular-nums ${currentPage === p ? 'bg-red-600 text-white border-red-600 shadow-lg scale-110' : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-50'}`}
                        >
                            {p}
                        </button>
                    </React.Fragment>
                 ))}
              </div>

              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-3 rounded-xl border border-gray-100 bg-white disabled:opacity-30 hover:bg-blue-50 transition-all shadow-sm active:scale-90"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-3 rounded-xl border border-gray-100 bg-white disabled:opacity-30 hover:bg-blue-50 transition-all shadow-sm active:scale-90"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Card>
      
      <div className="flex justify-center gap-8 py-4 opacity-20">
         {isNoel && Array.from({length: 3}).map((_, i) => <Snowflake key={i} className="w-8 h-8 text-blue-400" />)}
         {isTet && Array.from({length: 3}).map((_, i) => <Gift key={i} className="w-8 h-8 text-yellow-500" />)}
      </div>
    </div>
  );
};
