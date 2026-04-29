export interface User {
  id: string;
  employeeCode: string; // Map từ users.employee_id
  role: string; // 'admin' | 'user'
  name: string; // Map từ users.name
  email?: string;
  // Avatar removed if not in old schema
}

// Map bảng 'users' cũ
export interface Employee {
  id: string;
  employee_id: string;
  name: string;
  role: string;
  password?: string;
  created_at?: string;
}

export interface Tool {
  id: string;
  name: string;
  category: string;
  quantity: number;
  available: number;
  description?: string;
  location?: string;
  image?: string;
  status: 'active' | 'inactive';
}

export interface BorrowRequest {
  id: string;
  employee_id: string;
  user_id: string;
  user_name: string;
  tool_id: string;
  tool_name: string;
  borrow_date: string;
  status: 'pending' | 'approved' | 'rejected' | 'returned';
  returned_at?: string;
}

// Map bảng 'ot_requests', join với 'users'
export interface OvertimeRequest {
  id: string;
  user_id: string;
  date: string;
  start_time: string;
  end_time: string;
  total_hours: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at?: string;
  // Join fields from users
  users?: {
    employee_id: string;
    name: string;
  };
}

// Map bảng 'day_configs'
export interface DayConfig {
  date: string; // YYYY-MM-DD
  is_working_day: boolean; // true = Đi làm, false = Nghỉ
}