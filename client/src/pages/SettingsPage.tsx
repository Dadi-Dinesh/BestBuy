import React from 'react';
import { useAuthStore } from '../store/authStore';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { User, Shield, Database, Bell, CheckCircle2, Building2 } from 'lucide-react';
import { formatDate } from '../utils/helpers';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuthStore();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Application Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your account profile, role configuration, and desktop application preferences.
        </p>
      </div>

      {/* Account Info */}
      <Card padding="md">
        <CardHeader
          title="Account Profile"
          subtitle="Your authenticated credentials and permissions on this desktop client"
        />

        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Full Name</span>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">{user?.name}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Email Address</span>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">{user?.email}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Assigned Role</span>
              <div className="mt-1">
                <Badge
                  variant={
                    user?.role === 'admin'
                      ? 'danger'
                      : user?.role === 'dealer'
                      ? 'info'
                      : 'neutral'
                  }
                >
                  {user?.role.toUpperCase()}
                </Badge>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Member Since</span>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">
                {user?.createdAt ? formatDate(user.createdAt) : 'Current Session'}
              </p>
            </div>
          </div>

          {user?.role === 'dealer' && user.dealerProfile && (
            <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Building2 size={16} className="text-indigo-600" />
                <h4 className="text-sm font-bold text-indigo-950">Dealership Details</h4>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-indigo-900">
                <p><span className="text-indigo-400">Company:</span> {user.dealerProfile.dealershipName}</p>
                <p><span className="text-indigo-400">Reg Number:</span> {user.dealerProfile.registrationNumber}</p>
                <p><span className="text-indigo-400">Contact:</span> {user.dealerProfile.contactPerson}</p>
                <p><span className="text-indigo-400">Verification:</span> {user.dealerProfile.status}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Database & Adapter Configuration */}
      <Card padding="md">
        <CardHeader
          title="Data Adapter & Architecture"
          subtitle="Configuration status for the database abstraction service layer"
        />

        <div className="p-4 bg-slate-50 rounded-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <Database size={18} className="text-blue-600" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Active Adapter: In-Memory Development Store</p>
                <p className="text-xs text-slate-500">Zero-setup isolated desktop storage for rapid testing</p>
              </div>
            </div>
            <Badge variant="success">READY</Badge>
          </div>

          <div className="text-xs text-slate-600 space-y-1 pt-1">
            <p><strong>Configured Environment:</strong> Development</p>
            <p><strong>Database Connection String:</strong> Configurable in <code>.env</code> via <code>DATABASE_URL</code></p>
            <p><strong>Adapter Switching:</strong> Set <code>DATA_ADAPTER=postgres</code> in <code>.env</code> when real database connection is provided.</p>
          </div>
        </div>
      </Card>

      {/* Sign Out Card */}
      <Card padding="md">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Session Management</h4>
            <p className="text-xs text-slate-500 mt-0.5">End your current session on this desktop client.</p>
          </div>
          <Button variant="danger" size="sm" onClick={logout}>
            Sign Out
          </Button>
        </div>
      </Card>
    </div>
  );
};
