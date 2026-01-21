import React, { useState, useEffect } from "react";
import {
  Save,
  Bell,
  Shield,
  Sliders,
  Smartphone,
  AlertTriangle,
} from "lucide-react";
import { SystemSettings } from "../types";
import { settingsApi } from "../api/settings";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorMessage } from "./ErrorMessage";
import LeafInlineLoader from "./Loader";

interface SettingsViewProps {
  onSave: (settings: SystemSettings) => void;
  loading?: boolean;
}

const Toggle = ({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}) => (
  <div
    className={`flex items-center justify-between py-4 ${
      disabled ? "opacity-50" : ""
    }`}
  >
    <div>
      <h3 className="text-sm font-medium text-gray-800">{label}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? "bg-emerald-600" : "bg-gray-200"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  </div>
);

export const SettingsView: React.FC<SettingsViewProps> = ({
  onSave,
  loading = false,
}) => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [formData, setFormData] = useState<SystemSettings>({
    cassavaPricePerKg: 0,
    cassavaPricePerTon: 0,
    taxRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const settingsData = await settingsApi.getSettings();
        setSettings(settingsData);
        setFormData(settingsData);
      } catch (err) {
        console.error("Error loading settings:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load settings"
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleChange = (field: keyof SystemSettings, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsSaved(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  if (isLoading) {
    return <LeafInlineLoader />;
  }

  if (error) {
    return (
      <ErrorMessage
        title="Error Loading Settings"
        message={error}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Header - Liquid Glass */}
      <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] p-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/5 to-transparent rounded-b-[2rem] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#066f48]/5 via-transparent to-cyan-400/5 rounded-[2rem] pointer-events-none" />
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-white/30 to-transparent blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-gradient-to-tl from-[#066f48]/10 to-transparent blur-2xl rounded-full pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[#066f48] shadow-lg">
              <Sliders className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">System Configuration</h2>
              <p className="text-sm text-gray-600">Manage your system settings and pricing</p>
            </div>
          </div>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center px-6 py-2.5 bg-emerald-600/80 backdrop-blur-md border border-white/30 text-white font-medium rounded-lg hover:bg-emerald-600 transition-all shadow-lg hover:shadow-xl focus:ring-4 focus:ring-emerald-100 w-full sm:w-auto justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading
              ? "Saving..."
              : isSaved
              ? "Saved Successfully!"
              : "Save Changes"}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Grid Layout for Settings Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Price per Kilogram Card - Liquid Glass */}
          <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/5 to-transparent rounded-b-[2rem] pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#066f48]/5 via-transparent to-cyan-400/5 rounded-[2rem] pointer-events-none" />
            <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-white/30 to-transparent blur-3xl rounded-full pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-gradient-to-tl from-[#066f48]/10 to-transparent blur-2xl rounded-full pointer-events-none" />
            
            <div className="relative z-10">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price per Kilogram (₦/kg)
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-gray-500 sm:text-sm">₦</span>
                </div>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  className="block w-full rounded-lg border-gray-300 pl-8 py-2.5 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                  value={formData.cassavaPricePerKg}
                  onChange={(e) =>
                    handleChange(
                      "cassavaPricePerKg",
                      parseFloat(e.target.value)
                    )
                  }
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Price for small-scale purchases (under 1000kg).
              </p>
            </div>
          </div>

          {/* Tax Rate Card - Liquid Glass */}
          <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/5 to-transparent rounded-b-[2rem] pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#066f48]/5 via-transparent to-cyan-400/5 rounded-[2rem] pointer-events-none" />
            <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-white/30 to-transparent blur-3xl rounded-full pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-gradient-to-tl from-[#066f48]/10 to-transparent blur-2xl rounded-full pointer-events-none" />
            
            <div className="relative z-10">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payroll Tax Rate (%)
              </label>
              <div className="relative rounded-md shadow-sm">
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  step="0.1"
                  className="block w-full rounded-lg border-gray-300 pr-8 py-2.5 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                  value={formData.taxRate}
                  onChange={(e) =>
                    handleChange("taxRate", parseFloat(e.target.value))
                  }
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-gray-500 sm:text-sm">%</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Tax rate applied to payroll calculations (e.g., 7.5 for 7.5%).
              </p>
            </div>
          </div>

          {/* Price per Ton Card - Liquid Glass */}
          <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/5 to-transparent rounded-b-[2rem] pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#066f48]/5 via-transparent to-cyan-400/5 rounded-[2rem] pointer-events-none" />
            <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-white/30 to-transparent blur-3xl rounded-full pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-gradient-to-tl from-[#066f48]/10 to-transparent blur-2xl rounded-full pointer-events-none" />
            
            <div className="relative z-10">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price per Ton (₦/ton)
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-gray-500 sm:text-sm">₦</span>
                </div>
                <input
                  type="number"
                  required
                  min="0"
                  step="1"
                  className="block w-full rounded-lg border-gray-300 pl-8 py-2.5 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                  value={formData.cassavaPricePerTon}
                  onChange={(e) =>
                    handleChange(
                      "cassavaPricePerTon",
                      parseFloat(e.target.value)
                    )
                  }
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Bulk pricing for large purchases (1000kg and above). 1 ton = 1000kg.
              </p>
            </div>
          </div>
        </div>

        {/* Summary Card - Liquid Glass */}
        <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/5 to-transparent rounded-b-[2rem] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#066f48]/5 via-transparent to-cyan-400/5 rounded-[2rem] pointer-events-none" />
          <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-white/30 to-transparent blur-3xl rounded-full pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-gradient-to-tl from-[#066f48]/10 to-transparent blur-2xl rounded-full pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex">
              <div className="flex-shrink-0">
                <Sliders
                  className="h-5 w-5 text-blue-400"
                  aria-hidden="true"
                />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  System Configuration Summary
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>Current settings:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>
                      <strong>Retail pricing:</strong> ₦
                      {formData.cassavaPricePerKg}/kg for orders under 1000kg
                    </li>
                    <li>
                      <strong>Bulk pricing:</strong> ₦
                      {(formData.cassavaPricePerTon / 1000).toFixed(2)}/kg for
                      orders 1000kg and above
                    </li>
                    <li>
                      <strong>Payroll tax rate:</strong> {formData.taxRate}%
                      applied to all payroll calculations
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};