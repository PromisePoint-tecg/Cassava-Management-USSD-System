import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  Download,
  Eye,
  FileText,
  MessageSquareWarning,
  Plus,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import {
  complaintsApi,
  ComplaintComplainantType,
  ComplaintItem,
  ComplaintKpis,
  ComplaintPriority,
  ComplaintStatus,
  CreateComplaintPayload,
  UpdateComplaintPayload,
} from '../services/complaints';
import { adminApi, Admin } from '../services/admin';
import { LeafInlineLoader } from './Loader';

const statusOptions: Array<{ value: ComplaintStatus; label: string }> = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const priorityOptions: Array<{ value: ComplaintPriority; label: string }> = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const complainantTypeOptions: Array<{
  value: ComplaintComplainantType;
  label: string;
}> = [
  { value: 'farmer', label: 'Farmer' },
  { value: 'student_farmer', label: 'Student Farmer' },
  { value: 'staff', label: 'Staff' },
  { value: 'admin', label: 'Admin' },
  { value: 'other', label: 'Other' },
];

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

const getStatusBadge = (status: ComplaintStatus) => {
  switch (status) {
    case 'open':
      return 'bg-yellow-100 text-yellow-800';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800';
    case 'resolved':
      return 'bg-green-100 text-green-800';
    case 'closed':
      return 'bg-gray-200 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const getPriorityBadge = (priority: ComplaintPriority) => {
  switch (priority) {
    case 'low':
      return 'bg-emerald-100 text-emerald-800';
    case 'medium':
      return 'bg-slate-100 text-slate-800';
    case 'high':
      return 'bg-orange-100 text-orange-800';
    case 'critical':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const getComplainantTypeLabel = (value: ComplaintComplainantType) =>
  complainantTypeOptions.find((option) => option.value === value)?.label ||
  value;

const getAdminDisplayName = (admin?: Admin | null) =>
  admin?.fullName?.trim() ||
  `${admin?.firstName || ''} ${admin?.lastName || ''}`.trim() ||
  admin?.email ||
  'ADMIN';

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

const buildWindowedPagination = (current: number, total: number, windowSize = 5) => {
  if (total <= windowSize) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const half = Math.floor(windowSize / 2);
  let start = Math.max(1, current - half);
  let end = start + windowSize - 1;

  if (end > total) {
    end = total;
    start = total - windowSize + 1;
  }

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
};

export const ComplaintsView: React.FC = () => {
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [kpis, setKpis] = useState<ComplaintKpis | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ComplaintStatus | ''>('');
  const [priority, setPriority] = useState<ComplaintPriority | ''>('');
  const [complainantType, setComplainantType] =
    useState<ComplaintComplainantType | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<CreateComplaintPayload>({
    complainantType: 'other',
    complainantName: '',
    complainantPhone: '',
    category: 'general',
    title: '',
    description: '',
    priority: 'medium',
    source: 'dashboard',
  });

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] =
    useState<ComplaintItem | null>(null);
  const [updateForm, setUpdateForm] = useState<UpdateComplaintPayload>({
    status: 'open',
    priority: 'medium',
    resolutionNotes: '',
    assignedToAdminId: undefined,
    assignedToAdminName: '',
  });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [assignableAdmins, setAssignableAdmins] = useState<Admin[]>([]);
  const [assignAdminsLoading, setAssignAdminsLoading] = useState(false);
  const [assignAdminsError, setAssignAdminsError] = useState<string | null>(null);
  const [assignAdminSearch, setAssignAdminSearch] = useState('');

  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [exportLimit, setExportLimit] = useState(50);
  const [exporting, setExporting] = useState(false);

  const loadComplaintsData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (startDate && endDate && startDate > endDate) {
        throw new Error('Start date cannot be after end date.');
      }

      const filters = {
        page,
        limit,
        ...(search ? { search } : {}),
        ...(status ? { status } : {}),
        ...(priority ? { priority } : {}),
        ...(complainantType ? { complainantType } : {}),
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
      };

      const [kpiData, complaintsData] = await Promise.all([
        complaintsApi.getComplaintKpis({
          ...(startDate ? { startDate } : {}),
          ...(endDate ? { endDate } : {}),
        }),
        complaintsApi.getComplaints(filters),
      ]);

      setKpis(kpiData);
      setComplaints(complaintsData.complaints || []);
      setTotalPages(Math.max(1, complaintsData.totalPages || 1));
      setTotal(complaintsData.total || 0);
    } catch (err: any) {
      setError(err?.message || 'Failed to load complaints');
      setComplaints([]);
      setKpis(null);
      setTotalPages(1);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaintsData();
  }, [page, limit, search, status, priority, complainantType, startDate, endDate]);

  const openCreateModal = () => {
    setCreateError(null);
    setCreateForm({
      complainantType: 'other',
      complainantName: '',
      complainantPhone: '',
      category: 'general',
      title: '',
      description: '',
      priority: 'medium',
      source: 'dashboard',
    });
    setCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setCreateModalOpen(false);
  };

  const submitCreateComplaint = async () => {
    if (!createForm.complainantName?.trim()) {
      setCreateError('Complainant name is required.');
      return;
    }

    if (!createForm.title?.trim() || !createForm.description?.trim()) {
      setCreateError('Title and description are required.');
      return;
    }

    setCreateLoading(true);
    setCreateError(null);

    try {
      await complaintsApi.createComplaint({
        ...createForm,
        complainantName: createForm.complainantName.trim(),
        title: createForm.title.trim(),
        description: createForm.description.trim(),
        complainantPhone: createForm.complainantPhone?.trim() || undefined,
      });
      closeCreateModal();
      await loadComplaintsData();
    } catch (err: any) {
      setCreateError(err?.message || 'Failed to create complaint');
    } finally {
      setCreateLoading(false);
    }
  };

  const openViewModal = (complaint: ComplaintItem) => {
    setSelectedComplaint(complaint);
    setUpdateError(null);
    setAssignAdminSearch('');
    setAssignAdminsError(null);
    setUpdateForm({
      status: complaint.status,
      priority: complaint.priority,
      resolutionNotes: complaint.resolutionNotes || '',
      assignedToAdminId: complaint.assignedToAdminId || undefined,
      assignedToAdminName: complaint.assignedToAdminName || '',
    });
    setViewModalOpen(true);
    void loadAssignableAdmins();
  };

  const closeViewModal = () => {
    setViewModalOpen(false);
    setSelectedComplaint(null);
    setUpdateError(null);
  };

  const loadAssignableAdmins = async () => {
    setAssignAdminsLoading(true);
    setAssignAdminsError(null);

    try {
      const fetchedAdmins: Admin[] = [];
      const pageSize = 100;
      let currentPage = 1;
      let totalPagesToLoad = 1;

      do {
        const response = await adminApi.getAllAdmins({
          page: currentPage,
          limit: pageSize,
          status: 'all',
        });

        fetchedAdmins.push(...(response.admins || []));
        totalPagesToLoad = Math.max(1, response.totalPages || 1);
        currentPage += 1;
      } while (currentPage <= totalPagesToLoad);

      setAssignableAdmins(fetchedAdmins);
    } catch (err: any) {
      setAssignAdminsError(err?.message || 'Failed to fetch admins for assignment.');
      setAssignableAdmins([]);
    } finally {
      setAssignAdminsLoading(false);
    }
  };

  const submitComplaintUpdate = async () => {
    if (!selectedComplaint) return;

    setUpdateLoading(true);
    setUpdateError(null);

    try {
      const payload: UpdateComplaintPayload = {
        status: updateForm.status,
        priority: updateForm.priority,
        resolutionNotes: updateForm.resolutionNotes?.trim() || undefined,
      };

      if (updateForm.assignedToAdminId) {
        payload.assignedToAdminId = updateForm.assignedToAdminId;
        payload.assignedToAdminName =
          updateForm.assignedToAdminName?.trim() || undefined;
      }

      const updated = await complaintsApi.updateComplaint(selectedComplaint.id, payload);

      setSelectedComplaint(updated);
      await loadComplaintsData();
    } catch (err: any) {
      setUpdateError(err?.message || 'Failed to update complaint');
    } finally {
      setUpdateLoading(false);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setStatus('');
    setPriority('');
    setComplainantType('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const openExportModal = () => {
    setExportStartDate(startDate);
    setExportEndDate(endDate);
    setExportLimit(50);
    setExportModalOpen(true);
  };

  const exportComplaintStatementPdf = async () => {
    if (exportStartDate && exportEndDate && exportStartDate > exportEndDate) {
      setError('Export date range is invalid. Start date cannot be after end date.');
      return;
    }

    setExporting(true);
    setError(null);

    try {
      const result = await complaintsApi.getComplaints({
        page: 1,
        limit: exportLimit,
        ...(search ? { search } : {}),
        ...(status ? { status } : {}),
        ...(priority ? { priority } : {}),
        ...(complainantType ? { complainantType } : {}),
        ...(exportStartDate ? { startDate: exportStartDate } : {}),
        ...(exportEndDate ? { endDate: exportEndDate } : {}),
      });

      const logoDataUrl = await getLogoDataUrl();
      const generatedAt = new Date().toLocaleString('en-NG');

      const rows = (result.complaints || [])
        .map(
          (complaint) => `
            <tr>
              <td>${escapeHtml(complaint.reference)}</td>
              <td>${escapeHtml(complaint.complainantName)}</td>
              <td>${escapeHtml(getComplainantTypeLabel(complaint.complainantType))}</td>
              <td>${escapeHtml(complaint.category || 'general')}</td>
              <td>${escapeHtml(complaint.priority.toUpperCase())}</td>
              <td>${escapeHtml(complaint.status.replace('_', ' ').toUpperCase())}</td>
              <td>${escapeHtml(new Date(complaint.createdAt).toLocaleString('en-NG'))}</td>
            </tr>
          `,
        )
        .join('');

      const filtersSummary = [
        search ? `Search: ${search}` : '',
        status ? `Status: ${status}` : '',
        priority ? `Priority: ${priority}` : '',
        complainantType ? `Complainant Type: ${complainantType}` : '',
        exportStartDate ? `From: ${exportStartDate}` : '',
        exportEndDate ? `To: ${exportEndDate}` : '',
        `Max Records: ${exportLimit}`,
      ]
        .filter(Boolean)
        .join(' | ');

      const printWindow = window.open('', '_blank', 'width=1200,height=900');
      if (!printWindow) {
        throw new Error('Unable to open print window. Please allow popups and try again.');
      }

      printWindow.document.open();
      printWindow.document.write(`
        <!doctype html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Complaints Statement</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 24px; color: #1f2937; }
              .header { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
              .logo { width: 56px; height: 56px; object-fit: contain; }
              .title { font-size: 24px; margin: 0; color: #066f48; }
              .subtitle { margin: 2px 0 0 0; color: #4b5563; font-size: 13px; }
              .summary { margin-bottom: 16px; font-size: 13px; color: #334155; }
              table { border-collapse: collapse; width: 100%; font-size: 12px; }
              th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; vertical-align: top; }
              th { background: #f3f4f6; color: #111827; }
              .meta { margin-top: 10px; color: #6b7280; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              ${logoDataUrl ? `<img src="${logoDataUrl}" alt="Promise Point Logo" class="logo" />` : ''}
              <div>
                <h1 class="title">Complaints Statement</h1>
                <p class="subtitle">Promise Point Agritech</p>
              </div>
            </div>

            <p class="summary"><strong>Filters:</strong> ${escapeHtml(filtersSummary || 'None')}</p>
            <p class="summary"><strong>Total Records Exported:</strong> ${result.complaints.length}</p>

            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Complainant</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                ${rows || '<tr><td colspan="7">No complaints found for selected filters.</td></tr>'}
              </tbody>
            </table>

            <p class="meta">Generated At: ${escapeHtml(generatedAt)}</p>
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
      setError(err?.message || 'Failed to export complaints statement.');
    } finally {
      setExporting(false);
    }
  };

  const kpiCards = useMemo(
    () => [
      {
        label: 'Total Complaints',
        value: kpis?.totals.total ?? 0,
      },
      {
        label: 'Open',
        value: kpis?.totals.open ?? 0,
      },
      {
        label: 'In Progress',
        value: kpis?.totals.inProgress ?? 0,
      },
      {
        label: 'Resolved / Closed',
        value: (kpis?.totals.resolved || 0) + (kpis?.totals.closed || 0),
      },
      {
        label: 'Critical Priority',
        value: kpis?.priorities.critical ?? 0,
      },
      {
        label: 'Resolution Rate',
        value: `${(kpis?.totals.resolutionRate ?? 0).toFixed(2)}%`,
      },
    ],
    [kpis],
  );

  const paginationWindow = useMemo(
    () => buildWindowedPagination(page, totalPages, 5),
    [page, totalPages],
  );

  const filteredAssignableAdmins = useMemo(() => {
    const query = assignAdminSearch.trim().toLowerCase();
    if (!query) return assignableAdmins;

    return assignableAdmins.filter((admin) => {
      const candidate = `${admin.fullName || ''} ${admin.firstName || ''} ${admin.lastName || ''} ${admin.email || ''}`.toLowerCase();
      return candidate.includes(query);
    });
  }, [assignableAdmins, assignAdminSearch]);

  const selectedAssignedAdmin = useMemo(
    () =>
      assignableAdmins.find((admin) => admin.id === updateForm.assignedToAdminId) ||
      null,
    [assignableAdmins, updateForm.assignedToAdminId],
  );

  return (
    <div className="space-y-6 w-full min-w-0 overflow-x-hidden">
      <section className="bg-white border border-gray-200 rounded-2xl px-4 sm:px-6 py-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#066f48] text-white flex items-center justify-center">
              <MessageSquareWarning className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1f2937]">Complaints Desk</h1>
              <p className="text-sm text-gray-500">Manage complaints, priorities, and resolutions in one place.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <button
              onClick={loadComplaintsData}
              className="h-11 px-4 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 inline-flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={openExportModal}
              className="h-11 px-4 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 inline-flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
            <button
              onClick={openCreateModal}
              className="h-11 px-4 rounded-xl bg-[#066f48] text-white font-semibold hover:bg-[#055a3a] inline-flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              New Complaint
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
          <div
            key={card.label}
            className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm"
          >
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-2xl font-bold text-[#111827] mt-2">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-3">
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search by reference, title, name, phone"
              className="w-full h-11 border border-gray-300 rounded-xl pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#066f48]/20 focus:border-[#066f48]"
            />
          </div>

          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as ComplaintStatus | '');
              setPage(1);
            }}
            className="h-11 border border-gray-300 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#066f48]/20 focus:border-[#066f48]"
          >
            <option value="">All Statuses</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={priority}
            onChange={(event) => {
              setPriority(event.target.value as ComplaintPriority | '');
              setPage(1);
            }}
            className="h-11 border border-gray-300 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#066f48]/20 focus:border-[#066f48]"
          >
            <option value="">All Priorities</option>
            {priorityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={complainantType}
            onChange={(event) => {
              setComplainantType(event.target.value as ComplaintComplainantType | '');
              setPage(1);
            }}
            className="h-11 border border-gray-300 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#066f48]/20 focus:border-[#066f48]"
          >
            <option value="">All Complainant Types</option>
            {complainantTypeOptions.map((option) => (
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
              onChange={(event) => {
                setStartDate(event.target.value);
                setPage(1);
              }}
              className="w-full h-11 border border-gray-300 rounded-xl pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#066f48]/20 focus:border-[#066f48]"
            />
          </div>

          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={endDate}
              onChange={(event) => {
                setEndDate(event.target.value);
                setPage(1);
              }}
              className="w-full h-11 border border-gray-300 rounded-xl pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#066f48]/20 focus:border-[#066f48]"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={resetFilters}
            className="text-sm font-semibold text-[#066f48] hover:underline"
          >
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
              {complaints.length === 0 ? (
                <div className="py-10 text-center text-gray-500">
                  No complaints found for selected filters.
                </div>
              ) : (
                complaints.map((complaint) => (
                  <div key={complaint.id} className="rounded-xl border border-gray-200 p-4">
                    <p className="font-semibold text-gray-900 break-all">{complaint.reference}</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{complaint.complainantName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {getComplainantTypeLabel(complaint.complainantType)}
                      {complaint.complainantPhone ? ` • ${complaint.complainantPhone}` : ''}
                    </p>
                    <p className="text-xs text-gray-600 mt-2 capitalize">{complaint.category || 'general'}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Assigned: {complaint.assignedToAdminName || 'Unassigned'}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getPriorityBadge(
                          complaint.priority,
                        )}`}
                      >
                        {complaint.priority.toUpperCase()}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                          complaint.status,
                        )}`}
                      >
                        {complaint.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Created: {formatDate(complaint.createdAt)}</p>
                    <button
                      onClick={() => openViewModal(complaint)}
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
                    <th className="px-4 py-3 text-left">Complainant</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-left">Priority</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Assigned Admin</th>
                    <th className="px-4 py-3 text-left">Created At</th>
                    <th className="px-4 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {complaints.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-14 text-center text-gray-500">
                        No complaints found for selected filters.
                      </td>
                    </tr>
                  ) : (
                    complaints.map((complaint) => (
                      <tr key={complaint.id} className="hover:bg-gray-50/60">
                        <td className="px-4 py-4 font-semibold text-gray-900">
                          {complaint.reference}
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-semibold text-gray-900">{complaint.complainantName}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {getComplainantTypeLabel(complaint.complainantType)}
                            {complaint.complainantPhone ? ` • ${complaint.complainantPhone}` : ''}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-gray-700">{complaint.category || 'general'}</td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getPriorityBadge(
                              complaint.priority,
                            )}`}
                          >
                            {complaint.priority.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                              complaint.status,
                            )}`}
                          >
                            {complaint.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-gray-700">
                          {complaint.assignedToAdminName || 'Unassigned'}
                        </td>
                        <td className="px-4 py-4 text-gray-700">{formatDate(complaint.createdAt)}</td>
                        <td className="px-4 py-4">
                          <button
                            onClick={() => openViewModal(complaint)}
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
              <p className="text-sm text-gray-500">
                Showing page {page} of {totalPages} • {total.toLocaleString()} records
              </p>
              <div className="flex items-center gap-2 overflow-x-auto">
                <button
                  onClick={() => setPage((previous) => Math.max(1, previous - 1))}
                  disabled={page <= 1}
                  className="h-9 px-3 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                {paginationWindow.map((pageNo) => (
                  <button
                    key={pageNo}
                    onClick={() => setPage(pageNo)}
                    className={`h-9 min-w-9 px-3 rounded-lg text-sm font-semibold border ${
                      pageNo === page
                        ? 'bg-[#066f48] text-white border-[#066f48]'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNo}
                  </button>
                ))}
                <button
                  onClick={() =>
                    setPage((previous) => Math.min(totalPages, previous + 1))
                  }
                  disabled={page >= totalPages}
                  className="h-9 px-3 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Create Complaint</h3>
              <button
                onClick={closeCreateModal}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {createError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">
                  {createError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Complainant Name *</label>
                  <input
                    value={createForm.complainantName || ''}
                    onChange={(event) =>
                      setCreateForm((previous) => ({
                        ...previous,
                        complainantName: event.target.value,
                      }))
                    }
                    className="mt-1 w-full h-11 border border-gray-300 rounded-xl px-3 text-sm"
                    placeholder="Enter complainant full name"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Phone Number</label>
                  <input
                    value={createForm.complainantPhone || ''}
                    onChange={(event) =>
                      setCreateForm((previous) => ({
                        ...previous,
                        complainantPhone: event.target.value,
                      }))
                    }
                    className="mt-1 w-full h-11 border border-gray-300 rounded-xl px-3 text-sm"
                    placeholder="+234..."
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Complainant Type</label>
                  <select
                    value={createForm.complainantType || 'other'}
                    onChange={(event) =>
                      setCreateForm((previous) => ({
                        ...previous,
                        complainantType: event.target.value as ComplaintComplainantType,
                      }))
                    }
                    className="mt-1 w-full h-11 border border-gray-300 rounded-xl px-3 text-sm"
                  >
                    {complainantTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Priority</label>
                  <select
                    value={createForm.priority || 'medium'}
                    onChange={(event) =>
                      setCreateForm((previous) => ({
                        ...previous,
                        priority: event.target.value as ComplaintPriority,
                      }))
                    }
                    className="mt-1 w-full h-11 border border-gray-300 rounded-xl px-3 text-sm"
                  >
                    {priorityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">Category</label>
                <input
                  value={createForm.category || ''}
                  onChange={(event) =>
                    setCreateForm((previous) => ({
                      ...previous,
                      category: event.target.value,
                    }))
                  }
                  className="mt-1 w-full h-11 border border-gray-300 rounded-xl px-3 text-sm"
                  placeholder="billing, support, delivery, account..."
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">Title *</label>
                <input
                  value={createForm.title || ''}
                  onChange={(event) =>
                    setCreateForm((previous) => ({
                      ...previous,
                      title: event.target.value,
                    }))
                  }
                  className="mt-1 w-full h-11 border border-gray-300 rounded-xl px-3 text-sm"
                  placeholder="Short complaint summary"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">Description *</label>
                <textarea
                  value={createForm.description || ''}
                  onChange={(event) =>
                    setCreateForm((previous) => ({
                      ...previous,
                      description: event.target.value,
                    }))
                  }
                  className="mt-1 w-full min-h-[140px] border border-gray-300 rounded-xl px-3 py-2 text-sm"
                  placeholder="Provide full details of the complaint"
                />
              </div>
            </div>

            <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                onClick={closeCreateModal}
                className="h-11 px-4 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 w-full sm:w-auto"
              >
                Cancel
              </button>
              <button
                onClick={submitCreateComplaint}
                disabled={createLoading}
                className="h-11 px-4 rounded-xl bg-[#066f48] text-white font-semibold hover:bg-[#055a3a] disabled:opacity-60 w-full sm:w-auto"
              >
                {createLoading ? 'Saving...' : 'Create Complaint'}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewModalOpen && selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Complaint Details</h3>
                <p className="text-xs text-gray-500 mt-1">Reference: {selectedComplaint.reference}</p>
              </div>
              <button
                onClick={closeViewModal}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {updateError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">
                  {updateError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Complainant</p>
                  <p className="text-base font-semibold text-gray-900 mt-1">
                    {selectedComplaint.complainantName}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {getComplainantTypeLabel(selectedComplaint.complainantType)}
                    {selectedComplaint.complainantPhone ? ` • ${selectedComplaint.complainantPhone}` : ''}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Timeline</p>
                  <p className="text-sm text-gray-700 mt-1">Created: {formatDate(selectedComplaint.createdAt)}</p>
                  <p className="text-sm text-gray-700 mt-1">Updated: {formatDate(selectedComplaint.updatedAt)}</p>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Title</p>
                <p className="text-base font-semibold text-gray-900 mt-1">{selectedComplaint.title}</p>
                <p className="text-xs uppercase tracking-wide text-gray-500 mt-4">Description</p>
                <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                  {selectedComplaint.description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Status</label>
                  <select
                    value={updateForm.status || selectedComplaint.status}
                    onChange={(event) =>
                      setUpdateForm((previous) => ({
                        ...previous,
                        status: event.target.value as ComplaintStatus,
                      }))
                    }
                    className="mt-1 w-full h-11 border border-gray-300 rounded-xl px-3 text-sm"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Priority</label>
                  <select
                    value={updateForm.priority || selectedComplaint.priority}
                    onChange={(event) =>
                      setUpdateForm((previous) => ({
                        ...previous,
                        priority: event.target.value as ComplaintPriority,
                      }))
                    }
                    className="mt-1 w-full h-11 border border-gray-300 rounded-xl px-3 text-sm"
                  >
                    {priorityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700">Assign Admin</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={assignAdminSearch}
                    onChange={(event) => setAssignAdminSearch(event.target.value)}
                    className="w-full h-11 border border-gray-300 rounded-xl pl-10 pr-3 text-sm"
                    placeholder="Search admins by name or email"
                  />
                </div>

                <select
                  value={updateForm.assignedToAdminId || ''}
                  onChange={(event) => {
                    const adminId = event.target.value;
                    const selectedAdmin = assignableAdmins.find(
                      (admin) => admin.id === adminId,
                    );

                    setUpdateForm((previous) => ({
                      ...previous,
                      assignedToAdminId: adminId || undefined,
                      assignedToAdminName: adminId
                        ? getAdminDisplayName(selectedAdmin)
                        : undefined,
                    }));
                  }}
                  disabled={assignAdminsLoading}
                  className="w-full h-11 border border-gray-300 rounded-xl px-3 text-sm disabled:bg-gray-100 disabled:text-gray-500"
                >
                  <option value="">
                    {assignAdminsLoading ? 'Loading admins...' : 'Select an admin'}
                  </option>
                  {filteredAssignableAdmins.map((admin) => (
                    <option key={admin.id} value={admin.id}>
                      {getAdminDisplayName(admin)}
                      {admin.isActive ? '' : ' (Inactive)'}
                    </option>
                  ))}
                </select>

                {assignAdminsError && (
                  <p className="text-xs text-red-600">{assignAdminsError}</p>
                )}

                {!assignAdminsLoading &&
                  !assignAdminsError &&
                  filteredAssignableAdmins.length === 0 && (
                    <p className="text-xs text-gray-500">
                      No admin matches your search.
                    </p>
                  )}

                {selectedAssignedAdmin && (
                  <p className="text-xs text-gray-500">
                    Selected: {getAdminDisplayName(selectedAssignedAdmin)} ({selectedAssignedAdmin.email})
                  </p>
                )}

                {!updateForm.assignedToAdminId && selectedComplaint.assignedToAdminName && (
                  <p className="text-xs text-amber-700">
                    Current label: {selectedComplaint.assignedToAdminName}. Select an admin above to link this complaint to a real admin account.
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">Resolution / Progress Notes</label>
                <textarea
                  value={updateForm.resolutionNotes || ''}
                  onChange={(event) =>
                    setUpdateForm((previous) => ({
                      ...previous,
                      resolutionNotes: event.target.value,
                    }))
                  }
                  className="mt-1 w-full min-h-[110px] border border-gray-300 rounded-xl px-3 py-2 text-sm"
                  placeholder="Add notes about the investigation or resolution"
                />
              </div>
            </div>

            <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                onClick={closeViewModal}
                className="h-11 px-4 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 w-full sm:w-auto"
              >
                Close
              </button>
              <button
                onClick={submitComplaintUpdate}
                disabled={updateLoading}
                className="h-11 px-4 rounded-xl bg-[#066f48] text-white font-semibold hover:bg-[#055a3a] disabled:opacity-60 w-full sm:w-auto"
              >
                {updateLoading ? 'Saving...' : 'Update Complaint'}
              </button>
            </div>
          </div>
        </div>
      )}

      {exportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Export Complaints PDF</h3>
              <button
                onClick={() => setExportModalOpen(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">From Date</label>
                <input
                  type="date"
                  value={exportStartDate}
                  onChange={(event) => setExportStartDate(event.target.value)}
                  className="mt-1 w-full h-11 border border-gray-300 rounded-xl px-3 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">To Date</label>
                <input
                  type="date"
                  value={exportEndDate}
                  onChange={(event) => setExportEndDate(event.target.value)}
                  className="mt-1 w-full h-11 border border-gray-300 rounded-xl px-3 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">Record Limit</label>
                <select
                  value={exportLimit}
                  onChange={(event) => setExportLimit(Number(event.target.value))}
                  className="mt-1 w-full h-11 border border-gray-300 rounded-xl px-3 text-sm"
                >
                  <option value={25}>25 Records</option>
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
                onClick={exportComplaintStatementPdf}
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

export default ComplaintsView;
