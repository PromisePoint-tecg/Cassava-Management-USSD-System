import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  DollarSign,
  X,
  Play,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  loansApi,
  AdminLoanResponse,
  LoanKPIs,
  GetLoansQuery,
  ApproveLoanData,
  CreateLoanData,
  LoanType,
  CreateLoanTypeData,
} from "../services/loans";
import { farmersApi, Farmer } from "../services/farmers";
import { SuccessModal } from "./SuccessModal";
import { LeafLoader } from "./Loader";

interface LoansViewProps {}

type TabType = "loans" | "requests";

export const LoansView: React.FC<LoansViewProps> = () => {
  // State management
  const [activeTab, setActiveTab] = useState<TabType>("loans");
  const [kpis, setKpis] = useState<LoanKPIs | null>(null);
  const [loans, setLoans] = useState<AdminLoanResponse[]>([]);
  const [loanRequests, setLoanRequests] = useState<AdminLoanResponse[]>([]);
  const [loanTypes, setLoanTypes] = useState<LoanType[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loadingLoanTypes, setLoadingLoanTypes] = useState(false);
  const [loadingFarmers, setLoadingFarmers] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [selectedLoan, setSelectedLoan] = useState<AdminLoanResponse | null>(
    null
  );
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreateLoanTypeModalOpen, setIsCreateLoanTypeModalOpen] =
    useState(false);
  const [createLoanTypeLoading, setCreateLoanTypeLoading] = useState(false);
  const [createLoanTypeForm, setCreateLoanTypeForm] =
    useState<CreateLoanTypeData>({
      name: "",
      description: "",
      category: "",
      interest_rate: 0,
      duration_months: 0,
    });
  const [loanData, setLoanData] = useState<CreateLoanData>({
    farmer_id: "",
    loan_type_id: "",
    principal_amount: 0,
    items: [{ name: "", quantity: 1, unit_price: 0, total_price: 0 }],
    purpose: "",
    due_date: "",
    monthly_payment: 0,
    notes: "",
  });
  const [approvalData, setApprovalData] = useState<ApproveLoanData>({
    pickup_date: "",
    pickup_location: "",
    admin_notes: "",
  });

  // Filters and pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Load initial data
  useEffect(() => {
    const initialLoad = async () => {
      await Promise.all([
        loadKPIs(),
        activeTab === "loans" ? loadLoans() : loadLoanRequests(),
        loadLoanTypes()
      ]);
      setIsInitialLoad(false);
    };
    initialLoad();
  }, []);

  // Load data when filters change
  useEffect(() => {
    if (!isInitialLoad) {
      if (activeTab === "loans") {
        loadLoans();
      } else {
        loadLoanRequests();
      }
    }
  }, [activeTab, searchTerm, statusFilter, currentPage, isInitialLoad]);

  const loadKPIs = async () => {
    try {
      const data = await loansApi.getLoanKPIs();
      setKpis(data);
    } catch (err) {
      console.error("Failed to load loan KPIs:", err);
      setError("Failed to load loan statistics");
    }
  };

  const loadLoans = async () => {
    try {
      if (isInitialLoad) setLoading(true);
      const query: GetLoansQuery = {
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
        status: (statusFilter as any) || undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      };

      const data = await loansApi.getAllLoans(query);
      setLoans(data.loans);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      console.error("Failed to load loans:", err);
      setError("Failed to load loans");
    } finally {
      if (isInitialLoad) setLoading(false);
    }
  };

  const loadLoanRequests = async () => {
    try {
      if (isInitialLoad) setLoading(true);
      const query: GetLoansQuery = {
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      };

      const data = await loansApi.getLoanRequests(query);
      setLoanRequests(data.loanRequests);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      console.error("Failed to load loan requests:", err);
      setError("Failed to load loan requests");
    } finally {
      if (isInitialLoad) setLoading(false);
    }
  };

  const loadLoanTypes = async () => {
    try {
      setLoadingLoanTypes(true);
      const data = await loansApi.getLoanTypes({ is_active: true });
      setLoanTypes(data);
    } catch (err) {
      console.error("Failed to load loan types:", err);
    } finally {
      setLoadingLoanTypes(false);
    }
  };

  const loadFarmers = async () => {
    try {
      setLoadingFarmers(true);
      const result = await farmersApi.getAllFarmers({
        limit: 100,
        status: "active",
      });
      setFarmers(result.farmers);
    } catch (err) {
      console.error("Failed to load farmers:", err);
    } finally {
      setLoadingFarmers(false);
    }
  };

  const handleCreateLoanType = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreateLoanTypeLoading(true);
      setError(null);

      await loansApi.createLoanType(createLoanTypeForm);

      setIsCreateLoanTypeModalOpen(false);
      setCreateLoanTypeForm({
        name: "",
        description: "",
        category: "",
        interest_rate: 0,
        duration_months: 0,
      });

      setSuccessMessage("Loan type created successfully!");
      setIsSuccessModalOpen(true);
      loadLoanTypes();
    } catch (err: any) {
      setError(err.message || "Failed to create loan type");
    } finally {
      setCreateLoanTypeLoading(false);
    }
  };

  const handleViewDetails = (loan: AdminLoanResponse) => {
    setSelectedLoan(loan);
    setIsDetailsModalOpen(true);
  };

  const handleApprove = (loan: AdminLoanResponse) => {
    setSelectedLoan(loan);
    setIsApprovalModalOpen(true);
    setApprovalData({
      pickup_date: "",
      pickup_location: "",
      admin_notes: "",
    });
  };

  const handleApprovalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan || !approvalData.pickup_date) return;

    try {
      await loansApi.approveLoanRequest(selectedLoan.id, approvalData);
      setIsApprovalModalOpen(false);
      setSelectedLoan(null);

      // Show success message
      setSuccessMessage(
        `Loan request approved successfully!\nActive loan created and SMS notification sent to ${selectedLoan.name}.\nThe loan will be activated when the ${selectedLoan.user_type} picks up the inputs.`
      );
      setIsSuccessModalOpen(true);

      // Refresh data
      loadKPIs();
      loadLoanRequests();
      if (activeTab === "loans") {
        loadLoans();
      }
    } catch (err) {
      console.error("Failed to approve loan:", err);
      alert("Failed to approve loan request. Please try again.");
    }
  };

  const handleCreateNewLoan = () => {
    setSelectedLoan(null); // Clear any selected loan
    setLoanData({
      farmer_id: "",
      loan_type_id: "",
      principal_amount: 0,
      items: [{ name: "", quantity: 1, unit_price: 0, total_price: 0 }],
      purpose: "",
      due_date: "",
      monthly_payment: 0,
      notes: "",
    });
    setShowCreateModal(true);
    // Load farmers and loan types when opening modal
    loadFarmers();
    loadLoanTypes();
  };

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanData.farmer_id || !loanData.principal_amount) return;

    try {
      // Convert amounts from naira to kobo for API
      const loanDataInKobo = {
        ...loanData,
        principal_amount: Math.round(loanData.principal_amount * 100), // Convert to kobo
        monthly_payment: loanData.monthly_payment
          ? Math.round(loanData.monthly_payment * 100)
          : undefined,
        items: loanData.items.map((item) => ({
          ...item,
          unit_price: Math.round(item.unit_price * 100), // Convert to kobo
          total_price: Math.round(item.total_price * 100), // Convert to kobo
        })),
      };

      await loansApi.createLoan(loanDataInKobo);
      setShowCreateModal(false);
      setSelectedLoan(null);
      setSuccessMessage("Loan created successfully!");
      setIsSuccessModalOpen(true);
      await loadLoans();
      await loadLoanRequests();
      await loadKPIs();
    } catch (err: any) {
      console.error("Failed to create loan:", err);
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Unknown error occurred";
      alert(`Failed to create loan: ${errorMessage}`);
    }
  };

  const handleActivateLoan = async (loan: AdminLoanResponse) => {
    if (loan.status !== "approved") {
      alert("Only approved loans can be activated.");
      return;
    }

    // Check if pickup date has passed
    if (loan.pickup_date && new Date() < new Date(loan.pickup_date)) {
      const pickupDate = new Date(loan.pickup_date).toLocaleDateString("en-NG");
      alert(`Cannot activate loan before pickup date: ${pickupDate}`);
      return;
    }

    const confirmMessage = `Are you sure you want to activate loan ${loan.reference} for ${loan.name}?\n\nThis will change the status to 'Active' and the ${loan.user_type} will start making monthly payments.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await loansApi.activateLoan(loan.id);

      // Show success message
      setSuccessMessage(
        `Loan ${loan.reference} activated successfully!\nThe ${loan.user_type} ${loan.name} has been notified via SMS.\nMonthly payments will now commence.`
      );
      setIsSuccessModalOpen(true);

      // Refresh data
      loadKPIs();
      loadLoans();
      loadLoanRequests();
    } catch (err: any) {
      console.error("Failed to activate loan:", err);
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to activate loan";
      alert(`Failed to activate loan: ${errorMessage}`);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      requested: {
        bg: "bg-green-100",
        text: "text-green-700",
        label: "Pending",
      },
      approved: { bg: "bg-green-200", text: "text-green-800", label: "Approved" },
      active: { bg: "bg-green-100", text: "text-green-800", label: "Active" },
      completed: {
        bg: "bg-emerald-100",
        text: "text-emerald-800",
        label: "Completed",
      },
      defaulted: { bg: "bg-gray-100", text: "text-gray-800", label: "Defaulted" },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] ||
      statusConfig.requested;

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text} flex items-center gap-1`}
      >
        {config.label}
      </span>
    );
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
    });
  };

  const currentData = activeTab === "loans" ? loans : loanRequests;

  return (
   <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
            Loan Management
          </h2>
          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2 sm:gap-3">
            <button
              onClick={() => setIsCreateLoanTypeModalOpen(true)}
              className="flex items-center justify-center px-4 sm:px-5 py-2.5 bg-[#066f48] text-white rounded-lg hover:bg-[#055b3d] transition-all text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Create Loan Type
            </button>
            <button
              onClick={() => handleCreateNewLoan()}
              className="flex items-center justify-center px-4 sm:px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Issue New Loan
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {[
            {
              title: "Total Outstanding",
              value: formatCurrency(kpis.totalOutstanding),
              icon: DollarSign,
              color: "green",
            },
            {
              title: "Active Loans",
              value: kpis.activeLoans,
              icon: CheckCircle2,
              color: "emerald",
            },
            {
              title: "Pending Requests",
              value: kpis.pendingRequests,
              icon: Clock,
              color: "green",
            },
            {
              title: "Default Rate",
              value: `${kpis.defaultRate.toFixed(1)}%`,
              icon: AlertTriangle,
              color: "gray",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-600 text-xs sm:text-sm font-medium">
                    {item.title}
                  </h3>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                    {item.value}
                  </p>
                </div>
                <div
                  className={`p-3 sm:p-4 rounded-xl bg-${item.color}-600`}
                >
                  <item.icon className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-2">
        <nav className="-mb-px flex space-x-2 sm:space-x-8 px-2 sm:px-6 py-3 sm:py-4 overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab("loans");
              setCurrentPage(1);
              setSearchTerm("");
              setStatusFilter("");
            }}
            className={`py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg font-medium transition-all whitespace-nowrap text-sm sm:text-base ${
              activeTab === "loans"
                ? "bg-emerald-50 text-emerald-700"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            All Loans
          </button>
          <button
            onClick={() => {
              setActiveTab("requests");
              setCurrentPage(1);
              setSearchTerm("");
              setStatusFilter("");
            }}
            className={`py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg font-medium transition-all whitespace-nowrap text-sm sm:text-base ${
              activeTab === "requests"
                ? "bg-emerald-50 text-emerald-700"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Loan Requests
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Search by name or reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-4 sm:pr-5 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#066f48] focus:border-[#066f48] focus:outline-none transition-all text-gray-800 placeholder-gray-500 text-sm sm:text-base"
            />
          </div>

          {activeTab === "loans" && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 sm:px-5 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#066f48] focus:border-[#066f48] focus:outline-none transition-all text-gray-800 text-sm sm:text-base"
            >
              <option value="">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="defaulted">Defaulted</option>
            </select>
          )}
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <LeafLoader />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">{error}</div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Requester
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Reference
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-8 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentData.map((loan) => (
                    <tr
                      key={loan.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {loan.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {loan.phone}
                          </div>
                          <div className="text-xs text-gray-500 capitalize mt-0.5">
                            {loan.user_type}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {loan.reference}
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(loan.principal_amount)}
                          </div>
                          <div className="text-xs text-gray-600 mt-0.5">
                            Outstanding:{" "}
                            {formatCurrency(loan.amount_outstanding)}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        {getStatusBadge(loan.status)}
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(loan.due_date)}
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-3">
                          <button
                            onClick={() => handleViewDetails(loan)}
                            className="p-2.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all"
                            title="View Details"
                          >
                            <Eye className="w-5 h-5" />
                          </button>

                          {loan.status === "requested" && (
                            <button
                              onClick={() => handleApprove(loan)}
                              className="p-2.5 text-blue-700 hover:bg-white/30 rounded-xl transition-all backdrop-blur-sm"
                              title="Approve"
                            >
                              <CheckCircle2 className="w-5 h-5" />
                            </button>
                          )}

                          {loan.status === "approved" && (
                            <button
                              onClick={() => handleActivateLoan(loan)}
                              className="p-2.5 text-green-700 hover:bg-white/30 rounded-xl transition-all backdrop-blur-sm"
                              title="Activate Loan"
                            >
                              <Play className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-100">
              {currentData.map((loan) => (
                <div
                  key={loan.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-900">
                        {loan.name}
                      </div>
                      <div className="text-xs text-gray-600 mt-0.5">
                        {loan.phone}
                      </div>
                      <div className="text-xs text-gray-500 capitalize mt-0.5">
                        {loan.user_type}
                      </div>
                    </div>
                    {getStatusBadge(loan.status)}
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Reference:</span>
                      <span className="font-medium text-gray-900">{loan.reference}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Principal:</span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(loan.principal_amount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Outstanding:</span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(loan.amount_outstanding)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Due Date:</span>
                      <span className="font-medium text-gray-900">
                        {formatDate(loan.due_date)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => handleViewDetails(loan)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>

                    {loan.status === "requested" && (
                      <button
                        onClick={() => handleApprove(loan)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-blue-700 hover:bg-blue-50 rounded-lg transition-all text-sm font-medium"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Approve
                      </button>
                    )}

                    {loan.status === "approved" && (
                      <button
                        onClick={() => handleActivateLoan(loan)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-green-700 hover:bg-green-50 rounded-lg transition-all text-sm font-medium"
                      >
                        <Play className="w-4 h-4" />
                        Activate
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {currentData.length === 0 && (
              <div className="py-16 text-center text-gray-500">
                {activeTab === "loans"
                  ? "No loans found"
                  : "No loan requests found"}
              </div>
            )}
          </>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all text-gray-700"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all text-gray-700"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    



      {/* Loan Details Modal */}
      {isDetailsModalOpen && selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  Loan Details - {selectedLoan.reference}
                </h3>
                <button
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Requester Info */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Requester Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{selectedLoan.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{selectedLoan.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Type</p>
                    <p className="font-medium capitalize">
                      {selectedLoan.user_type}
                    </p>
                  </div>
                </div>
              </div>

              {/* Loan Info */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Loan Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Loan Type</p>
                    <p className="font-medium">{selectedLoan.loan_type_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Principal Amount</p>
                    <p className="font-medium">
                      {formatCurrency(selectedLoan.principal_amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Interest Rate</p>
                    <p className="font-medium">{selectedLoan.interest_rate}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Repayment</p>
                    <p className="font-medium">
                      {formatCurrency(selectedLoan.total_repayment)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="font-medium">
                      {selectedLoan.duration_months} months
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Monthly Payment</p>
                    <p className="font-medium">
                      {formatCurrency(selectedLoan.monthly_payment)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Amount Paid</p>
                    <p className="font-medium text-green-600">
                      {formatCurrency(selectedLoan.amount_paid)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Outstanding</p>
                    <p className="font-medium text-orange-600">
                      {formatCurrency(selectedLoan.amount_outstanding)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <div className="font-medium">
                      {getStatusBadge(selectedLoan.status)}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Due Date</p>
                    <p className="font-medium">
                      {formatDate(selectedLoan.due_date)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pickup Information */}
              {(selectedLoan.pickup_date || selectedLoan.pickup_location) && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Pickup Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedLoan.pickup_date && (
                      <div>
                        <p className="text-sm text-gray-500">Pickup Date</p>
                        <p className="font-medium">
                          {formatDate(selectedLoan.pickup_date)}
                        </p>
                      </div>
                    )}
                    {selectedLoan.pickup_location && (
                      <div>
                        <p className="text-sm text-gray-500">Pickup Location</p>
                        <p className="font-medium">
                          {selectedLoan.pickup_location}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Purpose */}
              {selectedLoan.purpose && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Purpose
                  </h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {selectedLoan.purpose}
                  </p>
                </div>
              )}

              {/* Dates */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Important Dates
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="font-medium">
                      {formatDate(selectedLoan.createdAt)}
                    </p>
                  </div>
                  {selectedLoan.approved_at && (
                    <div>
                      <p className="text-sm text-gray-500">Approved</p>
                      <p className="font-medium">
                        {formatDate(selectedLoan.approved_at)}
                      </p>
                    </div>
                  )}
                  {selectedLoan.disbursed_at && (
                    <div>
                      <p className="text-sm text-gray-500">Disbursed</p>
                      <p className="font-medium">
                        {formatDate(selectedLoan.disbursed_at)}
                      </p>
                    </div>
                  )}
                  {selectedLoan.completed_at && (
                    <div>
                      <p className="text-sm text-gray-500">Completed</p>
                      <p className="font-medium">
                        {formatDate(selectedLoan.completed_at)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {isApprovalModalOpen && selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  Approve Loan Request
                </h3>
                <button
                  onClick={() => setIsApprovalModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleApprovalSubmit} className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Approving loan for {selectedLoan.name} -{" "}
                  {formatCurrency(selectedLoan.principal_amount)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pickup Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={approvalData.pickup_date}
                  onChange={(e) =>
                    setApprovalData({
                      ...approvalData,
                      pickup_date: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pickup Location
                </label>
                <input
                  type="text"
                  value={approvalData.pickup_location}
                  onChange={(e) =>
                    setApprovalData({
                      ...approvalData,
                      pickup_location: e.target.value,
                    })
                  }
                  placeholder="e.g., Main Office, Warehouse A, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Notes (for farmer)
                </label>
                <textarea
                  value={approvalData.admin_notes}
                  onChange={(e) =>
                    setApprovalData({
                      ...approvalData,
                      admin_notes: e.target.value,
                    })
                  }
                  placeholder="Any special instructions for the farmer..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsApprovalModalOpen(false)}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Approve & Send SMS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Loan Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedLoan
                    ? `Create Loan for ${selectedLoan.farmer_name}`
                    : "Issue New Loan"}
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateLoan} className="p-6 space-y-4">
              {/* Farmer Selection (only for new loans) */}
              {!selectedLoan && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Farmer *
                  </label>
                  <select
                    value={loanData.farmer_id}
                    onChange={(e) =>
                      setLoanData({ ...loanData, farmer_id: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                    disabled={loadingFarmers}
                  >
                    <option value="">
                      {loadingFarmers
                        ? "Loading farmers..."
                        : "Select farmer..."}
                    </option>
                    {farmers.map((farmer) => (
                      <option key={farmer.id} value={farmer.id}>
                        {farmer.fullName} ({farmer.phone}) - {farmer.lga}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Loan Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loan Type *
                </label>
                <select
                  value={loanData.loan_type_id}
                  onChange={(e) =>
                    setLoanData({ ...loanData, loan_type_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                  disabled={loadingLoanTypes}
                >
                  <option value="">
                    {loadingLoanTypes
                      ? "Loading loan types..."
                      : "Select loan type..."}
                  </option>
                  {loanTypes.map((loanType) => (
                    <option key={loanType.id} value={loanType.id}>
                      {loanType.name} - {loanType.interest_rate}% (
                      {loanType.duration_months} months)
                    </option>
                  ))}
                </select>
              </div>

              {/* Principal Amount */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Principal Amount (₦) *
                  </label>
                  <input
                    type="number"
                    value={loanData.principal_amount}
                    onChange={(e) =>
                      setLoanData({
                        ...loanData,
                        principal_amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="e.g., 100000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                    min="1000"
                    step="1000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    value={loanData.due_date}
                    onChange={(e) =>
                      setLoanData({ ...loanData, due_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>

              {/* Items */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loan Items
                </label>
                {loanData.items.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2"
                  >
                    <input
                      type="text"
                      placeholder="Item name"
                      value={item.name}
                      onChange={(e) => {
                        const newItems = [...loanData.items];
                        newItems[index].name = e.target.value;
                        setLoanData({ ...loanData, items: newItems });
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => {
                        const newItems = [...loanData.items];
                        const quantity = parseInt(e.target.value) || 1;
                        newItems[index].quantity = quantity;
                        newItems[index].total_price =
                          quantity * newItems[index].unit_price;
                        setLoanData({ ...loanData, items: newItems });
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                      min="1"
                    />
                    <input
                      type="number"
                      placeholder="Unit Price (₦)"
                      value={item.unit_price}
                      onChange={(e) => {
                        const newItems = [...loanData.items];
                        const unitPrice = parseFloat(e.target.value) || 0;
                        newItems[index].unit_price = unitPrice;
                        newItems[index].total_price =
                          newItems[index].quantity * unitPrice;
                        setLoanData({ ...loanData, items: newItems });
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                      min="0"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        ₦{item.total_price.toLocaleString()}
                      </span>
                      {loanData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newItems = loanData.items.filter(
                              (_, i) => i !== index
                            );
                            setLoanData({ ...loanData, items: newItems });
                          }}
                          className="text-red-600 hover:text-red-800 ml-2"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setLoanData({
                      ...loanData,
                      items: [
                        ...loanData.items,
                        {
                          name: "",
                          quantity: 1,
                          unit_price: 0,
                          total_price: 0,
                        },
                      ],
                    });
                  }}
                  className="text-emerald-600 hover:text-emerald-800 text-sm font-medium"
                >
                  + Add Item
                </button>
              </div>

              {/* Purpose */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purpose
                </label>
                <textarea
                  value={loanData.purpose}
                  onChange={(e) =>
                    setLoanData({ ...loanData, purpose: e.target.value })
                  }
                  placeholder="Purpose of the loan (optional)"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Notes
                </label>
                <textarea
                  value={loanData.notes}
                  onChange={(e) =>
                    setLoanData({ ...loanData, notes: e.target.value })
                  }
                  placeholder="Internal notes (optional)"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Create Loan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Loan Type Modal */}
      {isCreateLoanTypeModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">
                Create Loan Type
              </h3>
              <button
                onClick={() => {
                  setIsCreateLoanTypeModalOpen(false);
                  setCreateLoanTypeForm({
                    name: "",
                    description: "",
                    category: "",
                    interest_rate: 0,
                    duration_months: 0,
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateLoanType} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loan Type Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={createLoanTypeForm.name}
                    onChange={(e) =>
                      setCreateLoanTypeForm({
                        ...createLoanTypeForm,
                        name: e.target.value,
                      })
                    }
                    placeholder="e.g., Equipment Loan"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={createLoanTypeForm.category}
                    onChange={(e) =>
                      setCreateLoanTypeForm({
                        ...createLoanTypeForm,
                        category: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select category...</option>
                    <option value="input_credit">Input Credit</option>
                    <option value="farm_tools">Farm Tools</option>
                    <option value="equipment">Equipment</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={createLoanTypeForm.description}
                  onChange={(e) =>
                    setCreateLoanTypeForm({
                      ...createLoanTypeForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe the loan type and its purpose..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Interest Rate (%) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    step="0.1"
                    value={createLoanTypeForm.interest_rate}
                    onChange={(e) =>
                      setCreateLoanTypeForm({
                        ...createLoanTypeForm,
                        interest_rate: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (Months) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={createLoanTypeForm.duration_months}
                    onChange={(e) =>
                      setCreateLoanTypeForm({
                        ...createLoanTypeForm,
                        duration_months: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateLoanTypeModalOpen(false);
                    setCreateLoanTypeForm({
                      name: "",
                      description: "",
                      category: "",
                      interest_rate: 0,
                      duration_months: 0,
                    });
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoanTypeLoading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createLoanTypeLoading ? "Creating..." : "Create Loan Type"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        message={successMessage}
      />
    </div>
  );
};
