import { indiaLocations } from '../../../../src/data/indiaLocations';
import { SelectField } from '../india/IndiaCatalogue';
import React, { useState, useEffect } from 'react';
import {
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShieldCheck,
  Clock,
  XCircle,
  Save,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../store/authStore';
import { dealerService } from '../../services/dealerService';
import { Dealer } from '../../types';
import { formatDate } from '../../utils/helpers';

export const DealershipProfilePage: React.FC = () => {
  const { user, setUser, token } = useAuthStore();
  const dealerId = user?.dealerProfile?.id || 'd1';

  const [dealer, setDealer] = useState<Dealer | null>(user?.dealerProfile || null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Editable form fields
  const [dealershipName, setDealershipName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pinCode, setPinCode] = useState('');

  useEffect(() => {
    async function loadDealer() {
      const res = await dealerService.getById(dealerId);
      if (res.success && res.data) {
        setDealer(res.data);
        setDealershipName(res.data.dealershipName);
        setContactPerson(res.data.contactPerson);
        setEmail(res.data.email);
        setPhone(res.data.phone);
        setAddress(res.data.address);
        setCity(res.data.city);
        setState(res.data.state);
        setPinCode(res.data.pinCode);
      }
    }
    loadDealer();
  }, [dealerId]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealer) return;

    if (!dealershipName.trim() || !contactPerson.trim() || !phone.trim() || !city.trim()) {
      setFeedback({ type: 'error', message: 'Please fill in all mandatory fields.' });
      return;
    }

    if (!indiaLocations[state]?.includes(city) || !/^[1-9]\d{5}$/.test(pinCode.trim())) {
      setFeedback({type:'error',message:'Select an Indian state and city and enter a six-digit PIN code.'});return;
    }
    setIsSaving(true);
    setFeedback(null);

    const updateData = {
      dealershipName: dealershipName.trim(),
      contactPerson: contactPerson.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      pinCode: pinCode.trim(),
    };

    const res = await dealerService.update(dealer.id, updateData);
    setIsSaving(false);

    if (res.success && res.data) {
      setDealer(res.data);
      if (user) {
        setUser({ ...user, dealerProfile: res.data }, token);
      }
      setIsEditing(false);
      setFeedback({ type: 'success', message: 'Dealership profile updated successfully!' });
      setTimeout(() => setFeedback(null), 3500);
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to update profile.' });
    }
  };

  const getStatusBadge = (status: Dealer['status']) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200">
            <CheckCircle2 size={13} />
            Verified & Approved
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200">
            <Clock size={13} />
            Pending Verification
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200">
            <XCircle size={13} />
            Application Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Dealership Location & Profile
            </h1>
            {dealer && getStatusBadge(dealer.status)}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your certified showroom address, contact representative, and official registration credentials.
          </p>
        </div>

        {!isEditing && (
          <Button size="sm" onClick={() => setIsEditing(true)}>
            Edit Dealership Info
          </Button>
        )}
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-medium ${
            feedback.type === 'success'
              ? 'bg-slate-50 border-slate-200 text-slate-800'
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Main Profile Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Quick Credential Summary */}
        <div className="space-y-6">
          <Card padding="md" className="border-slate-200">
            <div className="flex flex-col items-center text-center p-2">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 mb-3 shadow-sm">
                <Building2 size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">{dealer?.dealershipName || 'My Dealership'}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Automotive Showroom Partner</p>

              <div className="mt-4 pt-4 border-t border-slate-100 w-full space-y-2.5 text-xs text-left">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Dealer Identifier</span>
                  <span className="font-mono font-medium text-slate-800">{dealer?.id}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Registration / License #</span>
                  <span className="font-mono font-medium text-slate-800 flex items-center gap-1.5 mt-0.5">
                    <FileText size={13} className="text-slate-400" />
                    {dealer?.registrationNumber}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Partner Since</span>
                  <span className="font-medium text-slate-800 flex items-center gap-1.5 mt-0.5">
                    <Calendar size={13} className="text-slate-400" />
                    {dealer?.createdAt ? formatDate(dealer.createdAt) : 'Registered'}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Verification Status Card */}
          <Card padding="md" className="border-slate-200">
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2">
              <ShieldCheck size={14} className="text-slate-600" />
              Verification Details
            </h4>
            <div className="space-y-2 text-xs text-slate-600">
              <p>
                <strong>Status:</strong>{' '}
                <span className="capitalize font-semibold text-slate-800">{dealer?.status}</span>
              </p>
              <p className="text-slate-500 leading-relaxed">
                {dealer?.status === 'approved'
                  ? 'Your dealership is fully verified. Your vehicle listings and offers appear live across customer searches.'
                  : dealer?.status === 'pending'
                  ? 'Your application is undergoing administrator compliance audit. You may register vehicles in the meantime.'
                  : 'Your application was rejected. Please contact marketplace administration for revision steps.'}
              </p>
            </div>
          </Card>
        </div>

        {/* Right Column: Full Details / Edit Form */}
        <div className="md:col-span-2">
          <Card padding="lg" className="border-slate-200">
            <CardHeader
              title={isEditing ? 'Edit Showroom & Contact Information' : 'Dealership Information'}
              subtitle={isEditing ? 'Make changes to your publicly visible dealership contact details' : 'Official contact and location information on file'}
            />

            {isEditing ? (
              <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
                <Input
                  label="Dealership Commercial Name"
                  value={dealershipName}
                  onChange={e => setDealershipName(e.target.value)}
                  leftElement={<Building2 size={16} />}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Owner / Contact Person"
                    value={contactPerson}
                    onChange={e => setContactPerson(e.target.value)}
                    leftElement={<User size={16} />}
                    required
                  />

                  <Input
                    label="Phone Number"
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    leftElement={<Phone size={16} />}
                    required
                  />
                </div>

                <Input
                  label="Business Email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  leftElement={<Mail size={16} />}
                  required
                />

                <Input
                  label="Showroom Street Address"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  leftElement={<MapPin size={16} />}
                  required
                />

                <div className="grid grid-cols-3 gap-3">
                  <SelectField name="State" value={state} options={Object.keys(indiaLocations)} onChange={value=>{setState(value);setCity('');}} placeholder="Select state"/>
                  <SelectField name="City" value={city} options={indiaLocations[state]??[]} onChange={setCity} placeholder="Select city"/>
                  <Input
                    label="PIN code Code"
                    value={pinCode}
                    onChange={e => setPinCode(e.target.value)}
                    required
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={isSaving} leftIcon={<Save size={16} />}>
                    Save Changes
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 pt-2 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 bg-slate-50 rounded-xl">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Commercial Name</span>
                    <p className="font-semibold text-slate-900 mt-0.5">{dealer?.dealershipName}</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Authorized Contact</span>
                    <p className="font-semibold text-slate-900 mt-0.5">{dealer?.contactPerson}</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Dealership Phone</span>
                    <p className="font-semibold text-slate-900 mt-0.5">{dealer?.phone}</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Official Email</span>
                    <p className="font-semibold text-slate-900 mt-0.5">{dealer?.email}</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Showroom Address & Location</span>
                  <p className="font-semibold text-slate-900">{dealer?.address}</p>
                  <p className="text-xs text-slate-500">
                    {dealer?.city}, {dealer?.state} {dealer?.pinCode}
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
