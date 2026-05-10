const Card = ({ title, value, children }: any) => (
  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-lg hover:shadow-xl transition">
    <div className="text-sm text-gray-400 mb-2">{title}</div>
    <div className="text-2xl font-bold text-white mb-3">{value}</div>
    {children}
  </div>
);

const Sidebar = () => (
  <div className="w-64 h-screen bg-black/40 backdrop-blur-xl border-r border-white/10 p-6 flex flex-col">
    <h1 className="text-white text-xl font-bold mb-8">3000Studios</h1>

    <nav className="space-y-4 text-gray-400">
      <div className="hover:text-white cursor-pointer">Dashboard</div>
      <div className="hover:text-white cursor-pointer">Projects</div>
      <div className="hover:text-white cursor-pointer">Analytics</div>
      <div className="hover:text-white cursor-pointer">Monetization</div>
      <div className="hover:text-white cursor-pointer">Automation</div>
      <div className="hover:text-white cursor-pointer">Settings</div>
    </nav>

    <div className="mt-auto text-xs text-gray-500">
      Plan: <span className="text-indigo-400">PRO</span>
    </div>
  </div>
);

const Header = () => (
  <div className="flex justify-between items-center mb-6">
    <input
      placeholder="Search..."
      className="bg-white/10 text-white px-4 py-2 rounded-xl outline-none w-80"
    />

    <div className="flex items-center gap-4">
      <span className="text-green-400 text-sm">● System Healthy</span>
      <div className="w-8 h-8 bg-indigo-500 rounded-full"></div>
    </div>
  </div>
);

const ChartMock = () => (
  <div className="h-24 bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-xl opacity-80"></div>
);

const Dashboard = () => {
  return (
    <div className="flex bg-gradient-to-br from-black via-slate-900 to-black min-h-screen text-white">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 p-6">
        <Header />

        {/* Top Stats */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <Card title="Revenue" value="$54,200">
            <ChartMock />
          </Card>

          <Card title="Conversion Rate" value="21.5%">
            <ChartMock />
          </Card>

          <Card title="Users" value="24,473">
            <ChartMock />
          </Card>
        </div>

        {/* Middle Section */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <Card title="Growth" value="$9,257">
            <div className="h-40 bg-indigo-500/30 rounded-xl"></div>
          </Card>

          <Card title="Retention" value="78%">
            <div className="flex gap-2 mt-4">
              {[40, 60, 80, 50, 70, 90].map((h, i) => (
                <div
                  key={i}
                  className="w-6 bg-gradient-to-t from-indigo-500 to-cyan-400 rounded"
                  style={{ height: `${h}px` }}
                />
              ))}
            </div>
          </Card>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-3 gap-6">
          <Card title="Revenue Sources" value="">
            <div className="h-32 bg-cyan-400/20 rounded-xl"></div>
          </Card>

          <Card title="System Connections" value="">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Stripe</span>
                <span className="text-green-400">Active</span>
              </div>
              <div className="flex justify-between">
                <span>Zapier</span>
                <span className="text-green-400">Connected</span>
              </div>
              <div className="flex justify-between">
                <span>Shopify</span>
                <span className="text-yellow-400">Pending</span>
              </div>
            </div>
          </Card>

          <Card title="AI Activity" value="">
            <div className="text-sm text-gray-400 space-y-2">
              <div>Generated new site</div>
              <div>Optimized SEO</div>
              <div>Injected ads</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
