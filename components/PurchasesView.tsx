import React, { useState, useEffect, useMemo } from "react";
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
  const [farmerSearchTerm, setFarmerSearchTerm] = useState("");
  const [showFarmerDropdown, setShowFarmerDropdown] = useState(false);
  const [selectedFarmerName, setSelectedFarmerName] = useState("");
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

  const filteredFarmers = useMemo(() => {
  if (!farmerSearchTerm.trim()) return farmers;
  
  const searchLower = farmerSearchTerm.toLowerCase();
  return farmers.filter(farmer => 
    (farmer.name || farmer.fullName || `${farmer.firstName} ${farmer.lastName}`).toLowerCase().includes(searchLower) ||
    farmer.phone.includes(farmerSearchTerm)
  );
}, [farmers, farmerSearchTerm]);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          loadKPIs(),
          loadPurchases(),
          loadCassavaPricing()
        ]);
      } catch (err) {
        console.error('Failed to load initial data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
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
  setFarmerSearchTerm("");
  setShowFarmerDropdown(false);
  setSelectedFarmerName("");
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
      pending: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Pending" },
      completed: { bg: "bg-green-100", text: "text-green-700", label: "Completed" },
      failed: { bg: "bg-red-100", text: "text-red-700", label: "Failed" },
      cancelled: { bg: "bg-gray-100", text: "text-gray-700", label: "Cancelled" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${config.bg} ${config.text}`}>
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
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[#066f48]">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Purchase Management</h2>
              <p className="text-sm text-gray-600">{total} total purchases</p>
            </div>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="mt-3 sm:mt-0 w-full sm:w-auto px-4 py-2 bg-[#066f48] text-white rounded-lg hover:bg-[#055539] flex items-center justify-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Purchase</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Scale, label: "Total Weight", value: `${(kpis.totalWeight || 0).toLocaleString()}kg`, color: "blue" },
            { icon: DollarSign, label: "Total Amount Spent", value: formatCurrency(kpis.totalAmountSpent || 0), color: "emerald" },
            { icon: TrendingUp, label: "Average Price/kg", value: formatCurrency(kpis.averagePrice || 0), color: "purple" },
            { icon: Users, label: "Total Purchases", value: (kpis.totalPurchases || 0).toLocaleString(), color: "orange" },
          ].map((kpi, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
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

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search purchases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#066f48] focus:border-[#066f48] focus:outline-none transition-all text-gray-800 placeholder-gray-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#066f48] focus:border-[#066f48] focus:outline-none transition-all text-gray-800"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {filteredPurchases.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No purchases found</p>
          </div>
        ) : (
          <>
            {/* Mobile: card list */}
            <div className="md:hidden p-4 space-y-3">
              {paginatedPurchases.map((purchase) => (
                <div key={purchase._id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-800">{purchase.farmerName}</div>
                      <div className="text-xs text-gray-500">{purchase.farmerPhone}</div>
                    </div>
                    <div className="text-sm font-semibold text-gray-800">{formatCurrency(purchase.totalAmount)}</div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-700">
                    <div>Weight: <span className="font-medium text-gray-800">{purchase.weightKg}kg</span></div>
                    <div className="text-right">Unit Price: <span className="font-medium text-gray-800">{getPricePerKgForDisplay(purchase)}/kg</span></div>
                    <div>Status: <span className="inline-block ml-1">{getStatusBadge(purchase.status)}</span></div>
                    <div className="text-right">{formatDate(purchase.createdAt)}</div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleViewPurchase(purchase._id)}
                      className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-blue-600 flex items-center justify-center gap-2"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="text-sm">View</span>
                    </button>
                    {purchase.status === "failed" && (
                      <button
                        onClick={() => handleRetryPurchase(purchase._id)}
                        className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-emerald-600 flex items-center justify-center gap-2"
                        disabled={retryingPurchase === purchase._id}
                        title="Retry"
                      >
                        {retryingPurchase === purchase._id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        <span className="text-sm">Retry</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-medium uppercase text-xs border-b border-gray-200">
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
              <tbody className="divide-y divide-gray-100">
                {paginatedPurchases.map((purchase) => (
                  <tr key={purchase._id} className="hover:bg-gray-50 transition-colors">
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
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {purchase.status === "failed" && (
                          <button
                            onClick={() => handleRetryPurchase(purchase._id)}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
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
          </>
        )}
      </div>

      {/* Pagination */}
      {!loading && filteredPurchases.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-3">
            <p className="text-sm text-gray-600">Page {currentPage} of {totalPages}</p>
            <div className="flex w-full sm:w-auto gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="w-full sm:w-auto px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all text-gray-700"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="w-full sm:w-auto px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all text-gray-700"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Purchase Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden my-auto border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-[#066f48]">Record Cassava Purchase</h3>
                <button onClick={handleCloseCreateModal} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreatePurchase} className="p-6 space-y-4">
             <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">Select Farmer *</label>
  
  {/* Searchable Dropdown */}
  <div className="relative">
    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
    <input
      type="text"
      placeholder={selectedFarmerName || "Search farmers by name or phone..."}
      value={farmerSearchTerm}
      onChange={(e) => {
        setFarmerSearchTerm(e.target.value);
        setShowFarmerDropdown(true);
      }}
      onFocus={() => setShowFarmerDropdown(true)}
      disabled={farmersLoading}
      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
    />
    
    {/* Hidden required input for form validation */}
    <input
      type="text"
      value={createForm.farmerId}
      onChange={() => {}}
      required
      className="absolute opacity-0 pointer-events-none"
      tabIndex={-1}
    />
    
    {/* Dropdown Results */}
    {showFarmerDropdown && !farmersLoading && (
      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
        {filteredFarmers.length > 0 ? (
          <ul className="py-1">
            {filteredFarmers.map((farmer) => {
              const farmerName = farmer.name || farmer.fullName || `${farmer.firstName} ${farmer.lastName}` || farmer.phone;
              const isSelected = createForm.farmerId === farmer.id;
              
              return (
                <li
                  key={farmer.id}
                  onClick={() => {
                    setCreateForm({ ...createForm, farmerId: farmer.id });
                    setSelectedFarmerName(farmerName);
                    setFarmerSearchTerm("");
                    setShowFarmerDropdown(false);
                  }}
                  className={`px-4 py-2.5 cursor-pointer hover:bg-emerald-50 transition-colors ${
                    isSelected ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{farmerName}</div>
                      <div className="text-xs text-gray-500">{farmer.phone}</div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="px-4 py-8 text-center text-gray-500">
            <p className="text-sm">
              {farmerSearchTerm ? `No farmers found matching "${farmerSearchTerm}"` : 'No farmers available'}
            </p>
          </div>
        )}
      </div>
    )}
    
    {/* Selected Farmer Display */}
    {selectedFarmerName && !showFarmerDropdown && (
      <div className="mt-2 flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-medium text-emerald-700">{selectedFarmerName}</span>
        </div>
        <button
          type="button"
          onClick={() => {
            setCreateForm({ ...createForm, farmerId: "" });
            setSelectedFarmerName("");
            setFarmerSearchTerm("");
          }}
          className="text-emerald-600 hover:text-emerald-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    )}
  </div>
  
  {farmersLoading && (
    <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-emerald-500"></div>
      Loading farmers...
    </p>
  )}
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
                  className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 px-4 py-2 bg-[#066f48] text-white rounded-lg hover:bg-[#055539] disabled:opacity-50 transition-all"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden my-auto border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-[#066f48]">Purchase Details</h3>
                <button onClick={() => { setIsViewModalOpen(false); setViewingPurchase(null); }} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
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

            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end">
              <button
                onClick={() => { setIsViewModalOpen(false); setViewingPurchase(null); }}
                className="px-4 py-2 bg-[#066f48] text-white rounded-lg hover:bg-[#055539] transition-all"
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