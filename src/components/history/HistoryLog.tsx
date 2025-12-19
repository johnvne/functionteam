
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { BorrowRequest, User } from '../../../types';
import { Card } from '../ui/Card';
import { 
  History, Search, Calendar, Filter, X, 
  User as UserIcon, ShieldCheck, ChevronDown, 
  SlidersHorizontal, ChevronLeft, ChevronRight, 
  Loader2, RefreshCw, AlertCircle, ChevronsLeft, ChevronsRight 
} from 'lucide-react';

interface HistoryLogProps {
  user: User;
}

// Mở rộng interface local để hứng thêm field người xử lý từ DB
interface ExtendedBorrowRequest extends BorrowRequest {
  approved_by?: string;
  rejected_by?: string;
  approved_at?: string;
  rejected_at?: string;
}

type QuickDateOption = 'custom' | 'today' | '7days' | '30days' | 'thisMonth';

const ITEMS_PER_PAGE = 20;

export const HistoryLog: React.FC<HistoryLogProps> = ({ user }) => {
  const [logs, setLogs] = useState<ExtendedBorrowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // States cho bộ lọc
  const [searchText, setSearchText] = useState('');
  const [handlerFilter, setHandlerFilter] = useState(''); 
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [quickDate, setQuickDate] = useState<QuickDateOption>('custom');

  // State phân trang
  const [currentPage, setCurrentPage] = useState(1);

  const fetchHistory = async (silent = false) => {
    if (!user) return;
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    
    setError(null);

    try {
      let query = supabase
        .from('requests')
        .select('*')
        .order('borrow_date', { ascending: false });

      if (user.role !== 'admin') {
        query = query.eq('user_id', user.id);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (startDate) {
        query = query.gte('borrow_date', `${startDate}T00:00:00`);
      }
      if (endDate) {
        query = query.lte('borrow_date', `${endDate}T23:59:59`);
      }

      const { data, error: fetchError } = await query;
      
      if (fetchError) throw fetchError;
      
      if (data) {
        setLogs(data as ExtendedBorrowRequest[]);
      }
    } catch (err: any) {
      console.error("Fetch history error:", err);
      setError("Không thể tải dữ liệu lịch sử. Vui lòng thử lại.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user.id, startDate, endDate, statusFilter, user.role]);

  // Reset trang về 1 khi bất kỳ bộ lọc nào thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, handlerFilter, statusFilter, startDate, endDate]);

  const getHandlerName = (req: ExtendedBorrowRequest) => {
    if (req.status === 'approved' || req.status === 'returned') return req.approved_by || 'Admin';
    if (req.status === 'rejected') return req.rejected_by || 'Admin';
    return '-';
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const searchLower = searchText.trim().toLowerCase();
      const handlerLower = handlerFilter.trim().toLowerCase();
      
      const matchesText = !searchLower || (
        log.user_name?.toLowerCase().includes(searchLower) ||
        log.employee_id?.toLowerCase().includes(searchLower) ||
        log.tool_name?.toLowerCase().includes(searchLower)
      );

      const currentHandler = getHandlerName(log).toLowerCase();
      const matchesHandler = !handlerFilter || currentHandler.includes(handlerLower);

      return matchesText && matchesHandler;
    });
  }, [logs, searchText, handlerFilter]);

  // Logic phân trang cho Client-side
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / ITEMS_PER_PAGE));
  
  const currentLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLogs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredLogs, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleQuickDate = (option: QuickDateOption) => {
    setQuickDate(option);
    const today = new Date();
    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    let start = new Date();
    let end = new Date();

    switch (option) {
        case 'today':
            break;
        case '7days':
            start.setDate(today.getDate() - 7);
            break;
        case '30days':
            start.setDate(today.getDate() - 30);
            break;
        case 'thisMonth':
            start = new Date(today.getFullYear(), today.getMonth(), 1);
            end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            break;
        case 'custom':
            return; 
    }

    setStartDate(formatDate(start));
    setEndDate(formatDate(end));
  };

  const handleManualDateChange = (type: 'start' | 'end', value: string) => {
      setQuickDate('custom');
      if (type === 'start') setStartDate(value);
      else setEndDate(value);
  };

  const clearFilters = () => {
    setSearchText('');
    setHandlerFilter('');
    setStartDate('');
    setEndDate('');
    setStatusFilter('all');
    setQuickDate('custom');
    setCurrentPage(1);
  };

  const activeFiltersCount = [
    searchText.trim(), 
    handlerFilter.trim(), 
    startDate, 
    endDate, 
    statusFilter !== 'all'
  ].filter(Boolean).length;

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
                <div className="p-4 bg-purple-600 rounded-[1.5rem] shadow-xl shadow-purple-100 text-white">
                    <History className="w-8 h-8" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none">Lịch sử hoạt động</h2>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1 opacity-70">
                        {user.role === 'admin' ? 'Theo dõi toàn bộ lịch sử mượn trả hệ thống' : 'Theo dõi lịch sử mượn trả cá nhân'}
                    </p>
                </div>
            </div>
            <button 
              onClick={() => fetchHistory(true)} 
              className="flex items-center gap-2 px-6 py-3 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-gray-200"
            >
              {isRefreshing ? <Loader2 className="w-4 h-4 animate-spin"/> : <RefreshCw className="w-4 h-4"/>}
              Làm mới
            </button>
       </div>

       <Card className="p-0 overflow-hidden border-none shadow-2xl rounded-[3rem] bg-white">
            <div className="p-8 space-y-6 bg-white">
                <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-gray-400 flex items-center gap-2 uppercase tracking-[0.2em]">
                        <SlidersHorizontal className="w-4 h-4 text-purple-600" /> Bộ lọc tìm kiếm
                    </h3>
                    {activeFiltersCount > 0 && (
                        <button 
                            onClick={clearFilters}
                            className="text-[10px] text-rose-600 hover:text-rose-800 font-black uppercase tracking-widest flex items-center gap-1 hover:underline"
                        >
                            <X className="w-3.5 h-3.5" /> Xóa {activeFiltersCount} bộ lọc
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-5 space-y-4 border-r border-gray-100 pr-0 lg:pr-8">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Khoảng thời gian</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                             {[{id: 'today', l: 'Hôm nay'}, {id: '7days', l: '7 ngày'}, {id: '30days', l: '30 ngày'}, {id: 'thisMonth', l: 'Tháng này'}].map((btn) => (
                                <button
                                    key={btn.id}
                                    onClick={() => handleQuickDate(btn.id as QuickDateOption)}
                                    className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border-2 ${
                                        quickDate === btn.id 
                                        ? 'bg-purple-50 text-purple-700 border-purple-200 shadow-md transform scale-105' 
                                        : 'bg-white text-gray-400 border-gray-100 hover:bg-gray-50'
                                    }`}
                                >
                                    {btn.l}
                                </button>
                             ))}
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1 group">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-purple-600" />
                                <input 
                                    type="date" 
                                    value={startDate}
                                    onChange={(e) => handleManualDateChange('start', e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-purple-500/10 outline-none transition-all text-gray-900"
                                />
                            </div>
                            <span className="text-gray-300 font-black">-</span>
                            <div className="relative flex-1 group">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-purple-600" />
                                <input 
                                    type="date" 
                                    value={endDate}
                                    onChange={(e) => handleManualDateChange('end', e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-purple-500/10 outline-none transition-all text-gray-900"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-7 space-y-4">
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Từ khóa chung</label>
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-purple-600" />
                                    <input 
                                        type="text" 
                                        value={searchText}
                                        onChange={(e) => setSearchText(e.target.value)}
                                        placeholder="Tên, mã NV, thiết bị..." 
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-purple-500/10 outline-none transition-all text-gray-900"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Trạng thái đơn</label>
                                <div className="relative group">
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="w-full pl-5 pr-10 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-purple-500/10 outline-none transition-all text-gray-900 appearance-none cursor-pointer"
                                    >
                                        <option value="all">Tất cả trạng thái</option>
                                        <option value="pending">⏳ Chờ duyệt</option>
                                        <option value="approved">✅ Đang mượn</option>
                                        <option value="returned">↩️ Đã trả</option>
                                        <option value="rejected">❌ Đã từ chối</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none group-focus-within:text-purple-600" />
                                </div>
                            </div>
                         </div>
                         
                         <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Người xử lý (Admin)</label>
                            <div className="relative group">
                                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-purple-600" />
                                <input 
                                    type="text" 
                                    value={handlerFilter}
                                    onChange={(e) => setHandlerFilter(e.target.value)}
                                    placeholder="Tìm người duyệt yêu cầu..." 
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-purple-500/10 outline-none transition-all text-gray-900"
                                />
                            </div>
                         </div>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 shadow-sm">
                            <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Người mượn</th>
                            <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Thiết bị</th>
                            <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Ngày mượn</th>
                            <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Ngày trả</th>
                            <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Người xử lý</th>
                            <th className="px-10 py-6 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 bg-white">
                        {loading ? (
                            <tr><td colSpan={6} className="px-10 py-32 text-center"><div className="flex flex-col items-center gap-4"><Loader2 className="w-12 h-12 animate-spin text-purple-600 opacity-20" /><p className="text-sm font-black uppercase tracking-widest text-gray-300">Đang tải lịch sử...</p></div></td></tr>
                        ) : error ? (
                             <tr><td colSpan={6} className="px-10 py-32 text-center"><div className="flex flex-col items-center gap-4 text-rose-500"><AlertCircle className="w-12 h-12" /><p className="text-sm font-black uppercase tracking-widest">{error}</p><button onClick={() => fetchHistory()} className="px-6 py-2 bg-rose-50 rounded-xl text-xs font-black uppercase tracking-widest border border-rose-100">Thử lại</button></div></td></tr>
                        ) : currentLogs.length === 0 ? (
                            <tr><td colSpan={6} className="px-10 py-32 text-center text-gray-300 font-black italic uppercase tracking-widest opacity-50">Không có dữ liệu phù hợp</td></tr>
                        ) : (
                            currentLogs.map((item) => (
                                <tr key={item.id} className="hover:bg-purple-50/20 transition-all duration-300 group">
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-[1rem] bg-purple-600 text-white flex items-center justify-center font-black text-lg shadow-lg border-2 border-purple-400 transition-transform group-hover:scale-110 group-hover:rotate-3">
                                                {item.user_name ? item.user_name.charAt(0) : '?'}
                                            </div>
                                            <div>
                                                <div className="font-black text-gray-900 text-sm tracking-tight">{item.user_name}</div>
                                                <div className="text-[10px] text-gray-400 font-black tracking-widest uppercase opacity-70 mt-0.5">{item.employee_id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6">
                                        <span className="font-black text-gray-800 text-sm leading-tight group-hover:text-purple-700 transition-colors">{item.tool_name}</span>
                                    </td>
                                    <td className="px-10 py-6">
                                        <div className="text-gray-900 font-black text-xs">{new Date(item.borrow_date).toLocaleDateString('vi-VN')}</div>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter mt-0.5 flex items-center gap-1 opacity-60">
                                            <History className="w-3 h-3"/> 
                                            {new Date(item.borrow_date).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                    </td>
                                    <td className="px-10 py-6">
                                        {item.returned_at ? (
                                            <>
                                                <div className="text-purple-700 font-black text-xs">{new Date(item.returned_at).toLocaleDateString('vi-VN')}</div>
                                                <div className="text-[10px] text-purple-400 font-bold uppercase tracking-tighter mt-0.5">{new Date(item.returned_at).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</div>
                                            </>
                                        ) : (
                                            <span className="text-gray-200 font-black text-lg select-none">—</span>
                                        )}
                                    </td>
                                    <td className="px-10 py-6">
                                        {item.status !== 'pending' ? (
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-xl w-fit shadow-sm">
                                                <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="text-[10px] font-black text-gray-600 uppercase tracking-tight">{getHandlerName(item)}</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-300 text-[10px] font-black uppercase tracking-widest italic pl-1">Chờ xử lý</span>
                                        )}
                                    </td>
                                    <td className="px-10 py-6 text-center">
                                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest border-2 shadow-lg transition-all group-hover:scale-105 ${
                                            item.status === 'approved' ? 'bg-emerald-500 text-white border-emerald-600 shadow-emerald-200/50' :
                                            item.status === 'rejected' ? 'bg-rose-500 text-white border-rose-600 shadow-rose-200/50' :
                                            item.status === 'returned' ? 'bg-blue-500 text-white border-blue-600 shadow-blue-200/50' :
                                            'bg-amber-500 text-white border-amber-600 shadow-amber-200/50'
                                        }`}>
                                            {item.status === 'approved' ? 'Đang mượn' : 
                                            item.status === 'rejected' ? 'Từ chối' : 
                                            item.status === 'returned' ? 'Đã trả' : 'Chờ duyệt'}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            
            {/* Phân trang Footer */}
            <div className="bg-gray-50 border-t border-gray-100 p-8 flex flex-col sm:flex-row items-center justify-between gap-6 px-10">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <span className="text-[11px] text-gray-400 font-black uppercase tracking-[0.15em]">
                    Hiển thị <span className="text-gray-900 tabular-nums">{Math.min(filteredLogs.length, startIndex + 1)}-{Math.min(filteredLogs.length, startIndex + ITEMS_PER_PAGE)}</span> trong <span className="text-gray-900 tabular-nums">{filteredLogs.length}</span> kết quả
                  </span>
                  <div className="h-4 w-[1px] bg-gray-200 hidden sm:block"></div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Trang</span>
                    <span className="bg-purple-50 text-purple-600 px-3 py-1 rounded-lg text-sm font-black tabular-nums border border-purple-100">{currentPage} / {totalPages}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="p-3 rounded-2xl border-2 border-gray-100 bg-white disabled:opacity-30 hover:bg-purple-50 text-gray-600 hover:text-purple-600 transition-all shadow-sm active:scale-90"
                    title="Trang đầu"
                  >
                    <ChevronsLeft className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-3 rounded-2xl border-2 border-gray-100 bg-white disabled:opacity-30 hover:bg-purple-50 text-gray-600 hover:text-purple-600 transition-all shadow-sm active:scale-90"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  <div className="flex items-center gap-1 mx-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum = 1;
                      if (totalPages <= 5) pageNum = i + 1;
                      else if (currentPage <= 3) pageNum = i + 1;
                      else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                      else pageNum = currentPage - 2 + i;

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-10 h-10 rounded-xl text-xs font-black transition-all border-2 tabular-nums ${
                            currentPage === pageNum 
                            ? 'bg-purple-600 text-white border-purple-600 shadow-xl scale-110 z-10' 
                            : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-3 rounded-2xl border-2 border-gray-100 bg-white disabled:opacity-30 hover:bg-purple-50 text-gray-600 hover:text-purple-600 transition-all shadow-sm active:scale-90"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-3 rounded-2xl border-2 border-gray-100 bg-white disabled:opacity-30 hover:bg-purple-50 text-gray-600 hover:text-purple-600 transition-all shadow-sm active:scale-90"
                    title="Trang cuối"
                  >
                    <ChevronsRight className="w-5 h-5" />
                  </button>
                </div>
            </div>
       </Card>
    </div>
  );
};
