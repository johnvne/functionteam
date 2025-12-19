
import React, { useState, useEffect, useMemo } from 'react';
import { User, OvertimeRequest, DayConfig, Employee } from '../../../types';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/Card';
import { rewriteOvertimeReason } from '../../services/geminiService';
import * as XLSX from 'xlsx';
import { 
  Clock, Calendar as CalendarIcon, X, 
  Timer, Loader2, ChevronLeft, ChevronRight, Wand2, Download, BarChart3, Users, User as UserIcon, Settings, Check, Trash2, 
  TrendingUp, Activity, Zap, ChevronDown, ChevronUp, Home, Briefcase, FileText, CalendarRange, UserCheck, Search, Filter,
  FileSpreadsheet, FileDown, CalendarDays, Eye, Trophy, Target, Award, Info, Undo2, ArrowRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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
  const [showColleagueDetails, setShowColleagueDetails] = useState(false);
  const [isConfirmCancelOpen, setIsConfirmCancelOpen] = useState(false); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfigUpdating, setIsConfigUpdating] = useState(false);
  
  const [selectedDateStr, setSelectedDateStr] = useState('');
  const [targetUserId, setTargetUserId] = useState(user.id);
  const [startTime, setStartTime] = useState('17:30');
  const [endTime, setEndTime] = useState('20:00');
  const [reason, setReason] = useState('');
  
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);

  // Mặc định khoảng ngày xuất là từ đầu tháng đến hiện tại
  const [exportStartDate, setExportStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [exportEndDate, setExportEndDate] = useState(new Date().toISOString().split('T')[0]);

  const isAdmin = user.role === 'admin';
  const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  const dayRequests = useMemo(() => {
    return requests.filter(r => r.date === selectedDateStr);
  }, [requests, selectedDateStr]);

  const currentSelectedRequest = useMemo(() => {
    if (!selectedDateStr || !targetUserId) return null;
    return requests.find(r => r.date === selectedDateStr && r.user_id === targetUserId) || null;
  }, [requests, selectedDateStr, targetUserId]);

  const isViewOnly = !isAdmin && targetUserId !== user.id;

  useEffect(() => {
    fetchRequests();
    fetchDayConfigs();
    if (isAdmin) fetchEmployees();
  }, [user.id, currentDate]);

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
            if (dayOfWeek === 6) {
                setStartTime('14:30');
            } else {
                setStartTime('17:30');
            }
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
    const e = Math.min(timeToNumber(end), 20.0);
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

  const handleExportExcel = (mode: 'personal' | 'all' = 'personal', specificRange?: { start: string, end: string }) => {
    const start = specificRange ? specificRange.start : exportStartDate;
    const end = specificRange ? specificRange.end : exportEndDate;

    if (!start || !end) return alert("Vui lòng chọn đầy đủ khoảng thời gian.");

    let filtered = requests.filter(r => r.date >= start && r.date <= end);
    if (mode === 'personal') filtered = filtered.filter(r => r.user_id === user.id);
    
    if (filtered.length === 0) return alert("Không tìm thấy dữ liệu đăng ký trong khoảng thời gian này.");

    filtered.sort((a, b) => a.date.localeCompare(b.date));
    const workbook = XLSX.utils.book_new();
    const dayNames = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

    const summaryData = filtered.map(req => {
        const d = new Date(req.date);
        return {
            'Ngày': req.date,
            'Thứ': dayNames[d.getDay()],
            'Họ và tên': req.users?.name || 'Ẩn danh',
            'Mã nhân viên': req.users?.employee_id || 'N/A',
            'Bắt đầu': req.start_time,
            'Kết thúc': req.end_time,
            'Tổng giờ': req.total_hours,
            'Nội dung công việc': req.reason
        };
    });
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'TỔNG HỢP');

    const groupedByDate: Record<string, OvertimeRequest[]> = {};
    filtered.forEach(req => {
        if (!groupedByDate[req.date]) groupedByDate[req.date] = [];
        groupedByDate[req.date].push(req);
    });

    Object.keys(groupedByDate).forEach(dateKey => {
        const dayReqs = groupedByDate[dateKey];
        const dateObj = new Date(dateKey);
        const dayLabel = dayNames[dateObj.getDay()];
        const sheetData = dayReqs.map(req => ({
            'Họ và tên': req.users?.name || 'Ẩn danh',
            'Mã nhân viên': req.users?.employee_id || 'N/A',
            'Bắt đầu': req.start_time,
            'Kết thúc': req.end_time,
            'Tổng giờ': req.total_hours,
            'Nội dung công việc': req.reason
        }));
        const worksheet = XLSX.utils.json_to_sheet(sheetData);
        const tabName = dateKey.split('-').reverse().slice(0, 2).join('-');
        XLSX.utils.book_append_sheet(workbook, worksheet, `${tabName} (${dayLabel})`);
    });

    const fileNameDate = start === end ? `Ngay_${start}` : `${start}_den_${end}`;
    XLSX.writeFile(workbook, `Bao_cao_OT_${mode === 'personal' ? 'Ca_nhan' : 'Toan_bo'}_${fileNameDate}.xlsx`);
  };

  const handleExportToday = (mode: 'personal' | 'all' = 'personal') => {
      const today = new Date().toISOString().split('T')[0];
      handleExportExcel(mode, { start: today, end: today });
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
      setIsModalOpen(false);
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
        setIsModalOpen(false);
    } catch (err: any) {
        alert(err.message);
    } finally {
        setIsDeleting(false);
    }
  };

  const handleDateClick = (dateStr: string, dateObj: Date) => {
    setSelectedDateStr(dateStr);
    setTargetUserId(user.id);
    setShowColleagueDetails(false);
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
    const trend = Array.from({length: getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth())}, (_, i) => {
        const d = i + 1;
        const dStr = `${currentMonthStr}-${String(d).padStart(2, '0')}`;
        const dayHours = monthlyApproved.filter(r => r.date === dStr).reduce((sum, r) => sum + Number(r.total_hours || 0), 0);
        return { day: d, hours: dayHours };
    });
    const totalHours = monthlyApproved.reduce((sum, r) => sum + Number(r.total_hours || 0), 0);
    const activeMembers = new Set(monthlyApproved.map(r => r.user_id)).size;
    return { trend, totalHours, activeMembers };
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
        const dateObj = new Date(year, month, d);
        
        const dayOfWeek = dateObj.getDay();
        const defaultIsWorking = dayOfWeek !== 0 && dayOfWeek !== 6;
        const configWork = dayConfigs[dateStr];
        const isActuallyWorking = configWork ?? defaultIsWorking;
        
        const isWeekendDefault = dayOfWeek === 0 || dayOfWeek === 6;

        const shouldShowBadge = !isActuallyWorking || (isActuallyWorking && isWeekendDefault);

        days.push(
            <div 
                key={d} 
                onClick={() => handleDateClick(dateStr, dateObj)}
                className={`h-14 md:h-32 border border-gray-100 p-0.5 md:p-2 relative transition-all active:bg-blue-100 lg:hover:bg-blue-50 cursor-pointer group flex flex-col ${isToday ? 'bg-blue-50 ring-inset ring-1 md:ring-2 ring-blue-500/30' : 'bg-white'}`}
            >
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-0.5 md:gap-1.5">
                        <span className={`text-[9px] md:text-base font-black ${isToday ? 'bg-blue-600 text-white w-3.5 h-3.5 md:w-6 md:h-6 rounded-md md:rounded-lg flex items-center justify-center shadow-lg' : !isActuallyWorking ? 'text-rose-500' : 'text-gray-700'}`}>
                            {d}
                        </span>
                        <div className="flex items-center gap-0.5 md:gap-1">
                            {shouldShowBadge && (
                                <span className={`text-[5px] md:text-[8px] font-black px-1 md:px-2 py-0.5 md:py-1 rounded-full shadow-md uppercase border ${!isActuallyWorking ? 'bg-rose-500 text-white border-rose-400' : 'bg-indigo-600 text-white border-indigo-500'}`}>
                                    {!isActuallyWorking ? 'N' : 'L'}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col justify-start gap-0.5 mt-0.5 overflow-hidden">
                    {myRequest && (
                        <div className="flex items-center gap-1">
                            <div className="w-1 h-1 md:w-6 md:h-6 rounded-full md:rounded-lg bg-emerald-500 shadow-sm flex items-center justify-center flex-shrink-0">
                                <UserIcon className="hidden md:block w-3.5 h-3.5 text-white" />
                            </div>
                        </div>
                    )}
                    {otherRequests.length > 0 && (
                        <div className="flex items-center gap-0.5">
                             <div className="flex -space-x-1 md:-space-x-2 overflow-hidden">
                                {otherRequests.slice(0, 3).map((req, idx) => (
                                    <div key={idx} className="w-1 h-1 md:w-5 md:h-5 rounded-full bg-indigo-200 md:bg-indigo-100 border border-white shadow-sm flex items-center justify-center flex-shrink-0">
                                        <span className="hidden md:block text-[7px] font-bold text-indigo-600 uppercase">{req.users?.name?.charAt(0)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {dayRequestsLocal.length > 0 && (
                    <div className="absolute bottom-0.5 right-0.5 bg-gray-100 text-gray-500 text-[5px] md:text-[8px] px-0.5 md:px-1.5 py-0.2 md:py-0.5 rounded md:rounded-lg font-black flex items-center gap-0.5 md:gap-1 border border-gray-200">
                        {dayRequestsLocal.length}
                    </div>
                )}
            </div>
        );
    }
    return days;
  };

  return (
    <div className="space-y-3 md:space-y-6 h-full flex flex-col animate-fade-in max-w-7xl mx-auto px-1 md:px-0 pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-4 bg-white p-3 md:p-6 rounded-[1.2rem] md:rounded-[2rem] shadow-sm border border-gray-100 transition-all">
            <div className="w-full md:w-auto flex items-center justify-between md:block">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-base md:text-2xl font-black text-gray-900 tracking-tight">Tăng ca</h2>
                        <span className="text-[7px] md:text-[10px] font-bold bg-indigo-100 text-indigo-700 px-1 md:py-0.5 rounded-full uppercase">Tool V2</span>
                    </div>
                    <p className="text-[8px] md:text-sm text-gray-500 font-medium italic">Tháng {currentDate.getMonth() + 1} / {currentDate.getFullYear()}</p>
                </div>
                <button 
                  onClick={() => handleExportToday(isAdmin ? 'all' : 'personal')}
                  className="md:hidden flex items-center gap-1 bg-emerald-600 text-white px-2 py-1 rounded-lg text-[8px] font-black uppercase shadow-lg shadow-emerald-100 active:scale-95"
                >
                  <Zap className="w-2.5 h-2.5" /> Xuất hnay
                </button>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto">
                <div className="flex w-full md:w-auto bg-gray-100/80 p-0.5 rounded-xl md:rounded-2xl border border-gray-200 overflow-x-auto no-scrollbar">
                    <button onClick={() => setActiveTab('calendar')} className={`flex-1 md:flex-none flex items-center justify-center gap-1 px-3 md:px-6 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[9px] md:text-sm font-black transition-all whitespace-nowrap ${activeTab === 'calendar' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>
                        Lịch
                    </button>
                    <button onClick={() => setActiveTab('personal')} className={`flex-1 md:flex-none flex items-center justify-center gap-1 px-3 md:px-6 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[9px] md:text-sm font-black transition-all whitespace-nowrap ${activeTab === 'personal' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`}>
                        Tôi
                    </button>
                    <button onClick={() => setActiveTab('stats')} className={`flex-1 md:flex-none flex items-center justify-center gap-1 px-3 md:px-6 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[9px] md:text-sm font-black transition-all whitespace-nowrap ${activeTab === 'stats' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}>
                        Thống kê
                    </button>
                </div>
                <button 
                  onClick={() => handleExportToday(isAdmin ? 'all' : 'personal')}
                  className="hidden md:flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase shadow-lg shadow-emerald-100 transition-all transform hover:scale-105 active:scale-95"
                >
                  <Zap className="w-4 h-4" /> Xuất Excel hôm nay
                </button>
            </div>
        </div>

        <div className="flex-1">
            {activeTab === 'calendar' && (
                <Card className="h-full flex flex-col p-0 overflow-hidden border border-gray-100 shadow-lg rounded-[1.2rem] md:rounded-[2.5rem] bg-white">
                    <div className="flex items-center justify-between p-2 md:p-6 bg-white border-b border-gray-100">
                        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth()-1, 1))} className="p-1.5 md:p-3 hover:bg-gray-100 rounded-xl transition-all"><ChevronLeft className="w-3.5 h-3.5 md:w-5 md:h-5"/></button>
                        <h3 className="text-[9px] md:text-lg font-black uppercase tracking-[0.1em] md:tracking-[0.2em] text-gray-800">T{currentDate.getMonth()+1} - {currentDate.getFullYear()}</h3>
                        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth()+1, 1))} className="p-1.5 md:p-3 hover:bg-gray-100 rounded-xl transition-all"><ChevronRight className="w-3.5 h-3.5 md:w-5 md:h-5"/></button>
                    </div>
                    <div className="grid grid-cols-7 bg-gray-50 text-[7px] md:text-[10px] font-black uppercase text-gray-400 border-b border-gray-100">
                        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d, i) => <div key={d} className={`py-1.5 md:py-4 text-center ${i >= 5 ? 'text-rose-400' : ''}`}>{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-gray-100 gap-[0.5px]">
                        {renderCalendarDays()}
                    </div>
                </Card>
            )}

            {activeTab === 'personal' && (
                <div className="space-y-3 md:space-y-6 animate-fade-in-up">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                        <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none shadow-lg rounded-[1rem] md:rounded-[2rem] p-3 md:p-6">
                            <h3 className="text-[7px] md:text-[10px] font-black uppercase tracking-widest opacity-80">Tháng {currentDate.getMonth()+1}</h3>
                            <div className="flex items-end gap-1"><span className="text-xl md:text-5xl font-black">{myStats.total.toFixed(1)}</span><span className="text-[8px] md:text-lg font-bold opacity-70">h</span></div>
                        </Card>
                        <Card className="flex items-center gap-2 md:gap-4 bg-white border-l-4 border-emerald-500 rounded-[1rem] p-2 md:p-5 shadow-sm">
                            <div><p className="text-[7px] md:text-[10px] font-black text-gray-400 uppercase">Đã đăng ký</p><p className="text-xs md:text-2xl font-black text-gray-900">{myStats.count} d</p></div>
                        </Card>
                        <Card className="flex items-center gap-2 md:gap-4 bg-white border-l-4 border-amber-500 rounded-[1rem] p-2 md:p-5 shadow-sm">
                            <div><p className="text-[7px] md:text-[10px] font-black text-gray-400 uppercase">Chờ duyệt</p><p className="text-xs md:text-2xl font-black text-gray-900">{myStats.pending}</p></div>
                        </Card>
                        <Card className="flex items-center gap-2 md:gap-4 bg-white border-l-4 border-indigo-500 rounded-[1rem] p-2 md:p-5 shadow-sm">
                            <div><p className="text-[7px] md:text-[10px] font-black text-gray-400 uppercase">Trung bình</p><p className="text-xs md:text-2xl font-black text-gray-900">{(myStats.total / (myStats.count || 1)).toFixed(1)}</p></div>
                        </Card>
                    </div>

                    {/* NEW EXCEL EXPORT UI */}
                    <Card className="rounded-[1.2rem] md:rounded-[2.5rem] p-4 md:p-8 shadow-xl border-none bg-white">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
                                <FileSpreadsheet className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <div>
                                <h3 className="text-sm md:text-lg font-black text-gray-900 uppercase tracking-tight">Xuất Excel theo ngày chọn</h3>
                                <p className="text-[8px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest">Chọn khoảng thời gian để tải báo cáo cá nhân</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 items-end gap-3 md:gap-4 bg-gray-50 p-4 md:p-6 rounded-3xl border border-gray-100">
                            <div className="md:col-span-4 space-y-1.5">
                                <label className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><CalendarRange className="w-3 h-3"/> Từ ngày</label>
                                <input 
                                    type="date" 
                                    value={exportStartDate}
                                    onChange={(e) => setExportStartDate(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl text-[11px] md:text-sm font-black outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                                />
                            </div>
                            <div className="md:col-span-1 flex items-center justify-center pb-3">
                                <ArrowRight className="w-5 h-5 text-gray-300 hidden md:block" />
                                <div className="h-[2px] w-8 bg-gray-200 md:hidden"></div>
                            </div>
                            <div className="md:col-span-4 space-y-1.5">
                                <label className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><CalendarRange className="w-3 h-3"/> Đến ngày</label>
                                <input 
                                    type="date" 
                                    value={exportEndDate}
                                    onChange={(e) => setExportEndDate(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl text-[11px] md:text-sm font-black outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                                />
                            </div>
                            <div className="md:col-span-3">
                                <button 
                                    onClick={() => handleExportExcel('personal')}
                                    className="w-full flex items-center justify-center gap-3 py-3.5 bg-emerald-600 text-white rounded-xl md:rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-100 transition-all active:scale-95"
                                >
                                    <FileDown className="w-4 h-4" /> Tải báo cáo
                                </button>
                            </div>
                        </div>
                    </Card>

                    <Card className="rounded-[1.2rem] md:rounded-[2.5rem] p-3 md:p-6 shadow-md border-none">
                        <h3 className="font-black text-gray-800 uppercase text-[9px] md:text-xs tracking-widest mb-4 flex items-center gap-2"><Activity className="w-3.5 h-3.5 text-blue-600" /> Biểu đồ xu hướng</h3>
                        <div className="h-40 md:h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={myStats.trend} margin={{ top: 0, right: 0, left: -35, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 7, fontWeight: 'bold', fill: '#94a3b8'}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 7, fontWeight: 'bold', fill: '#94a3b8'}} />
                                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{fontSize: '9px', borderRadius: '8px'}} />
                                    <Bar dataKey="hours" fill="#4f46e5" radius={[1, 1, 0, 0]} barSize={6} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>
            )}

            {activeTab === 'stats' && (
                <div className="space-y-4 md:space-y-10 animate-fade-in-up no-scrollbar">
                    {isAdmin && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            <Card className="bg-white border-l-4 border-indigo-600 p-3 md:p-6 flex flex-col gap-0.5 shadow-md">
                                <p className="text-[7px] md:text-[10px] font-black text-gray-400 uppercase">Nhân sự OT</p>
                                <p className="text-sm md:text-3xl font-black text-gray-900">{teamMonthlyStats.activeMembers}</p>
                            </Card>
                            <Card className="bg-white border-l-4 border-emerald-600 p-3 md:p-6 flex flex-col gap-0.5 shadow-md">
                                <p className="text-[7px] md:text-[10px] font-black text-gray-400 uppercase">Tổng giờ</p>
                                <p className="text-sm md:text-3xl font-black text-gray-900">{teamMonthlyStats.totalHours.toFixed(1)}h</p>
                            </Card>
                            <Card className="col-span-2 md:col-span-1 bg-indigo-600 text-white p-3 md:p-6 flex flex-col gap-0.5 shadow-lg">
                                <p className="text-[7px] md:text-[10px] font-black text-white/70 uppercase">Hôm nay</p>
                                <p className="text-sm md:text-3xl font-black">{todayRegistrations.length}</p>
                            </Card>
                        </div>
                    )}

                    {/* STATS EXCEL EXPORT (FOR ADMIN) */}
                    {isAdmin && (
                        <Card className="rounded-[1.2rem] md:rounded-[2.5rem] p-4 md:p-8 shadow-xl border-none bg-white">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                                    <Download className="w-5 h-5 md:w-6 md:h-6" />
                                </div>
                                <div>
                                    <h3 className="text-sm md:text-lg font-black text-gray-900 uppercase tracking-tight">Xuất Excel hệ thống</h3>
                                    <p className="text-[8px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest">Tải toàn bộ dữ liệu tăng ca theo thời gian tùy chọn</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 items-end gap-3 md:gap-4 bg-gray-50 p-4 md:p-6 rounded-3xl border border-gray-100">
                                <div className="md:col-span-4 space-y-1.5">
                                    <label className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Từ ngày</label>
                                    <input 
                                        type="date" 
                                        value={exportStartDate}
                                        onChange={(e) => setExportStartDate(e.target.value)}
                                        className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl text-[11px] md:text-sm font-black outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                                    />
                                </div>
                                <div className="md:col-span-4 space-y-1.5">
                                    <label className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Đến ngày</label>
                                    <input 
                                        type="date" 
                                        value={exportEndDate}
                                        onChange={(e) => setExportEndDate(e.target.value)}
                                        className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl text-[11px] md:text-sm font-black outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                                    />
                                </div>
                                <div className="md:col-span-4">
                                    <button 
                                        onClick={() => handleExportExcel('all')}
                                        className="w-full flex items-center justify-center gap-3 py-3.5 bg-gray-900 text-white rounded-xl md:rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95"
                                    >
                                        <FileSpreadsheet className="w-4 h-4" /> Xuất Báo Cáo Tổng
                                    </button>
                                </div>
                            </div>
                        </Card>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <Card className="rounded-[1.2rem] md:rounded-[2rem] p-0 flex flex-col overflow-hidden bg-white shadow-md border-none">
                            <div className="p-3 md:p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                                <h4 className="text-[9px] md:text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-1.5"><Trophy className="w-3.5 h-3.5 text-amber-500" /> Đăng ký hôm nay</h4>
                                <span className="text-[7px] font-black bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-md uppercase">Hnay</span>
                            </div>
                            <div className="flex-1 overflow-y-auto max-h-[300px] p-2 space-y-2 no-scrollbar">
                                {todayRegistrations.length === 0 ? (
                                    <div className="h-40 flex flex-col items-center justify-center text-gray-300 italic text-[9px]">Trống</div>
                                ) : (
                                    todayRegistrations.map((req, idx) => (
                                        <div key={idx} className="p-2 md:p-4 rounded-xl bg-gray-50/50 border border-gray-100 flex items-center gap-2 md:gap-4 transition-all hover:bg-white hover:shadow-sm">
                                            <div className="w-7 h-7 md:w-10 md:h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-[10px] md:text-sm uppercase">
                                                {req.users?.name?.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h5 className="font-black text-gray-900 text-[10px] md:text-sm truncate">{req.users?.name}</h5>
                                                <p className="text-[7px] md:text-[10px] font-bold text-gray-400 uppercase">{req.users?.employee_id}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-center gap-1 text-[7px] md:text-[9px] font-black text-indigo-600">
                                                    {req.start_time}-{req.end_time}
                                                </div>
                                                <span className="text-[10px] md:text-sm font-black text-gray-900">{req.total_hours.toFixed(1)}h</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </Card>

                        <Card className="rounded-[1.2rem] md:rounded-[2.5rem] p-0 flex flex-col bg-white shadow-md overflow-hidden border border-gray-100">
                             <div className="p-3 md:p-6 bg-indigo-700 text-white flex justify-between items-center">
                                 <h4 className="text-[9px] md:text-sm font-black uppercase tracking-widest flex items-center gap-1.5"><Award className="w-4 h-4 text-amber-400" /> Top 10 T{currentDate.getMonth()+1}</h4>
                             </div>
                             <div className="p-2 md:p-4 space-y-1.5 overflow-y-auto max-h-[400px] no-scrollbar">
                                {topRankings.map((emp, idx) => (
                                    <div key={idx} className={`p-2.5 md:p-4 rounded-xl border flex items-center gap-3 transition-all ${idx === 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100'}`}>
                                        <div className={`w-6 h-6 md:w-8 md:h-8 rounded-lg flex items-center justify-center font-black text-[9px] md:text-sm ${idx === 0 ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h5 className="font-black text-gray-900 text-[10px] md:text-sm truncate uppercase">{emp.name}</h5>
                                            <p className="text-[7px] font-bold text-gray-400 uppercase">{emp.count} d</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs md:text-lg font-black text-indigo-600">{emp.hours.toFixed(1)}</span>
                                            <span className="text-[8px] font-bold text-gray-400 ml-0.5 uppercase">h</span>
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </Card>
                    </div>
                </div>
            )}
        </div>

        {isModalOpen && (
            <div className="fixed inset-0 bg-black/70 z-50 flex items-end md:items-center justify-center backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-t-[1.5rem] md:rounded-[3rem] shadow-2xl w-full max-w-sm animate-slide-up md:animate-zoom-in overflow-hidden max-h-[95vh] flex flex-col">
                    <div className="bg-indigo-600 p-3 md:p-6 flex justify-between items-center text-white shrink-0 shadow-lg">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5 text-indigo-200" /><h3 className="text-sm md:text-xl font-black uppercase tracking-tighter">{selectedDateStr.split('-').reverse().join('/')}</h3></div>
                            <p className="text-[8px] md:text-xs text-indigo-200 font-bold uppercase mt-0.5">Đăng ký tăng ca</p>
                        </div>
                        <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-white/20 rounded-xl transition-all"><X className="w-5 h-5"/></button>
                    </div>
                    
                    <div className="p-4 md:p-8 space-y-4 overflow-y-auto no-scrollbar pb-8">
                        {isAdmin && (
                            <div className="bg-white p-3 md:p-5 rounded-2xl border-2 border-indigo-100 shadow-md space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
                                        <Settings className="w-3.5 h-3.5" />
                                    </div>
                                    <h4 className="text-[9px] md:text-[11px] font-black text-indigo-900 uppercase">Cấu hình loại ngày</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <button 
                                        type="button"
                                        onClick={() => updateDayWorkingStatus(false)}
                                        className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 transition-all font-black text-[8px] md:text-[10px] uppercase ${ (dayConfigs[selectedDateStr] === false || (dayConfigs[selectedDateStr] === undefined && (new Date(selectedDateStr).getDay() === 0 || new Date(selectedDateStr).getDay() === 6))) ? 'bg-rose-500 text-white border-rose-400' : 'bg-gray-50 text-gray-400 border-gray-100' }`}
                                    >
                                        <Home className="w-3 h-3" /> Ngày nghỉ
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => updateDayWorkingStatus(true)}
                                        className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 transition-all font-black text-[8px] md:text-[10px] uppercase ${ (dayConfigs[selectedDateStr] === true || (dayConfigs[selectedDateStr] === undefined && new Date(selectedDateStr).getDay() !== 0 && new Date(selectedDateStr).getDay() !== 6)) ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-gray-50 text-gray-400 border-gray-100' }`}
                                    >
                                        <Briefcase className="w-3 h-3" /> Đi làm
                                    </button>
                                </div>
                            </div>
                        )}

                        {dayRequests.length > 0 && (
                            <div className="p-2 md:p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <button onClick={() => setShowColleagueDetails(!showColleagueDetails)} className="w-full flex justify-between items-center text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    <span className="flex items-center gap-1.5"><Users className="w-3 h-3"/> Đơn trong ngày ({dayRequests.length})</span>
                                    {showColleagueDetails ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}
                                </button>
                                {showColleagueDetails && (
                                    <div className="mt-2 flex flex-wrap gap-1.5 animate-fade-in no-scrollbar">
                                        {dayRequests.map(req => (
                                            <button 
                                                key={req.id} 
                                                type="button"
                                                onClick={() => isAdmin && setTargetUserId(req.user_id)}
                                                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[8px] md:text-[10px] font-bold transition-all ${isAdmin ? 'bg-white border-indigo-200 text-indigo-600 shadow-sm' : 'bg-gray-50 text-gray-400'}`}
                                            >
                                                <span className="truncate max-w-[60px]">{req.users?.name}</span>
                                                {isAdmin && req.user_id === targetUserId && <Check className="w-2.5 h-2.5" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-5">
                            {isViewOnly ? (
                                <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl text-center space-y-3">
                                    <Eye className="w-6 h-6 text-amber-500 mx-auto" />
                                    <p className="text-[10px] font-bold text-amber-900 uppercase">Xem đơn của đồng nghiệp</p>
                                    <div className="grid grid-cols-2 gap-2 text-[9px]">
                                        <div className="bg-white p-2 rounded-lg border border-amber-100"><p className="text-gray-400 font-black">Giờ</p><p className="font-black">{startTime} - {endTime}</p></div>
                                        <div className="bg-white p-2 rounded-lg border border-amber-100"><p className="text-gray-400 font-black">Tổng</p><p className="font-black">{calculatedHours}h</p></div>
                                    </div>
                                    <button type="button" onClick={() => setTargetUserId(user.id)} className="w-full py-2.5 bg-indigo-600 text-white text-[9px] font-black uppercase rounded-xl">Đăng ký cho tôi</button>
                                </div>
                            ) : (
                                <>
                                    {isAdmin && (
                                        <div className="space-y-1">
                                            <label className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nhân sự:</label>
                                            <div className="relative group">
                                                <select 
                                                    required 
                                                    value={targetUserId} 
                                                    onChange={(e) => setTargetUserId(e.target.value)} 
                                                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[10px] md:text-sm font-black outline-none appearance-none"
                                                >
                                                    {allEmployees.map(emp => (<option key={emp.id} value={emp.id}>{emp.name}</option>))}
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
                                            </div>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                                            <label className="block text-[7px] md:text-[9px] font-black text-gray-400 uppercase mb-0.5">Bắt đầu</label>
                                            <input type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full bg-transparent border-none p-0 text-sm md:text-lg font-black text-gray-900 focus:ring-0 outline-none"/>
                                        </div>
                                        <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                                            <label className="block text-[7px] md:text-[9px] font-black text-gray-400 uppercase mb-0.5">Kết thúc</label>
                                            <input type="time" required value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full bg-transparent border-none p-0 text-sm md:text-lg font-black text-gray-900 focus:ring-0 outline-none"/>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase">Lý do & Tổng giờ</label>
                                            <span className="text-[9px] md:text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{calculatedHours}h OT</span>
                                        </div>
                                        <textarea required value={reason} onChange={(e) => setReason(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-[11px] md:text-sm h-20 md:h-32 resize-none outline-none font-medium" placeholder="Mô tả công việc..."/>
                                        <button type="button" onClick={async () => { if(!reason) return; setIsRewriting(true); setReason(await rewriteOvertimeReason(reason)); setIsRewriting(false); }} disabled={isRewriting || !reason} className="w-full mt-0.5 flex items-center justify-center gap-1 py-1.5 text-[8px] md:text-[10px] font-black text-indigo-600 bg-indigo-50 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors">
                                            {isRewriting ? <Loader2 className="w-3 h-3 animate-spin"/> : <Wand2 className="w-3 h-3"/>}
                                            Làm đẹp lý do bằng AI
                                        </button>
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        {(editingRequestId && (isAdmin || targetUserId === user.id)) && (
                                            <button type="button" onClick={() => setIsConfirmCancelOpen(true)} className="p-2.5 md:p-5 bg-rose-50 text-rose-600 rounded-xl md:rounded-3xl border border-rose-100 active:scale-95 transition-all"><Trash2 className="w-4 h-4"/></button>
                                        )}
                                        <button type="submit" disabled={isSubmitting || calculatedHours <= 0} className="flex-1 py-2.5 md:py-5 bg-indigo-600 text-white font-black rounded-xl md:rounded-3xl shadow-lg text-[9px] md:text-xs tracking-widest uppercase transition-all active:scale-95 disabled:opacity-50">
                                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto"/> : editingRequestId ? 'Cập nhật' : 'Đăng ký ngay'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        )}

        {isConfirmCancelOpen && (
            <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-6 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-[1.5rem] shadow-2xl w-full max-w-[280px] overflow-hidden animate-zoom-in p-5 text-center border border-gray-100">
                    <div className="w-10 h-10 bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3 rounded-xl"><Trash2 className="w-5 h-5"/></div>
                    <h3 className="text-sm font-black text-gray-900 mb-1 uppercase">Xóa đơn này?</h3>
                    <p className="text-[9px] text-gray-500 font-bold uppercase opacity-70 mb-5 leading-tight">Hành động này không thể hoàn tác.</p>
                    <div className="space-y-2">
                        <button onClick={handleCancelRequest} disabled={isDeleting} className="w-full py-2.5 bg-rose-600 text-white font-black rounded-xl text-[9px] uppercase active:scale-95 shadow-lg shadow-rose-100">Xác nhận xóa</button>
                        <button onClick={() => setIsConfirmCancelOpen(false)} className="w-full py-2.5 bg-white text-gray-400 font-black rounded-xl border border-gray-200 text-[9px] uppercase active:scale-95">Hủy</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
