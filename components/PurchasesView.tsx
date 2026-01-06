import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  Clock,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Scale,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import {
  purchasesApi,
  PurchaseItem,
  PurchaseKPIs,
  CreatePurchaseData,
  GetPurchasesQuery,
  CassavaPricing,
} from "../api/purchases";
import { farmersApi, Farmer } from "../api/farmers";
import { SuccessModal } from "./SuccessModal";

interface PurchasesViewProps {}

export const PurchasesView: React.FC<PurchasesViewProps> = () => {
  // State management
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [kpis, setKpis] = useState<PurchaseKPIs | null>(null);
  const [cassavaPricing, setCassavaPricing] = useState<CassavaPricing | null>(
    null
  );
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

  // Legacy form state (for old modal)
  const [selectedFarmerId, setSelectedFarmerId] = useState("");
  const [weight, setWeight] = useState<number>(0);
  const [pricePerKg] = useState(500); // Default price

  // Modal states for viewing purchase
  const [viewingPurchase, setViewingPurchase] = useState<PurchaseItem | null>(
    null
  );
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
        pricePerKg:
          weightKg >= 1000
            ? cassavaPricing.pricePerTon / 1000
            : cassavaPricing.pricePerKg,
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
        message: `Purchase for ${
          selectedFarmer.name
        } has been recorded. Total amount: ${formatCurrency(
          purchase.totalAmount
        )}`,
      });

      // Reload data
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

      // Show success message
      setSuccessModal({
        isOpen: true,
        title: "Purchase Retried Successfully!",
        message:
          "The failed purchase has been retried and processed successfully.",
      });

      // Reload data
      loadPurchases();
      loadKPIs();
    } catch (err) {
      console.error("Failed to retry purchase:", err);
      setError("Failed to retry purchase. Please try again.");
    } finally {
      setRetryingPurchase(null);
    }
  };

  // Legacy form handler (for old modal)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Legacy handler - could redirect to new modal
    setIsModalOpen(false);
    setIsCreateModalOpen(true);
    loadFarmers();
  };

  // Computed values for filtering and pagination
  const filteredPurchases = purchases.filter((purchase) => {
    const matchesSearch =
      searchTerm === "" ||
      purchase.farmerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.farmerPhone.includes(searchTerm);

    const matchesStatus =
      statusFilter === "" || purchase.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const paginatedPurchases = filteredPurchases.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPagesCalculated = Math.ceil(
    filteredPurchases.length / itemsPerPage
  );

  // Update totalPages when filteredPurchases changes
  useEffect(() => {
    setTotalPages(totalPagesCalculated);
    if (currentPage > totalPagesCalculated && totalPagesCalculated > 0) {
      setCurrentPage(1);
    }
  }, [filteredPurchases.length, totalPagesCalculated, currentPage]);

  const handleUpdateStatus = async (
    id: string,
    status: PurchaseItem["status"]
  ) => {
    try {
      await purchasesApi.updatePurchaseStatus(id, status);
      await loadPurchases();
      await loadKPIs();
      setSuccessModal({
        isOpen: true,
        title: "Status Updated",
        message: `Purchase status updated to ${status}`,
      });
    } catch (err: any) {
      console.error("Failed to update status:", err);
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Unknown error occurred";
      alert(`Failed to update status: ${errorMessage}`);
    }
  };

  const calculatePrice = (weightKg: number, unit: "kg" | "ton") => {
    if (!cassavaPricing) return 0;

    if (unit === "ton" || weightKg >= 1000) {
      // Use ton pricing for bulk purchases
      const tons = weightKg / 1000;
      return Math.round(tons * cassavaPricing.pricePerTon * 100) / 100;
    } else {
      // Use kg pricing for smaller purchases
      return Math.round(weightKg * cassavaPricing.pricePerKg * 100) / 100;
    }
  };

  // Helper to get price per kg for display (handles both kg and ton units)
  const getPricePerKgForDisplay = (purchase: PurchaseItem): number => {
    // pricePerKg is always stored as price per kg, regardless of unit
    return purchase.pricePerKg;
  };

  // Handler to view purchase details
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
      pending: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        label: "Pending",
      },
      completed: {
        bg: "bg-green-100",
        text: "text-green-800",
        label: "Completed",
      },
      failed: { bg: "bg-red-100", text: "text-red-800", label: "Failed" },
      cancelled: {
        bg: "bg-gray-100",
        text: "text-gray-800",
        label: "Cancelled",
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  const getStatusBadgeClass = (status: string) => {
    const statusClasses = {
      pending:
        "px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800",
      completed:
        "px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800",
      failed:
        "px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800",
      cancelled:
        "px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800",
    };

    return (
      statusClasses[status as keyof typeof statusClasses] ||
      statusClasses.pending
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
          Purchase Management
        </h2>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Purchase
        </button>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 text-sm font-medium">
                  Total Weight
                </h3>
                <p className="text-2xl font-bold text-gray-800">
                  {(kpis.totalWeight || 0).toLocaleString()}kg
                </p>
              </div>
              <Scale className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 text-sm font-medium">
                  Total Amount Spent
                </h3>
                <p className="text-2xl font-bold text-gray-800">
                  {formatCurrency(kpis.totalAmountSpent || 0)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-emerald-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 text-sm font-medium">
                  Average Price/kg
                </h3>
                <p className="text-2xl font-bold text-gray-800">
                  {formatCurrency(kpis.averagePrice || 0)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 text-sm font-medium">
                  Total Purchases
                </h3>
                <p className="text-2xl font-bold text-gray-800">
                  {(kpis.totalPurchases || 0).toLocaleString()}
                </p>
              </div>
              <Users className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search purchases..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      {/* Purchases Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        ) : filteredPurchases.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No purchases found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Farmer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Weight
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedPurchases.map((purchase) => (
                  <tr key={purchase._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {purchase.farmerName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {purchase.farmerPhone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {purchase.weightKg}kg
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getPricePerKgForDisplay(purchase)}/kg
                      {purchase.unit === "ton" && (
                        <span className="text-xs text-gray-500 ml-1">
                          (bulk)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(purchase.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadgeClass(purchase.status)}>
                        {purchase.status.charAt(0).toUpperCase() +
                          purchase.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(purchase.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewPurchase(purchase._id)}
                          className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </button>
                        {purchase.status === "failed" && (
                          <button
                            onClick={() => handleRetryPurchase(purchase._id)}
                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            disabled={retryingPurchase === purchase._id}
                          >
                            {retryingPurchase === purchase._id ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                Retrying...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="w-3 h-3 mr-1" />
                                Retry
                              </>
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

      {/* Pagination */}
      {!loading && filteredPurchases.length > 0 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-700">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, filteredPurchases.length)} of{" "}
            {filteredPurchases.length} results
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Create Purchase Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Record Cassava Purchase
              </h3>
              <button
                onClick={handleCloseCreateModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePurchase} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Farmer
                </label>
                <select
                  value={createForm.farmerId}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, farmerId: e.target.value })
                  }
                  required
                  disabled={farmersLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select a farmer...</option>
                  {farmers.map((farmer) => (
                    <option key={farmer.id} value={farmer.id}>
                      {farmer.name ||
                        farmer.fullName ||
                        `${farmer.firstName} ${farmer.lastName}` ||
                        farmer.phone}
                    </option>
                  ))}
                </select>
                {farmersLoading && (
                  <p className="text-sm text-gray-500 mt-1">
                    Loading farmers...
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  value={createForm.weightKg}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, weightKg: e.target.value })
                  }
                  required
                  min="0.1"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Enter weight in kg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 Tip: Orders ≥1000kg automatically get bulk pricing (per ton
                  rate)
                </p>
              </div>

              {Number(createForm.weightKg) > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  {pricingLoading ? (
                    <div className="flex justify-center items-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
                      <span className="ml-2 text-sm text-gray-600">
                        Loading pricing...
                      </span>
                    </div>
                  ) : cassavaPricing ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Pricing Tier:</span>
                        <span className="font-medium text-emerald-600">
                          {Number(createForm.weightKg) >= 1000
                            ? "Bulk (Ton)"
                            : "Retail (Kg)"}
                        </span>
                      </div>

                      {/* Show both pricing options for reference */}
                      <div className="bg-white p-3 rounded border space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            Retail Price (per kg):
                          </span>
                          <span className="font-medium">
                            {formatCurrency(cassavaPricing.pricePerKg)}/kg
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            Bulk Price (per ton):
                          </span>
                          <span className="font-medium">
                            {formatCurrency(cassavaPricing.pricePerTon)}/ton
                          </span>
                        </div>
                        <div className="flex justify-between text-sm text-emerald-600">
                          <span className="font-medium">Bulk unit price:</span>
                          <span className="font-medium">
                            {formatCurrency(cassavaPricing.pricePerTon / 1000)}
                            /kg
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          Applied Unit Price:
                        </span>
                        <span className="font-medium text-emerald-600">
                          {formatCurrency(
                            Number(createForm.weightKg) >= 1000
                              ? cassavaPricing.pricePerTon / 1000
                              : cassavaPricing.pricePerKg
                          )}
                          /kg
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Weight:</span>
                        <span className="font-medium">
                          {Number(createForm.weightKg).toLocaleString()}kg
                        </span>
                      </div>
                      <div className="border-t pt-2 flex justify-between font-semibold">
                        <span className="text-gray-800">Total Amount:</span>
                        <span className="text-emerald-600">
                          {formatCurrency(
                            calculatePrice(
                              Number(createForm.weightKg),
                              Number(createForm.weightKg) >= 1000 ? "ton" : "kg"
                            )
                          )}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4 text-red-600">
                      <p className="text-sm">
                        Unable to load pricing. Please try again.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseCreateModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createLoading ? "Creating..." : "Create Purchase"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Purchase Modal */}
      {isViewModalOpen && viewingPurchase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">
                Purchase Details
              </h3>
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  setViewingPurchase(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Purchase Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-4">
                    Purchase Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">Purchase ID</p>
                      <p className="text-sm font-medium text-gray-900 break-all">
                        {viewingPurchase._id}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Weight</p>
                      <p className="text-sm font-medium text-gray-900">
                        {viewingPurchase.weightKg.toLocaleString()}kg
                        {viewingPurchase.unit === "ton" && (
                          <span className="text-gray-500 ml-1">
                            ({(viewingPurchase.weightKg / 1000).toFixed(3)}{" "}
                            tons)
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">
                        Price per{" "}
                        {viewingPurchase.unit === "ton" ? "Ton" : "Kg"}
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(viewingPurchase.pricePerUnit)}/
                        {viewingPurchase.unit}
                        {viewingPurchase.unit === "ton" && (
                          <span className="text-gray-500 ml-2 text-xs">
                            (
                            {formatCurrency(
                              getPricePerKgForDisplay(viewingPurchase)
                            )}
                            /kg)
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total Amount</p>
                      <p className="text-lg font-bold text-emerald-600">
                        {formatCurrency(viewingPurchase.totalAmount)}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-4">
                    Farmer Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">Farmer Name</p>
                      <p className="text-sm font-medium text-gray-900">
                        {viewingPurchase.farmerName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Phone Number</p>
                      <p className="text-sm font-medium text-gray-900">
                        {viewingPurchase.farmerPhone}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Payment Method</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {viewingPurchase.paymentMethod.replace("_", " ")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Payment Status</p>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          viewingPurchase.paymentStatus === "paid"
                            ? "bg-green-100 text-green-800"
                            : viewingPurchase.paymentStatus === "failed"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {viewingPurchase.paymentStatus.charAt(0).toUpperCase() +
                          viewingPurchase.paymentStatus.slice(1)}
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
                    <p className="text-sm text-gray-900">
                      {formatDate(viewingPurchase.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Last Updated</p>
                    <p className="text-sm text-gray-900">
                      {formatDate(viewingPurchase.updatedAt)}
                    </p>
                  </div>
                  {viewingPurchase.location && (
                    <div>
                      <p className="text-xs text-gray-500">Location</p>
                      <p className="text-sm text-gray-900">
                        {viewingPurchase.location}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {viewingPurchase.notes && (
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-xs text-gray-500 mb-2">Notes</p>
                  <p className="text-sm text-gray-900">
                    {viewingPurchase.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  setViewingPurchase(null);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Utility functions
const formatCurrency = (amount: number) => {
  const safeAmount = typeof amount === "number" && !isNaN(amount) ? amount : 0;
  return `₦${(safeAmount / 100).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (date: Date | string) => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusBadge = (status: string) => {
  const badges = {
    pending: (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </span>
    ),
    completed: (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Completed
      </span>
    ),
    failed: (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <AlertCircle className="w-3 h-3 mr-1" />
        Failed
      </span>
    ),
    cancelled: (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Cancelled
      </span>
    ),
  };
  return (
    badges[status as keyof typeof badges] || (
      <span className="text-xs text-gray-500">{status}</span>
    )
  );
};

const getStatusBadgeClass = (status: string) => {
  const classes = {
    pending:
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800",
    completed:
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800",
    failed:
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800",
    cancelled:
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800",
  };
  return (
    classes[status as keyof typeof classes] ||
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
  );
};

export default PurchasesView;
