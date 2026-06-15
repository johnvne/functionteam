import { supabase } from '../lib/supabase';
import { DutyGroup, DutySchedule } from '../../types';

const STORAGE_KEYS = {
  GROUPS: 'v1_duty_groups',
  SCHEDULE: 'v1_duty_schedule'
};

const DEFAULT_GROUPS: DutyGroup[] = [
  { id: 'group-1', name: 'Nhóm 1', member_ids: [] },
  { id: 'group-2', name: 'Nhóm 2', member_ids: [] },
  { id: 'group-3', name: 'Nhóm 3', member_ids: [] },
  { id: 'group-4', name: 'Nhóm 4', member_ids: [] }
];

// Helper to load fallback from localstorage
const getLocalGroups = (): DutyGroup[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.GROUPS);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Error parsing groups from localstorage', e);
    }
  }
  return DEFAULT_GROUPS;
};

const saveLocalGroups = (groups: DutyGroup[]) => {
  localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
};

const getLocalSchedule = (): DutySchedule[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.SCHEDULE);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Error parsing schedule from localstorage', e);
    }
  }
  return [];
};

const saveLocalSchedule = (schedule: DutySchedule[]) => {
  localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(schedule));
};

export const dutyService = {
  // Fetch duty groups
  getGroups: async (): Promise<DutyGroup[]> => {
    try {
      const { data, error } = await supabase.from('duty_groups').select('*').order('id');
      if (error) {
        // Table probably doesn't exist, fallback to local
        console.warn('Supabase duty_groups failed, falling back to localStorage:', error.message);
        return getLocalGroups();
      }
      if (data && data.length > 0) {
        // Ensure proper schema
        return data.map((d: any) => ({
          id: d.id,
          name: d.name,
          member_ids: Array.isArray(d.member_ids) ? d.member_ids : JSON.parse(d.member_ids || '[]')
        }));
      }
      // If data is empty in Cloud but present in LocalStorage, return LocalStorage
      const localData = getLocalGroups();
      if (localData && localData.length > 0) {
        return localData;
      }
      // If table exists but empty and no local data, insert defaults
      const decodedGroups = DEFAULT_GROUPS;
      await dutyService.saveGroups(decodedGroups);
      return decodedGroups;
    } catch (e) {
      return getLocalGroups();
    }
  },

  // Save all duty groups
  saveGroups: async (groups: DutyGroup[]): Promise<boolean> => {
    saveLocalGroups(groups);
    try {
      // Try to upsert in Supabase
      const payload = groups.map(g => ({
        id: g.id,
        name: g.name,
        member_ids: g.member_ids // PostgREST handles array types natively if table matches
      }));
      const { error } = await supabase.from('duty_groups').upsert(payload);
      if (error) {
        console.warn('Supabase duty_groups upsert failed:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  },

  // Delete a duty group
  deleteGroup: async (groupId: string, remainingGroups: DutyGroup[]): Promise<boolean> => {
    saveLocalGroups(remainingGroups);
    try {
      const { error } = await supabase.from('duty_groups').delete().eq('id', groupId);
      if (error) {
        console.warn('Supabase duty_groups delete failed:', error.message);
        // Supabase fail but we fallback to localStorage (which succeeded, so we return true)
        return true;
      }
      return true;
    } catch (e) {
      return true;
    }
  },

  // Fetch duty schedule
  getSchedule: async (): Promise<DutySchedule[]> => {
    try {
      const { data, error } = await supabase.from('duty_schedule').select('*');
      if (error) {
        console.warn('Supabase duty_schedule failed, falling back to localStorage:', error.message);
        return getLocalSchedule();
      }
      if (data && data.length > 0) {
        return data as DutySchedule[];
      }
      // If table exists in Cloud but empty, check if we have schedules in LocalStorage
      const localSched = getLocalSchedule();
      if (localSched && localSched.length > 0) {
        return localSched;
      }
      return [];
    } catch (e) {
      return getLocalSchedule();
    }
  },

  // Save multiple schedule items or single schedule item
  saveScheduleItem: async (item: DutySchedule): Promise<boolean> => {
    const current = getLocalSchedule();
    const updated = current.filter(s => s.date !== item.date);
    if (item.group_id) {
       updated.push(item);
    }
    saveLocalSchedule(updated);

    try {
      if (item.group_id) {
        const { error } = await supabase.from('duty_schedule').upsert({
          date: item.date,
          group_id: item.group_id,
          notes: item.notes || ''
        });
        if (error) {
          console.warn('Supabase duty_schedule upsert failed:', error.message);
          return false;
        }
      } else {
        const { error } = await supabase.from('duty_schedule').delete().eq('date', item.date);
        if (error) {
          console.warn('Supabase duty_schedule delete failed:', error.message);
          return false;
        }
      }
      return true;
    } catch (e) {
      return false;
    }
  },

  // Auto assign duty rotation on working days
  autoGenerateSchedule: async (
    startDate: string,
    endDate: string,
    newGroupIds: string[],
    workingDaysOnly: boolean,
    dayConfigs: Record<string, boolean>
  ): Promise<DutySchedule[]> => {
    if (newGroupIds.length === 0) return [];
    
    // Fetch all current schedules across cloud & local fallback
    const currentSchedule = await dutyService.getSchedule();
    
    // 1. Determine the "old" groups in rotation before startDate.
    // Scan existing schedules before startDate up to 60 days
    const startObj = new Date(startDate);
    const sixtyDaysAgo = new Date(startObj);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const oldScheduledDays = currentSchedule
      .filter(s => {
        const sDate = new Date(s.date);
        return sDate < startObj && sDate >= sixtyDaysAgo;
      })
      .sort((a, b) => b.date.localeCompare(a.date)); // descending (newest first)

    // Collect distinct group IDs assigned before startDate
    const distinctOldGroupIds: string[] = [];
    for (const s of oldScheduledDays) {
      if (s.group_id && !distinctOldGroupIds.includes(s.group_id)) {
        distinctOldGroupIds.push(s.group_id);
      }
    }

    // Get the list of all currently existing groups to preserve correct natural ordering and filter deleted ones
    const allGroups = await dutyService.getGroups();
    const allGroupIdsInOrder = allGroups.map(g => g.id);
    const oldGroupIds = allGroupIdsInOrder.filter(id => distinctOldGroupIds.includes(id));

    let isTransitioningOldCycle = false;
    let oldGroupIndex = 0;
    let newGroupIndex = 0;

    if (oldGroupIds.length > 0 && oldScheduledDays.length > 0) {
      // Find the latest group assigned before startDate
      const latestScheduledBefore = oldScheduledDays[0];
      const lastGroupId = latestScheduledBefore.group_id;
      
      const lastGroupIdx = oldGroupIds.indexOf(lastGroupId);
      if (lastGroupIdx !== -1) {
        // Old cycle consists of oldGroupIds.
        // We finish this old cycle from the next index.
        oldGroupIndex = lastGroupIdx + 1;
        
        // If oldGroupIndex < oldGroupIds.length, we need to transition.
        // Otherwise, the previous cycle already completed, so we can start the new cycle with newGroupIds directly.
        if (oldGroupIndex < oldGroupIds.length) {
          isTransitioningOldCycle = true;
        }
      }
    }

    const scheds: DutySchedule[] = [];
    const endObj = new Date(endDate);
    
    for (let d = new Date(startObj); d <= endObj; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      
      // Determine if working day
      const dayOfWeek = d.getDay();
      const isWorkingDay = dayConfigs[dateStr] ?? (dayOfWeek !== 0 && dayOfWeek !== 6);
      
      if (!workingDaysOnly || isWorkingDay) {
        let assignedGroupId = '';
        
        if (isTransitioningOldCycle) {
          assignedGroupId = oldGroupIds[oldGroupIndex];
          oldGroupIndex++;
          
          if (oldGroupIndex >= oldGroupIds.length) {
            isTransitioningOldCycle = false;
            newGroupIndex = 0;
          }
        } else {
          assignedGroupId = newGroupIds[newGroupIndex % newGroupIds.length];
          newGroupIndex++;
        }
        
        scheds.push({
          date: dateStr,
          group_id: assignedGroupId
        });
      }
    }

    // Today's date string
    const todayStr = new Date().toISOString().split('T')[0];

    // Determine all dates to clean up between 3 days ago and the rotation start date
    const cleanStart = new Date(todayStr);
    cleanStart.setDate(cleanStart.getDate() - 3);
    const cleanEnd = new Date(startDate);
    
    const datesToDelete: string[] = [];
    if (startDate > todayStr) {
      for (let d = new Date(cleanStart); d < cleanEnd; d.setDate(d.getDate() + 1)) {
        datesToDelete.push(d.toISOString().split('T')[0]);
      }
    }

    const datesToDeleteSet = new Set(datesToDelete);
    const datesToOverwrite = new Set(scheds.map(s => s.date));

    // Update in local and try cloud
    const merged = [
      ...currentSchedule.filter(s => {
        if (datesToOverwrite.has(s.date)) return false;
        if (datesToDeleteSet.has(s.date)) return false;
        return true;
      }),
      ...scheds
    ];
    saveLocalSchedule(merged);

    // Try cloud batch upsert & deletion
    try {
      if (datesToDelete.length > 0) {
        // Delete each date individually to ensure cloud DB is completely updated and free of index lock issues
        for (const dateVal of datesToDelete) {
          try {
            await supabase
              .from('duty_schedule')
              .delete()
              .eq('date', dateVal);
          } catch (deleteErr) {
            console.warn(`Failed to delete specific date ${dateVal}:`, deleteErr);
          }
        }
      }

      const { error } = await supabase.from('duty_schedule').upsert(scheds);
      if (error) {
        console.warn('Supabase batch upsert failed:', error.message);
      }
    } catch (e) {
      console.warn('Supabase update exception:', e);
    }

    return merged;
  },

  // Save multiple schedule items in one batch
  saveScheduleBatch: async (items: DutySchedule[]): Promise<boolean> => {
    const current = getLocalSchedule();
    const datesToOverwrite = new Set(items.map(s => s.date));
    const merged = [
      ...current.filter(s => !datesToOverwrite.has(s.date)),
      ...items
    ];
    saveLocalSchedule(merged);

    try {
      const { error } = await supabase.from('duty_schedule').upsert(items);
      if (error) {
        console.warn('Supabase batch upsert failed:', error.message);
        return true; // We return true since it correctly updated localStorage
      }
      return true;
    } catch (e) {
      return true; // Fallback to localStorage is successful
    }
  }
};
