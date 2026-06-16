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

// Helper to load fallback from localstorage for instant startup / offline display
const getLocalGroups = (): DutyGroup[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.GROUPS);
  if (stored) {
    try {
      const decoded = JSON.parse(stored) as DutyGroup[];
      const uniqueGroups: DutyGroup[] = [];
      const seenNames = new Set<string>();
      const seenIds = new Set<string>();
      for (const g of decoded) {
        if (!g || !g.id || !g.name) continue;
        const normName = g.name.trim().toLowerCase();
        if (!seenNames.has(normName) && !seenIds.has(g.id)) {
          uniqueGroups.push(g);
          seenNames.add(normName);
          seenIds.add(g.id);
        }
      }
      return uniqueGroups.length > 0 ? uniqueGroups : DEFAULT_GROUPS;
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
  // Fetch duty groups (Primarily from Supabase Cloud DB)
  getGroups: async (): Promise<DutyGroup[]> => {
    try {
      const { data, error } = await supabase.from('duty_groups').select('*').order('id');
      
      if (error) {
        console.error('Supabase getGroups failed, using local cache:', error.message);
        return getLocalGroups();
      }

      if (data && data.length > 0) {
        const decoded = data.map((d: any) => {
          let memberIds: string[] = [];
          if (Array.isArray(d.member_ids)) {
            memberIds = d.member_ids;
          } else if (typeof d.member_ids === 'string') {
            try {
              memberIds = JSON.parse(d.member_ids || '[]');
            } catch (err) {
              console.error('Error parsing member_ids string in db row:', err, d.member_ids);
              memberIds = [];
            }
          }
          return {
            id: d.id,
            name: d.name,
            member_ids: Array.isArray(memberIds) ? memberIds : []
          };
        });
        
        // Deduplicate decoded groups by name (case-insensitive) and by id to ensure absolute uniqueness
        const uniqueGroups: DutyGroup[] = [];
        const seenNames = new Set<string>();
        const seenIds = new Set<string>();

        for (const g of decoded) {
          if (!g || !g.id || !g.name) continue;
          const normName = g.name.trim().toLowerCase();
          if (!seenNames.has(normName) && !seenIds.has(g.id)) {
            uniqueGroups.push(g);
            seenNames.add(normName);
            seenIds.add(g.id);
          }
        }

        // Cache to localStorage for offline availability & faster display
        saveLocalGroups(uniqueGroups);
        return uniqueGroups;
      }

      // If database is completely empty but we have local storage data,
      // migrate the existing local storage data to Cloud DB so other users can see it!
      const localData = getLocalGroups();
      if (localData && localData.length > 0 && JSON.stringify(localData) !== JSON.stringify(DEFAULT_GROUPS)) {
        console.log('Migrating local duty groups to Supabase Cloud DB...');
        const success = await dutyService.saveGroups(localData);
        if (success) return localData;
      }

      // If both Cloud and Local are empty, initialize default groups in DB
      console.log('Initializing default duty groups in Supabase Cloud DB...');
      const decodedGroups = DEFAULT_GROUPS;
      await dutyService.saveGroups(decodedGroups);
      return decodedGroups;
    } catch (e) {
      console.error('Error in getGroups service:', e);
      return getLocalGroups();
    }
  },

  // Save all duty groups (Directly to Supabase Cloud DB)
  saveGroups: async (groups: DutyGroup[]): Promise<boolean> => {
    // Keep local cache up-to-date
    saveLocalGroups(groups);
    try {
      const payload = groups.map(g => ({
        id: g.id,
        name: g.name,
        member_ids: g.member_ids
      }));
      const { error } = await supabase.from('duty_groups').upsert(payload);
      if (error) {
        console.error('Supabase duty_groups upsert failed:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Error saving groups to database:', e);
      return false;
    }
  },

  // Delete a duty group (Directly from Supabase Cloud DB)
  deleteGroup: async (groupId: string, remainingGroups: DutyGroup[]): Promise<boolean> => {
    saveLocalGroups(remainingGroups);
    try {
      const { error } = await supabase.from('duty_groups').delete().eq('id', groupId);
      if (error) {
        console.error('Supabase duty_groups delete failed:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Error deleting group from database:', e);
      return false;
    }
  },

  // Fetch duty schedule (Primarily from Supabase Cloud DB)
  getSchedule: async (): Promise<DutySchedule[]> => {
    try {
      const { data, error } = await supabase.from('duty_schedule').select('*');
      if (error) {
        console.error('Supabase duty_schedule failed, using local cache:', error.message);
        return getLocalSchedule();
      }
      if (data && data.length > 0) {
        const decoded = data as DutySchedule[];
        // Cache to localStorage for offline availability & faster display
        saveLocalSchedule(decoded);
        return decoded;
      }

      // If database is empty but we have local schedule logs, migrate them to Supabase
      const localSched = getLocalSchedule();
      if (localSched && localSched.length > 0) {
        console.log('Migrating local duty schedule to Supabase Cloud DB...');
        const success = await dutyService.saveScheduleBatch(localSched);
        if (success) return localSched;
      }
      
      return [];
    } catch (e) {
      console.error('Error in getSchedule service:', e);
      return getLocalSchedule();
    }
  },

  // Save multiple schedule items or single schedule item (Directly to Supabase Cloud DB)
  saveScheduleItem: async (item: DutySchedule): Promise<boolean> => {
    // Keep local cache synced
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
          console.error('Supabase duty_schedule upsert failed:', error.message);
          return false;
        }
      } else {
        const { error } = await supabase.from('duty_schedule').delete().eq('date', item.date);
        if (error) {
          console.error('Supabase duty_schedule delete failed:', error.message);
          return false;
        }
      }
      return true;
    } catch (e) {
      console.error('Error saving schedule item to database:', e);
      return false;
    }
  },

  // Auto assign duty rotation on working days (Generates & saves everything directly on Supabase Cloud DB)
  autoGenerateSchedule: async (
    startDate: string,
    endDate: string,
    newGroupIds: string[],
    workingDaysOnly: boolean,
    dayConfigs: Record<string, boolean>
  ): Promise<DutySchedule[]> => {
    if (newGroupIds.length === 0) return [];
    
    // Fetch all schedule strictly from Supabase
    const currentSchedule = await dutyService.getSchedule();
    
    const scheds: DutySchedule[] = [];
    const endObj = new Date(endDate);
    const startObj = new Date(startDate);
    
    // The rotation always starts from Group 1 (index 0) on the user's selected start date
    let currentGroupIndex = 0;
    
    for (let d = new Date(startObj); d <= endObj; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay();
      const isWorkingDay = dayConfigs[dateStr] ?? (dayOfWeek !== 0 && dayOfWeek !== 6);
      
      if (!workingDaysOnly || isWorkingDay) {
        const assignedGroupId = newGroupIds[currentGroupIndex];
        
        scheds.push({
          date: dateStr,
          group_id: assignedGroupId
        });
        
        // Progress to the next group, wrapping back to 0 when it exceeds array length
        currentGroupIndex = (currentGroupIndex + 1) % newGroupIds.length;
      }
    }

    // Today's date string
    const todayStr = new Date().toISOString().split('T')[0];

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
        console.error('Supabase batch upsert failed:', error.message);
      }
    } catch (e) {
      console.error('Supabase update exception:', e);
    }

    return merged;
  },

  // Save multiple schedule items in one batch (Directly to Supabase Cloud DB)
  saveScheduleBatch: async (items: DutySchedule[]): Promise<boolean> => {
    // Keep local cache synced
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
        console.error('Supabase batch upsert failed:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Error saving batch schedule to database:', e);
      return false;
    }
  }
};
