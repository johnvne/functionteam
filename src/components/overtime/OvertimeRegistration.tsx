
import React, { useState, useEffect, useMemo } from 'react';
import { User, OvertimeRequest, DayConfig, Employee } from '../../../types';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/Card';
import * as XLSX from 'xlsx';
import { 
  Clock, Calendar as CalendarIcon, X, 
  Timer, Loader2, ChevronLeft, ChevronRight, ChevronDown, Download, BarChart3, Users, User as UserIcon, Settings, Check, Trash2, 
  Activity, Home, Briefcase, FileText, CalendarRange, UserCheck, Search, Filter,
  FileSpreadsheet, FileDown, CalendarDays, Eye, Trophy, Target, Award, Info, Undo2, ArrowRight, Snowflake, Sparkles, UserPlus, UserRoundPen, ChevronUp
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
  const [isListHidden, setIsListHidden] = useState(false); 
  
  const [selectedDateStr, setSelectedDateStr] = useState('');
  const [targetUserId, setTargetUserId] = useState(user.id);
  const [startTime, setStartTime] = useState('17:30');
  const [endTime, setEndTime] = useState('20:00');
  const [reason, setReason] = useState('');
  
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);

  const [exportStartDate, setExportStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [exportEndDate, setExportEndDate] = useState(new Date().toISOString().split('T')[0]);

  const isAdmin = user.role === 'admin';
  const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  const month = new Date().getMonth();
  const isNoel = month === 11;
  const isTet = month === 0 || month === 1;

  useEffect(() => {
    fetchRequests();
    fetchDayConfigs();
    if (isAdmin) fetchEmployees();
  }, [user.id, currentDate]);

  const currentSelectedRequest = useMemo(() => {
    if (!selectedDateStr || !targetUserId) return null;
    return requests.find(r => r.date === selectedDateStr && r.user_id === targetUserId) || null;
  }, [requests, selectedDateStr, targetUserId]);

  const isViewOnly = !isAdmin && targetUserId !== user.id;

  useEffect(() => {
    if (!selectedDateStr) return;
    
    if (currentSelectedRequest) {
        setStartTime(currentSelectedRequest.start_time);
        setEndTime(currentSelectedRequest.end_time);
        setReason(currentSelectedRequest.reason || '');
        setEditingRequestId(currentSelectedRequest.id);
    } else {
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
  }, [selectedDateStr, dayConfigs, currentSelectedRequest, targetUserId]);

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

  const handleExportExcelPro = (mode: 'today' | 'range') => {
    let filtered = [];
    const department = "Automation";

    if (mode === 'today') {
        filtered = requests.filter(r => r.date === todayStr);
    } else {
        filtered = requests.filter(r => r.date >= exportStartDate && r.date <= exportEndDate);
    }

    if (filtered.length === 0) return alert("Không tìm thấy dữ liệu đăng ký.");

    const workbook = XLSX.utils.book_new();
    const groupedByDate = filtered.reduce((acc, req) => {
        if (!acc[req.date]) acc[req.date] = [];
        acc[req.date].push(req);
        return acc;
    }, {} as Record<string, OvertimeRequest[]>);

    Object.keys(groupedByDate).sort().forEach((dateKey) => {
        const dayRequests = groupedByDate[dateKey];
        const displayDate = dateKey.split('-').reverse().join('/');
        const ws_data = [
            ["ĐĂNG KÝ LÀM THÊM TỰ NGUYỆN HÀNG NGÀY / APPLICATION FOR DAILY OVERTIME VOLUNTARY"],
            [],
            [`Bộ phận: ${department}`, ``, ``, ``, ``, ``, ``, `Ngày: ${displayDate}`],
            [`Tổng số người OT: ${dayRequests.length}`],
            [],
            ["STT", "Mã NV", "Họ tên", "Bắt đầu", "Kết thúc", "OT 150%", "OT 200%", "Lý do", "Ký tên", "Ghi chú"]
        ];

        dayRequests.forEach((req, idx) => {
            const date = new Date(req.date);
            const isWorking = dayConfigs[req.date] ?? (date.getDay() !== 0 && date.getDay() !== 6);
            ws_data.push([
                idx + 1, req.users?.employee_id || "", req.users?.name || "", req.start_time, req.end_time,
                isWorking ? req.total_hours : "", !isWorking ? req.total_hours : "", req.reason || "", "", ""
            ]);
        });

        const worksheet = XLSX.utils.aoa_to_sheet(ws_data);
        XLSX.utils.book_append_sheet(workbook, worksheet, dateKey.replace(/-/g, ''));
    });

    XLSX.writeFile(workbook, `OT_Registration_${mode}.xlsx`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (calculatedHours <= 0) return alert("Giờ làm không hợp lệ.");
    setIsSubmitting(true);
    const payload = {
        user_id: targetUserId, 
        date: selectedDateStr, 
        start_time: startTime,
        end_time: endTime, 
        total_hours: calculatedHours, 
        reason, 
        status: 'approved' 
    };
    try {
      const res = editingRequestId 
        ? await supabase.from('ot_requests').update(payload).eq('id', editingRequestId)
        : await supabase.from('ot_requests').insert([payload]);
      if (res.error) throw res.error;
      await fetchRequests();
      if (!isAdmin) setIsModalOpen(false);
      else alert("Đã lưu đăng ký thành công!");
    } catch (err: any) {
        alert(err.message);
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
    } catch (err: any) {
        alert(err.message);
    } finally {
        setIsDeleting(false);
    }
  };

  const handleDateClick = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    setTargetUserId(user.id);
    setIsModalOpen(true);
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
  }, [requests, user.id, currentMonthStr]);

  const teamMonthlyStats = useMemo(() => {
    const monthlyApproved = requests.filter(r => r.date.startsWith(currentMonthStr) && r.status === 'approved');
    const totalHours = monthlyApproved.reduce((sum, r) => sum + Number(r.total_hours || 0), 0);
    const activeMembers = new Set(monthlyApproved.map(r => r.user_id)).size;
    return { totalHours, activeMembers };
  }, [requests, currentMonthStr]);

  const topRankings = useMemo(() => {
    const employeeMap: Record<string, { name: string; hours: number; employee_id: string; count: number }> = {};
    const monthlyApproved = requests.filter(r => r.date.startsWith(currentMonthStr) && r.status === 'approved');
    monthlyApproved.forEach(req => {
        const id = req.user_id;
        if (!employeeMap[id]) employeeMap[id] = { name: req.users?.name || 'Ẩn danh', hours: 0, employee_id: req.users?.employee_id || 'N/A', count: 0 };
        employeeMap[id].hours += Number(req.total_hours || 0);
        employeeMap[id].count += 1;
    });
    return Object.values(employeeMap).sort((a, b) => b.hours - a.hours).slice(0, 10);
  }, [requests, currentMonthStr]);

  const todayRegistrations = useMemo(() => {
    return requests.filter(r => r.date === todayStr).sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [requests]);

  const renderCalendarDays = () => {
    const days = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = getFirstDayOfMonth(year, month);
    const startOffset = firstDay === 0 ? 6 : firstDay - 1; 
    const totalDays = getDaysInMonth(year, month);

    for (let i = 0; i < startOffset; i++) {
        days.push(<div key={`empty-${i}`} className="h-14 md:h-32 bg-gray-50/50 border border-gray-100/50 opacity-40"></div>);
    }

    for (let d = 1; d <= totalDays; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayRequestsLocal = requests.filter(r => r.date === dateStr);
        const myRequest = dayRequestsLocal.find(r => r.user_id === user.id);
        const otherRequests = dayRequestsLocal.filter(r => r.user_id !== user.id);
        const isToday = todayStr === dateStr;
        const isPast = dateStr < todayStr;
        const dateObj = new Date(year, month, d);
        const dayOfWeek = dateObj.getDay(); 
        const defaultIsWorking = dayOfWeek !== 0 && dayOfWeek !== 6;
        const isActuallyWorking = dayConfigs[dateStr] ?? defaultIsWorking;
        
        days.push(
            <div 
                key={d} 
                onClick={() => handleDateClick(dateStr)}
                className={`h-14 md:h-32 border border-gray-100 p-0.5 md:p-2 relative transition-all active:bg-blue-100 lg:hover:bg-blue-50 cursor-pointer group flex flex-col 
                  ${isToday ? 'bg-blue-50 ring-inset ring-1 md:ring-2 ring-blue-500/30 z-10' : 'bg-white'} 
                  ${isPast ? 'opacity-40 grayscale-[0.2]' : 'opacity-100'}`}
            >
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-1 md:gap-1.5 flex-wrap">
                        <span className={`text-[9px] md:text-base font-black ${isToday ? 'bg-blue-600 text-white w-3.5 h-3.5 md:w-6 md:h-6 rounded-md md:rounded-lg flex items-center justify-center shadow-lg' : 'text-gray-700'}`}>
                            {d}
                        </span>
                        
                        {(!isActuallyWorking || (isActuallyWorking && (dayOfWeek === 0 || dayOfWeek === 6))) && (
                            <span className={`text-[6px] md:text-[9px] font-black px-1 py-0.2 md:px-1.5 md:py-0.5 rounded uppercase tracking-tighter shadow-sm border ${isActuallyWorking ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                {isActuallyWorking ? 'LÀM' : 'NGHỈ'}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex-1 flex flex-col justify-start gap-0.5 mt-0.5 overflow-hidden">
                    {myRequest && <div className="w-1.5 h-1.5 md:w-6 md:h-6 rounded-full md:rounded-lg bg-emerald-500 flex items-center justify-center shrink-0 shadow-sm"><UserIcon className="hidden md:block w-3 h-3 text-white" /></div>}
                    <div className="flex -space-x-1 md:-space-x-2 overflow-hidden">
                        {otherRequests.slice(0, 3).map((req, idx) => (
                            <div key={idx} className="w-1.5 h-1.5 md:w-5 md:h-5 rounded-full bg-indigo-100 border border-white flex items-center justify-center shrink-0 shadow-sm">
                                <span className="hidden md:block text-[7px] font-bold text-indigo-600 uppercase">{req.users?.name?.charAt(0)}</span>
                            </div>
                        ))}
                    </div>
                </div>
                {dayRequestsLocal.length > 0 && (
                    <div className="absolute bottom-0.5 right-0.5 bg-gray-100 text-gray-500 text-[5px] md:text-[8px] px-1 md:px-1.5 py-0.2 md:py-0.5 rounded md:rounded-lg font-black border border-gray-200">
                        {dayRequestsLocal.length}
                    </div>
                )}
            </div>
        );
    }
    return days;
  };

  const dayRequestsInModal = useMemo(() => {
    return requests.filter(r => r.date === selectedDateStr);
  }, [requests, selectedDateStr]);

  const displayedDayRequests = useMemo(() => {
    if (isListExpanded) return dayRequestsInModal;
    return dayRequestsInModal.slice(0, 4); 
  }, [dayRequestsInModal, isListExpanded]);

  return (
    <div className="space-y-3 md:space-y-6 h-full flex flex-col animate-fade-in max-w-7xl mx-auto px-1 md:px-0 pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 md:p-6 rounded-[1.2rem] md:rounded-[2rem] shadow-sm border border-gray-100 transition-all">
            <div>
                <div className="flex items-center gap-2">
                    <h2 className="text-base md:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                      Quản lý Tăng ca 
                      {isNoel && <Snowflake className="w-5 h-5 text-blue-300 animate-spin-slow" />}
                      {isTet && <Sparkles className="w-5 h-5 text-yellow-400" />}
                    </h2>
                    <span className="text-[7px] md:text-[10px] font-black bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full uppercase tracking-widest">MẪU PRO 2024</span>
                </div>
                <p className="text-[8px] md:text-sm text-gray-500 font-medium italic">Hệ thống ghi nhận công tác chuyên nghiệp</p>
            </div>
            <div className="flex bg-gray-100/80 p-0.5 rounded-xl md:rounded-2xl border border-gray-200 w-full md:w-auto">
                {['calendar', 'personal', 'stats'].map(t => (
                    <button key={t} onClick={() => setActiveTab(t as any)} className={`flex-1 md:flex-none px-4 md:px-8 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[9px] md:text-sm font-black transition-all ${activeTab === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                        {t === 'calendar' ? 'Lịch' : t === 'personal' ? 'Cá nhân' : 'Thống kê'}
                    </button>
                ))}
            </div>
        </div>

        <div className="flex-1">
            {activeTab === 'calendar' && (
                <Card className="h-full flex flex-col p-0 overflow-hidden border border-gray-100 shadow-lg rounded-[1.2rem] md:rounded-[2.5rem] bg-white">
                    <div className="flex items-center justify-between p-3 md:p-6 bg-white border-b border-gray-100">
                        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth()-1, 1))} className="p-2 hover:bg-gray-100 rounded-xl transition-all"><ChevronLeft className="w-5 h-5"/></button>
                        <h3 className="text-sm md:text-lg font-black uppercase tracking-widest text-gray-800">Tháng {currentDate.getMonth()+1} / {currentDate.getFullYear()}</h3>
                        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth()+1, 1))} className="p-2 hover:bg-gray-100 rounded-xl transition-all"><ChevronRight className="w-5 h-5"/></button>
                    </div>
                    <div className="grid grid-cols-7 bg-gray-50 text-[7px] md:text-[10px] font-black uppercase text-gray-400 border-b border-gray-100">
                        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d, i) => <div key={d} className={`py-2 md:py-4 text-center ${i >= 5 ? 'text-rose-400' : ''}`}>{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-gray-100 gap-[0.5px]">
                        {renderCalendarDays()}
                    </div>
                </Card>
            )}

            {activeTab === 'personal' && (
                <div className="space-y-4 md:space-y-6 animate-fade-in-up">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Card className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white border-none shadow-lg rounded-[1.2rem] p-4 md:p-6">
                            <h3 className="text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-80">Tổng giờ T{currentDate.getMonth()+1}</h3>
                            <div className="flex items-end gap-1"><span className="text-2xl md:text-5xl font-black">{myStats.total.toFixed(1)}</span><span className="text-[10px] md:text-lg font-bold opacity-70">h</span></div>
                        </Card>
                        <Card className="bg-white border-l-4 border-emerald-500 rounded-[1.2rem] p-4 shadow-sm flex items-center gap-3">
                            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600"><Check className="w-5 h-5"/></div>
                            <div><p className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase">Đăng ký</p><p className="text-lg md:text-2xl font-black text-gray-900">{myStats.count} d</p></div>
                        </Card>
                         <Card className="bg-white border-l-4 border-amber-500 rounded-[1.2rem] p-4 shadow-sm flex items-center gap-3">
                            <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600"><Timer className="w-5 h-5"/></div>
                            <div><p className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase">Chờ duyệt</p><p className="text-lg md:text-2xl font-black text-gray-900">{myStats.pending}</p></div>
                        </Card>
                        <Card className="bg-white border-l-4 border-indigo-500 rounded-[1.2rem] p-4 shadow-sm flex items-center gap-3">
                            <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600"><Activity className="w-5 h-5"/></div>
                            <div><p className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase">Trung bình</p><p className="text-lg md:text-2xl font-black text-gray-900">{(myStats.total / (myStats.count || 1)).toFixed(1)}h</p></div>
                        </Card>
                    </div>

                    <Card className="rounded-[1.5rem] md:rounded-[2.5rem] p-5 md:p-8 shadow-md border-none bg-white">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                            <div>
                                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Biểu đồ xu hướng</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Lịch sử đăng ký OT của bạn</p>
                            </div>
                        </div>
                        <div className="h-48 md:h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={myStats.trend} margin={{ top: 0, right: 0, left: -35, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 8, fontWeight: 'bold', fill: '#94a3b8'}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 8, fontWeight: 'bold', fill: '#94a3b8'}} />
                                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{fontSize: '10px', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                                    <Bar dataKey="hours" fill="#4f46e5" radius={[2, 2, 0, 0]} barSize={8} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>
            )}

            {activeTab === 'stats' && (
                <div className="space-y-6 animate-fade-in-up">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-white border-none p-6 flex items-center gap-4 shadow-sm rounded-[1.5rem]">
                            <div className="p-4 bg-indigo-100 text-indigo-600 rounded-2xl"><Users className="w-6 h-6"/></div>
                            <div><p className="text-[10px] font-black text-gray-400 uppercase">Nhân sự OT</p><p className="text-3xl font-black text-gray-900">{teamMonthlyStats.activeMembers}</p></div>
                        </Card>
                        <Card className="bg-white border-none p-6 flex items-center gap-4 shadow-sm rounded-[1.5rem]">
                            <div className="p-4 bg-emerald-100 text-emerald-600 rounded-2xl"><Timer className="w-6 h-6"/></div>
                            <div><p className="text-[10px] font-black text-gray-400 uppercase">Tổng giờ tháng</p><p className="text-3xl font-black text-gray-900">{teamMonthlyStats.totalHours.toFixed(1)}h</p></div>
                        </Card>
                        <Card className="bg-indigo-600 text-white border-none p-6 flex items-center gap-4 shadow-lg rounded-[1.5rem]">
                            <div className="p-4 bg-white/20 rounded-2xl"><Target className="w-6 h-6"/></div>
                            <div><p className="text-[10px] font-black text-white/70 uppercase">Hôm nay</p><p className="text-3xl font-black">{todayRegistrations.length}</p></div>
                        </Card>
                    </div>

                    {/* KHU VỰC XUẤT EXCEL VÀ THỐNG KÊ CHI TIẾT */}
                    <Card className="rounded-[2rem] p-8 md:p-10 shadow-xl border-none bg-white">
                        {isAdmin && (
                            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 mb-10 border-b border-gray-100 pb-10">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-emerald-100 text-emerald-600 rounded-3xl shadow-lg shadow-emerald-50"><FileSpreadsheet className="w-8 h-8"/></div>
                                    <div>
                                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Xuất biểu mẫu nhân sự (Admin)</h3>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 italic">Mẫu "Daily Overtime Voluntary" chuẩn quy định</p>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
                                    <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-2xl w-full sm:w-auto">
                                    <input type="date" value={exportStartDate} onChange={(e) => setExportStartDate(e.target.value)} className="bg-transparent text-[11px] font-black outline-none focus:text-indigo-600 transition-all uppercase"/>
                                    <span className="text-gray-300 font-black">→</span>
                                    <input type="date" value={exportEndDate} onChange={(e) => setExportEndDate(e.target.value)} className="bg-transparent text-[11px] font-black outline-none focus:text-indigo-600 transition-all uppercase"/>
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button onClick={() => handleExportExcelPro('range')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-4 bg-indigo-700 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-indigo-100 active:scale-95 transition-all border-b-4 border-indigo-900"><FileDown className="w-4 h-4"/> Xuất khoảng ngày</button>
                                        <button onClick={() => handleExportExcelPro('today')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-emerald-100 active:scale-95 transition-all border-b-4 border-emerald-800"><CalendarDays className="w-4 h-4"/> Hôm nay</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* DANH SÁCH HÔM NAY */}
                            <Card className="rounded-[1.5rem] p-0 flex flex-col overflow-hidden bg-gray-50/50 border-none shadow-sm">
                                <div className="p-6 bg-white border-b border-gray-100 flex justify-between items-center shadow-sm">
                                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2"><Clock className="w-4 h-4 text-indigo-600" /> Đăng ký hôm nay</h4>
                                    <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full uppercase tabular-nums">{todayRegistrations.length}</span>
                                </div>
                                <div className="p-4 space-y-3 overflow-y-auto max-h-[350px] no-scrollbar">
                                    {todayRegistrations.length === 0 ? (
                                        <div className="h-40 flex flex-col items-center justify-center text-gray-300 italic text-[11px] gap-2">
                                            <Info className="w-5 h-5"/> Chưa có đăng ký nào
                                        </div>
                                    ) : (
                                        todayRegistrations.map((req, idx) => (
                                            <div key={idx} className="p-4 rounded-2xl bg-white border-2 border-transparent flex items-center gap-4 transition-all hover:border-indigo-100 hover:shadow-lg group">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm uppercase group-hover:rotate-6 transition-transform">{req.users?.name?.charAt(0)}</div>
                                                <div className="flex-1 min-w-0">
                                                    <h5 className="font-black text-gray-900 text-sm truncate uppercase tracking-tight italic">{req.users?.name}</h5>
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{req.users?.employee_id}</p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[10px] font-black text-indigo-600 mb-0.5">{req.start_time}-{req.end_time}</div>
                                                    <span className="text-sm font-black text-gray-900 tabular-nums">{req.total_hours.toFixed(1)}h</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </Card>

                            {/* BẢNG VÀNG CỐNG HIẾN (TOP 5) */}
                            <Card className="rounded-[1.5rem] p-0 flex flex-col bg-gray-50/50 overflow-hidden border-none shadow-sm">
                                 <div className="p-6 bg-indigo-700 text-white flex justify-between items-center shadow-lg">
                                     <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><Award className="w-5 h-5 text-amber-400" /> Bảng vàng cống hiến</h4>
                                     <p className="text-[9px] font-bold opacity-60 uppercase">Tháng {currentDate.getMonth()+1}</p>
                                 </div>
                                 <div className="p-4 space-y-3 overflow-y-auto max-h-[350px] no-scrollbar">
                                    {topRankings.slice(0, 5).map((emp, idx) => (
                                        <div key={idx} className={`p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${idx === 0 ? 'bg-amber-50/50 border-amber-100' : 'bg-white border-transparent hover:border-indigo-100 hover:shadow-lg'}`}>
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${idx === 0 ? 'bg-amber-500 text-white' : idx === 1 ? 'bg-slate-300 text-white' : idx === 2 ? 'bg-orange-300 text-white' : 'bg-gray-100 text-gray-400'}`}>{idx + 1}</div>
                                            <div className="flex-1 min-w-0">
                                                <h5 className="font-black text-gray-900 text-sm truncate uppercase tracking-tight">{emp.name}</h5>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase">{emp.count} ngày OT</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xl font-black text-indigo-600 tabular-nums">{emp.hours.toFixed(1)}</span>
                                                <span className="text-[10px] font-bold text-gray-400 ml-1 uppercase">h</span>
                                            </div>
                                        </div>
                                    ))}
                                 </div>
                            </Card>
                        </div>
                    </Card>
                </div>
            )}
        </div>

        {/* POPUP ĐĂNG KÝ: TỐI ƯU NHỎ GỌN HƠN */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-black/80 z-[100] flex items-end md:items-center justify-center backdrop-blur-md animate-fade-in px-0 md:px-4">
                <div className="bg-white rounded-t-[1.8rem] md:rounded-[2rem] shadow-2xl w-full max-w-lg animate-slide-up md:animate-zoom-in overflow-hidden max-h-[92vh] flex flex-col border border-white/10">
                    <div className="bg-indigo-600 p-4 md:p-6 flex justify-between items-center text-white shrink-0 shadow-lg">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <CalendarDays className="w-5 h-5 text-indigo-200" />
                              <h3 className="text-base md:text-lg font-black uppercase tracking-tighter italic">{selectedDateStr.split('-').reverse().join('/')}</h3>
                            </div>
                            <p className="text-[8px] md:text-[9px] text-indigo-200 font-bold uppercase tracking-widest mt-0.5">Chi tiết đăng ký</p>
                        </div>
                        <button onClick={() => setIsModalOpen(false)} className="p-2 md:p-2.5 hover:bg-white/20 rounded-xl transition-all active:scale-90"><X className="w-5 h-5 md:w-6 md:h-6"/></button>
                    </div>
                    
                    <div className="p-4 md:p-6 space-y-4 md:space-y-6 overflow-y-auto no-scrollbar pb-10 bg-gray-50/30 flex-1">
                        {isAdmin && (
                            <div className="space-y-4 md:space-y-6">
                                <div className="bg-white p-3 md:p-4 rounded-2xl border border-indigo-50 shadow-sm space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Settings className="w-3.5 h-3.5 text-indigo-600" />
                                        <h4 className="text-[9px] md:text-[10px] font-black text-indigo-900 uppercase tracking-widest">Loại ngày</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={() => updateDayWorkingStatus(false)} className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-all font-black text-[8px] md:text-[9px] uppercase tracking-widest ${ (dayConfigs[selectedDateStr] === false || (dayConfigs[selectedDateStr] === undefined && (new Date(selectedDateStr).getDay() === 0 || new Date(selectedDateStr).getDay() === 6))) ? 'bg-rose-500 text-white border-rose-400 shadow-sm' : 'bg-white text-gray-400 border-gray-100' }`}>
                                            <Home className="w-3.5 h-3.5" /> Nghỉ
                                        </button>
                                        <button onClick={() => updateDayWorkingStatus(true)} className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-all font-black text-[8px] md:text-[9px] uppercase tracking-widest ${ (dayConfigs[selectedDateStr] === true || (dayConfigs[selectedDateStr] === undefined && new Date(selectedDateStr).getDay() !== 0 && new Date(selectedDateStr).getDay() !== 6)) ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm' : 'bg-white text-gray-400 border-gray-100' }`}>
                                            <Briefcase className="w-3.5 h-3.5" /> Làm
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between px-1">
                                        <div className="flex items-center gap-1.5">
                                            <Users className="w-3.5 h-3.5 text-indigo-600" />
                                            <h4 className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Đã đăng ký ({dayRequestsInModal.length})</h4>
                                        </div>
                                        <div className="flex gap-2">
                                          <button onClick={() => setIsListHidden(!isListHidden)} className="text-[8px] font-black text-gray-400 bg-white border border-gray-100 px-2 py-1 rounded-lg uppercase transition-all shadow-sm">
                                            {isListHidden ? 'Hiện' : 'Ẩn'}
                                          </button>
                                          <button onClick={() => {setTargetUserId(user.id); setEditingRequestId(null);}} className="text-[8px] font-black text-indigo-600 bg-white border border-indigo-100 px-2 py-1 rounded-lg uppercase transition-all shadow-sm">
                                            <UserPlus className="w-3 h-3 inline mr-1" /> Mới
                                          </button>
                                        </div>
                                    </div>
                                    
                                    {!isListHidden && (
                                        <div className="relative animate-fade-in">
                                          <div className={`grid grid-cols-2 gap-2 transition-all overflow-hidden ${isListExpanded ? 'max-h-64' : 'max-h-24'}`}>
                                              {dayRequestsInModal.length === 0 ? (
                                                  <div className="col-span-full py-4 text-center text-[9px] font-bold text-gray-300 italic border border-dashed border-gray-100 rounded-xl">Trống</div>
                                              ) : (
                                                  displayedDayRequests.map((req) => (
                                                      <button key={req.id} onClick={() => setTargetUserId(req.user_id)} className={`px-2.5 py-2 rounded-xl border flex items-center gap-2 transition-all text-left ${targetUserId === req.user_id ? 'bg-indigo-600 border-indigo-600 shadow-md text-white' : 'bg-white border-transparent shadow-sm text-gray-700'}`}>
                                                          <div className={`w-5 h-5 rounded-lg flex items-center justify-center font-black text-[8px] uppercase shrink-0 ${targetUserId === req.user_id ? 'bg-white text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>{req.users?.name?.charAt(0)}</div>
                                                          <span className="text-[9px] font-black truncate uppercase">{req.users?.name}</span>
                                                      </button>
                                                  ))
                                              )}
                                          </div>
                                          {dayRequestsInModal.length > 4 && (
                                            <button onClick={() => setIsListExpanded(!isListExpanded)} className="w-full mt-2 text-[8px] font-black text-indigo-400 uppercase tracking-widest flex items-center justify-center gap-1">
                                                {isListExpanded ? <>Thu gọn <ChevronUp className="w-3 h-3"/></> : <>Xem tất cả <ChevronDown className="w-3 h-3"/></>}
                                            </button>
                                          )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                            {isViewOnly ? (
                                <div className="bg-white border border-indigo-50 p-6 rounded-2xl text-center space-y-3 shadow-md">
                                    <Eye className="w-8 h-8 text-indigo-200 mx-auto" />
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic leading-relaxed">Đang xem đơn của {allEmployees.find(e => e.id === targetUserId)?.name}</p>
                                    <button type="button" onClick={() => {setTargetUserId(user.id); setEditingRequestId(null);}} className="w-full py-3 bg-indigo-600 text-white text-[9px] font-black uppercase rounded-xl tracking-widest shadow-lg">TẠO ĐĂNG KÝ CỦA TÔI</button>
                                </div>
                            ) : (
                                <div className="bg-white p-4 md:p-5 rounded-2xl border border-indigo-50 shadow-sm space-y-4 relative">
                                    {isAdmin && (
                                        <div className="space-y-1.5">
                                            <label className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Nhân sự thực hiện:</label>
                                            <select required value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[10px] md:text-xs font-black outline-none focus:border-indigo-500 appearance-none cursor-pointer uppercase">
                                                {allEmployees.map(emp => (<option key={emp.id} value={emp.id}>{emp.name}</option>))}
                                            </select>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <label className="block text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Bắt đầu:</label>
                                            <input type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs md:text-sm font-black text-gray-900 outline-none focus:border-indigo-500 shadow-inner"/>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Kết thúc:</label>
                                            <input type="time" required value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs md:text-sm font-black text-gray-900 outline-none focus:border-indigo-500 shadow-inner"/>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest">Lý do / Công việc</label>
                                            <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100 tabular-nums">{calculatedHours.toFixed(1)}h OT</span>
                                        </div>
                                        <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-[10px] md:text-xs h-20 md:h-24 resize-none outline-none font-bold text-gray-800 shadow-inner focus:border-indigo-500 transition-all" placeholder="Ghi chú công việc..."/>
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        {(editingRequestId && (isAdmin || targetUserId === user.id)) && (
                                            <button type="button" onClick={() => setIsConfirmCancelOpen(true)} className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 hover:bg-rose-600 hover:text-white transition-all shadow-sm"><Trash2 className="w-4 h-4"/></button>
                                        )}
                                        <button type="submit" disabled={isSubmitting || calculatedHours <= 0} className="flex-1 py-3 bg-indigo-600 text-white font-black rounded-xl shadow-lg text-[9px] md:text-[10px] tracking-widest uppercase transition-all active:scale-95 disabled:opacity-50">
                                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto"/> : editingRequestId ? 'CẬP NHẬT' : 'XÁC NHẬN'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        )}

        {isConfirmCancelOpen && (
            <div className="fixed inset-0 bg-black/90 z-[120] flex items-center justify-center p-6 backdrop-blur-xl animate-fade-in">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden animate-zoom-in p-6 text-center border border-white/20">
                    <Trash2 className="w-10 h-10 text-rose-500 mx-auto mb-4" />
                    <h3 className="text-base font-black text-gray-900 mb-1 uppercase">HỦY ĐĂNG KÝ?</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-6">Hành động này không thể hoàn tác.</p>
                    <div className="flex flex-col gap-2">
                        <button onClick={handleCancelRequest} disabled={isDeleting} className="w-full py-3 bg-rose-600 text-white font-black rounded-xl text-[10px] uppercase shadow-lg shadow-rose-200">XÓA VĨNH VIỄN</button>
                        <button onClick={() => setIsConfirmCancelOpen(false)} className="w-full py-3 bg-white text-gray-400 font-black rounded-xl border border-gray-100 text-[10px] uppercase">QUAY LẠI</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
