import React, { useState, useEffect, useRef } from 'react';
import { 
  Users,
  GraduationCap,
  Eye, 
  UserX, 
  UserCheck,
  X, 
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  FileDown,
  RotateCcw,
  Printer,
  PlusCircle,
} from 'lucide-react';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {
  farmersApi,
  Farmer,
  FarmerDetail,
  FarmerDashboardKpiRow,
  FarmerDashboardKpiTable,
  GetAllFarmersParams,
  UserFinancialDetails,
} from '../services/farmers';
import LeafInlineLoader from './Loader';

type StatementSectionKey =
  | 'personal'
  | 'wallet'
  | 'loans'
  | 'transactions'
  | 'purchases'
  | 'sessions'
  | 'activity';

type StatementSectionFilterState = Record<StatementSectionKey, boolean>;

const createDefaultStatementSectionFilters = (): StatementSectionFilterState => ({
  personal: true,
  wallet: true,
  loans: true,
  transactions: true,
  purchases: true,
  sessions: true,
  activity: true,
});

const statementSectionOptions: Array<{
  key: StatementSectionKey;
  label: string;
  description: string;
}> = [
  {
    key: 'personal',
    label: 'Personal Profile',
    description: 'Student farmer identity and registration profile details',
  },
  {
    key: 'wallet',
    label: 'Wallet Information',
    description: 'Wallet balance, account details and management section',
  },
  {
    key: 'loans',
    label: 'Loan Information',
    description: 'Outstanding loans and repayment progress',
  },
  {
    key: 'transactions',
    label: 'Recent Transactions',
    description: 'Latest wallet and loan related transactions',
  },
  {
    key: 'purchases',
    label: 'Recent Purchases',
    description: 'Recent cassava purchase records',
  },
  {
    key: 'sessions',
    label: 'USSD Sessions',
    description: 'Recent student farmer USSD session activity',
  },
  {
    key: 'activity',
    label: 'Account Activity',
    description: 'Member timeline and account status history',
  },
];

