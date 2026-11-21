import React from 'react';
import { Car, Search, ClipboardList, BookOpen, TrendingUp } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { formatCurrency } from '../../utils/helpers';
import { Link } from 'react-router-dom';

const recentListings = [
  { id: 'l1', make: 'Toyota', model: 'Camry', variant: 'LE', price: 28500, dealer: 'Premier Auto Group', availability: 'available' as const },
  { id: 'l3', make: 'Toyota', model: 'Camry', variant: 'LE', price: 27800, dealer: 'City Cars Direct', availability: 'available' as const },
  { id: 'l4', make: 'Honda', model: 'Accord', variant: 'Sport', price: 31200, dealer: 'City Cars Direct', availability: 'available' as const },
];

const stats = [
  { label: 'Saved Searches', value: '3', icon: <Search size={20} />, color: 'text-blue-600 bg-blue-50' },
  { label: 'Queue Positions', value: '1', icon: <ClipboardList size={20} />, color: 'text-amber-600 bg-amber-50' },
  { label: 'Active Bookings', value: '0', icon: <BookOpen size={20} />, color: 'text-green-600 bg-green-50' },
  { label: 'Cars Viewed', value: '12', icon: <Car size={20} />, color: 'text-purple-600 bg-purple-50' },
];

export const CustomerDashboard: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="text-sm text-slate-500 mt-1">Find your perfect vehicle from multiple dealers.</p>
        </div>
        <Link to="/browse">
          <Button leftIcon={<Search size={16} />}>Browse Cars</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map(stat => (
          <Card key={stat.label} padding="md">
            <div className="flex items-center gap-4">
              <div className={`p-2.5 rounded-lg ${stat.color}`}>{stat.icon}</div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-sm text-slate-500">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Recent listings */}
        <div className="col-span-3">
          <Card padding="none">
            <div className="p-6 border-b border-slate-100">
              <CardHeader
                title="Available Vehicles"
                subtitle="Recently listed vehicles matching your interests"
                action={<Link to="/browse" className="text-sm text-blue-600 hover:underline">View all</Link>}
              />
            </div>
            <div className="divide-y divide-slate-100">
              {recentListings.map(listing => (
                <div key={listing.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Car size={18} className="text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{listing.make} {listing.model} <span className="text-slate-500">{listing.variant}</span></p>
                      <p className="text-xs text-slate-500">{listing.dealer}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="success">Available</Badge>
                    <span className="text-sm font-semibold text-slate-900">{formatCurrency(listing.price)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Market pulse */}
        <div className="col-span-2 space-y-4">
          <Card padding="md">
            <CardHeader title="Market Pulse" subtitle="Price trends for top models" />
            <div className="space-y-3">
              {[
                { model: 'Toyota Camry', low: 27800, high: 34900 },
                { model: 'Honda Accord', low: 31200, high: 36000 },
                { model: 'Ford F-150', low: 42000, high: 55000 },
              ].map(item => (
                <div key={item.model} className="flex items-center gap-3">
                  <TrendingUp size={14} className="text-blue-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{item.model}</p>
                    <p className="text-xs text-slate-500">{formatCurrency(item.low)} – {formatCurrency(item.high)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card padding="md">
            <CardHeader title="Quick Actions" />
            <div className="space-y-2">
              <Link to="/browse" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-sm text-slate-700">
                <Search size={16} className="text-slate-400" /> Search vehicles
              </Link>
              <Link to="/queue" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-sm text-slate-700">
                <ClipboardList size={16} className="text-slate-400" /> View my queue
              </Link>
              <Link to="/bookings" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-sm text-slate-700">
                <BookOpen size={16} className="text-slate-400" /> My bookings
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
