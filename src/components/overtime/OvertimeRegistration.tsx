
import React, { useState, useEffect, useMemo, useContext } from 'react';
import { User, OvertimeRequest, DayConfig, Employee } from '../../../types';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/Card';
import * as XLSX from 'xlsx';
import { 
  Clock, Calendar as CalendarIcon, X, 
  Timer, Loader2, ChevronLeft, ChevronRight, ChevronDown, Download, BarChart3, Users, User as UserIcon, Settings, Check, Trash2, 
  Activity, Home, Briefcase, FileText, CalendarRange, UserCheck, Search, Filter,
  FileSpreadsheet, FileDown, CalendarDays, Eye, Trophy, Target, Award, Info, Undo2, ArrowRight, Snowflake, Sparkles, UserPlus, UserRoundPen, ChevronUp, Gift, Send, Save, Edit
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

  const currentSelectedRequest = useMemo(() => {
    if (!selectedDateStr || !targetUserId) return null;
    return requests.find(r => r.date === selectedDateStr && r.user_id === targetUserId) || null;
  }, [requests, selectedDateStr, targetUserId]);

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
      {wch: 6},  {wch: 15}, {wch: 25}, {wch: 12}, {wch: 12}, {wch: 12}, {wch: 40}, {wch: 15}
    ];

    const groupedByDate: Record<string, OvertimeRequest[]> = {};
    dataToExport.forEach(req => {
        if (!groupedByDate[req.date]) groupedByDate[req.date] = [];
        groupedByDate[req.date].push(req);
    });

    const sortedDates = Object.keys(groupedByDate).sort();

    sortedDates.forEach(date => {
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
        days.push(<div key={`empty-${i}`} className="h-20 md:h-32 bg-slate-50/20 border border-slate-100/30"></div>);
    }

    for (let d = 1; d <= totalDays; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayRequestsLocal = requests.filter(r => r.date === dateStr);
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
                className={`h-20 md:h-32 border border-slate-100 p-1.5 relative transition-all cursor-pointer group flex flex-col 
                  ${isToday ? 'bg-indigo-50/40 ring-inset ring-1 ring-indigo-500/30 z-10' : 'bg-white hover:bg-slate-50'} 
                  ${isPast ? 'opacity-80' : 'opacity-100'}`}
            >
                <div className="flex justify-between items-start mb-1">
                    <span className={`text-[10px] md:text-[11px] font-bold ${isToday ? 'bg-indigo-600 text-white w-4 h-4 md:w-5 md:h-5 rounded-md flex items-center justify-center shadow-sm' : 'text-slate-500'}`}>
                        {d}
                    </span>
                    {!isActuallyWorking && (
                      <span className="text-[7px] font-black px-1 py-0.5 rounded bg-rose-50 text-rose-500 uppercase">Nghỉ</span>
                    )}
                </div>
                
                <div className="flex-1 flex flex-col justify-start gap-1 overflow-hidden mt-0.5">
                    {myRequest && (
                      <div className={`w-fit flex items-center gap-1 text-white px-1.5 py-0.5 rounded-md shrink-0 border border-white/10 ${isTet ? 'bg-red-600' : 'bg-emerald-600'}`}>
                        <UserIcon className="w-1.5 h-1.5 md:w-2 md:h-2" />
                        <span className="text-[7px] font-black truncate uppercase leading-none">{myRequest.total_hours}h</span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-0.5 max-h-8 overflow-hidden">
                      {dayRequestsLocal.filter(r => r.user_id !== user.id).slice(0, 4).map((req, idx) => (
                        <div key={idx} className="w-3.5 h-3.5 md:w-4 md:h-4 rounded-md bg-slate-100 text-slate-500 border border-slate-200 flex items-center justify-center shrink-0" title={req.users?.name}>
                           <span className="text-[6px] md:text-[7px] font-black uppercase leading-none">{req.users?.name?.charAt(0)}</span>
                        </div>
                      ))}
                    </div>
                </div>

                {uniqueUserIds.size > 0 && (
                    <div className="absolute bottom-1 right-1 bg-slate-800 text-white text-[7px] px-1 py-0.5 rounded font-black tracking-tight leading-none opacity-80">
                        {uniqueUserIds.size} NV
                    </div>
                )}
            </div>
        );
    }
    return days;
  };

  return (
    <div className="space-y-6 h-full flex flex-col animate-fade-in max-w-[1200px] mx-auto w-full px-4 md:px-0 pb-20">
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 glass-card p-5 md:p-6 rounded-[1.5rem] vibrant-shadow">
            <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl shadow-lg text-white transform hover:rotate-3 transition-transform ${isTet ? 'bg-red-600' : 'bg-indigo-600'}`}>
                    <Clock className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight leading-none uppercase">
                        Tăng ca
                        {isTet && <Sparkles className="inline ml-2 w-5 h-5 text-orange-500 animate-pulse" />}
                    </h2>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                       Hệ thống quản lý thời gian
                    </p>
                </div>
            </div>
            <div className="flex bg-slate-100/50 p-1 rounded-xl border border-slate-200 w-full lg:w-auto">
                {['calendar', 'personal', 'stats'].map(t => (
                    <button key={t} onClick={() => setActiveTab(t as any)} className={`flex-1 lg:flex-none px-5 py-2 rounded-lg text-[10px] font-bold transition-all uppercase tracking-widest ${activeTab === t ? (isTet ? 'bg-red-600 text-white shadow-md' : 'bg-white text-indigo-700 shadow-sm') : 'text-slate-500 hover:text-slate-900'}`}>
                        {t === 'calendar' ? 'Lịch' : t === 'personal' ? 'Cá nhân' : 'Thống kê'}
                    </button>
                ))}
            </div>
        </div>

        <div className="flex-1 min-h-0">
            {activeTab === 'calendar' && (
                <div className="rounded-[2rem] overflow-hidden bg-white border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between p-5 md:p-6 bg-white border-b border-slate-100">
                        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth()-1, 1))} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-all"><ChevronLeft className="w-6 h-6"/></button>
                        <h3 className="text-lg md:text-xl font-extrabold text-slate-900 italic">Tháng {currentDate.getMonth()+1} / {currentDate.getFullYear()}</h3>
                        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth()+1, 1))} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-all"><ChevronRight className="w-6 h-6"/></button>
                    </div>
                    <div className="grid grid-cols-7 bg-slate-50/50 text-[9px] font-bold uppercase text-slate-400 border-b border-slate-100">
                        {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'].map((d, i) => (
                            <div key={d} className={`py-4 text-center tracking-widest ${i >= 5 ? 'text-rose-500' : ''}`}>{d}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 auto-rows-fr bg-slate-100 gap-[1px]">
                        {renderCalendarDays()}
                    </div>
                </div>
            )}

            {activeTab === 'personal' && (
                <div className="space-y-6 animate-page-transition">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className={`p-6 rounded-[1.5rem] shadow-lg border-none text-white relative overflow-hidden ${isTet ? 'bg-gradient-to-br from-red-600 to-red-800' : 'bg-gradient-to-br from-indigo-600 to-purple-800'}`}>
                            <h3 className="text-[10px] font-bold uppercase opacity-80 tracking-widest mb-3">Tổng giờ T{currentDate.getMonth()+1}</h3>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-3xl font-extrabold tabular-nums leading-none">{myStats.total.toFixed(1)}</span>
                                <span className="text-sm font-bold opacity-60">h</span>
                            </div>
                        </div>
                        
                        <Card className="p-6 border-none bg-white rounded-[1.5rem] shadow-sm flex items-center gap-5">
                            <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600"><Check className="w-7 h-7"/></div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Đăng ký</p>
                                <p className="text-2xl font-extrabold text-slate-900 tabular-nums">{myStats.count}</p>
                            </div>
                        </Card>

                        <Card className="p-6 border-none bg-white rounded-[1.5rem] shadow-sm flex items-center gap-5">
                            <div className="p-4 bg-amber-50 rounded-2xl text-amber-600"><Timer className="w-7 h-7"/></div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Đang chờ</p>
                                <p className="text-2xl font-extrabold text-slate-900 tabular-nums">{myStats.pending}</p>
                            </div>
                        </Card>
                    </div>

                    <Card className="rounded-[2rem] p-6 md:p-8 shadow-sm border-none bg-white">
                        <div className="flex justify-between items-center mb-8">
                            <h4 className="text-lg font-extrabold text-slate-900 uppercase flex items-center gap-3"><Activity className="text-indigo-600" /> Biểu đồ hoạt động</h4>
                        </div>
                        <div className="h-64 md:h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={myStats.trend}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 700, fill: '#94a3b8'}} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 700, fill: '#94a3b8'}} />
                                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }} />
                                    <Bar dataKey="hours" fill={isTet ? "#dc2626" : "#4f46e5"} radius={[4, 4, 0, 0]} barSize={14} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>
            )}

            {activeTab === 'stats' && (
                <div className="space-y-6 animate-page-transition">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <Card className="bg-white p-6 border-none shadow-sm rounded-[1.5rem] flex items-center gap-5">
                            <div className={`p-4 ${isTet ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'} rounded-2xl`}><Users className="w-7 h-7"/></div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Thành viên OT</p>
                                <p className="text-2xl font-extrabold text-slate-900">{teamMonthlyStats.activeMembers}</p>
                            </div>
                        </Card>
                        <Card className="bg-white p-6 border-none shadow-sm rounded-[1.5rem] flex items-center gap-5">
                            <div className={`p-4 bg-emerald-50 text-emerald-600 rounded-2xl`}><Timer className="w-7 h-7"/></div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Giờ nhóm</p>
                                <p className="text-2xl font-extrabold text-slate-900">{teamMonthlyStats.totalHours.toFixed(1)}h</p>
                            </div>
                        </Card>
                        <Card className={`${isTet ? 'bg-gradient-to-br from-red-600 to-red-800' : 'bg-gradient-to-br from-slate-800 to-slate-900'} text-white p-6 border-none shadow-lg rounded-[1.5rem] flex items-center gap-5`}>
                            <div className="p-4 bg-white/10 rounded-2xl"><Target className="w-7 h-7 text-white"/></div>
                            <div>
                                <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Hôm nay</p>
                                <p className="text-2xl font-extrabold text-white">{requests.filter(r => r.date === todayStr).length} NV</p>
                            </div>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                        <div className="xl:col-span-8 space-y-5">
                            <div className="bg-white rounded-[2rem] p-0 overflow-hidden shadow-sm border border-slate-200">
                                <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                                        Chi tiết đăng ký
                                        <span className="px-2 py-0.5 bg-indigo-600 text-white text-[9px] rounded-full">
                                            {targetedRegistrations.length} NV
                                        </span>
                                    </h4>
                                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm w-full sm:w-auto">
                                        <CalendarIcon className="w-4 h-4 text-slate-400" />
                                        <input type="date" value={statsViewDate} onChange={(e) => setStatsViewDate(e.target.value)} className="bg-transparent text-xs font-bold outline-none text-slate-900 w-full"/>
                                    </div>
                                </div>
                                <div className="p-5 space-y-3 max-h-[500px] overflow-y-auto no-scrollbar">
                                    {targetedRegistrations.length === 0 ? (
                                        <div className="py-20 text-center flex flex-col items-center gap-3 opacity-40">
                                            <Info className="w-8 h-8 text-slate-400"/>
                                            <p className="font-bold uppercase text-[10px] tracking-widest text-slate-400">Không tìm thấy dữ liệu</p>
                                        </div>
                                    ) : (
                                        targetedRegistrations.map((req, idx) => (
                                            <div key={idx} className="p-4 rounded-2xl bg-white border border-slate-100 hover:border-indigo-100 transition-all flex items-center justify-between gap-4 group hover:shadow-sm">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative shrink-0">
                                                        <div className={`w-12 h-12 text-white rounded-xl flex items-center justify-center font-extrabold text-lg shadow-md ${isTet ? 'bg-red-600' : 'bg-indigo-600'}`}>{req.users?.name?.charAt(0)}</div>
                                                        <div className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-slate-900 text-white text-[8px] font-bold rounded-md flex items-center justify-center border border-white z-10">{idx + 1}</div>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h5 className="font-extrabold text-slate-900 text-sm tracking-tight uppercase leading-none truncate">{req.users?.name}</h5>
                                                        <div className="flex items-center gap-2 mt-2">
                                                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{req.users?.employee_id}</span>
                                                          <span className="text-[9px] font-bold text-indigo-600 uppercase px-2 py-0.5 bg-indigo-50 rounded-md">{req.start_time}-{req.end_time}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <div className="flex items-baseline gap-1">
                                                      <span className="text-xl font-extrabold text-slate-900 tabular-nums">{req.total_hours.toFixed(1)}</span>
                                                      <span className="text-[9px] font-bold text-slate-400 uppercase">H</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="xl:col-span-4 space-y-6">
                            <Card className="rounded-[2rem] p-0 overflow-hidden shadow-sm border border-slate-200 bg-white">
                                <div className={`p-6 ${isTet ? 'bg-red-600' : 'bg-indigo-600'} text-white relative overflow-hidden`}>
                                    <h4 className="text-base font-extrabold uppercase relative z-10 italic tracking-tight">Xếp hạng</h4>
                                    <p className="text-[9px] font-bold opacity-70 uppercase tracking-widest mt-1 relative z-10">Tháng {currentDate.getMonth()+1}</p>
                                </div>
                                <div className="p-5 space-y-3">
                                    {topRankings.map((emp, idx) => (
                                        <div key={idx} className={`p-3.5 rounded-xl border flex items-center gap-4 transition-all ${idx === 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100'}`}>
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${idx === 0 ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-500'}`}>{idx + 1}</div>
                                            <div className="flex-1 min-w-0">
                                                <h5 className="font-bold text-slate-900 text-xs truncate uppercase tracking-tight">{emp.name}</h5>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{emp.count} buổi</p>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-base font-extrabold ${idx === 0 ? 'text-amber-600' : 'text-slate-900'} tabular-nums`}>{emp.hours.toFixed(1)}</span>
                                                <span className="text-[9px] font-bold text-slate-400 ml-0.5">h</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            {isAdmin && (
                                <div className="bg-slate-900 rounded-[2rem] p-6 shadow-lg space-y-6 text-white border border-slate-800">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white/10 rounded-xl"><FileSpreadsheet className="w-6 h-6 text-emerald-400"/></div>
                                        <div>
                                            <h4 className="font-extrabold uppercase text-sm leading-none">Báo cáo Excel</h4>
                                            <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-1.5">Xuất dữ liệu chuẩn</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <button onClick={() => handleExportExcelPro('today')} className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[10px] uppercase tracking-widest transition-all">XUẤT HÔM NAY</button>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                              <p className="text-[9px] font-bold text-white/50 uppercase ml-1">Từ ngày</p>
                                              <input type="date" value={exportStartDate} onChange={e => setExportStartDate(e.target.value)} className="w-full bg-white/10 border-none rounded-lg p-2.5 text-[10px] font-bold text-white outline-none"/>
                                            </div>
                                            <div className="space-y-1.5">
                                              <p className="text-[9px] font-bold text-white/50 uppercase ml-1">Đến ngày</p>
                                              <input type="date" value={exportEndDate} onChange={e => setExportEndDate(e.target.value)} className="w-full bg-white/10 border-none rounded-lg p-2.5 text-[10px] font-bold text-white outline-none"/>
                                            </div>
                                        </div>
                                        <button onClick={() => handleExportExcelPro('range')} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-[10px] uppercase tracking-widest transition-all">XUẤT DẢI NGÀY</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* MODAL ĐĂNG KÝ */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-end md:items-center justify-center backdrop-blur-md animate-fade-in px-0 md:px-6">
                <div className="bg-white rounded-t-[2.5rem] md:rounded-[3rem] shadow-2xl w-full max-w-2xl animate-zoom-in overflow-hidden max-h-[96vh] flex flex-col border border-white/20">
                    <div className={`${isTet ? 'bg-gradient-to-r from-red-600 to-red-800' : 'bg-gradient-to-r from-indigo-600 to-purple-800'} p-6 md:p-8 flex justify-between items-center text-white shrink-0 shadow-lg`}>
                        <div>
                            <h3 className="text-xl md:text-2xl font-extrabold tracking-tight">Ghi nhận tăng ca</h3>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70 mt-1">Ngày {selectedDateStr.split('-').reverse().join('/')}</p>
                        </div>
                        <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white/20 rounded-full transition-all active:scale-90"><X className="w-6 h-6"/></button>
                    </div>
                    
                    <div className="p-6 md:p-10 space-y-8 overflow-y-auto no-scrollbar pb-20 bg-slate-50 flex-1">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between ml-1">
                                <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Nhân sự trong ngày ({dayRequestsInModal.length})</h4>
                                {isAdmin && <p className="text-[8px] font-bold text-indigo-500 uppercase italic">Click để sửa nhanh</p>}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {dayRequestsInModal.length === 0 ? (
                                    <div className="col-span-full py-8 text-center bg-white/50 rounded-2xl border-2 border-dashed border-slate-200 text-[10px] font-bold text-slate-400 uppercase">Chưa có ai đăng ký</div>
                                ) : (
                                    dayRequestsInModal.map((r) => (
                                        <div 
                                            key={r.id} 
                                            onClick={() => isAdmin && setTargetUserId(r.user_id)}
                                            className={`flex items-center justify-between p-3.5 bg-white rounded-2xl border shadow-sm transition-all group 
                                                ${isAdmin ? 'cursor-pointer hover:border-indigo-500 hover:shadow-md active:scale-95' : ''}
                                                ${r.user_id === targetUserId ? 'ring-2 ring-indigo-500 border-indigo-100 bg-indigo-50/10' : 'border-slate-100'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs text-white shadow-sm transition-transform group-hover:scale-110 ${isTet ? 'bg-red-600' : 'bg-indigo-600'}`}>{r.users?.name?.charAt(0)}</div>
                                                <div className="flex flex-col">
                                                    <p className={`text-xs font-bold uppercase truncate leading-none ${r.user_id === targetUserId ? 'text-indigo-600' : 'text-slate-900'}`}>{r.users?.name}</p>
                                                    {isAdmin && r.user_id === targetUserId && <span className="text-[8px] font-black text-indigo-400 uppercase mt-1 flex items-center gap-1"><Edit className="w-2 h-2" /> Đang sửa</span>}
                                                </div>
                                            </div>
                                            <div className={`text-[10px] font-bold px-2 py-0.5 rounded-lg transition-colors ${r.user_id === targetUserId ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{r.total_hours}h</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {isAdmin && (
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
                                <div className="flex items-center gap-3">
                                    <Settings className="w-4 h-4 text-slate-400" />
                                    <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-900">Chế độ ngày công</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => updateDayWorkingStatus(false)} className={`py-4 rounded-xl border transition-all font-bold text-[10px] uppercase tracking-widest ${ (dayConfigs[selectedDateStr] === false || (dayConfigs[selectedDateStr] === undefined && (new Date(selectedDateStr).getDay() === 0 || new Date(selectedDateStr).getDay() === 6))) ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-400 border-slate-200 hover:border-rose-400' }`}>NGÀY NGHỈ</button>
                                    <button onClick={() => updateDayWorkingStatus(true)} className={`py-4 rounded-xl border transition-all font-bold text-[10px] uppercase tracking-widest ${ (dayConfigs[selectedDateStr] === true || (dayConfigs[selectedDateStr] === undefined && new Date(selectedDateStr).getDay() !== 0 && new Date(selectedDateStr).getDay() !== 6)) ? (isTet ? 'bg-red-600 border-red-600 text-white' : 'bg-indigo-600 border-indigo-600 text-white') : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-400' }`}>NGÀY ĐI LÀM</button>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-xl space-y-6">
                                {isAdmin && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Nhân sự thực hiện</label>
                                        <div className="relative">
                                            <select required value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none uppercase appearance-none cursor-pointer focus:bg-white focus:border-indigo-500 transition-all text-slate-900">
                                                {allEmployees.map(emp => (<option key={emp.id} value={emp.id}>{emp.name} • {emp.employee_id}</option>))}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4 md:gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Giờ bắt đầu</label>
                                        <input type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-500 transition-all shadow-inner"/>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Giờ kết thúc</label>
                                        <input type="time" required value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-500 transition-all shadow-inner"/>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Nội dung</label>
                                        <div className={`text-[10px] font-black px-3 py-1 rounded-lg border shadow-sm ${isTet ? 'bg-red-50 text-red-600 border-red-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>{calculatedHours.toFixed(1)}h OT</div>
                                    </div>
                                    <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm md:text-base h-32 resize-none outline-none font-medium text-slate-900 focus:bg-white focus:border-indigo-500 transition-all shadow-inner" placeholder="VD: Bảo trì server, kiểm kho..."/>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    {editingRequestId && (isAdmin || targetUserId === user.id) && (
                                        <button type="button" onClick={() => setIsConfirmCancelOpen(true)} className="p-5 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-600 hover:text-white transition-all active:scale-90 border border-rose-100"><Trash2 className="w-6 h-6"/></button>
                                    )}
                                    <button type="submit" disabled={isSubmitting || calculatedHours <= 0} className={`flex-1 py-5 text-white font-bold rounded-2xl shadow-xl text-xs tracking-widest uppercase active:scale-[0.98] disabled:opacity-50 transition-all ${isTet ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto"/> : (editingRequestId ? 'Lưu thay đổi' : 'Xác nhận đăng ký')}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        )}

        {/* CONFIRMATION DELETE */}
        {isConfirmCancelOpen && (
            <div className="fixed inset-0 bg-slate-900/90 z-[120] flex items-center justify-center p-6 backdrop-blur-xl animate-fade-in">
                <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-zoom-in p-10 text-center border border-white/20">
                    <div className="w-20 h-20 bg-rose-50 text-rose-600 mx-auto mb-6 rounded-3xl flex items-center justify-center shadow-md rotate-12"><Trash2 className="w-8 h-8" /></div>
                    <h3 className="text-xl font-extrabold text-slate-900 mb-2 uppercase tracking-tight">Hủy bỏ?</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-10 px-2 leading-relaxed">Dữ liệu sẽ bị xóa vĩnh viễn khỏi kho lưu trữ hệ thống.</p>
                    <div className="flex flex-col gap-3">
                        <button onClick={handleCancelRequest} disabled={isDeleting} className="w-full py-4 bg-rose-600 text-white font-bold rounded-xl text-[10px] uppercase tracking-widest shadow-lg shadow-rose-200 active:scale-95 transition-all">XÁC NHẬN XÓA</button>
                        <button onClick={() => setIsConfirmCancelOpen(false)} className="w-full py-4 bg-slate-100 text-slate-500 font-bold rounded-xl text-[10px] uppercase tracking-widest active:scale-95 transition-all">QUAY LẠI</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
