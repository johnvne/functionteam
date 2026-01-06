
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { Employee } from '../../../types';
import { Card } from '../ui/Card';
import { 
  Search, Plus, User as UserIcon, X, Save, Edit2, Trash2, 
  AlertTriangle, Shield, User, ChevronLeft, ChevronRight, 
  ChevronsLeft, ChevronsRight, Loader2 
} from 'lucide-react';

export const EmployeeList: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  
  // State cho chức năng sửa/thêm
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  
  const initialForm = { employee_id: '', name: '', role: 'user', password: '123' };
  const [formData, setFormData] = useState(initialForm);

  // State cho chức năng xóa
  const [userToDelete, setUserToDelete] = useState<Employee | null>(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('users').select('*').order('employee_id', { ascending: true });
      if (data) setEmployees(data as Employee[]);
      if (error) throw error;
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  // Logic lọc và phân trang
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const currentEmployees = filteredEmployees.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAddNew = () => {
    setFormData(initialForm);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEdit = (employee: Employee) => {
    setCurrentId(employee.id);
    setFormData({
        employee_id: employee.employee_id,
        name: employee.name,
        role: employee.role,
        password: employee.password || '',
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!userToDelete) return;

    try {
      const { error } = await supabase.from('users').delete().eq('id', userToDelete.id);
      if (error) throw error;

      setEmployees(employees.filter(emp => emp.id !== userToDelete.id));
      setUserToDelete(null);
    } catch (error: any) {
      alert('Lỗi khi xóa tài khoản: ' + error.message);
    }
  };

  const handleSave = async () => {
    if (!formData.employee_id || !formData.name) return alert("Vui lòng nhập đủ thông tin");

    try {
      const payload = {
          employee_id: formData.employee_id,
          name: formData.name,
          role: formData.role,
          password: formData.password,
      };

      if (isEditing && currentId) {
        const { error } = await supabase.from('users').update(payload).eq('id', currentId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('users').insert([payload]);
        if (error) throw error;
      }

      await fetchEmployees();
      setIsModalOpen(false);
    } catch (error: any) {
      alert('Lỗi cập nhật: ' + error.message);
    }
  };

  return (
    <div className="space-y-6 relative animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-blue-600 rounded-[1.2rem] shadow-xl shadow-blue-100 text-white">
            <UserIcon className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Danh sách nhân sự</h2>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1 opacity-70">Quản lý tài khoản hệ thống</p>
          </div>
        </div>
        <button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-100 active:scale-95">
          <Plus className="w-4 h-4" />
          Thêm nhân sự
        </button>
      </div>

      <Card className="p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-white">
        {/* Toolbar */}
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="relative group max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-blue-600 transition-colors" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm tên, mã NV..." 
              className="w-full pl-12 pr-4 py-4 rounded-2xl border-none bg-white shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 text-sm font-bold text-gray-900 transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-10 py-6 text-gray-400 font-black uppercase text-[10px] tracking-[0.2em]">Mã NV</th>
                <th className="px-10 py-6 text-gray-400 font-black uppercase text-[10px] tracking-[0.2em]">Họ và tên</th>
                <th className="px-10 py-6 text-gray-400 font-black uppercase text-[10px] tracking-[0.2em]">Vai trò</th>
                <th className="px-10 py-6 text-gray-400 font-black uppercase text-[10px] tracking-[0.2em]">Ngày tạo</th>
                <th className="px-10 py-6 text-gray-400 font-black uppercase text-[10px] tracking-[0.2em] text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-10 py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="w-12 h-12 animate-spin text-blue-600 opacity-20" />
                      <p className="text-xs font-black uppercase tracking-widest text-gray-300">Đang tải dữ liệu...</p>
                    </div>
                  </td>
                </tr>
              ) : currentEmployees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-10 py-32 text-center text-gray-300 font-black italic uppercase tracking-widest opacity-50">
                    Không tìm thấy nhân sự nào
                  </td>
                </tr>
              ) : (
                currentEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-blue-50/20 transition-all duration-300 group">
                    <td className="px-10 py-6 font-black text-blue-600 text-sm tracking-tight">{emp.employee_id}</td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100 shadow-sm transition-transform group-hover:scale-110">
                           <UserIcon className="w-5 h-5 text-indigo-400"/>
                        </div>
                        <span className="font-black text-gray-900 text-sm">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border-2 shadow-sm ${
                        emp.role === 'admin' 
                          ? 'bg-purple-50 text-purple-700 border-purple-200' 
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {emp.role === 'admin' ? <Shield className="w-3.5 h-3.5"/> : <User className="w-3.5 h-3.5"/>}
                        {emp.role}
                      </span>
                    </td>
                    <td className="px-10 py-6 text-[11px] font-black text-gray-400 uppercase tabular-nums">
                        {emp.created_at ? new Date(emp.created_at).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="px-10 py-6 text-right">
                      <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(emp)}
                          className="bg-white p-3 border-2 border-blue-100 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all active:scale-90"
                          title="Sửa thông tin"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setUserToDelete(emp)}
                          className="bg-white p-3 border-2 border-rose-100 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all active:scale-90"
                          title="Xóa tài khoản"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredEmployees.length > 0 && (
          <div className="bg-gray-50 border-t border-gray-100 p-8 flex flex-col sm:flex-row items-center justify-between gap-6 px-10">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <span className="text-[11px] text-gray-400 font-black uppercase tracking-[0.15em]">
                Hiển thị <span className="text-gray-900 tabular-nums">{Math.min(filteredEmployees.length, startIndex + 1)}-{Math.min(filteredEmployees.length, startIndex + pageSize)}</span> trong <span className="text-gray-900 tabular-nums">{filteredEmployees.length}</span> nhân sự
              </span>
              <div className="h-4 w-[1px] bg-gray-200 hidden sm:block"></div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Trang</span>
                <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-sm font-black tabular-nums border border-blue-100">{currentPage} / {totalPages}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="p-3 rounded-2xl border-2 border-gray-100 bg-white disabled:opacity-30 hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-all shadow-sm active:scale-90"
              >
                <ChevronsLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-3 rounded-2xl border-2 border-gray-100 bg-white disabled:opacity-30 hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-all shadow-sm active:scale-90"
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
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xl scale-110 z-10' 
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
                className="p-3 rounded-2xl border-2 border-gray-100 bg-white disabled:opacity-30 hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-all shadow-sm active:scale-90"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button 
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="p-3 rounded-2xl border-2 border-gray-100 bg-white disabled:opacity-30 hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-all shadow-sm active:scale-90"
              >
                <ChevronsRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg animate-zoom-in overflow-hidden">
            <div className="flex justify-between items-center p-10 border-b border-gray-100 sticky top-0 bg-white">
              <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-none">
                {isEditing ? 'Sửa thông tin' : 'Thêm nhân sự mới'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-4 hover:bg-gray-100 rounded-[1.5rem] transition-colors">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            
            <div className="p-10 space-y-6 bg-gray-50/50">
              <div className="space-y-4 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Mã nhân viên</label>
                  <input 
                    type="text" 
                    value={formData.employee_id} 
                    onChange={(e) => setFormData({...formData, employee_id: e.target.value.toUpperCase()})}
                    disabled={isEditing}
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all disabled:opacity-50"
                    placeholder="VD: NV001"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Họ và tên</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Nguyễn Văn A..."
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Vai trò</label>
                      <select 
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer"
                      >
                        <option value="admin">Admin</option>
                        <option value="user">User</option>
                      </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Mật khẩu</label>
                    <input 
                      type="text" 
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={handleSave}
                className="w-full py-6 bg-blue-600 text-white font-black rounded-[2rem] shadow-2xl shadow-blue-100 uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95"
              >
                <Save className="w-5 h-5" />
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete */}
      {userToDelete && (
        <div className="fixed inset-0 bg-black/90 z-[110] flex items-center justify-center p-6 backdrop-blur-xl animate-fade-in">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-sm overflow-hidden animate-zoom-in border border-white/20">
            <div className="p-12 text-center">
              <div className="w-24 h-24 bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-8 rounded-[2rem] shadow-2xl rotate-12 transition-transform hover:rotate-0">
                <AlertTriangle className="w-12 h-12" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-4 uppercase tracking-tighter leading-none">Xóa nhân sự?</h3>
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest opacity-80 leading-relaxed px-4">
                Xác nhận xóa tài khoản <strong>{userToDelete.name}</strong>. Dữ liệu liên quan cũng sẽ bị gỡ bỏ.
              </p>
            </div>
            <div className="bg-gray-50/50 p-8 flex flex-col gap-4 border-t border-gray-100">
              <button 
                onClick={handleDelete}
                className="w-full py-5 bg-rose-600 text-white font-black rounded-[2rem] text-xs uppercase tracking-widest shadow-2xl shadow-rose-200 transition-all active:scale-95"
              >
                XÓA VĨNH VIỄN
              </button>
              <button 
                onClick={() => setUserToDelete(null)}
                className="w-full py-5 bg-white text-gray-400 font-black rounded-[2rem] border-2 border-gray-100 text-xs uppercase tracking-widest hover:bg-gray-100 transition-all active:scale-95"
              >
                HỦY BỎ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
