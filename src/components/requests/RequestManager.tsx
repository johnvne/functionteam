
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { BorrowRequest, User } from '../../../types';
import { Card } from '../ui/Card';
import { 
  Check, X, Trash2, RotateCcw, 
  Loader2, Search, RefreshCw,
  PackageCheck, Timer, XCircle,
  Calendar, Wrench, User as UserIcon
} from 'lucide-react';

interface RequestManagerProps { user: User; }

// Component hiển thị ảnh thiết bị thu nhỏ trong bảng
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

  const fetchRequests = async () => {
    setLoading(true);
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
      setLoading(false);
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
        req.tool_name.toLowerCase().includes(searchLower);
      const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => {
      const priorityA = statusPriority[a.status] ?? 99;
      const priorityB = statusPriority[b.status] ?? 99;
      if (priorityA !== priorityB) return priorityA - priorityB;
      return new Date(b.borrow_date).getTime() - new Date(a.borrow_date).getTime();
    });
  }, [requests, searchTerm, filterStatus]);

  const handleAction = async (id: string, toolId: string, action: 'approve' | 'reject' | 'return' | 'cancel') => {
    setProcessingId(id);
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
      fetchRequests();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: any = {
      pending: { color: 'bg-amber-500 text-white', icon: <Timer className="w-4 h-4" />, label: 'CHỜ DUYỆT' },
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
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 md:p-4 bg-blue-600 rounded-2xl shadow-lg shadow-blue-100 text-white">
            <RefreshCw className="w-6 h-6 md:w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight uppercase">Quản lý mượn trả</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Phê duyệt & Giám sát thiết bị</p>
          </div>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200 shadow-inner">
            {user.role === 'admin' && (
              <button onClick={() => setActiveTab('all')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'all' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>Tất cả đơn</button>
            )}
            <button onClick={() => setActiveTab('personal')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'personal' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>Đơn của tôi</button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-blue-600 transition-colors" />
          <input 
            type="text" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            placeholder="Tìm nhân viên, đồ..." 
            className="w-full pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-[1.5rem] text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all shadow-sm" 
          />
        </div>
        <select 
          value={filterStatus} 
          onChange={e => setFilterStatus(e.target.value)} 
          className="px-6 py-4 bg-white border border-gray-100 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer shadow-sm focus:border-blue-500 transition-all"
        >
          <option value="all">Trạng thái</option>
          <option value="pending">Đang chờ duyệt</option>
          <option value="approved">Đang mượn</option>
          <option value="returned">Đã trả đồ</option>
          <option value="rejected">Đã từ chối</option>
        </select>
      </div>

      <Card className="p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">Người mượn</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">Thiết bị</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">Thời gian</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 text-center">Trạng thái</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50/50">
              {loading ? (
                <tr><td colSpan={5} className="py-32 text-center"><Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto opacity-20" /></td></tr>
              ) : filteredRequests.length === 0 ? (
                <tr><td colSpan={5} className="py-32 text-center text-gray-300 font-black italic uppercase tracking-widest opacity-50">Không tìm thấy yêu cầu nào</td></tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr 
                    key={req.id} 
                    className="group relative transition-all duration-300 ease-out hover:bg-blue-50/80 hover:translate-x-1 hover:shadow-[0_10px_40px_-10px_rgba(37,99,235,0.15)] border-l-4 border-l-transparent hover:border-l-blue-600 cursor-default"
                  >
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-sm shadow-lg group-hover:scale-110 transition-transform">
                          {req.user_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-black text-gray-900 text-sm group-hover:text-blue-700 transition-colors">{req.user_name}</div>
                          <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">{req.employee_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <ToolTableImage toolId={req.tool_id} toolName={req.tool_name} />
                        <div className="font-black text-gray-800 text-sm uppercase tracking-tight group-hover:text-gray-900">{req.tool_name}</div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-2 text-gray-400 font-black text-[10px] uppercase tracking-widest group-hover:text-gray-600 transition-colors">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(req.borrow_date).toLocaleDateString('vi-VN')}
                      </div>
                    </td>
                    <td className="px-10 py-6 text-center">
                      {getStatusBadge(req.status)}
                    </td>
                    <td className="px-10 py-6 text-right">
                      {processingId === req.id ? (
                        <Loader2 className="w-5 h-5 animate-spin ml-auto text-blue-600" />
                      ) : (
                        <div className="flex justify-end gap-3">
                          {activeTab === 'all' && user.role === 'admin' && req.status === 'pending' && (
                            <>
                              <button onClick={() => handleAction(req.id, req.tool_id, 'approve')} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-700 active:scale-90 transition-all">DUYỆT</button>
                              <button onClick={() => handleAction(req.id, req.tool_id, 'reject')} className="p-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm active:scale-90" title="Từ chối"><X className="w-4 h-4" /></button>
                            </>
                          )}
                          {activeTab === 'all' && user.role === 'admin' && req.status === 'approved' && (
                            <button onClick={() => handleAction(req.id, req.tool_id, 'return')} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] shadow-xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 active:scale-95 transition-all">
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
      </Card>
    </div>
  );
};
