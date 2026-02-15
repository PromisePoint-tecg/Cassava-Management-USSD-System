import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Play,
  RefreshCw,
  Search,
  Truck,
  X,
} from "lucide-react";
import {
  AdminLoanResponse,
  ApprovePickupRequestData,
  PickupDeliveryKpisResponse,
  PickupRequest,
  ProcessPickupToPurchaseData,
  RecordLoanDeliveryData,
  loansApi,
} from "../services/loans";
import { LeafInlineLoader } from "./Loader";
import { SuccessModal } from "./SuccessModal";

type OpsTab = "deliveries" | "pickups";

const formatCurrency = (value: number) =>
  `₦${Number(value || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value?: string | Date) => {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value?: string | Date) => {
  if (!value) return "N/A";
  return new Date(value).toLocaleString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getRequesterName = (loan: AdminLoanResponse | any) =>
  loan?.name || loan?.farmer_name || loan?.staff_name || "N/A";

const getRequesterPhone = (loan: AdminLoanResponse | any) =>
  loan?.phone || loan?.farmer_phone || loan?.staff_phone || "N/A";

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

export const PickupDeliveryView: React.FC = () => {
  const pageRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<OpsTab>("deliveries");
  const [kpis, setKpis] = useState<PickupDeliveryKpisResponse | null>(null);
  const [deliveries, setDeliveries] = useState<AdminLoanResponse[]>([]);
  const [pickups, setPickups] = useState<PickupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [selectedDelivery, setSelectedDelivery] = useState<AdminLoanResponse | null>(null);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [deliveryData, setDeliveryData] = useState<RecordLoanDeliveryData>({
    items: [{ name: "", quantity: 1, unit_price: 0, total_price: 0 }],
    delivery_notes: "",
  });

  const [selectedPickup, setSelectedPickup] = useState<PickupRequest | null>(null);
  const [isPickupApprovalModalOpen, setIsPickupApprovalModalOpen] = useState(false);
  const [pickupApprovalData, setPickupApprovalData] = useState<ApprovePickupRequestData>({
    scheduled_date: "",
    approved_notes: "",
  });

  const [isPickupProcessModalOpen, setIsPickupProcessModalOpen] = useState(false);
  const [pickupProcessData, setPickupProcessData] = useState<ProcessPickupToPurchaseData>({
    weightKg: 0,
    pricePerKg: 0,
    location: "",
    notes: "",
  });

  const [detailsModalData, setDetailsModalData] = useState<{
    type: "delivery" | "pickup";
    payload: any;
  } | null>(null);

  const statusOptions = useMemo(
    () =>
      activeTab === "deliveries"
        ? [
            { value: "", label: "All Delivery Statuses" },
            { value: "pending", label: "Pending Delivery" },
            { value: "delivered", label: "Delivered" },
          ]
        : [
            { value: "", label: "All Pickup Statuses" },
            { value: "requested", label: "Requested" },
            { value: "approved", label: "Approved" },
            { value: "staff_updated", label: "Staff Updated" },
            { value: "processed", label: "Processed" },
            { value: "cancelled", label: "Cancelled" },
          ],
    [activeTab]
  );

  const loadKpis = async () => {
    const data = await loansApi.getPickupDeliveryKpis({
      startDate: startDateFilter || undefined,
      endDate: endDateFilter || undefined,
    });
    setKpis(data);
  };

  const loadDeliveries = async () => {
    const deliveryStatusForQuery =
      statusFilter === "pending"
        ? "approved"
        : statusFilter === "delivered"
        ? "active"
        : undefined;

    const response = await loansApi.getLoanDeliveries({
      page: currentPage,
      limit: 10,
      search: searchTerm || undefined,
      status: deliveryStatusForQuery as any,
      startDate: startDateFilter || undefined,
      endDate: endDateFilter || undefined,
    });

    setDeliveries(response.loans || []);
    setTotal(response.total || 0);
    setTotalPages(response.totalPages || 1);
  };

  const loadPickups = async () => {
    const response = await loansApi.getPickupRequests({
      page: currentPage,
      limit: 10,
      search: searchTerm || undefined,
      status: (statusFilter as any) || undefined,
      startDate: startDateFilter || undefined,
      endDate: endDateFilter || undefined,
    });

    setPickups(response.pickups || []);
    setTotal(response.total || 0);
    setTotalPages(response.totalPages || 1);
  };

  const loadActiveTabData = async () => {
    if (activeTab === "deliveries") {
      await loadDeliveries();
      return;
    }
    await loadPickups();
  };

  const refreshPageData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (startDateFilter && endDateFilter && startDateFilter > endDateFilter) {
        throw new Error("Start date cannot be after end date.");
      }

      await Promise.all([loadKpis(), loadActiveTabData()]);
    } catch (err: any) {
      setError(err?.message || "Failed to load pickup/delivery data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshPageData();
  }, [activeTab, searchTerm, statusFilter, startDateFilter, endDateFilter, currentPage]);

  const handleOpenDeliveryModal = (loan: AdminLoanResponse) => {
    setSelectedDelivery(loan);
    const items = loan.items?.length
      ? loan.items.map((item) => ({
          ...item,
          unit_price: (item.unit_price || 0) * 100,
          total_price: (item.total_price || 0) * 100,
        }))
      : [{ name: "", quantity: 1, unit_price: 0, total_price: 0 }];

    setDeliveryData({
      items,
      delivery_notes: loan.delivery_notes || "",
    });
    setIsDeliveryModalOpen(true);
  };

  const handleRecordDelivery = async () => {
    if (!selectedDelivery) return;

    const validItems = (deliveryData.items || []).filter(
      (item) => item.name && item.quantity > 0 && item.total_price >= 0
    );
    if (validItems.length === 0) {
      setError("Add at least one valid delivered item.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await loansApi.recordLoanDelivery(selectedDelivery.id, {
        ...deliveryData,
        items: validItems,
      });

      setIsDeliveryModalOpen(false);
      setSelectedDelivery(null);
      setSuccessMessage("Loan delivery recorded successfully.");
      setIsSuccessModalOpen(true);
      await refreshPageData();
    } catch (err: any) {
      setError(err?.message || "Failed to record loan delivery.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenPickupApproval = (pickup: PickupRequest) => {
    setSelectedPickup(pickup);
    setPickupApprovalData({
      scheduled_date: pickup.scheduled_date
        ? new Date(pickup.scheduled_date).toISOString().slice(0, 16)
        : "",
      approved_notes: pickup.approved_notes || "",
      assigned_staff_id: pickup.assigned_staff_id || "",
    });
    setIsPickupApprovalModalOpen(true);
  };

  const handleApprovePickup = async () => {
    if (!selectedPickup) return;
    try {
      setSubmitting(true);
      setError(null);
      await loansApi.approvePickupRequest(selectedPickup.id, pickupApprovalData);
      setIsPickupApprovalModalOpen(false);
      setSelectedPickup(null);
      setSuccessMessage("Pickup request approved successfully.");
      setIsSuccessModalOpen(true);
      await refreshPageData();
    } catch (err: any) {
      setError(err?.message || "Failed to approve pickup request.");
    } finally {
      setSubmitting(false);
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

  const handleProcessPickup = async () => {
    if (!selectedPickup) return;
    if (!pickupProcessData.weightKg || pickupProcessData.weightKg <= 0) {
      setError("Weight must be greater than zero.");
      return;
    }
    if (!pickupProcessData.pricePerKg || pickupProcessData.pricePerKg <= 0) {
      setError("Price per KG must be greater than zero.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await loansApi.processPickupToPurchase(selectedPickup.id, pickupProcessData);
      setIsPickupProcessModalOpen(false);
      setSelectedPickup(null);
      setSuccessMessage("Pickup processed and purchase created successfully.");
      setIsSuccessModalOpen(true);
      await refreshPageData();
    } catch (err: any) {
      setError(err?.message || "Failed to process pickup.");
    } finally {
      setSubmitting(false);
    }
  };

  const exportRecordsToPdf = async () => {
    try {
      const logoDataUrl = await getLogoDataUrl();
      const timestamp = new Date().toLocaleString("en-NG");

      let tableHeader = "";
      let tableRows = "";

      if (activeTab === "deliveries") {
        const deliveryStatusForQuery =
          statusFilter === "pending"
            ? "approved"
            : statusFilter === "delivered"
            ? "active"
            : undefined;

        const response = await loansApi.getLoanDeliveries({
          page: 1,
          limit: 500,
          search: searchTerm || undefined,
          status: deliveryStatusForQuery as any,
          startDate: startDateFilter || undefined,
          endDate: endDateFilter || undefined,
        });

        tableHeader = `
          <th>Requester</th>
          <th>Phone</th>
          <th>Reference</th>
          <th>Amount</th>
          <th>Delivery</th>
          <th>Due Date</th>
          <th>Created</th>
        `;
        tableRows = (response.loans || [])
          .map(
            (loan) => `
              <tr>
                <td>${escapeHtml(getRequesterName(loan))}</td>
                <td>${escapeHtml(getRequesterPhone(loan))}</td>
                <td>${escapeHtml(loan.reference || "N/A")}</td>
                <td>${formatCurrency(loan.principal_amount || 0)}</td>
                <td>${escapeHtml((loan.delivery_status || "pending").toUpperCase())}</td>
                <td>${formatDate(loan.due_date)}</td>
                <td>${formatDate(loan.createdAt)}</td>
              </tr>
            `
          )
          .join("");
      } else {
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
          <th>Channel</th>
          <th>Schedule</th>
          <th>Proposed Purchase</th>
          <th>Created</th>
        `;
        tableRows = (response.pickups || [])
          .map(
            (pickup) => `
              <tr>
                <td>${escapeHtml(pickup.farmer_name || "N/A")}</td>
                <td>${escapeHtml(pickup.farmer_phone || "N/A")}</td>
                <td>${escapeHtml((pickup.status || "N/A").toUpperCase())}</td>
                <td>${escapeHtml((pickup.channel || "N/A").toUpperCase())}</td>
                <td>${formatDateTime(pickup.scheduled_date)}</td>
                <td>${
                  pickup.proposed_weight_kg
                    ? `${pickup.proposed_weight_kg}kg @ ₦${Number(
                        pickup.proposed_price_per_kg || 0
                      ).toLocaleString("en-NG")}`
                    : "N/A"
                }</td>
                <td>${formatDate(pickup.createdAt)}</td>
              </tr>
            `
          )
          .join("");
      }

      const printWindow = window.open("", "_blank", "width=1200,height=900");
      if (!printWindow) {
        setError("Popup blocked. Enable popups to export.");
        return;
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>Pickup Delivery Records Export</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; color: #1f2937; }
              .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #066f48; padding-bottom: 10px; margin-bottom: 14px; }
              .brand { display: flex; gap: 10px; align-items: center; }
              .brand img { width: 44px; height: 44px; object-fit: contain; }
              .title { color: #066f48; font-weight: 700; font-size: 20px; margin: 0; }
              .meta { color: #4b5563; margin-bottom: 14px; font-size: 13px; }
              table { width: 100%; border-collapse: collapse; font-size: 12px; }
              th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
              th { background: #ecfdf5; color: #065f46; }
              tr:nth-child(even) { background: #f9fafb; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="brand">
                ${logoDataUrl ? `<img src="${logoDataUrl}" alt="Promise Point Logo" />` : ""}
                <div>
                  <p class="title">Pickup & Delivery Operations</p>
                  <div>Promise Point Agrictech</div>
                </div>
              </div>
              <div>${timestamp}</div>
            </div>
            <p class="meta">
              Tab: ${activeTab === "deliveries" ? "Deliveries" : "Pickups"} |
              Filter: ${statusFilter || "All"} |
              Date: ${startDateFilter || "N/A"} to ${endDateFilter || "N/A"}
            </p>
            <table>
              <thead><tr>${tableHeader}</tr></thead>
              <tbody>${tableRows}</tbody>
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 600);
    } catch (err: any) {
      setError(err?.message || "Failed to export records.");
    }
  };

  const exportPageToPdf = () => {
    if (!pageRef.current) return;
    const html = pageRef.current.outerHTML;
    const styleTags = Array.from(
      document.querySelectorAll("style, link[rel='stylesheet']")
    )
      .map((el) => el.outerHTML)
      .join("\n");

    const printWindow = window.open("", "_blank", "width=1300,height=900");
    if (!printWindow) {
      setError("Popup blocked. Enable popups to export.");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Pickup Delivery Dashboard Export</title>
          ${styleTags}
          <style>
            body { background: white; margin: 0; padding: 16px; }
            .no-print { display: none !important; }
          </style>
        </head>
        <body>${html}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 650);
  };

  const kpiCards = [
    {
      label: "Pending Deliveries",
      value: kpis?.deliveries.pending ?? 0,
      valueClass: "text-amber-700",
    },
    {
      label: "Delivered Loans",
      value: kpis?.deliveries.delivered ?? 0,
      valueClass: "text-emerald-700",
    },
    {
      label: "Pickup Requests",
      value: kpis?.pickups.total ?? 0,
      valueClass: "text-slate-800",
    },
    {
      label: "Processed Pickups",
      value: kpis?.pickups.processed ?? 0,
      valueClass: "text-[#066f48]",
    },
  ];

  return (
    <div ref={pageRef} className="space-y-4 min-h-[calc(100vh-9.5rem)]">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 flex items-center">
              <div className="p-2 rounded-lg bg-[#066f48] mr-3">
                <Truck className="w-5 h-5 text-white" />
              </div>
              Pickup & Delivery Operations
            </h2>
            <p className="text-sm text-gray-600 mt-1 ml-12">
              Dedicated operations queue for delivery execution and pickup processing
            </p>
          </div>

          <div className="flex flex-wrap gap-2 no-print">
            <button
              onClick={refreshPageData}
              className="inline-flex items-center px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
            <button
              onClick={exportRecordsToPdf}
              className="inline-flex items-center px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Records
            </button>
            <button
              onClick={exportPageToPdf}
              className="inline-flex items-center px-4 py-2.5 bg-[#066f48] text-white rounded-lg hover:bg-[#055a3a] transition-all text-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Page
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-4"
          >
            <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide">
              {card.label}
            </p>
            <p className={`text-2xl sm:text-3xl font-bold mt-1 ${card.valueClass}`}>
              {Number(card.value).toLocaleString("en-NG")}
            </p>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-2">
        <nav className="flex items-center gap-2 sm:gap-4 px-2 py-2 overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab("deliveries");
              setCurrentPage(1);
              setStatusFilter("");
            }}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
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
              setStatusFilter("");
            }}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
              activeTab === "pickups"
                ? "bg-emerald-50 text-emerald-700"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Pickups
          </button>
        </nav>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
          <div className="relative xl:col-span-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder={
                activeTab === "deliveries"
                  ? "Search by requester, phone or reference..."
                  : "Search by farmer name or phone..."
              }
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#066f48] focus:border-[#066f48] focus:outline-none text-sm"
            />
          </div>

          <div className="relative xl:col-span-2">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="date"
              value={startDateFilter}
              onChange={(event) => {
                setStartDateFilter(event.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#066f48] focus:border-[#066f48] focus:outline-none text-sm"
            />
          </div>

          <div className="relative xl:col-span-2">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="date"
              value={endDateFilter}
              min={startDateFilter || undefined}
              onChange={(event) => {
                setEndDateFilter(event.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#066f48] focus:border-[#066f48] focus:outline-none text-sm"
            />
          </div>

          <div className="xl:col-span-3">
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#066f48] focus:border-[#066f48] focus:outline-none text-sm"
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
              setStartDateFilter("");
              setEndDateFilter("");
              setCurrentPage(1);
            }}
            className="text-sm text-[#066f48] hover:text-[#055a3a] font-medium"
          >
            Reset Filters
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[420px]">
        {loading ? (
          <div className="h-full flex items-center justify-center py-16">
            <LeafInlineLoader />
          </div>
        ) : activeTab === "deliveries" ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Requester
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Delivery Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Pickup Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {deliveries.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{getRequesterName(loan)}</p>
                      <p className="text-sm text-gray-600">{getRequesterPhone(loan)}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {loan.reference}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">
                        {formatCurrency(loan.principal_amount)}
                      </p>
                      <p className="text-xs text-gray-600">
                        Outstanding: {formatCurrency(loan.amount_outstanding)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                          (loan.delivery_status || "pending") === "delivered"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {(loan.delivery_status || "pending").toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {formatDate(loan.pickup_date)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() =>
                            setDetailsModalData({ type: "delivery", payload: loan })
                          }
                          className="p-2 text-[#066f48] hover:bg-emerald-50 rounded-lg"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {(loan.delivery_status || "pending") !== "delivered" && (
                          <button
                            onClick={() => handleOpenDeliveryModal(loan)}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50"
                          >
                            Record Delivery
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {deliveries.length === 0 && (
              <div className="py-16 text-center text-gray-500">No delivery records found.</div>
            )}
          </div>
        ) : (
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
                    Channel
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
                {pickups.map((pickup) => (
                  <tr key={pickup.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{pickup.farmer_name}</p>
                      <p className="text-sm text-gray-600">{pickup.farmer_phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                          pickup.status === "processed"
                            ? "bg-emerald-100 text-emerald-700"
                            : pickup.status === "cancelled"
                            ? "bg-red-100 text-red-700"
                            : pickup.status === "staff_updated"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {pickup.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 uppercase">
                      {pickup.channel}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {formatDateTime(pickup.scheduled_date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {pickup.proposed_weight_kg
                        ? `${pickup.proposed_weight_kg}kg @ ₦${Number(
                            pickup.proposed_price_per_kg || 0
                          ).toLocaleString("en-NG")}`
                        : "Awaiting staff update"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() =>
                            setDetailsModalData({ type: "pickup", payload: pickup })
                          }
                          className="p-2 text-[#066f48] hover:bg-emerald-50 rounded-lg"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {(pickup.status === "requested" || pickup.status === "staff_updated") && (
                          <button
                            onClick={() => handleOpenPickupApproval(pickup)}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50"
                          >
                            Approve
                          </button>
                        )}
                        {(pickup.status === "approved" || pickup.status === "staff_updated") && (
                          <button
                            onClick={() => handleOpenPickupProcess(pickup)}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          >
                            Process
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pickups.length === 0 && (
              <div className="py-16 text-center text-gray-500">No pickup requests found.</div>
            )}
          </div>
        )}
      </div>

      {!loading && totalPages > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-sm text-gray-600">
              Page {currentPage} of {totalPages} • {total.toLocaleString()} records
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {detailsModalData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {detailsModalData.type === "delivery" ? "Delivery Details" : "Pickup Details"}
              </h3>
              <button
                onClick={() => setDetailsModalData(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <pre className="text-xs whitespace-pre-wrap break-words text-gray-800 bg-gray-50 rounded-lg p-4">
                {JSON.stringify(detailsModalData.payload, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {isDeliveryModalOpen && selectedDelivery && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Record Delivery</h3>
              <button
                onClick={() => setIsDeliveryModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                {selectedDelivery.reference} • {getRequesterName(selectedDelivery)}
              </p>

              {(deliveryData.items || []).map((item, index) => (
                <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <input
                    type="text"
                    placeholder="Item name"
                    value={item.name}
                    onChange={(event) => {
                      const items = [...(deliveryData.items || [])];
                      items[index] = { ...items[index], name: event.target.value };
                      setDeliveryData({ ...deliveryData, items });
                    }}
                    className="sm:col-span-4 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(event) => {
                      const quantity = Number(event.target.value || 0);
                      const items = [...(deliveryData.items || [])];
                      const unitPrice = Number(items[index].unit_price || 0);
                      items[index] = {
                        ...items[index],
                        quantity,
                        total_price: unitPrice * quantity,
                      };
                      setDeliveryData({ ...deliveryData, items });
                    }}
                    className="sm:col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Unit price (₦)"
                    value={Math.round((item.unit_price || 0) / 100)}
                    onChange={(event) => {
                      const unitPriceKobo = Number(event.target.value || 0) * 100;
                      const quantity = Number(item.quantity || 0);
                      const items = [...(deliveryData.items || [])];
                      items[index] = {
                        ...items[index],
                        unit_price: unitPriceKobo,
                        total_price: unitPriceKobo * quantity,
                      };
                      setDeliveryData({ ...deliveryData, items });
                    }}
                    className="sm:col-span-3 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Total (₦)"
                    value={Math.round((item.total_price || 0) / 100)}
                    onChange={(event) => {
                      const totalKobo = Number(event.target.value || 0) * 100;
                      const items = [...(deliveryData.items || [])];
                      items[index] = { ...items[index], total_price: totalKobo };
                      setDeliveryData({ ...deliveryData, items });
                    }}
                    className="sm:col-span-3 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              ))}

              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setDeliveryData({
                      ...deliveryData,
                      items: [
                        ...(deliveryData.items || []),
                        { name: "", quantity: 1, unit_price: 0, total_price: 0 },
                      ],
                    })
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                >
                  Add Item
                </button>
                {(deliveryData.items || []).length > 1 && (
                  <button
                    onClick={() =>
                      setDeliveryData({
                        ...deliveryData,
                        items: (deliveryData.items || []).slice(
                          0,
                          (deliveryData.items || []).length - 1
                        ),
                      })
                    }
                    className="px-3 py-2 border border-red-300 text-red-700 rounded-lg text-sm hover:bg-red-50"
                  >
                    Remove Last
                  </button>
                )}
              </div>

              <textarea
                rows={3}
                placeholder="Delivery notes"
                value={deliveryData.delivery_notes || ""}
                onChange={(event) =>
                  setDeliveryData({ ...deliveryData, delivery_notes: event.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setIsDeliveryModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordDelivery}
                disabled={submitting}
                className="px-4 py-2 bg-[#066f48] text-white rounded-lg text-sm hover:bg-[#055a3a] disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Save Delivery"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isPickupApprovalModalOpen && selectedPickup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Approve Pickup</h3>
              <button
                onClick={() => setIsPickupApprovalModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <input
                type="datetime-local"
                value={pickupApprovalData.scheduled_date || ""}
                onChange={(event) =>
                  setPickupApprovalData({
                    ...pickupApprovalData,
                    scheduled_date: event.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <textarea
                rows={3}
                placeholder="Approval notes"
                value={pickupApprovalData.approved_notes || ""}
                onChange={(event) =>
                  setPickupApprovalData({
                    ...pickupApprovalData,
                    approved_notes: event.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setIsPickupApprovalModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApprovePickup}
                disabled={submitting}
                className="px-4 py-2 bg-[#066f48] text-white rounded-lg text-sm hover:bg-[#055a3a] disabled:opacity-50"
              >
                {submitting ? "Approving..." : "Approve"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isPickupProcessModalOpen && selectedPickup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Process Pickup</h3>
              <button
                onClick={() => setIsPickupProcessModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <input
                type="number"
                min="0.01"
                placeholder="Weight (kg)"
                value={pickupProcessData.weightKg || ""}
                onChange={(event) =>
                  setPickupProcessData({
                    ...pickupProcessData,
                    weightKg: Number(event.target.value || 0),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="number"
                min="0.01"
                placeholder="Price per KG (₦)"
                value={pickupProcessData.pricePerKg || ""}
                onChange={(event) =>
                  setPickupProcessData({
                    ...pickupProcessData,
                    pricePerKg: Number(event.target.value || 0),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="text"
                placeholder="Location"
                value={pickupProcessData.location || ""}
                onChange={(event) =>
                  setPickupProcessData({
                    ...pickupProcessData,
                    location: event.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <textarea
                rows={3}
                placeholder="Processing notes"
                value={pickupProcessData.notes || ""}
                onChange={(event) =>
                  setPickupProcessData({
                    ...pickupProcessData,
                    notes: event.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setIsPickupProcessModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessPickup}
                disabled={submitting}
                className="px-4 py-2 bg-[#066f48] text-white rounded-lg text-sm hover:bg-[#055a3a] disabled:opacity-50 inline-flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                {submitting ? "Processing..." : "Process to Purchase"}
              </button>
            </div>
          </div>
        </div>
      )}

      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        message={successMessage}
      />
    </div>
  );
};

export default PickupDeliveryView;
