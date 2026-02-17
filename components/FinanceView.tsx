import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Typography,
} from "@mui/material";
import { Briefcase, FileDown, RefreshCw, Wallet, Download } from "lucide-react";
import {
  financeApi,
  FinanceKpiMetric,
  FinanceKpisResponse,
  OrganizationWalletSnapshot,
  OrganizationWalletType,
} from "../services/finance";
import { Farmer, farmersApi } from "../services/farmers";
import { Staff, getAllStaff } from "../services/staff";
import { Transaction } from "../services/transactions";
import LeafInlineLoader from "./Loader";

type WalletActionMode = "fund" | "withdraw";

const walletTypeOptions: Array<{
  value: OrganizationWalletType;
  label: string;
}> = [
  { value: "payroll", label: "Payroll Wallet" },
  { value: "bonus", label: "Bonus Wallet" },
  { value: "withdrawer", label: "Withdrawer Wallet" },
  { value: "purchase", label: "Purchase Wallet" },
];

const sectionTitleSx = {
  fontWeight: 700,
  color: "#0f172a",
};

const tabSx = {
  minHeight: 44,
  fontWeight: 700,
  textTransform: "none",
  color: "#334155",
  "&.Mui-selected": {
    color: "#066f48",
  },
};

const formatCurrency = (value: number) =>
  `₦${Number(value || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDateTime = (value?: string) => {
  if (!value) return "N/A";
  return new Date(value).toLocaleString();
};

const formatKpiValue = (metric: FinanceKpiMetric) => {
  if (metric.unit === "percent") return `${metric.value.toFixed(2)}%`;
  if (metric.unit === "count") return Math.round(metric.value).toLocaleString();
  return formatCurrency(metric.value);
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

type TransactionSortBy = "createdAt" | "amount" | "status" | "type";

const transactionSortOptions: Array<{ value: TransactionSortBy; label: string }> =
  [
    { value: "createdAt", label: "Date" },
    { value: "amount", label: "Amount" },
    { value: "status", label: "Status" },
    { value: "type", label: "Type" },
  ];

const transactionStatusOptions = ["pending", "completed", "failed", "cancelled"];

const exportTypeOptions = [
  "sale",
  "purchase",
  "withdrawal",
  "deposit",
  "loan_disbursement",
  "loan_repayment",
  "savings_deposit",
  "savings_withdrawal",
  "organization_funding",
  "payroll_disbursement",
  "bonus_wallet_funding",
  "bonus_allocation",
  "bonus_transfer",
];

const outgoingTransactionTypes = new Set([
  "withdrawal",
  "purchase",
  "loan_disbursement",
  "payroll_disbursement",
  "bonus_transfer",
  "escrow_hold",
]);

const incomingTransactionTypes = new Set([
  "deposit",
  "sale",
  "loan_repayment",
  "savings_deposit",
  "escrow_release",
  "organization_funding",
  "bonus_wallet_funding",
  "bonus_allocation",
]);

type StatementKpis = {
  totalRecords: number;
  inflow: number;
  outflow: number;
  netMovement: number;
  completed: number;
  pending: number;
  failed: number;
  cancelled: number;
};

const computeStatementKpis = (rows: Transaction[]): StatementKpis => {
  let inflow = 0;
  let outflow = 0;
  let completed = 0;
  let pending = 0;
  let failed = 0;
  let cancelled = 0;

  rows.forEach((tx) => {
    const type = (tx.type || "").toLowerCase();
    if (outgoingTransactionTypes.has(type)) {
      outflow += tx.amount || 0;
    } else if (incomingTransactionTypes.has(type)) {
      inflow += tx.amount || 0;
    } else if ((tx.amount || 0) >= 0) {
      inflow += tx.amount || 0;
    } else {
      outflow += Math.abs(tx.amount || 0);
    }

    switch (tx.status) {
      case "completed":
        completed += 1;
        break;
      case "pending":
        pending += 1;
        break;
      case "failed":
        failed += 1;
        break;
      case "cancelled":
        cancelled += 1;
        break;
      default:
        break;
    }
  });

  return {
    totalRecords: rows.length,
    inflow,
    outflow,
    netMovement: inflow - outflow,
    completed,
    pending,
    failed,
    cancelled,
  };
};

const renderKpiCards = (kpis: StatementKpis) => `
  <div class="kpis">
    <div class="kpi"><span>Total Records</span><strong>${kpis.totalRecords.toLocaleString()}</strong></div>
    <div class="kpi"><span>Total Inflow</span><strong>${formatCurrency(kpis.inflow)}</strong></div>
    <div class="kpi"><span>Total Outflow</span><strong>${formatCurrency(kpis.outflow)}</strong></div>
    <div class="kpi"><span>Net Movement</span><strong>${formatCurrency(kpis.netMovement)}</strong></div>
    <div class="kpi"><span>Completed</span><strong>${kpis.completed.toLocaleString()}</strong></div>
    <div class="kpi"><span>Pending</span><strong>${kpis.pending.toLocaleString()}</strong></div>
    <div class="kpi"><span>Failed</span><strong>${kpis.failed.toLocaleString()}</strong></div>
    <div class="kpi"><span>Cancelled</span><strong>${kpis.cancelled.toLocaleString()}</strong></div>
  </div>
