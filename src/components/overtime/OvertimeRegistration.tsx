
<<<<<<< HEAD
import React, { useState, useEffect, useMemo, useContext } from 'react';
import { User, OvertimeRequest, DayConfig, Employee, DutyGroup, DutySchedule } from '../../../types';
import { supabase } from '../../lib/supabase';
import { dutyService } from '../../services/dutyService';
import { DutyManager } from './DutyManager';
import { Card } from '../ui/Card';
import * as XLSX from 'xlsx';
import { 
  Clock, Calendar as CalendarIcon, X, 
  Timer, Loader2, ChevronLeft, ChevronRight, ChevronDown, Download, BarChart3, Users, User as UserIcon, Settings, Check, Trash2, RefreshCw,
  Activity, Home, Briefcase, FileText, CalendarRange, UserCheck, Search, Filter,
  FileSpreadsheet, FileDown, CalendarDays, Eye, Trophy, Target, Award, Info, Undo2, ArrowRight, Snowflake, Sparkles, UserPlus, UserRoundPen, ChevronUp, Gift, Send, Save, Edit
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ThemeContext } from '../../../App';
=======
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
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9

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

<<<<<<< HEAD
const getDayOfWeek = (dateStr: string) => {
    if (!dateStr) return 1;
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).getDay();
};

export const OvertimeRegistration: React.FC<OvertimeRegistrationProps> = ({ user }) => {
  const { theme } = useContext(ThemeContext);
=======
export const OvertimeRegistration: React.FC<OvertimeRegistrationProps> = ({ user }) => {
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
  const [activeTab, setActiveTab] = useState<'calendar' | 'personal' | 'stats'>('calendar');
  const [requests, setRequests] = useState<OvertimeRequest[]>([]);
  const [dayConfigs, setDayConfigs] = useState<Record<string, boolean>>({}); 
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  
<<<<<<< HEAD
  // Duty states
  const [dutyGroups, setDutyGroups] = useState<DutyGroup[]>([]);
  const [dutySchedule, setDutySchedule] = useState<DutySchedule[]>([]);
  const [isDutyManagerOpen, setIsDutyManagerOpen] = useState(false);
  const [rotationStartDate, setRotationStartDate] = useState<string | null>(null);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmCancelOpen, setIsConfirmCancelOpen] = useState(false); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfigUpdating, setIsConfigUpdating] = useState(false);
  const [isListExpanded, setIsListExpanded] = useState(false); 
=======
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showColleagueDetails, setShowColleagueDetails] = useState(false);
  const [isConfirmCancelOpen, setIsConfirmCancelOpen] = useState(false); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfigUpdating, setIsConfigUpdating] = useState(false);
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
  
  const [selectedDateStr, setSelectedDateStr] = useState('');
  const [targetUserId, setTargetUserId] = useState(user.id);
  const [startTime, setStartTime] = useState('17:30');
  const [endTime, setEndTime] = useState('20:00');
  const [reason, setReason] = useState('');
  
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
<<<<<<< HEAD
  const [message, setMessage] = useState<string | null>(null);
  const [empSearchTerm, setEmpSearchTerm] = useState('');

  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);

  const [exportStartDate, setExportStartDate] = useState(todayStr);
  const [exportEndDate, setExportEndDate] = useState(todayStr);
  const [statsViewDate, setStatsViewDate] = useState(todayStr);

  const isAdmin = user.role === 'admin';
  const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const isTet = theme === 'tet';

  const isSelectedDayWorking = useMemo(() => {
    if (!selectedDateStr) return true;
    const dayOfWeek = getDayOfWeek(selectedDateStr);
    return dayConfigs[selectedDateStr] ?? (dayOfWeek !== 0 && dayOfWeek !== 6);
  }, [selectedDateStr, dayConfigs]);
