import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Globe,
  CreditCard,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Settings,
  Shield,
  Zap,
  Search,
  Filter,
  Download,
  RefreshCw,
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalSites: number;
  totalRevenue: number;
  activeSubscriptions: number;
  sitesToday: number;
  newUsersToday: number;
}

interface RecentActivity {
  id: string;
  type: 'user_signup' | 'site_created' | 'subscription_started' | 'payment_received';
  description: string;
  user: string;
  timestamp: string;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 1234,
    totalSites: 3456,
    totalRevenue: 45678,
    activeSubscriptions: 567,
    sitesToday: 45,
    newUsersToday: 12,
  });

  const [activities] = useState<RecentActivity[]>([
    { id: '1', type: 'subscription_started', description: 'Upgraded to Pro', user: 'john@example.com', timestamp: '2 min ago' },
    { id: '2', type: 'site_created', description: 'Created "Coffee Shop" site', user: 'jane@example.com', timestamp: '5 min ago' },
    { id: '3', type: 'user_signup', description: 'New user registered', user: 'mike@example.com', timestamp: '10 min ago' },
    { id: '4', type: 'payment_received', description: 'Payment $19.99 received', user: 'sarah@example.com', timestamp: '15 min ago' },
  ]);

  const [searchQuery, setSearchQuery] = useState('');

  const statCards = [
    { icon: Users, label: 'Total Users', value: stats.totalUsers.toLocaleString(), change: '+12', color: 'bg-blue-500' },
    { icon: Globe, label: 'Total Sites', value: stats.totalSites.toLocaleString(), change: '+45', color: 'bg-green-500' },
    { icon: CreditCard, label: 'Revenue', value: `$${stats.totalRevenue.toLocaleString()}`, change: '+$2,340', color: 'bg-purple-500' },
    { icon: Zap, label: 'Active Subs', value: stats.activeSubscriptions.toString(), change: '+8', color: 'bg-amber-500' },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_signup': return Users;
      case 'site_created': return Globe;
      case 'subscription_started': return TrendingUp;
      case 'payment_received': return CreditCard;
      default: return AlertCircle;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'user_signup': return 'text-blue-400 bg-blue-400/10';
      case 'site_created': return 'text-green-400 bg-green-400/10';
      case 'subscription_started': return 'text-purple-400 bg-purple-400/10';
      case 'payment_received': return 'text-amber-400 bg-amber-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1628] text-white p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-white/60 mt-1">Platform overview and management</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[#0f172a] border border-white/10 rounded-xl p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/60 text-sm">{stat.label}</p>
                <p className="text-2xl font-bold text-white mt-2">{stat.value}</p>
                <p className="text-green-400 text-sm mt-1">{stat.change} today</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color} bg-opacity-20`}>
                <stat.icon className={`w-5 h-5 ${stat.color.replace('bg-', 'text-')}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-[#0f172a] border border-white/10 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Recent Activity</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-cyan-500 w-48"
                />
              </div>
              <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = getActivityIcon(activity.type);
              const colorClass = getActivityColor(activity.type);
              
              return (
                <div key={activity.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
                  <div className={`p-2 rounded-lg ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{activity.description}</p>
                    <p className="text-sm text-white/60">{activity.user}</p>
                  </div>
                  <span className="text-sm text-white/40">{activity.timestamp}</span>
                </div>
              );
            })}
          </div>

          <button className="w-full mt-4 py-3 text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
            View All Activity →
          </button>
        </motion.div>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-[#0f172a] border border-white/10 rounded-xl p-6"
          >
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-left">
                <Shield className="w-5 h-5 text-cyan-400" />
                <span>Review Pending Templates</span>
                <span className="ml-auto px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded">3</span>
              </button>
              <button className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-left">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <span>System Alerts</span>
                <span className="ml-auto px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">0</span>
              </button>
              <button className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-left">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                <span>View Analytics</span>
              </button>
              <button className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-left">
                <Settings className="w-5 h-5 text-gray-400" />
                <span>Platform Settings</span>
              </button>
            </div>
          </motion.div>

          {/* System Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-[#0f172a] border border-white/10 rounded-xl p-6"
          >
            <h3 className="font-semibold mb-4">System Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">API</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm">Operational</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">AI Service</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm">Operational</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">Stripe</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm">Operational</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">Database</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm">Operational</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* A/B Tests Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mt-8 bg-[#0f172a] border border-white/10 rounded-xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Active A/B Tests</h2>
          <button className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-sm transition-colors">
            + New Test
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-sm font-medium text-white/60">Test Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-white/60">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-white/60">Variants</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-white/60">Participants</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-white/60">Winner</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-white/60">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/5">
                <td className="py-4 px-4">Pricing Page v2</td>
                <td className="py-4 px-4">
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">Running</span>
                </td>
                <td className="py-4 px-4">2 (Control vs Treatment)</td>
                <td className="py-4 px-4">1,234</td>
                <td className="py-4 px-4 text-white/40">Undetermined</td>
                <td className="py-4 px-4">
                  <button className="text-cyan-400 hover:text-cyan-300 text-sm">View Results</button>
                </td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-4 px-4">Homepage Hero</td>
                <td className="py-4 px-4">
                  <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded">Paused</span>
                </td>
                <td className="py-4 px-4">3 (A vs B vs C)</td>
                <td className="py-4 px-4">2,567</td>
                <td className="py-4 px-4 text-amber-400">Variant B</td>
                <td className="py-4 px-4">
                  <button className="text-cyan-400 hover:text-cyan-300 text-sm">Resume</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
