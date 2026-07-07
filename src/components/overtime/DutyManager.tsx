import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { DutyGroup, DutySchedule, Employee } from '../../../types';
import { dutyService } from '../../services/dutyService';
import { 
  Users, Calendar, Sparkles, X, Plus, Trash2, Check, 
  RefreshCw, Shuffle, Save, Info, AlertTriangle, ArrowRight, CornerDownRight,
  CloudDownload, FileText, Database, Link2, Loader2
} from 'lucide-react';

interface DutyManagerProps {
  isOpen: boolean;
  onClose: () => void;
  allEmployees: Employee[];
  dayConfigs: Record<string, boolean>;
  onScheduleUpdated: () => void;
}

export const DutyManager: React.FC<DutyManagerProps> = ({ 
  isOpen, 
  onClose, 
  allEmployees, 
  dayConfigs,
  onScheduleUpdated 
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'groups' | 'auto' | 'manual'>('groups');
  const [groups, setGroups] = useState<DutyGroup[]>([]);
  const [schedule, setSchedule] = useState<DutySchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Google Sheets import states
  const [sheetUrl, setSheetUrl] = useState('https://docs.google.com/spreadsheets/d/1mXZjv6d1QwTsc_3Zi3wDzJnZCS_YuCKU/edit?gid=798278847#gid=798278847');
  const [sheetImportType, setSheetImportType] = useState<'groups' | 'schedule'>('groups');
  const [pastedData, setPastedData] = useState('');
  const [sheetFetchLoading, setSheetFetchLoading] = useState(false);
  const [parsedPreviewRows, setParsedPreviewRows] = useState<any[][] | null>(null);
  const [sheetSuccessMessage, setSheetSuccessMessage] = useState<string | null>(null);
  const [sheetErrorMessage, setSheetErrorMessage] = useState<string | null>(null);
  const [sheetInfo, setSheetInfo] = useState<{ rowCount: number; colCount: number } | null>(null);
  
  const [matchedGroupsToImport, setMatchedGroupsToImport] = useState<{ id?: string; name: string; member_ids: string[]; matchedNames: string[]; unmatchedNames: string[] }[]>([]);
  const [matchedSchedulesToImport, setMatchedSchedulesToImport] = useState<{ date: string; group_id: string; groupName: string }[]>([]);

  // Group editing state
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupFormName, setGroupFormName] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');

  // Auto-schedule state
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [autoRotateGroupIds, setAutoRotateGroupIds] = useState<string[]>([]);
  const [workingDaysOnly, setWorkingDaysOnly] = useState(true);

  // Manual assignment state
  const [manualDate, setManualDate] = useState(todayStr);
  const [manualGroupId, setManualGroupId] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [gData, sData] = await Promise.all([
        dutyService.getGroups(),
        dutyService.getSchedule()
      ]);
      setGroups(gData);
      setSchedule(sData);
      
      // Auto pre-select groups for rotation if empty
      if (gData.length > 0) {
        setAutoRotateGroupIds(gData.map(g => g.id));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleEditGroupClick = (group: DutyGroup) => {
    setEditingGroupId(group.id);
    setGroupFormName(group.name);
    setSelectedMemberIds(group.member_ids || []);
    setMemberSearchTerm('');
  };

  const handleAddNewGroupClick = () => {
    const nextGroupNum = groups.length + 1;
    setEditingGroupId(`group-new-${Date.now()}`);
    setGroupFormName(`Nhóm trực ${nextGroupNum}`);
    setSelectedMemberIds([]);
    setMemberSearchTerm('');
  };

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa nhóm "${groupName}" không?`)) {
      const remainingGroups = groups.filter(g => g.id !== groupId);
      setLoading(true);
      const success = await dutyService.deleteGroup(groupId, remainingGroups);
      setLoading(false);
      if (success) {
        setGroups(remainingGroups);
        showToast(`Đã xóa nhóm "${groupName}" thành công.`);
        onScheduleUpdated();
      } else {
        alert('Lỗi khi xóa nhóm trực nhật.');
      }
    }
  };

  const handleSaveGroup = async () => {
    if (!groupFormName.trim()) {
      alert('Vui lòng nhập tên nhóm');
      return;
    }

    let updatedGroups: DutyGroup[];
    const isNew = !groups.some(g => g.id === editingGroupId);

    if (isNew) {
      const newGroup: DutyGroup = {
        id: editingGroupId || `group-${Date.now()}`,
        name: groupFormName.trim(),
        member_ids: selectedMemberIds
      };
      updatedGroups = [...groups, newGroup];
    } else {
      updatedGroups = groups.map(g => {
        if (g.id === editingGroupId) {
          return {
            ...g,
            name: groupFormName.trim(),
            member_ids: selectedMemberIds
          };
        }
        return g;
      });
    }

    setLoading(true);
    const success = await dutyService.saveGroups(updatedGroups);
    setLoading(false);
    
    if (success) {
      setGroups(updatedGroups);
      setEditingGroupId(null);
      showToast('Đã lưu thông tin nhóm trực nhật.');
      onScheduleUpdated();
    } else {
      alert('Lỗi lưu thông tin nhóm trực nhật.');
    }
  };

  const handleToggleMember = (empId: string) => {
    setSelectedMemberIds(prev => {
      if (prev.includes(empId)) {
        return prev.filter(id => id !== empId);
      } else {
        return [...prev, empId];
      }
    });
  };

  const handleAutoGenerate = async () => {
    if (autoRotateGroupIds.length === 0) {
      alert('Vui lòng chọn ít nhất một nhóm để xoay ca.');
      return;
    }
    if (startDate > endDate) {
      alert('Ngày bắt đầu không được lớn hơn ngày kết thúc.');
      return;
    }

    setLoading(true);
    try {
      const mergedSched = await dutyService.autoGenerateSchedule(
        startDate,
        endDate,
        autoRotateGroupIds,
        workingDaysOnly,
        dayConfigs
      );
      // Save start date of rotation to recognize it on the calendar
      localStorage.setItem('v1_duty_rotation_start_date', startDate);
      
      setSchedule(mergedSched);
      showToast(`Đã tự động xoay ca trực nhật cho ${autoRotateGroupIds.length} nhóm!`);
      onScheduleUpdated();
    } catch (e) {
      console.error(e);
      alert('Lỗi khi tự động xoay ca.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualAssign = async () => {
    setLoading(true);
    try {
      const item: DutySchedule = {
        date: manualDate,
        group_id: manualGroupId
      };
      const success = await dutyService.saveScheduleItem(item);
      if (success) {
        // reload schedule
        const sData = await dutyService.getSchedule();
        setSchedule(sData);
        showToast(`Đã cập nhật lịch trực trực nhật ngày ${manualDate.split('-').reverse().join('/')}`);
        onScheduleUpdated();
      } else {
        alert('Lỗi lưu lịch trực nhật.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const parseAndNormalizeDate = (dateStr: string): string | null => {
    if (!dateStr) return null;
    const dmyMatch = dateStr.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, '0');
      const month = dmyMatch[2].padStart(2, '0');
      const year = dmyMatch[3];
      return `${year}-${month}-${day}`;
    }
    const ymdMatch = dateStr.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
    if (ymdMatch) {
      const year = ymdMatch[1];
      const month = ymdMatch[2].padStart(2, '0');
      const day = ymdMatch[3].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
    } catch(e) {}
    return null;
  };

  const handleFetchSheet = async () => {
    setSheetFetchLoading(true);
    setSheetErrorMessage(null);
    setSheetSuccessMessage(null);
    setParsedPreviewRows(null);
    setSheetInfo(null);
    setMatchedGroupsToImport([]);
    setMatchedSchedulesToImport([]);
    
    try {
      if (!sheetUrl.trim()) {
        throw new Error('Vui lòng nhập đường dẫn Google Sheets.');
      }
      const sheetIdMatch = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (!sheetIdMatch) {
        throw new Error('Đường dẫn Google Sheets không hợp lệ. Vui lòng kiểm tra lại cấu trúc URL.');
      }
      const spreadsheetId = sheetIdMatch[1];
      
      const gidMatch = sheetUrl.match(/gid=([0-9]+)/);
      const gid = gidMatch ? gidMatch[1] : '0';
      
      const fetchUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&id=${spreadsheetId}&gid=${gid}`;
      
      console.log('Fetching sheet from:', fetchUrl);
      const res = await fetch(fetchUrl);
      if (!res.ok) {
        throw new Error(`Không thể tải trang tính. Lỗi HTTP ${res.status}. Vui lòng kiểm tra lại quyền chia sẻ.`);
      }
      
      const csvText = await res.text();
      processRawSheetData(csvText);
      setSheetSuccessMessage('Đã tải và xử lý dữ liệu từ Sheets thành công! Vui lòng kiểm tra bản xem trước bên dưới trước khi đồng ý nhập.');
    } catch (e: any) {
      console.error(e);
      setSheetErrorMessage(
        e.message || 'Không thể tải tự động do chặn bảo mật CORS hoặc trang tính đặt chế độ Riêng tư. Vui lòng chuyển cấu hình chia sẻ thành "Bất kỳ ai có liên kết đều xem được" HOẶC thử Dán Dữ Liệu Thủ Công dưới đây.'
      );
    } finally {
      setSheetFetchLoading(false);
    }
  };

  const processRawSheetData = (text: string) => {
    try {
      if (!text.trim()) {
        throw new Error('Dữ liệu rỗng.');
      }
      
      const workbook = XLSX.read(text, { type: 'string' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      if (rows.length === 0) {
        throw new Error('Không phân tích được bất kỳ dòng dữ liệu nào.');
      }
      
      setParsedPreviewRows(rows.slice(0, 8));
      
      const colCount = Math.max(...rows.map(r => r.length), 0);
      setSheetInfo({ rowCount: rows.length, colCount });
      
      if (sheetImportType === 'groups') {
        analyzeGroupsRows(rows);
      } else {
        analyzeScheduleRows(rows);
      }
    } catch (err: any) {
      console.error(err);
      setSheetErrorMessage(`Lỗi phân tích dữ liệu: ${err.message}`);
    }
  };

  const analyzeGroupsRows = (rows: any[][]) => {
    const headerRow = (rows[0] || []).map(h => String(h || '').toLowerCase().trim());
    let groupColIdx = headerRow.findIndex(h => h.includes('nhóm') || h.includes('group') || h.includes('tên'));
    let memberColIdx = headerRow.findIndex(h => h.includes('thành viên') || h.includes('nhân viên') || h.includes('member') || h.includes('danh sách') || h.includes('mã'));

    if (groupColIdx === -1) groupColIdx = 0;
    if (memberColIdx === -1) memberColIdx = 1;

    const matchedGroupsMap: typeof matchedGroupsToImport = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      
      const groupName = String(row[groupColIdx] || '').trim();
      const membersStr = String(row[memberColIdx] || '').trim();
      
      if (!groupName) continue;
      
      const rawNames = membersStr
        .split(/[,;\n/|+]/)
        .map(m => m.trim())
        .filter(m => m.length > 0);
        
      const member_ids: string[] = [];
      const matchedNames: string[] = [];
      const unmatchedNames: string[] = [];
      
      for (const name of rawNames) {
        const matchedEmp = allEmployees.find(emp => {
          const empName = emp.name.toLowerCase().trim();
          const targetName = name.toLowerCase().trim();
          const empId = emp.employee_id.toLowerCase().trim();
          
          return empName === targetName || empId === targetName || empName.includes(targetName) || targetName.includes(empName);
        });
        
        if (matchedEmp) {
          member_ids.push(matchedEmp.id);
          matchedNames.push(`${matchedEmp.name} (${matchedEmp.employee_id})`);
        } else {
          unmatchedNames.push(name);
        }
      }
      
      const existingGroup = groups.find(g => g.name.toLowerCase().trim() === groupName.toLowerCase().trim());
      
      matchedGroupsMap.push({
        id: existingGroup?.id,
        name: groupName,
        member_ids,
        matchedNames,
        unmatchedNames
      });
    }

    setMatchedGroupsToImport(matchedGroupsMap);
    setMatchedSchedulesToImport([]);
  };

  const analyzeScheduleRows = (rows: any[][]) => {
    const headerRow = (rows[0] || []).map(h => String(h || '').toLowerCase().trim());
    let dateColIdx = headerRow.findIndex(h => h.includes('ngày') || h.includes('date') || h.includes('thời gian'));
    let groupColIdx = headerRow.findIndex(h => h.includes('nhóm') || h.includes('group') || h.includes('trực'));

    if (dateColIdx === -1) dateColIdx = 0;
    if (groupColIdx === -1) groupColIdx = 1;

    const matchedScheds: typeof matchedSchedulesToImport = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      
      const dateVal = String(row[dateColIdx] || '').trim();
      const groupVal = String(row[groupColIdx] || '').trim();
      
      if (!dateVal || !groupVal) continue;
      
      const normalizedDate = parseAndNormalizeDate(dateVal);
      if (!normalizedDate) continue;
      
      const matchedGroup = groups.find(g => g.name.toLowerCase().trim() === groupVal.toLowerCase().trim());
      if (matchedGroup) {
        matchedScheds.push({
          date: normalizedDate,
          group_id: matchedGroup.id,
          groupName: matchedGroup.name
        });
      }
    }

    setMatchedSchedulesToImport(matchedScheds);
    setMatchedGroupsToImport([]);
  };

  const handleApplyImport = async () => {
    setLoading(true);
    setSheetErrorMessage(null);
    setSheetSuccessMessage(null);
    
    try {
      if (sheetImportType === 'groups') {
        if (matchedGroupsToImport.length === 0) {
          throw new Error('Không tìm thấy dữ liệu nhóm nào hợp lệ để nhập.');
        }
        
        const updatedGroups: DutyGroup[] = [...groups];
        
        matchedGroupsToImport.forEach(imported => {
          const idx = updatedGroups.findIndex(g => g.name.toLowerCase().trim() === imported.name.toLowerCase().trim());
          if (idx !== -1) {
            updatedGroups[idx] = {
              ...updatedGroups[idx],
              member_ids: imported.member_ids
            };
          } else {
            updatedGroups.push({
              id: `group-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              name: imported.name,
              member_ids: imported.member_ids
            });
          }
        });
        
        const success = await dutyService.saveGroups(updatedGroups);
        if (success) {
          showToast(`Đã lưu thành công ${matchedGroupsToImport.length} nhóm trực nhật từ Google Sheets.`);
          setGroups(updatedGroups);
          setParsedPreviewRows(null);
          setMatchedGroupsToImport([]);
          onScheduleUpdated();
        } else {
          throw new Error('Lỗi xảy ra trong quá trình lưu dữ liệu nhóm trực nhật.');
        }
        
      } else {
        if (matchedSchedulesToImport.length === 0) {
          throw new Error('Không tìm thấy lịch trực nào hợp lệ để nhập.');
        }
        
        const itemsToSave: DutySchedule[] = matchedSchedulesToImport.map(item => ({
          date: item.date,
          group_id: item.group_id
        }));
        
        const success = await dutyService.saveScheduleBatch(itemsToSave);
        if (success) {
          showToast(`Đã đồng bộ thành công lịch trực ${matchedSchedulesToImport.length} ngày từ Google Sheets.`);
          const sData = await dutyService.getSchedule();
          setSchedule(sData);
          setParsedPreviewRows(null);
          setMatchedSchedulesToImport([]);
          onScheduleUpdated();
        } else {
          throw new Error('Lỗi xảy ra trong quá trình lưu lịch trực nhật.');
        }
      }
    } catch (e: any) {
      console.error(e);
      setSheetErrorMessage(e.message || 'Lỗi không xác định.');
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployeesForSelection = allEmployees.filter(emp => 
    emp.name.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
    emp.employee_id.toLowerCase().includes(memberSearchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center p-2 md:p-4 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-[98vw] xl:max-w-[95vw] 2xl:max-w-[1480px] min-h-[80vh] h-[92vh] max-h-[95vh] flex flex-col overflow-hidden border border-slate-100">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center px-8 py-5 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-2xl">
              <Sparkles className="w-5.5 h-5.5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Thiết lập Trực nhật</h3>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Phân công & xoay ca trực nhật tự động</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-2xl transition-colors active:scale-95"
          >
            <X className="w-5 h-5 stroke-[2.5px]" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 gap-2 overflow-x-auto shrink-0 scrollbar-none">
          {[
            { id: 'groups', label: 'Ban/Nhóm trực nhật', icon: Users },
            { id: 'auto', label: 'Tự động xoay ca trực', icon: Shuffle },
            { id: 'manual', label: 'Điều chỉnh lịch lẻ', icon: Calendar }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSubTab(tab.id as any);
                setEditingGroupId(null);
                setParsedPreviewRows(null);
                setSheetErrorMessage(null);
                setSheetSuccessMessage(null);
              }}
              className={`flex-shrink-0 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-wider transition-all id-${tab.id} ${
                activeSubTab === tab.id 
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/10' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Toast Notification message */}
        {message && (
          <div className="bg-emerald-50 border-b border-emerald-100 px-8 py-3 flex items-center gap-2.5 animate-slide-in shrink-0">
            <Check className="w-4 h-4 text-emerald-600 stroke-[3px]" />
            <span className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider">{message}</span>
          </div>
        )}

        {/* Main Panel Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/30">
          {loading && (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
              <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 animate-pulse">Đang nạp dữ liệu trực nhật...</p>
            </div>
          )}

          {!loading && activeSubTab === 'groups' && (
            <div className="space-y-6">
              {editingGroupId === null ? (
                // Group List View - layout designed with dense cards and 2xl support to display 2-3 rows easily
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {groups.map(group => {
                    const members = allEmployees.filter(emp => group.member_ids?.includes(emp.id));
                    return (
                      <div 
                        key={group.id} 
                        className="bg-white p-4.5 rounded-2xl border border-slate-100 hover:border-amber-400 hover:shadow-md transition-all group relative flex flex-col justify-between min-h-[165px]"
                      >
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl shrink-0">
                                <Sparkles className="w-3.5 h-3.5" />
                              </div>
                              <h4 className="font-extrabold text-slate-800 text-xs tracking-tight capitalize truncate max-w-[100px] sm:max-w-none">{group.name}</h4>
                            </div>
                            <span className="bg-slate-100 text-slate-500 text-[8.5px] font-black px-2 py-0.5 rounded-md whitespace-nowrap">
                              {group.member_ids?.length || 0} NS
                            </span>
                          </div>

                          <div className="space-y-1 max-h-24 overflow-y-auto no-scrollbar py-0.5">
                            {members.length === 0 ? (
                              <p className="text-[9px] font-black uppercase text-slate-300 italic py-1">Chưa thêm thành viên</p>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {members.map(m => (
                                  <span 
                                    key={m.id} 
                                    className="inline-flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 text-[9px] font-bold text-slate-600"
                                  >
                                    <div className="w-1 h-1 rounded-full bg-slate-400"></div>
                                    {m.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 pt-2.5 border-t border-slate-50 flex justify-between items-center shrink-0">
                          <button
                            onClick={() => handleDeleteGroup(group.id, group.name)}
                            className="text-[9px] font-black uppercase tracking-wider text-rose-500 hover:text-white hover:bg-rose-500 border border-rose-500/10 hover:border-rose-500 px-2.5 py-1.5 rounded-lg transition-all shadow-sm active:scale-95 flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            Xóa
                          </button>
                          <button
                            onClick={() => handleEditGroupClick(group)}
                            className="text-[9px] font-black uppercase tracking-wider text-amber-600 hover:text-white hover:bg-amber-500 border border-amber-500/25 hover:border-amber-500 px-3 py-1.5 rounded-lg transition-all shadow-sm active:scale-95"
                          >
                            Cài đặt TV
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {/* Plus item card to add more groups */}
                  <button
                    type="button"
                    onClick={handleAddNewGroupClick}
                    className="border-2 border-dashed border-slate-200 hover:border-amber-400 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-amber-500 transition-all min-h-[165px] bg-white cursor-pointer group/add-btn"
                  >
                    <div className="p-2 bg-slate-50 group-hover/add-btn:bg-amber-50 group-hover/add-btn:text-amber-500 text-slate-400 rounded-xl transition-all">
                      <Plus className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover/add-btn:text-amber-600 transition-all">Thêm nhóm mới</span>
                  </button>
                </div>
              ) : (
                // Edit Group Form View
                <div className="bg-white p-7 rounded-[2rem] border border-slate-100 space-y-6">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                      <CornerDownRight className="w-4 h-4 text-amber-500" />
                      Cấu trúc {groupFormName}
                    </h4>
                    <button 
                      onClick={() => setEditingGroupId(null)}
                      className="text-[10px] font-extrabold text-slate-400 hover:text-slate-600 uppercase tracking-widest"
                    >
                      Bỏ qua
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left form config */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Tên nhóm trực nhật</label>
                        <input
                          type="text"
                          value={groupFormName}
                          onChange={(e) => setGroupFormName(e.target.value)}
                          className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-900"
                        />
                      </div>

                      <div className="bg-amber-50 rounded-2xl p-5 border border-amber-50 text-amber-800 space-y-2">
                        <div className="flex items-center gap-2">
                          <Info className="w-4 h-4 shrink-0" />
                          <span className="text-[10px] font-black uppercase tracking-wider">Hướng dẫn setup</span>
                        </div>
                        <p className="text-[10px] leading-relaxed font-semibold opacity-90">
                          Chọn các thành viên thuộc nhóm này bên bảng phân phối bên phải. Khi chạy tính năng xoay ca tự động, nhóm này sẽ đảm nhận toàn bộ lịch trực nhật của ngày được chỉ định.
                        </p>
                      </div>

                      <button
                        onClick={handleSaveGroup}
                        className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-amber-500/10 active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Lưu cấu trúc nhóm
                      </button>
                    </div>

                    {/* Right active member multi-selector */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          Thành viên được chọn ({selectedMemberIds.length})
                        </label>
                        <button
                          onClick={() => setSelectedMemberIds([])}
                          className="text-[8px] font-black text-rose-500 uppercase tracking-wider hover:underline"
                        >
                          Xóa bỏ tất cả
                        </button>
                      </div>

                      <input
                        type="text"
                        placeholder="Tìm kiếm nhân sự..."
                        value={memberSearchTerm}
                        onChange={(e) => setMemberSearchTerm(e.target.value)}
                        className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-900"
                      />

                      <div className="max-h-60 md:max-h-[48vh] overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-50 bg-white p-2 space-y-1">
                        {filteredEmployeesForSelection.length === 0 ? (
                          <p className="text-center text-[10px] text-slate-450 italic py-6 uppercase font-black tracking-widest">Không có kết quả</p>
                        ) : (
                          filteredEmployeesForSelection.map(emp => {
                            const isChecked = selectedMemberIds.includes(emp.id);
                            return (
                              <div 
                                key={emp.id}
                                onClick={() => handleToggleMember(emp.id)}
                                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                                  isChecked ? 'bg-amber-50/40 text-amber-900' : 'hover:bg-slate-50 text-slate-700'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 uppercase">
                                    {emp.name.charAt(0)}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-xs font-bold uppercase">{emp.name}</span>
                                    <span className="text-[8px] text-slate-400 tracking-wider font-extrabold">{emp.employee_id}</span>
                                  </div>
                                </div>
                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                                  isChecked ? 'bg-amber-500 border-amber-500 text-white' : 'border-slate-300'
                                }`}>
                                  {isChecked && <Check className="w-2.5 h-2.5 stroke-[3px]" />}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {!loading && activeSubTab === 'auto' && (
            <div className="bg-white p-7 rounded-[2rem] border border-slate-100 space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Shuffle className="w-5 h-5"/></div>
                <div>
                  <h4 className="text-sm font-black text-slate-850 uppercase tracking-tight">Kích hoạt xoay ca trực tự động</h4>
                  <p className="text-[8px] text-slate-400 font-extrabold uppercase mt-0.5">Xoay chuyển ca đều đặn cho các nhóm làm việc</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Ngày bắt đầu</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Ngày kết thúc</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50">
                    <input
                      type="checkbox"
                      id="workingOnly"
                      checked={workingDaysOnly}
                      onChange={(e) => setWorkingDaysOnly(e.target.checked)}
                      className="w-4 h-4 text-amber-500 focus:ring-amber-500 border-slate-300 rounded cursor-pointer"
                    />
                    <label htmlFor="workingOnly" className="text-xs font-extrabold text-slate-700 cursor-pointer select-none">
                      Chỉ xếp lịch trực vào NGÀY ĐI LÀM (Trừ ngày nghỉ lễ/T7 CN)
                    </label>
                  </div>

                  <div className="bg-amber-50 border border-amber-100/40 p-4.5 rounded-2xl text-amber-800 space-y-1">
                    <div className="flex items-center gap-1.5 font-black text-[9px] uppercase tracking-wider mb-1">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      Lưu ý đè đè dữ liệu cũ
                    </div>
                    <p className="text-[10px] font-semibold leading-relaxed opacity-90">
                      Tính năng xoay ca sẽ ghi đè các trực nhật cũ trong khoảng ngày đã chọn. Vui lòng đảm bảo cấu trúc các nhóm đã được cập nhật thành viên thích hợp trước khi kích hoạt.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Chuyển đổi các Nhóm được xếp lịch ({autoRotateGroupIds.length})
                  </label>
                  
                  <div className="border border-slate-100 rounded-xl divide-y divide-slate-50 bg-white p-2 space-y-1 max-h-60 md:max-h-[45vh] overflow-y-auto">
                    {groups.map(g => {
                      const isSelected = autoRotateGroupIds.includes(g.id);
                      return (
                        <div
                          key={g.id}
                          onClick={() => {
                            setAutoRotateGroupIds(prev => 
                              prev.includes(g.id) ? prev.filter(id => id !== g.id) : [...prev, g.id]
                            );
                          }}
                          className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                            isSelected ? 'bg-amber-50/40' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Sparkles className={`w-4 h-4 ${isSelected ? 'text-amber-500' : 'text-slate-300'}`} />
                            <span className="text-xs font-bold text-slate-700">{g.name}</span>
                          </div>
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                            isSelected ? 'bg-amber-500 border-amber-500 text-white' : 'border-slate-300'
                          }`}>
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3px]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={handleAutoGenerate}
                    className="w-full mt-2 py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-600/10 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Shuffle className="w-4 h-4" />
                    KÍCH HOẠT XOAY CA TRỰC NHẬT
                  </button>
                </div>
              </div>
            </div>
          )}

          {!loading && activeSubTab === 'manual' && (
            <div className="bg-white p-7 rounded-[2rem] border border-slate-100 space-y-6 max-w-xl mx-auto">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl"><Calendar className="w-5 h-5"/></div>
                <div>
                  <h4 className="text-sm font-black text-slate-850 uppercase tracking-tight">Xếp lịch thủ công từng ngày</h4>
                  <p className="text-[8px] text-slate-400 font-extrabold uppercase mt-0.5">Đặt cụ thể nhóm trực nhật cho một ngày bất kỳ</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Ngày cần trực nhật</label>
                  <input
                    type="date"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Nhóm trực nhật</label>
                  <select
                    value={manualGroupId}
                    onChange={(e) => setManualGroupId(e.target.value)}
                    className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-905 outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer text-slate-800"
                  >
                    <option value="">-- KHÔNG TRỰC (XÓA PHÂN CÔNG) --</option>
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleManualAssign}
                    className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-amber-500/10 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Cập nhật lịch ngày đã chọn
                  </button>
                </div>
              </div>
            </div>
          )}

          {false && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="bg-white p-6 md:p-7 rounded-[2rem] border border-slate-100 space-y-6">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                    <CloudDownload className="w-5 h-5"/>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Khai thác dữ liệu từ Google Sheets</h4>
                    <p className="text-[8px] text-slate-400 font-extrabold uppercase mt-0.5">Hỗ trợ nhận diện tự động & Khớp danh sách nhân sự</p>
                  </div>
                </div>

                <div className="space-y-5">
                  {/* Select Import Type */}
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
                      1. Chọn loại dữ liệu muốn nhập
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSheetImportType('groups');
                          setParsedPreviewRows(null);
                          setMatchedGroupsToImport([]);
                          setMatchedSchedulesToImport([]);
                        }}
                        className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center gap-2 ${
                          sheetImportType === 'groups'
                            ? 'border-indigo-500 bg-indigo-50/45 text-indigo-900 font-extrabold ring-2 ring-indigo-500/10'
                            : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600 font-bold'
                        }`}
                      >
                        <Users className="w-5 h-5" />
                        <span className="text-[11px] uppercase tracking-wider">Cấu hình Ban/Nhóm trực</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          setSheetImportType('schedule');
                          setParsedPreviewRows(null);
                          setMatchedGroupsToImport([]);
                          setMatchedSchedulesToImport([]);
                        }}
                        className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center gap-2 ${
                          sheetImportType === 'schedule'
                            ? 'border-indigo-500 bg-indigo-50/45 text-indigo-900 font-extrabold ring-2 ring-indigo-500/10'
                            : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600 font-bold'
                        }`}
                      >
                        <Calendar className="w-5 h-5" />
                        <span className="text-[11px] uppercase tracking-wider">Lịch phân công trực nhật</span>
                      </button>
                    </div>
                  </div>

                  {/* Google Sheets URL and Auto Load */}
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      2. Nhập đường dẫn link Google Sheets
                    </label>
                    <div className="flex flex-col md:flex-row gap-2">
                      <div className="relative flex-1">
                        <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={sheetUrl}
                          onChange={(e) => setSheetUrl(e.target.value)}
                          placeholder="Nhập link Google Sheets (đảm bảo quyền 'Bất kỳ ai có liên kết đều có thể xem')..."
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-950 focus:ring-2 focus:ring-indigo-500/15 outline-none focus:bg-white"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={sheetFetchLoading}
                        onClick={handleFetchSheet}
                        className="px-5 py-3/5 md:py-0 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95"
                      >
                        {sheetFetchLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CloudDownload className="w-4 h-4" />
                        )}
                        Tải & Phân tích
                      </button>
                    </div>
                  </div>

                  {/* Error & Success Messages */}
                  {sheetErrorMessage && (
                    <div className="bg-red-50 text-red-800 p-4 rounded-2xl border border-red-100 text-xs font-medium space-y-2 animate-fade-in">
                      <div className="flex items-center gap-2 font-black text-red-900 uppercase tracking-wider">
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                        LỖI TẢI TỰ ĐỘNG
                      </div>
                      <p className="leading-relaxed text-[11px]">{sheetErrorMessage}</p>
                    </div>
                  )}

                  {sheetSuccessMessage && (
                    <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl border border-emerald-100 text-xs font-medium animate-fade-in animate-pulse">
                      <div className="flex items-center gap-2 font-black text-emerald-900 uppercase tracking-wider mb-1">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        TẢI THÀNH CÔNG!
                      </div>
                      <p className="leading-relaxed text-[11px]">{sheetSuccessMessage}</p>
                    </div>
                  )}

                  {/* Manual Paste Textarea Fallback */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const elem = document.getElementById('manual-paste-area');
                        if (elem) elem.classList.toggle('hidden');
                      }}
                      className="text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-800 tracking-wider flex items-center gap-1 cursor-pointer transition-all active:scale-95 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Ẩn/Hiện Dán dữ liệu thủ công (TSV / CSV)
                    </button>
                    
                    <div id="manual-paste-area" className="hidden mt-3 space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 animate-slide-down">
                      <p className="text-[10px] text-slate-400 font-extrabold uppercase leading-normal">
                        Mẹo: Bạn hãy bôi đen vùng dữ liệu trên Google Sheets, nhấn <kbd className="bg-slate-200 px-1 py-0.5 rounded text-slate-700">Ctrl + C</kbd> rồi dán vào ô dưới đây:
                      </p>
                      <textarea
                        value={pastedData}
                        onChange={(e) => {
                          setPastedData(e.target.value);
                          processRawSheetData(e.target.value);
                        }}
                        rows={4}
                        placeholder="Dán các cột và hàng sao chép từ Google Sheets ở đây..."
                        className="w-full p-4 bg-white border border-slate-200 rounded-xl text-xs h-28 resize-y outline-none font-medium focus:border-indigo-500 transition-all font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Parsed Interactive Mapping Matches Preview */}
              {parsedPreviewRows && (
                <div className="bg-white p-6 md:p-7 rounded-[2rem] border border-slate-100 space-y-5 animate-scale-up">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Database className="w-4 h-4"/>
                      </div>
                      <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                        Phân tích & Khớp thực tế
                      </span>
                    </div>
                    {sheetInfo && (
                      <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2.5 py-1 rounded-lg">
                        {sheetInfo.rowCount} Dòng x {sheetInfo.colCount} Cột
                      </span>
                    )}
                  </div>

                  {/* Sheet row preview */}
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Xem trước 5 dòng đầu từ trang tính
                    </label>
                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-black uppercase border-b border-slate-100">
                            {parsedPreviewRows[0]?.map((col, idx) => (
                              <th key={idx} className="px-4 py-3">{String(col || `Cột ${idx + 1}`)}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {parsedPreviewRows.slice(1, 6).map((row, rIdx) => (
                            <tr key={rIdx} className="border-b border-slate-50 hover:bg-slate-50/50">
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="px-4 py-2.5 font-medium text-slate-600">{String(cell || '')}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mapping status output */}
                  {sheetImportType === 'groups' && matchedGroupsToImport.length > 0 && (
                    <div className="space-y-3">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        Nhận diện cơ cấu Ban/Nhóm ({matchedGroupsToImport.length} nhóm trực)
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-slate-900">
                        {matchedGroupsToImport.map((grp, gidx) => (
                          <div key={gidx} className="p-4 bg-slate-50/60 rounded-xl border border-slate-100 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-center mb-2.5">
                                <span className="font-extrabold text-sm text-slate-900 capitalize">{grp.name}</span>
                                {grp.id ? (
                                  <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[8px] font-black uppercase px-2 py-0.5 rounded-md">
                                    Đã có nhóm
                                  </span>
                                ) : (
                                  <span className="bg-blue-50 text-blue-600 border border-blue-100 text-[8px] font-black uppercase px-2 py-0.5 rounded-md">
                                    Tạo mới nhóm
                                  </span>
                                )}
                              </div>
                              
                              <div className="space-y-2">
                                {/* Matched Employees */}
                                {grp.matchedNames.length > 0 && (
                                  <div>
                                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider block mb-1">
                                      ✓ Đã khớp ({grp.matchedNames.length})
                                    </span>
                                    <div className="flex flex-wrap gap-1">
                                      {grp.matchedNames.map((name, nIdx) => (
                                        <span key={nIdx} className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded">
                                          {name}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Unmatched Names */}
                                {grp.unmatchedNames.length > 0 && (
                                  <div>
                                    <span className="text-[9px] font-black text-amber-500 uppercase tracking-wider block mb-1">
                                      ⚠️ Chưa khớp ({grp.unmatchedNames.length})
                                    </span>
                                    <div className="flex flex-wrap gap-1">
                                      {grp.unmatchedNames.map((name, nIdx) => (
                                        <span key={nIdx} className="bg-amber-50 text-amber-600 text-[10px] font-bold px-2 py-0.5 rounded line-through">
                                          {name}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {sheetImportType === 'schedule' && matchedSchedulesToImport.length > 0 && (
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        Nhận diện lịch trực ({matchedSchedulesToImport.length} ngày đã được phân tích)
                      </label>
                      <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-100 text-slate-900">
                        <table className="w-full text-left border-collapse text-[11px]">
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 font-extrabold uppercase border-b border-slate-100">
                              <th className="px-4 py-2.5">Ngày trực nhật</th>
                              <th className="px-4 py-2.5">Nhóm phân công</th>
                            </tr>
                          </thead>
                          <tbody>
                            {matchedSchedulesToImport.map((sched, sIdx) => (
                              <tr key={sIdx} className="border-b border-slate-50 hover:bg-slate-50/50">
                                <td className="px-4 py-2 font-bold text-slate-800">
                                  {sched.date.split('-').reverse().join('/')}
                                </td>
                                <td className="px-4 py-2 font-black text-indigo-600">
                                  {sched.groupName}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Apply Save Button */}
                  <div className="pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleApplyImport}
                      className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-600/10 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      XÁC NHẬN NHẬP DỮ LIỆU VÀ ĐỒNG BỘ HỆ THỐNG
                    </button>
                    <p className="text-center text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-3">
                      Lưu ý: Dữ liệu nhập mới sẽ bổ sung hoặc ghi đè cấu hình cũ tương ứng.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