export const StudentFarmersDirectory: React.FC = () => {
  const farmersPageRef = useRef<HTMLDivElement>(null);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpiFilterError, setKpiFilterError] = useState<string | null>(null);
  const [lgaFilter, setLgaFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'suspended'>('all');
  const [kpiStartDate, setKpiStartDate] = useState('');
  const [kpiEndDate, setKpiEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [kpiTable, setKpiTable] = useState<FarmerDashboardKpiTable | null>(null);
  
  // Modal states
  const [viewingFarmer, setViewingFarmer] = useState<FarmerDetail | null>(null);
  const [viewingFarmerFinancial, setViewingFarmerFinancial] = useState<UserFinancialDetails | null>(null);
  const [deactivatingFarmer, setDeactivatingFarmer] = useState<Farmer | null>(null);
  const [suspendingFarmer, setSuspendingFarmer] = useState<Farmer | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [loadingFarmerStatement, setLoadingFarmerStatement] = useState(false);
  const [statementSectionFilters, setStatementSectionFilters] =
    useState<StatementSectionFilterState>(createDefaultStatementSectionFilters);
  
  // Action loading states
  const [loadingAction, setLoadingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [showAddAccountForm, setShowAddAccountForm] = useState(false);
  const [settingAccount, setSettingAccount] = useState(false);
  const [addAccountForm, setAddAccountForm] = useState({
    bankName: '',
    bankCode: '',
    accountNumber: '',
    accountName: '',
  });

  // Fetch farmers and KPI summary together
  const loadFarmersData = async () => {
    try {
      setLoading(true);
      setError(null);
      setKpiFilterError(null);
      
      const params: GetAllFarmersParams = {
        page: currentPage,
        limit: 10,
      };
      
      if (lgaFilter) params.lga = lgaFilter;
      if (statusFilter !== 'all') params.status = statusFilter;

      const hasInvalidDateRange =
        Boolean(kpiStartDate) &&
        Boolean(kpiEndDate) &&
        new Date(kpiStartDate) > new Date(kpiEndDate);

      const dashboardKpiFilters = {
        ...(kpiStartDate ? { startDate: kpiStartDate } : {}),
        ...(kpiEndDate ? { endDate: kpiEndDate } : {}),
      };

      const [farmersResult, kpiResult] = await Promise.allSettled([
        farmersApi.getAllStudentFarmers(params),
        hasInvalidDateRange
          ? Promise.resolve<FarmerDashboardKpiTable | null>(null)
          : farmersApi.getStudentFarmerDashboardKpiTable(dashboardKpiFilters),
      ]);

      if (farmersResult.status === 'rejected') {
        throw farmersResult.reason;
      }

      setFarmers(farmersResult.value.farmers);
      setTotalPages(farmersResult.value.totalPages);
      setTotal(farmersResult.value.total);

      if (hasInvalidDateRange) {
        setKpiTable(null);
        setKpiFilterError('KPI date range is invalid. Start date cannot be after end date.');
      } else if (kpiResult.status === 'fulfilled' && kpiResult.value) {
        setKpiTable(kpiResult.value);
      } else {
        setKpiTable(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch student farmers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFarmersData();
  }, [currentPage, statusFilter, lgaFilter, kpiStartDate, kpiEndDate]);

  const clearKpiDateFilter = () => {
    setKpiStartDate('');
    setKpiEndDate('');
  };

  const closeViewingFarmerModal = () => {
    setViewingFarmer(null);
    setViewingFarmerFinancial(null);
    setStatementSectionFilters(createDefaultStatementSectionFilters());
    setActionError(null);
    setActionSuccess(null);
    setShowAddAccountForm(false);
    setAddAccountForm({
      bankName: '',
      bankCode: '',
      accountNumber: '',
      accountName: '',
    });
  };

  const exportFarmersPagePdf = () => {
    if (!farmersPageRef.current) {
      return;
    }

    const html = farmersPageRef.current.outerHTML;
    const styleTags = Array.from(
      document.querySelectorAll('style, link[rel="stylesheet"]'),
    )
      .map((el) => el.outerHTML)
      .join('\n');

    const printWindow = window.open('', '_blank', 'width=1280,height=900');
    if (!printWindow) {
      return;
    }

    printWindow.document.open();
    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Student Farmers KPI Dashboard Export</title>
          ${styleTags}
          <style>
            body { background: white; margin: 0; padding: 16px; }
            .no-print { display: none !important; }
          </style>
        </head>
        <body>
          ${html}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 700);
  };

  // View farmer details
  const handleViewFarmer = async (farmer: Farmer) => {
    try {
      setActionError(null);
      setActionSuccess(null);
      setLoadingFarmerStatement(true);
      const [detailsResult, financialResult] = await Promise.allSettled([
        farmersApi.getFarmerById(farmer.id),
        farmersApi.getFarmerFinancialStatus(farmer.userId),
      ]);

      if (detailsResult.status === 'rejected') {
        throw detailsResult.reason;
      }

      setViewingFarmer(detailsResult.value);
      setAddAccountForm({
        bankName: detailsResult.value.walletBankName || '',
        bankCode: detailsResult.value.walletBankCode || '',
        accountNumber: detailsResult.value.walletAccountNumber || '',
        accountName: detailsResult.value.walletAccountName || detailsResult.value.fullName || '',
      });
      setShowAddAccountForm(false);

      if (financialResult.status === 'fulfilled') {
        setViewingFarmerFinancial(financialResult.value);
      } else {
        setViewingFarmerFinancial(null);
        setActionError(
          'Farmer profile loaded, but some statement data could not be retrieved.',
        );
      }

      setStatementSectionFilters(createDefaultStatementSectionFilters());
    } catch (err: any) {
      setActionError(err.message || 'Failed to fetch farmer details');
    } finally {
      setLoadingFarmerStatement(false);
    }
  };

  // Deactivate farmer
  const handleDeactivateFarmer = async () => {
    if (!deactivatingFarmer) return;

    try {
      setLoadingAction(true);
      setActionError(null);
      
      await farmersApi.deactivateFarmer(deactivatingFarmer.id);
      setDeactivatingFarmer(null);
      loadFarmersData(); // Refresh list + KPIs
    } catch (err: any) {
      setActionError(err.message || 'Failed to deactivate farmer');
    } finally {
      setLoadingAction(false);
    }
  };

  // Activate farmer
  const handleActivateFarmer = async (farmer: Farmer) => {
    try {
      setLoadingAction(true);
      setActionError(null);
      
      await farmersApi.activateFarmer(farmer.id);
      loadFarmersData(); // Refresh list + KPIs
    } catch (err: any) {
      setActionError(err.message || 'Failed to activate farmer');
    } finally {
      setLoadingAction(false);
    }
  };

  // Suspend farmer
  const handleSuspendFarmer = async () => {
    if (!suspendingFarmer || !suspensionReason.trim()) {
      setActionError('Please provide a reason for suspension');
      return;
    }

    try {
      setLoadingAction(true);
      setActionError(null);
      
      await farmersApi.suspendFarmer(suspendingFarmer.id, suspensionReason);
      
      setSuspendingFarmer(null);
      setSuspensionReason('');
      closeViewingFarmerModal();
      loadFarmersData(); // Refresh list + KPIs
    } catch (err: any) {
      setActionError(err.message || 'Failed to suspend farmer');
    } finally {
      setLoadingAction(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₦${(amount / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  };

  const formatNaira = (amount: number) => {
    return `₦${Number(amount || 0).toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateValue: string | Date) => {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateValue: string | Date) => {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-gray-100 text-gray-700',
      suspended: 'bg-yellow-100 text-yellow-700',
      banned: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${statusColors[status] || 'bg-gray-100 text-gray-700'}`}>
        {status}
      </span>
    );
  };

  const desiredKpiOrder = [
    'Total Registered Student Farmers',
    'New Student Registrations (This Period)',
    'Monthly Active Student Farmers (MAU)',
    'Daily Active Student Farmers (DAU)',
    'Repeat Usage Rate',
    '% Women Student Farmers',
    'Student Session Completion Rate',
    'Average Session Time',
    'Student Account Statements',
  ];

  const farmerKpiRows: FarmerDashboardKpiRow[] = desiredKpiOrder
    .map((label) => kpiTable?.rows?.find((row) => row.kpi === label))
    .filter((row): row is FarmerDashboardKpiRow => Boolean(row));

  const formatKpiValue = (value: number, unit: FarmerDashboardKpiRow['unit']) => {
    if (unit === 'percent') {
      return `${value.toFixed(2)}%`;
    }
    if (unit === 'minutes') {
      return `${value.toFixed(2)} mins`;
    }
    return Math.round(value).toLocaleString();
  };

  const getKpiUnitLabel = (unit: FarmerDashboardKpiRow['unit']) => {
    if (unit === 'percent') return 'Percentage';
    if (unit === 'minutes') return 'Minutes';
    return 'Count';
  };

  const statementSectionCount = Object.values(statementSectionFilters).filter(
    Boolean,
  ).length;

  const toggleStatementSection = (sectionKey: StatementSectionKey) => {
    setStatementSectionFilters((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const selectAllStatementSections = () => {
    setStatementSectionFilters({
      personal: true,
      wallet: true,
      loans: true,
      transactions: true,
      purchases: true,
      sessions: true,
      activity: true,
    });
  };

  const clearStatementSections = () => {
    setStatementSectionFilters({
      personal: false,
      wallet: false,
      loans: false,
      transactions: false,
      purchases: false,
      sessions: false,
      activity: false,
    });
  };

  const toFarmerPayload = (farmerDetail: FarmerDetail): Farmer => ({
    id: farmerDetail.id,
    userId: farmerDetail.userId,
    firstName: farmerDetail.firstName,
    lastName: farmerDetail.lastName,
    fullName: farmerDetail.fullName,
    name: farmerDetail.fullName,
    phone: farmerDetail.phone,
    lga: farmerDetail.lga,
    status: farmerDetail.status,
    farmSizeHectares: farmerDetail.farmSizeHectares,
    walletBalance: farmerDetail.walletBalance,
    totalSales: farmerDetail.totalSales,
    totalEarnings: farmerDetail.totalEarnings,
    completedSales: farmerDetail.completedSales,
    loanDefaults: farmerDetail.loanDefaults,
    activeLoan: farmerDetail.activeLoan,
    createdAt: farmerDetail.createdAt,
    updatedAt: farmerDetail.updatedAt,
  });

  const handleSetFarmerWithdrawalAccount = async () => {
    if (!viewingFarmer) return;

    const bankName = addAccountForm.bankName.trim();
    const bankCode = addAccountForm.bankCode.trim();
    const accountNumber = addAccountForm.accountNumber.trim();
    const accountName = addAccountForm.accountName.trim();

    if (!bankName || !bankCode || !accountNumber || !accountName) {
      setActionError('Bank name, bank code, account number and account name are required.');
      return;
    }

    if (!/^\d{10}$/.test(accountNumber)) {
      setActionError('Account number must be exactly 10 digits.');
      return;
    }

    try {
      setSettingAccount(true);
      setActionError(null);
      setActionSuccess(null);

      const response = await farmersApi.setFarmerWithdrawalAccount({
        userId: viewingFarmer.userId,
        bankName,
        bankCode,
        accountNumber,
        accountName,
      });

      const updatedWallet = response.wallet;
      setViewingFarmer((prev) =>
        prev
          ? {
              ...prev,
              walletBankName: updatedWallet.bankName,
              walletBankCode: updatedWallet.bankCode || bankCode,
              walletAccountNumber: updatedWallet.accountNumber,
              walletAccountName: updatedWallet.accountName,
            }
          : prev,
      );

      setActionSuccess('Withdrawal account saved successfully.');
      setShowAddAccountForm(false);
      await loadFarmersData();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to set withdrawal account.');
    } finally {
      setSettingAccount(false);
    }
  };

  const printFarmerStatement = () => {
    if (!viewingFarmer) {
      return;
    }

    if (statementSectionCount === 0) {
      setActionError('Select at least one statement section to print.');
      return;
    }

    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    const safe = (value?: string | null) => escapeHtml(value || 'N/A');
    const selectedSections = statementSectionOptions
      .filter((option) => statementSectionFilters[option.key])
      .map((option) => option.label)
      .join(', ');

    const outstandingLoans = viewingFarmerFinancial?.outstandingLoans || [];
    const recentTransactions = viewingFarmerFinancial?.recentTransactions || [];
    const recentPurchases = viewingFarmerFinancial?.recentPurchases || [];
    const recentUssdSessions = viewingFarmerFinancial?.recentUssdSessions || [];

    const sectionHtml: string[] = [];

    if (statementSectionFilters.personal) {
      sectionHtml.push(`
        <section class="section">
          <h2>Personal Profile</h2>
          <table class="meta-table">
            <tr><td>Full Name</td><td>${safe(viewingFarmer.fullName.toUpperCase())}</td></tr>
            <tr><td>Phone Number</td><td>${safe(viewingFarmer.phone)}</td></tr>
            <tr><td>LGA</td><td>${safe(viewingFarmer.lga.toUpperCase())}</td></tr>
            <tr><td>Farm Size</td><td>${viewingFarmer.farmSizeHectares} hectares</td></tr>
            <tr><td>Status</td><td>${safe(viewingFarmer.status)}</td></tr>
          </table>
        </section>
      `);
    }

    if (statementSectionFilters.wallet) {
      sectionHtml.push(`
        <section class="section">
          <h2>Wallet Information</h2>
          <table class="meta-table">
            <tr><td>Wallet Balance</td><td>${formatNaira(viewingFarmer.walletBalance || 0)}</td></tr>
            <tr><td>Savings Wallet Balance</td><td>${formatCurrency(viewingFarmerFinancial?.wallet?.savingsBalance || 0)}</td></tr>
            <tr><td>Savings Percentage</td><td>${viewingFarmerFinancial?.wallet?.savingsPercentage !== null && viewingFarmerFinancial?.wallet?.savingsPercentage !== undefined ? `${viewingFarmerFinancial.wallet.savingsPercentage}%` : 'N/A'}</td></tr>
            <tr><td>Wallet Status</td><td>${viewingFarmerFinancial?.wallet?.isActive ? 'Active' : 'Inactive'}</td></tr>
            <tr><td>Bank Name</td><td>${safe(viewingFarmer.walletBankName || 'N/A')}</td></tr>
            <tr><td>Account Number</td><td>${safe(viewingFarmer.walletAccountNumber || 'N/A')}</td></tr>
            <tr><td>Account Name</td><td>${safe(viewingFarmer.walletAccountName || 'N/A')}</td></tr>
          </table>
        </section>
      `);
    }

    if (statementSectionFilters.loans) {
      sectionHtml.push(`
        <section class="section">
          <h2>Outstanding Loans</h2>
          <table class="data-table">
            <thead>
              <tr>
                <th>Loan ID</th>
                <th>Principal</th>
                <th>Total Repayment</th>
                <th>Amount Paid</th>
                <th>Outstanding</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${
                outstandingLoans.length > 0
                  ? outstandingLoans
                      .map(
                        (loan) => `
                          <tr>
                            <td>${safe(loan.id.slice(0, 10))}...</td>
                            <td>${formatCurrency(loan.principalAmount || 0)}</td>
                            <td>${formatCurrency(loan.totalRepayment || 0)}</td>
                            <td>${formatCurrency(loan.amountPaid || 0)}</td>
                            <td>${formatCurrency(loan.amountOutstanding || 0)}</td>
                            <td>${safe(loan.status)}</td>
                          </tr>
                        `,
                      )
                      .join('')
                  : '<tr><td colspan="6" class="empty">No outstanding loans available.</td></tr>'
              }
            </tbody>
          </table>
        </section>
      `);
    }

    if (statementSectionFilters.transactions) {
      sectionHtml.push(`
        <section class="section">
          <h2>Recent Transactions</h2>
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Description</th>
                <th>Status</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${
                recentTransactions.length > 0
                  ? recentTransactions
                      .map(
                        (transaction) => `
                          <tr>
                            <td>${formatDateTime(transaction.createdAt)}</td>
                            <td>${safe(transaction.type.replace('_', ' '))}</td>
                            <td>${safe(transaction.description || 'N/A')}</td>
                            <td>${safe(transaction.status)}</td>
                            <td>${formatNaira(transaction.amount || 0)}</td>
                          </tr>
                        `,
                      )
                      .join('')
                  : '<tr><td colspan="5" class="empty">No transactions in this period.</td></tr>'
              }
            </tbody>
          </table>
        </section>
      `);
    }

    if (statementSectionFilters.purchases) {
      sectionHtml.push(`
        <section class="section">
          <h2>Recent Purchases</h2>
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Weight (KG)</th>
                <th>Status</th>
                <th>Total Amount</th>
                <th>Net Credited</th>
              </tr>
            </thead>
            <tbody>
              ${
                recentPurchases.length > 0
                  ? recentPurchases
                      .map(
                        (purchase) => `
                          <tr>
                            <td>${formatDateTime(purchase.createdAt)}</td>
                            <td>${Number(purchase.weightKg || 0).toLocaleString()}</td>
                            <td>${safe(purchase.status)}</td>
                            <td>${formatNaira(purchase.totalAmount || 0)}</td>
                            <td>${formatNaira(purchase.netAmountCredited || 0)}</td>
                          </tr>
                        `,
                      )
                      .join('')
                  : '<tr><td colspan="5" class="empty">No purchases in this period.</td></tr>'
              }
            </tbody>
          </table>
        </section>
      `);
    }

    if (statementSectionFilters.sessions) {
      sectionHtml.push(`
        <section class="section">
          <h2>Recent USSD Sessions</h2>
          <table class="data-table">
            <thead>
              <tr>
                <th>Start Time</th>
                <th>Session ID</th>
                <th>Network</th>
                <th>Status</th>
                <th>Action</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              ${
                recentUssdSessions.length > 0
                  ? recentUssdSessions
                      .map(
                        (session) => `
                          <tr>
                            <td>${formatDateTime(session.startTime)}</td>
                            <td>${safe(session.sessionId || 'N/A')}</td>
                            <td>${safe(session.network || 'UNKNOWN')}</td>
                            <td>${safe(session.status)}</td>
                            <td>${safe(session.action || 'N/A')}</td>
                            <td>${Number(session.duration || 0)} sec</td>
                          </tr>
                        `,
                      )
                      .join('')
                  : '<tr><td colspan="6" class="empty">No USSD sessions in this period.</td></tr>'
              }
            </tbody>
          </table>
        </section>
      `);
    }

    if (statementSectionFilters.activity) {
      sectionHtml.push(`
        <section class="section">
          <h2>Account Activity</h2>
          <table class="meta-table">
            <tr><td>Member Since</td><td>${formatDate(viewingFarmer.createdAt)}</td></tr>
            <tr><td>Last Updated</td><td>${formatDate(viewingFarmer.updatedAt)}</td></tr>
            <tr><td>Total Sales</td><td>${Number(viewingFarmer.totalSales || 0).toLocaleString()}</td></tr>
            <tr><td>Total Earnings</td><td>${formatNaira(viewingFarmer.totalEarnings || 0)}</td></tr>
            <tr><td>Completed Sales</td><td>${Number(viewingFarmer.completedSales || 0).toLocaleString()}</td></tr>
          </table>
        </section>
      `);
    }

    const styleTags = Array.from(
      document.querySelectorAll('style, link[rel="stylesheet"]'),
    )
      .map((element) => element.outerHTML)
      .join('\n');

    const printWindow = window.open('', '_blank', 'width=1100,height=900');
    if (!printWindow) {
      setActionError('Unable to open print window. Please allow pop-ups and try again.');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Student Farmer Statement - ${safe(viewingFarmer.fullName)}</title>
          ${styleTags}
          <style>
            body {
              font-family: Arial, sans-serif;
              background: #fff;
              color: #1f2937;
              margin: 0;
              padding: 20px;
            }
            .header {
              margin-bottom: 20px;
              border-bottom: 2px solid #066f48;
              padding-bottom: 12px;
            }
            .title {
              color: #066f48;
              margin: 0 0 6px;
              font-size: 24px;
              font-weight: 700;
            }
            .meta {
              margin: 2px 0;
              font-size: 13px;
              color: #4b5563;
            }
            .section {
              margin-bottom: 16px;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 12px;
              page-break-inside: avoid;
            }
            .section h2 {
              margin: 0 0 10px;
              color: #066f48;
              font-size: 16px;
            }
            .meta-table,
            .data-table {
              width: 100%;
              border-collapse: collapse;
            }
            .meta-table td,
            .data-table td,
            .data-table th {
              border: 1px solid #e5e7eb;
              padding: 7px 8px;
              text-align: left;
              font-size: 12px;
              vertical-align: top;
            }
            .data-table th {
              background: #f0fdf4;
              color: #065f46;
              font-weight: 700;
            }
            .meta-table td:first-child {
              width: 220px;
              font-weight: 700;
              background: #f9fafb;
            }
            .empty {
              text-align: center;
              color: #6b7280;
              font-style: italic;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">Student Farmer Statement</h1>
            <p class="meta"><strong>Farmer:</strong> ${safe(viewingFarmer.fullName.toUpperCase())}</p>
            <p class="meta"><strong>Phone:</strong> ${safe(viewingFarmer.phone)}</p>
            <p class="meta"><strong>Generated:</strong> ${formatDateTime(new Date())}</p>
            <p class="meta"><strong>Included Sections:</strong> ${safe(selectedSections)}</p>
          </div>
          ${sectionHtml.join('\n')}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 600);
  };

  return (
    <div ref={farmersPageRef} className="space-y-5 w-full min-w-0 overflow-x-hidden">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[#066f48]">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Student Farmers Directory</h2>
              <p className="text-sm text-gray-600">{total} total student farmers</p>
            </div>
          </div>
          <Button
            onClick={exportFarmersPagePdf}
            variant="contained"
            startIcon={<FileDown className="w-4 h-4" />}
            className="no-print"
            sx={{
              backgroundColor: '#066f48',
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: '0.625rem',
              px: 2,
              py: 1,
              width: { xs: '100%', sm: 'auto' },
              '&:hover': { backgroundColor: '#055a3b' },
            }}
          >
            Export PDF
          </Button>
        </div>
      </div>

      {/* KPI Snapshot */}
      {farmerKpiRows.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            borderRadius: '0.75rem',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
            p: 2.5,
            backgroundColor: '#ffffff',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', lg: 'center' },
              flexDirection: { xs: 'column', lg: 'row' },
              mb: 2,
            }}
          >
            <Box>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 700, color: '#1f2937', lineHeight: 1.2 }}
              >
                Student Farmer KPI Snapshot
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: '#6b7280', display: 'block', mt: 0.5 }}
              >
                {kpiTable?.period}
              </Typography>
            </Box>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.25}
              className="no-print"
              sx={{ width: { xs: '100%', lg: 'auto' } }}
            >
              <TextField
                label="Start date"
                type="date"
                size="small"
                value={kpiStartDate}
                onChange={(event) => setKpiStartDate(event.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{
                  minWidth: { xs: '100%', sm: 170 },
                  '& .MuiOutlinedInput-root': { borderRadius: '0.625rem' },
                }}
              />
              <TextField
                label="End date"
                type="date"
                size="small"
                value={kpiEndDate}
                onChange={(event) => setKpiEndDate(event.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{
                  minWidth: { xs: '100%', sm: 170 },
                  '& .MuiOutlinedInput-root': { borderRadius: '0.625rem' },
                }}
              />
              <Button
                onClick={clearKpiDateFilter}
                variant="outlined"
                startIcon={<RotateCcw className="w-4 h-4" />}
                sx={{
                  borderColor: '#d1d5db',
                  color: '#374151',
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: '0.625rem',
                  '&:hover': {
                    borderColor: '#9ca3af',
                    backgroundColor: '#f9fafb',
                  },
                }}
              >
                Clear dates
              </Button>
            </Stack>
          </Box>
          {kpiFilterError && (
            <Typography
              variant="caption"
              sx={{ color: '#b91c1c', display: 'block', mb: 1.5 }}
            >
              {kpiFilterError}
            </Typography>
          )}
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                xl: 'repeat(4, minmax(0, 1fr))',
              },
            }}
          >
            {farmerKpiRows.map((row, index) => (
              <Card
                key={`${row.kpi}-${index}`}
                variant="outlined"
                sx={{
                  borderRadius: '0.75rem',
                  borderColor: '#d1d5db',
                  background: 'linear-gradient(180deg, #f8faf9 0%, #ffffff 100%)',
                  borderTop: '4px solid #066f48',
                }}
              >
                <CardContent sx={{ p: 2.25, '&:last-child': { pb: 2.25 } }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#4b5563',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                      fontWeight: 700,
                    }}
                  >
                    {row.kpi}
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      mt: 1,
                      mb: 1.25,
                      color: '#066f48',
                      fontWeight: 800,
                      lineHeight: 1.1,
                    }}
                  >
                    {formatKpiValue(row.actual, row.unit)}
                  </Typography>
                  <Chip
                    label={getKpiUnitLabel(row.unit)}
                    size="small"
                    sx={{
                      backgroundColor: '#ecfdf5',
                      color: '#066f48',
                      fontWeight: 700,
                      border: '1px solid #a7f3d0',
                    }}
                  />
                </CardContent>
              </Card>
            ))}
          </Box>
        </Paper>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* LGA Filter */}
          <input
            type="text"
            placeholder="Filter by LGA..."
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#066f48] focus:border-[#066f48] focus:outline-none transition-all text-gray-800 placeholder-gray-500"
            value={lgaFilter}
            onChange={(e) => setLgaFilter(e.target.value)}
          />

          {/* Status Filter */}
          <select
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#066f48] focus:border-[#066f48] focus:outline-none transition-all text-gray-800"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LeafInlineLoader />
        </div>
      ) : farmers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No student farmers found</p>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {farmers.map((farmer) => (
              <div key={farmer.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-all duration-200">
                
                <div className="flex items-start justify-between mb-3 relative z-10">
                  <div>
                    <h3 className="font-semibold text-gray-800">{farmer.fullName.toUpperCase()}</h3>
                    <p className="text-sm text-gray-600">{farmer.phone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewFarmer(farmer)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm relative z-10">
                  <div>
                    <span className="text-gray-500">LGA:</span>
                    <p className="font-medium text-gray-800">{farmer.lga.toUpperCase()}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Farm Size:</span>
                    <p className="font-medium text-gray-800">{farmer.farmSizeHectares} ha</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Wallet Balance:</span>
                    <p className="font-medium text-gray-800">{formatNaira(farmer.walletBalance || 0)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Total Sales:</span>
                    <p className="font-medium text-gray-800">{farmer.totalSales}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Earnings:</span>
                    <p className="font-medium text-gray-800">{formatNaira(farmer.totalEarnings)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 font-medium uppercase text-xs border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3">Farmer</th>
                    <th className="px-6 py-3">Phone</th>
                    <th className="px-6 py-3">LGA</th>
                    <th className="px-6 py-3">Farm Size</th>
                    <th className="px-6 py-3">Wallet Balance</th>
                    <th className="px-6 py-3">Total Sales</th>
                    <th className="px-6 py-3">Earnings</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {farmers.map((farmer) => (
                    <tr key={farmer.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-800">{farmer.fullName.toUpperCase()}</p>
                          <p className="text-xs text-gray-500">ID: {farmer.id.substring(0, 8)}...</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700 uppercase">{farmer.phone}</td>
                      <td className="px-6 py-4 text-gray-700">{farmer.lga.toUpperCase()}</td>
                      <td className="px-6 py-4 text-gray-700">{farmer.farmSizeHectares} ha</td>
                      <td className="px-6 py-4 text-gray-700">{formatNaira(farmer.walletBalance || 0)}</td>
                      <td className="px-6 py-4 text-gray-700">{farmer.totalSales}</td>
                      <td className="px-6 py-4 text-gray-700">{formatNaira(farmer.totalEarnings)}</td>
                      <td className="px-6 py-4">{getStatusBadge(farmer.status)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewFarmer(farmer)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex w-full sm:w-auto gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all text-gray-700 w-full sm:w-auto"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all text-gray-700 w-full sm:w-auto"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* View Farmer Modal */}
      {viewingFarmer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl overflow-hidden my-auto border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-3">
                <div>
                  <h3 className="text-lg font-bold text-[#066f48]">Student Farmer Statement Center</h3>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {viewingFarmer.fullName.toUpperCase()} • {viewingFarmer.phone}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={printFarmerStatement}
                    className="px-4 py-2 bg-[#066f48] hover:bg-[#055a3b] text-white rounded-lg transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
                  >
                    <Printer className="w-4 h-4" />
                    Print Student Farmer Statement
                  </button>
                  <button
                    onClick={closeViewingFarmerModal}
                    className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4 sm:p-6 space-y-6 max-h-[84vh] overflow-y-auto">
              {actionError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-red-800 text-sm">{actionError}</p>
                </div>
              )}
              {actionSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <p className="text-green-800 text-sm">{actionSuccess}</p>
                </div>
              )}

              <div className="bg-[#f7fcf9] border border-[#d1f5e1] rounded-xl p-4">
                <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
                  <div>
                    <h4 className="font-semibold text-[#065f46]">Print Student Farmer Statement</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Select the sections you want on the printable student farmer statement for better reporting UX.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
                    <button
                      onClick={selectAllStatementSections}
                      className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-all text-sm"
                    >
                      Select All
                    </button>
                    <button
                      onClick={clearStatementSections}
                      className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-all text-sm"
                    >
                      Clear
                    </button>
                    <button
                      onClick={printFarmerStatement}
                      className="px-3 py-2 rounded-lg bg-[#066f48] text-white hover:bg-[#055a3b] transition-all text-sm flex items-center gap-2"
                    >
                      <Printer className="w-4 h-4" />
                      Print ({statementSectionCount})
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-4">
                  {statementSectionOptions.map((option) => (
                    <label
                      key={option.key}
                      className="flex items-start gap-2 p-2 rounded-lg border border-gray-200 bg-white cursor-pointer hover:border-[#9adfbd] transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={statementSectionFilters[option.key]}
                        onChange={() => toggleStatementSection(option.key)}
                        className="mt-1 accent-[#066f48]"
                      />
                      <span className="flex-1">
                        <span className="block text-sm font-medium text-gray-800">{option.label}</span>
                        <span className="block text-xs text-gray-500">{option.description}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {loadingFarmerStatement ? (
                <div className="py-10 flex flex-col items-center gap-2">
                  <LeafInlineLoader />
                  <p className="text-sm text-gray-600">Loading student farmer statement data...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <h4 className="font-semibold text-gray-800 mb-3">Personal Information</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Full Name</p>
                        <p className="font-medium text-gray-800">{viewingFarmer.fullName.toUpperCase()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Phone Number</p>
                        <p className="font-medium text-gray-800">{viewingFarmer.phone}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">LGA</p>
                        <p className="font-medium text-gray-800">{viewingFarmer.lga.toUpperCase()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Farm Size</p>
                        <p className="font-medium text-gray-800">{viewingFarmer.farmSizeHectares} hectares</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Status</p>
                        {getStatusBadge(viewingFarmer.status)}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <h4 className="font-semibold text-gray-800">Wallet Account Setup</h4>
                      <button
                        onClick={() => {
                          setActionError(null);
                          setActionSuccess(null);
                          setShowAddAccountForm((prev) => !prev);
                        }}
                        className="px-3 py-2 rounded-lg border border-[#9adfbd] bg-[#ecfdf5] text-[#065f46] hover:bg-[#dff7eb] transition-all flex items-center justify-center gap-2 text-sm"
                      >
                        <PlusCircle className="w-4 h-4" />
                        {showAddAccountForm ? 'Close Form' : 'Add Account'}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Wallet Balance</p>
                        <p className="font-semibold text-[#066f48]">{formatNaira(viewingFarmer.walletBalance || 0)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Savings Wallet Balance</p>
                        <p className="font-semibold text-[#066f48]">
                          {formatCurrency(viewingFarmerFinancial?.wallet?.savingsBalance || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Wallet Status</p>
                        <p className="font-medium text-gray-800">
                          {viewingFarmerFinancial?.wallet?.isActive ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Savings Rate</p>
                        <p className="font-medium text-gray-800">
                          {viewingFarmerFinancial?.wallet?.savingsPercentage !== null &&
                          viewingFarmerFinancial?.wallet?.savingsPercentage !== undefined
                            ? `${viewingFarmerFinancial.wallet.savingsPercentage}%`
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Bank Name</p>
                        <p className="font-medium text-gray-800">{viewingFarmer.walletBankName || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Account Number</p>
                        <p className="font-medium text-gray-800">{viewingFarmer.walletAccountNumber || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Account Name</p>
                        <p className="font-medium text-gray-800">{viewingFarmer.walletAccountName || 'N/A'}</p>
                      </div>
                    </div>
                    {showAddAccountForm && (
                      <div className="mt-4 border-t border-gray-200 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <label className="block text-gray-600 mb-1">Bank Name</label>
                            <input
                              type="text"
                              value={addAccountForm.bankName}
                              onChange={(event) =>
                                setAddAccountForm((prev) => ({
                                  ...prev,
                                  bankName: event.target.value,
                                }))
                              }
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#066f48]"
                              placeholder="e.g Access Bank"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-600 mb-1">Bank Code</label>
                            <input
                              type="text"
                              value={addAccountForm.bankCode}
                              onChange={(event) =>
                                setAddAccountForm((prev) => ({
                                  ...prev,
                                  bankCode: event.target.value,
                                }))
                              }
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#066f48]"
                              placeholder="e.g 044"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-600 mb-1">Account Number</label>
                            <input
                              type="text"
                              value={addAccountForm.accountNumber}
                              onChange={(event) =>
                                setAddAccountForm((prev) => ({
                                  ...prev,
                                  accountNumber: event.target.value.replace(/\D/g, '').slice(0, 10),
                                }))
                              }
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#066f48]"
                              placeholder="10-digit account number"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-600 mb-1">Account Name</label>
                            <input
                              type="text"
                              value={addAccountForm.accountName}
                              onChange={(event) =>
                                setAddAccountForm((prev) => ({
                                  ...prev,
                                  accountName: event.target.value,
                                }))
                              }
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#066f48]"
                              placeholder="Account holder name"
                            />
                          </div>
                        </div>
                        <div className="mt-3 flex justify-end">
                          <button
                            onClick={handleSetFarmerWithdrawalAccount}
                            disabled={settingAccount}
                            className="px-4 py-2 rounded-lg bg-[#066f48] hover:bg-[#055a3b] disabled:opacity-60 text-white transition-all flex items-center gap-2 text-sm"
                          >
                            {settingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            Save Account
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <h4 className="font-semibold text-gray-800 mb-3">Outstanding Loans</h4>
                    {viewingFarmerFinancial?.outstandingLoans?.length ? (
                      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                        {viewingFarmerFinancial.outstandingLoans.map((loan) => (
                          <div key={loan.id} className="rounded-lg border border-gray-200 p-3 bg-gray-50 text-sm">
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-semibold text-gray-800">Loan #{loan.id.slice(0, 8)}...</p>
                              <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">
                                {loan.status}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-xs text-gray-600">
                              <p>Principal: <span className="font-medium text-gray-800">{formatCurrency(loan.principalAmount)}</span></p>
                              <p>Total Repayment: <span className="font-medium text-gray-800">{formatCurrency(loan.totalRepayment)}</span></p>
                              <p>Paid: <span className="font-medium text-gray-800">{formatCurrency(loan.amountPaid)}</span></p>
                              <p>Outstanding: <span className="font-semibold text-red-600">{formatCurrency(loan.amountOutstanding)}</span></p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No outstanding loans found.</p>
                    )}
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <h4 className="font-semibold text-gray-800 mb-3">Recent Transactions</h4>
                    {viewingFarmerFinancial?.recentTransactions?.length ? (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {viewingFarmerFinancial.recentTransactions.map((transaction) => (
                          <div key={transaction.id} className="rounded-lg border border-gray-200 p-3 bg-gray-50 text-sm">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium text-gray-800 capitalize">
                                {(transaction.type || 'N/A').replace('_', ' ')}
                              </p>
                              <p className="font-semibold text-[#066f48]">{formatNaira(transaction.amount)}</p>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">{transaction.description || 'N/A'}</p>
                            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                              <span>{transaction.status}</span>
                              <span>{formatDateTime(transaction.createdAt)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No recent transactions found.</p>
                    )}
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <h4 className="font-semibold text-gray-800 mb-3">Recent Purchases</h4>
                    {viewingFarmerFinancial?.recentPurchases?.length ? (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {viewingFarmerFinancial.recentPurchases.map((purchase) => (
                          <div key={purchase.id} className="rounded-lg border border-gray-200 p-3 bg-gray-50 text-sm">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium text-gray-800">{purchase.weightKg} KG</p>
                              <p className="font-semibold text-[#066f48]">{formatNaira(purchase.totalAmount)}</p>
                            </div>
                            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                              <span>{purchase.status}</span>
                              <span>{formatDateTime(purchase.createdAt)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No recent purchases found.</p>
                    )}
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <h4 className="font-semibold text-gray-800 mb-3">Recent USSD Sessions</h4>
                    {viewingFarmerFinancial?.recentUssdSessions?.length ? (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {viewingFarmerFinancial.recentUssdSessions.map((session) => (
                          <div key={session.id} className="rounded-lg border border-gray-200 p-3 bg-gray-50 text-sm">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium text-gray-800">{session.network}</p>
                              <p className="text-xs text-gray-500">{session.duration || 0} sec</p>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">Session ID: {session.sessionId || 'N/A'}</p>
                            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                              <span className="capitalize">{session.status}</span>
                              <span>{formatDateTime(session.startTime)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No recent USSD sessions found.</p>
                    )}
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <h4 className="font-semibold text-gray-800 mb-3">Account Activity</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Member Since</p>
                        <p className="font-medium text-gray-800">{formatDate(viewingFarmer.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Last Updated</p>
                        <p className="font-medium text-gray-800">{formatDate(viewingFarmer.updatedAt)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Total Earnings</p>
                        <p className="font-medium text-gray-800">{formatNaira(viewingFarmer.totalEarnings)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Completed Sales</p>
                        <p className="font-medium text-gray-800">{viewingFarmer.completedSales}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2 border-t border-gray-200">
                {viewingFarmer.status === 'active' ? (
                  <>
                    <button
                      onClick={() => {
                        setSuspendingFarmer(toFarmerPayload(viewingFarmer));
                      }}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-all flex items-center gap-2 justify-center"
                    >
                      <UserX className="w-4 h-4" />
                      Suspend Account
                    </button>
                    <button
                      onClick={() => {
                        setDeactivatingFarmer(toFarmerPayload(viewingFarmer));
                        closeViewingFarmerModal();
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all flex items-center gap-2 justify-center"
                    >
                      <UserX className="w-4 h-4" />
                      Deactivate Account
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      handleActivateFarmer(toFarmerPayload(viewingFarmer));
                      closeViewingFarmerModal();
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all flex items-center gap-2 justify-center"
                  >
                    <UserCheck className="w-4 h-4" />
                    Activate Account
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Farmer Modal */}
      {suspendingFarmer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-yellow-50">
              <h3 className="text-lg font-bold text-yellow-800">Suspend Student Farmer Account</h3>
            </div>
            <div className="p-6 space-y-4">
              {actionError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-red-800 text-sm">{actionError}</p>
                </div>
              )}

              <div>
                <p className="text-gray-700 mb-4">
                  You are about to suspend <strong>{suspendingFarmer.firstName} {suspendingFarmer.lastName}</strong>'s account. 
                  Please provide a reason that will be sent to the farmer.
                </p>
                
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Suspension <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  placeholder="Enter the reason for suspending this account..."
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 focus:outline-none resize-none text-gray-800"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setSuspendingFarmer(null);
                    setSuspensionReason('');
                    setActionError(null);
                  }}
                  disabled={loadingAction}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSuspendFarmer}
                  disabled={loadingAction || !suspensionReason.trim()}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingAction ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Suspending...
                    </>
                  ) : (
                    <>
                      <UserX className="w-4 h-4" />
                      Suspend Account
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      {deactivatingFarmer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
              <h3 className="text-lg font-bold text-red-700">Confirm Deactivation</h3>
            </div>
            <div className="p-6 space-y-4">
              {actionError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-sm text-red-800">{actionError}</p>
                </div>
              )}

              <p className="text-gray-700">
                Are you sure you want to deactivate <strong>{deactivatingFarmer.fullName.toUpperCase()}</strong>? 
                This will suspend their account and they won't be able to access the system.
              </p>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
                <button
                  onClick={() => setDeactivatingFarmer(null)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all text-gray-700"
                  disabled={loadingAction}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeactivateFarmer}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                  disabled={loadingAction}
                >
                  {loadingAction ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deactivating...
                    </>
                  ) : (
                    <>
                      <UserX className="w-4 h-4" />
                      Deactivate Account
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
