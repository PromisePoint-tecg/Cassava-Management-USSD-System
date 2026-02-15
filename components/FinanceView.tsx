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
import { FileDown, RefreshCw, Wallet } from "lucide-react";
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

const formatKpiValue = (metric: FinanceKpiMetric) => {
  if (metric.unit === "percent") return `${metric.value.toFixed(2)}%`;
  if (metric.unit === "count") return Math.round(metric.value).toLocaleString();
  return formatCurrency(metric.value);
};

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
        page: 1,
        limit: 50,
        walletType: walletTxTab,
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
      });
      setTransactions(result.transactions || []);
    } catch (err: any) {
      setTxError(err?.message || "Failed to load wallet transactions");
      setTransactions([]);
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
  }, [tabIndex, walletTxTab, startDate, endDate]);

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
    <Box ref={financePageRef} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, p: 2.5 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a" }}>
              Finance Operations
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748b" }}>
              Wallet control center, finance KPIs, and farmer/staff financial actions
            </Typography>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} className="no-print">
            <TextField
              label="Start date"
              type="date"
              size="small"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End date"
              type="date"
              size="small"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Button
              variant="outlined"
              startIcon={<RefreshCw size={16} />}
              onClick={loadFinanceData}
              sx={{
                textTransform: "none",
                borderColor: "#cbd5e1",
                color: "#1f2937",
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
                Showing up to 50 latest transactions for {activeWalletLabel}.
              </Typography>

              {txError && <Alert severity="error">{txError}</Alert>}

              <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #dbe4ee" }}>
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
            </Stack>
          )}

          {tabIndex === 2 && (
            <Stack spacing={2}>
              <Typography variant="h6" sx={sectionTitleSx}>
                Farmers Wallet Management
              </Typography>
              {farmersError && <Alert severity="error">{farmersError}</Alert>}
              <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #dbe4ee" }}>
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
              <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #dbe4ee" }}>
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
