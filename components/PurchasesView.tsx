import React, { useState, useEffect } from "react";
import { Plus,Search,CheckCircle2,AlertCircle,Eye,Clock,DollarSign,TrendingUp,RefreshCw,Scale,Users,ChevronLeft,ChevronRight,X,ShoppingCart,
} from "lucide-react";
import {purchasesApi,PurchaseItem,PurchaseKPIs,CreatePurchaseData,GetPurchasesQuery,CassavaPricing,
} from "../services/purchases";
import { farmersApi, Farmer } from "../services/farmers";
import { SuccessModal } from "./SuccessModal";
import { LeafButtonLoader } from "./Loader";

interface PurchasesViewProps {}

export const PurchasesView: React.FC<PurchasesViewProps> = () => {
  // State management
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [kpis, setKpis] = useState<PurchaseKPIs | null>(null);
  const [cassavaPricing, setCassavaPricing] = useState<CassavaPricing | null>(null);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [farmersLoading, setFarmersLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [pricingLoading, setPricingLoading] = useState(true);
  const [retryingPurchase, setRetryingPurchase] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({ isOpen: false, title: "", message: "" });

  // Form state
  const [createForm, setCreateForm] = useState({
    farmerId: "",
    weightKg: "",
  });

  // Modal states for viewing purchase
  const [viewingPurchase, setViewingPurchase] = useState<PurchaseItem | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Filters and pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const itemsPerPage = 10;

  // Load initial data
  useEffect(() => {
    loadKPIs();
    loadPurchases();
    loadCassavaPricing();
  }, []);

  // Load data when filters change
  useEffect(() => {
    loadPurchases();
  }, [searchTerm, statusFilter, currentPage]);

  const loadKPIs = async () => {
    try {
      const data = await purchasesApi.getPurchaseKPIs();
      setKpis(data);
    } catch (err) {
      console.error("Failed to load purchase KPIs:", err);
      setError("Failed to load purchase statistics");
    }
  };

  const loadPurchases = async () => {
    try {
      setLoading(true);
      const query: GetPurchasesQuery = {
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      };

      const data = await purchasesApi.getAllPurchases(query);
      setPurchases(data.purchases);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      console.error("Failed to load purchases:", err);
      setError("Failed to load purchases");
    } finally {
      setLoading(false);
    }
  };

  const loadCassavaPricing = async () => {
    try {
      setPricingLoading(true);
      const data = await purchasesApi.getCassavaPricing();
      setCassavaPricing(data);
    } catch (err) {
      console.error("Failed to load cassava pricing:", err);
    } finally {
      setPricingLoading(false);
    }
  };

  const loadFarmers = async () => {
    try {
      setFarmersLoading(true);
      const data = await farmersApi.getAllFarmers({ status: "active" });
      setFarmers(data.farmers);
    } catch (err) {
      console.error("Failed to load farmers:", err);
    } finally {
      setFarmersLoading(false);
    }
  };

  // Modal handlers
  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
    loadFarmers();
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreateForm({ farmerId: "", weightKg: "" });
  };

  // Form submission handlers
  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    const weightKg = Number(createForm.weightKg);
    if (!createForm.farmerId || !weightKg || weightKg <= 0) return;

    try {
      setCreateLoading(true);
      const selectedFarmer = farmers.find((f) => f.id === createForm.farmerId);
      if (!selectedFarmer || !cassavaPricing) return;

      const purchaseData: CreatePurchaseData = {
        farmerId: createForm.farmerId,
        farmerName: selectedFarmer.name,
        farmerPhone: selectedFarmer.phone,
        weightKg: weightKg,
        pricePerKg: weightKg >= 1000 ? cassavaPricing.pricePerTon / 1000 : cassavaPricing.pricePerKg,
        unit: weightKg >= 1000 ? "ton" : "kg",
        paymentMethod: "wallet",
        location: "",
        notes: "",
      };

      const purchase = await purchasesApi.createPurchase(purchaseData);

      handleCloseCreateModal();
      setSuccessModal({
        isOpen: true,
        title: "Purchase Created Successfully!",
        message: `Purchase for ${selectedFarmer.name} has been recorded. Total amount: ${formatCurrency(purchase.totalAmount)}`,
      });

      loadPurchases();
      loadKPIs();
    } catch (err) {
      console.error("Failed to create purchase:", err);
      setError("Failed to create purchase");
    } finally {
      setCreateLoading(false);
    }
  };

  // Retry purchase handler
  const handleRetryPurchase = async (purchaseId: string) => {
    try {
      setRetryingPurchase(purchaseId);
      await purchasesApi.retryPurchase(purchaseId);

      setSuccessModal({
        isOpen: true,
        title: "Purchase Retried Successfully!",
        message: "The failed purchase has been retried and processed successfully.",
      });

      loadPurchases();
      loadKPIs();
    } catch (err) {
      console.error("Failed to retry purchase:", err);
      setError("Failed to retry purchase. Please try again.");
    } finally {
      setRetryingPurchase(null);
    }
  };

  const filteredPurchases = purchases.filter((purchase) => {
    const matchesSearch = searchTerm === "" || purchase.farmerName.toLowerCase().includes(searchTerm.toLowerCase()) || purchase.farmerPhone.includes(searchTerm);
    const matchesStatus = statusFilter === "" || purchase.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const paginatedPurchases = filteredPurchases.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalPagesCalculated = Math.ceil(filteredPurchases.length / itemsPerPage);

  useEffect(() => {
    setTotalPages(totalPagesCalculated);
    if (currentPage > totalPagesCalculated && totalPagesCalculated > 0) {
      setCurrentPage(1);
    }
  }, [filteredPurchases.length, totalPagesCalculated, currentPage]);

  const calculatePrice = (weightKg: number, unit: "kg" | "ton") => {
    if (!cassavaPricing) return 0;

    if (unit === "ton" || weightKg >= 1000) {
      const tons = weightKg / 1000;
      return Math.round(tons * cassavaPricing.pricePerTon * 100) / 100;
    } else {
      return Math.round(weightKg * cassavaPricing.pricePerKg * 100) / 100;
    }
  };

  const getPricePerKgForDisplay = (purchase: PurchaseItem): number => {
    return purchase.pricePerKg;
  };

  const handleViewPurchase = async (purchaseId: string) => {
    try {
      const purchase = await purchasesApi.getPurchaseById(purchaseId);
      setViewingPurchase(purchase);
      setIsViewModalOpen(true);
    } catch (err: any) {
      setError(err.message || "Failed to load purchase details");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { bg: "bg-yellow-100/90", text: "text-yellow-700", border: "border-yellow-200/50", label: "Pending" },
      completed: { bg: "bg-green-100/90", text: "text-green-700", border: "border-green-200/50", label: "Completed" },
      failed: { bg: "bg-red-100/90", text: "text-red-700", border: "border-red-200/50", label: "Failed" },
      cancelled: { bg: "bg-gray-100/90", text: "text-gray-700", border: "border-gray-200/50", label: "Cancelled" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold backdrop-blur-sm border ${config.bg} ${config.text} ${config.border}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LeafButtonLoader />
      </div>
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
        
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[#066f48] shadow-lg">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Purchase Management</h2>
              <p className="text-sm text-gray-600">{total} total purchases</p>
            </div>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-[#066f48] text-white rounded-xl hover:bg-[#055539] flex items-center gap-2 shadow-lg transition-all duration-300 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
            <Plus className="w-4 h-4 relative z-10" />
            <span className="relative z-10">New Purchase</span>
          </button>
        </div>
      </div>

      {/* KPI Cards - Liquid Glass */}
      {kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Scale, label: "Total Weight", value: `${(kpis.totalWeight || 0).toLocaleString()}kg`, color: "blue" },
            { icon: DollarSign, label: "Total Amount Spent", value: formatCurrency(kpis.totalAmountSpent || 0), color: "emerald" },
            { icon: TrendingUp, label: "Average Price/kg", value: formatCurrency(kpis.averagePrice || 0), color: "purple" },
            { icon: Users, label: "Total Purchases", value: (kpis.totalPurchases || 0).toLocaleString(), color: "orange" },
          ].map((kpi, idx) => (
            <div key={idx} className="bg-white/10 backdrop-blur-xl rounded-[1.5rem] border border-white/40 shadow-[0_4px_16px_rgba(0,0,0,0.06),0_1px_2px_rgba(255,255,255,0.4)_inset] p-5 relative overflow-hidden group hover:bg-white/15 transition-all duration-300">
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[1.5rem] pointer-events-none" />
              <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-white/25 blur-2xl rounded-full pointer-events-none" />
              
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <h3 className="text-gray-500 text-sm font-medium mb-1">{kpi.label}</h3>
                  <p className="text-2xl font-bold text-gray-800">{kpi.value}</p>
                </div>
                <kpi.icon className={`w-8 h-8 text-${kpi.color}-600`} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters - Liquid Glass */}
      <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] p-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/5 to-transparent rounded-b-[2rem] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#066f48]/5 via-transparent to-cyan-400/5 rounded-[2rem] pointer-events-none" />
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-white/30 to-transparent blur-3xl rounded-full pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row gap-4 relative z-10">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search purchases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/40 backdrop-blur-md border border-white/50 rounded-xl focus:ring-2 focus:ring-[#066f48]/30 focus:outline-none focus:bg-white/50 transition-all text-gray-800 placeholder-gray-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-white/40 backdrop-blur-md border border-white/50 rounded-xl focus:ring-2 focus:ring-[#066f48]/30 focus:outline-none focus:bg-white/50 transition-all text-gray-800"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Purchases Table - Liquid Glass */}
      <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/5 to-transparent rounded-b-[2rem] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#066f48]/5 via-transparent to-cyan-400/5 rounded-[2rem] pointer-events-none" />
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-white/30 to-transparent blur-3xl rounded-full pointer-events-none" />
        
        {filteredPurchases.length === 0 ? (
          <div className="text-center py-12 relative z-10">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No purchases found</p>
          </div>
        ) : (
          <div className="overflow-x-auto relative z-10">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-white/20 backdrop-blur-md text-gray-700 font-medium uppercase text-xs border-b border-white/30">
                <tr>
                  <th className="px-6 py-3">Farmer</th>
                  <th className="px-6 py-3">Weight</th>
                  <th className="px-6 py-3">Price</th>
                  <th className="px-6 py-3">Total</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/15">
                {paginatedPurchases.map((purchase) => (
                  <tr key={purchase._id} className="hover:bg-white/10 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-800">{purchase.farmerName}</div>
                        <div className="text-sm text-gray-500">{purchase.farmerPhone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{purchase.weightKg}kg</td>
                    <td className="px-6 py-4 text-gray-700">
                      {getPricePerKgForDisplay(purchase)}/kg
                      {purchase.unit === "ton" && <span className="text-xs text-gray-500 ml-1">(bulk)</span>}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800">{formatCurrency(purchase.totalAmount)}</td>
                    <td className="px-6 py-4">{getStatusBadge(purchase.status)}</td>
                    <td className="px-6 py-4 text-gray-700">{formatDate(purchase.createdAt)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewPurchase(purchase._id)}
                          className="p-2 text-blue-600 hover:bg-blue-50/80 rounded-lg backdrop-blur-sm transition-all"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {purchase.status === "failed" && (
                          <button
                            onClick={() => handleRetryPurchase(purchase._id)}
                            className="p-2 text-emerald-600 hover:bg-emerald-50/80 rounded-lg backdrop-blur-sm transition-all"
                            disabled={retryingPurchase === purchase._id}
                            title="Retry"
                          >
                            {retryingPurchase === purchase._id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination - Liquid Glass */}
      {!loading && filteredPurchases.length > 0 && (
        <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
          <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-br from-white/30 to-transparent blur-2xl rounded-full pointer-events-none" />
          
          <div className="flex items-center justify-between relative z-10">
            <p className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white/25 backdrop-blur-md border border-white/50 rounded-xl hover:bg-white/35 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all text-gray-700"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white/25 backdrop-blur-md border border-white/50 rounded-xl hover:bg-white/35 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all text-gray-700"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Purchase Modal - Enhanced Glass */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md overflow-y-auto">
          <div className="bg-white/80 backdrop-blur-2xl rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden my-auto border border-white/60 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none rounded-[2rem]" />
            <div className="px-6 py-4 border-b border-white/40 bg-gradient-to-r from-[#066f48]/15 to-cyan-400/10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1/2 h-full bg-white/20 blur-xl rounded-full pointer-events-none" />
              <div className="flex justify-between items-center relative z-10">
                <h3 className="text-lg font-bold text-[#066f48]">Record Cassava Purchase</h3>
                <button onClick={handleCloseCreateModal} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-white/50 rounded-lg transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreatePurchase} className="p-6 space-y-4 relative z-10">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Farmer</label>
                <select
                  value={createForm.farmerId}
                  onChange={(e) => setCreateForm({ ...createForm, farmerId: e.target.value })}
                  required
                  disabled={farmersLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select a farmer...</option>
                  {farmers.map((farmer) => (
                    <option key={farmer.id} value={farmer.id}>
                      {farmer.name || farmer.fullName || `${farmer.firstName} ${farmer.lastName}` || farmer.phone}
                    </option>
                  ))}
                </select>
                {farmersLoading && <p className="text-sm text-gray-500 mt-1">Loading farmers...</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
                <input
                  type="number"
                  value={createForm.weightKg}
                  onChange={(e) => setCreateForm({ ...createForm, weightKg: e.target.value })}
                  required
                  min="0.1"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Enter weight in kg"
                />
                <p className="text-xs text-gray-500 mt-1">💡 Tip: Orders ≥1000kg automatically get bulk pricing</p>
              </div>

              {Number(createForm.weightKg) > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  {pricingLoading ? (
                    <div className="flex justify-center items-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
                      <span className="ml-2 text-sm text-gray-600">Loading pricing...</span>
                    </div>
                  ) : cassavaPricing ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Pricing Tier:</span>
                        <span className="font-medium text-emerald-600">
                          {Number(createForm.weightKg) >= 1000 ? "Bulk (Ton)" : "Retail (Kg)"}
                        </span>
                      </div>

                      <div className="bg-white p-3 rounded border space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Retail Price (per kg):</span>
                          <span className="font-medium">{formatCurrency(cassavaPricing.pricePerKg)}/kg</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Bulk Price (per ton):</span>
                          <span className="font-medium">{formatCurrency(cassavaPricing.pricePerTon)}/ton</span>
                        </div>
                        <div className="flex justify-between text-sm text-emerald-600">
                          <span className="font-medium">Bulk unit price:</span>
                          <span className="font-medium">{formatCurrency(cassavaPricing.pricePerTon / 1000)}/kg</span>
                        </div>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Applied Unit Price:</span>
                        <span className="font-medium text-emerald-600">
                          {formatCurrency(Number(createForm.weightKg) >= 1000 ? cassavaPricing.pricePerTon / 1000 : cassavaPricing.pricePerKg)}/kg
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Weight:</span>
                        <span className="font-medium">{Number(createForm.weightKg).toLocaleString()}kg</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between font-semibold">
                        <span className="text-gray-800">Total Amount:</span>
                        <span className="text-emerald-600">
                          {formatCurrency(calculatePrice(Number(createForm.weightKg), Number(createForm.weightKg) >= 1000 ? "ton" : "kg"))}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4 text-red-600">
                      <p className="text-sm">Unable to load pricing. Please try again.</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseCreateModal}
                  className="flex-1 px-4 py-2 bg-white/40 backdrop-blur-md border border-white/60 rounded-xl hover:bg-white/50 transition-all text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 px-4 py-2 bg-[#066f48] text-white rounded-xl hover:bg-[#055539] disabled:opacity-50 shadow-lg transition-all"
                >
                  {createLoading ? "Creating..." : "Create Purchase"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Purchase Modal - Enhanced Glass */}
      {isViewModalOpen && viewingPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md overflow-y-auto">
          <div className="bg-white/80 backdrop-blur-2xl rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden my-auto border border-white/60 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none rounded-[2rem]" />
            <div className="px-6 py-4 border-b border-white/40 bg-gradient-to-r from-[#066f48]/15 to-cyan-400/10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1/2 h-full bg-white/20 blur-xl rounded-full pointer-events-none" />
              <div className="flex justify-between items-center relative z-10">
                <h3 className="text-lg font-bold text-[#066f48]">Purchase Details</h3>
                <button onClick={() => { setIsViewModalOpen(false); setViewingPurchase(null); }} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-white/50 rounded-lg transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 relative z-10">
              {/* Purchase Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-4">Purchase Information</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">Purchase ID</p>
                      <p className="text-sm font-medium text-gray-900 break-all">{viewingPurchase._id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Weight</p>
                      <p className="text-sm font-medium text-gray-900">
                        {viewingPurchase.weightKg.toLocaleString()}kg
                        {viewingPurchase.unit === "ton" && (
                          <span className="text-gray-500 ml-1">({(viewingPurchase.weightKg / 1000).toFixed(3)} tons)</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Price per {viewingPurchase.unit === "ton" ? "Ton" : "Kg"}</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(viewingPurchase.pricePerUnit)}/{viewingPurchase.unit}
                        {viewingPurchase.unit === "ton" && (
                          <span className="text-gray-500 ml-2 text-xs">
                            ({formatCurrency(getPricePerKgForDisplay(viewingPurchase))}/kg)
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total Amount</p>
                      <p className="text-lg font-bold text-emerald-600">{formatCurrency(viewingPurchase.totalAmount)}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-4">Farmer Information</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">Farmer Name</p>
                      <p className="text-sm font-medium text-gray-900">{viewingPurchase.farmerName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Phone Number</p>
                      <p className="text-sm font-medium text-gray-900">{viewingPurchase.farmerPhone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Payment Method</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">{viewingPurchase.paymentMethod.replace("_", " ")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Payment Status</p>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        viewingPurchase.paymentStatus === "paid" ? "bg-green-100 text-green-800" :
                        viewingPurchase.paymentStatus === "failed" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {viewingPurchase.paymentStatus.charAt(0).toUpperCase() + viewingPurchase.paymentStatus.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status and Dates */}
              <div className="border-t border-gray-200 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    {getStatusBadge(viewingPurchase.status)}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Created At</p>
                    <p className="text-sm text-gray-900">{formatDate(viewingPurchase.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Last Updated</p>
                    <p className="text-sm text-gray-900">{formatDate(viewingPurchase.updatedAt)}</p>
                  </div>
                  {viewingPurchase.location && (
                    <div>
                      <p className="text-xs text-gray-500">Location</p>
                      <p className="text-sm text-gray-900">{viewingPurchase.location}</p>
                    </div>
                  )}
                </div>
              </div>

              {viewingPurchase.notes && (
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-xs text-gray-500 mb-2">Notes</p>
                  <p className="text-sm text-gray-900">{viewingPurchase.notes}</p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white/60 backdrop-blur-md border-t border-white/40 px-6 py-4 flex justify-end">
              <button
                onClick={() => { setIsViewModalOpen(false); setViewingPurchase(null); }}
                className="px-4 py-2 bg-[#066f48] text-white rounded-xl hover:bg-[#055539] shadow-lg transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successModal.isOpen && (
        <SuccessModal
          isOpen={successModal.isOpen}
          onClose={() => setSuccessModal({ isOpen: false, title: "", message: "" })}
          title={successModal.title}
          message={successModal.message}
        />
      )}
    </div>
  );
};

export default PurchasesView;