=======

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
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9

  useEffect(() => {
    fetchRequests();
    fetchDayConfigs();
<<<<<<< HEAD
    fetchEmployees();
    fetchDutyData();
    const storedStart = localStorage.getItem('v1_duty_rotation_start_date');
    if (storedStart) {
      setRotationStartDate(storedStart);
    } else {
      setRotationStartDate(null);
    }
  }, [user.id, currentDate]);

  const isSameDay = (d1: string, d2: string) => {
    if (!d1 || !d2) return false;
    return d1.split('T')[0] === d2.split('T')[0];
  };

  const currentSelectedRequest = useMemo(() => {
    if (!selectedDateStr || !targetUserId) return null;
    return requests.find(r => isSameDay(r.date, selectedDateStr) && r.user_id === targetUserId) || null;
  }, [requests, selectedDateStr, targetUserId]);

  const dayRequestsInModal = useMemo(() => {
    const dayReqs = requests.filter(r => isSameDay(r.date, selectedDateStr));
    const uniqueReqs: OvertimeRequest[] = [];
    const seenUsers = new Set();
    
    dayReqs.forEach(req => {
      if (!seenUsers.has(req.user_id)) {
        seenUsers.add(req.user_id);
        uniqueReqs.push(req);
      }
    });
    return uniqueReqs.sort((a, b) => (a.users?.name || "").localeCompare(b.users?.name || ""));
  }, [requests, selectedDateStr]);

  useEffect(() => {
    if (!selectedDateStr) return;
    
    const matchedEmp = allEmployees.find(e => e.id === targetUserId);
    if (matchedEmp) {
      setEmpSearchTerm(`${matchedEmp.name} • ${matchedEmp.employee_id}`);
    } else if (targetUserId === user.id) {
      setEmpSearchTerm(`${user.name} • ${user.employeeCode || ''}`);
    } else {
      setEmpSearchTerm('');
    }
    
=======
    if (isAdmin) fetchEmployees();
  }, [user.id, currentDate]);

  useEffect(() => {
    if (!selectedDateStr) return;
    
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
    if (currentSelectedRequest) {
        setStartTime(currentSelectedRequest.start_time);
        setEndTime(currentSelectedRequest.end_time);
        setReason(currentSelectedRequest.reason || '');
        setEditingRequestId(currentSelectedRequest.id);
    } else {
<<<<<<< HEAD
        const dayOfWeek = getDayOfWeek(selectedDateStr);
=======
        const dateObj = new Date(selectedDateStr);
        const dayOfWeek = dateObj.getDay(); 
        
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
        const defaultIsWorking = dayOfWeek !== 0 && dayOfWeek !== 6;
        const isWorkingDay = dayConfigs[selectedDateStr] ?? defaultIsWorking;

        if (isWorkingDay) {
<<<<<<< HEAD
            setStartTime(dayOfWeek === 6 ? '14:30' : '17:30');
=======
            if (dayOfWeek === 6) {
                setStartTime('14:30');
            } else {
                setStartTime('17:30');
            }
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
            setEndTime('20:00');
        } else {
            setStartTime('08:00');
            setEndTime('20:00');
        }
        setReason('');
        setEditingRequestId(null);
    }
<<<<<<< HEAD
  }, [selectedDateStr, targetUserId, currentSelectedRequest, dayConfigs, allEmployees, user]);

  const fetchRequests = async () => {
    setLoading(true);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    
    // Fetch +/- 1 month to handle transitions smoothly
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    
    const filterStart = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
    const filterEnd = `${nextYear}-${String(nextMonth).padStart(2, '0')}-31`;

    try {
      console.log(`[Overtime] Fetching requests from ${filterStart} to ${filterEnd}`);
      const { data, error } = await supabase
          .from('ot_requests')
          .select('*, users(employee_id, name)')
          .gte('date', filterStart)
          .lte('date', filterEnd)
          .order('date', { ascending: false })
          .limit(2000);
      if (error) throw error;
      if (data) {
        console.log(`[Overtime] Fetched ${data.length} requests.`);
        setRequests(data as OvertimeRequest[]);
      }
    } catch (err: any) {
      console.error("[Overtime] Fetch error:", err);
=======
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
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    const { data } = await supabase.from('users').select('*').order('name');
    if (data) setAllEmployees(data as Employee[]);
  };

<<<<<<< HEAD
  const fetchDutyData = async () => {
    try {
      const [groupsData, schedData] = await Promise.all([
        dutyService.getGroups(),
        dutyService.getSchedule()
      ]);
      setDutyGroups(groupsData);
      setDutySchedule(schedData);
      const storedStart = localStorage.getItem('v1_duty_rotation_start_date');
      setRotationStartDate(storedStart);
    } catch (e) {
      console.error("Error loading duty roster data", e);
    }
  };

=======
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
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
<<<<<<< HEAD
        console.log("Updating day config:", { selectedDateStr, status });
        const { error } = await supabase.from('day_configs').upsert({ date: selectedDateStr, is_working_day: status });
        if (error) throw error;
        setDayConfigs(prev => ({ ...prev, [selectedDateStr]: status }));
        setMessage(`Đã lưu: ${status ? 'Ngày đi làm' : 'Ngày nghỉ'}`);
        setTimeout(() => setMessage(null), 2000);
    } catch (err: any) {
        console.error("Day config error:", err);
        setMessage("Lỗi: " + (err.message || "Không rõ nguyên nhân"));
        setTimeout(() => setMessage(null), 3000);
=======
        const { error } = await supabase.from('day_configs').upsert({ date: selectedDateStr, is_working_day: status });
        if (error) throw error;
        setDayConfigs(prev => ({ ...prev, [selectedDateStr]: status }));
    } catch (err: any) {
        alert("Lỗi cập nhật: " + err.message);
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
    } finally {
        setIsConfigUpdating(false);
    }
  };

  const calculateHours = (start: string, end: string, dateStr: string) => {
    if (!dateStr || !start || !end) return 0;
    const s = timeToNumber(start);
<<<<<<< HEAD
    const e = timeToNumber(end);
    const diff = e - s;
    if (diff <= 0) return 0;
    
    const dayOfWeek = getDayOfWeek(dateStr);
    const defaultIsWorking = dayOfWeek !== 0 && dayOfWeek !== 6;
    const isWorkDay = dayConfigs[dateStr] ?? defaultIsWorking;
    
    let ded = 0;
    if (diff > 8) ded = 1.0;
    else if (isWorkDay) {
        if (diff > 5) ded = 0.5;
    } else {
        if (diff > 4) ded = 0.5;
    }
=======
    const e = Math.min(timeToNumber(end), 20.0);
    const diff = e - s;
    if (diff <= 0) return 0;
    
    const dateObj = new Date(dateStr);
    const defaultIsWorking = dateObj.getDay() !== 0 && dateObj.getDay() !== 6;
    const isWorkDay = dayConfigs[dateStr] ?? defaultIsWorking;
    
    let ded = 0;
    if (diff >= 8) ded = 1.0;
    else if (diff > 4 && (!isWorkDay || diff > 5)) ded = 0.5;
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
    return parseFloat(Math.max(0, diff - ded).toFixed(2));
  };

  const calculatedHours = useMemo(() => calculateHours(startTime, endTime, selectedDateStr), [startTime, endTime, selectedDateStr, dayConfigs]);

