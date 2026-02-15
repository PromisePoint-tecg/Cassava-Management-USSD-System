import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Eye,
  Download,
  CheckCircle2,
  Clock,
  AlertTriangle,
  DollarSign,
  X,
  Play,
  CalendarDays,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  loansApi,
  AdminLoanResponse,
  PickupRequest,
  LoanKPIs,
  GetLoansQuery,
  ApproveLoanData,
  ApprovePickupRequestData,
  CreateLoanData,
  LoanType,
  CreateLoanTypeData,
  ProcessPickupToPurchaseData,
  RecordLoanDeliveryData,
} from "../services/loans";
import { farmersApi, Farmer } from "../services/farmers";
import { staffApi, Staff } from "../services/staff";
import { SuccessModal } from "./SuccessModal";
import { LeafInlineLoader } from "./Loader";

interface LoansViewProps {}

type TabType = "loans" | "requests" | "deliveries" | "pickups";
type BorrowerType = "farmer" | "staff";

const LOAN_CATEGORY_OPTIONS = [
  {
    value: "input_credit",
    label: "Input Credit",
    description: "Seeds, stems, fertilizer, and input support",
  },
  {
    value: "farm_tools",
    label: "Farm Tools",
    description: "Tools and light farm equipment",
  },
  {
    value: "equipment",
    label: "Equipment",
    description: "Heavy equipment and machinery",
  },
  {
    value: "personal_loan",
    label: "Personal Loan",
    description: "General-purpose personal financing",
  },
  {
    value: "emergency_loan",
    label: "Emergency Loan",
    description: "Urgent short-term financing",
  },
];

const DURATION_PRESETS = [3, 6, 9, 12, 24];

const getDefaultCreateLoanTypeForm = (): CreateLoanTypeData => ({
  name: "",
  description: "",
  user_type: "farmer",
  category: "input_credit",
  interest_rate: 10,
  duration_months: 6,
});

