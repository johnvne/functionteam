
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://duqqsdyaqxaipewfgqdg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1cXFzZHlhcXhhaXBld2ZncWRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwMjA4NjQsImV4cCI6MjA3ODU5Njg2NH0.CGXbzy8J5qOq-HiJSuBHXABxqnCqggUyYWsH528J0fU';

const client = createClient(supabaseUrl, supabaseKey);

export const supabase = {
  from: (table: string) => client.from(table),
  rpc: (fn: string, args: any) => client.rpc(fn, args),
  auth: {
    signInWithPassword: async ({ employeeCode, password }: { employeeCode: string, password: string }) => {
      try {
        const { data, error } = await client
          .from('users')
          .select('*')
          .eq('employee_id', employeeCode)
          .eq('password', password)
          .single();

        if (error || !data) {
          return { data: null, error: { message: 'Mã nhân viên hoặc mật khẩu không chính xác.' } };
        }

        const user = {
          id: data.id,
          employeeCode: data.employee_id,
          name: data.name,
          role: data.role ? data.role.toLowerCase() : 'user',
        };

        const session = {
          access_token: 'custom-session-token', 
          user: user
        };

        return { data: { user, session }, error: null };
      } catch (err) {
        return { data: null, error: { message: 'Lỗi kết nối server.' } };
      }
    },
    signOut: async () => {
      localStorage.removeItem('sb-session');
      return { error: null };
    },
    getSession: async () => {
      const stored = localStorage.getItem('sb-session');
      return { data: { session: stored ? JSON.parse(stored) : null }, error: null };
    },
    getUser: async () => {
        const stored = localStorage.getItem('sb-session');
        const session = stored ? JSON.parse(stored) : null;
        return { data: { user: session?.user || null }, error: null };
    }
  }
};