`;

const FinanceView: React.FC = () => {
  const financePageRef = useRef<HTMLDivElement>(null);
  const [tabIndex, setTabIndex] = useState(0);
  const [walletTxTab, setWalletTxTab] = useState<OrganizationWalletType>("payroll");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [financeKpis, setFinanceKpis] = useState<FinanceKpisResponse | null>(null);
  const [wallets, setWallets] = useState<OrganizationWalletSnapshot[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [farmersTotal, setFarmersTotal] = useState(0);
  const [staffTotal, setStaffTotal] = useState(0);
  const [farmersLoading, setFarmersLoading] = useState(false);
  const [staffLoading, setStaffLoading] = useState(false);
  const [farmersError, setFarmersError] = useState<string | null>(null);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [farmerPage, setFarmerPage] = useState(0);
  const [farmerRowsPerPage, setFarmerRowsPerPage] = useState(10);
  const [staffPage, setStaffPage] = useState(0);
  const [staffRowsPerPage, setStaffRowsPerPage] = useState(10);

  const [txLoading, setTxLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txError, setTxError] = useState<string | null>(null);
  const [txTotal, setTxTotal] = useState(0);
  const [txPage, setTxPage] = useState(0);
  const [txRowsPerPage, setTxRowsPerPage] = useState(25);
  const [txSearch, setTxSearch] = useState("");
  const [txStatus, setTxStatus] = useState("");
  const [txSortBy, setTxSortBy] = useState<TransactionSortBy>("createdAt");
  const [txSortOrder, setTxSortOrder] = useState<"asc" | "desc">("desc");
  const [walletExporting, setWalletExporting] = useState(false);
  const [statementExporting, setStatementExporting] = useState(false);
  const [statementStatus, setStatementStatus] = useState("");
  const [statementType, setStatementType] = useState("");
  const [statementSortBy, setStatementSortBy] =
    useState<TransactionSortBy>("createdAt");
  const [statementSortOrder, setStatementSortOrder] = useState<"asc" | "desc">(
    "desc"
  );
  const [statementLimit, setStatementLimit] = useState(500);

  const [fundModalOpen, setFundModalOpen] = useState(false);
  const [fundWalletType, setFundWalletType] = useState<OrganizationWalletType>("payroll");
  const [fundAmount, setFundAmount] = useState<number>(0);
  const [fundReason, setFundReason] = useState("");
  const [fundSubmitting, setFundSubmitting] = useState(false);

  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [walletActionMode, setWalletActionMode] = useState<WalletActionMode>("fund");
  const [walletActionAmount, setWalletActionAmount] = useState<number>(0);
  const [walletActionReason, setWalletActionReason] = useState("");
  const [walletActionSubmitting, setWalletActionSubmitting] = useState(false);
  const [walletActionError, setWalletActionError] = useState<string | null>(null);

  const openPdfWindow = (title: string, bodyHtml: string) => {
    const printWindow = window.open("", "_blank", "width=1280,height=900");
    if (!printWindow) {
      setError("Popup blocked. Enable popups to export statements.");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(title)}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #0f172a; }
            h1, h2, h3 { margin: 0; }
            .header { margin-bottom: 16px; }
            .meta { color: #475569; font-size: 12px; margin-top: 6px; }
            .section { margin-top: 22px; }
            .kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin: 12px 0 14px; }
            .kpi { border: 1px solid #dbe4ee; border-radius: 8px; padding: 8px 10px; }
            .kpi span { display: block; color: #64748b; font-size: 11px; margin-bottom: 4px; }
            .kpi strong { font-size: 14px; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #e2e8f0; padding: 7px; font-size: 11px; text-align: left; vertical-align: top; }
            th { background: #f8fafc; font-weight: 700; }
            .page-break { page-break-before: always; margin-top: 12px; }
            @media print {
              .kpis { grid-template-columns: repeat(4, minmax(0, 1fr)); }
            }
          </style>
        </head>
        <body>${bodyHtml}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 650);
  };

  const getStatementQueryBase = () => ({
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
    ...(statementStatus ? { status: statementStatus } : {}),
    ...(statementType ? { type: statementType } : {}),
    sortBy: statementSortBy,
    sortOrder: statementSortOrder,
  });

  const fetchAllPages = async (
    fetcher: (page: number) => Promise<{ transactions: Transaction[]; totalPages: number }>
  ) => {
    const allRows: Transaction[] = [];
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages && allRows.length < statementLimit) {
      const response = await fetcher(page);
      totalPages = response.totalPages || 1;
      allRows.push(...(response.transactions || []));
      page += 1;
    }

    return allRows.slice(0, statementLimit);
  };

  const loadFinanceData = async () => {
    setLoading(true);
    setError(null);

    try {
      const filters = {
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
      };

      const [kpiResult, walletResult] =
        await Promise.allSettled([
          financeApi.getFinanceKPIs(filters),
          financeApi.getOrganizationWallets(),
        ]);

      if (kpiResult.status === "fulfilled") {
        setFinanceKpis(kpiResult.value);
      } else {
        setFinanceKpis(null);
      }

      if (walletResult.status === "fulfilled") {
        setWallets(walletResult.value);
      } else {
        setWallets([]);
      }

      if (
        kpiResult.status === "rejected" &&
        walletResult.status === "rejected"
      ) {
        throw new Error("Failed to load finance dashboard data");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load finance data");
    } finally {
      setLoading(false);
    }
  };

  const loadFarmersPage = async () => {
    setFarmersLoading(true);
    setFarmersError(null);
    try {
      const result = await farmersApi.getAllFarmers({
        page: farmerPage + 1,
        limit: farmerRowsPerPage,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      setFarmers(result.farmers || []);
      setFarmersTotal(result.total || 0);
    } catch (err: any) {
      setFarmers([]);
      setFarmersTotal(0);
      setFarmersError(err?.message || "Failed to load farmers");
    } finally {
      setFarmersLoading(false);
    }
  };

  const loadStaffPage = async () => {
    setStaffLoading(true);
    setStaffError(null);
    try {
      const result = await getAllStaff({
        page: staffPage + 1,
        limit: staffRowsPerPage,
      });
      setStaff(result.staff || []);
      setStaffTotal(result.total || 0);
    } catch (err: any) {
      setStaff([]);
      setStaffTotal(0);
      setStaffError(err?.message || "Failed to load staff");
    } finally {
      setStaffLoading(false);
    }
  };

  const loadWalletTransactions = async () => {
    setTxLoading(true);
    setTxError(null);
    try {
      const result = await financeApi.getOrganizationTransactions({
        page: txPage + 1,
        limit: txRowsPerPage,
        walletType: walletTxTab,
        ...(txStatus ? { status: txStatus } : {}),
        ...(txSearch ? { search: txSearch } : {}),
        sortBy: txSortBy,
        sortOrder: txSortOrder,
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
      });
      setTransactions(result.transactions || []);
      setTxTotal(result.total || 0);
    } catch (err: any) {
      setTxError(err?.message || "Failed to load wallet transactions");
      setTransactions([]);
      setTxTotal(0);
    } finally {
      setTxLoading(false);
    }
  };

  useEffect(() => {
    loadFinanceData();
  }, [startDate, endDate]);

  useEffect(() => {
    if (tabIndex === 1) {
      loadWalletTransactions();
    }
  }, [
    tabIndex,
    walletTxTab,
    startDate,
    endDate,
    txPage,
    txRowsPerPage,
    txStatus,
    txSearch,
    txSortBy,
    txSortOrder,
  ]);

  useEffect(() => {
    setTxPage(0);
  }, [walletTxTab, startDate, endDate, txStatus, txSearch, txSortBy, txSortOrder]);

  useEffect(() => {
    if (tabIndex === 2) {
      loadFarmersPage();
    }
  }, [tabIndex, farmerPage, farmerRowsPerPage]);

  useEffect(() => {
    if (tabIndex === 3) {
      loadStaffPage();
    }
  }, [tabIndex, staffPage, staffRowsPerPage]);

  const summaryCards = useMemo(
    () => [
      {
        label: "Total Farmers",
        value: financeKpis?.summary.totalFarmers ?? farmersTotal,
      },
      {
        label: "Total Staff",
        value: financeKpis?.summary.totalStaff ?? staffTotal,
      },
      {
        label: "Active Farmers",
        value: financeKpis?.summary.totalActiveFarmers ?? 0,
      },
      {
        label: "Wallet Pool Balance",
        value: formatCurrency(financeKpis?.summary.totalOrganizationWalletBalance ?? 0),
      },
    ],
    [financeKpis, farmersTotal, staffTotal]
  );

  const activeWalletLabel =
    walletTypeOptions.find((option) => option.value === walletTxTab)?.label || "";
  const currentWalletKpis = useMemo(
    () => computeStatementKpis(transactions),
    [transactions]
  );

  const exportPagePdf = () => {
    if (!financePageRef.current) return;

    const html = financePageRef.current.outerHTML;
    const styleTags = Array.from(
      document.querySelectorAll("style, link[rel='stylesheet']")
    )
      .map((el) => el.outerHTML)
      .join("\n");

    const printWindow = window.open("", "_blank", "width=1300,height=900");
    if (!printWindow) return;

    printWindow.document.open();
    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Finance Dashboard Export</title>
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

  const openFundWalletModal = (walletType: OrganizationWalletType) => {
    setFundWalletType(walletType);
    setFundAmount(0);
    setFundReason("");
    setFundModalOpen(true);
  };

  const submitFundWallet = async () => {
    if (fundAmount < 1000) {
      setError("Minimum funding amount is ₦1,000.");
      return;
    }

    try {
      setFundSubmitting(true);
      setError(null);
      await financeApi.fundOrganizationWalletByType({
        walletType: fundWalletType,
        amount: fundAmount,
        reason: fundReason || undefined,
      });
      setFundModalOpen(false);
      await loadFinanceData();
      if (tabIndex === 1) {
        await loadWalletTransactions();
      }
    } catch (err: any) {
      setError(err?.message || "Failed to fund organization wallet");
    } finally {
      setFundSubmitting(false);
    }
  };

  const openFarmerWalletModal = (farmer: Farmer, mode: WalletActionMode) => {
    setSelectedFarmer(farmer);
    setWalletActionMode(mode);
    setWalletActionAmount(0);
    setWalletActionReason("");
    setWalletActionError(null);
  };

  const closeFarmerWalletModal = () => {
    setSelectedFarmer(null);
    setWalletActionError(null);
    setWalletActionAmount(0);
    setWalletActionReason("");
  };

  const submitFarmerWalletAction = async () => {
    if (!selectedFarmer) return;
    if (walletActionAmount < 100) {
      setWalletActionError("Minimum amount is ₦100.");
      return;
    }
    if (!walletActionReason.trim()) {
      setWalletActionError("Reason is required.");
      return;
    }

    try {
      setWalletActionSubmitting(true);
      setWalletActionError(null);

      if (walletActionMode === "fund") {
        await financeApi.fundUserWallet({
          userId: selectedFarmer.userId,
          amount: walletActionAmount,
          reason: walletActionReason.trim(),
        });
      } else {
        await financeApi.withdrawUserWallet({
          userId: selectedFarmer.userId,
          amount: walletActionAmount,
          reason: walletActionReason.trim(),
        });
      }

      closeFarmerWalletModal();
      await Promise.all([loadFinanceData(), loadFarmersPage()]);
    } catch (err: any) {
      setWalletActionError(
        err?.message ||
          `Failed to ${walletActionMode === "fund" ? "fund" : "withdraw"} farmer wallet`
      );
    } finally {
      setWalletActionSubmitting(false);
    }
  };

  const exportWalletStatementPdf = async (includeAllWallets = false) => {
    try {
      setWalletExporting(true);
      setError(null);

      const walletScopes = includeAllWallets
        ? walletTypeOptions
        : walletTypeOptions.filter((item) => item.value === walletTxTab);

      const sections = await Promise.all(
        walletScopes.map(async (scope) => {
          const rows = await fetchAllPages((page) =>
            financeApi.getOrganizationTransactions({
              page,
              limit: 200,
              walletType: scope.value,
              ...(txStatus ? { status: txStatus } : {}),
              ...(txSearch ? { search: txSearch } : {}),
              ...(startDate ? { startDate } : {}),
              ...(endDate ? { endDate } : {}),
              sortBy: txSortBy,
              sortOrder: txSortOrder,
            })
          );

          return {
            label: scope.label,
            rows,
            kpis: computeStatementKpis(rows),
          };
        })
      );

      const exportedAt = new Date().toLocaleString();
      const filtersLabel = [
        startDate ? `Start: ${startDate}` : "",
        endDate ? `End: ${endDate}` : "",
        txStatus ? `Status: ${txStatus}` : "Status: all",
        txSearch ? `Search: ${txSearch}` : "",
        `Sort: ${txSortBy} ${txSortOrder.toUpperCase()}`,
        `Max records per section: ${statementLimit.toLocaleString()}`,
      ]
        .filter(Boolean)
        .join(" | ");

      const sectionsHtml = sections
        .map((section, index) => {
          const rowsHtml = section.rows
            .map(
              (tx) => `
                <tr>
                  <td>${escapeHtml(formatDateTime(tx.createdAt))}</td>
                  <td>${escapeHtml(tx.reference || "N/A")}</td>
                  <td>${escapeHtml((tx.type || "").replace(/_/g, " "))}</td>
                  <td>${escapeHtml(tx.status || "N/A")}</td>
                  <td>${escapeHtml(formatCurrency(tx.amount || 0))}</td>
                  <td>${escapeHtml(formatCurrency(tx.balanceAfter || 0))}</td>
                  <td>${escapeHtml(tx.description || "")}</td>
                </tr>
              `
            )
            .join("");

          return `
            <section class="${index > 0 ? "page-break" : ""}">
              <h2>${escapeHtml(section.label)} Statement</h2>
              <p class="meta">Exported: ${escapeHtml(exportedAt)}</p>
              <p class="meta">${escapeHtml(filtersLabel)}</p>
              ${renderKpiCards(section.kpis)}
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Reference</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Amount</th>
                    <th>Balance After</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    rowsHtml ||
                    `<tr><td colspan="7">No transactions found for this section.</td></tr>`
                  }
                </tbody>
              </table>
            </section>
          `;
        })
        .join("");

      openPdfWindow(
        includeAllWallets
          ? "Wallet Statements - All Wallets"
          : `Wallet Statement - ${activeWalletLabel}`,
        `
          <div class="header">
            <h1>Finance Wallet Statement</h1>
            <p class="meta">Promise Point Farms - Finance Ops Export</p>
          </div>
          ${sectionsHtml}
        `
      );
    } catch (err: any) {
      setError(err?.message || "Failed to export wallet statement.");
    } finally {
      setWalletExporting(false);
    }
  };

  const exportFarmerTransactionStatement = async (farmer?: Farmer) => {
    try {
      setStatementExporting(true);
      setError(null);

      const baseQuery = getStatementQueryBase();
      const rows = farmer
        ? await fetchAllPages((page) =>
            financeApi.getUserTransactions(farmer.userId, {
              ...baseQuery,
              page,
              limit: 200,
            })
          )
        : await fetchAllPages((page) =>
            financeApi.getAllTransactions({
              ...baseQuery,
              userType: "farmer",
              page,
              limit: 200,
            })
          );

      const kpis = computeStatementKpis(rows);
      const uniqueFarmers = new Set(rows.map((tx) => tx.userId).filter(Boolean));
      const reportTitle = farmer
        ? `Farmer Transaction Statement - ${(farmer.fullName || farmer.name || "").toUpperCase()}`
        : "Farmers Executive Transaction Statement";

      const rowsHtml = rows
        .map(
          (tx) => `
            <tr>
              <td>${escapeHtml(formatDateTime(tx.createdAt))}</td>
              <td>${escapeHtml(tx.reference || "N/A")}</td>
              <td>${escapeHtml((tx.user?.name || "N/A").toUpperCase())}</td>
              <td>${escapeHtml((tx.type || "").replace(/_/g, " "))}</td>
              <td>${escapeHtml(tx.status || "N/A")}</td>
              <td>${escapeHtml(formatCurrency(tx.amount || 0))}</td>
              <td>${escapeHtml(formatCurrency(tx.balanceAfter || 0))}</td>
              <td>${escapeHtml(tx.description || "")}</td>
            </tr>
          `
        )
        .join("");

      const exportedAt = new Date().toLocaleString();
      const filtersLabel = [
        startDate ? `Start: ${startDate}` : "",
        endDate ? `End: ${endDate}` : "",
        statementStatus ? `Status: ${statementStatus}` : "Status: all",
        statementType ? `Type: ${statementType}` : "Type: all",
        `Sort: ${statementSortBy} ${statementSortOrder.toUpperCase()}`,
        `Max records: ${statementLimit.toLocaleString()}`,
      ]
        .filter(Boolean)
        .join(" | ");

      openPdfWindow(
        reportTitle,
        `
          <div class="header">
            <h1>${escapeHtml(reportTitle)}</h1>
            <p class="meta">Promise Point Farms - Finance Executive Statement</p>
            <p class="meta">Exported: ${escapeHtml(exportedAt)}</p>
            <p class="meta">${escapeHtml(filtersLabel)}</p>
            ${
              farmer
                ? `<p class="meta">Farmer Phone: ${escapeHtml(farmer.phone || "N/A")} | LGA: ${escapeHtml((farmer.lga || "N/A").toUpperCase())}</p>`
                : `<p class="meta">Unique Farmers in Statement: ${uniqueFarmers.size.toLocaleString()}</p>`
            }
          </div>
          ${renderKpiCards(kpis)}
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Reference</th>
                <th>Farmer</th>
                <th>Type</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Balance After</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              ${
                rowsHtml ||
                `<tr><td colspan="8">No farmer transactions found for selected filters.</td></tr>`
              }
            </tbody>
          </table>
        `
      );
    } catch (err: any) {
      setError(err?.message || "Failed to export farmer transaction statement.");
    } finally {
      setStatementExporting(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "55vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <LeafInlineLoader />
      </Box>
    );
  }

  return (
    <Box
      ref={financePageRef}
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2.5,
        width: "100%",
        maxWidth: "100%",
        overflowX: "hidden",
      }}
    >
      <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, p: 2.5 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
        >
          <Box>
            <Typography
              variant="h5"
              sx={{ fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: 1 }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 1.5,
                  backgroundColor: "#066f48",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                }}
              >
                <Briefcase size={16} />
              </Box>
              Finance Operations
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748b" }}>
              Wallet control center, finance KPIs, and farmer/staff financial actions
            </Typography>
          </Box>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.2}
            className="no-print"
            sx={{ width: { xs: "100%", md: "auto" } }}
          >
            <TextField
              label="Start date"
              type="date"
              size="small"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ width: { xs: "100%", sm: 165 } }}
            />
            <TextField
              label="End date"
              type="date"
              size="small"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ width: { xs: "100%", sm: 165 } }}
            />
            <Button
              variant="outlined"
              startIcon={<RefreshCw size={16} />}
              onClick={loadFinanceData}
              sx={{
                textTransform: "none",
                borderColor: "#cbd5e1",
                color: "#1f2937",
                width: { xs: "100%", sm: "auto" },
              }}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              startIcon={<FileDown size={16} />}
              onClick={exportPagePdf}
              sx={{
                textTransform: "none",
                borderColor: "#cbd5e1",
                color: "#1f2937",
                width: { xs: "100%", sm: "auto" },
              }}
            >
              Export PDF
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {error && <Alert severity="error">{error}</Alert>}

      <Grid container spacing={2}>
        {summaryCards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.label}>
            <Card
              elevation={0}
              sx={{
                border: "1px solid #dbe4ee",
                borderRadius: 2,
                backgroundColor: "#ffffff",
              }}
            >
              <CardContent>
                <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600 }}>
                  {card.label}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a", mt: 0.8 }}>
                  {typeof card.value === "number"
                    ? card.value.toLocaleString()
                    : card.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}>
        <Tabs
          value={tabIndex}
          onChange={(_, nextTab) => setTabIndex(nextTab)}
          variant="scrollable"
          allowScrollButtonsMobile
          sx={{
            borderBottom: "1px solid #e2e8f0",
            px: 1,
            "& .MuiTabs-indicator": { backgroundColor: "#066f48", height: 3 },
          }}
        >
          <Tab sx={tabSx} label="KPI & Wallets" />
          <Tab sx={tabSx} label="Wallet Transactions" />
          <Tab sx={tabSx} label="Farmers Wallet Ops" />
          <Tab sx={tabSx} label="Staff Directory" />
        </Tabs>

        <Box sx={{ p: 2.5 }}>
          {tabIndex === 0 && (
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="h6" sx={sectionTitleSx}>
                  Organization Wallets
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748b" }}>
                  Funding automatically creates missing wallets.
                </Typography>
              </Box>

              <Grid container spacing={2}>
                {walletTypeOptions.map((option) => {
                  const wallet = wallets.find((item) => item.walletType === option.value);
                  return (
                    <Grid item xs={12} sm={6} lg={3} key={option.value}>
                      <Card
                        elevation={0}
                        sx={{
                          border: "1px solid #dbe4ee",
                          borderRadius: 2,
                          borderTop: "4px solid #066f48",
                          height: "100%",
                        }}
                      >
                        <CardContent>
                          <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={{ mb: 1.2 }}
                          >
                            <Stack direction="row" spacing={1.2} alignItems="center">
                              <Wallet size={18} color="#066f48" />
                              <Typography sx={{ fontWeight: 700 }}>{option.label}</Typography>
                            </Stack>
                            <Chip
                              size="small"
                              label={wallet?.exists ? "Available" : "Will auto-create"}
                              sx={{
                                bgcolor: wallet?.exists ? "#dcfce7" : "#f1f5f9",
                                color: wallet?.exists ? "#166534" : "#334155",
                                fontWeight: 700,
                              }}
                            />
                          </Stack>

                          <Typography variant="h6" sx={{ fontWeight: 800, color: "#0f172a" }}>
                            {formatCurrency(wallet?.balance || 0)}
                          </Typography>
                          <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5 }}>
                            Deposited: {formatCurrency(wallet?.totalDeposited || 0)}
                          </Typography>
                          <Typography variant="body2" sx={{ color: "#64748b" }}>
                            Withdrawn: {formatCurrency(wallet?.totalWithdrawn || 0)}
                          </Typography>

                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => openFundWalletModal(option.value)}
                            className="no-print"
                            sx={{
                              mt: 1.5,
                              width: "100%",
                              textTransform: "none",
                              bgcolor: "#066f48",
                              "&:hover": { bgcolor: "#055a3a" },
                            }}
                          >
                            Fund Wallet
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} lg={6}>
                  <Paper elevation={0} sx={{ border: "1px solid #dbe4ee", borderRadius: 2 }}>
                    <Box sx={{ px: 2, py: 1.4, borderBottom: "1px solid #e2e8f0", bgcolor: "#f8fafc" }}>
                      <Typography sx={{ fontWeight: 700 }}>Operational Finance KPIs</Typography>
                      <Typography variant="caption" sx={{ color: "#64748b" }}>
                        {financeKpis?.period}
                      </Typography>
                    </Box>
                    <Grid container spacing={1.5} sx={{ p: 2 }}>
                      {(financeKpis?.operationalMetrics || []).map((metric) => (
                        <Grid item xs={12} sm={6} key={metric.metric}>
                          <Box
                            sx={{
                              border: "1px solid #dbe4ee",
                              borderRadius: 1.5,
                              p: 1.5,
                              minHeight: 90,
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}
                            >
                              {metric.metric}
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: "#066f48", mt: 0.8 }}>
                              {formatKpiValue(metric)}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>
                </Grid>

                <Grid item xs={12} lg={6}>
                  <Paper elevation={0} sx={{ border: "1px solid #dbe4ee", borderRadius: 2 }}>
                    <Box sx={{ px: 2, py: 1.4, borderBottom: "1px solid #e2e8f0", bgcolor: "#f8fafc" }}>
                      <Typography sx={{ fontWeight: 700 }}>Engagement & Performance KPIs</Typography>
                      <Typography variant="caption" sx={{ color: "#64748b" }}>
                        Updated {financeKpis ? new Date(financeKpis.generatedAt).toLocaleString() : "N/A"}
                      </Typography>
                    </Box>
                    <Grid container spacing={1.5} sx={{ p: 2 }}>
                      {(financeKpis?.engagementMetrics || []).map((metric) => (
                        <Grid item xs={12} sm={6} key={metric.metric}>
                          <Box
                            sx={{
                              border: "1px solid #dbe4ee",
                              borderRadius: 1.5,
                              p: 1.5,
                              minHeight: 90,
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}
                            >
                              {metric.metric}
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: "#066f48", mt: 0.8 }}>
                              {formatKpiValue(metric)}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            </Stack>
          )}

          {tabIndex === 1 && (
            <Stack spacing={2}>
              <Tabs
                value={walletTxTab}
                onChange={(_, value) => setWalletTxTab(value)}
                variant="scrollable"
                sx={{
                  minHeight: 44,
                  "& .MuiTabs-indicator": { backgroundColor: "#066f48" },
                }}
              >
                {walletTypeOptions.map((option) => (
                  <Tab key={option.value} label={option.label} value={option.value} sx={tabSx} />
                ))}
              </Tabs>

              <Typography variant="body2" sx={{ color: "#64748b" }}>
                Transfers table for {activeWalletLabel}. Apply sorting and filters, then export statements.
              </Typography>

              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1.2}
                alignItems={{ xs: "stretch", md: "center" }}
              >
                <TextField
                  size="small"
                  label="Search"
                  placeholder="Reference or description"
                  value={txSearch}
                  onChange={(event) => setTxSearch(event.target.value)}
                  sx={{ minWidth: { xs: "100%", md: 220 } }}
                />
                <TextField
                  select
                  size="small"
                  label="Status"
                  value={txStatus}
                  onChange={(event) => setTxStatus(event.target.value)}
                  sx={{ minWidth: { xs: "100%", md: 160 } }}
                >
                  <MenuItem value="">All</MenuItem>
                  {transactionStatusOptions.map((statusValue) => (
                    <MenuItem key={statusValue} value={statusValue}>
                      {statusValue}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  size="small"
                  label="Sort by"
                  value={txSortBy}
                  onChange={(event) =>
                    setTxSortBy(event.target.value as TransactionSortBy)
                  }
                  sx={{ minWidth: { xs: "100%", md: 150 } }}
                >
                  {transactionSortOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  size="small"
                  label="Order"
                  value={txSortOrder}
                  onChange={(event) =>
                    setTxSortOrder(event.target.value as "asc" | "desc")
                  }
                  sx={{ minWidth: { xs: "100%", md: 130 } }}
                >
                  <MenuItem value="desc">Desc</MenuItem>
                  <MenuItem value="asc">Asc</MenuItem>
                </TextField>
                <Button
                  variant="outlined"
                  startIcon={<Download size={15} />}
                  onClick={() => exportWalletStatementPdf(false)}
                  disabled={walletExporting}
                  sx={{
                    textTransform: "none",
                    borderColor: "#cbd5e1",
                    color: "#1f2937",
                  }}
                >
                  {walletExporting ? "Exporting..." : "Export Wallet PDF"}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<FileDown size={15} />}
                  onClick={() => exportWalletStatementPdf(true)}
                  disabled={walletExporting}
                  sx={{
                    textTransform: "none",
                    borderColor: "#cbd5e1",
                    color: "#1f2937",
                  }}
                >
                  {walletExporting ? "Exporting..." : "Export All Wallets"}
                </Button>
              </Stack>

              <Grid container spacing={1.2}>
                <Grid item xs={6} md={3}>
                  <Card elevation={0} sx={{ border: "1px solid #dbe4ee", borderRadius: 1.5 }}>
                    <CardContent sx={{ py: 1.2 }}>
                      <Typography variant="caption" sx={{ color: "#64748b" }}>
                        Records
                      </Typography>
                      <Typography sx={{ fontWeight: 800 }}>
                        {currentWalletKpis.totalRecords.toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card elevation={0} sx={{ border: "1px solid #dbe4ee", borderRadius: 1.5 }}>
                    <CardContent sx={{ py: 1.2 }}>
                      <Typography variant="caption" sx={{ color: "#64748b" }}>
                        Inflow
                      </Typography>
                      <Typography sx={{ fontWeight: 800, color: "#065f46" }}>
                        {formatCurrency(currentWalletKpis.inflow)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card elevation={0} sx={{ border: "1px solid #dbe4ee", borderRadius: 1.5 }}>
                    <CardContent sx={{ py: 1.2 }}>
                      <Typography variant="caption" sx={{ color: "#64748b" }}>
                        Outflow
                      </Typography>
                      <Typography sx={{ fontWeight: 800, color: "#991b1b" }}>
                        {formatCurrency(currentWalletKpis.outflow)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card elevation={0} sx={{ border: "1px solid #dbe4ee", borderRadius: 1.5 }}>
                    <CardContent sx={{ py: 1.2 }}>
                      <Typography variant="caption" sx={{ color: "#64748b" }}>
                        Net
                      </Typography>
                      <Typography sx={{ fontWeight: 800, color: "#0f172a" }}>
                        {formatCurrency(currentWalletKpis.netMovement)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {txError && <Alert severity="error">{txError}</Alert>}

              <Stack spacing={1.2} sx={{ display: { xs: "flex", md: "none" } }}>
                {txLoading ? (
                  <LeafInlineLoader />
                ) : transactions.length === 0 ? (
                  <Paper
                    elevation={0}
                    sx={{ border: "1px solid #dbe4ee", borderRadius: 2, p: 2, textAlign: "center", color: "#64748b" }}
                  >
                    No transactions found for this wallet type.
                  </Paper>
                ) : (
                  transactions.map((transaction) => (
                    <Paper
                      key={transaction.id}
                      elevation={0}
                      sx={{ border: "1px solid #dbe4ee", borderRadius: 2, p: 1.5 }}
                    >
                      <Typography sx={{ fontSize: 12, color: "#64748b" }}>
                        {new Date(transaction.createdAt).toLocaleString()}
                      </Typography>
                      <Typography sx={{ mt: 0.4, fontWeight: 700, color: "#0f172a", wordBreak: "break-all" }}>
                        {transaction.reference}
                      </Typography>
                      <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                        <Typography sx={{ fontSize: 13, textTransform: "capitalize", color: "#334155" }}>
                          {transaction.type.replace(/_/g, " ")}
                        </Typography>
                        <Chip
                          size="small"
                          label={transaction.status}
                          sx={{
                            textTransform: "capitalize",
                            bgcolor:
                              transaction.status === "completed"
                                ? "#dcfce7"
                                : transaction.status === "failed"
                                ? "#fee2e2"
                                : "#e2e8f0",
                            color:
                              transaction.status === "completed"
                                ? "#166534"
                                : transaction.status === "failed"
                                ? "#b91c1c"
                                : "#1e293b",
                            fontWeight: 700,
                          }}
                        />
                      </Stack>
                      <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.8 }}>
                        <Typography sx={{ fontSize: 13, color: "#64748b" }}>Amount</Typography>
                        <Typography sx={{ fontSize: 14, color: "#066f48", fontWeight: 800 }}>
                          {formatCurrency(transaction.amount)}
                        </Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                        <Typography sx={{ fontSize: 13, color: "#64748b" }}>Balance After</Typography>
                        <Typography sx={{ fontSize: 13, color: "#334155", fontWeight: 700 }}>
                          {formatCurrency(transaction.balanceAfter)}
                        </Typography>
                      </Stack>
                    </Paper>
                  ))
                )}
              </Stack>

              <TableContainer
                component={Paper}
                elevation={0}
                sx={{ border: "1px solid #dbe4ee", overflowX: "auto", display: { xs: "none", md: "block" } }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Reference</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Balance After</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {txLoading ? (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <LeafInlineLoader />
                        </TableCell>
                      </TableRow>
                    ) : transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <Typography sx={{ py: 2, textAlign: "center", color: "#64748b" }}>
                            No transactions found for this wallet type.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            {new Date(transaction.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell>{transaction.reference}</TableCell>
                          <TableCell sx={{ textTransform: "capitalize" }}>
                            {transaction.type.replace(/_/g, " ")}
                          </TableCell>
                          <TableCell sx={{ color: "#066f48", fontWeight: 700 }}>
                            {formatCurrency(transaction.amount)}
                          </TableCell>
                          <TableCell>{formatCurrency(transaction.balanceAfter)}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={transaction.status}
                              sx={{
                                textTransform: "capitalize",
                                bgcolor:
                                  transaction.status === "completed"
                                    ? "#dcfce7"
                                    : transaction.status === "failed"
                                    ? "#fee2e2"
                                    : "#e2e8f0",
                                color:
                                  transaction.status === "completed"
                                    ? "#166534"
                                    : transaction.status === "failed"
                                    ? "#b91c1c"
                                    : "#1e293b",
                                fontWeight: 700,
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component="div"
                count={txTotal}
                page={txPage}
                onPageChange={(_, nextPage) => setTxPage(nextPage)}
                rowsPerPage={txRowsPerPage}
                onRowsPerPageChange={(event) => {
                  setTxRowsPerPage(parseInt(event.target.value, 10));
                  setTxPage(0);
                }}
                rowsPerPageOptions={[10, 25, 50, 100]}
                sx={{
                  border: "1px solid #dbe4ee",
                  borderRadius: 2,
                  "& .MuiTablePagination-toolbar": { px: 1.5, flexWrap: "wrap", gap: 0.5 },
                }}
              />
            </Stack>
          )}

          {tabIndex === 2 && (
            <Stack spacing={2}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                alignItems={{ xs: "flex-start", md: "center" }}
                justifyContent="space-between"
                spacing={1.2}
              >
                <Box>
                  <Typography variant="h6" sx={sectionTitleSx}>
                    Farmers Wallet Management
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#64748b" }}>
                    Sort and export executive transaction statements for a single farmer or all farmers.
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<FileDown size={15} />}
                  onClick={() => exportFarmerTransactionStatement()}
                  disabled={statementExporting}
                  sx={{
                    textTransform: "none",
                    borderColor: "#cbd5e1",
                    color: "#1f2937",
                  }}
                >
                  {statementExporting ? "Exporting..." : "Export All Farmers Statement"}
                </Button>
              </Stack>

              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1.2}
                alignItems={{ xs: "stretch", md: "center" }}
              >
                <TextField
                  select
                  size="small"
                  label="Status"
                  value={statementStatus}
                  onChange={(event) => setStatementStatus(event.target.value)}
                  sx={{ minWidth: { xs: "100%", md: 160 } }}
                >
                  <MenuItem value="">All</MenuItem>
                  {transactionStatusOptions.map((statusValue) => (
                    <MenuItem key={statusValue} value={statusValue}>
                      {statusValue}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  size="small"
                  label="Type"
                  value={statementType}
                  onChange={(event) => setStatementType(event.target.value)}
                  sx={{ minWidth: { xs: "100%", md: 220 } }}
                >
                  <MenuItem value="">All</MenuItem>
                  {exportTypeOptions.map((typeOption) => (
                    <MenuItem key={typeOption} value={typeOption}>
                      {typeOption.replace(/_/g, " ")}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  size="small"
                  label="Sort by"
                  value={statementSortBy}
                  onChange={(event) =>
                    setStatementSortBy(event.target.value as TransactionSortBy)
                  }
                  sx={{ minWidth: { xs: "100%", md: 150 } }}
                >
                  {transactionSortOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  size="small"
                  label="Order"
                  value={statementSortOrder}
                  onChange={(event) =>
                    setStatementSortOrder(event.target.value as "asc" | "desc")
                  }
                  sx={{ minWidth: { xs: "100%", md: 130 } }}
                >
                  <MenuItem value="desc">Desc</MenuItem>
                  <MenuItem value="asc">Asc</MenuItem>
                </TextField>
                <TextField
                  size="small"
                  label="Max records"
                  type="number"
                  value={statementLimit}
                  onChange={(event) =>
                    setStatementLimit(Math.max(50, Number(event.target.value || 500)))
                  }
                  inputProps={{ min: 50, max: 5000 }}
                  sx={{ minWidth: { xs: "100%", md: 140 } }}
                />
              </Stack>
              {farmersError && <Alert severity="error">{farmersError}</Alert>}
              <Stack spacing={1.2} sx={{ display: { xs: "flex", md: "none" } }}>
                {farmersLoading ? (
                  <LeafInlineLoader />
                ) : farmers.length === 0 ? (
                  <Paper
                    elevation={0}
                    sx={{ border: "1px solid #dbe4ee", borderRadius: 2, p: 2, textAlign: "center", color: "#64748b" }}
                  >
                    No farmers found.
                  </Paper>
                ) : (
                  farmers.map((farmer) => (
                    <Paper
                      key={farmer.id}
                      elevation={0}
                      sx={{ border: "1px solid #dbe4ee", borderRadius: 2, p: 1.5 }}
                    >
                      <Typography sx={{ fontWeight: 700, color: "#0f172a" }}>
                        {(farmer.fullName || farmer.name || "").toUpperCase()}
                      </Typography>
                      <Typography sx={{ mt: 0.2, fontSize: 13, color: "#64748b" }}>{farmer.phone}</Typography>
                      <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                        <Typography sx={{ fontSize: 13, color: "#64748b" }}>
                          {(farmer.lga || "N/A").toUpperCase()}
                        </Typography>
                        <Typography sx={{ fontSize: 14, color: "#066f48", fontWeight: 800 }}>
                          {formatCurrency(farmer.walletBalance)}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} sx={{ mt: 1.2 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          fullWidth
                          onClick={() => openFarmerWalletModal(farmer, "fund")}
                          sx={{ textTransform: "none", borderColor: "#066f48", color: "#066f48" }}
                        >
                          Fund
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          fullWidth
                          onClick={() => openFarmerWalletModal(farmer, "withdraw")}
                          sx={{ textTransform: "none", borderColor: "#b45309", color: "#b45309" }}
                        >
                          Withdraw
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          fullWidth
                          onClick={() => exportFarmerTransactionStatement(farmer)}
                          disabled={statementExporting}
                          sx={{ textTransform: "none", borderColor: "#0f172a", color: "#0f172a" }}
                        >
                          Statement
                        </Button>
                      </Stack>
                    </Paper>
                  ))
                )}
                <TablePagination
                  component="div"
                  count={farmersTotal}
                  page={farmerPage}
                  onPageChange={(_, nextPage) => setFarmerPage(nextPage)}
                  rowsPerPage={farmerRowsPerPage}
                  onRowsPerPageChange={(event) => {
                    setFarmerRowsPerPage(parseInt(event.target.value, 10));
                    setFarmerPage(0);
                  }}
                  rowsPerPageOptions={[10, 20, 50]}
                  sx={{
                    border: "1px solid #dbe4ee",
                    borderRadius: 2,
                    "& .MuiTablePagination-toolbar": { px: 1, flexWrap: "wrap", gap: 0.5 },
                    "& .MuiTablePagination-displayedRows": { m: 0, fontSize: 12 },
                  }}
                />
              </Stack>
              <TableContainer
                component={Paper}
                elevation={0}
                sx={{ border: "1px solid #dbe4ee", overflowX: "auto", display: { xs: "none", md: "block" } }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Farmer</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>LGA</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Wallet Balance</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {farmersLoading ? (
                      <TableRow>
                        <TableCell colSpan={5}>
                          <LeafInlineLoader />
                        </TableCell>
                      </TableRow>
                    ) : farmers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5}>
                          <Typography sx={{ py: 2, textAlign: "center", color: "#64748b" }}>
                            No farmers found.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      farmers.map((farmer) => (
                        <TableRow key={farmer.id}>
                          <TableCell>{(farmer.fullName || farmer.name || "").toUpperCase()}</TableCell>
                          <TableCell>{farmer.phone}</TableCell>
                          <TableCell>{(farmer.lga || "N/A").toUpperCase()}</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: "#066f48" }}>
                            {formatCurrency(farmer.walletBalance)}
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => openFarmerWalletModal(farmer, "fund")}
                                sx={{ textTransform: "none", borderColor: "#066f48", color: "#066f48" }}
                              >
                                Fund
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => openFarmerWalletModal(farmer, "withdraw")}
                                sx={{ textTransform: "none", borderColor: "#b45309", color: "#b45309" }}
                              >
                                Withdraw
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => exportFarmerTransactionStatement(farmer)}
                                disabled={statementExporting}
                                sx={{ textTransform: "none", borderColor: "#0f172a", color: "#0f172a" }}
                              >
                                Statement
                              </Button>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                <TablePagination
                  component="div"
                  count={farmersTotal}
                  page={farmerPage}
                  onPageChange={(_, nextPage) => setFarmerPage(nextPage)}
                  rowsPerPage={farmerRowsPerPage}
                  onRowsPerPageChange={(event) => {
                    setFarmerRowsPerPage(parseInt(event.target.value, 10));
                    setFarmerPage(0);
                  }}
                  rowsPerPageOptions={[10, 20, 50]}
                  sx={{
                    "& .MuiTablePagination-toolbar": { px: 1.5, flexWrap: "wrap", gap: 0.5 },
                  }}
                />
              </TableContainer>
            </Stack>
          )}

          {tabIndex === 3 && (
            <Stack spacing={2}>
              <Typography variant="h6" sx={sectionTitleSx}>
                Staff Directory
              </Typography>
              {staffError && <Alert severity="error">{staffError}</Alert>}
              <Stack spacing={1.2} sx={{ display: { xs: "flex", md: "none" } }}>
                {staffLoading ? (
                  <LeafInlineLoader />
                ) : staff.length === 0 ? (
                  <Paper
                    elevation={0}
                    sx={{ border: "1px solid #dbe4ee", borderRadius: 2, p: 2, textAlign: "center", color: "#64748b" }}
                  >
                    No staff found.
                  </Paper>
                ) : (
                  staff.map((member) => (
                    <Paper
                      key={member.id}
                      elevation={0}
                      sx={{ border: "1px solid #dbe4ee", borderRadius: 2, p: 1.5 }}
                    >
                      <Typography sx={{ fontWeight: 700, color: "#0f172a" }}>
                        {(member.fullName || `${member.firstName} ${member.lastName}` || "").toUpperCase()}
                      </Typography>
                      <Typography sx={{ mt: 0.2, fontSize: 13, color: "#64748b" }}>{member.phone}</Typography>
                      <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                        <Typography sx={{ fontSize: 13, color: "#334155" }}>
                          {(member.role || "N/A").toUpperCase()}
                        </Typography>
                        <Typography sx={{ fontSize: 13, color: "#334155" }}>
                          {(member.department || "N/A").toUpperCase()}
                        </Typography>
                      </Stack>
                      <Chip
                        size="small"
                        label={member.status || "active"}
                        sx={{
                          mt: 1,
                          textTransform: "capitalize",
                          bgcolor:
                            (member.status || "active") === "active"
                              ? "#dcfce7"
                              : "#e2e8f0",
                          color:
                            (member.status || "active") === "active"
                              ? "#166534"
                              : "#1e293b",
                          fontWeight: 700,
                        }}
                      />
                    </Paper>
                  ))
                )}
                <TablePagination
                  component="div"
                  count={staffTotal}
                  page={staffPage}
                  onPageChange={(_, nextPage) => setStaffPage(nextPage)}
                  rowsPerPage={staffRowsPerPage}
                  onRowsPerPageChange={(event) => {
                    setStaffRowsPerPage(parseInt(event.target.value, 10));
                    setStaffPage(0);
                  }}
                  rowsPerPageOptions={[10, 20, 50]}
                  sx={{
                    border: "1px solid #dbe4ee",
                    borderRadius: 2,
                    "& .MuiTablePagination-toolbar": { px: 1, flexWrap: "wrap", gap: 0.5 },
                    "& .MuiTablePagination-displayedRows": { m: 0, fontSize: 12 },
                  }}
                />
              </Stack>
              <TableContainer
                component={Paper}
                elevation={0}
                sx={{ border: "1px solid #dbe4ee", overflowX: "auto", display: { xs: "none", md: "block" } }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Staff</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {staffLoading ? (
                      <TableRow>
                        <TableCell colSpan={5}>
                          <LeafInlineLoader />
                        </TableCell>
                      </TableRow>
                    ) : staff.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5}>
                          <Typography sx={{ py: 2, textAlign: "center", color: "#64748b" }}>
                            No staff found.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      staff.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell>
                            {(member.fullName || `${member.firstName} ${member.lastName}` || "").toUpperCase()}
                          </TableCell>
                          <TableCell>{member.phone}</TableCell>
                          <TableCell>{(member.role || "N/A").toUpperCase()}</TableCell>
                          <TableCell>{(member.department || "N/A").toUpperCase()}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={member.status || "active"}
                              sx={{
                                textTransform: "capitalize",
                                bgcolor:
                                  (member.status || "active") === "active"
                                    ? "#dcfce7"
                                    : "#e2e8f0",
                                color:
                                  (member.status || "active") === "active"
                                    ? "#166534"
                                    : "#1e293b",
                                fontWeight: 700,
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                <TablePagination
                  component="div"
                  count={staffTotal}
                  page={staffPage}
                  onPageChange={(_, nextPage) => setStaffPage(nextPage)}
                  rowsPerPage={staffRowsPerPage}
                  onRowsPerPageChange={(event) => {
                    setStaffRowsPerPage(parseInt(event.target.value, 10));
                    setStaffPage(0);
                  }}
                  rowsPerPageOptions={[10, 20, 50]}
                  sx={{
                    "& .MuiTablePagination-toolbar": { px: 1.5, flexWrap: "wrap", gap: 0.5 },
                  }}
                />
              </TableContainer>
            </Stack>
          )}
        </Box>
      </Paper>

      <Dialog open={fundModalOpen} onClose={() => setFundModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>Fund Organization Wallet</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.6 }}>
            <TextField
              select
              label="Wallet"
              value={fundWalletType}
              onChange={(event) => setFundWalletType(event.target.value as OrganizationWalletType)}
            >
              {walletTypeOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Amount (₦)"
              type="number"
              value={fundAmount || ""}
              onChange={(event) => setFundAmount(Number(event.target.value))}
              inputProps={{ min: 1000 }}
            />
            <TextField
              label="Reason (optional)"
              value={fundReason}
              onChange={(event) => setFundReason(event.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFundModalOpen(false)} disabled={fundSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={submitFundWallet}
            disabled={fundSubmitting}
            variant="contained"
            sx={{ bgcolor: "#066f48", "&:hover": { bgcolor: "#055a3a" } }}
          >
            {fundSubmitting ? "Funding..." : "Fund Wallet"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(selectedFarmer)} onClose={closeFarmerWalletModal} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>
          {walletActionMode === "fund" ? "Fund Farmer Wallet" : "Withdraw Farmer Wallet"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.6 }}>
            <Typography variant="body2" sx={{ color: "#334155" }}>
              Farmer: <strong>{(selectedFarmer?.fullName || selectedFarmer?.name || "").toUpperCase()}</strong>
            </Typography>
            <Typography variant="body2" sx={{ color: "#334155" }}>
              Current Balance:{" "}
              <strong>{formatCurrency(selectedFarmer?.walletBalance || 0)}</strong>
            </Typography>
            <TextField
              label="Amount (₦)"
              type="number"
              value={walletActionAmount || ""}
              onChange={(event) => setWalletActionAmount(Number(event.target.value))}
              inputProps={{ min: 100 }}
            />
            <TextField
              label="Reason"
              value={walletActionReason}
              onChange={(event) => setWalletActionReason(event.target.value)}
              multiline
              minRows={2}
            />
            {walletActionError && <Alert severity="error">{walletActionError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeFarmerWalletModal} disabled={walletActionSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={submitFarmerWalletAction}
            disabled={walletActionSubmitting}
            variant="contained"
            sx={{
              bgcolor: walletActionMode === "fund" ? "#066f48" : "#b45309",
              "&:hover": {
                bgcolor: walletActionMode === "fund" ? "#055a3a" : "#92400e",
              },
            }}
          >
            {walletActionSubmitting
              ? "Processing..."
              : walletActionMode === "fund"
              ? "Fund Wallet"
              : "Withdraw"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FinanceView;
