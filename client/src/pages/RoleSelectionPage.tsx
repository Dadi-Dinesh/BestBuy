import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, ShoppingBag, Store, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import type { UserRole } from '../types';

interface RoleCard {
  role: UserRole;
  title: string;
  tagline: string;
  badge: string;
  icon: React.ReactNode;
  iconBg: string;
  features: string[];
  demoEmail: string;
}

const roleCards: RoleCard[] = [
  {
    role: 'customer',
    title: 'Customer',
    tagline: 'Discover and compare vehicles from verified dealerships',
    badge: 'Buyer Account',
    icon: <ShoppingBag size={24} className="text-slate-600" />,
    iconBg: 'bg-slate-50 border-slate-100',
    features: [
      'Multi-dealer inventory comparison & search',
      'Join shared waitlist queues for high-demand models',
      'Receive competitive offers directly from dealerships',
      'Manage bookings and test drives seamlessly',
    ],
    demoEmail: 'customer@bestbuy.example',
  },
  {
    role: 'dealer',
    title: 'Dealership Partner',
    tagline: 'Showcase showroom inventory and acquire active car buyers',
    badge: 'Dealer Account',
    icon: <Store size={24} className="text-slate-600" />,
    iconBg: 'bg-slate-50 border-slate-100',
    features: [
      'Manage multiple showroom and dealership locations',
      'List vehicles with custom pricing and real-time availability',
      'Fulfill customer queue requests with target offers',
      'Analytics on vehicle views and customer demand',
    ],
    demoEmail: 'dealer@bestbuy.example',
  },
  {
    role: 'admin',
    title: 'Administrator',
    tagline: 'Platform oversight, dealership verification, and system analytics',
    badge: 'System Admin',
    icon: <ShieldCheck size={24} className="text-slate-600" />,
    iconBg: 'bg-slate-50 border-slate-100',
    features: [
      'Review and verify dealership registrations & licenses',
      'Platform-wide audit of listings, bookings, and queues',
      'User management across all buyer and dealer accounts',
      'Monitor data adapters and infrastructure health',
    ],
    demoEmail: 'admin@bestbuy.example',
  },
];

export const RoleSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [loadingRole, setLoadingRole] = React.useState<UserRole | null>(null);

  const handleSelectRole = async (roleCard: RoleCard) => {
    setLoadingRole(roleCard.role);
    try {
      // Login with demo account for that role
      const res = await authService.login({
        email: roleCard.demoEmail,
        password: 'demo1234',
      });
      if (res.success && res.data) {
        setUser(res.data.user, res.data.token);
        navigate('/dashboard');
      }
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-6 md:p-12">
      {/* Top Header */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between pb-8 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-600 rounded-xl flex items-center justify-center text-white shadow-sm">
            <Car size={22} />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-slate-900">BestBuy</span>
            <span className="block text-xs text-slate-500 font-medium">Multi-Dealer Automotive Marketplace</span>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">
              Active as <span className="font-semibold text-slate-800 capitalize">{user.role}</span> ({user.name})
            </span>
            <Button size="sm" variant="secondary" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-6xl w-full mx-auto my-auto py-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="inline-block px-3 py-1 bg-slate-50 border border-slate-100 rounded-full text-xs font-semibold text-slate-700 tracking-wide uppercase mb-3">
            Role Architecture
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            Select Your Marketplace Role
          </h1>
          <p className="text-slate-600 mt-3 text-sm md:text-base leading-relaxed">
            BestBuy connects verified dealerships with car buyers in a unified marketplace. Choose a role to experience its dedicated workspace and capabilities.
          </p>
        </div>

        {/* 3 Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roleCards.map(rc => {
            const isCurrent = user?.role === rc.role;
            return (
              <Card
                key={rc.role}
                padding="lg"
                className={`flex flex-col justify-between relative transition-all duration-200 ${
                  isCurrent ? 'ring-2 ring-slate-600 shadow-md' : 'hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${rc.iconBg}`}>
                      {rc.icon}
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {rc.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900">{rc.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 mb-6 leading-relaxed">{rc.tagline}</p>

                  <div className="space-y-3 mb-8">
                    <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Key Capabilities</p>
                    {rc.features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-600 leading-snug">
                        <CheckCircle2 size={15} className="text-slate-500 flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <Button
                    className="w-full"
                    variant={isCurrent ? 'secondary' : 'primary'}
                    isLoading={loadingRole === rc.role}
                    onClick={() => handleSelectRole(rc)}
                    rightIcon={<ArrowRight size={16} />}
                  >
                    {isCurrent ? `Continue as ${rc.title}` : `Enter as ${rc.title}`}
                  </Button>
                  <p className="text-[11px] text-center text-slate-400 mt-2">
                    Demo credentials: {rc.demoEmail}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Footer info */}
      <div className="max-w-6xl w-full mx-auto text-center pt-6 border-t border-slate-200 text-xs text-slate-500 flex flex-col md:flex-row justify-between items-center gap-2">
        <span>BestBuy Desktop • Windows Client Foundation</span>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/login')} className="hover:text-slate-600 transition-colors">
            Custom Login
          </button>
          <span>•</span>
          <button onClick={() => navigate('/register')} className="hover:text-slate-600 transition-colors">
            Register Account
          </button>
        </div>
      </div>
    </div>
  );
};
