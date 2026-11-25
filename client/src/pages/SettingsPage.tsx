import { useEffect, useState } from 'react';
import { indiaRequest } from '../services/indiaService';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { useDatabaseMode } from '../services/desktopMode';
import React from 'react';
import { useAuthStore } from '../store/authStore';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { User, Shield, Database, Bell, CheckCircle2, Building2 } from 'lucide-react';
import { formatDate } from '../utils/helpers';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuthStore();
  const database = useDatabaseMode();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Application Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your account profile, role configuration, and desktop application preferences.
        </p>
      </div>

      <ThemeToggle />
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
            <div className="p-4 bg-slate-50/60 border border-slate-100 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Building2 size={16} className="text-slate-600" />
                <h4 className="text-sm font-bold text-slate-950">Dealership Details</h4>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-900">
                <p><span className="text-slate-400">Company:</span> {user.dealerProfile.dealershipName}</p>
                <p><span className="text-slate-400">Reg Number:</span> {user.dealerProfile.registrationNumber}</p>
                <p><span className="text-slate-400">Contact:</span> {user.dealerProfile.contactPerson}</p>
                <p><span className="text-slate-400">Verification:</span> {user.dealerProfile.status}</p>
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
              <Database size={18} className="text-slate-600" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Active adapter · {database === null ? 'Checking' : database ? 'PostgreSQL' : 'In-memory demo'}</p>
                <p className="text-xs text-slate-500">{database ? 'Records are stored in the configured database.' : database === false ? 'Demo changes last for the current session.' : 'Checking the desktop connection.'}</p>
              </div>
            </div>
            <Badge variant={database === null ? 'neutral' : 'success'}>{database === null ? 'CHECKING' : 'READY'}</Badge>
          </div>

          <div className="text-xs text-slate-600 space-y-1 pt-1">
            <p><strong>Database Connection String:</strong> Configurable in <code>.env</code> via <code>DATABASE_URL</code></p>
            <p><strong>Adapter Switching:</strong> Set <code>DATA_ADAPTER=postgres</code> in <code>.env</code> when real database connection is provided.</p>
          </div>
        </div>
      </Card>

      {user?.role==='admin'&&<MarketplaceSettings />}
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

function MarketplaceSettings() {
  const [days,setDays]=useState<number>();
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  useEffect(()=>{
    indiaRequest<number>('settings').then(setDays).catch((error:Error)=>setError(error.message));
  },[]);
  return <Card>
    <CardHeader title="Marketplace settings" subtitle="Limit how far in advance dealers publish slots and customers request appointments."/>
    <form className="space-y-3" onSubmit={event=>{
      event.preventDefault();setBusy(true);setError('');setMessage('');
      indiaRequest<number>('setSettings',days).then(value=>{setDays(value);setMessage('Booking window saved.');})
        .catch((error:Error)=>setError(error.message)).finally(()=>setBusy(false));
    }}>
      <label className="block">Booking window in days<input required className="input-field mt-1" type="number" min="7" max="120"
        value={days??''} onChange={event=>setDays(event.target.valueAsNumber)}/></label>
      {error&&<p role="alert">{error}</p>}{message&&<p role="status">{message}</p>}
      <Button type="submit" disabled={days===undefined||busy}>Save booking window</Button>
    </form>
  </Card>;
}
