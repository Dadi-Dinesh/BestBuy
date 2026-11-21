import React from 'react';
import { Users, Building2, Car, Activity } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Link } from 'react-router-dom';

const stats = [
  { label: 'Total Users', value: '3', icon: <Users size={20} />, color: 'text-blue-600 bg-blue-50', to: '/admin/users' },
  { label: 'Registered Dealers', value: '2', icon: <Building2 size={20} />, color: 'text-green-600 bg-green-50', to: '/admin/dealers' },
  { label: 'Active Listings', value: '5', icon: <Car size={20} />, color: 'text-amber-600 bg-amber-50', to: '/admin/listings' },
  { label: 'Platform Status', value: 'Live', icon: <Activity size={20} />, color: 'text-purple-600 bg-purple-50', to: '#' },
];

const recentUsers = [
  { id: 'u1', name: 'Alice Johnson', email: 'customer@demo.com', role: 'customer', createdAt: '2024-01-10T08:00:00Z' },
  { id: 'u2', name: 'Bob Smith', email: 'dealer@demo.com', role: 'dealer', createdAt: '2024-01-05T08:00:00Z' },
  { id: 'u3', name: 'Admin User', email: 'admin@demo.com', role: 'admin', createdAt: '2024-01-01T08:00:00Z' },
];

const roleBadge = (role: string) => {
  if (role === 'admin') return <Badge variant="danger">Admin</Badge>;
  if (role === 'dealer') return <Badge variant="info">Dealer</Badge>;
  return <Badge variant="neutral">Customer</Badge>;
};

export const AdminDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Admin Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Platform overview and management.</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {stats.map(stat => (
          <Link key={stat.label} to={stat.to}>
            <Card padding="md" hoverable>
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-lg ${stat.color}`}>{stat.icon}</div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card padding="none">
          <div className="p-6 border-b border-slate-100">
            <CardHeader
              title="Recent Users"
              action={<Link to="/admin/users" className="text-sm text-blue-600 hover:underline">View all</Link>}
            />
          </div>
          <div className="divide-y divide-slate-100">
            {recentUsers.map(user => (
              <div key={user.id} className="px-6 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-slate-900">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
                {roleBadge(user.role)}
              </div>
            ))}
          </div>
        </Card>

        <Card padding="md">
          <CardHeader title="System Info" />
          <div className="space-y-3 text-sm">
            {[
              { label: 'Data Adapter', value: 'Mock (Development)' },
              { label: 'Database', value: 'Not connected' },
              { label: 'App Version', value: '1.0.0' },
              { label: 'Environment', value: 'Development' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <span className="text-slate-500">{item.label}</span>
                <span className="font-medium text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
