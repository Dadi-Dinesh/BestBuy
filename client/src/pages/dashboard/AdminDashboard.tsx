import React, { useState, useEffect } from 'react';
import {
  Users,
  Building2,
  Car,
  ClipboardList,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { dealerService } from '../../services/dealerService';
import { vehicleService } from '../../services/vehicleService';
import { queueService } from '../../services/queueService';
import { bookingService } from '../../services/bookingService';
import { authService } from '../../services/authService';
import { Dealer, VehicleListing, QueueEntry, Booking, User } from '../../types';
import { formatCurrency, formatDate } from '../../utils/helpers';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'approvals' | 'dealers' | 'vehicles' | 'users' | 'queues'>('approvals');

  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [vehicles, setVehicles] = useState<VehicleListing[]>([]);
  const [queues, setQueues] = useState<QueueEntry[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [dealerSearch, setDealerSearch] = useState('');
  const [approvalFeedback, setApprovalFeedback] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const [dRes, vRes, qRes, bRes, uRes] = await Promise.all([
        dealerService.getAll(),
        vehicleService.getAll(),
        queueService.getAll(),
        bookingService.getAll(),
        authService.getAllUsers(),
      ]);

      if (dRes.success && dRes.data) setDealers(dRes.data);
      if (vRes.success && vRes.data) setVehicles(vRes.data);
      if (qRes.success && qRes.data) setQueues(qRes.data);
      if (bRes.success && bRes.data) setBookings(bRes.data);
      if (uRes.success && uRes.data) setUsers(uRes.data);
    }
    loadData();
  }, []);

  const handleUpdateDealerStatus = async (dealerId: string, status: Dealer['status']) => {
    const res = await dealerService.updateStatus(dealerId, status);
    if (res.success) {
      setDealers(prev => prev.map(d => (d.id === dealerId ? { ...d, status, isVerified: status === 'approved' } : d)));
      setApprovalFeedback(`Dealership ${status === 'approved' ? 'approved and verified' : 'application rejected'}.`);
      setTimeout(() => setApprovalFeedback(null), 3500);
    }
  };

  const pendingDealers = dealers.filter(d => d.status === 'pending');
  const approvedDealers = dealers.filter(d => d.status === 'approved');
  const customerCount = users.filter(u => u.role === 'customer').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              System Administration
            </h1>
            <Badge variant="danger" size="sm">Administrator Oversight</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor marketplace operations, verify dealership registrations, and audit queues across all dealers.
          </p>
        </div>

        {approvalFeedback && (
          <div className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium rounded-lg flex items-center gap-2">
            <CheckCircle2 size={14} />
            <span>{approvalFeedback}</span>
          </div>
        )}
      </div>

      {/* 6 Required Admin Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card padding="sm" className="border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Users size={16} />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-semibold uppercase">Customers</p>
              <p className="text-lg font-bold text-slate-900">{customerCount}</p>
            </div>
          </div>
        </Card>

        <Card padding="sm" className="border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Building2 size={16} />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-semibold uppercase">Dealers</p>
              <p className="text-lg font-bold text-slate-900">{dealers.length}</p>
            </div>
          </div>
        </Card>

        <Card padding="sm" className="border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Car size={16} />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-semibold uppercase">Vehicles</p>
              <p className="text-lg font-bold text-slate-900">{vehicles.length}</p>
            </div>
          </div>
        </Card>

        <Card padding="sm" className="border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <ClipboardList size={16} />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-semibold uppercase">Active Queues</p>
              <p className="text-lg font-bold text-slate-900">{queues.length}</p>
            </div>
          </div>
        </Card>

        <Card padding="sm" className="border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Calendar size={16} />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-semibold uppercase">Bookings</p>
              <p className="text-lg font-bold text-slate-900">{bookings.length}</p>
            </div>
          </div>
        </Card>

        <Card padding="sm" className="border-amber-200 bg-amber-50/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
              <AlertTriangle size={16} />
            </div>
            <div>
              <p className="text-[10px] text-amber-800 font-semibold uppercase">Pending Approvals</p>
              <p className="text-lg font-bold text-amber-900">{pendingDealers.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('approvals')}
          className={`pb-3 px-4 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'approvals'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck size={15} />
          Dealer Approvals ({pendingDealers.length})
        </button>

        <button
          onClick={() => setActiveTab('dealers')}
          className={`pb-3 px-4 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'dealers'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 size={15} />
          All Dealerships ({dealers.length})
        </button>

        <button
          onClick={() => setActiveTab('vehicles')}
          className={`pb-3 px-4 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'vehicles'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Car size={15} />
          Platform Vehicles ({vehicles.length})
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-4 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'users'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users size={15} />
          Registered Users ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('queues')}
          className={`pb-3 px-4 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'queues'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ClipboardList size={15} />
          Audit Queues ({queues.length})
        </button>
      </div>

      {/* TAB 1: DEALER APPROVAL MANAGEMENT */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck size={20} className="text-amber-700 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-900">Dealer Verification & Licensing Audit</p>
                <p className="text-xs text-amber-800 mt-0.5">
                  Newly registered dealerships require administrative review and verification before they can post live inventory or contact customers.
                </p>
              </div>
            </div>
            <Badge variant={pendingDealers.length > 0 ? 'warning' : 'success'}>
              {pendingDealers.length} Action Required
            </Badge>
          </div>

          <Card padding="none">
            <div className="p-5 border-b border-slate-100">
              <CardHeader
                title="Pending Dealership Applications"
                subtitle="Review business registration numbers, authorized contacts, and physical showroom locations."
              />
            </div>

            {pendingDealers.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle2 size={36} className="text-emerald-500 mx-auto mb-2" />
                <h4 className="text-base font-bold text-slate-800">All Dealership Applications Reviewed</h4>
                <p className="text-xs text-slate-500 mt-1">There are no pending dealer registrations at this time.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingDealers.map(d => (
                  <div key={d.id} className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                          <Building2 size={20} />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-slate-900">{d.dealershipName}</h4>
                          <span className="text-xs font-mono font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Reg #{d.registrationNumber}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-600 pt-1">
                        <p>
                          <span className="text-slate-400">Contact Person:</span>{' '}
                          <span className="font-semibold text-slate-800">{d.contactPerson}</span>
                        </p>
                        <p>
                          <span className="text-slate-400">Phone:</span>{' '}
                          <span className="font-semibold text-slate-800">{d.phone}</span>
                        </p>
                        <p>
                          <span className="text-slate-400">Email:</span>{' '}
                          <span className="font-semibold text-slate-800">{d.email}</span>
                        </p>
                        <p>
                          <span className="text-slate-400">Address:</span>{' '}
                          <span className="font-semibold text-slate-800">
                            {d.address}, {d.city}, {d.state} {d.pinCode}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end lg:self-center">
                      <Button
                        size="sm"
                        onClick={() => handleUpdateDealerStatus(d.id, 'approved')}
                        leftIcon={<Check size={16} />}
                      >
                        Approve & Verify
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleUpdateDealerStatus(d.id, 'rejected')}
                        leftIcon={<XCircle size={16} />}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 2: ALL DEALERSHIPS */}
      {activeTab === 'dealers' && (
        <Card padding="none">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardHeader
              title="Registered Dealership Network"
              subtitle="All registered car dealerships on the BestBuy marketplace."
            />
            <div className="w-64">
              <Input
                placeholder="Search dealerships..."
                value={dealerSearch}
                onChange={e => setDealerSearch(e.target.value)}
                leftElement={<Search size={14} />}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase text-[11px] font-semibold tracking-wider">
                <tr>
                  <th className="px-6 py-3">Dealership</th>
                  <th className="px-6 py-3">License / Reg #</th>
                  <th className="px-6 py-3">Location</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dealers
                  .filter(d => d.dealershipName.toLowerCase().includes(dealerSearch.toLowerCase()) || d.city.toLowerCase().includes(dealerSearch.toLowerCase()))
                  .map(d => (
                    <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">{d.dealershipName}</td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-600">{d.registrationNumber}</td>
                      <td className="px-6 py-4 text-xs text-slate-600">{d.city}, {d.state}</td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        {d.contactPerson} ({d.phone})
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={d.status === 'approved' ? 'success' : d.status === 'pending' ? 'warning' : 'danger'}>
                          {d.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {d.status === 'pending' ? (
                          <Button size="sm" onClick={() => handleUpdateDealerStatus(d.id, 'approved')}>
                            Approve
                          </Button>
                        ) : (
                          <button
                            onClick={() => handleUpdateDealerStatus(d.id, d.status === 'approved' ? 'pending' : 'approved')}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Toggle Status
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: PLATFORM VEHICLES */}
      {activeTab === 'vehicles' && (
        <Card padding="none">
          <div className="p-5 border-b border-slate-100">
            <CardHeader
              title="All Platform Vehicle Listings"
              subtitle="Overview of all vehicles published across every dealership."
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase text-[11px] font-semibold tracking-wider">
                <tr>
                  <th className="px-6 py-3">Vehicle</th>
                  <th className="px-6 py-3">Listing Dealer</th>
                  <th className="px-6 py-3">Color</th>
                  <th className="px-6 py-3">Price</th>
                  <th className="px-6 py-3">Availability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vehicles.map(v => (
                  <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{v.vehicleModel?.make} {v.vehicleModel?.model}</p>
                      <p className="text-xs text-slate-500">{v.variant?.name}</p>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-700">
                      {v.dealer?.dealershipName}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">{v.color}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{formatCurrency(v.price)}</td>
                    <td className="px-6 py-4">
                      <Badge variant={v.availability === 'available' ? 'success' : 'warning'}>
                        {v.availability}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 4: USERS AUDIT */}
      {activeTab === 'users' && (
        <Card padding="none">
          <div className="p-5 border-b border-slate-100">
            <CardHeader
              title="All User Accounts"
              subtitle="Registered users across Customer, Dealer, and Administrator roles."
            />
          </div>

          <div className="divide-y divide-slate-100">
            {users.map(u => (
              <div key={u.id} className="p-4 px-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{u.name}</p>
                  <p className="text-xs text-slate-500">{u.email} • {u.phoneNumber || 'No phone'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">Created: {formatDate(u.createdAt)}</span>
                  <Badge variant={u.role === 'admin' ? 'danger' : u.role === 'dealer' ? 'info' : 'neutral'}>
                    {u.role.toUpperCase()}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 5: AUDIT QUEUES */}
      {activeTab === 'queues' && (
        <Card padding="none">
          <div className="p-5 border-b border-slate-100">
            <CardHeader
              title="Platform Waitlist Queue Overview"
              subtitle="Live queue tracking and customer demand monitoring."
            />
          </div>

          <div className="divide-y divide-slate-100">
            {queues.map(q => (
              <div key={q.id} className="p-4 px-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-xs">
                    #{q.position}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {q.vehicleModel?.make} {q.vehicleModel?.model} ({q.variant?.name || 'All Variants'})
                    </p>
                    <p className="text-xs text-slate-500">
                      Customer: <span className="font-medium text-slate-700">{q.customerName}</span> ({q.customerPhone || 'Verified'})
                    </p>
                  </div>
                </div>

                <Badge variant={q.status === 'offered' ? 'warning' : 'default'}>
                  {q.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
