import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Wrench, TrendingUp, Loader2, Package, ShoppingBag, BarChart as BarChartIcon } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

interface SafeChartContainerProps {
  children: React.ReactNode;
  height?: number;
  hasData?: boolean;
}

/**
 * Component an toàn để bọc biểu đồ Recharts.
 * Giải quyết lỗi "width/height is -1" bằng cách theo dõi chính xác kích thước container cha.
 */
const SafeChartContainer: React.FC<SafeChartContainerProps> = ({ children, height = 300, hasData = true }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (!containerRef.current) return;

    // Sử dụng ResizeObserver để lấy kích thước chính xác của container
    const observer = new ResizeObserver((entries) => {
      if (!entries.length) return;
      const { width, height: contentHeight } = entries[0].contentRect;
      
      // Chỉ cập nhật khi kích thước hợp lệ
      if (width > 0) {
        setDimensions({ width, height: contentHeight || height });
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [height]);

  // Hiển thị trạng thái trống nếu không có dữ liệu
  if (!hasData) {
    return (
      <div style={{ height }} className="w-full flex flex-col items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
         <div className="p-3 bg-gray-100 rounded-full mb-2">
            <BarChartIcon className="w-6 h-6 text-gray-400" />
         </div>
         <span className="text-gray-400 text-sm font-medium">Chưa có dữ liệu thống kê</span>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      style={{ 
        height: `${height}px`, 
        width: '100%', 
        position: 'relative',
        minWidth: '0px' // Quan trọng: ngăn flex container bị tràn
      }} 
      className="overflow-hidden" 
    >
      {/* Chỉ render ResponsiveContainer khi component đã mount và container có kích thước > 0 */}
      {isMounted && dimensions.width > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          {children as React.ReactElement}
        </ResponsiveContainer>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50/50 rounded-lg">
           <Loader2 className="w-5 h-5 text-blue-500 animate-spin mb-2" />
           <span className="text-gray-400 text-xs">Đang khởi tạo biểu đồ...</span>
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

      // 1. Tính Tổng số lượng công cụ
      const totalToolsQuantity = tools.reduce((sum, tool) => sum + (tool.quantity || 0), 0);
      
      // 2. Tính Số lượng sẵn có
      const totalToolsAvailable = tools.reduce((sum, tool) => sum + (tool.status === 'active' ? (tool.available || 0) : 0), 0);

      // 3. Tính Số lượng đang mượn
      const borrowedTools = requests.filter(r => r.status === 'approved').length;

      // 4. Tính Số lượng chờ duyệt
      const pendingRequests = requests.filter(r => r.status === 'pending').length;

      setStats({
        totalToolsQuantity,
        totalToolsAvailable,
        borrowedTools,
        pendingRequests
      });

      // --- Biểu đồ Tròn: Phân bố trạng thái tài sản ---
      const pieChartData = [
        { name: 'Sẵn có', value: totalToolsAvailable },
        { name: 'Đang mượn', value: borrowedTools },
        { name: 'Khác/Bảo trì', value: Math.max(0, totalToolsQuantity - totalToolsAvailable - borrowedTools) },
      ];
      setPieData(pieChartData.filter(item => item.value > 0));

      // --- Biểu đồ Cột: Yêu cầu 7 ngày gần nhất ---
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return {
            dateStr: d.toLocaleDateString('vi-VN'),
            dayName: d.toLocaleDateString('vi-VN', { weekday: 'short' }),
            fullDate: d.toISOString().split('T')[0]
        };
      });

      const chartData = last7Days.map(day => {
        const count = requests.filter(r => r.borrow_date.startsWith(day.fullDate)).length;
        return {
            name: day.dayName,
            fullDate: day.dateStr,
            requests: count
        };
      });
      
      setBarData(chartData);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
        <div className="flex h-96 items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
    );
  }

  return (
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
            </BarChart>
          </SafeChartContainer>
        </Card>

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
        </Card>
      </div>
    </div>
  );
};