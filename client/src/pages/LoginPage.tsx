import { useDemoMode } from '../services/desktopMode';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, Mail, Lock, Eye, EyeOff, AlertCircle, ShoppingBag, Store, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [generalError, setGeneralError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validate = (): boolean => {
    const errs: { email?: string; password?: string } = {};

    if (!email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errs.password = 'Password is required.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');

    if (!validate()) return;

    setIsLoading(true);

    try {
      const result = await authService.login({
        email: email.trim(),
        password,
      });

      if (result.success && result.data) {
        setUser(result.data.user, result.data.token);
        navigate('/dashboard');
      } else {
        setGeneralError(result.error || 'Authentication failed. Please verify your credentials.');
      }
    } catch {
      setGeneralError('An unexpected network error occurred. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const demo = useDemoMode();

  const fillDemo = (role: UserRole) => {
    setEmail(`${role}@demo.com`);
    setPassword('demo1234');
    setErrors({});
    setGeneralError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Car size={24} />
          </div>
          <div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">BestBuy</span>
            <span className="block text-xs text-slate-500 font-medium -mt-0.5">Automotive Desktop Platform</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 sm:p-9">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">Sign in to your account</h2>
            <p className="text-sm text-slate-500 mt-1">Enter your credentials to access the marketplace</p>
          </div>

          {generalError && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5">
              <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 font-medium leading-relaxed">{generalError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              label="Email address"
              type="email"
              placeholder="name@domain.com"
              value={email}
              onChange={e => {
                setEmail(e.target.value);
                if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
              }}
              error={errors.email}
              required
              autoComplete="email"
              leftElement={<Mail size={16} />}
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={e => {
                setPassword(e.target.value);
                if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
              }}
              error={errors.password}
              required
              autoComplete="current-password"
              leftElement={<Lock size={16} />}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="text-slate-400 hover:text-slate-600 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

            <Button type="submit" className="w-full mt-2 font-semibold" size="md" isLoading={isLoading}>
              Sign In
            </Button>
          </form>

          {demo &&
          <div className="mt-8 pt-5 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2.5 text-center">
              Quick Demo Accounts (Password: demo1234)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemo('customer')}
                className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all text-center group"
              >
                <ShoppingBag size={16} className="text-blue-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-slate-800">Customer</span>
                <span className="text-[10px] text-slate-400">Alice</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('dealer')}
                className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all text-center group"
              >
                <Store size={16} className="text-indigo-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-slate-800">Dealer</span>
                <span className="text-[10px] text-slate-400">Bob</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('admin')}
                className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all text-center group"
              >
                <ShieldCheck size={16} className="text-emerald-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-slate-800">Admin</span>
                <span className="text-[10px] text-slate-400">System</span>
              </button>
            </div>
          </div>}
        </div>

        {/* Links */}
        <div className="text-center text-xs text-slate-500 mt-6 space-y-1">
          <p>
            Don't have an account yet?{' '}
            <Link to="/register" className="text-blue-600 font-semibold hover:underline">
              Create an account
            </Link>
          </p>
          <p>
            Want to see all role features?{' '}
            {demo && <Link to="/role-selection" className="text-blue-600 font-semibold hover:underline">
              Browse role catalog
            </Link>}
          </p>
        </div>
      </div>
    </div>
  );
};
