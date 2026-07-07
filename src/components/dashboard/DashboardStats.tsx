
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Wrench, TrendingUp, Loader2, Package, ShoppingBag, BarChart as BarChartIcon, ArrowUpRight, Activity, Zap } from 'lucide-react';

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

interface SafeChartContainerProps {
  children: React.ReactNode;
  height?: number;
  hasData?: boolean;
}

const SafeChartContainer: React.FC<SafeChartContainerProps> = ({ children, height = 300, hasData = true }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      if (!entries.length) return;
      const { width, height: contentHeight } = entries[0].contentRect;
      if (width > 0) {
        setDimensions({ width, height: contentHeight || height });
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [height]);

  if (!hasData) {
    return (
      <div style={{ height }} className="w-full flex flex-col items-center justify-center bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200">
         <div className="p-4 bg-white rounded-2xl shadow-sm mb-3">
            <BarChartIcon className="w-8 h-8 text-slate-200" />
         </div>
         <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest italic">Dữ liệu phân tích đang trống</span>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      style={{ height: `${height}px`, width: '100%', position: 'relative' }} 
      className="overflow-hidden" 
    >
      {isMounted && dimensions.width > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          {children as React.ReactElement}
        </ResponsiveContainer>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
           <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
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

      const totalToolsQuantity = tools.reduce((sum, tool) => sum + (tool.quantity || 0), 0);
      const totalToolsAvailable = tools.reduce((sum, tool) => sum + (tool.status === 'active' ? (tool.available || 0) : 0), 0);
      const borrowedTools = requests.filter(r => r.status === 'approved').length;
      const pendingRequests = requests.filter(r => r.status === 'pending').length;

      setStats({
        totalToolsQuantity,
        totalToolsAvailable,
        borrowedTools,
        pendingRequests
      });

      const pieChartData = [
        { name: 'Sẵn có', value: totalToolsAvailable },
        { name: 'Đang mượn', value: borrowedTools },
        { name: 'Khác', value: Math.max(0, totalToolsQuantity - totalToolsAvailable - borrowedTools) },
      ];
      setPieData(pieChartData.filter(item => item.value > 0));

      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return {
            dayName: d.toLocaleDateString('vi-VN', { weekday: 'short' }),
            fullDate: d.toISOString().split('T')[0]
        };
      });

      const chartData = last7Days.map(day => ({
        name: day.dayName,
        requests: requests.filter(r => r.borrow_date.startsWith(day.fullDate)).length
      }));
      setBarData(chartData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
        <div className="flex h-[60vh] items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-600 opacity-20" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Đang đồng bộ dữ liệu...</p>
            </div>
        </div>
    );
  }

  return (
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
            </BarChart>
          </SafeChartContainer>
        </Card>

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
        </Card>
      </div>
    </div>
  );
};
