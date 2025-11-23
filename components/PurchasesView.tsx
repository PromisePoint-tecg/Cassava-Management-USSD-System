import React, { useState } from 'react';
import { Purchase, Farmer, TransactionStatus } from '../types';
import { Plus, Search, CheckCircle2, AlertCircle } from 'lucide-react';

interface PurchasesViewProps {
  purchases: Purchase[];
  farmers: Farmer[];
  onAddPurchase: (farmerId: string, weight: number) => void;
  pricePerKg: number;
}

export const PurchasesView: React.FC<PurchasesViewProps> = ({ purchases, farmers, onAddPurchase, pricePerKg }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFarmerId, setSelectedFarmerId] = useState('');
  const [weight, setWeight] = useState<number | ''>('');
  const [filter, setFilter] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFarmerId && weight && typeof weight === 'number') {
      onAddPurchase(selectedFarmerId, weight);
      setIsModalOpen(false);
      setSelectedFarmerId('');
      setWeight('');
    }
  };

  const filteredPurchases = purchases.filter(p => 
    p.farmerName.toLowerCase().includes(filter.toLowerCase()) || 
    p.id.toLowerCase().includes(filter.toLowerCase()) ||
    p.farmerId.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Purchase History</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Purchase
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by farmer name or ID..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-medium uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Transaction ID</th>
                <th className="px-6 py-4">Farmer ID</th>
                <th className="px-6 py-4">Farmer</th>
                <th className="px-6 py-4">Weight (KG)</th>
                <th className="px-6 py-4">Price/KG</th>
                <th className="px-6 py-4">Total (₦)</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPurchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-gray-500">{purchase.id}</td>
                  <td className="px-6 py-4 font-mono text-gray-500">{purchase.farmerId}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{purchase.farmerName}</td>
                  <td className="px-6 py-4">{purchase.weightKg.toLocaleString()} kg</td>
                  <td className="px-6 py-4">₦{purchase.pricePerKg}</td>
                  <td className="px-6 py-4 font-medium text-emerald-700">₦{purchase.totalAmount.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      purchase.status === TransactionStatus.SUCCESS 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {purchase.status === TransactionStatus.SUCCESS ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                      {purchase.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{new Date(purchase.timestamp).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-emerald-50">
              <h3 className="text-lg font-bold text-emerald-900">Record Cassava Purchase</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <span className="sr-only">Close</span>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Farmer</label>
                <select
                  required
                  className="w-full rounded-lg border-gray-300 border px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  value={selectedFarmerId}
                  onChange={(e) => setSelectedFarmerId(e.target.value)}
                >
                  <option value="">-- Choose a farmer --</option>
                  {farmers.filter(f => f.status === 'Active').map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight (KG)</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.1"
                  className="w-full rounded-lg border-gray-300 border px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  value={weight}
                  onChange={(e) => setWeight(parseFloat(e.target.value))}
                />
              </div>

              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Current Price:</span>
                  <span className="font-medium text-gray-900">₦{pricePerKg} / kg</span>
                </div>
                <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200">
                  <span className="text-gray-700">Total Payout:</span>
                  <span className="text-emerald-600">
                    ₦{((typeof weight === 'number' ? weight : 0) * pricePerKg).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors shadow-sm focus:ring-4 focus:ring-emerald-100"
                >
                  Confirm & Pay Instantly
                </button>
                <p className="text-xs text-center text-gray-500 mt-2">
                  Amount will be credited to farmer's wallet immediately.
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};