
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { Tool, User } from '../../../types';
import { Card } from '../ui/Card';
import { 
  Wrench, MapPin, Edit, Plus, X, LayoutGrid, List, Minus, Search, Send, Loader2, Save, Image as ImageIcon, ChevronLeft, ChevronRight, AlertTriangle, Settings2, Trash2, Check, Boxes, Info, Tag, Hash, Archive
} from 'lucide-react';

interface ToolInventoryProps {
  user: User;
}

const INITIAL_FORM_DATA = {
  name: '',
  category: '',
  quantity: 1,
  available: 1,
  description: '',
  location: '',
  image: '',
  status: 'active' as 'active' | 'inactive'
};

const ToolThumbnail = ({ src, alt, mode = 'grid' }: { src?: string | null, alt: string, mode?: 'grid' | 'table' }) => {
  const [error, setError] = useState(false);
  
  // Kiểm tra URL hợp lệ
  const isValidUrl = useMemo(() => {
    if (!src || typeof src !== 'string' || src.trim().length === 0) return false;
    return src.startsWith('http') || src.startsWith('data:');
  }, [src]);

  // Nếu lỗi hoặc URL không hợp lệ, hiển thị placeholder chuyên nghiệp
  if (error || !isValidUrl) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-50 w-full h-full rounded-xl border-2 border-dashed border-gray-200 transition-colors group-hover:bg-gray-100`}>
        <div className={`p-2 bg-white rounded-full shadow-sm border border-gray-100`}>
          <Wrench className={`${mode === 'grid' ? 'w-8 h-8 text-gray-400' : 'w-4 h-4 text-gray-500'}`} />
        </div>
        {mode === 'grid' && (
          <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-2">No Image</span>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-white rounded-xl overflow-hidden">
      <img
        src={src}
        alt={alt}
        onError={() => setError(true)}
        className={`max-w-full max-h-full object-contain ${mode === 'grid' ? 'p-4 group-hover:scale-110 transition-transform duration-500' : 'p-1'}`}
      />
      {/* Overlay hiệu ứng khi hover ở grid */}
      {mode === 'grid' && (
        <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/5 transition-colors pointer-events-none" />
      )}
    </div>
  );
};

export const ToolInventory: React.FC<ToolInventoryProps> = ({ user }) => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const isAdmin = user.role === 'admin';
  const [isManageMode, setIsManageMode] = useState(isAdmin);

  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});
  const [isBorrowing, setIsBorrowing] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentToolId, setCurrentToolId] = useState<string | null>(null);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [toolToDelete, setToolToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchTools();
  }, []);

  const fetchTools = async () => {
    const { data } = await supabase.from('tools').select('*').order('created_at', { ascending: false });
    if (data) setTools(data as Tool[]);
  };

  const uniqueCategories = useMemo(() => Array.from(new Set(tools.map(t => t.category).filter(Boolean))), [tools]);

  const filteredTools = useMemo(() => {
    return tools.filter(tool => {
      const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            tool.location?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || tool.category === filterCategory;
      let matchesStatus = true;
      if (filterStatus === 'available') matchesStatus = tool.status === 'active' && tool.available > 0;
      else if (filterStatus === 'inactive') matchesStatus = tool.status === 'inactive';
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [tools, searchTerm, filterCategory, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredTools.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const currentTools = filteredTools.slice(startIndex, startIndex + pageSize);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const toggleSelection = (tool: Tool) => {
    if (isManageMode) return;
    const isAvailable = tool.status === 'active' && tool.available > 0;
    if (!isAvailable && !selectedQuantities[tool.id]) return;

    setSelectedQuantities(prev => {
        const current = prev[tool.id] || 0;
        if (current > 0) {
            const next = { ...prev };
            delete next[tool.id];
            return next;
        } else {
            return { ...prev, [tool.id]: 1 };
        }
    });
  };

  const updateQuantity = (id: string, delta: number, max: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedQuantities(prev => {
        const current = prev[id] || 0;
        const next = Math.max(0, Math.min(max, current + delta));
        const newQuantities = { ...prev };
        if (next === 0) delete newQuantities[id];
        else newQuantities[id] = next;
        return newQuantities;
    });
  };

  const handleBulkBorrow = async () => {
    const selectedToolIds = Object.keys(selectedQuantities);
    if (selectedToolIds.length === 0) return;
    setIsBorrowing(true);
    try {
      for (const toolId of selectedToolIds) {
        const tool = tools.find(t => t.id === toolId);
        const qty = selectedQuantities[toolId];
        if (!tool || tool.available < qty) continue;

        const requestsToInsert = Array.from({ length: qty }).map(() => ({
          user_id: user.id,
          user_name: user.name,
          employee_id: user.employeeCode,
          tool_id: tool.id,
          tool_name: tool.name,
          borrow_date: new Date().toISOString(),
          status: 'pending'
        }));

        const { error } = await supabase.from('requests').insert(requestsToInsert);
        if (error) throw error;
      }
      setMessage(`Gửi thành công yêu cầu mượn đồ!`);
      setSelectedQuantities({});
      window.dispatchEvent(new CustomEvent('refresh-counts'));
      setTimeout(() => setMessage(null), 3000);
      await fetchTools();
    } catch (error: any) {
      alert("Lỗi: " + error.message);
    } finally {
      setIsBorrowing(false);
    }
  };

  const handleEditTool = (tool: Tool) => {
    setFormData({
      name: tool.name, category: tool.category, quantity: tool.quantity, available: tool.available,
      description: tool.description || '', location: tool.location || '', image: tool.image || '', status: tool.status
    });
    setIsEditing(true); setCurrentToolId(tool.id); setIsModalOpen(true);
  };

  const handleSaveTool = async () => {
    if (!formData.name) return alert('Vui lòng nhập tên công cụ');
    try {
      if (isEditing && currentToolId) {
        await supabase.from('tools').update(formData).eq('id', currentToolId);
      } else {
        await supabase.from('tools').insert([formData]);
      }
      await fetchTools(); setIsModalOpen(false);
      setMessage(isEditing ? 'Đã cập nhật' : 'Đã thêm mới');
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) { alert('Lỗi: ' + error.message); }
  };

  const totalSelectedCount = (Object.values(selectedQuantities) as number[]).reduce((sum: number, q: number) => sum + q, 0);

  return (
    <div className="space-y-6 relative flex flex-col min-h-[calc(100vh-140px)] pb-32 animate-fade-in">
      {/* Header & Filter */}
      <div className="flex flex-col gap-5 bg-white p-6 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-gray-100">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
            <div className="flex items-center gap-4">
                <div className="p-4 bg-blue-600 rounded-2xl md:rounded-[1.8rem] shadow-xl shadow-blue-100 text-white"><Wrench className="w-6 h-6 md:w-8 md:h-8" /></div>
                <div>
                    <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight leading-none uppercase">Kho thiết bị</h2>
                    <p className="text-[9px] md:text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1.5 opacity-70">Quản lý & mượn đồ tập trung</p>
                </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
                {message && <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-2xl text-[9px] font-black uppercase shadow-lg shadow-emerald-100 tracking-widest">{message}</div>}
                
                {isAdmin && (
                    <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200">
                        <button onClick={() => {setIsManageMode(true); setSelectedQuantities({});}} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isManageMode ? 'bg-white text-blue-600 shadow-lg' : 'text-gray-500'}`}>QUẢN LÝ</button>
                        <button onClick={() => {setIsManageMode(false); setSelectedQuantities({});}} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${!isManageMode ? 'bg-white text-blue-600 shadow-lg' : 'text-gray-500'}`}>MƯỢN ĐỒ</button>
                    </div>
                )}

                {isManageMode && (
                    <button 
                        onClick={() => {setFormData(INITIAL_FORM_DATA); setIsEditing(false); setIsModalOpen(true);}} 
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-blue-100 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> THÊM MỚI
                    </button>
                )}
            </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 pt-4 border-t border-gray-100">
            <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-blue-600 transition-colors" />
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Tìm tên thiết bị, vị trí..." className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-600/10 transition-all" />
            </div>
            
            <div className="flex gap-3">
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-5 py-3.5 bg-gray-50 border-none rounded-2xl text-[9px] font-black uppercase tracking-widest outline-none cursor-pointer">
                    <option value="all">Danh mục</option>
                    {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-2xl border border-gray-200">
                  <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-xl ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-400'}`}><LayoutGrid className="w-4 h-4" /></button>
                  <button onClick={() => setViewMode('table')} className={`p-2.5 rounded-xl ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-400'}`}><List className="w-4 h-4" /></button>
                </div>
            </div>
        </div>
      </div>

      {/* Main List */}
      <div className="flex-1">
        {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {currentTools.map((tool: Tool) => {
                const qty = selectedQuantities[tool.id] || 0;
                const isSelected = qty > 0;
                const isAvailable = tool.status === 'active' && tool.available > 0;
                return (
                <Card 
                    key={tool.id} 
                    onClick={() => toggleSelection(tool)}
                    className={`cursor-pointer group hover:shadow-2xl transition-all p-0 border-4 overflow-hidden rounded-[2.8rem] ${isSelected ? 'border-blue-600 ring-8 ring-blue-50 bg-blue-50/20' : 'border-transparent bg-white shadow-xl'} ${!isManageMode && !isAvailable && !isSelected ? 'opacity-50 grayscale pointer-events-none' : ''}`}
                >
                    <div className="h-56 bg-white flex items-center justify-center relative border-b border-gray-50">
                      <ToolThumbnail src={tool.image} alt={tool.name} mode="grid" />
                      <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                        <span className={`text-white text-[8px] font-black uppercase px-3 py-1.5 rounded-xl shadow-lg border-2 border-white ${tool.status === 'inactive' ? 'bg-rose-500' : tool.available > 0 ? 'bg-emerald-500' : 'bg-gray-400'}`}>
                            {tool.status === 'inactive' ? 'Sửa chữa' : tool.available > 0 ? `Sẵn: ${tool.available}` : 'Hết đồ'}
                        </span>
                        {isSelected && <div className="bg-blue-600 text-white p-2 rounded-full shadow-xl animate-bounce"><Check className="w-3.5 h-3.5" /></div>}
                      </div>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="space-y-1">
                        <span className="text-[8px] font-black text-blue-600 uppercase tracking-[0.2em]">{tool.category}</span>
                        <h3 className="font-black text-gray-900 text-sm line-clamp-2 h-10 leading-tight uppercase tracking-tight">{tool.name}</h3>
                      </div>
                      <div className="flex items-center justify-between text-[8px] text-gray-400 font-bold uppercase bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                          <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-blue-400" /> {tool.location || 'KHO CHUNG'}</span>
                          <span className="font-black text-gray-900">ID: {tool.id.slice(0, 5)}</span>
                      </div>
                      {isManageMode && (
                        <div className="flex gap-2 pt-1">
                           <button onClick={(e) => { e.stopPropagation(); handleEditTool(tool); }} className="flex-1 bg-gray-900 hover:bg-black text-white py-3 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95">Chỉnh sửa</button>
                           <button onClick={(e) => { e.stopPropagation(); setToolToDelete(tool.id); }} className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      )}
                      {!isManageMode && isSelected && (
                        <div className="flex items-center justify-between bg-blue-600 p-1.5 rounded-2xl text-white shadow-xl animate-zoom-in border-4 border-white">
                            <button onClick={(e) => updateQuantity(tool.id, -1, tool.available, e)} className="p-2.5 hover:bg-white/20 rounded-xl transition-colors"><Minus className="w-4 h-4" /></button>
                            <span className="text-lg font-black tabular-nums">{qty}</span>
                            <button onClick={(e) => updateQuantity(tool.id, 1, tool.available, e)} className="p-2.5 hover:bg-white/20 rounded-xl transition-colors"><Plus className="w-4 h-4" /></button>
                        </div>
                      )}
                    </div>
                </Card>
                );
            })}
            </div>
        ) : (
          <Card className="p-0 rounded-[2.5rem] overflow-hidden border-none shadow-xl bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-gray-400">Thiết bị</th>
                    <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-gray-400">Danh mục</th>
                    <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-gray-400 text-center">Sẵn / Tổng</th>
                    <th className="px-8 py-6 text-center text-[9px] font-black uppercase tracking-widest text-gray-400">Trạng thái</th>
                    <th className="px-8 py-6 text-right text-[9px] font-black uppercase tracking-widest text-gray-400">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
                  {currentTools.map((tool: Tool) => {
                    const qty = selectedQuantities[tool.id] || 0;
                    const isSelected = qty > 0;
                    return (
                        <tr key={tool.id} onClick={() => toggleSelection(tool)} className={`cursor-pointer transition-all ${isSelected ? 'bg-blue-50/50' : 'hover:bg-gray-50'} group`}>
                            <td className="px-8 py-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white border-2 overflow-hidden flex items-center justify-center p-1 shadow-sm"><ToolThumbnail src={tool.image} alt={tool.name} mode="table" /></div>
                                    <div>
                                        <div className={`font-black uppercase text-xs ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>{tool.name}</div>
                                        <div className="text-[9px] text-gray-400 font-bold uppercase mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" /> {tool.location || 'KHO'}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-8 py-4"><span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest">{tool.category}</span></td>
                            <td className="px-8 py-4 text-center text-xs font-black tabular-nums">
                                <span className={tool.available > 0 ? 'text-emerald-600' : 'text-rose-500'}>{tool.available}</span>
                                <span className="text-gray-200 mx-1.5">/</span>
                                <span className="text-gray-400">{tool.quantity}</span>
                            </td>
                            <td className="px-8 py-4 text-center">
                                {tool.status === 'active' ? (
                                    <span className="text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-emerald-100">Sẵn sàng</span>
                                ) : (
                                    <span className="text-rose-700 bg-rose-50 px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-rose-100">Bảo trì</span>
                                )}
                            </td>
                            <td className="px-8 py-4 text-right">
                                <div className="flex justify-end items-center gap-3">
                                    {isManageMode ? (
                                        <button onClick={(e) => { e.stopPropagation(); handleEditTool(tool); }} className="p-3 bg-gray-900 text-white rounded-xl shadow-lg transition-all active:scale-90"><Edit className="w-4 h-4"/></button>
                                    ) : (
                                        isSelected && (
                                            <div className="flex items-center bg-blue-600 rounded-xl p-1 shadow-lg border-2 border-white">
                                                <button onClick={(e) => updateQuantity(tool.id, -1, tool.available, e)} className="p-2 hover:bg-white/20 rounded-lg text-white"><Minus className="w-3.5 h-3.5"/></button>
                                                <span className="px-3 font-black text-xs text-white">{qty}</span>
                                                <button onClick={(e) => updateQuantity(tool.id, 1, tool.available, e)} className="p-2 hover:bg-white/20 rounded-lg text-white"><Plus className="w-3.5 h-3.5"/></button>
                                            </div>
                                        )
                                    )}
                                </div>
                            </td>
                        </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Pagination Bar */}
      <Card className="p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-xl border-none bg-white flex flex-col sm:flex-row items-center justify-between gap-6 px-8 md:px-12">
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Hiển thị <span className="text-gray-900 tabular-nums">{Math.min(filteredTools.length, startIndex + 1)}-{Math.min(filteredTools.length, startIndex + pageSize)}</span> trong {filteredTools.length}</span>
          </div>
          <div className="flex items-center gap-3">
              <button 
                onClick={() => handlePageChange(currentPage - 1)} 
                disabled={currentPage === 1} 
                className="p-3.5 rounded-xl border-2 border-gray-100 bg-white disabled:opacity-20 hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-all active:scale-90"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-1.5">
                 {Array.from({length: totalPages}, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1).map((p, idx, arr) => (
                    <React.Fragment key={p}>
                        {idx > 0 && arr[idx-1] !== p - 1 && <span className="text-gray-300 font-black">...</span>}
                        <button 
                            onClick={() => handlePageChange(p)}
                            className={`w-10 h-10 rounded-xl font-black text-xs transition-all border-2 ${currentPage === p ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-110' : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-50'}`}
                        >
                            {p}
                        </button>
                    </React.Fragment>
                 ))}
              </div>
              <button 
                onClick={() => handlePageChange(currentPage + 1)} 
                disabled={currentPage === totalPages} 
                className="p-3.5 rounded-xl border-2 border-gray-100 bg-white disabled:opacity-20 hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-all active:scale-90"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
          </div>
      </Card>

      {/* Action Bar */}
      {!isManageMode && totalSelectedCount > 0 && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[80] w-[calc(100%-2rem)] max-w-xl animate-fade-in-up">
            <div className="bg-gray-900/95 backdrop-blur-xl border border-white/10 p-5 md:p-6 rounded-[3rem] shadow-2xl flex items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl border-2 border-white/20">{totalSelectedCount}</div>
                    <div className="hidden sm:block">
                        <p className="text-white font-black text-sm uppercase tracking-tight">Thiết bị đang mượn</p>
                        <p className="text-blue-400 text-[8px] font-black uppercase tracking-widest mt-1 opacity-80">Gửi yêu cầu phê duyệt</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setSelectedQuantities({})} className="px-4 py-2 text-gray-400 hover:text-white text-[9px] font-black uppercase tracking-widest">HỦY</button>
                    <button onClick={handleBulkBorrow} disabled={isBorrowing} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
                        {isBorrowing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> GỬI YÊU CẦU</>}
                    </button>
                </div>
            </div>
          </div>
      )}

      {/* Admin Edit Modal */}
      {isAdmin && isModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden animate-zoom-in my-auto border border-white/20 flex flex-col">
            <div className="flex justify-between items-center px-8 py-6 border-b sticky top-0 bg-white z-20">
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100"><Edit className="w-5 h-5"/></div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">{isEditing ? 'Cập nhật tài sản' : 'Thêm tài sản mới'}</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors"><X className="w-6 h-6 text-gray-400"/></button>
            </div>
            
            <div className="p-8 space-y-6 bg-gray-50/20 overflow-y-auto no-scrollbar flex-1">
              {/* Fields Group */}
              <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Tên tài sản</label>
                        <input type="text" placeholder="Tên thiết bị..." value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3.5 bg-white border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-600/10 transition-all"/>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Vị trí kho</label>
                        <input type="text" placeholder="Kệ A, Tầng 1..." value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full px-4 py-3.5 bg-white border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-600/10 transition-all"/>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Danh mục</label>
                        <input list="cat-suggestions" type="text" placeholder="Nhập hoặc chọn..." value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-3.5 bg-white border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-600/10 transition-all"/>
                        <datalist id="cat-suggestions">{uniqueCategories.map(c => <option key={c} value={c} />)}</datalist>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Trạng thái</label>
                        <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full px-4 py-3.5 bg-white border border-gray-100 rounded-xl text-xs font-bold outline-none cursor-pointer">
                            <option value="active">ĐANG HOẠT ĐỘNG</option>
                            <option value="inactive">ĐANG BẢO TRÌ</option>
                        </select>
                    </div>
                  </div>
              </div>

              {/* Stock Management */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Tổng kho</p>
                        <div className="flex items-center bg-gray-50 rounded-xl p-1.5 border border-gray-100">
                            <button onClick={() => setFormData({...formData, quantity: Math.max(0, formData.quantity - 1)})} className="p-2.5 bg-white rounded-lg shadow-sm hover:bg-gray-900 hover:text-white transition-all"><Minus className="w-3.5 h-3.5"/></button>
                            <span className="flex-1 text-center font-black text-sm tabular-nums">{formData.quantity}</span>
                            <button onClick={() => setFormData({...formData, quantity: formData.quantity + 1})} className="p-2.5 bg-white rounded-lg shadow-sm hover:bg-gray-900 hover:text-white transition-all"><Plus className="w-3.5 h-3.5"/></button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Sẵn mượn</p>
                        <div className="flex items-center bg-gray-50 rounded-xl p-1.5 border border-gray-100">
                            <button onClick={() => setFormData({...formData, available: Math.max(0, formData.available - 1)})} className="p-2.5 bg-white rounded-lg shadow-sm hover:bg-gray-900 hover:text-white transition-all"><Minus className="w-3.5 h-3.5"/></button>
                            <span className="flex-1 text-center font-black text-sm tabular-nums">{formData.available}</span>
                            <button onClick={() => setFormData({...formData, available: Math.min(formData.quantity, formData.available + 1)})} className="p-2.5 bg-white rounded-lg shadow-sm hover:bg-gray-900 hover:text-white transition-all"><Plus className="w-3.5 h-3.5"/></button>
                        </div>
                    </div>
              </div>

              {/* Media & Desc */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Đường dẫn ảnh</label>
                        <input type="text" placeholder="Dán link ảnh (URL)..." value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} className="w-full px-4 py-3.5 bg-white border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-600/10 transition-all"/>
                    </div>
                    <div className="h-32 rounded-2xl bg-white border-2 border-dashed border-gray-100 flex items-center justify-center overflow-hidden">
                        {formData.image ? <img src={formData.image} alt="" className="h-full w-full object-contain p-2" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/200?text=Loi+Anh')} /> : <ImageIcon className="w-8 h-8 text-gray-100" />}
                    </div>
                 </div>
                 <div className="flex flex-col space-y-1.5">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Mô tả / Ghi chú</label>
                    <textarea placeholder="Thông tin kỹ thuật..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="flex-1 w-full px-5 py-4 bg-white border border-gray-100 rounded-2xl text-xs font-bold outline-none resize-none shadow-inner"/>
                 </div>
              </div>

              <button onClick={handleSaveTool} className="w-full py-5 bg-gray-900 hover:bg-black text-white font-black rounded-2xl shadow-xl uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95">
                <Save className="w-5 h-5"/> LƯU THAY ĐỔI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {toolToDelete && (
        <div className="fixed inset-0 bg-black/90 z-[110] flex items-center justify-center p-6 backdrop-blur-xl animate-fade-in">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-sm overflow-hidden animate-zoom-in border border-white/10">
            <div className="p-10 text-center">
              <div className="w-20 h-20 bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-6 rounded-3xl shadow-lg"><AlertTriangle className="w-10 h-10"/></div>
              <h3 className="text-xl font-black text-gray-900 mb-3 uppercase tracking-tighter">Xác nhận xóa?</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest opacity-80 leading-relaxed px-4">Hành động này sẽ gỡ bỏ thiết bị khỏi kho vĩnh viễn.</p>
            </div>
            <div className="bg-gray-50/50 p-6 flex flex-col gap-3 border-t">
              <button onClick={async () => { await supabase.from('tools').delete().eq('id', toolToDelete); await fetchTools(); setToolToDelete(null); setMessage('Đã xóa'); setTimeout(() => setMessage(null), 3000); }} className="w-full py-4 bg-rose-600 text-white font-black rounded-2xl text-[9px] uppercase tracking-widest shadow-xl shadow-rose-200 transition-all active:scale-95">XÓA TÀI SẢN</button>
              <button onClick={() => setToolToDelete(null)} className="w-full py-4 bg-white text-gray-400 font-black rounded-2xl border-2 border-gray-100 text-[9px] uppercase tracking-widest active:scale-95">QUAY LẠI</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