<<<<<<< HEAD
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting OT:", { selectedDateStr, startTime, endTime, calculatedHours });
    if (calculatedHours <= 0) return alert(`Giờ làm không hợp lệ: [${calculatedHours}h]. Vui lòng kiểm tra lại khung giờ bắt đầu/kết thúc.`);
    
    setIsSubmitting(true);
    try {
      if (isMultiSelectMode && selectedDates.length > 1) {
        console.log(`[Overtime] Bulk registering for dates:`, selectedDates);
        
        const promises = selectedDates.map(async (dateItem) => {
          const hrs = calculateHours(startTime, endTime, dateItem);
          if (hrs <= 0) return; 
          
          const existingReq = requests.find(r => isSameDay(r.date, dateItem) && r.user_id === targetUserId);
          const finalId = existingReq?.id;
          
          const payload = {
              user_id: targetUserId, 
              date: dateItem, 
              start_time: startTime,
              end_time: endTime, 
              total_hours: hrs, 
              reason: reason.trim(), 
              status: 'approved' 
          };
          
          if (finalId) {
            return supabase.from('ot_requests').update(payload).eq('id', finalId);
          } else {
            return supabase.from('ot_requests').insert([payload]);
          }
        });
        
        const results = await Promise.all(promises);
        const firstError = results.find(res => res && res.error);
        if (firstError && firstError.error) {
          throw new Error(firstError.error.message);
        }
        
        setMessage(`Đăng ký thành công ${selectedDates.length} ngày!`);
        setSelectedDates([]);
        setIsMultiSelectMode(false);
      } else {
        const targetDate = selectedDateStr;
        const { data: dbExistingData, error: checkError } = await supabase
          .from('ot_requests')
          .select('id')
          .eq('user_id', targetUserId)
          .eq('date', targetDate);

        if (checkError) console.error("Error checking existing request:", checkError);
        
        const dbExisting = dbExistingData && dbExistingData.length > 0 ? dbExistingData[0] : null;
        const finalEditingId = editingRequestId || dbExisting?.id;
        console.log("Final editing ID:", finalEditingId);

        const payload = {
            user_id: targetUserId, 
            date: targetDate, 
            start_time: startTime,
            end_time: endTime, 
            total_hours: calculatedHours, 
            reason: reason.trim(), 
            status: 'approved' 
        };

        console.log("[Overtime] Submitting payload:", payload);
        let res;
        if (finalEditingId) {
          res = await supabase.from('ot_requests').update(payload).eq('id', finalEditingId);
        } else {
          res = await supabase.from('ot_requests').insert([payload]);
        }

        if (res.error) {
          console.error("[Overtime] Supabase error detail:", res.error);
          throw new Error(res.error.message || "Lỗi database");
        }
        
        setMessage(finalEditingId ? "Cập nhật thành công!" : "Đăng ký thành công!");
      }

      window.dispatchEvent(new CustomEvent('refresh-counts'));
      setTimeout(() => {
        setMessage(null);
        setIsModalOpen(false);
      }, 1500);
      
      await fetchRequests();
    } catch (err: any) {
        console.error("Submit error:", err);
        setMessage("Lỗi: " + (err.message || "Không rõ nguyên nhân"));
        setTimeout(() => setMessage(null), 3000);
=======
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
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
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

<<<<<<< HEAD
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
    if (isMultiSelectMode) {
      if (selectedDates.includes(dateStr)) {
        setSelectedDates(prev => prev.filter(d => d !== dateStr));
      } else {
        setSelectedDates(prev => [...prev, dateStr]);
      }
    } else {
      setSelectedDateStr(dateStr);
      setTargetUserId(user.id);
      setIsModalOpen(true);
      setIsListExpanded(false); 
    }
  };

  const myStats = useMemo(() => {
    const my = requests.filter(r => r.user_id === user.id && r.date.includes(currentMonthStr));
=======
  const handleDateClick = (dateStr: string, dateObj: Date) => {
    setSelectedDateStr(dateStr);
    setTargetUserId(user.id);
    setShowColleagueDetails(false);
    setIsModalOpen(true);
  };

  const myStats = useMemo(() => {
    const my = requests.filter(r => r.user_id === user.id && r.date.startsWith(currentMonthStr));
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
    const total = my.filter(r => r.status === 'approved').reduce((sum, r) => sum + Number(r.total_hours || 0), 0);
    const trend = Array.from({length: getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth())}, (_, i) => {
        const d = i + 1;
        const dStr = `${currentMonthStr}-${String(d).padStart(2, '0')}`;
<<<<<<< HEAD
        const dayReq = my.find(r => isSameDay(r.date, dStr));
        return { day: d, hours: dayReq?.total_hours || 0 };
    });
    return { total, count: my.length, pending: my.filter(r => r.status === 'pending').length, trend };
  }, [requests, user.id, currentMonthStr, currentDate]);

  const teamMonthlyStats = useMemo(() => {
    const monthlyApproved = requests.filter(r => r.date.includes(currentMonthStr) && r.status === 'approved');
    const uniqueUserIds = new Set(monthlyApproved.map(r => r.user_id));
    const totalHours = monthlyApproved.reduce((sum, r) => sum + Number(r.total_hours || 0), 0);
    return { totalHours, activeMembers: uniqueUserIds.size };
  }, [requests, currentMonthStr]);

  const topRankings = useMemo(() => {
    const employeeMap: Record<string, { name: string; hours: number; count: number }> = {};
    const monthlyApproved = requests.filter(r => r.date.includes(currentMonthStr) && r.status === 'approved');
    monthlyApproved.forEach(req => {
        const id = req.user_id;
        if (!employeeMap[id]) employeeMap[id] = { name: req.users?.name || 'Ẩn danh', hours: 0, count: 0 };
        employeeMap[id].hours = Number((employeeMap[id].hours + Number(req.total_hours || 0)).toFixed(2));
=======
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
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
        employeeMap[id].count += 1;
    });
    return Object.values(employeeMap).sort((a, b) => b.hours - a.hours).slice(0, 10);
  }, [requests, currentMonthStr]);

<<<<<<< HEAD
  const targetedRegistrations = useMemo(() => {
    const dayReqs = requests.filter(r => isSameDay(r.date, statsViewDate));
    const uniqueMap = new Map();
    dayReqs.forEach(r => uniqueMap.set(r.user_id, r));
    return Array.from(uniqueMap.values()).sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [requests, statsViewDate]);

  const myDutyDaysThisMonth = useMemo(() => {
    return dutySchedule.filter(s => {
      if (!s.date.includes(currentMonthStr)) return false;
      const group = dutyGroups.find(g => g.id === s.group_id);
      return group && group.member_ids?.includes(user?.id);
    });
  }, [dutySchedule, dutyGroups, currentMonthStr, user?.id]);
=======
  const todayRegistrations = useMemo(() => {
    return requests.filter(r => r.date === todayStr).sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [requests]);
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9

  const renderCalendarDays = () => {
    const days = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = getFirstDayOfMonth(year, month);
    const startOffset = firstDay === 0 ? 6 : firstDay - 1; 
    const totalDays = getDaysInMonth(year, month);

    for (let i = 0; i < startOffset; i++) {
<<<<<<< HEAD
        days.push(<div key={`empty-${i}`} className="h-16 md:h-32 bg-slate-50/10 border border-slate-100"></div>);
=======
        days.push(<div key={`empty-${i}`} className="h-14 md:h-32 bg-gray-50/50 border border-gray-100/50 opacity-40"></div>);
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
    }

    for (let d = 1; d <= totalDays; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
<<<<<<< HEAD
        const dayRequestsLocal = requests.filter(r => isSameDay(r.date, dateStr));
        const uniqueUserIds = new Set(dayRequestsLocal.map(r => r.user_id));
        const myRequest = dayRequestsLocal.find(r => r.user_id === user.id);
        const isToday = todayStr === dateStr;
        const isPast = dateStr < todayStr;
        const dayOfWeek = getDayOfWeek(dateStr);
        const isActuallyWorking = dayConfigs[dateStr] ?? (dayOfWeek !== 0 && dayOfWeek !== 6);
        const isSelectedInMulti = selectedDates.includes(dateStr);

        const dayDutyScheduled = dutySchedule.find(s => s.date === dateStr);
        const dayAssignedGroup = dayDutyScheduled ? dutyGroups.find(g => g.id === dayDutyScheduled.group_id) : null;
        const isMyDutyDay = !!(dayAssignedGroup && dayAssignedGroup.member_ids?.includes(user?.id));
        const isRotationStart = rotationStartDate === dateStr;
        
        days.push(
            <div 
                key={d} 
                onClick={() => handleDateClick(dateStr)}
                className={`h-16 md:h-32 border p-1 md:p-2 relative transition-all cursor-pointer group flex flex-col 
                  ${isToday 
                    ? (isMyDutyDay 
                        ? 'bg-sky-50/80 hover:bg-sky-100/90 ring-2 ring-red-500 border-sky-400 shadow-[0_0_14px_rgba(239,68,68,0.4)] z-10'
                        : 'bg-sky-50/80 hover:bg-sky-100/90 ring-2 ring-sky-500 border-sky-400 shadow-[0_0_14px_rgba(14,165,233,0.45)] z-10'
                      )
                    : (isMyDutyDay ? 'bg-red-50/10 ring-2 ring-red-500 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)] hover:shadow-[0_0_16px_rgba(239,68,68,0.55)] z-10' : 'bg-white hover:bg-slate-50 border-slate-100')
                  } 
                  ${isSelectedInMulti ? 'ring-2 ring-indigo-600 bg-indigo-50/15 border-indigo-200 shadow-md scale-[0.98] z-20' : ''}
                  ${isPast && !isToday ? 'opacity-80' : 'opacity-100'}`}
            >
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] md:text-[11px] font-bold ${isToday ? 'bg-sky-600 text-white w-3.5 h-3.5 md:w-5 md:h-5 rounded-md flex items-center justify-center shadow-sm' : 'text-slate-500'}`}>
                            {d}
                        </span>
                        {isToday && (
                          <span className="text-[6px] md:text-[8px] font-black px-1.5 py-0.5 rounded bg-sky-100 text-sky-700 uppercase tracking-wider animate-pulse shrink-0">Hôm nay</span>
                        )}
                        {isMultiSelectMode && (
                            <div className={`w-3 h-3 md:w-4.5 md:h-4.5 rounded border flex items-center justify-center transition-colors ${isSelectedInMulti ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white group-hover:border-indigo-400'}`}>
                                {isSelectedInMulti && <Check className="w-2 h-2 md:w-3 md:h-3 stroke-[3px]" />}
                            </div>
                        )}
                    </div>
                    {!isActuallyWorking && (
                      <span className="text-[6px] md:text-[7px] font-black px-1 py-0.5 rounded bg-rose-50 text-rose-500 uppercase">NGÀY NGHỈ</span>
                    )}
                </div>
                
                <div className="flex-1 flex flex-col justify-start gap-0.5 md:gap-1 overflow-hidden mt-0.5">
                    {dayAssignedGroup && (() => {
                      const groupMembers = dayAssignedGroup.member_ids
                        ? allEmployees.filter(emp => dayAssignedGroup.member_ids.includes(emp.id))
                        : [];
                      
                      const getShortName = (fullName: string) => {
                        if (!fullName) return '';
                        const parts = fullName.trim().split(/\s+/);
                        return parts[parts.length - 1];
                      };

                      const shortMemberNames = groupMembers.map(m => m.id === user?.id ? "Bạn" : getShortName(m.name)).join(', ');
                      const fullMemberNames = groupMembers.map(m => m.id === user?.id ? "Bạn" : m.name).join(', ');
                      
                      return (
                        <div className="flex flex-col gap-0.5">
                          {isMyDutyDay ? (
                            <div className="w-fit flex items-center gap-0.5 md:gap-1 bg-red-600 text-white px-1 py-0.5 rounded-md shrink-0 shadow-sm animate-pulse border border-red-500">
                              <Sparkles className="w-1.5 h-1.5 md:w-2 md:h-2 text-white animate-spin" style={{ animationDuration: '3s' }} />
                              <span className="text-[5.5px] md:text-[6.5px] font-black truncate uppercase leading-none">BẠN TRỰC NHẬT</span>
                            </div>
                          ) : (
                            <div className="w-fit flex items-center gap-0.5 md:gap-1 bg-amber-50/15 text-amber-700 border border-amber-500/20 px-1 py-0.5 rounded-md shrink-0">
                              <Sparkles className="w-1.5 h-1.5 md:w-2 md:h-2 text-amber-500 animate-pulse" />
                              <span className="text-[5.5px] md:text-[6.5px] font-extrabold truncate uppercase leading-none">{dayAssignedGroup.name}</span>
                            </div>
                          )}
                          {shortMemberNames && (
                            <span 
                              className={`text-[8px] md:text-[10px] font-extrabold truncate leading-tight mt-0.5 max-w-full ${
                                isMyDutyDay ? 'text-red-600 font-extrabold bg-red-500/10 px-1 py-0.5 rounded' : 'text-slate-500'
                              }`} 
                              title={`Thành viên trực nhật: ${fullMemberNames}`}
                            >
                              👥 {shortMemberNames}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                    {myRequest && (
                      <div className={`w-fit flex items-center gap-0.5 md:gap-1 text-white px-1 py-0.5 rounded-md shrink-0 border border-white/10 ${isTet ? 'bg-red-600' : 'bg-emerald-600'}`}>
                        <UserIcon className="w-1.5 h-1.5 md:w-2 md:h-2" />
                        <span className="text-[6px] md:text-[7px] font-black truncate uppercase leading-none">{myRequest.total_hours}h</span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-0.5 max-h-6 md:max-h-12 overflow-hidden">
                      {dayRequestsLocal.length > (myRequest ? 1 : 0) && (
                        <div className="flex -space-x-1 overflow-hidden">
                          {dayRequestsLocal.filter(r => r.user_id !== user.id).slice(0, 3).map((req, idx) => (
                            <div key={idx} className="w-3 h-3 md:w-4.5 md:h-4.5 rounded-md bg-slate-100 text-slate-500 border border-white ring-1 ring-slate-200 flex items-center justify-center shrink-0 shadow-sm" title={req.users?.name}>
                               <span className="text-[5px] md:text-[7px] font-black uppercase leading-none">{req.users?.name?.charAt(0)}</span>
                            </div>
                          ))}
                          {dayRequestsLocal.length > 4 && (
                            <div className="w-3 h-3 md:w-4.5 md:h-4.5 rounded-md bg-slate-800 text-white flex items-center justify-center shrink-0 border border-white z-10 shadow-sm">
                               <span className="text-[4px] md:text-[6px] font-black">{dayRequestsLocal.length - 4}+</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                </div>
=======
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
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
            </div>
        );
    }
    return days;
  };

  return (
<<<<<<< HEAD
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
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                       {requests.length} bản ghi được tải
                    </div>
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
                    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between p-5 md:p-6 bg-white border-b border-slate-100 gap-4">
                        <div className="flex items-center justify-between md:justify-start gap-4">
                            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth()-1, 1))} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-all"><ChevronLeft className="w-6 h-6"/></button>
                            <button onClick={() => fetchRequests()} className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-all" title="Làm mới"><RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} /></button>
                            <h3 className="text-lg md:text-xl font-extrabold text-slate-900 italic min-w-[140px] text-center">Tháng {currentDate.getMonth()+1} / {currentDate.getFullYear()}</h3>
                            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth()+1, 1))} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-all"><ChevronRight className="w-6 h-6"/></button>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            {isAdmin && (
                                <button
                                    onClick={() => setIsDutyManagerOpen(true)}
                                    className="px-4 py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all bg-amber-500 hover:bg-amber-650 text-white flex items-center justify-center gap-2 shadow-md active:scale-95"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    Thiết lập Trực nhật
                                </button>
                            )}

                            <button
                                onClick={() => {
                                    setIsMultiSelectMode(!isMultiSelectMode);
                                    setSelectedDates([]);
                                }}
                                className={`px-4 py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 border shadow-sm ${isMultiSelectMode ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-400'}`}
                            >
                                <CalendarDays className="w-4 h-4" />
                                {isMultiSelectMode ? 'Hủy chọn nhiều ngày' : 'Đăng ký nhiều ngày'}
                            </button>

                            {isMultiSelectMode && (
                                <button
                                    disabled={selectedDates.length === 0}
                                    onClick={() => {
                                        if (selectedDates.length > 0) {
                                            setSelectedDateStr(selectedDates[0]);
                                            setTargetUserId(user.id);
                                            setIsModalOpen(true);
                                            setIsListExpanded(false);
                                        }
                                    }}
                                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2"
                                >
                                    <Check className="w-4 h-4 stroke-[3px]" />
                                    Đăng ký ({selectedDates.length} ngày)
                                </button>
                            )}
                        </div>
                    </div>

                    {/* BANNER TRỰC NHẬT HÔM NAY & LỊCH TRỰC NHẬT CỦA BẠN */}
                    {(() => {
                        const todayScheduleItem = dutySchedule.find(s => s.date === todayStr);
                        const assignedGroup = todayScheduleItem ? dutyGroups.find(g => g.id === todayScheduleItem.group_id) : null;
                        const groupMembers = assignedGroup 
                            ? allEmployees.filter(emp => assignedGroup.member_ids?.includes(emp.id)).map(e => e.name).join(', ')
                            : '';
                        const isTodayMyDuty = assignedGroup && assignedGroup.member_ids?.includes(user?.id);
                        
                        return (
                            <div className="flex flex-col border-b border-slate-200">
                                {/* Banner Trực Nhật Hôm nay */}
                                <div className={`px-6 py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                                    isTodayMyDuty 
                                        ? 'bg-gradient-to-r from-rose-500/15 via-rose-500/5 to-transparent border-b border-rose-100' 
                                        : 'bg-slate-50/30'
                                }`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 ml-1 text-white rounded-xl shadow-md rotate-3 transition-transform hover:rotate-0 ${
                                            isTodayMyDuty ? 'bg-red-600 animate-bounce' : 'bg-amber-500'
                                        }`}>
                                            <Sparkles className="w-4 h-4 text-white" />
                                        </div>
                                        <div>
                                            <div className="text-[9px] text-slate-450 font-black uppercase tracking-widest leading-none">
                                                {isTodayMyDuty ? '🔥 HÔM NAY ĐẾN LƯỢT TRỰC NHẬT CỦA BẠN!' : 'Hôm nay trực nhật'}
                                            </div>
                                            <div className="text-sm font-black text-slate-900 mt-1 capitalize leading-tight">
                                                {assignedGroup ? (
                                                    <span className={isTodayMyDuty ? 'text-red-600 font-extrabold' : 'text-amber-650 font-extrabold'}>
                                                        {assignedGroup.name} {isTodayMyDuty && '(Nhóm của bạn)'}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 italic font-semibold">Chưa phân công nhóm trực nhật</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {assignedGroup ? (
                                        <div className="sm:text-right shrink-0">
                                            <p className="text-[9px] font-black text-slate-450 uppercase tracking-widest leading-none mb-1">Thành viên trực</p>
                                            <p className="text-xs font-bold text-slate-600 max-w-[280px] sm:max-w-md truncate">{groupMembers || 'Chưa có thành viên'}</p>
                                        </div>
                                    ) : (
                                        <span className="text-[10px] text-slate-350 font-medium">Bấm vào bất kỳ ngày nào để cấu hình nhanh</span>
                                    )}
                                </div>

                                {/* Banner thông báo các ngày trực nhật của bạn trong tháng */}
                                {myDutyDaysThisMonth.length > 0 && (
                                    <div className="bg-red-500/[0.04] px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-rose-100/50">
                                        <div className="flex items-center gap-3">
                                            <div className="p-1.5 ml-1 bg-red-50 text-red-600 border border-red-100 rounded-xl shadow-sm animate-pulse">
                                                <CalendarDays className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-red-500 font-black uppercase tracking-widest leading-none">LỊCH TRỰC CỦA BẠN</p>
                                                <p className="text-xs font-bold text-slate-700 mt-1">
                                                    Tháng {currentDate.getMonth() + 1} này bạn được phân công <span className="text-red-600 font-black underline">{myDutyDaysThisMonth.length} ngày trực nhật</span>:
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 max-w-full md:max-w-xl">
                                            {myDutyDaysThisMonth.map(s => {
                                                const dateNum = new Date(s.date).getDate();
                                                const isSDateToday = s.date === todayStr;
                                                return (
                                                    <span 
                                                        key={s.date} 
                                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm transition-all border ${
                                                            isSDateToday 
                                                                ? 'bg-red-600 text-white border-red-500 animate-pulse' 
                                                                : 'bg-white text-rose-600 border-rose-200 hover:bg-rose-55'
                                                        }`}
                                                    >
                                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                                                        Ngày {dateNum}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    <div className="grid grid-cols-7 bg-slate-50/50 text-[8px] md:text-[9px] font-bold uppercase text-slate-400 border-b border-slate-100">
                        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d, i) => (
                            <div key={d} className={`py-3 md:py-4 text-center tracking-widest ${i >= 5 ? 'text-rose-500' : ''}`}>{d}</div>
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
=======
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
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>
            )}

            {activeTab === 'stats' && (
<<<<<<< HEAD
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
=======
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
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
                    </div>
                </div>
            )}
        </div>

<<<<<<< HEAD
        {/* MODAL ĐĂNG KÝ */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-end md:items-center justify-center backdrop-blur-md animate-fade-in px-0 md:px-6">
                <div className="bg-white rounded-t-[2.5rem] md:rounded-[3rem] shadow-2xl w-full max-w-xl animate-zoom-in overflow-hidden max-h-[92vh] flex flex-col border border-white/20">
                    <div className={`${isTet ? 'bg-gradient-to-r from-red-600 to-red-800' : 'bg-gradient-to-r from-indigo-600 to-purple-800'} p-5 md:p-6 flex justify-between items-center text-white shrink-0 shadow-lg`}>
                        <div>
                            <h3 className="text-lg md:text-xl font-extrabold tracking-tight">Ghi nhận tăng ca {isMultiSelectMode && selectedDates.length > 1 ? 'nhiều ngày' : ''}</h3>
                            <p className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-70 mt-0.5">
                                {isMultiSelectMode && selectedDates.length > 1 
                                    ? `${selectedDates.length} ngày đã chọn (từ ${selectedDates.sort()[0].split('-').reverse().join('/')} đến ${selectedDates.sort()[selectedDates.length - 1].split('-').reverse().join('/')})`
                                    : `Ngày ${selectedDateStr.split('-').reverse().join('/')}`}
                            </p>
                        </div>
                        <button onClick={() => { setIsModalOpen(false); setIsEmployeeDropdownOpen(false); }} className="p-3 hover:bg-white/20 rounded-full transition-all active:scale-90"><X className="w-5 h-5"/></button>
                    </div>
                    
                    <div className="p-4 md:p-8 space-y-6 overflow-y-auto no-scrollbar pb-20 bg-slate-50 flex-1 relative">
                        {message && (
                          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm animate-fade-in">
                            <div className="text-center space-y-4 p-8">
                              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto animate-bounce shadow-lg">
                                <Check className="w-10 h-10 stroke-[3px]" />
                              </div>
                              <h3 className="text-2xl font-black text-slate-900 italic uppercase tracking-tight">{message}</h3>
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">Hệ thống đang cập nhật...</p>
                            </div>
                          </div>
                        )}

                        {/* Summary of multi-select dates */}
                        {isMultiSelectMode && selectedDates.length > 1 && (
                            <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-2">
                                <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-700">Các ngày đăng ký ({selectedDates.length} ngày)</h4>
                                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto no-scrollbar">
                                    {selectedDates.sort().map(d => (
                                        <span key={d} className="px-2.5 py-1 bg-white text-indigo-700 text-[10px] font-black rounded-lg border border-indigo-100 shadow-sm uppercase leading-none">
                                            {d.split('-').reverse().join('/')}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!isMultiSelectMode && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between ml-1">
                                    <h4 className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">Danh sách OT trong ngày</h4>
                                    {isAdmin && (
                                        <button 
                                          type="button"
                                          onClick={() => {
                                            setTargetUserId(user.id);
                                            setEditingRequestId(null);
                                          }}
                                          className="text-[8px] font-black text-indigo-600 uppercase px-3 py-1.5 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1"
                                        >
                                          + Thêm mới
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-32 overflow-y-auto no-scrollbar p-0.5">
                                    {dayRequestsInModal.length === 0 ? (
                                        <div className="col-span-full py-6 text-center bg-white/50 rounded-2xl border-2 border-dashed border-slate-200 text-[9px] font-bold text-slate-400 uppercase">Chưa có ai đăng ký</div>
                                    ) : (
                                        dayRequestsInModal.map((r) => (
                                            <div 
                                                key={r.id} 
                                                onClick={() => isAdmin && setTargetUserId(r.user_id)}
                                                className={`flex items-center justify-between p-3 bg-white rounded-xl border shadow-sm transition-all group 
                                                    ${isAdmin ? 'cursor-pointer hover:border-indigo-500 hover:shadow-md active:scale-95' : ''}
                                                    ${r.user_id === targetUserId ? 'ring-2 ring-indigo-500 border-indigo-100 bg-indigo-50/10' : 'border-slate-100'}`}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-[10px] text-white shadow-sm transition-transform group-hover:scale-110 ${isTet ? 'bg-red-600' : 'bg-indigo-600'}`}>{r.users?.name?.charAt(0)}</div>
                                                    <div className="flex flex-col">
                                                        <p className={`text-[11px] font-bold uppercase truncate leading-none ${r.user_id === targetUserId ? 'text-indigo-600' : 'text-slate-900'}`}>{r.users?.name}</p>
                                                        {isAdmin && r.user_id === targetUserId && <span className="text-[7px] font-black text-indigo-400 uppercase mt-0.5 flex items-center gap-1"><Edit className="w-2 h-2" /> Đang sửa</span>}
                                                    </div>
                                                </div>
                                                <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded-lg transition-colors ${r.user_id === targetUserId ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{r.total_hours}h</div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {isAdmin && !isMultiSelectMode && (
                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                                <div className="flex items-center gap-2">
                                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                                    <h4 className="text-[9px] font-extrabold uppercase tracking-widest text-slate-900">Thiết lập ngày công (Admin)</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-3 relative">
                                    <button 
                                        type="button"
                                        onClick={() => updateDayWorkingStatus(false)} 
                                        className={`py-3 rounded-xl border-2 transition-all font-black text-[9px] uppercase tracking-widest shadow-sm ${ (isSelectedDayWorking === false) ? 'bg-rose-600 text-white border-rose-300' : 'bg-white text-slate-400 border-slate-100 hover:border-rose-200' }`}
                                    >
                                        NGÀY NGHỈ
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => updateDayWorkingStatus(true)} 
                                        className={`py-3 rounded-xl border-2 transition-all font-black text-[9px] uppercase tracking-widest shadow-sm ${ (isSelectedDayWorking === true) ? (isTet ? 'bg-red-600 border-red-300 text-white' : 'bg-indigo-600 border-indigo-300 text-white') : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-200' }`}
                                    >
                                        NGÀY ĐI LÀM
                                    </button>
                                    {isConfigUpdating && (
                                        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
                                            <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                                        </div>
                                    )}
=======
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
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
                                </div>
                            </div>
                        )}

<<<<<<< HEAD
                        {!isMultiSelectMode ? (
                            <div className={`p-4 rounded-2xl border flex items-center justify-between ${isSelectedDayWorking ? 'bg-indigo-50/30 border-indigo-100 text-indigo-700' : 'bg-rose-50/30 border-rose-100 text-rose-700'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelectedDayWorking ? 'bg-indigo-100 text-indigo-600' : 'bg-rose-100 text-rose-600'}`}>
                                        <CalendarIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.05em]">{isSelectedDayWorking ? 'Ngày đi làm' : 'Ngày nghỉ / Lễ'}</p>
                                        <p className="text-[9px] font-medium opacity-60 italic leading-tight">{isSelectedDayWorking ? 'Tính giờ sau ca' : 'Tính toàn bộ thời gian'}</p>
                                    </div>
                                </div>
                                <div className={`px-3 py-1.5 rounded-lg text-[9px] font-black border bg-white ${isSelectedDayWorking ? 'border-indigo-200' : 'border-rose-200'}`}>
                                    {isSelectedDayWorking ? 'OT SAU CA' : 'OT CẢ NGÀY'}
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 rounded-2xl border flex items-center justify-between bg-slate-50 border-slate-200 text-slate-700">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100 text-slate-600">
                                        <CalendarIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.05em]">Đăng ký nhiều ngày</p>
                                        <p className="text-[9px] font-medium opacity-60 italic leading-tight">Mỗi ngày sẽ tự động tính toán tổng giờ làm dựa trên ngày thường hay lễ</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {(!isMultiSelectMode || selectedDates.length <= 1) && (
                            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 mb-6">
                                <p className="text-[10px] font-bold text-amber-800 uppercase flex items-center gap-2 mb-1">
                                    <Info className="w-3 h-3" /> Cách tính giờ ({isSelectedDayWorking ? 'Sau ca' : 'Cả ngày'})
                                </p>
                                <p className="text-[9px] text-amber-700 leading-relaxed">
                                    {isSelectedDayWorking 
                                        ? "Ngày đi làm: OT sau 17:30 (T2-T6) hoặc 14:30 (T7). Nếu làm > 5h trừ 0.5h, > 8h trừ 1h."
                                        : "Ngày nghỉ: Tính từ lúc bắt đầu đến kết thúc. Nếu làm > 4h trừ 0.5h, > 8h trừ 1h."}
                                </p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="bg-white p-5 md:p-6 rounded-[2rem] border border-slate-100 shadow-xl space-y-5">
                                {isAdmin && (
                                    <div className="space-y-2 relative">
                                        <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Nhân sự thực hiện</label>
                                        <div className="flex flex-col gap-2 relative">
                                            <div className="relative">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                                <input 
                                                    type="text" 
                                                    placeholder="Tìm tên hoặc mã nhân viên..."
                                                    value={empSearchTerm}
                                                    onChange={(e) => {
                                                        setEmpSearchTerm(e.target.value);
                                                        setIsEmployeeDropdownOpen(true);
                                                    }}
                                                    onFocus={() => {
                                                        setIsEmployeeDropdownOpen(true);
                                                    }}
                                                    className="w-full pl-10 pr-16 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all text-slate-900 shadow-sm"
                                                />
                                                {empSearchTerm && (
                                                    <button 
                                                        type="button"
                                                        onClick={() => {
                                                            setEmpSearchTerm('');
                                                            setIsEmployeeDropdownOpen(true);
                                                        }}
                                                        className="absolute right-10 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                )}
                                                <button 
                                                    type="button"
                                                    onClick={() => setIsEmployeeDropdownOpen(!isEmployeeDropdownOpen)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-transform active:scale-95"
                                                >
                                                    <ChevronDown className={`w-4 h-4 transition-transform ${isEmployeeDropdownOpen ? 'rotate-180' : ''}`} />
                                                </button>
                                            </div>
                                            
                                            {/* DROPDOWN OPTIONS LIST */}
                                            {isEmployeeDropdownOpen && (
                                                <div className="absolute top-[100%] left-0 w-full bg-white border border-slate-200 rounded-2xl shadow-xl mt-1.5 z-[150] max-h-56 overflow-y-auto no-scrollbar py-2 animate-zoom-in">
                                                    {allEmployees.filter(emp => 
                                                        emp.name.toLowerCase().includes(empSearchTerm.toLowerCase()) || 
                                                        emp.employee_id.toLowerCase().includes(empSearchTerm.toLowerCase())
                                                    ).length === 0 ? (
                                                        <div className="px-4 py-6 text-center text-slate-400 text-[10px] font-bold uppercase tracking-wider">Không tìm thấy thành viên</div>
                                                    ) : (
                                                        allEmployees
                                                            .filter(emp => 
                                                                emp.name.toLowerCase().includes(empSearchTerm.toLowerCase()) || 
                                                                emp.employee_id.toLowerCase().includes(empSearchTerm.toLowerCase())
                                                            )
                                                            .map(emp => (
                                                                <button
                                                                    key={emp.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setTargetUserId(emp.id);
                                                                        setEmpSearchTerm(`${emp.name} • ${emp.employee_id}`);
                                                                        setIsEmployeeDropdownOpen(false);
                                                                    }}
                                                                    className={`w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors flex items-center justify-between border-b border-slate-50 last:border-none
                                                                        ${emp.id === targetUserId ? 'bg-indigo-50/40 text-indigo-700 font-extrabold' : 'text-slate-700 font-bold'}`}
                                                                >
                                                                    <div className="flex items-center gap-2.5">
                                                                        <div className="w-6 h-6 rounded bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-black uppercase">{emp.name.charAt(0)}</div>
                                                                        <div className="flex flex-col">
                                                                            <span className="text-[11px] uppercase leading-tight">{emp.name}</span>
                                                                            <span className="text-[8px] text-slate-400 tracking-wider font-extrabold">{emp.employee_id}</span>
                                                                        </div>
                                                                    </div>
                                                                    {emp.id === targetUserId && <Check className="w-4 h-4 text-indigo-600 stroke-[3px]" />}
                                                                </button>
                                                            ))
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3 md:gap-4">
                                    <div className="space-y-1.5">
                                        <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Giờ bắt đầu</label>
                                        <input type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full px-3.5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-500 transition-all shadow-inner"/>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Giờ kết thúc</label>
                                        <input type="time" required value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full px-3.5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-500 transition-all shadow-inner"/>
                                    </div>
                                </div>

                                <div className="space-y-2.5">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Nội dung công việc (Không bắt buộc)</label>
                                        <div className={`text-[9px] font-black px-2.5 py-1 rounded-lg border shadow-sm flex items-center gap-1.5 ${isTet ? 'bg-red-50 text-red-600 border-red-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>
                                            <Timer className="w-3 h-3" />
                                            {isMultiSelectMode && selectedDates.length > 1 ? 'Tính theo ngày thực tế' : `${calculatedHours.toFixed(1)}h thực lĩnh`}
                                        </div>
                                    </div>
                                    <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] md:text-sm h-20 resize-none outline-none font-medium text-slate-900 focus:bg-white focus:border-indigo-500 transition-all shadow-inner" placeholder="Mô tả công việc thực hiện..."/>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    {editingRequestId && !isMultiSelectMode && (isAdmin || targetUserId === user.id) && (
                                        <button type="button" onClick={() => setIsConfirmCancelOpen(true)} className="p-4 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all active:scale-90 border border-rose-100"><Trash2 className="w-5 h-5"/></button>
                                    )}
                                    <button type="submit" disabled={isSubmitting || (calculatedHours <= 0 && !isMultiSelectMode)} className={`flex-1 py-4 text-white font-bold rounded-xl shadow-lg text-[10px] tracking-widest uppercase active:scale-[0.98] disabled:opacity-50 transition-all ${isTet ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto"/> : (editingRequestId && !isMultiSelectMode ? 'Lưu thay đổi' : 'Xác nhận đăng ký')}
                                    </button>
                                </div>
                                {calculatedHours <= 0 && startTime && endTime && startTime >= endTime && !isMultiSelectMode && (
                                    <p className="text-[8px] font-bold text-rose-500 uppercase text-center mt-1 italic">Giờ kết thúc phải lớn hơn giờ bắt đầu</p>
                                )}
                                {calculatedHours <= 0 && startTime && endTime && startTime < endTime && !isMultiSelectMode && (
                                    <p className="text-[8px] font-bold text-rose-500 uppercase text-center mt-1 italic">Sau khi trừ giờ nghỉ, tổng giờ làm phải &gt; 0</p>
                                )}
                            </div>
=======
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
                                        <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-[11px] md:text-sm h-20 md:h-32 resize-none outline-none font-medium" placeholder="Mô tả công việc (không bắt buộc)..."/>
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
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
                        </form>
                    </div>
                </div>
            </div>
        )}

<<<<<<< HEAD
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
=======
        {isConfirmCancelOpen && (
            <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-6 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-[1.5rem] shadow-2xl w-full max-w-[280px] overflow-hidden animate-zoom-in p-5 text-center border border-gray-100">
                    <div className="w-10 h-10 bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3 rounded-xl"><Trash2 className="w-5 h-5"/></div>
                    <h3 className="text-sm font-black text-gray-900 mb-1 uppercase">Xóa đơn này?</h3>
                    <p className="text-[9px] text-gray-500 font-bold uppercase opacity-70 mb-5 leading-tight">Hành động này không thể hoàn tác.</p>
                    <div className="space-y-2">
                        <button onClick={handleCancelRequest} disabled={isDeleting} className="w-full py-2.5 bg-rose-600 text-white font-black rounded-xl text-[9px] uppercase active:scale-95 shadow-lg shadow-rose-100">Xác nhận xóa</button>
                        <button onClick={() => setIsConfirmCancelOpen(false)} className="w-full py-2.5 bg-white text-gray-400 font-black rounded-xl border border-gray-200 text-[9px] uppercase active:scale-95">Hủy</button>
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
                    </div>
                </div>
            </div>
        )}
<<<<<<< HEAD

        <DutyManager
            isOpen={isDutyManagerOpen}
            onClose={() => setIsDutyManagerOpen(false)}
            allEmployees={allEmployees}
            dayConfigs={dayConfigs}
            onScheduleUpdated={fetchDutyData}
        />

        <div className="flex justify-center gap-16 py-12 opacity-10 select-none pointer-events-none">
           {isTet ? Array.from({length: 4}).map((_, i) => <Gift key={i} className="w-12 h-12 text-yellow-600" />) : Array.from({length: 4}).map((_, i) => <Snowflake key={i} className="w-12 h-12 text-blue-600" />)}
        </div>
=======
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
    </div>
  );
};
