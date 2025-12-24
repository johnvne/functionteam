
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { BorrowRequest, User } from '../../../types';
import { Card } from '../ui/Card';
import * as XLSX from 'xlsx';
import { 
  History, Search, Calendar, Filter, X, 
  User as UserIcon, ShieldCheck, ChevronDown, 
  SlidersHorizontal, ChevronLeft, ChevronRight, 
  Loader2, RefreshCw, AlertCircle, ChevronsLeft, ChevronsRight,
  Undo2, CheckCircle2, AlertTriangle, FileSpreadsheet,
  Download, ListFilter, CalendarDays, Activity, 
  ArrowUpRight, Clock, Box, LayoutPanelLeft
} from 'lucide-react';

interface HistoryLogProps {
  user: User;
}

interface ExtendedBorrowRequest extends BorrowRequest {
  approved_by?: string;
  rejected_by?: string;
  approved_at?: string;
  rejected_at?: string;
}

type QuickDateOption = 'custom' | 'today' | 'yesterday' | 'thisWeek' | '7days' | '30days' | '90days' | 'thisMonth';

const ITEMS_PER_PAGE = 20;

const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-10 right-10 z-[100] ${type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in-up border border-white/20 backdrop-blur-md`}>
      {type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
      <p className="text-xs font-black uppercase tracking-tight">{message}</p>
      <button onClick={onClose} className="ml-2 hover:bg-white/20 p-1 rounded-full"><X className="w-4 h-4"/></button>
    </div>
  );
};

export const HistoryLog: React.FC<HistoryLogProps> = ({ user }) => {
  const [logs, setLogs] = useState<ExtendedBorrowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reBorrowingId, setReBorrowingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  
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
      setError("Không thể tải dữ liệu lịch sử.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user.id, startDate, endDate, statusFilter, user.role]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, handlerFilter, statusFilter, startDate, endDate]);

  const getHandlerName = (req: ExtendedBorrowRequest) => {
    if (req.status === 'approved' || req.status === 'returned') return req.approved_by || 'Admin';
    if (req.status === 'rejected') return req.rejected_by || 'Admin';
    return '-';
  };

  const handleReBorrow = async (log: ExtendedBorrowRequest) => {
    setReBorrowingId(log.id);
    try {
      const { error } = await supabase.from('requests').insert([{
        user_id: user.id,
        user_name: user.name,
        employee_id: user.employeeCode,
        tool_id: log.tool_id,
        tool_name: log.tool_name,
        borrow_date: new Date().toISOString(),
        status: 'pending'
      }]);

      if (error) throw error;

      setToast({ message: "Đã gửi yêu cầu mượn lại thành công!", type: 'success' });
      window.dispatchEvent(new CustomEvent('refresh-counts'));
      fetchHistory(true);
    } catch (err: any) {
      setToast({ message: "Lỗi: " + err.message, type: 'error' });
    } finally {
      setReBorrowingId(null);
    }
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

  // Thống kê tóm tắt dựa trên logs đã fetch (không phụ thuộc searchText)
  const summaryStats = useMemo(() => {
    return {
      total: logs.length,
      pending: logs.filter(l => l.status === 'pending').length,
      borrowing: logs.filter(l => l.status === 'approved').length,
      completed: logs.filter(l => l.status === 'returned' || l.status === 'rejected').length
    };
  }, [logs]);

  const handleExportExcel = () => {
    if (filteredLogs.length === 0) return alert("Không có dữ liệu để xuất.");
    
    const exportData = filteredLogs.map(log => ({
      'Người mượn': log.user_name,
      'Mã nhân viên': log.employee_id,
      'Thiết bị': log.tool_name,
      'Ngày mượn': new Date(log.borrow_date).toLocaleString('vi-VN'),
      'Ngày trả': log.returned_at ? new Date(log.returned_at).toLocaleString('vi-VN') : 'Chưa trả',
      'Người xử lý': getHandlerName(log),
      'Trạng thái': log.status === 'approved' ? 'Đang mượn' : 
                    log.status === 'returned' ? 'Đã trả' : 
                    log.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "LichSuMuonTra");
    XLSX.writeFile(workbook, `Lich_su_muon_tra_${new Date().getTime()}.xlsx`);
  };

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
        case 'yesterday':
            start.setDate(today.getDate() - 1);
            end.setDate(today.getDate() - 1);
            break;
        case 'thisWeek':
            const day = today.getDay();
            const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Thứ 2
            start = new Date(today.setDate(diff));
            end = new Date();
            break;
        case '7days':
            start.setDate(today.getDate() - 7);
            break;
        case '30days':
            start.setDate(today.getDate() - 30);
            break;
        case '90days':
            start.setDate(today.getDate() - 90);
            break;
        case 'thisMonth':
            start = new Date(today.getFullYear(), today.getMonth(), 1);
            end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            break;
        case 'today':
        default:
            break; 
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
    <div className="space-y-4 md:space-y-6 animate-fade-in pb-10">
       {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

       {/* Top Header & Export */}
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
                <div className="p-3 md:p-4 bg-indigo-600 rounded-[1.2rem] shadow-xl shadow-indigo-100 text-white">
                    <History className="w-6 h-6 md:w-8 h-8" />
                </div>
                <div>
                    <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight leading-none">Lịch sử hoạt động</h2>
                    <p className="text-[8px] md:text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1 opacity-70">
                        Quản lý & Tra cứu mượn trả
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button 
                  onClick={handleExportExcel}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-emerald-100 hover:bg-emerald-600 hover:text-white"
                >
                  <FileSpreadsheet className="w-4 h-4"/> Xuất Excel
                </button>
                <button 
                  onClick={() => fetchHistory(true)} 
                  className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-400 rounded-xl transition-all border border-gray-100"
                >
                  {isRefreshing ? <Loader2 className="w-4 h-4 animate-spin"/> : <RefreshCw className="w-4 h-4"/>}
                </button>
            </div>
       </div>

       {/* Summary Stats */}
       <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <Card className="p-4 md:p-6 border-none bg-white shadow-sm rounded-[1.2rem] md:rounded-[2rem] flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><LayoutPanelLeft className="w-4 h-4"/></div>
              <span className="text-[7px] md:text-[9px] font-black text-purple-400 uppercase tracking-widest">Tổng lượt</span>
            </div>
            <p className="text-xl md:text-3xl font-black text-gray-900">{summaryStats.total}</p>
          </Card>
          <Card className="p-4 md:p-6 border-none bg-white shadow-sm rounded-[1.2rem] md:rounded-[2rem] flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><Clock className="w-4 h-4"/></div>
              <span className="text-[7px] md:text-[9px] font-black text-amber-400 uppercase tracking-widest">Chờ duyệt</span>
            </div>
            <p className="text-xl md:text-3xl font-black text-gray-900">{summaryStats.pending}</p>
          </Card>
          <Card className="p-4 md:p-6 border-none bg-white shadow-sm rounded-[1.2rem] md:rounded-[2rem] flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Box className="w-4 h-4"/></div>
              <span className="text-[7px] md:text-[9px] font-black text-indigo-400 uppercase tracking-widest">Đang mượn</span>
            </div>
            <p className="text-xl md:text-3xl font-black text-gray-900">{summaryStats.borrowing}</p>
          </Card>
          <Card className="p-4 md:p-6 border-none bg-white shadow-sm rounded-[1.2rem] md:rounded-[2rem] flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><CheckCircle2 className="w-4 h-4"/></div>
              <span className="text-[7px] md:text-[9px] font-black text-emerald-400 uppercase tracking-widest">Hoàn thành</span>
            </div>
            <p className="text-xl md:text-3xl font-black text-gray-900">{summaryStats.completed}</p>
          </Card>
       </div>

       {/* Filters Section */}
       <Card className="p-4 md:p-8 overflow-visible border-none shadow-sm rounded-[1.5rem] md:rounded-[3rem] bg-white">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-[9px] md:text-[11px] font-black text-gray-400 flex items-center gap-2 uppercase tracking-[0.15em]">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" /> Công cụ lọc linh hoạt
                    </h3>
                    {activeFiltersCount > 0 && (
                        <button onClick={clearFilters} className="text-[9px] text-rose-600 font-black uppercase tracking-widest flex items-center gap-1 hover:underline">
                            <X className="w-3 h-3" /> Xóa lọc
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    <div className="xl:col-span-4 space-y-4">
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Khoảng thời gian nhanh</label>
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-1.5">
                             {[
                               {id: 'today', l: 'H.Nay'}, 
                               {id: 'yesterday', l: 'H.Qua'}, 
                               {id: 'thisWeek', l: 'Tuần này'}, 
                               {id: '7days', l: '7 ngày'}, 
                               {id: '30days', l: '30 ngày'}, 
                               {id: '90days', l: '90 ngày'}, 
                               {id: 'thisMonth', l: 'Tháng này'}
                             ].map((btn) => (
                                <button
                                    key={btn.id}
                                    onClick={() => handleQuickDate(btn.id as QuickDateOption)}
                                    className={`px-2 py-2 text-[8px] font-black uppercase tracking-widest rounded-lg border-2 transition-all ${
                                        quickDate === btn.id 
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                                        : 'bg-white text-gray-400 border-gray-100 hover:border-indigo-200'
                                    }`}
                                >
                                    {btn.l}
                                </button>
                             ))}
                        </div>
                    </div>

                    <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Tùy chỉnh ngày</label>
                            <div className="flex items-center gap-2">
                                <input type="date" value={startDate} onChange={e => handleManualDateChange('start', e.target.value)} className="w-full px-3 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-600/10 outline-none"/>
                                <span className="text-gray-300">-</span>
                                <input type="date" value={endDate} onChange={e => handleManualDateChange('end', e.target.value)} className="w-full px-3 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-600/10 outline-none"/>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Trạng thái & Phê duyệt</label>
                            <div className="flex flex-col gap-2">
                                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black uppercase outline-none cursor-pointer">
                                    <option value="all">TẤT CẢ TRẠNG THÁI</option>
                                    <option value="pending">CHỜ DUYỆT</option>
                                    <option value="approved">ĐANG MƯỢN</option>
                                    <option value="returned">ĐÃ TRẢ</option>
                                    <option value="rejected">TỪ CHỐI</option>
                                </select>
                                <div className="relative group">
                                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                                    <input type="text" value={handlerFilter} onChange={e => setHandlerFilter(e.target.value)} placeholder="Người xử lý..." className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-bold outline-none"/>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Tìm kiếm văn bản</label>
                            <div className="relative group h-[calc(100%-24px)]">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input 
                                    type="text" 
                                    value={searchText}
                                    onChange={e => setSearchText(e.target.value)}
                                    placeholder="Tên, mã NV, thiết bị..." 
                                    className="w-full h-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-[11px] font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
       </Card>

       {/* Logs Table Section */}
       <Card className="p-0 overflow-hidden border-none shadow-xl rounded-[1.5rem] md:rounded-[3rem] bg-white">
            <div className="overflow-x-auto w-full no-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/80 border-b border-gray-100">
                            <th className="px-6 md:px-10 py-4 md:py-6 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-gray-400">Thành viên</th>
                            <th className="px-6 md:px-10 py-4 md:py-6 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-gray-400">Thiết bị</th>
                            <th className="px-6 md:px-10 py-4 md:py-6 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-gray-400">Thời gian</th>
                            <th className="px-6 md:px-10 py-4 md:py-6 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-gray-400">Admin xử lý</th>
                            <th className="px-6 md:px-10 py-4 md:py-6 text-center text-[8px] md:text-[10px] font-black uppercase tracking-widest text-gray-400">Trạng thái</th>
                            <th className="px-6 md:px-10 py-4 md:py-6 text-right text-[8px] md:text-[10px] font-black uppercase tracking-widest text-gray-400">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr><td colSpan={6} className="px-10 py-32 text-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto opacity-20" /></td></tr>
                        ) : currentLogs.length === 0 ? (
                            <tr><td colSpan={6} className="px-10 py-32 text-center text-gray-300 font-black italic uppercase tracking-widest opacity-50">Không có kết quả phù hợp</td></tr>
                        ) : (
                            currentLogs.map((item) => (
                                <tr key={item.id} className="hover:bg-indigo-50/20 transition-all duration-300 group">
                                    <td className="px-6 md:px-10 py-4 md:py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs md:text-sm border-2 border-indigo-400">
                                                {item.user_name?.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-black text-gray-900 text-[11px] md:text-[13px]">{item.user_name}</div>
                                                <div className="text-[7px] md:text-[9px] text-gray-400 font-black uppercase tracking-widest mt-0.5">{item.employee_id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 md:px-10 py-4 md:py-6">
                                        <span className="font-black text-gray-800 text-[11px] md:text-[13px] uppercase tracking-tight">{item.tool_name}</span>
                                    </td>
                                    <td className="px-6 md:px-10 py-4 md:py-6">
                                        <div className="text-gray-900 font-black text-[10px] md:text-xs">M: {new Date(item.borrow_date).toLocaleDateString('vi-VN')}</div>
                                        {item.returned_at && (
                                            <div className="text-indigo-500 font-black text-[10px] md:text-xs mt-1">T: {new Date(item.returned_at).toLocaleDateString('vi-VN')}</div>
                                        )}
                                    </td>
                                    <td className="px-6 md:px-10 py-4 md:py-6">
                                        <div className="flex items-center gap-1.5 text-[8px] md:text-[10px] font-black text-gray-600 uppercase">
                                            <ShieldCheck className="w-3 h-3 text-gray-300" /> {getHandlerName(item)}
                                        </div>
                                    </td>
                                    <td className="px-6 md:px-10 py-4 md:py-6 text-center">
                                        <span className={`inline-flex px-3 py-1.5 rounded-xl text-[7px] md:text-[8px] font-black uppercase tracking-widest border shadow-sm ${
                                            item.status === 'approved' ? 'bg-indigo-600 text-white border-indigo-500' :
                                            item.status === 'rejected' ? 'bg-rose-500 text-white border-rose-400' :
                                            item.status === 'returned' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                            'bg-amber-50 text-amber-600 border-amber-100'
                                        }`}>
                                            {item.status === 'approved' ? 'Đang mượn' : 
                                             item.status === 'rejected' ? 'Từ chối' : 
                                             item.status === 'returned' ? 'Đã trả' : 'Chờ duyệt'}
                                        </span>
                                    </td>
                                    <td className="px-6 md:px-10 py-4 md:py-6 text-right">
                                        {(item.status === 'returned' || item.status === 'rejected') ? (
                                            <button 
                                                onClick={() => handleReBorrow(item)}
                                                disabled={reBorrowingId === item.id}
                                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg text-[9px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50"
                                            >
                                                {reBorrowingId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Undo2 className="w-3.5 h-3.5" />}
                                                Mượn lại
                                            </button>
                                        ) : (
                                            <span className="text-gray-100 font-black text-[9px]">N/A</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            
            {/* Pagination */}
            <div className="bg-gray-50 border-t border-gray-100 p-6 md:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="text-[9px] md:text-[11px] text-gray-400 font-black uppercase tracking-widest">
                  Hiển thị <span className="text-gray-900">{startIndex + 1}-{Math.min(filteredLogs.length, startIndex + ITEMS_PER_PAGE)}</span> trên {filteredLogs.length}
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2.5 rounded-xl border border-gray-200 bg-white disabled:opacity-30 hover:bg-indigo-50 transition-all"><ChevronLeft className="w-5 h-5" /></button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1).map((p, idx, arr) => (
                         <React.Fragment key={p}>
                            {idx > 0 && arr[idx-1] !== p - 1 && <span className="text-gray-300">...</span>}
                            <button 
                                onClick={() => handlePageChange(p)}
                                className={`w-9 h-9 md:w-11 md:h-11 rounded-xl text-[10px] font-black transition-all border-2 ${currentPage === p ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-gray-400 border-gray-100 hover:bg-gray-50'}`}
                            >
                                {p}
                            </button>
                         </React.Fragment>
                    ))}
                  </div>
                  <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2.5 rounded-xl border border-gray-100 bg-white disabled:opacity-30 hover:bg-indigo-50 transition-all"><ChevronRight className="w-5 h-5" /></button>
                </div>
            </div>
       </Card>
    </div>
  );
};
