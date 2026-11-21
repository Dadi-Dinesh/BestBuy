import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const result = await authService.login({ email, password });
      if (result.success && result.data) {
        setUser(result.data.user, result.data.token);
        navigate('/dashboard');
      } else {
        setError(result.error || 'Login failed. Please try again.');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (role: 'customer' | 'dealer' | 'admin') => {
    setEmail(`${role}@demo.com`);
    setPassword('demo1234');
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Car size={20} className="text-white" />
          </div>
          <span className="text-2xl font-bold text-slate-900">BestBuy</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900">Sign in</h2>
            <p className="text-sm text-slate-500 mt-1">Welcome back to BestBuy</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              leftElement={<Mail size={16} />}
            />
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              leftElement={<Lock size={16} />}
              rightElement={
                <button type="button" onClick={() => setShowPassword(v => !v)} className="hover:text-slate-600">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

            <Button type="submit" className="w-full" size="md" isLoading={isLoading}>
              Sign In
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500 text-center mb-3">Demo accounts (password: demo1234)</p>
            <div className="grid grid-cols-3 gap-2">
              {(['customer', 'dealer', 'admin'] as const).map(role => (
                <button
                  key={role}
                  onClick={() => fillDemo(role)}
                  className="px-2 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 capitalize transition-colors"
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-slate-500 mt-6 space-y-1">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 font-medium hover:underline">
              Create one
            </Link>
          </p>
          <p>
            Or browse by{' '}
            <Link to="/role-selection" className="text-blue-600 font-medium hover:underline">
              Selecting a Role
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
