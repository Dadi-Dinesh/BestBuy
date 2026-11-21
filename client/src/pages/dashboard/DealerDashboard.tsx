import React from 'react';
import { Car, DollarSign, Users, Eye } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { formatCurrency } from '../../utils/helpers';
import { Link } from 'react-router-dom';

const myListings = [
  { id: 'l1', make: 'Toyota', model: 'Camry', variant: 'LE', price: 28500, color: 'Midnight Black', availability: 'available' as const, views: 42 },
  { id: 'l2', make: 'Toyota', model: 'Camry', variant: 'XSE', price: 34900, color: 'Pearl White', availability: 'reserved' as const, views: 28 },
  { id: 'l5', make: 'Ford', model: 'F-150', variant: 'XLT', price: 45000, color: 'Atlas Blue', availability: 'available' as const, views: 61 },
];

const stats = [
  { label: 'Active Listings', value: '3', icon: <Car size={20} />, color: 'text-blue-600 bg-blue-50' },
  { label: 'Total Revenue', value: '$0', icon: <DollarSign size={20} />, color: 'text-green-600 bg-green-50' },
  { label: 'Queue Requests', value: '5', icon: <Users size={20} />, color: 'text-amber-600 bg-amber-50' },
  { label: 'Listing Views', value: '131', icon: <Eye size={20} />, color: 'text-purple-600 bg-purple-50' },
];

const availabilityBadge = (a: string) => {
  if (a === 'available') return <Badge variant="success">Available</Badge>;
  if (a === 'reserved') return <Badge variant="warning">Reserved</Badge>;
  return <Badge variant="neutral">Sold</Badge>;
};

export const DealerDashboard: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dealer Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your listings and track performance.</p>
        </div>
        <Link to="/inventory">
          <Button leftIcon={<Car size={16} />}>Add Listing</Button>
        </Link>
      </div>

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

      <Card padding="none">
        <div className="p-6 border-b border-slate-100">
          <CardHeader
            title="My Listings"
            subtitle="Your current vehicle inventory"
            action={<Link to="/inventory" className="text-sm text-blue-600 hover:underline">Manage all</Link>}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Vehicle</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Color</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Price</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Views</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {myListings.map(listing => (
                <tr key={listing.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center">
                        <Car size={16} className="text-slate-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{listing.make} {listing.model}</p>
                        <p className="text-xs text-slate-500">{listing.variant}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{listing.color}</td>
                  <td className="px-6 py-4 font-semibold text-slate-900">{formatCurrency(listing.price)}</td>
                  <td className="px-6 py-4">{availabilityBadge(listing.availability)}</td>
                  <td className="px-6 py-4 text-slate-600">{listing.views.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