export const LoansView: React.FC<LoansViewProps> = () => {
  // State management
  const [activeTab, setActiveTab] = useState<TabType>("loans");
  const [kpis, setKpis] = useState<LoanKPIs | null>(null);
  const [loans, setLoans] = useState<AdminLoanResponse[]>([]);
  const [loanRequests, setLoanRequests] = useState<AdminLoanResponse[]>([]);
  const [loanDeliveries, setLoanDeliveries] = useState<AdminLoanResponse[]>([]);
  const [pickupRequests, setPickupRequests] = useState<PickupRequest[]>([]);
  const [loanTypes, setLoanTypes] = useState<LoanType[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
  const [loadingLoanTypes, setLoadingLoanTypes] = useState(false);
  const [loadingFarmers, setLoadingFarmers] = useState(false);
  const [loadingStaffMembers, setLoadingStaffMembers] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createLoanError, setCreateLoanError] = useState<string | null>(null);

  // Modal states
  const [selectedLoan, setSelectedLoan] = useState<AdminLoanResponse | null>(
    null
  );
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [isPickupApprovalModalOpen, setIsPickupApprovalModalOpen] =
    useState(false);
  const [isPickupProcessModalOpen, setIsPickupProcessModalOpen] =
    useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreateLoanTypeModalOpen, setIsCreateLoanTypeModalOpen] =
    useState(false);
  const [createLoanTypeLoading, setCreateLoanTypeLoading] = useState(false);
  const [createLoanTypeError, setCreateLoanTypeError] = useState<string | null>(
    null
  );
  const [createLoanTypeForm, setCreateLoanTypeForm] =
    useState<CreateLoanTypeData>(getDefaultCreateLoanTypeForm());
  const [loanData, setLoanData] = useState<CreateLoanData>({
    user_type: "farmer",
    farmer_id: "",
    staff_id: "",
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
  const [selectedPickup, setSelectedPickup] = useState<PickupRequest | null>(
    null
  );
  const [deliveryData, setDeliveryData] = useState<RecordLoanDeliveryData>({
    items: [{ name: "", quantity: 1, unit_price: 0, total_price: 0 }],
    delivery_notes: "",
  });
  const [pickupApprovalData, setPickupApprovalData] =
    useState<ApprovePickupRequestData>({
      scheduled_date: "",
      approved_notes: "",
    });
  const [pickupProcessData, setPickupProcessData] =
    useState<ProcessPickupToPurchaseData>({
      weightKg: 0,
      pricePerKg: 0,
      location: "",
      notes: "",
    });

  // Filters and pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [borrowerTypeFilter, setBorrowerTypeFilter] = useState<
    "all" | BorrowerType
  >("all");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Load initial data
  useEffect(() => {
    const initialLoad = async () => {
      await Promise.all([
        loadKPIs(),
        loadActiveTabData(activeTab),
        loadLoanTypes(),
      ]);
      setIsInitialLoad(false);
    };
    initialLoad();
  }, []);

  // Load data when filters change
  useEffect(() => {
    if (!isInitialLoad) {
      loadActiveTabData(activeTab);
    }
  }, [
    activeTab,
    searchTerm,
    statusFilter,
    borrowerTypeFilter,
    startDateFilter,
    endDateFilter,
    currentPage,
    isInitialLoad,
  ]);

  const loadActiveTabData = async (tab: TabType) => {
    if (tab === "loans") {
      await loadLoans();
      return;
    }
    if (tab === "requests") {
      await loadLoanRequests();
      return;
    }
    if (tab === "deliveries") {
      await loadLoanDeliveries();
      return;
    }
    await loadPickupRequests();
  };

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
      setError(null);
      if (startDateFilter && endDateFilter && startDateFilter > endDateFilter) {
        setError("Start date cannot be after end date.");
        return;
      }
      const query: GetLoansQuery = {
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
        status: (statusFilter as any) || undefined,
        user_type:
          borrowerTypeFilter === "all" ? undefined : borrowerTypeFilter,
        startDate: startDateFilter || undefined,
        endDate: endDateFilter || undefined,
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
      setError(null);
      if (startDateFilter && endDateFilter && startDateFilter > endDateFilter) {
        setError("Start date cannot be after end date.");
        return;
      }
      const query: GetLoansQuery = {
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
        status: (statusFilter as any) || undefined,
        user_type:
          borrowerTypeFilter === "all" ? undefined : borrowerTypeFilter,
        startDate: startDateFilter || undefined,
        endDate: endDateFilter || undefined,
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

  const loadLoanDeliveries = async () => {
    try {
      if (isInitialLoad) setLoading(true);
      setError(null);
      if (startDateFilter && endDateFilter && startDateFilter > endDateFilter) {
        setError("Start date cannot be after end date.");
        return;
      }
      const data = await loansApi.getLoanDeliveries({
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
        status: (statusFilter as any) || undefined,
        startDate: startDateFilter || undefined,
        endDate: endDateFilter || undefined,
      });
      setLoanDeliveries(data.loans);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      console.error("Failed to load loan deliveries:", err);
      setError("Failed to load loan deliveries");
    } finally {
      if (isInitialLoad) setLoading(false);
    }
  };

  const loadPickupRequests = async () => {
    try {
      if (isInitialLoad) setLoading(true);
      setError(null);
      if (startDateFilter && endDateFilter && startDateFilter > endDateFilter) {
        setError("Start date cannot be after end date.");
        return;
      }
      const data = await loansApi.getPickupRequests({
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
        status: (statusFilter as any) || undefined,
        startDate: startDateFilter || undefined,
        endDate: endDateFilter || undefined,
      });
      setPickupRequests(data.pickups);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      console.error("Failed to load pickup requests:", err);
      setError("Failed to load pickup requests");
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

  const loadStaffMembers = async () => {
    try {
      setLoadingStaffMembers(true);
      const result = await staffApi.getAllStaff({
        page: 1,
        limit: 100,
        status: "active",
        is_approved: true,
      });
      setStaffMembers(result.staff || []);
    } catch (err) {
      console.error("Failed to load staff members:", err);
    } finally {
      setLoadingStaffMembers(false);
    }
  };

  const handleCreateLoanType = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoanTypeError(null);

    const name = createLoanTypeForm.name.trim();
    const description = createLoanTypeForm.description.trim();
    const durationMonths = Number(createLoanTypeForm.duration_months);
    const interestRate = Number(createLoanTypeForm.interest_rate);

    if (!name) {
      setCreateLoanTypeError("Loan type name is required.");
      return;
    }
    if (!createLoanTypeForm.category) {
      setCreateLoanTypeError("Please select a loan category.");
      return;
    }
    if (!Number.isFinite(interestRate) || interestRate < 0 || interestRate > 30) {
      setCreateLoanTypeError("Interest rate must be between 0 and 30%.");
      return;
    }
    if (
      !Number.isFinite(durationMonths) ||
      !Number.isInteger(durationMonths) ||
      durationMonths < 1 ||
      durationMonths > 60
    ) {
      setCreateLoanTypeError(
        "Duration must be a whole number between 1 and 60 months."
      );
      return;
    }

    const payload: CreateLoanTypeData = {
      ...createLoanTypeForm,
      name,
      description,
      interest_rate: interestRate,
      duration_months: durationMonths,
    };

    if (
      payload.user_type === "staff" &&
      payload.min_amount !== undefined &&
      payload.max_amount !== undefined &&
      payload.min_amount > payload.max_amount
    ) {
      setCreateLoanTypeError("Min amount cannot be greater than max amount.");
      return;
    }

    try {
      setCreateLoanTypeLoading(true);
      setCreateLoanTypeError(null);

      await loansApi.createLoanType(payload);

      setIsCreateLoanTypeModalOpen(false);
      setCreateLoanTypeError(null);
      setCreateLoanTypeForm(getDefaultCreateLoanTypeForm());

      setSuccessMessage("Loan type created successfully!");
      setIsSuccessModalOpen(true);
      loadLoanTypes();
    } catch (err: any) {
      setCreateLoanTypeError(err.message || "Failed to create loan type");
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

  const handleOpenDeliveryModal = (loan: AdminLoanResponse) => {
    setSelectedLoan(loan);
    setDeliveryData({
      items:
        loan.items?.length > 0
          ? loan.items.map((item) => ({
              ...item,
              unit_price: Math.round(item.unit_price * 100),
              total_price: Math.round(item.total_price * 100),
            }))
          : [{ name: "", quantity: 1, unit_price: 0, total_price: 0 }],
      delivery_notes: loan.delivery_notes || "",
    });
    setIsDeliveryModalOpen(true);
  };

  const handleSubmitDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;

    const validItems = (deliveryData.items || []).filter(
      (item) => item.name.trim() && item.quantity > 0
    );
    if (validItems.length === 0) {
      setError("Add at least one delivered item.");
      return;
    }

    try {
      const payload: RecordLoanDeliveryData = {
        ...deliveryData,
        items: validItems.map((item) => ({
          ...item,
          unit_price: Number(item.unit_price),
          total_price: Number(item.total_price) || Number(item.quantity) * Number(item.unit_price),
        })),
      };

      await loansApi.recordLoanDelivery(selectedLoan.id, payload);
      setIsDeliveryModalOpen(false);
      setSelectedLoan(null);
      setSuccessMessage("Loan delivery recorded successfully.");
      setIsSuccessModalOpen(true);
      await loadLoanDeliveries();
      await loadLoans();
      await loadLoanRequests();
    } catch (err: any) {
      setError(err?.message || "Failed to record loan delivery.");
    }
  };

  const handleOpenPickupApproval = (pickup: PickupRequest) => {
    setSelectedPickup(pickup);
    setPickupApprovalData({
      scheduled_date: pickup.scheduled_date
        ? new Date(pickup.scheduled_date).toISOString().slice(0, 16)
        : "",
      approved_notes: pickup.approved_notes || "",
    });
    setIsPickupApprovalModalOpen(true);
  };

  const handleSubmitPickupApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPickup) return;
    try {
      await loansApi.approvePickupRequest(selectedPickup.id, pickupApprovalData);
      setIsPickupApprovalModalOpen(false);
      setSelectedPickup(null);
      setSuccessMessage("Pickup request approved successfully.");
      setIsSuccessModalOpen(true);
      await loadPickupRequests();
    } catch (err: any) {
      setError(err?.message || "Failed to approve pickup request.");
    }
  };

  const handleOpenPickupProcess = (pickup: PickupRequest) => {
    setSelectedPickup(pickup);
    setPickupProcessData({
      weightKg: pickup.proposed_weight_kg || 0,
      pricePerKg: pickup.proposed_price_per_kg || 0,
      location: "",
      notes: "",
    });
    setIsPickupProcessModalOpen(true);
  };

  const handleSubmitPickupProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPickup) return;
    try {
      await loansApi.processPickupToPurchase(selectedPickup.id, pickupProcessData);
      setIsPickupProcessModalOpen(false);
      setSelectedPickup(null);
      setSuccessMessage("Pickup processed and purchase created successfully.");
      setIsSuccessModalOpen(true);
      await loadPickupRequests();
    } catch (err: any) {
      setError(err?.message || "Failed to process pickup.");
    }
  };

  const handleCreateNewLoan = () => {
    setSelectedLoan(null); // Clear any selected loan
    setCreateLoanError(null);
    setLoanData({
      user_type: "farmer",
      farmer_id: "",
      staff_id: "",
      loan_type_id: "",
      principal_amount: 0,
      items: [{ name: "", quantity: 1, unit_price: 0, total_price: 0 }],
      purpose: "",
      due_date: "",
      monthly_payment: 0,
      notes: "",
    });
    setShowCreateModal(true);
    // Load borrower options and loan types when opening modal
    loadFarmers();
    loadStaffMembers();
    loadLoanTypes();
  };

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoanError(null);

    if (!loanData.principal_amount || !loanData.loan_type_id || !loanData.due_date) {
      setCreateLoanError("Loan type, principal amount and due date are required.");
      return;
    }

    if (loanData.user_type === "farmer" && !loanData.farmer_id) {
      setCreateLoanError("Please select a farmer.");
      return;
    }

    if (loanData.user_type === "staff" && !loanData.staff_id) {
      setCreateLoanError("Please select a staff member.");
      return;
    }

    if (loanData.user_type === "farmer" && (!loanData.items || loanData.items.length === 0)) {
      setCreateLoanError("Add at least one input item for farmer loans.");
      return;
    }

    if (
      selectedLoanType &&
      selectedLoanType.user_type !== loanData.user_type
    ) {
      setCreateLoanError(
        `Selected loan type is for ${selectedLoanType.user_type} only.`
      );
      return;
    }

    const principalAmountInKobo = Math.round(loanData.principal_amount * 100);
    if (
      selectedLoanType?.min_amount &&
      principalAmountInKobo < selectedLoanType.min_amount
    ) {
      setCreateLoanError(
        `Minimum amount for ${selectedLoanType.name} is ${formatCurrency(
          selectedLoanType.min_amount / 100
        )}.`
      );
      return;
    }
    if (
      selectedLoanType?.max_amount &&
      principalAmountInKobo > selectedLoanType.max_amount
    ) {
      setCreateLoanError(
        `Maximum amount for ${selectedLoanType.name} is ${formatCurrency(
          selectedLoanType.max_amount / 100
        )}.`
      );
      return;
    }

    try {
      // Convert amounts from naira to kobo for API
      const normalizedItems =
        loanData.user_type === "farmer"
          ? (loanData.items || [])
              .filter((item) => item.name.trim() !== "")
              .map((item) => ({
                ...item,
                unit_price: Math.round(item.unit_price * 100),
                total_price: Math.round(item.total_price * 100),
              }))
          : undefined;

      const loanDataInKobo = {
        ...loanData,
        principal_amount: principalAmountInKobo, // Convert to kobo
        monthly_payment: loanData.monthly_payment
          ? Math.round(loanData.monthly_payment * 100)
          : undefined,
        farmer_id: loanData.user_type === "farmer" ? loanData.farmer_id : undefined,
        staff_id: loanData.user_type === "staff" ? loanData.staff_id : undefined,
        items: normalizedItems,
      };

      await loansApi.createLoan(loanDataInKobo);
      setShowCreateModal(false);
      setSelectedLoan(null);
      setCreateLoanError(null);
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
      setCreateLoanError(`Failed to create loan: ${errorMessage}`);
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

    if (
      loan.user_type === "farmer" &&
      (loan.delivery_status || "pending") !== "delivered"
    ) {
      alert(
        "Cannot activate this farmer loan yet. Record delivery details first."
      );
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

  const getDeliveryBadge = (status?: string) => {
    const normalized = status || "pending";
    const config =
      normalized === "delivered"
        ? { bg: "bg-emerald-100", text: "text-emerald-800", label: "Delivered" }
        : { bg: "bg-amber-100", text: "text-amber-800", label: "Pending Delivery" };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text} inline-flex`}
      >
        {config.label}
      </span>
    );
  };

  const getPickupStatusBadge = (status: PickupRequest["status"]) => {
    const map: Record<
      PickupRequest["status"],
      { bg: string; text: string; label: string }
    > = {
      requested: { bg: "bg-gray-100", text: "text-gray-800", label: "Requested" },
      approved: { bg: "bg-blue-100", text: "text-blue-800", label: "Approved" },
      staff_updated: {
        bg: "bg-indigo-100",
        text: "text-indigo-800",
        label: "Staff Updated",
      },
      processed: { bg: "bg-emerald-100", text: "text-emerald-800", label: "Processed" },
      cancelled: { bg: "bg-red-100", text: "text-red-800", label: "Cancelled" },
    };
    const config = map[status];
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}
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

  const formatDateTime = (date: Date | string) => {
    return new Date(date).toLocaleString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const getLogoDataUrl = async (): Promise<string> => {
    try {
      const response = await fetch("/logo.png");
      if (!response.ok) return "";
      const blob = await response.blob();
      return await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string) || "");
        reader.onerror = () => resolve("");
        reader.readAsDataURL(blob);
      });
    } catch {
      return "";
    }
  };

  const buildLoanQuery = (page = currentPage, limit = 10): GetLoansQuery => ({
    page,
    limit,
    search: searchTerm || undefined,
    status: (statusFilter as any) || undefined,
    user_type: borrowerTypeFilter === "all" ? undefined : borrowerTypeFilter,
    startDate: startDateFilter || undefined,
    endDate: endDateFilter || undefined,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const exportLoanListToPdf = async () => {
    try {
      const logoDataUrl = await getLogoDataUrl();

      let tableRows = "";
      let tableHeader = "";

      if (activeTab === "pickups") {
        const response = await loansApi.getPickupRequests({
          page: 1,
          limit: 500,
          search: searchTerm || undefined,
          status: (statusFilter as any) || undefined,
          startDate: startDateFilter || undefined,
          endDate: endDateFilter || undefined,
        });
        tableHeader = `
          <th>Farmer</th>
          <th>Phone</th>
          <th>Status</th>
          <th>Schedule</th>
          <th>Proposed</th>
          <th>Created</th>
        `;
        tableRows = response.pickups
          .map(
            (pickup) => `
            <tr>
              <td>${escapeHtml(pickup.farmer_name)}</td>
              <td>${escapeHtml(pickup.farmer_phone)}</td>
              <td>${escapeHtml(pickup.status.toUpperCase())}</td>
              <td>${pickup.scheduled_date ? formatDate(pickup.scheduled_date) : "N/A"}</td>
              <td>${
                pickup.proposed_weight_kg
                  ? `${pickup.proposed_weight_kg}kg @ ₦${(
                      pickup.proposed_price_per_kg || 0
                    ).toLocaleString()}`
                  : "N/A"
              }</td>
              <td>${formatDate(pickup.createdAt)}</td>
            </tr>
          `
          )
          .join("");
      } else {
        const query = buildLoanQuery(1, 500);
        const response =
          activeTab === "loans"
            ? await loansApi.getAllLoans(query)
            : activeTab === "requests"
            ? await loansApi.getLoanRequests(query)
            : await loansApi.getLoanDeliveries(query);
        const rows =
          activeTab === "loans"
            ? (response as any).loans
            : activeTab === "requests"
            ? (response as any).loanRequests
            : (response as any).loans;

        tableHeader = `
          <th>Reference</th>
          <th>Name</th>
          <th>Type</th>
          <th>Principal</th>
          <th>Outstanding</th>
          <th>Status</th>
          <th>Due Date</th>
          <th>Created</th>
        `;

        tableRows = rows
          .map(
            (loan: AdminLoanResponse) => `
              <tr>
                <td>${escapeHtml(loan.reference)}</td>
                <td>${escapeHtml(loan.name)}</td>
                <td>${loan.user_type.toUpperCase()}</td>
                <td>${formatCurrency(loan.principal_amount)}</td>
                <td>${formatCurrency(loan.amount_outstanding)}</td>
                <td>${escapeHtml(
                  activeTab === "deliveries"
                    ? `${loan.status.toUpperCase()} / ${(loan.delivery_status || "pending").toUpperCase()}`
                    : loan.status.toUpperCase()
                )}</td>
                <td>${formatDate(loan.due_date)}</td>
                <td>${formatDate(loan.createdAt)}</td>
              </tr>
            `
          )
          .join("");
      }

      const printWindow = window.open("", "_blank", "width=1200,height=900");
      if (!printWindow) {
        setError("Popup blocked. Enable popups to export PDF.");
        return;
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>Loan Records Export</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; color: #1f2937; }
              h1 { color: #066f48; margin: 0 0 8px 0; }
              .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #066f48; margin-bottom: 14px; padding-bottom: 10px; }
              .brand { display: flex; align-items: center; gap: 10px; }
              .brand img { width: 44px; height: 44px; object-fit: contain; }
              .brand-title { color: #066f48; font-weight: 700; font-size: 18px; }
              .meta { color: #4b5563; margin-bottom: 16px; font-size: 13px; }
              table { width: 100%; border-collapse: collapse; font-size: 12px; }
              th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
              th { background: #ecfdf5; color: #065f46; }
              tr:nth-child(even) { background: #f9fafb; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="brand">
                ${
                  logoDataUrl
                    ? `<img src="${logoDataUrl}" alt="Promise Point Logo" />`
                    : ""
                }
                <div>
                  <div class="brand-title">Promise Point Agrictech</div>
                  <div>Loan Operations Report</div>
                </div>
              </div>
              <div>${new Date().toLocaleString("en-NG")}</div>
            </div>
            <p class="meta">
              Tab: ${
                activeTab === "loans"
                  ? "All Loans"
                  : activeTab === "requests"
                  ? "Loan Requests"
                  : activeTab === "deliveries"
                  ? "Deliveries"
                  : "Pickups"
              } |
              Date Filter: ${startDateFilter || "N/A"} to ${endDateFilter || "N/A"} |
              Generated: ${new Date().toLocaleString("en-NG")}
            </p>
            <table>
              <thead>
                <tr>
                  ${tableHeader}
                </tr>
              </thead>
              <tbody>
                ${
                  tableRows ||
                  `<tr><td colspan="${
                    activeTab === "pickups" ? 6 : 8
                  }">No records found.</td></tr>`
                }
              </tbody>
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    } catch (err: any) {
      setError(err?.message || "Failed to export loan records");
    }
  };

  const exportLoanDetailsToPdf = async (loan: AdminLoanResponse) => {
    const logoDataUrl = await getLogoDataUrl();
    const printWindow = window.open("", "_blank", "width=1000,height=900");
    if (!printWindow) {
      setError("Popup blocked. Enable popups to export PDF.");
      return;
    }

    const itemRows =
      loan.items?.length > 0
        ? loan.items
            .map(
              (item) => `
                <tr>
                  <td>${escapeHtml(item.name)}</td>
                  <td>${item.quantity}</td>
                  <td>${formatCurrency(item.unit_price)}</td>
                  <td>${formatCurrency(item.total_price)}</td>
                </tr>
              `
            )
            .join("")
        : `<tr><td colspan="4">No loan items recorded</td></tr>`;

    printWindow.document.write(`
      <html>
        <head>
          <title>Loan Details - ${escapeHtml(loan.reference)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #1f2937; }
            h1 { color: #066f48; margin: 0 0 8px 0; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #066f48; margin-bottom: 14px; padding-bottom: 10px; }
            .brand { display: flex; align-items: center; gap: 10px; }
            .brand img { width: 44px; height: 44px; object-fit: contain; }
            .grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 10px; margin: 16px 0; }
            .card { border: 1px solid #d1d5db; border-radius: 10px; padding: 12px; }
            .label { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
            .value { font-size: 14px; font-weight: 600; color: #111827; }
            table { width: 100%; border-collapse: collapse; margin-top: 14px; }
            th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; font-size: 12px; }
            th { background: #ecfdf5; color: #065f46; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">
              ${
                logoDataUrl ? `<img src="${logoDataUrl}" alt="Promise Point Logo" />` : ""
              }
              <div>
                <h1>Loan Details</h1>
                <div>Promise Point Agrictech</div>
              </div>
            </div>
            <div>${new Date().toLocaleString("en-NG")}</div>
          </div>
          <div class="grid">
            <div class="card"><div class="label">Reference</div><div class="value">${escapeHtml(loan.reference)}</div></div>
            <div class="card"><div class="label">Borrower</div><div class="value">${escapeHtml(loan.name)} (${loan.user_type.toUpperCase()})</div></div>
            <div class="card"><div class="label">Phone</div><div class="value">${escapeHtml(loan.phone)}</div></div>
            <div class="card"><div class="label">Loan Type</div><div class="value">${escapeHtml(loan.loan_type_name)}</div></div>
            <div class="card"><div class="label">Principal</div><div class="value">${formatCurrency(loan.principal_amount)}</div></div>
            <div class="card"><div class="label">Outstanding</div><div class="value">${formatCurrency(loan.amount_outstanding)}</div></div>
            <div class="card"><div class="label">Status</div><div class="value">${escapeHtml(loan.status.toUpperCase())}</div></div>
            <div class="card"><div class="label">Delivery</div><div class="value">${escapeHtml((loan.delivery_status || "pending").toUpperCase())}</div></div>
            <div class="card"><div class="label">Due Date</div><div class="value">${formatDate(loan.due_date)}</div></div>
          </div>
          <div class="card">
            <div class="label">Purpose</div>
            <div class="value">${escapeHtml(loan.purpose || "N/A")}</div>
          </div>
          <h3 style="margin-top: 18px; color: #065f46;">Loan Items</h3>
          <table>
            <thead>
              <tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>
          <p style="margin-top: 16px; font-size: 12px; color: #6b7280;">
            Generated: ${new Date().toLocaleString("en-NG")}
          </p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const currentData =
    activeTab === "loans"
      ? loans
      : activeTab === "requests"
      ? loanRequests
      : activeTab === "deliveries"
      ? loanDeliveries
      : [];
  const filteredLoanTypes = loanTypes.filter(
    (loanType) => loanType.user_type === loanData.user_type
  );
  const selectedLoanType =
    filteredLoanTypes.find((loanType) => loanType.id === loanData.loan_type_id) ||
    null;
  const isLoanTab = activeTab === "loans" || activeTab === "requests";
  const statusOptions =
    activeTab === "pickups"
      ? [
          { value: "", label: "All Statuses" },
          { value: "requested", label: "Requested" },
          { value: "approved", label: "Approved" },
          { value: "staff_updated", label: "Staff Updated" },
          { value: "processed", label: "Processed" },
          { value: "cancelled", label: "Cancelled" },
        ]
      : activeTab === "deliveries"
      ? [
          { value: "", label: "All Delivery States" },
          { value: "approved", label: "Pending Delivery" },
          { value: "active", label: "Delivered" },
        ]
      : [
          { value: "", label: "All Statuses" },
          { value: "requested", label: "Requested" },
          { value: "approved", label: "Approved" },
          { value: "active", label: "Active" },
          { value: "completed", label: "Completed" },
          { value: "defaulted", label: "Defaulted" },
        ];

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
              onClick={exportLoanListToPdf}
              className="flex items-center justify-center px-4 sm:px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm sm:text-base"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Export PDF
            </button>
            {isLoanTab && (
              <button
                onClick={() => {
                  setCreateLoanTypeError(null);
                  setCreateLoanTypeForm(getDefaultCreateLoanTypeForm());
                  setIsCreateLoanTypeModalOpen(true);
                }}
                className="flex items-center justify-center px-4 sm:px-5 py-2.5 bg-[#066f48] text-white rounded-lg hover:bg-[#055b3d] transition-all text-sm sm:text-base"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Create Loan Type
              </button>
            )}
            {isLoanTab && (
              <button
                onClick={() => handleCreateNewLoan()}
                className="flex items-center justify-center px-4 sm:px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all text-sm sm:text-base"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Issue New Loan
              </button>
            )}
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
              iconWrapperClass: "bg-green-100 border border-green-200",
              iconClass: "text-green-700",
            },
            {
              title: "Active Loans",
              value: kpis.activeLoans,
              icon: CheckCircle2,
              iconWrapperClass: "bg-emerald-100 border border-emerald-200",
              iconClass: "text-emerald-700",
            },
            {
              title: "Pending Requests",
              value: kpis.pendingRequests,
              icon: Clock,
              iconWrapperClass: "bg-green-100 border border-green-200",
              iconClass: "text-green-700",
            },
            {
              title: "Default Rate",
              value: `${kpis.defaultRate.toFixed(1)}%`,
              icon: AlertTriangle,
              iconWrapperClass: "bg-gray-100 border border-gray-200",
              iconClass: "text-gray-700",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 hover:shadow-md transition-all relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-[#066f48] to-emerald-500" />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-500 text-xs sm:text-sm font-medium tracking-wide uppercase">
                    {item.title}
                  </h3>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
                    {item.value}
                  </p>
                </div>
                <div
                  className={`p-3 sm:p-3.5 rounded-2xl ${item.iconWrapperClass}`}
                >
                  <item.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${item.iconClass}`} />
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
            }}
            className={`py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg font-medium transition-all whitespace-nowrap text-sm sm:text-base ${
              activeTab === "requests"
                ? "bg-emerald-50 text-emerald-700"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Loan Requests
          </button>
          <button
            onClick={() => {
              setActiveTab("deliveries");
              setCurrentPage(1);
            }}
            className={`py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg font-medium transition-all whitespace-nowrap text-sm sm:text-base ${
              activeTab === "deliveries"
                ? "bg-emerald-50 text-emerald-700"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Deliveries
          </button>
          <button
            onClick={() => {
              setActiveTab("pickups");
              setCurrentPage(1);
            }}
            className={`py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg font-medium transition-all whitespace-nowrap text-sm sm:text-base ${
              activeTab === "pickups"
                ? "bg-emerald-50 text-emerald-700"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Pickups
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
          {isLoanTab ? (
            <div className="relative lg:col-span-4">
              <Users className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4 sm:w-5 sm:h-5" />
              <select
                value={borrowerTypeFilter}
                onChange={(e) => {
                  setBorrowerTypeFilter(e.target.value as "all" | BorrowerType);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 sm:pl-12 pr-4 sm:pr-5 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#066f48] focus:border-[#066f48] focus:outline-none transition-all text-gray-800 text-sm sm:text-base"
              >
                <option value="all">All Borrowers</option>
                <option value="farmer">Farmers</option>
                <option value="staff">Staff</option>
              </select>
            </div>
          ) : (
            <div className="lg:col-span-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 flex items-center">
              {activeTab === "deliveries"
                ? "Farmer deliveries are tied to approved loans."
                : "Pickup requests from USSD and operations queue."}
            </div>
          )}

          <div className="relative lg:col-span-4">
            <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Search by name or reference..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 sm:pl-12 pr-4 sm:pr-5 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#066f48] focus:border-[#066f48] focus:outline-none transition-all text-gray-800 placeholder-gray-500 text-sm sm:text-base"
            />
          </div>

          <div className="relative lg:col-span-2">
            <CalendarDays className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => {
                setStartDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 sm:pl-12 pr-3 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#066f48] focus:border-[#066f48] focus:outline-none transition-all text-gray-800 text-sm sm:text-base"
            />
          </div>

          <div className="relative lg:col-span-2">
            <CalendarDays className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="date"
              value={endDateFilter}
              min={startDateFilter || undefined}
              onChange={(e) => {
                setEndDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 sm:pl-12 pr-3 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#066f48] focus:border-[#066f48] focus:outline-none transition-all text-gray-800 text-sm sm:text-base"
            />
          </div>

          <div className="lg:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 sm:px-5 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#066f48] focus:border-[#066f48] focus:outline-none transition-all text-gray-800 text-sm sm:text-base"
            >
              {statusOptions.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("");
              setBorrowerTypeFilter("all");
              setStartDateFilter("");
              setEndDateFilter("");
              setCurrentPage(1);
            }}
            className="text-sm text-[#066f48] hover:text-[#055b3d] font-medium"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <LeafInlineLoader />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">{error}</div>
        ) : (
          <>
            {activeTab === "pickups" ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Farmer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Schedule
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Proposed Purchase
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pickupRequests.map((pickup) => (
                      <tr key={pickup.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{pickup.farmer_name}</p>
                          <p className="text-sm text-gray-600">{pickup.farmer_phone}</p>
                        </td>
                        <td className="px-6 py-4">{getPickupStatusBadge(pickup.status)}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {pickup.scheduled_date
                            ? formatDateTime(pickup.scheduled_date)
                            : "Not scheduled"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {pickup.proposed_weight_kg
                            ? `${pickup.proposed_weight_kg}kg @ ₦${(
                                pickup.proposed_price_per_kg || 0
                              ).toLocaleString()}`
                            : "Awaiting staff update"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            {(pickup.status === "requested" ||
                              pickup.status === "staff_updated") && (
                              <button
                                onClick={() => handleOpenPickupApproval(pickup)}
                                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50"
                              >
                                Approve
                              </button>
                            )}
                            {(pickup.status === "approved" ||
                              pickup.status === "staff_updated") && (
                              <button
                                onClick={() => handleOpenPickupProcess(pickup)}
                                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                              >
                                Process to Purchase
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {pickupRequests.length === 0 && (
                  <div className="py-16 text-center text-gray-500">
                    No pickup requests found.
                  </div>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
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
                      <tr key={loan.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-8 py-5 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{loan.name}</div>
                            <div className="text-sm text-gray-600">{loan.phone}</div>
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
                              Outstanding: {formatCurrency(loan.amount_outstanding)}
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            {getStatusBadge(loan.status)}
                            {activeTab === "deliveries" &&
                              getDeliveryBadge(loan.delivery_status)}
                          </div>
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

                            {activeTab === "deliveries" &&
                              (loan.delivery_status || "pending") !== "delivered" && (
                                <button
                                  onClick={() => handleOpenDeliveryModal(loan)}
                                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50"
                                >
                                  Record Delivery
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
                {currentData.length === 0 && (
                  <div className="py-16 text-center text-gray-500">
                    {activeTab === "loans"
                      ? "No loans found"
                      : activeTab === "requests"
                      ? "No loan requests found"
                      : "No delivery records found"}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full">
            <p className="text-sm text-gray-600">Page {currentPage} of {totalPages}</p>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="w-full sm:w-auto px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all text-gray-700"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="w-full sm:w-auto px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all text-gray-700"
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
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Loan Details</h3>
                  <p className="text-sm text-gray-500">
                    {selectedLoan.reference} • {selectedLoan.user_type.toUpperCase()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportLoanDetailsToPdf(selectedLoan)}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Download className="w-4 h-4" />
                    Export PDF
                  </button>
                  <button
                    onClick={() => setIsDetailsModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Principal</p>
                  <p className="mt-1 text-xl font-bold text-gray-900">
                    {formatCurrency(selectedLoan.principal_amount)}
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs text-emerald-700 uppercase tracking-wide">Amount Paid</p>
                  <p className="mt-1 text-xl font-bold text-emerald-700">
                    {formatCurrency(selectedLoan.amount_paid)}
                  </p>
                </div>
                <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                  <p className="text-xs text-orange-700 uppercase tracking-wide">Outstanding</p>
                  <p className="mt-1 text-xl font-bold text-orange-700">
                    {formatCurrency(selectedLoan.amount_outstanding)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-gray-200 p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-gray-800">Borrower Information</h4>
                  <div>
                    <p className="text-xs text-gray-500">Name</p>
                    <p className="font-medium text-gray-900">{selectedLoan.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="font-medium text-gray-900">{selectedLoan.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Borrower Type</p>
                    <p className="font-medium text-gray-900 capitalize">{selectedLoan.user_type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <div className="mt-1">{getStatusBadge(selectedLoan.status)}</div>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-gray-800">Loan Terms</h4>
                  <div>
                    <p className="text-xs text-gray-500">Loan Type</p>
                    <p className="font-medium text-gray-900">{selectedLoan.loan_type_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Interest</p>
                    <p className="font-medium text-gray-900">
                      {selectedLoan.interest_rate}% ({formatCurrency(selectedLoan.interest_amount)})
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Repayment</p>
                    <p className="font-medium text-gray-900">{formatCurrency(selectedLoan.total_repayment)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Repayment Tenor</p>
                    <p className="font-medium text-gray-900">
                      {selectedLoan.duration_months} months • {formatCurrency(selectedLoan.monthly_payment)} / month
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Due Date</p>
                    <p className="font-medium text-gray-900">{formatDate(selectedLoan.due_date)}</p>
                  </div>
                </div>
              </div>

              {(selectedLoan.pickup_date || selectedLoan.pickup_location) && (
                <div className="rounded-xl border border-gray-200 p-4">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">Pickup Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedLoan.pickup_date && (
                      <div>
                        <p className="text-xs text-gray-500">Pickup Date</p>
                        <p className="font-medium text-gray-900">{formatDateTime(selectedLoan.pickup_date)}</p>
                      </div>
                    )}
                    {selectedLoan.pickup_location && (
                      <div>
                        <p className="text-xs text-gray-500">Pickup Location</p>
                        <p className="font-medium text-gray-900">{selectedLoan.pickup_location}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(selectedLoan.user_type === "farmer" || selectedLoan.delivery_status) && (
                <div className="rounded-xl border border-gray-200 p-4">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">
                    Delivery Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Delivery Status</p>
                      <div className="mt-1">
                        {getDeliveryBadge(selectedLoan.delivery_status)}
                      </div>
                    </div>
                    {selectedLoan.delivery_confirmed_at && (
                      <div>
                        <p className="text-xs text-gray-500">Confirmed At</p>
                        <p className="font-medium text-gray-900">
                          {formatDateTime(selectedLoan.delivery_confirmed_at)}
                        </p>
                      </div>
                    )}
                    {selectedLoan.delivered_by_staff_name && (
                      <div>
                        <p className="text-xs text-gray-500">Delivered By</p>
                        <p className="font-medium text-gray-900">
                          {selectedLoan.delivered_by_staff_name}
                        </p>
                      </div>
                    )}
                    {selectedLoan.delivery_notes && (
                      <div className="md:col-span-2">
                        <p className="text-xs text-gray-500">Delivery Notes</p>
                        <p className="font-medium text-gray-900">
                          {selectedLoan.delivery_notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-gray-200 p-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">Purpose</h4>
                <p className="text-sm text-gray-700">{selectedLoan.purpose || "N/A"}</p>
              </div>

              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-800">Loan Items</h4>
                </div>
                {selectedLoan.items?.length ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="px-4 py-2 text-left">Item</th>
                          <th className="px-4 py-2 text-left">Qty</th>
                          <th className="px-4 py-2 text-left">Unit Price</th>
                          <th className="px-4 py-2 text-left">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedLoan.items.map((item, index) => (
                          <tr key={`${item.name}-${index}`} className="border-t border-gray-100">
                            <td className="px-4 py-2 font-medium text-gray-900">{item.name}</td>
                            <td className="px-4 py-2 text-gray-700">{item.quantity}</td>
                            <td className="px-4 py-2 text-gray-700">{formatCurrency(item.unit_price)}</td>
                            <td className="px-4 py-2 text-gray-700">{formatCurrency(item.total_price)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="px-4 py-4 text-sm text-gray-500">No itemized records.</p>
                )}
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Timeline</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Created</p>
                    <p className="font-medium text-gray-900">{formatDateTime(selectedLoan.createdAt)}</p>
                  </div>
                  {selectedLoan.approved_at && (
                    <div>
                      <p className="text-xs text-gray-500">Approved</p>
                      <p className="font-medium text-gray-900">{formatDateTime(selectedLoan.approved_at)}</p>
                    </div>
                  )}
                  {selectedLoan.disbursed_at && (
                    <div>
                      <p className="text-xs text-gray-500">Disbursed</p>
                      <p className="font-medium text-gray-900">{formatDateTime(selectedLoan.disbursed_at)}</p>
                    </div>
                  )}
                  {selectedLoan.completed_at && (
                    <div>
                      <p className="text-xs text-gray-500">Completed</p>
                      <p className="font-medium text-gray-900">{formatDateTime(selectedLoan.completed_at)}</p>
                    </div>
                  )}
                  {selectedLoan.defaulted_at && (
                    <div>
                      <p className="text-xs text-gray-500">Defaulted</p>
                      <p className="font-medium text-gray-900">{formatDateTime(selectedLoan.defaulted_at)}</p>
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

      {/* Record Delivery Modal */}
      {isDeliveryModalOpen && selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Record Delivery - {selectedLoan.reference}
              </h3>
              <button
                onClick={() => setIsDeliveryModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmitDelivery} className="p-6 space-y-4">
              {(deliveryData.items || []).map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2">
                  <input
                    type="text"
                    value={item.name}
                    placeholder="Item name"
                    onChange={(e) => {
                      const nextItems = [...(deliveryData.items || [])];
                      nextItems[index].name = e.target.value;
                      setDeliveryData({ ...deliveryData, items: nextItems });
                    }}
                    className="md:col-span-4 px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                  <input
                    type="number"
                    value={item.quantity}
                    placeholder="Qty"
                    min="1"
                    onChange={(e) => {
                      const nextItems = [...(deliveryData.items || [])];
                      const quantity = Number(e.target.value) || 1;
                      nextItems[index].quantity = quantity;
                      nextItems[index].total_price = quantity * (nextItems[index].unit_price || 0);
                      setDeliveryData({ ...deliveryData, items: nextItems });
                    }}
                    className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                  <input
                    type="number"
                    value={Math.round((item.unit_price || 0) / 100)}
                    placeholder="Unit Price (₦)"
                    min="0"
                    onChange={(e) => {
                      const nextItems = [...(deliveryData.items || [])];
                      const unitPriceKobo = Math.round((Number(e.target.value) || 0) * 100);
                      nextItems[index].unit_price = unitPriceKobo;
                      nextItems[index].total_price = (nextItems[index].quantity || 0) * unitPriceKobo;
                      setDeliveryData({ ...deliveryData, items: nextItems });
                    }}
                    className="md:col-span-3 px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                  <div className="md:col-span-3 flex items-center justify-between border border-gray-200 rounded-lg px-3">
                    <span className="text-sm text-gray-700">
                      {formatCurrency(Math.round((item.total_price || 0) / 100))}
                    </span>
                    {(deliveryData.items || []).length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setDeliveryData((prev) => ({
                            ...prev,
                            items: (prev.items || []).filter((_, i) => i !== index),
                          }))
                        }
                        className="text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setDeliveryData((prev) => ({
                    ...prev,
                    items: [
                      ...(prev.items || []),
                      { name: "", quantity: 1, unit_price: 0, total_price: 0 },
                    ],
                  }))
                }
                className="text-sm font-medium text-[#066f48] hover:text-[#055b3d]"
              >
                + Add Delivered Item
              </button>

              <textarea
                value={deliveryData.delivery_notes || ""}
                onChange={(e) =>
                  setDeliveryData({ ...deliveryData, delivery_notes: e.target.value })
                }
                placeholder="Delivery notes"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeliveryModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#066f48] text-white rounded-lg hover:bg-[#055b3d]"
                >
                  Save Delivery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pickup Approval Modal */}
      {isPickupApprovalModalOpen && selectedPickup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Approve Pickup Request
              </h3>
              <button
                onClick={() => setIsPickupApprovalModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmitPickupApproval} className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                {selectedPickup.farmer_name} ({selectedPickup.farmer_phone})
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Schedule Date/Time
                </label>
                <input
                  type="datetime-local"
                  value={pickupApprovalData.scheduled_date || ""}
                  onChange={(e) =>
                    setPickupApprovalData({
                      ...pickupApprovalData,
                      scheduled_date: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Approval Notes
                </label>
                <textarea
                  value={pickupApprovalData.approved_notes || ""}
                  onChange={(e) =>
                    setPickupApprovalData({
                      ...pickupApprovalData,
                      approved_notes: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPickupApprovalModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#066f48] text-white rounded-lg"
                >
                  Approve Pickup
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pickup Process Modal */}
      {isPickupProcessModalOpen && selectedPickup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Process Pickup to Purchase
              </h3>
              <button
                onClick={() => setIsPickupProcessModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmitPickupProcess} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weight (kg) *
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  required
                  value={pickupProcessData.weightKg || ""}
                  onChange={(e) =>
                    setPickupProcessData({
                      ...pickupProcessData,
                      weightKg: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price Per Kg (₦) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={pickupProcessData.pricePerKg || ""}
                  onChange={(e) =>
                    setPickupProcessData({
                      ...pickupProcessData,
                      pricePerKg: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={pickupProcessData.location || ""}
                  onChange={(e) =>
                    setPickupProcessData({
                      ...pickupProcessData,
                      location: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={pickupProcessData.notes || ""}
                  onChange={(e) =>
                    setPickupProcessData({
                      ...pickupProcessData,
                      notes: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPickupProcessModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#066f48] text-white rounded-lg"
                >
                  Process Purchase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Loan Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex justify-between items-center gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Issue New Loan</h3>
                  <p className="text-sm text-gray-500">
                    Create loans for both farmers and staff using one flow.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setCreateLoanError(null);
                    setShowCreateModal(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateLoan} className="p-6 space-y-5">
              {createLoanError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {createLoanError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Borrower Type *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["farmer", "staff"] as BorrowerType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() =>
                        setLoanData((prev) => ({
                          ...prev,
                          user_type: type,
                          farmer_id: type === "farmer" ? prev.farmer_id : "",
                          staff_id: type === "staff" ? prev.staff_id : "",
                          loan_type_id: "",
                          items:
                            type === "farmer"
                              ? prev.items && prev.items.length > 0
                                ? prev.items
                                : [{ name: "", quantity: 1, unit_price: 0, total_price: 0 }]
                              : [],
                        }))
                      }
                      className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors capitalize ${
                        loanData.user_type === type
                          ? "border-[#066f48] bg-emerald-50 text-[#066f48]"
                          : "border-gray-300 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {loanData.user_type === "farmer" ? "Farmer" : "Staff"} *
                  </label>
                  {loanData.user_type === "farmer" ? (
                    <select
                      value={loanData.farmer_id}
                      onChange={(e) =>
                        setLoanData({ ...loanData, farmer_id: e.target.value })
                      }
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#066f48] focus:border-[#066f48]"
                      disabled={loadingFarmers}
                      required
                    >
                      <option value="">
                        {loadingFarmers ? "Loading farmers..." : "Select farmer..."}
                      </option>
                      {farmers.map((farmer) => (
                        <option key={farmer.id} value={farmer.id}>
                          {farmer.fullName?.toUpperCase()} ({farmer.phone})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={loanData.staff_id}
                      onChange={(e) =>
                        setLoanData({ ...loanData, staff_id: e.target.value })
                      }
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#066f48] focus:border-[#066f48]"
                      disabled={loadingStaffMembers}
                      required
                    >
                      <option value="">
                        {loadingStaffMembers ? "Loading staff..." : "Select staff..."}
                      </option>
                      {staffMembers.map((staff) => (
                        <option key={staff.id} value={staff.id}>
                          {(staff.fullName || `${staff.firstName} ${staff.lastName}`).toUpperCase()} ({staff.phone})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loan Type *
                  </label>
                  <select
                    value={loanData.loan_type_id}
                    onChange={(e) =>
                      setLoanData({ ...loanData, loan_type_id: e.target.value })
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#066f48] focus:border-[#066f48]"
                    required
                    disabled={loadingLoanTypes}
                  >
                    <option value="">
                      {loadingLoanTypes ? "Loading loan types..." : "Select loan type..."}
                    </option>
                    {filteredLoanTypes.map((loanType) => (
                      <option key={loanType.id} value={loanType.id}>
                        {loanType.name} • {loanType.interest_rate}% • {loanType.duration_months} months
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedLoanType && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                  <p className="font-medium">{selectedLoanType.name}</p>
                  <p className="text-emerald-800">
                    {selectedLoanType.description || "Loan package configuration"}
                  </p>
                  {loanData.user_type === "staff" &&
                    (selectedLoanType.min_amount || selectedLoanType.max_amount) && (
                      <p className="mt-1 text-emerald-800">
                        Amount Range:{" "}
                        {selectedLoanType.min_amount
                          ? formatCurrency(selectedLoanType.min_amount / 100)
                          : "N/A"}{" "}
                        to{" "}
                        {selectedLoanType.max_amount
                          ? formatCurrency(selectedLoanType.max_amount / 100)
                          : "N/A"}
                      </p>
                    )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#066f48] focus:border-[#066f48]"
                    required
                    min="1"
                    step="1"
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
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#066f48] focus:border-[#066f48]"
                    required
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Payment (₦)
                  </label>
                  <input
                    type="number"
                    value={loanData.monthly_payment || ""}
                    onChange={(e) =>
                      setLoanData({
                        ...loanData,
                        monthly_payment: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#066f48] focus:border-[#066f48]"
                    min="0"
                    step="1"
                    placeholder="Auto-calculate if empty"
                  />
                </div>
              </div>

              {loanData.user_type === "farmer" && (
                <div className="rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Input Items *
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setLoanData((prev) => ({
                          ...prev,
                          items: [
                            ...(prev.items || []),
                            { name: "", quantity: 1, unit_price: 0, total_price: 0 },
                          ],
                        }))
                      }
                      className="text-sm font-medium text-[#066f48] hover:text-[#055b3d]"
                    >
                      + Add Item
                    </button>
                  </div>

                  {(loanData.items || []).map((item, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-1 md:grid-cols-12 gap-2 mb-2"
                    >
                      <input
                        type="text"
                        placeholder="Item name"
                        value={item.name}
                        onChange={(e) => {
                          const newItems = [...(loanData.items || [])];
                          newItems[index].name = e.target.value;
                          setLoanData({ ...loanData, items: newItems });
                        }}
                        className="md:col-span-4 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#066f48] focus:border-[#066f48]"
                        required={loanData.user_type === "farmer"}
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...(loanData.items || [])];
                          const quantity = parseInt(e.target.value, 10) || 1;
                          newItems[index].quantity = quantity;
                          newItems[index].total_price =
                            quantity * newItems[index].unit_price;
                          setLoanData({ ...loanData, items: newItems });
                        }}
                        className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#066f48] focus:border-[#066f48]"
                        min="1"
                        required={loanData.user_type === "farmer"}
                      />
                      <input
                        type="number"
                        placeholder="Unit Price (₦)"
                        value={item.unit_price}
                        onChange={(e) => {
                          const newItems = [...(loanData.items || [])];
                          const unitPrice = parseFloat(e.target.value) || 0;
                          newItems[index].unit_price = unitPrice;
                          newItems[index].total_price =
                            newItems[index].quantity * unitPrice;
                          setLoanData({ ...loanData, items: newItems });
                        }}
                        className="md:col-span-3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#066f48] focus:border-[#066f48]"
                        min="0"
                        required={loanData.user_type === "farmer"}
                      />
                      <div className="md:col-span-3 flex items-center justify-between rounded-lg border border-gray-200 px-3">
                        <span className="text-sm font-medium text-gray-700">
                          ₦{(item.total_price || 0).toLocaleString()}
                        </span>
                        {(loanData.items || []).length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setLoanData((prev) => ({
                                ...prev,
                                items: (prev.items || []).filter((_, i) => i !== index),
                              }))
                            }
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purpose
                  </label>
                  <textarea
                    value={loanData.purpose}
                    onChange={(e) =>
                      setLoanData({ ...loanData, purpose: e.target.value })
                    }
                    placeholder="Purpose of the loan"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#066f48] focus:border-[#066f48]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Notes
                  </label>
                  <textarea
                    value={loanData.notes}
                    onChange={(e) =>
                      setLoanData({ ...loanData, notes: e.target.value })
                    }
                    placeholder="Internal note"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#066f48] focus:border-[#066f48]"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCreateLoanError(null);
                    setShowCreateModal(false);
                  }}
                  className="flex-1 px-4 py-2.5 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-[#066f48] text-white rounded-lg hover:bg-[#055b3d]"
                >
                  Issue Loan
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
                  setCreateLoanTypeError(null);
                  setCreateLoanTypeForm(getDefaultCreateLoanTypeForm());
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateLoanType} className="p-6 space-y-4">
              {createLoanTypeError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {createLoanTypeError}
                </div>
              )}

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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    User Type *
                  </label>
                  <select
                    value={createLoanTypeForm.user_type}
                    onChange={(e) =>
                      setCreateLoanTypeForm({
                        ...createLoanTypeForm,
                        user_type: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  >
                    <option value="farmer">Farmer</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {LOAN_CATEGORY_OPTIONS.map((option) => {
                    const isSelected = createLoanTypeForm.category === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setCreateLoanTypeForm({
                            ...createLoanTypeForm,
                            category: option.value,
                          })
                        }
                        className={`text-left rounded-lg border px-3 py-2 transition-colors ${
                          isSelected
                            ? "border-[#066f48] bg-emerald-50"
                            : "border-gray-300 bg-white hover:bg-gray-50"
                        }`}
                      >
                        <p className="text-sm font-semibold text-gray-800">
                          {option.label}
                        </p>
                        <p className="text-xs text-gray-600">{option.description}</p>
                      </button>
                    );
                  })}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                    max="30"
                    step="0.1"
                    value={createLoanTypeForm.interest_rate}
                    onChange={(e) =>
                      setCreateLoanTypeForm({
                        ...createLoanTypeForm,
                        interest_rate: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (Months) *
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {DURATION_PRESETS.map((months) => (
                      <button
                        key={months}
                        type="button"
                        onClick={() =>
                          setCreateLoanTypeForm({
                            ...createLoanTypeForm,
                            duration_months: months,
                          })
                        }
                        className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                          createLoanTypeForm.duration_months === months
                            ? "border-[#066f48] bg-emerald-50 text-[#066f48]"
                            : "border-gray-300 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {months} months
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    required
                    min="1"
                    max="60"
                    step="1"
                    value={createLoanTypeForm.duration_months}
                    onChange={(e) =>
                      setCreateLoanTypeForm({
                        ...createLoanTypeForm,
                        duration_months: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="Enter duration in months"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Allowed range: 1 to 60 months.
                  </p>
                </div>
              </div>

              {createLoanTypeForm.user_type === "staff" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Min Amount (₦)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={createLoanTypeForm.min_amount ? createLoanTypeForm.min_amount / 100 : ""}
                      onChange={(e) => {
                        const naira = parseFloat(e.target.value);
                        setCreateLoanTypeForm({
                          ...createLoanTypeForm,
                          min_amount: Number.isFinite(naira) ? Math.round(naira * 100) : undefined,
                        });
                      }}
                      placeholder="e.g., 50,000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Amount (₦)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={createLoanTypeForm.max_amount ? createLoanTypeForm.max_amount / 100 : ""}
                      onChange={(e) => {
                        const naira = parseFloat(e.target.value);
                        setCreateLoanTypeForm({
                          ...createLoanTypeForm,
                          max_amount: Number.isFinite(naira) ? Math.round(naira * 100) : undefined,
                        });
                      }}
                      placeholder="e.g., 500,000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateLoanTypeModalOpen(false);
                    setCreateLoanTypeError(null);
                    setCreateLoanTypeForm(getDefaultCreateLoanTypeForm());
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
