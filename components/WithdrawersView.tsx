import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  Download,
  Eye,
  FileText,
  RefreshCw,
  Search,
  Wallet,
  X,
} from 'lucide-react';
import { LeafInlineLoader } from './Loader';
import {
  WithdrawerPayoutKpis,
  WithdrawerPayoutSummary,
  WithdrawerPayoutStatus,
  withdrawersApi,
} from '../services/withdrawers';

const statusOptions: Array<{ value: WithdrawerPayoutStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'retrying', label: 'Retrying' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
];

const formatCurrency = (value: number) =>
  `₦${Number(value || 0).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value?: string | null) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleString('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusClass = (status: WithdrawerPayoutStatus) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    case 'processing':
      return 'bg-blue-100 text-blue-800';
    case 'retrying':
      return 'bg-orange-100 text-orange-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const getLogoDataUrl = async (): Promise<string> => {
  try {
    const response = await fetch('/logo.png');
    if (!response.ok) return '';
    const blob = await response.blob();
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(blob);
    });
  } catch {
    return '';
  }
};

const paginationWindow = (current: number, total: number, maxButtons = 5) => {
  if (total <= maxButtons) return Array.from({ length: total }, (_, i) => i + 1);
  const half = Math.floor(maxButtons / 2);
  let start = Math.max(1, current - half);
  let end = start + maxButtons - 1;
  if (end > total) {
    end = total;
    start = total - maxButtons + 1;
  }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};

const WithdrawersView: React.FC = () => {
  const [kpis, setKpis] = useState<WithdrawerPayoutKpis | null>(null);
  const [payouts, setPayouts] = useState<WithdrawerPayoutSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<WithdrawerPayoutStatus | 'all'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [selectedPayout, setSelectedPayout] = useState<WithdrawerPayoutSummary | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [exportLimit, setExportLimit] = useState(100);
  const [exporting, setExporting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (startDate && endDate && startDate > endDate) {
        throw new Error('Start date cannot be after end date.');
      }

      const [kpiResponse, listResponse] = await Promise.all([
        withdrawersApi.getWithdrawerKpis({
          ...(startDate ? { startDate } : {}),
          ...(endDate ? { endDate } : {}),
        }),
        withdrawersApi.getWithdrawerPayouts({
          page,
          limit: 10,
          ...(status !== 'all' ? { status } : {}),
          ...(search ? { search } : {}),
          ...(startDate ? { startDate } : {}),
          ...(endDate ? { endDate } : {}),
          sortBy: 'createdAt',
          sortOrder: 'desc',
        }),
      ]);

      setKpis(kpiResponse);
      setPayouts(listResponse.payouts || []);
      setTotalPages(Math.max(1, listResponse.totalPages || 1));
      setTotal(listResponse.total || 0);
    } catch (err: any) {
      setError(err?.message || 'Failed to load withdrawer data.');
      setKpis(null);
      setPayouts([]);
      setTotalPages(1);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, status, search, startDate, endDate]);

  const openDetailsModal = async (payout: WithdrawerPayoutSummary) => {
    setIsDetailModalOpen(true);
    setLoadingDetail(true);
    try {
      const details = await withdrawersApi.getWithdrawerPayoutById(payout.id);
      setSelectedPayout(details);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch payout details.');
      setSelectedPayout(null);
      setIsDetailModalOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeDetailsModal = () => {
    setIsDetailModalOpen(false);
    setSelectedPayout(null);
  };

  const resetFilters = () => {
    setSearch('');
    setStatus('all');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const exportListPdf = async () => {
    setExporting(true);
    setError(null);
    try {
      if (exportStartDate && exportEndDate && exportStartDate > exportEndDate) {
        throw new Error('Export date range is invalid.');
      }

      const logoDataUrl = await getLogoDataUrl();
      const response = await withdrawersApi.getWithdrawerPayouts({
        page: 1,
        limit: exportLimit,
        ...(status !== 'all' ? { status } : {}),
        ...(search ? { search } : {}),
        ...(exportStartDate ? { startDate: exportStartDate } : {}),
        ...(exportEndDate ? { endDate: exportEndDate } : {}),
      });

      const rows = (response.payouts || [])
        .map(
          (record) => `
            <tr>
              <td>${escapeHtml(record.walletTransactionReference)}</td>
              <td>${escapeHtml(record.userName || 'N/A')}</td>
              <td>${escapeHtml(record.userType.toUpperCase())}</td>
              <td>${escapeHtml(formatCurrency(record.amount))}</td>
              <td>${escapeHtml(record.status.toUpperCase())}</td>
              <td>${escapeHtml(formatDate(record.createdAt))}</td>
            </tr>
          `,
        )
        .join('');

      const printWindow = window.open('', '_blank', 'width=1200,height=900');
      if (!printWindow) {
        throw new Error('Unable to open print window. Please allow pop-ups and try again.');
      }

      printWindow.document.open();
      printWindow.document.write(`
        <!doctype html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Withdrawer Statements</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 24px; color: #1f2937; }
              .header { display: flex; align-items: center; gap: 14px; margin-bottom: 14px; }
              .logo { width: 56px; height: 56px; object-fit: contain; }
              .title { margin: 0; color: #066f48; font-size: 24px; }
              .meta { margin: 4px 0; font-size: 12px; color: #6b7280; }
              table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
              th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
              th { background: #f3f4f6; }
            </style>
          </head>
          <body>
            <div class="header">
              ${logoDataUrl ? `<img src="${logoDataUrl}" class="logo" alt="Promise Point Logo" />` : ''}
              <div>
                <h1 class="title">Withdrawer Statements</h1>
                <p class="meta">Promise Point Agritech</p>
              </div>
            </div>
            <p class="meta">Generated: ${escapeHtml(new Date().toLocaleString('en-NG'))}</p>
            <p class="meta">Records: ${response.payouts.length} | Max requested: ${exportLimit}</p>
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>User</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                ${rows || '<tr><td colspan="6">No withdrawer records found.</td></tr>'}
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

      setExportModalOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to export withdrawer statements.');
    } finally {
      setExporting(false);
    }
  };

  const printSingleStatement = async (record: WithdrawerPayoutSummary) => {
    const logoDataUrl = await getLogoDataUrl();
    const printWindow = window.open('', '_blank', 'width=980,height=850');
    if (!printWindow) return;

    const userTxn = record.transactions?.userWalletTransaction;
    const orgTxn = record.transactions?.organizationWithdrawerTransaction;

    printWindow.document.open();
    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Withdrawer Statement - ${escapeHtml(record.walletTransactionReference)}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 24px; color: #1f2937; }
            .header { display: flex; align-items: center; gap: 14px; margin-bottom: 14px; }
            .logo { width: 56px; height: 56px; object-fit: contain; }
            .title { margin: 0; color: #066f48; font-size: 22px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 14px; }
            .card { border: 1px solid #d1d5db; border-radius: 8px; padding: 10px; }
            .label { font-size: 12px; color: #6b7280; }
            .value { margin-top: 2px; font-size: 14px; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="header">
            ${logoDataUrl ? `<img src="${logoDataUrl}" class="logo" alt="Promise Point Logo" />` : ''}
            <div>
              <h1 class="title">Withdrawer Record Statement</h1>
              <div class="label">Reference: ${escapeHtml(record.walletTransactionReference)}</div>
            </div>
          </div>

          <div class="grid">
            <div class="card"><div class="label">User</div><div class="value">${escapeHtml(record.userName)}</div></div>
            <div class="card"><div class="label">User Type</div><div class="value">${escapeHtml(record.userType.toUpperCase())}</div></div>
            <div class="card"><div class="label">Amount</div><div class="value">${escapeHtml(formatCurrency(record.amount))}</div></div>
            <div class="card"><div class="label">Status</div><div class="value">${escapeHtml(record.status.toUpperCase())}</div></div>
            <div class="card"><div class="label">User Wallet Before/After</div><div class="value">${escapeHtml(formatCurrency(record.balances.userWalletBefore))} → ${escapeHtml(formatCurrency(record.balances.userWalletAfter))}</div></div>
            <div class="card"><div class="label">Org Withdrawer Wallet Before/After</div><div class="value">${escapeHtml(formatCurrency(record.balances.organizationWithdrawerWalletBefore))} → ${escapeHtml(formatCurrency(record.balances.organizationWithdrawerWalletAfter))}</div></div>
            <div class="card"><div class="label">User Transaction</div><div class="value">${escapeHtml(userTxn?.reference || 'N/A')}</div></div>
            <div class="card"><div class="label">Org Transaction</div><div class="value">${escapeHtml(orgTxn?.reference || 'N/A')}</div></div>
          </div>

          <p class="label" style="margin-top: 16px;">Generated: ${escapeHtml(new Date().toLocaleString('en-NG'))}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 450);
  };

  const kpiCards = useMemo(
    () => [
      { label: 'Total Requests', value: kpis?.totals.totalRequests ?? 0 },
      { label: 'Completed', value: kpis?.totals.completed ?? 0 },
      { label: 'Failed', value: kpis?.totals.failed ?? 0 },
      { label: 'Pending Queue', value: (kpis?.totals.pending || 0) + (kpis?.totals.retrying || 0) + (kpis?.totals.processing || 0) },
      {
        label: 'Total Requested',
        value: formatCurrency(kpis?.totals.totalRequestedAmount || 0),
      },
      {
        label: 'Total Completed',
        value: formatCurrency(kpis?.totals.totalCompletedAmount || 0),
      },
    ],
    [kpis],
  );

  const pageWindow = paginationWindow(page, totalPages, 5);

  return (
    <div className="space-y-6 w-full min-w-0 overflow-x-hidden">
      <section className="bg-white border border-gray-200 rounded-2xl px-4 sm:px-6 py-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#066f48] text-white flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1f2937]">Withdrawer Operations</h1>
              <p className="text-sm text-gray-500">Track payout jobs, wallet impact, and transaction records.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <button
              onClick={loadData}
              className="h-11 px-4 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 inline-flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => {
                setExportStartDate(startDate);
                setExportEndDate(endDate);
                setExportLimit(100);
                setExportModalOpen(true);
              }}
              className="h-11 px-4 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 inline-flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {kpiCards.map((card) => (
          <div key={card.label} className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-2xl font-bold text-[#111827] mt-2">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by ref, user, account"
              className="w-full h-11 border border-gray-300 rounded-xl pl-10 pr-3 text-sm"
            />
          </div>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as WithdrawerPayoutStatus | 'all');
              setPage(1);
            }}
            className="h-11 border border-gray-300 rounded-xl px-3 text-sm"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-full h-11 border border-gray-300 rounded-xl pl-10 pr-3 text-sm"
            />
          </div>

          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-full h-11 border border-gray-300 rounded-xl pl-10 pr-3 text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={resetFilters} className="text-sm font-semibold text-[#066f48] hover:underline">
            Reset Filters
          </button>
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <LeafInlineLoader />
        ) : (
          <>
            <div className="lg:hidden p-4 space-y-3">
              {payouts.length === 0 ? (
                <div className="py-10 text-center text-gray-500">No withdrawer records found.</div>
              ) : (
                payouts.map((record) => (
                  <div key={record.id} className="rounded-xl border border-gray-200 p-4">
                    <p className="font-semibold text-gray-900 break-all">{record.walletTransactionReference}</p>
                    <p className="text-sm font-semibold text-gray-800 mt-1">{record.userName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {record.userType.toUpperCase()} {record.userPhone ? `• ${record.userPhone}` : ''}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-base font-bold text-[#066f48]">{formatCurrency(record.amount)}</p>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusClass(record.status)}`}>
                        {record.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      User Wallet: {formatCurrency(record.balances.userWalletBefore)} → {formatCurrency(record.balances.userWalletAfter)}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Org Wallet: {formatCurrency(record.balances.organizationWithdrawerWalletBefore)} → {formatCurrency(record.balances.organizationWithdrawerWalletAfter)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Created: {formatDate(record.createdAt)}</p>
                    <button
                      onClick={() => openDetailsModal(record)}
                      className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-700 uppercase tracking-wide text-xs">
                  <tr>
                    <th className="px-4 py-3 text-left">Reference</th>
                    <th className="px-4 py-3 text-left">User</th>
                    <th className="px-4 py-3 text-left">Amount</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">User Wallet (Before/After)</th>
                    <th className="px-4 py-3 text-left">Org Withdrawer Wallet (Before/After)</th>
                    <th className="px-4 py-3 text-left">Created At</th>
                    <th className="px-4 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payouts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-14 text-center text-gray-500">
                        No withdrawer records found.
                      </td>
                    </tr>
                  ) : (
                    payouts.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50/60">
                        <td className="px-4 py-4 font-semibold text-gray-900">{record.walletTransactionReference}</td>
                        <td className="px-4 py-4">
                          <p className="font-semibold text-gray-900">{record.userName}</p>
                          <p className="text-xs text-gray-500 mt-1">{record.userType.toUpperCase()} {record.userPhone ? `• ${record.userPhone}` : ''}</p>
                        </td>
                        <td className="px-4 py-4 text-gray-700 font-semibold">{formatCurrency(record.amount)}</td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusClass(record.status)}`}>
                            {record.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-gray-700">
                          {formatCurrency(record.balances.userWalletBefore)} → {formatCurrency(record.balances.userWalletAfter)}
                        </td>
                        <td className="px-4 py-4 text-gray-700">
                          {formatCurrency(record.balances.organizationWithdrawerWalletBefore)} → {formatCurrency(record.balances.organizationWithdrawerWalletAfter)}
                        </td>
                        <td className="px-4 py-4 text-gray-700">{formatDate(record.createdAt)}</td>
                        <td className="px-4 py-4">
                          <button
                            onClick={() => openDetailsModal(record)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-gray-500">Showing page {page} of {totalPages} • {total.toLocaleString()} records</p>
              <div className="flex items-center gap-2 overflow-x-auto">
                <button
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page <= 1}
                  className="h-9 px-3 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                >
                  Prev
                </button>
                {pageWindow.map((pageNo) => (
                  <button
                    key={pageNo}
                    onClick={() => setPage(pageNo)}
                    className={`h-9 min-w-9 px-3 rounded-lg text-sm font-semibold border ${pageNo === page ? 'bg-[#066f48] text-white border-[#066f48]' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                  >
                    {pageNo}
                  </button>
                ))}
                <button
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page >= totalPages}
                  className="h-9 px-3 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {isDetailModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Withdrawer Details</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedPayout?.walletTransactionReference || 'Loading...'}
                </p>
              </div>
              <button onClick={closeDetailsModal} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto">
              {loadingDetail || !selectedPayout ? (
                <LeafInlineLoader />
              ) : (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-gray-200 p-4">
                      <p className="text-xs uppercase tracking-wide text-gray-500">User</p>
                      <p className="text-base font-semibold text-gray-900 mt-1">{selectedPayout.userName}</p>
                      <p className="text-sm text-gray-600 mt-1">{selectedPayout.userType.toUpperCase()} {selectedPayout.userPhone ? `• ${selectedPayout.userPhone}` : ''}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 p-4">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Status</p>
                      <p className={`inline-flex mt-1 px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusClass(selectedPayout.status)}`}>
                        {selectedPayout.status.toUpperCase()}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">Attempts: {selectedPayout.attempts}/{selectedPayout.maxAttempts}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-gray-200 p-4">
                      <p className="text-xs uppercase tracking-wide text-gray-500">User Wallet Before</p>
                      <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(selectedPayout.balances.userWalletBefore)}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 p-4">
                      <p className="text-xs uppercase tracking-wide text-gray-500">User Wallet After</p>
                      <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(selectedPayout.balances.userWalletAfter)}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 p-4">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Org Withdrawer Wallet Before</p>
                      <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(selectedPayout.balances.organizationWithdrawerWalletBefore)}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 p-4">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Org Withdrawer Wallet After</p>
                      <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(selectedPayout.balances.organizationWithdrawerWalletAfter)}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="text-sm font-semibold text-gray-900">Bank Details</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 text-sm text-gray-700">
                      <p><span className="text-gray-500">Bank:</span> {selectedPayout.bank.name}</p>
                      <p><span className="text-gray-500">Account Number:</span> {selectedPayout.bank.accountNumber}</p>
                      <p><span className="text-gray-500">Account Name:</span> {selectedPayout.bank.accountName}</p>
                      <p><span className="text-gray-500">Bank Code:</span> {selectedPayout.bank.code}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="text-sm font-semibold text-gray-900">Transaction Records</p>
                    <div className="text-sm text-gray-700 mt-2 space-y-2">
                      <p><span className="text-gray-500">User Wallet Transaction:</span> {selectedPayout.transactions?.userWalletTransaction?.reference || 'N/A'}</p>
                      <p><span className="text-gray-500">Organization Withdrawer Transaction:</span> {selectedPayout.transactions?.organizationWithdrawerTransaction?.reference || 'N/A'}</p>
                      <p><span className="text-gray-500">Transfer Reference:</span> {selectedPayout.transferReference}</p>
                      <p><span className="text-gray-500">Paystack Transfer Code:</span> {selectedPayout.paystackTransferCode || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-4 text-sm text-gray-700 space-y-1">
                    <p><span className="text-gray-500">Created At:</span> {formatDate(selectedPayout.createdAt)}</p>
                    <p><span className="text-gray-500">Updated At:</span> {formatDate(selectedPayout.updatedAt)}</p>
                    <p><span className="text-gray-500">Processed At:</span> {formatDate(selectedPayout.processedAt)}</p>
                    {selectedPayout.lastError ? <p><span className="text-gray-500">Last Error:</span> {selectedPayout.lastError}</p> : null}
                  </div>
                </div>
              )}
            </div>

            <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-end gap-3">
              {selectedPayout ? (
                <button
                  onClick={() => printSingleStatement(selectedPayout)}
                  className="h-11 px-4 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 inline-flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <FileText className="w-4 h-4" />
                  Print Record
                </button>
              ) : null}
              <button
                onClick={closeDetailsModal}
                className="h-11 px-4 rounded-xl bg-[#066f48] text-white font-semibold hover:bg-[#055a3a] w-full sm:w-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {exportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Export Withdrawer Statements</h3>
              <button onClick={() => setExportModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">From Date</label>
                <input
                  type="date"
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                  className="mt-1 w-full h-11 border border-gray-300 rounded-xl px-3 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">To Date</label>
                <input
                  type="date"
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                  className="mt-1 w-full h-11 border border-gray-300 rounded-xl px-3 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Record Limit</label>
                <select
                  value={exportLimit}
                  onChange={(e) => setExportLimit(Number(e.target.value))}
                  className="mt-1 w-full h-11 border border-gray-300 rounded-xl px-3 text-sm"
                >
                  <option value={50}>50 Records</option>
                  <option value={100}>100 Records</option>
                  <option value={200}>200 Records</option>
                  <option value={500}>500 Records</option>
                </select>
              </div>
            </div>

            <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                onClick={() => setExportModalOpen(false)}
                className="h-11 px-4 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 w-full sm:w-auto"
              >
                Cancel
              </button>
              <button
                onClick={exportListPdf}
                disabled={exporting}
                className="h-11 px-4 rounded-xl bg-[#066f48] text-white font-semibold hover:bg-[#055a3a] disabled:opacity-60 w-full sm:w-auto"
              >
                {exporting ? 'Exporting...' : 'Export PDF'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WithdrawersView;
