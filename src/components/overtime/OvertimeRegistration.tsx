
import React, { useState, useEffect, useMemo, useContext } from 'react';
import { User, OvertimeRequest, DayConfig, Employee } from '../../../types';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/Card';
import * as XLSX from 'xlsx';
import { 
  Clock, Calendar as CalendarIcon, X, 
  Timer, Loader2, ChevronLeft, ChevronRight, ChevronDown, Download, BarChart3, Users, User as UserIcon, Settings, Check, Trash2, 
  Activity, Home, Briefcase, FileText, CalendarRange, UserCheck, Search, Filter,
  FileSpreadsheet, FileDown, CalendarDays, Eye, Trophy, Target, Award, Info, Undo2, ArrowRight, Snowflake, Sparkles, UserPlus, UserRoundPen, ChevronUp, Gift, Send, Save
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ThemeContext } from '../../../App';

interface OvertimeRegistrationProps {
  user: User;
}

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

const timeToNumber = (timeStr: string) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h + m / 60;
};

const todayStr = new Date().toISOString().split('T')[0];

export const OvertimeRegistration: React.FC<OvertimeRegistrationProps> = ({ user }) => {
  const { theme } = useContext(ThemeContext);
  const [activeTab, setActiveTab] = useState<'calendar' | 'personal' | 'stats'>('calendar');
  const [requests, setRequests] = useState<OvertimeRequest[]>([]);
  const [dayConfigs, setDayConfigs] = useState<Record<string, boolean>>({}); 
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmCancelOpen, setIsConfirmCancelOpen] = useState(false); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfigUpdating, setIsConfigUpdating] = useState(false);
  const [isListExpanded, setIsListExpanded] = useState(false); 
  
  const [selectedDateStr, setSelectedDateStr] = useState('');
  const [targetUserId, setTargetUserId] = useState(user.id);
  const [startTime, setStartTime] = useState('17:30');
  const [endTime, setEndTime] = useState('20:00');
  const [reason, setReason] = useState('');
  
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);

  const [exportStartDate, setExportStartDate] = useState(todayStr);
  const [exportEndDate, setExportEndDate] = useState(todayStr);
  const [statsViewDate, setStatsViewDate] = useState(todayStr);

  const isAdmin = user.role === 'admin';
  const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const isTet = theme === 'tet';

  useEffect(() => {
    fetchRequests();
    fetchDayConfigs();
    if (isAdmin) fetchEmployees();
  }, [user.id, currentDate]);

  // Tìm yêu cầu hiện tại của user mục tiêu trên ngày được chọn
  const currentSelectedRequest = useMemo(() => {
    if (!selectedDateStr || !targetUserId) return null;
    return requests.find(r => r.date === selectedDateStr && r.user_id === targetUserId) || null;
  }, [requests, selectedDateStr, targetUserId]);

  // Danh sách các yêu cầu trong ngày (Dùng để hiển thị danh sách bên trên form)
  // Sửa lỗi: Lọc duy nhất theo user_id để tránh một người hiện 2 lần nếu DB có lỗi
  const dayRequestsInModal = useMemo(() => {
    const dayReqs = requests.filter(r => r.date === selectedDateStr);
    const uniqueReqs: OvertimeRequest[] = [];
    const seenUsers = new Set();
    
    dayReqs.forEach(req => {
      if (!seenUsers.has(req.user_id)) {
        seenUsers.add(req.user_id);
        uniqueReqs.push(req);
      }
    });
    return uniqueReqs;
  }, [requests, selectedDateStr]);

  // Tự động điền form khi thay đổi ngày hoặc nhân viên được chọn
  useEffect(() => {
    if (!selectedDateStr) return;
    
    if (currentSelectedRequest) {
        // Nếu đã có đăng ký, chuyển sang chế độ EDIT
        setStartTime(currentSelectedRequest.start_time);
        setEndTime(currentSelectedRequest.end_time);
        setReason(currentSelectedRequest.reason || '');
        setEditingRequestId(currentSelectedRequest.id);
    } else {
        // Nếu chưa có, thiết lập mặc định dựa trên cấu hình ngày
        const dateObj = new Date(selectedDateStr);
        const dayOfWeek = dateObj.getDay(); 
        const defaultIsWorking = dayOfWeek !== 0 && dayOfWeek !== 6;
        const isWorkingDay = dayConfigs[selectedDateStr] ?? defaultIsWorking;

        if (isWorkingDay) {
            setStartTime(dayOfWeek === 6 ? '14:30' : '17:30');
            setEndTime('20:00');
        } else {
            setStartTime('08:00');
            setEndTime('20:00');
        }
        setReason('');
        setEditingRequestId(null);
    }
  }, [selectedDateStr, targetUserId, currentSelectedRequest, dayConfigs]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
          .from('ot_requests')
          .select('*, users(employee_id, name)');
      if (error) throw error;
      if (data) setRequests(data as OvertimeRequest[]);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    const { data } = await supabase.from('users').select('*').order('name');
    if (data) setAllEmployees(data as Employee[]);
  };

  const fetchDayConfigs = async () => {
    const startOfMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;
    const endOfMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth())}`;
    const { data } = await supabase.from('day_configs').select('*').gte('date', startOfMonth).lte('date', endOfMonth);
    if (data) {
        const configMap: Record<string, boolean> = {};
        (data as DayConfig[]).forEach(cfg => configMap[cfg.date] = cfg.is_working_day);
        setDayConfigs(configMap);
    }
  };

  const updateDayWorkingStatus = async (status: boolean) => {
    if (!isAdmin || !selectedDateStr) return;
    setIsConfigUpdating(true);
    try {
        const { error } = await supabase.from('day_configs').upsert({ date: selectedDateStr, is_working_day: status });
        if (error) throw error;
        setDayConfigs(prev => ({ ...prev, [selectedDateStr]: status }));
    } catch (err: any) {
        alert("Lỗi cập nhật: " + err.message);
    } finally {
        setIsConfigUpdating(false);
    }
  };

  const calculateHours = (start: string, end: string, dateStr: string) => {
    if (!dateStr || !start || !end) return 0;
    const s = timeToNumber(start);
    const e = Math.min(timeToNumber(end), 22.0);
    const diff = e - s;
    if (diff <= 0) return 0;
    
    const dateObj = new Date(dateStr);
    const defaultIsWorking = dateObj.getDay() !== 0 && dateObj.getDay() !== 6;
    const isWorkDay = dayConfigs[dateStr] ?? defaultIsWorking;
    
    let ded = 0;
    if (diff >= 8) ded = 1.0;
    else if (diff > 4 && (!isWorkDay || diff > 5)) ded = 0.5;
    return parseFloat(Math.max(0, diff - ded).toFixed(2));
  };

  const calculatedHours = useMemo(() => calculateHours(startTime, endTime, selectedDateStr), [startTime, endTime, selectedDateStr, dayConfigs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (calculatedHours <= 0) return alert("Giờ làm không hợp lệ.");
    
    setIsSubmitting(true);

    try {
      // Kiểm tra lần cuối trước khi submit để tránh duplicate nếu 2 người cùng thao tác
      const { data: existing } = await supabase
        .from('ot_requests')
        .select('id')
        .eq('user_id', targetUserId)
        .eq('date', selectedDateStr)
        .maybeSingle();

      const finalEditingId = editingRequestId || existing?.id;

      const payload = {
          user_id: targetUserId, 
          date: selectedDateStr, 
          start_time: startTime,
          end_time: endTime, 
          total_hours: calculatedHours, 
          reason: reason.trim(), 
          status: 'approved' 
      };

      const res = finalEditingId 
        ? await supabase.from('ot_requests').update(payload).eq('id', finalEditingId)
        : await supabase.from('ot_requests').insert([payload]);

      if (res.error) throw res.error;
      
      await fetchRequests();
      setIsModalOpen(false);
    } catch (err: any) {
        alert("Lỗi: " + err.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!editingRequestId) return;
    setIsDeleting(true);
    try {
        const { error } = await supabase.from('ot_requests').delete().eq('id', editingRequestId);
        if (error) throw error;
        setRequests(prev => prev.filter(r => r.id !== editingRequestId));
        setIsConfirmCancelOpen(false);
        setIsModalOpen(false);
    } catch (err: any) {
        alert(err.message);
    } finally {
        setIsDeleting(false);
    }
  };

  const handleExportExcelPro = (mode: 'today' | 'range') => {
    let dataToExport = [];
    if (mode === 'today') {
      dataToExport = requests.filter(r => r.date === todayStr);
    } else {
      dataToExport = requests.filter(r => r.date >= exportStartDate && r.date <= exportEndDate);
    }

    if (dataToExport.length === 0) return alert("Không có dữ liệu để xuất.");

    const workbook = XLSX.utils.book_new();
    const wscols = [
      {wch: 6},  // STT
      {wch: 15}, // Mã NV
      {wch: 25}, // Họ tên
      {wch: 12}, // Bắt đầu
      {wch: 12}, // Kết thúc
      {wch: 12}, // Tổng giờ
      {wch: 40}, // Lý do
      {wch: 15}  // Trạng thái
    ];

    const groupedByDate: Record<string, OvertimeRequest[]> = {};
    dataToExport.forEach(req => {
        if (!groupedByDate[req.date]) groupedByDate[req.date] = [];
        groupedByDate[req.date].push(req);
    });

    const sortedDates = Object.keys(groupedByDate).sort();

    sortedDates.forEach(date => {
        // Sắp xếp và đảm bảo không trùng user trong file xuất (nếu DB có lỗi)
        const userMap = new Map();
        groupedByDate[date].forEach(r => userMap.set(r.user_id, r));
        
        const dayRequests = Array.from(userMap.values())
          .sort((a, b) => (a.users?.employee_id || "").localeCompare(b.users?.employee_id || ""));
          
        const formattedData = dayRequests.map((req, idx) => ({
          'STT': idx + 1,
          'Mã nhân viên': req.users?.employee_id || 'N/A',
          'Họ và tên': req.users?.name || 'Ẩn danh',
          'Giờ bắt đầu': req.start_time,
          'Giờ kết thúc': req.end_time,
          'Tổng giờ': req.total_hours,
          'Nội dung công việc': req.reason,
          'Trạng thái': req.status === 'approved' ? 'Đã duyệt' : 'Đang xử lý'
        }));
        const worksheet = XLSX.utils.json_to_sheet(formattedData);
        worksheet['!cols'] = wscols;
        XLSX.utils.book_append_sheet(workbook, worksheet, date);
    });

    const fileName = `Bao_cao_tang_ca_${mode === 'today' ? todayStr : (exportStartDate + '_den_' + exportEndDate)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const handleDateClick = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    setTargetUserId(user.id);
    setIsModalOpen(true);
    setIsListExpanded(false); 
  };

  const myStats = useMemo(() => {
    const my = requests.filter(r => r.user_id === user.id && r.date.startsWith(currentMonthStr));
    const total = my.filter(r => r.status === 'approved').reduce((sum, r) => sum + Number(r.total_hours || 0), 0);
    const trend = Array.from({length: getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth())}, (_, i) => {
        const d = i + 1;
        const dStr = `${currentMonthStr}-${String(d).padStart(2, '0')}`;
        return { day: d, hours: my.find(r => r.date === dStr)?.total_hours || 0 };
    });
    return { total, count: my.length, pending: my.filter(r => r.status === 'pending').length, trend };
  }, [requests, user.id, currentMonthStr, currentDate]);

  const teamMonthlyStats = useMemo(() => {
    const monthlyApproved = requests.filter(r => r.date.startsWith(currentMonthStr) && r.status === 'approved');
    // Đảm bảo đếm số người duy nhất
    const uniqueUserIds = new Set(monthlyApproved.map(r => r.user_id));
    const totalHours = monthlyApproved.reduce((sum, r) => sum + Number(r.total_hours || 0), 0);
    return { totalHours, activeMembers: uniqueUserIds.size };
  }, [requests, currentMonthStr]);

  const topRankings = useMemo(() => {
    const employeeMap: Record<string, { name: string; hours: number; count: number }> = {};
    const monthlyApproved = requests.filter(r => r.date.startsWith(currentMonthStr) && r.status === 'approved');
    monthlyApproved.forEach(req => {
        const id = req.user_id;
        if (!employeeMap[id]) employeeMap[id] = { name: req.users?.name || 'Ẩn danh', hours: 0, count: 0 };
        employeeMap[id].hours = Number((employeeMap[id].hours + Number(req.total_hours || 0)).toFixed(2));
        employeeMap[id].count += 1;
    });
    return Object.values(employeeMap).sort((a, b) => b.hours - a.hours).slice(0, 10);
  }, [requests, currentMonthStr]);

  const targetedRegistrations = useMemo(() => {
    const dayReqs = requests.filter(r => r.date === statsViewDate);
    // Loại bỏ trùng lặp nếu có
    const uniqueMap = new Map();
    dayReqs.forEach(r => uniqueMap.set(r.user_id, r));
    return Array.from(uniqueMap.values()).sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [requests, statsViewDate]);

  const renderCalendarDays = () => {
    const days = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = getFirstDayOfMonth(year, month);
    const startOffset = firstDay === 0 ? 6 : firstDay - 1; 
    const totalDays = getDaysInMonth(year, month);

    for (let i = 0; i < startOffset; i++) {
        days.push(<div key={`empty-${i}`} className="h-20 md:h-32 bg-gray-50/50 border border-gray-100/50 opacity-40"></div>);
    }

    for (let d = 1; d <= totalDays; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayRequestsLocal = requests.filter(r => r.date === dateStr);
        
        // Loại bỏ trùng lặp để đếm chính xác số người trên lịch
        const uniqueUserIds = new Set(dayRequestsLocal.map(r => r.user_id));
        const myRequest = dayRequestsLocal.find(r => r.user_id === user.id);
        
        const isToday = todayStr === dateStr;
        const isPast = dateStr < todayStr;
        const dateObj = new Date(year, month, d);
        const isActuallyWorking = dayConfigs[dateStr] ?? (dateObj.getDay() !== 0 && dateObj.getDay() !== 6);
        
        days.push(
            <div 
                key={d} 
                onClick={() => handleDateClick(dateStr)}
                className={`h-24 md:h-36 border border-gray-100 p-1 md:p-2 relative transition-all cursor-pointer group flex flex-col 
                  ${isToday ? 'bg-blue-50/80 ring-inset ring-2 ring-blue-600/40 z-10' : 'bg-white hover:bg-gray-50'} 
                  ${isPast ? 'opacity-70' : 'opacity-100'}`}
            >
                <div className="flex justify-between items-start mb-1">
                    <span className={`text-[10px] md:text-sm font-black ${isToday ? 'bg-blue-600 text-white w-5 h-5 md:w-8 md:h-8 rounded-lg flex items-center justify-center shadow-lg' : 'text-gray-900'}`}>
                        {d}
                    </span>
                    {!isActuallyWorking && (
                      <span className="text-[6px] md:text-[8px] font-black px-1.5 py-0.5 rounded uppercase bg-rose-600 text-white shadow-sm">NGHỈ</span>
                    )}
                </div>
                
                <div className="flex-1 flex flex-col justify-start gap-1 md:gap-1.5 overflow-hidden">
                    {myRequest && (
                      <div className="flex items-center gap-1.5 bg-emerald-600 text-white px-2 py-0.5 rounded-full shrink-0 shadow-md border border-white/20">
                        <UserIcon className="w-2 h-2 md:w-3 md:h-3" />
                        <span className="text-[7px] md:text-[10px] font-black truncate uppercase">BẠN: {myRequest.total_hours}h</span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {dayRequestsLocal.slice(0, 4).map((req, idx) => (
                        <div key={idx} className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-indigo-700 text-white border-2 border-white flex items-center justify-center shrink-0 shadow-lg" title={req.users?.name}>
                           <span className="text-[7px] md:text-[10px] font-black uppercase">{req.users?.name?.charAt(0)}</span>
                        </div>
                      ))}
                    </div>
                </div>

                {uniqueUserIds.size > 0 && (
                    <div className="absolute bottom-1 right-1 bg-gray-900 text-white text-[7px] md:text-[10px] px-2 py-0.5 rounded-full font-black border border-white/10 shadow-xl">
                        {uniqueUserIds.size} NV
                    </div>
                )}
            </div>
        );
    }
    return days;
  };

  return (
    <div className="space-y-4 h-full flex flex-col animate-fade-in max-w-[1400px] mx-auto w-full px-2 md:px-0 pb-24">
        {/* TAB HEADER */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 md:gap-4">
                <div className={`p-4 rounded-2xl shadow-xl text-white transform hover:rotate-3 transition-transform ${isTet ? 'bg-red-700' : 'bg-indigo-600'}`}>
                    <Clock className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <div>
                    <h2 className={`text-lg md:text-2xl font-black ${isTet ? 'text-red-900' : 'text-gray-900'} tracking-tight uppercase italic flex items-center gap-2 leading-none`}>
                        Tăng ca 
                        {isTet && <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />}
                    </h2>
                    <p className="text-[9px] md:text-xs text-gray-500 font-black uppercase tracking-[0.15em] mt-1">Manager Tool V1</p>
                </div>
            </div>
            <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 shadow-inner w-full lg:w-auto">
                {['calendar', 'personal', 'stats'].map(t => (
                    <button key={t} onClick={() => setActiveTab(t as any)} className={`flex-1 lg:flex-none px-4 md:px-10 py-2.5 rounded-lg text-[10px] md:text-xs font-black transition-all uppercase tracking-widest ${activeTab === t ? (isTet ? 'bg-red-700 text-white shadow-lg' : 'bg-white text-indigo-700 shadow-lg') : 'text-gray-600 hover:text-gray-900'}`}>
                        {t === 'calendar' ? 'Lịch' : t === 'personal' ? 'Cá nhân' : 'Thống kê'}
                    </button>
                ))}
            </div>
        </div>

        {/* TAB CONTENT */}
        <div className="flex-1">
            {activeTab === 'calendar' && (
                <Card className="h-full flex flex-col p-0 overflow-hidden border-none shadow-2xl rounded-[1.5rem] md:rounded-[3rem] bg-white">
                    <div className="flex items-center justify-between p-4 md:p-8 bg-white border-b border-gray-100">
                        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth()-1, 1))} className={`p-2.5 hover:bg-gray-100 rounded-xl transition-all ${isTet ? 'text-red-700' : 'text-indigo-700'}`}><ChevronLeft className="w-6 h-6 md:w-8 md:h-8"/></button>
                        <h3 className={`text-sm md:text-2xl font-black uppercase tracking-[0.1em] ${isTet ? 'text-red-900' : 'text-gray-900'} italic`}>Tháng {currentDate.getMonth()+1} / {currentDate.getFullYear()}</h3>
                        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth()+1, 1))} className={`p-2.5 hover:bg-gray-100 rounded-xl transition-all ${isTet ? 'text-red-700' : 'text-indigo-700'}`}><ChevronRight className="w-6 h-6 md:w-8 md:h-8"/></button>
                    </div>
                    <div className="grid grid-cols-7 bg-gray-50/50 text-[9px] md:text-xs font-black uppercase text-gray-400 border-b border-gray-100">
                        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d, i) => <div key={d} className={`py-4 md:py-6 text-center ${i >= 5 ? 'text-rose-600' : ''}`}>{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-gray-200 gap-[1px]">
                        {renderCalendarDays()}
                    </div>
                </Card>
            )}

            {activeTab === 'personal' && (
                <div className="space-y-6 animate-fade-in-up">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        <Card className={`${isTet ? 'bg-gradient-to-br from-red-700 to-red-900' : 'bg-gradient-to-br from-indigo-700 to-blue-900'} text-white border-none shadow-2xl rounded-[1.5rem] p-6`}>
                            <h3 className="text-[10px] font-black uppercase opacity-80 tracking-widest text-white/90">Tổng giờ T{currentDate.getMonth()+1}</h3>
                            <div className="flex items-end gap-1.5 mt-3"><span className="text-2xl md:text-4xl font-black tabular-nums">{myStats.total.toFixed(1)}</span><span className="text-xs font-bold opacity-70 mb-1.5">h</span></div>
                        </Card>
                        <Card className="bg-white border-l-[6px] border-emerald-600 rounded-[1.5rem] p-6 shadow-xl flex items-center gap-5">
                            <div className="p-4 bg-emerald-100 rounded-2xl text-emerald-700 hidden sm:block"><Check className="w-8 h-8"/></div>
                            <div><p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Ngày đăng ký</p><p className="text-2xl md:text-3xl font-black text-gray-900 tabular-nums">{myStats.count}</p></div>
                        </Card>
                    </div>
                    <Card className="rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-12 shadow-xl border-none bg-white">
                        <div className="mb-8">
                            <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center gap-3"><Activity className="text-indigo-600" /> Biểu đồ hoạt động</h4>
                        </div>
                        <div className="h-64 md:h-[450px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={myStats.trend}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fontBold: 'bold', fill: '#94a3b8'}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontBold: 'bold', fill: '#94a3b8'}} />
                                    <Tooltip cursor={{fill: '#f8fafc'}} />
                                    <Bar dataKey="hours" fill={isTet ? "#dc2626" : "#4f46e5"} radius={[4, 4, 0, 0]} barSize={12} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>
            )}

            {activeTab === 'stats' && (
                <div className="space-y-6 animate-fade-in-up pb-10 bg-slate-100/50 p-2 md:p-4 rounded-[2rem] md:rounded-[3rem]">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                        <Card className="bg-white p-5 border-none shadow-xl rounded-[1.5rem] flex items-center gap-5">
                            <div className={`p-4 ${isTet ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'} rounded-[1.2rem]`}><Users className="w-8 h-8"/></div>
                            <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Thành viên OT</p><p className="text-xl md:text-3xl font-black text-gray-900">{teamMonthlyStats.activeMembers}</p></div>
                        </Card>
                        <Card className="bg-white p-5 border-none shadow-xl rounded-[1.5rem] flex items-center gap-5">
                            <div className={`p-4 bg-emerald-100 text-emerald-700 rounded-[1.2rem]`}><Timer className="w-8 h-8"/></div>
                            <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tổng giờ nhóm</p><p className="text-xl md:text-3xl font-black text-gray-900">{teamMonthlyStats.totalHours.toFixed(1)}h</p></div>
                        </Card>
                        <Card className={`${isTet ? 'bg-gradient-to-br from-red-700 to-red-900' : 'bg-gradient-to-br from-indigo-700 to-indigo-950'} text-white p-5 border-none shadow-2xl rounded-[1.5rem] flex items-center gap-5 border-b-4 border-black/10`}>
                            <div className="p-4 bg-white/20 rounded-[1.2rem] shadow-inner"><Target className="w-8 h-8 text-white"/></div>
                            <div>
                                <p className="text-[10px] font-black text-white/90 uppercase tracking-widest drop-shadow-md">Hôm nay</p>
                                <p className="text-xl md:text-3xl font-black text-white drop-shadow-lg">{requests.filter(r => r.date === todayStr).length} nhân sự</p>
                            </div>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8">
                        {/* Chi tiết đăng ký theo ngày */}
                        <div className="xl:col-span-8 space-y-6">
                            <Card className="rounded-[2rem] md:rounded-[2.5rem] p-0 overflow-hidden shadow-2xl border-none bg-white">
                                <div className="p-6 md:p-8 bg-gray-50/80 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        <h4 className="text-lg font-black text-gray-900 uppercase flex items-center gap-3 italic">
                                            <Clock className="text-indigo-700 w-5 h-5"/> 
                                            Danh sách chi tiết 
                                            <span className="ml-2 px-2.5 py-1 bg-indigo-100 text-indigo-700 text-[10px] rounded-full normal-case not-italic font-black border border-indigo-200 shadow-sm">
                                                {targetedRegistrations.length} người
                                            </span>
                                        </h4>
                                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mt-1">Dữ liệu ngày {statsViewDate.split('-').reverse().join('/')}</p>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm w-full md:w-auto">
                                        <CalendarIcon className="w-4 h-4 text-gray-400" />
                                        <input type="date" value={statsViewDate} onChange={(e) => setStatsViewDate(e.target.value)} className="bg-transparent text-[11px] font-black outline-none uppercase cursor-pointer text-gray-900 w-full"/>
                                    </div>
                                </div>
                                <div className="p-4 md:p-6 space-y-3 overflow-y-auto max-h-[500px] no-scrollbar">
                                    {targetedRegistrations.length === 0 ? (
                                        <div className="py-20 text-center flex flex-col items-center gap-4 opacity-30 grayscale">
                                            <Info className="w-12 h-12 text-gray-900"/>
                                            <p className="font-black uppercase text-[10px] tracking-[0.15em] text-gray-900">Không tìm thấy dữ liệu đăng ký</p>
                                        </div>
                                    ) : (
                                        targetedRegistrations.map((req, idx) => (
                                            <div key={idx} className="p-4 md:p-5 rounded-[1.5rem] bg-white border-2 border-gray-100 hover:border-indigo-200 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group shadow-sm hover:shadow-md">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        <div className="absolute -top-2 -left-2 w-6 h-6 bg-gray-900 text-white text-[10px] font-black rounded-lg flex items-center justify-center border-2 border-white shadow-md z-10">
                                                            {idx + 1}
                                                        </div>
                                                        <div className={`w-12 h-12 md:w-14 md:h-14 text-white rounded-[1.2rem] flex items-center justify-center font-black text-lg md:text-xl shadow-lg transition-transform group-hover:rotate-3 ${isTet ? 'bg-red-700' : 'bg-indigo-700'}`}>{req.users?.name?.charAt(0)}</div>
                                                    </div>
                                                    <div>
                                                        <h5 className="font-black text-gray-900 text-sm md:text-base uppercase italic leading-none">{req.users?.name}</h5>
                                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                                          <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest px-2 py-0.5 bg-gray-100 rounded-md border border-gray-200">{req.users?.employee_id}</span>
                                                          <span className="text-[9px] font-black text-indigo-800 uppercase px-2 py-0.5 bg-indigo-50 rounded-md border border-indigo-200">{req.start_time} - {req.end_time}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-left sm:text-right w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100 flex sm:flex-col justify-between sm:justify-center items-center sm:items-end">
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest hidden sm:block">Giờ làm</p>
                                                    <div className="flex items-baseline gap-1">
                                                      <span className="text-xl md:text-2xl font-black text-gray-900 tabular-nums">{req.total_hours.toFixed(1)}</span>
                                                      <span className="text-[10px] font-black text-gray-500 uppercase">H</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </Card>
                        </div>

                        <div className="xl:col-span-4 space-y-6 md:space-y-8">
                            <Card className="rounded-[2rem] md:rounded-[2.5rem] p-0 overflow-hidden shadow-2xl border-none bg-white">
                                <div className={`p-6 md:p-8 ${isTet ? 'bg-red-800' : 'bg-indigo-800'} text-white relative overflow-hidden`}>
                                    <div className="absolute top-0 right-0 p-4 opacity-10"><Award className="w-24 h-24 rotate-12" /></div>
                                    <h4 className="text-sm md:text-lg font-black uppercase flex items-center gap-3 italic relative z-10"><Award className="text-yellow-400 w-6 h-6" /> Bảng xếp hạng</h4>
                                    <p className="text-[10px] font-black opacity-80 uppercase tracking-widest mt-1.5 relative z-10">Tháng {currentDate.getMonth()+1}</p>
                                </div>
                                <div className="p-4 md:p-6 space-y-3">
                                    {topRankings.map((emp, idx) => (
                                        <div key={idx} className={`p-3 md:p-4 rounded-[1.2rem] border-2 flex items-center gap-4 transition-all ${idx === 0 ? 'bg-yellow-50/50 border-yellow-200 shadow-md scale-[1.02]' : 'bg-white border-gray-100 hover:border-indigo-100 shadow-sm'}`}>
                                            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center font-black text-xs md:text-sm shrink-0 shadow-md ${idx === 0 ? 'bg-yellow-500 text-white' : idx === 1 ? 'bg-slate-300 text-white' : idx === 2 ? 'bg-orange-300 text-white' : 'bg-gray-100 text-gray-500'}`}>{idx + 1}</div>
                                            <div className="flex-1 min-w-0">
                                                <h5 className="font-black text-gray-900 text-[11px] md:text-[13px] truncate uppercase">{emp.name}</h5>
                                                <p className="text-[9px] font-black text-gray-400 uppercase mt-0.5">{emp.count} ngày OT</p>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-base md:text-lg font-black ${idx === 0 ? 'text-yellow-700' : 'text-indigo-900'} tabular-nums`}>{emp.hours.toFixed(1)}</span>
                                                <span className="text-[9px] font-black text-gray-400 ml-1 uppercase">h</span>
                                            </div>
                                        </div>
                                    ))}
                                    {topRankings.length === 0 && (
                                        <div className="py-10 text-center italic text-gray-300 text-xs font-bold uppercase tracking-widest">Chưa có dữ liệu tháng này</div>
                                    )}
                                </div>
                            </Card>

                            {isAdmin && (
                                <Card className="rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-2xl border-none bg-gray-900 text-white space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white/10 rounded-[1rem]"><FileSpreadsheet className="w-6 h-6 text-emerald-400"/></div>
                                        <div><h4 className="font-black uppercase italic text-sm">Báo cáo hệ thống</h4><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Xuất dữ liệu chuẩn Excel</p></div>
                                    </div>
                                    <div className="space-y-4">
                                        <button onClick={() => handleExportExcelPro('today')} className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-[1.2rem] text-[10px] uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 border-b-4 border-emerald-900">XUẤT HÔM NAY</button>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                              <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.15em] ml-1">Từ ngày:</p>
                                              <input type="date" value={exportStartDate} onChange={e => setExportStartDate(e.target.value)} className="w-full bg-white border-none rounded-xl p-3 text-[10px] font-black text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner"/>
                                            </div>
                                            <div className="space-y-1.5">
                                              <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.15em] ml-1">Đến ngày:</p>
                                              <input type="date" value={exportEndDate} onChange={e => setExportEndDate(e.target.value)} className="w-full bg-white border-none rounded-xl p-3 text-[10px] font-black text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner"/>
                                            </div>
                                        </div>
                                        <button onClick={() => handleExportExcelPro('range')} className="w-full py-4 bg-indigo-700 hover:bg-indigo-800 text-white font-black rounded-[1.2rem] text-[10px] uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 border-b-4 border-indigo-950">XUẤT DÀI NGÀY</button>
                                    </div>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* REGISTRATION MODAL */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-black/80 z-[100] flex items-end md:items-center justify-center backdrop-blur-md animate-fade-in px-0 md:px-4">
                <div className="bg-white rounded-t-[2.5rem] md:rounded-[3rem] shadow-2xl w-full max-w-2xl animate-slide-up overflow-hidden max-h-[96vh] flex flex-col border border-white/20 shadow-[0_-20px_60px_rgba(0,0,0,0.4)]">
                    <div className={`${isTet ? 'bg-gradient-to-r from-red-700 to-red-900' : 'bg-gradient-to-r from-indigo-700 to-blue-900'} p-6 md:p-8 flex justify-between items-center text-white shrink-0 shadow-2xl relative`}>
                        <div className="flex flex-col relative z-10">
                            <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter italic">Ghi nhận tăng ca</h3>
                            <p className="text-[10px] md:text-sm font-black uppercase tracking-[0.2em] opacity-80 mt-1">Ngày {selectedDateStr.split('-').reverse().join('/')}</p>
                        </div>
                        <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white/20 rounded-2xl transition-all active:scale-90"><X className="w-7 h-7 md:w-8 md:h-8"/></button>
                    </div>
                    
                    <div className="p-5 md:p-10 space-y-6 overflow-y-auto no-scrollbar pb-20 bg-gray-50 flex-1">
                        
                        {/* DANH SÁCH NHÂN VIÊN ĐÃ ĐĂNG KÝ TRONG NGÀY */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Nhân sự đã đăng ký ({dayRequestsInModal.length})</h4>
                                {dayRequestsInModal.length > 3 && (
                                    <button onClick={() => setIsListExpanded(!isListExpanded)} className="text-[10px] font-black text-indigo-700 uppercase tracking-widest hover:underline">
                                        {isListExpanded ? 'Thu gọn' : 'Xem tất cả'}
                                    </button>
                                )}
                            </div>
                            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 transition-all duration-300 ${!isListExpanded && dayRequestsInModal.length > 4 ? 'max-h-48 overflow-hidden' : ''}`}>
                                {dayRequestsInModal.length === 0 ? (
                                    <div className="col-span-full py-6 text-center bg-white rounded-2xl border-2 border-dashed border-gray-100 italic text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        Chưa có nhân sự đăng ký trong ngày này
                                    </div>
                                ) : (
                                    dayRequestsInModal.map((r) => (
                                        <div key={r.id} className={`flex items-center justify-between p-3 bg-white rounded-2xl border shadow-sm transition-all ${r.user_id === user.id ? (isTet ? 'border-red-200 bg-red-50/50' : 'border-indigo-200 bg-indigo-50/50') : 'border-gray-100'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs text-white shadow-md ${isTet ? 'bg-red-700' : 'bg-indigo-600'}`}>{r.users?.name?.charAt(0)}</div>
                                                <div className="min-w-0">
                                                    <p className="text-[11px] font-black uppercase text-gray-900 truncate leading-none mb-1">{r.users?.name}</p>
                                                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-tight">{r.start_time} - {r.end_time}</p>
                                                </div>
                                            </div>
                                            <div className={`text-[10px] font-black px-2 py-0.5 rounded-lg border-2 tabular-nums ${isTet ? 'text-red-700 border-red-200 bg-red-50' : 'text-indigo-700 border-indigo-200 bg-indigo-50'}`}>{r.total_hours}h</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {isAdmin && (
                            <div className="bg-white p-5 rounded-[1.5rem] border-2 border-gray-100 shadow-lg space-y-4">
                                <div className="flex items-center gap-3">
                                    <Settings className={`w-4 h-4 ${isTet ? 'text-red-700' : 'text-indigo-700'}`} />
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-900">Loại ngày công</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => updateDayWorkingStatus(false)} className={`py-4 rounded-xl border-2 transition-all font-black text-[11px] uppercase tracking-widest shadow-sm ${ (dayConfigs[selectedDateStr] === false || (dayConfigs[selectedDateStr] === undefined && (new Date(selectedDateStr).getDay() === 0 || new Date(selectedDateStr).getDay() === 6))) ? 'bg-rose-700 text-white border-rose-700 shadow-rose-200/50' : 'bg-white text-gray-600 border-gray-100 hover:border-rose-200' }`}>NGÀY NGHỈ</button>
                                    <button onClick={() => updateDayWorkingStatus(true)} className={`py-4 rounded-xl border-2 transition-all font-black text-[11px] uppercase tracking-widest shadow-sm ${ (dayConfigs[selectedDateStr] === true || (dayConfigs[selectedDateStr] === undefined && new Date(selectedDateStr).getDay() !== 0 && new Date(selectedDateStr).getDay() !== 6)) ? (isTet ? 'bg-red-700 border-red-700 text-white' : 'bg-indigo-700 border-indigo-700 text-white') : 'bg-white text-gray-600 border-gray-100 hover:border-indigo-200' }`}>NGÀY ĐI LÀM</button>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="bg-white p-6 md:p-8 rounded-[2rem] border-2 border-gray-100 shadow-2xl space-y-6 relative overflow-hidden ring-1 ring-black/5">
                                {isAdmin && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center ml-1">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Nhân sự thực hiện:</label>
                                            {editingRequestId && (
                                                <span className="text-[9px] font-black text-amber-600 uppercase bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Đã có đăng ký - Chế độ Cập nhật</span>
                                            )}
                                        </div>
                                        <div className="relative group">
                                            <select required value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-xl text-[12px] font-black outline-none uppercase appearance-none cursor-pointer focus:bg-white focus:border-indigo-600 transition-all text-gray-900 shadow-inner">
                                                {allEmployees.map(emp => (<option key={emp.id} value={emp.id}>{emp.name} ({emp.employee_id})</option>))}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4 md:gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Bắt đầu:</label>
                                        <input type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent rounded-xl text-sm font-black text-gray-900 outline-none focus:bg-white focus:border-indigo-600 transition-all shadow-inner"/>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Kết thúc:</label>
                                        <input type="time" required value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent rounded-xl text-sm font-black text-gray-900 outline-none focus:bg-white focus:border-indigo-600 transition-all shadow-inner"/>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Nội dung công việc:</label>
                                        <span className={`text-[11px] font-black px-4 py-1 rounded-lg border-2 shadow-sm ${isTet ? 'bg-red-700 text-white border-red-700' : 'bg-indigo-700 text-white border-indigo-700'}`}>{calculatedHours.toFixed(1)}h OT</span>
                                    </div>
                                    <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="w-full p-5 bg-gray-50 border-2 border-transparent rounded-[1.5rem] text-sm md:text-base h-32 resize-none outline-none font-bold text-gray-900 focus:bg-white focus:border-indigo-600 transition-all shadow-inner placeholder:text-gray-400" placeholder="VD: Sửa chữa thiết bị KHO A, kiểm kê hàng hóa..."/>
                                </div>

                                <div className="flex gap-4 pt-2">
                                    {editingRequestId && (isAdmin || targetUserId === user.id) && (
                                        <button type="button" onClick={() => setIsConfirmCancelOpen(true)} className="p-5 bg-rose-700 text-white rounded-2xl shadow-lg active:scale-90"><Trash2 className="w-6 h-6"/></button>
                                    )}
                                    <button type="submit" disabled={isSubmitting || calculatedHours <= 0} className={`flex-1 py-5 text-white font-black rounded-[1.5rem] shadow-2xl text-[11px] md:text-sm tracking-[0.2em] uppercase active:scale-95 disabled:opacity-50 transition-all border-b-4 ${isTet ? 'bg-red-700 border-red-900 shadow-red-200' : 'bg-indigo-700 border-indigo-950 shadow-indigo-200'}`}>
                                        {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin mx-auto"/> : (editingRequestId ? 'CẬP NHẬT DỮ LIỆU' : 'XÁC NHẬN ĐĂNG KÝ')}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        )}

        {/* CONFIRMATION MODAL */}
        {isConfirmCancelOpen && (
            <div className="fixed inset-0 bg-black/95 z-[120] flex items-center justify-center p-6 backdrop-blur-2xl animate-fade-in">
                <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden animate-zoom-in p-10 text-center border-2 border-gray-100">
                    <div className="w-20 h-20 bg-rose-700 text-white mx-auto mb-6 rounded-[1.5rem] flex items-center justify-center shadow-2xl rotate-12 transition-transform hover:rotate-0"><Trash2 className="w-10 h-10" /></div>
                    <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase italic leading-none">Hủy bỏ?</h3>
                    <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest mb-10 px-2 leading-relaxed">Dữ liệu đăng ký sẽ bị xóa vĩnh viễn khỏi hệ thống.</p>
                    <div className="flex flex-col gap-3">
                        <button onClick={handleCancelRequest} disabled={isDeleting} className="w-full py-5 bg-rose-700 text-white font-black rounded-xl text-[11px] uppercase tracking-[0.2em] shadow-2xl active:scale-95">XÓA DỮ LIỆU</button>
                        <button onClick={() => setIsConfirmCancelOpen(false)} className="w-full py-5 bg-gray-100 text-gray-700 font-black rounded-xl border-2 border-gray-200 text-[11px] uppercase tracking-[0.2em] active:scale-95">HỦY BỎ</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
