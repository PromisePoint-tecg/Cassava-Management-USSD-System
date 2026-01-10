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
} from "../api/loans";
import { farmersApi, Farmer } from "../api/farmers";
import { SuccessModal } from "./SuccessModal";

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
    loadKPIs();
    loadLoans();
    loadLoanRequests();
    loadLoanTypes();
  }, []);

  // Load data when filters change
  useEffect(() => {
    if (activeTab === "loans") {
      loadLoans();
    } else {
      loadLoanRequests();
    }
  }, [activeTab, searchTerm, statusFilter, currentPage]);

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
      setLoading(true);
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
      setLoading(false);
    }
  };

  const loadLoanRequests = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
          Loan Management
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setIsCreateLoanTypeModalOpen(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Loan Type
          </button>
          <button
            onClick={() => handleCreateNewLoan()}
            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Issue New Loan
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 text-sm font-medium">
                  Total Outstanding
                </h3>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(kpis.totalOutstanding)}
                </p>
              </div>
              <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 text-sm font-medium">
                  Active Loans
                </h3>
                <p className="text-2xl font-bold text-gray-900">
                  {kpis.activeLoans}
                </p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 text-sm font-medium">
                  Pending Requests
                </h3>
                <p className="text-2xl font-bold text-gray-900">
                  {kpis.pendingRequests}
                </p>
              </div>
              <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 text-sm font-medium">
                  Default Rate
                </h3>
                <p className="text-2xl font-bold text-gray-900">
                  {kpis.defaultRate.toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-gray-50 text-gray-600 rounded-lg">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => {
              setActiveTab("loans");
              setCurrentPage(1);
              setSearchTerm("");
              setStatusFilter("");
            }}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "loans"
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            All Loans ({kpis ? kpis.totalLoanRequests : 0})
          </button>
          <button
            onClick={() => {
              setActiveTab("requests");
              setCurrentPage(1);
              setSearchTerm("");
              setStatusFilter("");
            }}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "requests"
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Loan Requests ({kpis ? kpis.pendingRequests : 0})
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name or reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        {activeTab === "loans" && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="defaulted">Defaulted</option>
          </select>
        )}
      </div>

      {/* Loading and Error States */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      )}

      {error && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{error}</p>
        </div>
      )}

      {/* Loans Table */}
      {!loading && !error && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requester
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentData.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {loan.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {loan.phone}
                        </div>
                        <div className="text-xs text-gray-400 capitalize">
                          {loan.user_type}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {loan.reference}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(loan.principal_amount)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Outstanding: {formatCurrency(loan.amount_outstanding)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(loan.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(loan.due_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewDetails(loan)}
                          className="text-emerald-600 hover:text-emerald-900 p-1"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {loan.status === "requested" && (
                          <button
                            onClick={() => handleApprove(loan)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Approve"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        {loan.status === "approved" && (
                          <button
                            onClick={() => handleActivateLoan(loan)}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Activate Loan"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty state */}
          {currentData.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {activeTab === "loans"
                  ? "No loans found"
                  : "No loan requests found"}
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing page {currentPage} of {totalPages} ({total} total)
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
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
