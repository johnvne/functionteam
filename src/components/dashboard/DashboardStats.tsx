<<<<<<< HEAD

=======
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
<<<<<<< HEAD
import { Wrench, TrendingUp, Loader2, Package, ShoppingBag, BarChart as BarChartIcon, ArrowUpRight, Activity, Zap } from 'lucide-react';

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];
=======
import { Wrench, TrendingUp, Loader2, Package, ShoppingBag, BarChart as BarChartIcon } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9

interface SafeChartContainerProps {
  children: React.ReactNode;
  height?: number;
  hasData?: boolean;
}

<<<<<<< HEAD
=======
/**
 * Component an toàn để bọc biểu đồ Recharts.
 * Giải quyết lỗi "width/height is -1" bằng cách theo dõi chính xác kích thước container cha.
 */
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
const SafeChartContainer: React.FC<SafeChartContainerProps> = ({ children, height = 300, hasData = true }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (!containerRef.current) return;

<<<<<<< HEAD
    const observer = new ResizeObserver((entries) => {
      if (!entries.length) return;
      const { width, height: contentHeight } = entries[0].contentRect;
=======
    // Sử dụng ResizeObserver để lấy kích thước chính xác của container
    const observer = new ResizeObserver((entries) => {
      if (!entries.length) return;
      const { width, height: contentHeight } = entries[0].contentRect;
      
      // Chỉ cập nhật khi kích thước hợp lệ
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
      if (width > 0) {
        setDimensions({ width, height: contentHeight || height });
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [height]);

<<<<<<< HEAD
  if (!hasData) {
    return (
      <div style={{ height }} className="w-full flex flex-col items-center justify-center bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200">
         <div className="p-4 bg-white rounded-2xl shadow-sm mb-3">
            <BarChartIcon className="w-8 h-8 text-slate-200" />
         </div>
         <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest italic">Dữ liệu phân tích đang trống</span>
=======
  // Hiển thị trạng thái trống nếu không có dữ liệu
  if (!hasData) {
    return (
      <div style={{ height }} className="w-full flex flex-col items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
         <div className="p-3 bg-gray-100 rounded-full mb-2">
            <BarChartIcon className="w-6 h-6 text-gray-400" />
         </div>
         <span className="text-gray-400 text-sm font-medium">Chưa có dữ liệu thống kê</span>
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
<<<<<<< HEAD
      style={{ height: `${height}px`, width: '100%', position: 'relative' }} 
      className="overflow-hidden" 
    >
=======
      style={{ 
        height: `${height}px`, 
        width: '100%', 
        position: 'relative',
        minWidth: '0px' // Quan trọng: ngăn flex container bị tràn
      }} 
      className="overflow-hidden" 
    >
      {/* Chỉ render ResponsiveContainer khi component đã mount và container có kích thước > 0 */}
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
      {isMounted && dimensions.width > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          {children as React.ReactElement}
        </ResponsiveContainer>
      ) : (
<<<<<<< HEAD
        <div className="w-full h-full flex items-center justify-center">
           <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
=======
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50/50 rounded-lg">
           <Loader2 className="w-5 h-5 text-blue-500 animate-spin mb-2" />
           <span className="text-gray-400 text-xs">Đang khởi tạo biểu đồ...</span>
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
        </div>
      )}
    </div>
  );
};

export const DashboardStats: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalToolsQuantity: 0,
    totalToolsAvailable: 0,
    borrowedTools: 0,
    pendingRequests: 0,
  });
  const [barData, setBarData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [toolsRes, requestsRes] = await Promise.all([
        supabase.from('tools').select('quantity, available, status'),
        supabase.from('requests').select('status, borrow_date')
      ]);

      const tools = toolsRes.data || [];
      const requests = requestsRes.data || [];

<<<<<<< HEAD
      const totalToolsQuantity = tools.reduce((sum, tool) => sum + (tool.quantity || 0), 0);
      const totalToolsAvailable = tools.reduce((sum, tool) => sum + (tool.status === 'active' ? (tool.available || 0) : 0), 0);
      const borrowedTools = requests.filter(r => r.status === 'approved').length;
=======
      // 1. Tính Tổng số lượng công cụ
      const totalToolsQuantity = tools.reduce((sum, tool) => sum + (tool.quantity || 0), 0);
      
      // 2. Tính Số lượng sẵn có
      const totalToolsAvailable = tools.reduce((sum, tool) => sum + (tool.status === 'active' ? (tool.available || 0) : 0), 0);

      // 3. Tính Số lượng đang mượn
      const borrowedTools = requests.filter(r => r.status === 'approved').length;

      // 4. Tính Số lượng chờ duyệt
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
      const pendingRequests = requests.filter(r => r.status === 'pending').length;

      setStats({
        totalToolsQuantity,
        totalToolsAvailable,
        borrowedTools,
        pendingRequests
      });

<<<<<<< HEAD
      const pieChartData = [
        { name: 'Sẵn có', value: totalToolsAvailable },
        { name: 'Đang mượn', value: borrowedTools },
        { name: 'Khác', value: Math.max(0, totalToolsQuantity - totalToolsAvailable - borrowedTools) },
      ];
      setPieData(pieChartData.filter(item => item.value > 0));

=======
      // --- Biểu đồ Tròn: Phân bố trạng thái tài sản ---
      const pieChartData = [
        { name: 'Sẵn có', value: totalToolsAvailable },
        { name: 'Đang mượn', value: borrowedTools },
        { name: 'Khác/Bảo trì', value: Math.max(0, totalToolsQuantity - totalToolsAvailable - borrowedTools) },
      ];
      setPieData(pieChartData.filter(item => item.value > 0));

      // --- Biểu đồ Cột: Yêu cầu 7 ngày gần nhất ---
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return {
<<<<<<< HEAD
=======
            dateStr: d.toLocaleDateString('vi-VN'),
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
            dayName: d.toLocaleDateString('vi-VN', { weekday: 'short' }),
            fullDate: d.toISOString().split('T')[0]
        };
      });

<<<<<<< HEAD
      const chartData = last7Days.map(day => ({
        name: day.dayName,
        requests: requests.filter(r => r.borrow_date.startsWith(day.fullDate)).length
      }));
      setBarData(chartData);
=======
      const chartData = last7Days.map(day => {
        const count = requests.filter(r => r.borrow_date.startsWith(day.fullDate)).length;
        return {
            name: day.dayName,
            fullDate: day.dateStr,
            requests: count
        };
      });
      
      setBarData(chartData);

>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
<<<<<<< HEAD
        <div className="flex h-[60vh] items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-600 opacity-20" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Đang đồng bộ dữ liệu...</p>
            </div>
=======
        <div className="flex h-96 items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
        </div>
    );
  }

  return (
<<<<<<< HEAD
    <div className="space-y-8 animate-page-transition max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none uppercase italic">Tổng quan V1</h1>
           <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-[0.3em] ml-1">Live tracking system</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
           <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Hệ thống đang trực tuyến</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Kho thiết bị', val: stats.totalToolsQuantity, icon: Package, color: 'indigo' },
          { label: 'Yêu cầu mới', val: stats.pendingRequests, icon: TrendingUp, color: 'purple' },
          { label: 'Sẵn sàng', val: stats.totalToolsAvailable, icon: Wrench, color: 'emerald' },
          { label: 'Đang mượn', val: stats.borrowedTools, icon: ShoppingBag, color: 'amber' }
        ].map((c, i) => (
          <Card key={i} className="hover-lift border-none group relative overflow-hidden bg-white">
            <div className={`absolute -top-4 -right-4 w-24 h-24 bg-${c.color}-500/5 rounded-full transition-transform group-hover:scale-150`}></div>
            <div className="flex justify-between items-start mb-6 relative">
              <div className={`p-4 bg-${c.color}-50 text-${c.color}-600 rounded-2xl`}>
                <c.icon className="w-6 h-6" />
              </div>
              <Activity className="w-4 h-4 text-slate-200" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{c.label}</p>
            <p className="text-3xl font-black text-slate-900 tabular-nums">{c.val}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <Card className="lg:col-span-8 p-8 md:p-10 border-none shadow-xl bg-white" title="Hoạt động mượn đồ">
          <div className="mb-8">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Thống kê 7 ngày gần nhất</p>
          </div>
          <SafeChartContainer height={300} hasData={barData.some(d => d.requests > 0)}>
            <BarChart data={barData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
              <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', padding: '12px' }} />
              <Bar dataKey="requests" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={28} />
=======
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="flex items-center gap-4 border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
          <div className="p-3 bg-purple-100 rounded-full text-purple-600">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Tổng số công cụ</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalToolsQuantity}</p>
          </div>
        </Card>
        
        <Card className="flex items-center gap-4 border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
          <div className="p-3 bg-orange-100 rounded-full text-orange-600">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Đang cho mượn</p>
            <p className="text-2xl font-bold text-gray-800">{stats.borrowedTools}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
          <div className="p-3 bg-green-100 rounded-full text-green-600">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Sẵn có tại kho</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalToolsAvailable}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 border-l-4 border-l-yellow-500 hover:shadow-md transition-shadow">
          <div className="p-3 bg-yellow-100 rounded-full text-yellow-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Yêu cầu chờ duyệt</p>
            <p className="text-2xl font-bold text-gray-800">{stats.pendingRequests}</p>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Xu hướng mượn đồ (7 ngày qua)" className="min-w-0">
          <SafeChartContainer height={300} hasData={barData.some(d => d.requests > 0)}>
            <BarChart data={barData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#6b7280', fontSize: 11, fontWeight: 500}}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                allowDecimals={false} 
                tick={{fill: '#6b7280', fontSize: 11, fontWeight: 500}}
              />
              <Tooltip 
                cursor={{fill: '#f9fafb'}}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ fontWeight: '700', color: '#111827', marginBottom: '0.25rem' }}
              />
              <Bar 
                dataKey="requests" 
                name="Số yêu cầu" 
                fill="#6366f1" 
                radius={[6, 6, 0, 0]} 
                barSize={32}
                animationDuration={1000}
              />
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
            </BarChart>
          </SafeChartContainer>
        </Card>

<<<<<<< HEAD
        <Card className="lg:col-span-4 p-8 md:p-10 border-none shadow-xl bg-white flex flex-col" title="Tình trạng kho">
          <div className="flex-1 min-h-[200px] flex items-center justify-center mt-6">
            <SafeChartContainer height={220} hasData={pieData.length > 0}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={10} dataKey="value" nameKey="name">
                  {pieData.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />))}
                </Pie>
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-slate-900 text-3xl font-black">{stats.totalToolsQuantity}</text>
              </PieChart>
            </SafeChartContainer>
          </div>
          
          <div className="grid grid-cols-1 gap-2 mt-8">
              {pieData.map((entry, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">{entry.name}</span>
                      </div>
                      <span className="text-xs font-black text-slate-900 tabular-nums">{entry.value}</span>
                  </div>
              ))}
          </div>
=======
        <Card title="Tình trạng phân bổ tài sản" className="min-w-0">
          <SafeChartContainer height={300} hasData={pieData.length > 0}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={85}
                paddingAngle={6}
                dataKey="value"
                nameKey="name"
                animationDuration={1000}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
              />
              <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-gray-400 text-sm font-bold">
                {stats.totalToolsQuantity} Item
              </text>
            </PieChart>
          </SafeChartContainer>
          
          {pieData.length > 0 && (
              <div className="flex justify-center gap-4 mt-6 flex-wrap">
                  {pieData.map((entry, index) => (
                      <div key={index} className="flex items-center gap-2 text-[11px] text-gray-700 font-bold bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                          {entry.name} <span className="text-gray-400 font-medium">({entry.value})</span>
                      </div>
                  ))}
              </div>
          )}
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
        </Card>
      </div>
    </div>
  );
<<<<<<< HEAD
};
=======
};
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
