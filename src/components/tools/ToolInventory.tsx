
import React, { useEffect, useState, useMemo, useContext } from 'react';
import { supabase } from '../../lib/supabase';
import { Tool, User } from '../../../types';
import { Card } from '../ui/Card';
import { 
  Wrench, MapPin, Edit, Plus, X, LayoutGrid, List, Minus, Search, Send, Loader2, Save, Image as ImageIcon, ChevronLeft, ChevronRight, AlertTriangle, Settings2, Trash2, Check, Boxes, Info, Tag, Hash, Archive, Snowflake, Sparkles, Gift, Filter, Package, ShoppingCart
} from 'lucide-react';
import { ThemeContext } from '../../../App';

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
  const { theme } = useContext(ThemeContext);
  const isTet = theme === 'tet';
  const isNoel = theme === 'noel';
  
  const isValidUrl = useMemo(() => {
    if (!src || typeof src !== 'string' || src.trim().length === 0) return false;
    return src.startsWith('http') || src.startsWith('data:');
  }, [src]);

  if (error || !isValidUrl) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-50 w-full h-full rounded-xl border-2 border-dashed border-gray-200 transition-colors group-hover:bg-gray-100`}>
        <div className={`p-2 bg-white rounded-full shadow-sm border border-gray-100 flex items-center justify-center`}>
          <Wrench className={`${mode === 'grid' ? 'w-8 h-8' : 'w-5 h-5'} ${isTet ? 'text-red-500' : isNoel ? 'text-blue-500' : 'text-gray-500'}`} />
        </div>
        {mode === 'grid' && (
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-2 text-center px-2">Không hình ảnh</span>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-white rounded-xl overflow-hidden">
      <img
        src={src || ''}
        alt={alt}
        onError={() => setError(true)}
        className={`max-w-full max-h-full object-contain ${mode === 'grid' ? 'p-4 group-hover:scale-110 transition-transform duration-500' : 'p-1'}`}
      />
      {mode === 'grid' && (
        <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/5 transition-colors pointer-events-none" />
      )}
    </div>
  );
};

export const ToolInventory: React.FC<ToolInventoryProps> = ({ user }) => {
  const { theme } = useContext(ThemeContext);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [toolToDelete, setToolToDelete] = useState<Tool | null>(null);

  const isTet = theme === 'tet';
  const isNoel = theme === 'noel';

  useEffect(() => {
    fetchTools();
  }, []);

  const fetchTools = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('tools').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setTools(data as Tool[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const uniqueCategories = useMemo(() => {
    const cats = Array.from(new Set(tools.map(t => t.category).filter(Boolean)));
    return ['all', ...cats];
  }, [tools]);

  const filteredTools = useMemo(() => {
    return tools.filter(tool => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        tool.name.toLowerCase().includes(searchLower) || 
        tool.location?.toLowerCase().includes(searchLower) ||
        tool.category?.toLowerCase().includes(searchLower);
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory, filterStatus]);

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

  const updateQuantitySelection = (id: string, delta: number, max: number, e?: React.MouseEvent) => {
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
      const borrowDate = new Date().toISOString();
      
      for (const toolId of selectedToolIds) {
        const tool = tools.find(t => t.id === toolId);
        const qty = selectedQuantities[toolId];
        if (!tool || tool.available < qty) continue;

        // Tạo yêu cầu mượn
        const requestsToInsert = Array.from({ length: qty }).map(() => ({
          user_id: user.id,
          user_name: user.name,
          employee_id: user.employeeCode,
          tool_id: tool.id,
          tool_name: tool.name,
          borrow_date: borrowDate,
          status: 'pending'
        }));

        const { error } = await supabase.from('requests').insert(requestsToInsert);
        if (error) throw error;
      }
      
      setMessage(`Gửi thành công ${totalSelectedCount} yêu cầu mượn đồ!`);
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
      name: tool.name, 
      category: tool.category || '', 
      quantity: tool.quantity, 
      available: tool.available,
      description: tool.description || '', 
      location: tool.location || '', 
      image: tool.image || '', 
      status: tool.status
    });
    setIsEditing(true); 
    setCurrentToolId(tool.id); 
    setIsModalOpen(true);
  };

  const handleSaveTool = async () => {
    if (!formData.name) return alert('Vui lòng nhập tên công cụ');
    try {
      if (isEditing && currentToolId) {
        const { error } = await supabase.from('tools').update(formData).eq('id', currentToolId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('tools').insert([formData]);
        if (error) throw error;
      }
      await fetchTools(); 
      setIsModalOpen(false);
      setMessage(isEditing ? 'Đã cập nhật thông tin' : 'Đã thêm thiết bị mới');
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) { 
      alert('Lỗi: ' + error.message); 
    }
  };

  const handleDeleteTool = async () => {
    if (!toolToDelete) return;
    try {
      const { error } = await supabase.from('tools').delete().eq('id', toolToDelete.id);
      if (error) throw error;
      setTools(prev => prev.filter(t => t.id !== toolToDelete.id));
      setToolToDelete(null);
      setMessage("Đã xóa thiết bị thành công");
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      alert("Lỗi khi xóa: " + err.message);
    }
  };

  const totalSelectedCount = useMemo(() => 
    Object.values(selectedQuantities).reduce((sum: number, q: number) => sum + q, 0)
  , [selectedQuantities]);

  const selectedToolNames = useMemo(() => {
    return Object.keys(selectedQuantities)
      .map(id => tools.find(t => t.id === id)?.name)
      .filter(Boolean);
  }, [selectedQuantities, tools]);

  return (
    <div className="space-y-6 relative flex flex-col min-h-[calc(100vh-140px)] animate-fade-in max-w-[1600px] mx-auto w-full pb-36">
      {/* Header & Filter */}
      <div className="flex flex-col gap-5 bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl md:rounded-[1.8rem] shadow-xl text-white transform hover:rotate-3 transition-transform ${isTet ? 'bg-red-700 shadow-red-100' : isNoel ? 'bg-red-600 shadow-red-100' : 'bg-blue-600 shadow-blue-100'}`}>
                  <Wrench className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <div>
                    <h2 className="text-lg md:text-2xl lg:text-3xl font-black text-gray-900 tracking-tight leading-none uppercase italic">
                      Kho thiết bị
                      {isNoel && <Snowflake className="inline ml-2 w-5 h-5 text-blue-300 animate-spin-slow" />}
                      {isTet && <Sparkles className="inline ml-2 w-5 h-5 text-yellow-400" />}
                    </h2>
                    <p className="text-[10px] md:text-xs text-gray-400 font-black uppercase tracking-[0.2em] mt-1.5 opacity-70">Quản lý & mượn đồ tập trung</p>
                </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                {message && (
                  <div className="bg-emerald-600 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase shadow-lg tracking-widest animate-fade-in-up border border-white/20">
                    {message}
                  </div>
                )}
                
                {isAdmin && (
                    <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200 w-full sm:w-auto">
                        <button onClick={() => {setIsManageMode(true); setSelectedQuantities({});}} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${isManageMode ? (isTet || isNoel ? 'bg-red-700 text-white shadow-lg' : 'bg-indigo-700 text-white shadow-lg') : 'text-gray-500 hover:text-gray-800'}`}>QUẢN LÝ</button>
                        <button onClick={() => {setIsManageMode(false); setSelectedQuantities({});}} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${!isManageMode ? (isTet || isNoel ? 'bg-red-700 text-white shadow-lg' : 'bg-indigo-700 text-white shadow-lg') : 'text-gray-500 hover:text-gray-800'}`}>MƯỢN ĐỒ</button>
                    </div>
                )}

                {isManageMode && (
                    <button 
                        onClick={() => {setFormData(INITIAL_FORM_DATA); setIsEditing(false); setIsModalOpen(true);}} 
                        className={`w-full sm:w-auto text-white px-6 py-3.5 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 border-b-4 ${isTet ? 'bg-red-700 border-red-900 shadow-red-100' : isNoel ? 'bg-red-600 border-red-800 shadow-red-100' : 'bg-blue-700 border-blue-900 shadow-blue-100'}`}
                    >
                        <Plus className="w-4 h-4" /> THÊM MỚI
                    </button>
                )}
            </div>
        </div>

        {/* Search & Layout Control */}
        <div className="flex flex-col gap-4 pt-4 border-t border-gray-100">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className={`absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 transition-colors ${isTet || isNoel ? 'group-focus-within:text-red-700' : 'group-focus-within:text-indigo-700'}`} />
                    <input 
                      type="text" 
                      value={searchTerm} 
                      onChange={(e) => setSearchTerm(e.target.value)} 
                      placeholder="Tìm tên thiết bị, vị trí, danh mục..." 
                      className={`w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs md:text-sm font-bold outline-none focus:ring-4 transition-all ${isTet || isNoel ? 'focus:ring-red-500/5 focus:border-red-600/40' : 'focus:ring-indigo-500/5 focus:border-indigo-600/40'}`} 
                    />
                </div>
                <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-2xl border border-gray-200 shrink-0">
                    <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? (isTet || isNoel ? 'bg-white text-red-700 shadow-md' : 'bg-white text-indigo-700 shadow-md') : 'text-gray-400 hover:text-gray-600'}`}><LayoutGrid className="w-5 h-5" /></button>
                    <button onClick={() => setViewMode('table')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'table' ? (isTet || isNoel ? 'bg-white text-red-700 shadow-md' : 'bg-white text-indigo-700 shadow-md') : 'text-gray-400 hover:text-gray-600'}`}><List className="w-5 h-5" /></button>
                </div>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
                <div className="flex items-center gap-2 pr-4 border-r border-gray-100 shrink-0">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Danh mục:</span>
                </div>
                {uniqueCategories.map(cat => (
                    <button 
                        key={cat} 
                        onClick={() => setFilterCategory(cat)}
                        className={`shrink-0 px-5 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all border-2 ${
                            filterCategory === cat 
                            ? (isTet || isNoel ? 'bg-red-700 text-white border-red-700 shadow-lg' : 'bg-indigo-700 text-white border-indigo-700 shadow-lg') 
                            : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300'
                        }`}
                    >
                        {cat === 'all' ? 'TẤT CẢ' : cat}
                    </button>
                ))}
            </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1">
        {loading ? (
          <div className="py-32 text-center flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600 opacity-20" />
            <p className="text-xs font-black uppercase tracking-widest text-gray-300">Đang kiểm kê kho...</p>
          </div>
        ) : filteredTools.length === 0 ? (
          <div className="py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
             <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
             <p className="text-[11px] md:text-sm font-black text-gray-400 uppercase tracking-[0.2em] italic">Không tìm thấy thiết bị phù hợp</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
            {currentTools.map((tool) => {
              const isSelected = !!selectedQuantities[tool.id];
              const qty = selectedQuantities[tool.id] || 0;
              const isAvailable = tool.status === 'active' && tool.available > 0;
              
              return (
                <div 
                  key={tool.id}
                  onClick={() => toggleSelection(tool)}
                  className={`group relative flex flex-col bg-white rounded-[2rem] shadow-sm border-2 transition-all duration-300 cursor-pointer overflow-hidden
                    ${isSelected ? (isTet || isNoel ? 'border-red-600 ring-4 ring-red-500/10' : 'border-indigo-600 ring-4 ring-indigo-500/10') : 'border-transparent hover:border-gray-200 hover:shadow-xl hover:-translate-y-1'}
                    ${!isAvailable && !isManageMode ? 'opacity-60 grayscale cursor-not-allowed' : ''}
                  `}
                >
                  <div className="relative h-32 sm:h-40 md:h-48 bg-gray-50/50 p-2">
                    <ToolThumbnail src={tool.image} alt={tool.name} />
                    
                    {/* Badge Trạng thái */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                      {tool.status === 'inactive' ? (
                        <span className="bg-gray-800 text-white text-[7px] md:text-[9px] font-black px-2 py-0.5 rounded-full uppercase border border-white/20">Bảo trì</span>
                      ) : tool.available <= 0 ? (
                        <span className="bg-rose-600 text-white text-[7px] md:text-[9px] font-black px-2 py-0.5 rounded-full uppercase border border-white/20">Hết hàng</span>
                      ) : (
                        <span className={`text-white text-[7px] md:text-[9px] font-black px-2 py-0.5 rounded-full uppercase border border-white/20 shadow-sm ${isTet || isNoel ? 'bg-red-600' : 'bg-emerald-600'}`}>
                          Sẵn sàng: {tool.available}
                        </span>
                      )}
                    </div>

                    {/* Manage Mode Overlay */}
                    {isManageMode && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                           onClick={(e) => { e.stopPropagation(); handleEditTool(tool); }}
                           className="p-3 bg-white text-gray-900 rounded-xl hover:scale-110 transition-transform shadow-lg"
                         >
                           <Edit className="w-5 h-5" />
                         </button>
                         <button 
                           onClick={(e) => { e.stopPropagation(); setToolToDelete(tool); }}
                           className="p-3 bg-rose-600 text-white rounded-xl hover:scale-110 transition-transform shadow-lg"
                         >
                           <Trash2 className="w-5 h-5" />
                         </button>
                      </div>
                    )}

                    {/* Selection Checkmark */}
                    {isSelected && !isManageMode && (
                      <div className={`absolute top-3 right-3 p-1.5 rounded-lg text-white shadow-lg animate-zoom-in ${isTet || isNoel ? 'bg-red-600' : 'bg-indigo-600'}`}>
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  <div className="p-4 md:p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                       <span className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest truncate max-w-full">
                         {tool.category || 'Công cụ'}
                       </span>
                    </div>
                    <h3 className="text-xs md:text-sm font-black text-gray-900 uppercase leading-tight italic truncate mb-2 group-hover:text-blue-600 transition-colors">
                      {tool.name}
                    </h3>
                    
                    <div className="mt-auto space-y-2">
                      <div className="flex items-center gap-2 text-[8px] md:text-[10px] text-gray-400 font-bold uppercase">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{tool.location || 'Văn phòng V1'}</span>
                      </div>
                      
                      {/* Quantity Selector for User Mode - GRID */}
                      {!isManageMode && isSelected && isAvailable && (
                        <div className={`flex items-center justify-between p-2 mt-2 rounded-xl border ${isTet || isNoel ? 'bg-red-50 border-red-100' : 'bg-indigo-50 border-indigo-100 shadow-inner'}`}>
                           <button 
                             onClick={(e) => updateQuantitySelection(tool.id, -1, tool.available, e)}
                             className={`p-2 rounded-lg transition-all ${isTet || isNoel ? 'bg-white text-red-600 hover:bg-red-600 hover:text-white' : 'bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white shadow-sm'}`}
                           >
                             <Minus className="w-4 h-4" />
                           </button>
                           <span className={`text-base font-black tabular-nums ${isTet || isNoel ? 'text-red-900' : 'text-indigo-900'}`}>{qty}</span>
                           <button 
                             onClick={(e) => updateQuantitySelection(tool.id, 1, tool.available, e)}
                             className={`p-2 rounded-lg transition-all ${isTet || isNoel ? 'bg-white text-red-600 hover:bg-red-600 hover:text-white' : 'bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white shadow-sm'}`}
                           >
                             <Plus className="w-4 h-4" />
                           </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* TABLE VIEW */
          <Card className="p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-white">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    <th className="px-8 py-6 text-gray-400 font-black uppercase text-[10px] tracking-[0.2em] w-20">Hình ảnh</th>
                    <th className="px-8 py-6 text-gray-400 font-black uppercase text-[10px] tracking-[0.2em]">Tên thiết bị</th>
                    <th className="px-8 py-6 text-gray-400 font-black uppercase text-[10px] tracking-[0.2em]">Vị trí</th>
                    <th className="px-8 py-6 text-gray-400 font-black uppercase text-[10px] tracking-[0.2em] text-center">Tồn kho</th>
                    <th className="px-8 py-6 text-gray-400 font-black uppercase text-[10px] tracking-[0.2em] text-center">Khả dụng</th>
                    <th className="px-8 py-6 text-gray-400 font-black uppercase text-[10px] tracking-[0.2em] text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {currentTools.map((tool) => {
                    const isSelected = !!selectedQuantities[tool.id];
                    const qty = selectedQuantities[tool.id] || 0;
                    const isAvailable = tool.status === 'active' && tool.available > 0;
                    
                    return (
                      <tr 
                        key={tool.id} 
                        className={`hover:bg-indigo-50/20 transition-all group ${isSelected ? 'bg-indigo-50/50' : ''}`}
                        onClick={() => toggleSelection(tool)}
                      >
                        <td className="px-8 py-4">
                          <div className="w-12 h-12 bg-white rounded-xl border border-gray-100 p-1 shadow-sm">
                            <ToolThumbnail src={tool.image} alt={tool.name} mode="table" />
                          </div>
                        </td>
                        <td className="px-8 py-4">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{tool.category}</p>
                          <p className="font-black text-gray-900 text-sm italic uppercase tracking-tight">{tool.name}</p>
                        </td>
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold">
                            <MapPin className="w-3.5 h-3.5 text-gray-300" />
                            {tool.location}
                          </div>
                        </td>
                        <td className="px-8 py-4 text-center">
                          <span className="text-sm font-black tabular-nums">{tool.quantity}</span>
                        </td>
                        <td className="px-8 py-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black border-2 ${
                            tool.status === 'inactive' ? 'bg-gray-100 text-gray-400 border-gray-200' :
                            tool.available > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                          }`}>
                            {tool.available}
                          </span>
                        </td>
                        <td className="px-8 py-4 text-right">
                          <div className="flex justify-end items-center gap-3">
                             {isManageMode ? (
                               <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button onClick={(e) => { e.stopPropagation(); handleEditTool(tool); }} className="p-2.5 bg-gray-50 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all shadow-sm"><Edit className="w-4 h-4"/></button>
                                 <button onClick={(e) => { e.stopPropagation(); setToolToDelete(tool); }} className="p-2.5 bg-gray-50 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all shadow-sm"><Trash2 className="w-4 h-4"/></button>
                               </div>
                             ) : (
                               <div className="flex items-center gap-3">
                                 {isSelected && isAvailable && (
                                   <div className={`flex items-center gap-3 px-3 py-1.5 rounded-xl border animate-fade-in ${isTet || isNoel ? 'bg-white border-red-100' : 'bg-white border-indigo-100 shadow-sm'}`}>
                                      <button 
                                        onClick={(e) => updateQuantitySelection(tool.id, -1, tool.available, e)}
                                        className={`p-1 rounded-lg transition-all ${isTet || isNoel ? 'text-red-600 hover:bg-red-50' : 'text-indigo-600 hover:bg-indigo-50'}`}
                                      >
                                        <Minus className="w-4 h-4" />
                                      </button>
                                      <span className="text-xs font-black tabular-nums min-w-[20px] text-center">{qty}</span>
                                      <button 
                                        onClick={(e) => updateQuantitySelection(tool.id, 1, tool.available, e)}
                                        className={`p-1 rounded-lg transition-all ${isTet || isNoel ? 'text-red-600 hover:bg-red-50' : 'text-indigo-600 hover:bg-indigo-50'}`}
                                      >
                                        <Plus className="w-4 h-4" />
                                      </button>
                                   </div>
                                 )}
                                 <div className={`p-2.5 rounded-xl transition-all shadow-sm ${isSelected ? (isTet || isNoel ? 'bg-red-700 text-white' : 'bg-indigo-600 text-white') : 'bg-gray-50 text-gray-300 group-hover:bg-gray-100'}`}>
                                   <Check className="w-5 h-5" />
                                 </div>
                               </div>
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

      {/* Action Bar Floating (Bottom) */}
      {!isManageMode && totalSelectedCount > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] w-[calc(100%-2rem)] max-w-4xl pointer-events-none animate-fade-in-up">
            <div className={`pointer-events-auto backdrop-blur-2xl border-2 border-white/30 p-2 md:p-3 rounded-[2.5rem] md:rounded-full shadow-[0_30px_60px_rgba(0,0,0,0.5)] flex items-center justify-between gap-4 bg-gray-900 transition-all duration-500 ring-4 ring-black/5`}>
                <div className="flex items-center gap-4 pl-4 overflow-hidden">
                    <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center text-white font-black text-xl md:text-3xl border-4 border-white/20 shadow-2xl shrink-0 bg-gradient-to-br transition-colors duration-500 ${isTet || isNoel ? 'from-red-600 to-red-800' : 'from-indigo-600 to-indigo-800'} animate-pulse`}>
                      {totalSelectedCount}
                    </div>
                    <div className="hidden sm:flex flex-col min-w-0">
                        <p className="text-white font-black text-xs md:text-base uppercase tracking-tight leading-tight italic drop-shadow-sm truncate">
                          {selectedToolNames.length <= 2 ? selectedToolNames.join(', ') : `${selectedToolNames.slice(0, 2).join(', ')} và ${selectedToolNames.length - 2} khác`}
                        </p>
                        <p className="text-emerald-400 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] mt-0.5">Sẵn sàng mượn đồ</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 md:gap-3 pr-2 shrink-0">
                    <button 
                      onClick={() => setSelectedQuantities({})} 
                      className="px-4 py-2 text-white/60 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all hover:bg-white/10 rounded-full"
                    >
                      HỦY
                    </button>
                    <button 
                      onClick={handleBulkBorrow} 
                      disabled={isBorrowing} 
                      className={`text-white px-8 md:px-12 py-4 md:py-5 rounded-[2rem] md:rounded-full text-[11px] md:text-sm font-black uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 transition-all border-b-4 ${isTet || isNoel ? 'bg-red-700 hover:bg-red-600 border-red-900 shadow-red-500/30' : 'bg-indigo-700 hover:bg-indigo-600 border-indigo-900 shadow-indigo-500/30'}`}
                    >
                        {isBorrowing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4 md:w-6 md:h-6" /> GỬI YÊU CẦU</>}
                    </button>
                </div>
            </div>
          </div>
      )}

      {/* Pagination Footer */}
      {filteredTools.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
           <div className="text-[10px] md:text-[12px] text-gray-500 font-black uppercase tracking-widest flex items-center gap-2">
             <div className={`w-2 h-2 rounded-full ${isTet || isNoel ? 'bg-red-600' : 'bg-indigo-600'}`}></div>
             Hiển thị <span className="text-gray-900">{startIndex + 1}-{Math.min(filteredTools.length, startIndex + pageSize)}</span> trên {filteredTools.length} thiết bị
           </div>
           
           <div className="flex items-center gap-3">
              <button 
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="p-3 rounded-2xl border-2 border-gray-100 bg-white text-gray-400 hover:text-indigo-600 disabled:opacity-30 active:scale-90 transition-all"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              
              <div className="flex gap-2 mx-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1).map((p, idx, arr) => (
                  <React.Fragment key={p}>
                    {idx > 0 && arr[idx-1] !== p - 1 && <span className="text-gray-300 flex items-end pb-2 font-black">...</span>}
                    <button
                      onClick={() => handlePageChange(p)}
                      className={`w-11 h-11 rounded-xl text-xs font-black transition-all border-2 ${
                        currentPage === p ? (isTet || isNoel ? 'bg-red-700 text-white border-red-700 shadow-lg' : 'bg-indigo-700 text-white border-indigo-700 shadow-lg') : 'bg-white text-gray-500 border-gray-100'
                      }`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              <button 
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="p-3 rounded-2xl border-2 border-gray-100 bg-white text-gray-400 hover:text-indigo-600 disabled:opacity-30 active:scale-90 transition-all"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
           </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl animate-zoom-in my-8">
            <div className={`p-8 md:p-10 flex justify-between items-center text-white rounded-t-[3rem] ${isTet ? 'bg-red-700' : isNoel ? 'bg-red-600' : 'bg-indigo-700'}`}>
               <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter italic">{isEditing ? 'Cập nhật thiết bị' : 'Thêm thiết bị mới'}</h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mt-1">Thông tin chi tiết tài sản kho V1</p>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white/20 rounded-2xl transition-all active:scale-90"><X className="w-7 h-7" /></button>
            </div>
            
            <div className="p-8 md:p-12 space-y-8 max-h-[70vh] overflow-y-auto no-scrollbar">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tên thiết bị <span className="text-rose-500">*</span></label>
                       <div className="relative group">
                          <Wrench className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-indigo-500 transition-colors" />
                          <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-900 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none" placeholder="VD: Laptop Dell Latitude..." />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Danh mục</label>
                       <div className="relative group">
                          <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                          <input type="text" list="categories" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-900 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none" placeholder="VD: Thiết bị IT" />
                          <datalist id="categories">
                             {uniqueCategories.filter(c => c !== 'all').map(c => <option key={c} value={c} />)}
                          </datalist>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tổng số lượng</label>
                          <input type="number" value={formData.quantity} onChange={e => {
                              const v = parseInt(e.target.value) || 0;
                              setFormData({...formData, quantity: v, available: Math.min(formData.available, v)});
                          }} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-900 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sẵn có mượn</label>
                          <input type="number" value={formData.available} onChange={e => setFormData({...formData, available: Math.min(formData.quantity, parseInt(e.target.value) || 0)})} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-900 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none" />
                       </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">URL Hình ảnh</label>
                       <div className="relative group">
                          <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                          <input type="text" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} className="w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-900 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none" placeholder="https://..." />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Vị trí lưu kho</label>
                       <div className="relative group">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                          <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-900 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none" placeholder="Khu vực IT, Kho A..." />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Trạng thái vận hành</label>
                       <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-black text-gray-900 uppercase focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none appearance-none cursor-pointer">
                          <option value="active">ĐANG HOẠT ĐỘNG</option>
                          <option value="inactive">ĐANG BẢO TRÌ / HỎNG</option>
                       </select>
                    </div>
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mô tả thêm</label>
                  <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-6 bg-gray-50 border-none rounded-3xl text-sm font-bold text-gray-900 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none h-32 resize-none" placeholder="Thông số kỹ thuật, ghi chú sử dụng..."></textarea>
               </div>
            </div>

            <div className="p-8 md:p-10 bg-gray-50 rounded-b-[3rem] border-t border-gray-100">
               <button onClick={handleSaveTool} className={`w-full py-6 text-white font-black rounded-3xl shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all uppercase text-xs tracking-[0.2em] border-b-4 ${isTet ? 'bg-red-700 border-red-900' : isNoel ? 'bg-red-600 border-red-800' : 'bg-indigo-700 border-indigo-900'}`}>
                  <Save className="w-5 h-5" /> LƯU DỮ LIỆU THIẾT BỊ
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {toolToDelete && (
        <div className="fixed inset-0 bg-black/95 z-[120] flex items-center justify-center p-6 backdrop-blur-2xl animate-fade-in">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-sm overflow-hidden animate-zoom-in border border-white/20">
            <div className="p-12 text-center">
              <div className="w-24 h-24 bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-8 rounded-[2rem] shadow-2xl rotate-12 transition-transform hover:rotate-0">
                <AlertTriangle className="w-12 h-12" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-4 uppercase tracking-tighter leading-none italic">Xác nhận xóa?</h3>
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed px-4 opacity-80">
                Mọi dữ liệu về <strong>{toolToDelete.name}</strong> sẽ bị gỡ bỏ vĩnh viễn khỏi kho lưu trữ.
              </p>
            </div>
            <div className="bg-gray-50 p-8 flex flex-col gap-3">
              <button onClick={handleDeleteTool} className="w-full py-5 bg-rose-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-2xl active:scale-95">XÓA THIẾT BỊ</button>
              <button onClick={() => setToolToDelete(null)} className="w-full py-5 bg-white text-gray-400 font-black rounded-2xl border-2 border-gray-100 text-xs uppercase tracking-widest hover:bg-gray-100 transition-all active:scale-95">QUAY LẠI</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
