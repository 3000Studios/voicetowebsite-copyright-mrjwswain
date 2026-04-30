import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  Clock,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Download,
} from 'lucide-react';
import { useAnalytics } from '../../hooks/useAnalytics';

interface AnalyticsData {
  overview: {
    totalViews: number;
    uniqueVisitors: number;
    avgTimeOnSite: string;
    bounceRate: number;
    viewsChange: number;
    visitorsChange: number;
  };
  devices: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  topPages: Array<{
    path: string;
    views: number;
    change: number;
  }>;
  referrals: Array<{
    source: string;
    visitors: number;
    percentage: number;
  }>;
  dailyStats: Array<{
    date: string;
    views: number;
    visitors: number;
  }>;
}

const mockAnalytics: AnalyticsData = {
  overview: {
    totalViews: 45231,
    uniqueVisitors: 18234,
    avgTimeOnSite: '2m 34s',
    bounceRate: 42.3,
    viewsChange: 12.5,
    visitorsChange: 8.2,
  },
  devices: {
    desktop: 58,
    mobile: 35,
    tablet: 7,
  },
  topPages: [
    { path: '/', views: 15234, change: 15.2 },
    { path: '/pricing', views: 8432, change: -5.3 },
    { path: '/features', views: 6234, change: 22.1 },
    { path: '/blog', views: 4321, change: 8.7 },
    { path: '/contact', views: 3124, change: -2.1 },
  ],
  referrals: [
    { source: 'Google', visitors: 8234, percentage: 45 },
    { source: 'Direct', visitors: 5234, percentage: 29 },
    { source: 'Social Media', visitors: 2834, percentage: 15 },
    { source: 'Referral', visitors: 1234, percentage: 7 },
    { source: 'Email', visitors: 634, percentage: 4 },
  ],
  dailyStats: [
    { date: '2024-01-01', views: 1200, visitors: 800 },
    { date: '2024-01-02', views: 1350, visitors: 900 },
    { date: '2024-01-03', views: 1100, visitors: 750 },
    { date: '2024-01-04', views: 1400, visitors: 950 },
    { date: '2024-01-05', views: 1600, visitors: 1100 },
    { date: '2024-01-06', views: 1800, visitors: 1200 },
    { date: '2024-01-07', views: 2100, visitors: 1400 },
  ],
};

export function AnalyticsDashboard() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [data, setData] = useState<AnalyticsData>(mockAnalytics);
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    trackEvent('page_view', { page: 'analytics_dashboard' });
  }, [trackEvent]);

  const StatCard = ({
    title,
    value,
    change,
    icon: Icon,
  }: {
    title: string;
    value: string | number;
    change?: number;
    icon: any;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0f172a] border border-white/10 rounded-xl p-6"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/60 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white mt-2">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{Math.abs(change)}%</span>
              <span className="text-white/40">vs last period</span>
            </div>
          )}
        </div>
        <div className="p-3 bg-cyan-500/10 rounded-lg">
          <Icon className="w-5 h-5 text-cyan-400" />
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#0a1628] text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-white/60 mt-1">Track your website performance</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Period Selector */}
          <div className="flex bg-white/5 rounded-lg p-1">
            {(['7d', '30d', '90d'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  period === p ? 'bg-cyan-500 text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                {p === '7d' ? 'Last 7 days' : p === '30d' ? 'Last 30 days' : 'Last 90 days'}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Views"
          value={data.overview.totalViews.toLocaleString()}
          change={data.overview.viewsChange}
          icon={Eye}
        />
        <StatCard
          title="Unique Visitors"
          value={data.overview.uniqueVisitors.toLocaleString()}
          change={data.overview.visitorsChange}
          icon={Users}
        />
        <StatCard
          title="Avg. Time on Site"
          value={data.overview.avgTimeOnSite}
          icon={Clock}
        />
        <StatCard
          title="Bounce Rate"
          value={`${data.overview.bounceRate}%`}
          change={-2.5}
          icon={BarChart3}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Traffic Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-[#0f172a] border border-white/10 rounded-xl p-6"
        >
          <h3 className="font-semibold mb-6">Traffic Overview</h3>
          <div className="h-64 flex items-end gap-2">
            {data.dailyStats.map((stat, i) => {
              const maxViews = Math.max(...data.dailyStats.map(s => s.views));
              const height = (stat.views / maxViews) * 100;
              return (
                <div key={stat.date} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-cyan-500/20 rounded-t-lg relative group cursor-pointer"
                    style={{ height: `${height}%` }}
                  >
                    <div className="absolute inset-0 bg-cyan-500 rounded-t-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-white text-black text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {stat.views.toLocaleString()} views
                    </div>
                  </div>
                  <span className="text-xs text-white/40">
                    {new Date(stat.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Device Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#0f172a] border border-white/10 rounded-xl p-6"
        >
          <h3 className="font-semibold mb-6">Device Breakdown</h3>
          <div className="space-y-4">
            <DeviceRow
              icon={Monitor}
              label="Desktop"
              value={data.devices.desktop}
              color="bg-blue-500"
            />
            <DeviceRow
              icon={Smartphone}
              label="Mobile"
              value={data.devices.mobile}
              color="bg-green-500"
            />
            <DeviceRow
              icon={Tablet}
              label="Tablet"
              value={data.devices.tablet}
              color="bg-purple-500"
            />
          </div>
        </motion.div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#0f172a] border border-white/10 rounded-xl p-6"
        >
          <h3 className="font-semibold mb-4">Top Pages</h3>
          <div className="space-y-3">
            {data.topPages.map((page, i) => (
              <div key={page.path} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-white/40 w-6">{i + 1}</span>
                  <span className="font-medium">{page.path}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-white/60">{page.views.toLocaleString()}</span>
                  <span className={`flex items-center gap-1 text-sm ${page.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {page.change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    {Math.abs(page.change)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Traffic Sources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#0f172a] border border-white/10 rounded-xl p-6"
        >
          <h3 className="font-semibold mb-4">Traffic Sources</h3>
          <div className="space-y-4">
            {data.referrals.map((ref) => (
              <div key={ref.source}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-white/40" />
                    <span className="font-medium">{ref.source}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-white/60">{ref.visitors.toLocaleString()}</span>
                    <span className="text-white/40 text-sm">{ref.percentage}%</span>
                  </div>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 rounded-full"
                    style={{ width: `${ref.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function DeviceRow({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className={`p-2 rounded-lg ${color} bg-opacity-20`}>
        <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm">{label}</span>
          <span className="text-sm font-medium">{value}%</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div className={`h-full ${color} rounded-full`} style={{ width: `${value}%` }} />
        </div>
      </div>
    </div>
  );
}
