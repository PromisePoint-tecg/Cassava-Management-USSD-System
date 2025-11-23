
import React, { useState } from 'react';
import { Save, Bell, Shield, Sliders, Smartphone, AlertTriangle } from 'lucide-react';
import { SystemSettings } from '../types';

interface SettingsViewProps {
  settings: SystemSettings;
  onSave: (settings: SystemSettings) => void;
}

const Toggle = ({ label, description, checked, onChange, disabled = false }: { label: string, description: string, checked: boolean, onChange: (val: boolean) => void, disabled?: boolean }) => (
  <div className={`flex items-center justify-between py-4 ${disabled ? 'opacity-50' : ''}`}>
    <div>
      <h3 className="text-sm font-medium text-gray-900">{label}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? 'bg-emerald-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  </div>
);

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSave }) => {
  const [formData, setFormData] = useState<SystemSettings>(settings);
  const [isSaved, setIsSaved] = useState(false);

  const handleChange = (field: keyof SystemSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">System Configuration</h2>
        <button
          type="submit"
          className="flex items-center px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm focus:ring-4 focus:ring-emerald-100"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaved ? 'Saved Successfully!' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pricing & Financials */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center mb-6">
            <div className="p-2 bg-emerald-50 rounded-lg mr-3">
              <Sliders className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">Pricing & Finance</h3>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Global Cassava Price (₦/kg)</label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-gray-500 sm:text-sm">₦</span>
                </div>
                <input
                  type="number"
                  required
                  min="0"
                  className="block w-full rounded-lg border-gray-300 pl-8 py-2.5 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                  value={formData.pricePerKg}
                  onChange={(e) => handleChange('pricePerKg', parseFloat(e.target.value))}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Updating this will affect all future purchases immediately.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Fee (%)</label>
              <input
                type="number"
                required
                min="0"
                max="100"
                step="0.1"
                className="block w-full rounded-lg border-gray-300 px-3 py-2.5 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                value={formData.transactionFeePercent}
                onChange={(e) => handleChange('transactionFeePercent', parseFloat(e.target.value))}
              />
              <p className="mt-1 text-xs text-gray-500">Deducted from payouts if enabled for external transfers.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Auto-Approve Loans Under (₦)</label>
              <input
                type="number"
                required
                min="0"
                step="1000"
                className="block w-full rounded-lg border-gray-300 px-3 py-2.5 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                value={formData.autoApproveLoansUnder}
                onChange={(e) => handleChange('autoApproveLoansUnder', parseFloat(e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center mb-6">
            <div className="p-2 bg-blue-50 rounded-lg mr-3">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">Notifications</h3>
          </div>

          <div className="divide-y divide-gray-100">
            <Toggle
              label="SMS Notifications"
              description="Send SMS to farmers upon purchase and payout."
              checked={formData.smsNotifications}
              onChange={(val) => handleChange('smsNotifications', val)}
            />
            <Toggle
              label="Email Alerts"
              description="Notify admins of large transactions and system errors."
              checked={formData.emailAlerts}
              onChange={(val) => handleChange('emailAlerts', val)}
            />
          </div>
        </div>

        {/* System & Security */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center mb-6">
            <div className="p-2 bg-purple-50 rounded-lg mr-3">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">System & Security</h3>
          </div>

          <div className="divide-y divide-gray-100">
            <div className="flex items-center justify-between py-4">
               <div>
                  <h3 className="text-sm font-medium text-gray-900">USSD Gateway</h3>
                  <p className="text-sm text-gray-500">Gateway Status: <span className="text-emerald-600 font-bold">Connected</span></p>
               </div>
               <button type="button" className="text-sm text-emerald-600 font-medium hover:text-emerald-700">Test Connection</button>
            </div>

             <div className="flex items-center justify-between py-4">
               <div>
                  <h3 className="text-sm font-medium text-gray-900">Database Backup</h3>
                  <p className="text-sm text-gray-500">Last backup: 2 hours ago</p>
               </div>
               <button type="button" className="text-sm text-emerald-600 font-medium hover:text-emerald-700">Run Backup</button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-xl border border-red-200 shadow-sm p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <AlertTriangle className="w-24 h-24 text-red-600" />
          </div>
          <div className="flex items-center mb-6">
            <div className="p-2 bg-red-50 rounded-lg mr-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">Danger Zone</h3>
          </div>

          <div className="divide-y divide-red-100">
            <Toggle
              label="Maintenance Mode"
              description="Suspend all USSD sessions and incoming requests."
              checked={formData.maintenanceMode}
              onChange={(val) => handleChange('maintenanceMode', val)}
            />
          </div>
        </div>
      </div>
    </form>
  );
};
