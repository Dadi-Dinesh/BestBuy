import { AuthLayout } from '../components/layout/AuthLayout';
import { indiaLocations } from '../../../src/data/indiaLocations';
import { SelectField } from './india/IndiaCatalogue';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Car,
  Mail,
  Lock,
  User,
  Phone,
  Building2,
  FileText,
  UserCheck,
  MapPin,
  Eye,
  EyeOff,
  ShoppingBag,
  Store,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { RegisterData, UserRole } from '../types';
import { cn } from '../utils/helpers';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  // Role
  const [role, setRole] = useState<'customer' | 'dealer'>('customer');

  // Base fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Dealer specific fields
  const [dealershipName, setDealershipName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [dealershipPhone, setDealershipPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pinCode, setPinCode] = useState('');

  // Form states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Full name is required.';
    if (!email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required.';
    } else if (phoneNumber.replace(/\D/g, '').length < 10) {
      newErrors.phoneNumber = 'Please enter a valid phone number (at least 10 digits).';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirm your password.';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    if (role === 'dealer') {
      if (!dealershipName.trim()) newErrors.dealershipName = 'Dealership name is required.';
      if (!registrationNumber.trim()) newErrors.registrationNumber = 'Registration number is required.';
      if (!contactPerson.trim()) newErrors.contactPerson = 'Contact person name is required.';
      if (!dealershipPhone.trim()) newErrors.dealershipPhone = 'Dealership phone is required.';
      if (!address.trim()) newErrors.address = 'Showroom address is required.';
      if (!city.trim()) newErrors.city = 'City is required.';
      if (!state.trim()) newErrors.state = 'State is required.';
      if (!pinCode.trim()) {
        newErrors.pinCode = 'PIN code code is required.';
      } else if (!/^[1-9]\d{5}$/.test(pinCode.replace(/\s|-/g, ''))) {
        newErrors.pinCode = 'Enter a six-digit Indian PIN code.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    setSuccessMessage('');

    if (!validateForm()) {
      setGeneralError('Please correct the highlighted fields before submitting.');
      return;
    }

    setIsLoading(true);

    try {
      let payload: RegisterData;

      if (role === 'customer') {
        payload = {
          role: 'customer',
          name: name.trim(),
          email: email.trim(),
          phoneNumber: phoneNumber.trim(),
          password,
        };
      } else {
        payload = {
          role: 'dealer',
          name: name.trim(),
          email: email.trim(),
          phoneNumber: phoneNumber.trim(),
          password,
          dealershipName: dealershipName.trim(),
          registrationNumber: registrationNumber.trim(),
          contactPerson: contactPerson.trim(),
          dealershipPhone: dealershipPhone.trim(),
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          pinCode: pinCode.trim(),
        };
      }

      const res = await authService.register(payload);

      if (res.success && res.data) {
        setUser(res.data.user, res.data.token);
        setSuccessMessage(res.message || 'Account successfully registered!');
        setTimeout(() => {
          navigate('/dashboard');
        }, 800);
      } else {
        setGeneralError(res.error || 'Registration failed. Please try again.');
      }
    } catch {
      setGeneralError('An unexpected network error occurred. Please verify your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        {/* Brand */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-11 h-11 bg-slate-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-slate-500/20">
            <Car size={24} />
          </div>
          <div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">BestBuy</span>
            <span className="block text-xs text-slate-500 font-medium -mt-0.5">Automotive Desktop Platform</span>
          </div>
        </div>

        {/* Card Header */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 sm:p-10">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Create your account</h2>
            <p className="text-sm text-slate-500 mt-1">
              Join the multi-dealer marketplace as a vehicle buyer or partner dealership
            </p>
          </div>

          {/* Role selector tabs */}
          <div className="mb-8">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Select Account Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setRole('customer');
                  setErrors({});
                  setGeneralError('');
                }}
                className={cn(
                  'flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all',
                  role === 'customer'
                    ? 'border-slate-600 bg-slate-50/70 text-slate-900 ring-2 ring-slate-500/20 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                )}
              >
                <div className={cn('p-2 rounded-lg', role === 'customer' ? 'bg-slate-600 text-white' : 'bg-slate-100 text-slate-500')}>
                  <ShoppingBag size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold">Customer</p>
                  <p className="text-xs text-slate-500 mt-0.5">Browse, queue & buy cars</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRole('dealer');
                  setErrors({});
                  setGeneralError('');
                }}
                className={cn(
                  'flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all',
                  role === 'dealer'
                    ? 'border-slate-600 bg-slate-50/70 text-slate-900 ring-2 ring-slate-500/20 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                )}
              >
                <div className={cn('p-2 rounded-lg', role === 'dealer' ? 'bg-slate-600 text-white' : 'bg-slate-100 text-slate-500')}>
                  <Store size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold">Dealership</p>
                  <p className="text-xs text-slate-500 mt-0.5">List vehicles & make offers</p>
                </div>
              </button>
            </div>
          </div>

          {/* General Error Banner */}
          {generalError && (
            <div className="mb-6 p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
              <AlertCircle size={18} className="text-slate-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-slate-700 font-medium">{generalError}</p>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="mb-6 p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
              <CheckCircle2 size={18} className="text-slate-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-slate-700 font-medium">{successMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Section: Personal / Account Details */}
            <div>
              <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3 pb-1 border-b border-slate-100">
                {role === 'dealer' ? 'Authorized Representative' : 'Customer Profile'}
              </h3>

              <div className="space-y-4">
                <Input
                  label="Full Name"
                  placeholder="e.g. Robert Vance"
                  value={name}
                  onChange={e => {
                    setName(e.target.value);
                    if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                  }}
                  error={errors.name}
                  leftElement={<User size={16} />}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="name@domain.com"
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                    }}
                    error={errors.email}
                    leftElement={<Mail size={16} />}
                    required
                  />

                  <Input
                    label="Phone Number"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phoneNumber}
                    onChange={e => {
                      setPhoneNumber(e.target.value);
                      if (errors.phoneNumber) setErrors(prev => ({ ...prev, phoneNumber: '' }));
                    }}
                    error={errors.phoneNumber}
                    leftElement={<Phone size={16} />}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                    }}
                    error={errors.password}
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
                    required
                  />

                  <Input
                    label="Confirm Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={e => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
                    }}
                    error={errors.confirmPassword}
                    leftElement={<Lock size={16} />}
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(v => !v)}
                        className="text-slate-400 hover:text-slate-600 focus:outline-none"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section: Dealer Information (conditional) */}
            {role === 'dealer' && (
              <div className="pt-2">
                <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3 pb-1 border-b border-slate-100 flex items-center justify-between">
                  <span>Dealership Information</span>
                  <span className="text-[11px] text-slate-600 font-normal">Pending Admin Verification</span>
                </h3>

                <div className="space-y-4">
                  <Input
                    label="Dealership Commercial Name"
                    placeholder="e.g. Apex Motor Group Inc."
                    value={dealershipName}
                    onChange={e => {
                      setDealershipName(e.target.value);
                      if (errors.dealershipName) setErrors(prev => ({ ...prev, dealershipName: '' }));
                    }}
                    error={errors.dealershipName}
                    leftElement={<Building2 size={16} />}
                    required
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Dealer Registration / License #"
                      placeholder="e.g. DL-AP-2024-9988"
                      value={registrationNumber}
                      onChange={e => {
                        setRegistrationNumber(e.target.value);
                        if (errors.registrationNumber) setErrors(prev => ({ ...prev, registrationNumber: '' }));
                      }}
                      error={errors.registrationNumber}
                      leftElement={<FileText size={16} />}
                      required
                    />

                    <Input
                      label="Key Contact Person"
                      placeholder="e.g. Sales Director"
                      value={contactPerson}
                      onChange={e => {
                        setContactPerson(e.target.value);
                        if (errors.contactPerson) setErrors(prev => ({ ...prev, contactPerson: '' }));
                      }}
                      error={errors.contactPerson}
                      leftElement={<UserCheck size={16} />}
                      required
                    />
                  </div>

                  <Input
                    label="Dealership Direct Phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={dealershipPhone}
                    onChange={e => {
                      setDealershipPhone(e.target.value);
                      if (errors.dealershipPhone) setErrors(prev => ({ ...prev, dealershipPhone: '' }));
                    }}
                    error={errors.dealershipPhone}
                    leftElement={<Phone size={16} />}
                    required
                  />

                  <Input
                    label="Showroom Address"
                    placeholder="e.g. 500 Automotive Plaza"
                    value={address}
                    onChange={e => {
                      setAddress(e.target.value);
                      if (errors.address) setErrors(prev => ({ ...prev, address: '' }));
                    }}
                    error={errors.address}
                    leftElement={<MapPin size={16} />}
                    required
                  />

                  <div className="grid grid-cols-3 gap-3">
                    <SelectField name="State" value={state} options={Object.keys(indiaLocations)} onChange={value=>{setState(value);setCity('');}} placeholder="Select state"/>

                    <SelectField name="City" value={city} options={indiaLocations[state]??[]} onChange={setCity} placeholder="Select city"/>

                    <Input
                      label="PIN code"
                      placeholder="530016"
                      value={pinCode}
                      onChange={e => {
                        setPinCode(e.target.value);
                        if (errors.pinCode) setErrors(prev => ({ ...prev, pinCode: '' }));
                      }}
                      error={errors.pinCode}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="pt-2">
              <Button type="submit" size="lg" className="w-full text-base font-semibold shadow-sm" isLoading={isLoading}>
                {role === 'dealer' ? 'Register Dealership Account' : 'Create Customer Account'}
              </Button>
            </div>
          </form>

          {/* Links */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <span>Already have a registered account?</span>
            <div className="flex items-center gap-3">
              <Link to="/login" className="font-semibold text-slate-600 hover:text-slate-700">
                Sign In
              </Link>
              <span>•</span>
              <Link to="/role-selection" className="font-semibold text-slate-600 hover:text-slate-700">
                Explore Roles
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};
