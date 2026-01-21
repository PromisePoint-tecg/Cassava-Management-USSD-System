import React, { useState, useEffect } from "react";
import {
  getAllStaff,
  approveStaff,
  deactivateStaff,
  reactivateStaff,
  registerStaff,
  updateStaff,
  uploadProfilePicture,
  type Staff,
  type RegisterStaffDto,
  type UpdateStaffDto,
  type ApproveStaffDto,
} from "../services/staff";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorMessage } from "./ErrorMessage";
import { SuccessModal } from "./SuccessModal";
import LeafInlineLoader, { LeafLoader } from "./Loader";

interface StaffManagementViewProps {
  adminId: string;
}

const StaffManagementView: React.FC<StaffManagementViewProps> = ({
  adminId,
}) => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterApproval, setFilterApproval] = useState("all");

  // Modals
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchStaff();
  }, [page, filterStatus, filterApproval]);

  // Auto-refresh every 30 seconds to catch new USSD registrations
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStaff();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [page, filterStatus, filterApproval]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit: 20,
      };

      if (searchTerm) params.search = searchTerm;
      if (filterStatus !== "all") params.status = filterStatus;
      if (filterApproval !== "all")
        params.is_approved = filterApproval === "approved";

      const response = await getAllStaff(params);
      console.log("Staff API response:", response);
      setStaff(response.staff || []);
      setTotalPages(response.totalPages || 1);
      setError(null);
    } catch (err) {
      setError("Failed to load staff. Please try again.");
      console.error("Error fetching staff:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchStaff();
  };

  const handleApprove = async (staffMember: Staff) => {
    setSelectedStaff(staffMember);
    setShowApproveModal(true);
  };

  const handleDeactivate = async (staffId: string, reason: string) => {
    try {
      await deactivateStaff(staffId, { reason });
      setSuccessMessage("Staff deactivated successfully!");
      setShowSuccessModal(true);
      setShowDeactivateModal(false);
      fetchStaff();
    } catch (err) {
      setError("Failed to deactivate staff. Please try again.");
    }
  };

  const handleReactivate = async (staffId: string) => {
    try {
      await reactivateStaff(staffId);
      setSuccessMessage("Staff reactivated successfully!");
      setShowSuccessModal(true);
      fetchStaff();
    } catch (err) {
      setError("Failed to reactivate staff. Please try again.");
    }
  };

  const handleRegister = async (data: RegisterStaffDto) => {
    try {
      await registerStaff(data);
      setSuccessMessage("Staff registered successfully! Awaiting approval.");
      setShowSuccessModal(true);
      setShowRegisterModal(false);
      fetchStaff();
    } catch (err) {
      setError("Failed to register staff. Please try again.");
    }
  };

  const handleUpdate = async (staffId: string, data: UpdateStaffDto) => {
    try {
      await updateStaff(staffId, data);
      setSuccessMessage("Staff updated successfully!");
      setShowSuccessModal(true);
      setShowEditModal(false);
      fetchStaff();
    } catch (err) {
      setError("Failed to update staff. Please try again.");
    }
  };

  const formatCurrency = (amount: number) => {
    return `₦${(amount / 100).toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getStatusBadge = (staff: Staff) => {
    if (!staff.isApproved) {
      return (
        <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-100/90 text-amber-700 border border-amber-200/50 backdrop-blur-sm">
          Pending Approval
        </span>
      );
    }
    if (!staff.isActive) {
      return (
        <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-100/90 text-red-700 border border-red-200/50 backdrop-blur-sm">
          Deactivated
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-green-100/90 text-green-700 border border-green-200/50 backdrop-blur-sm">
        Active
      </span>
    );
  };

  if (loading && staff.length === 0) {
    return (
        <div className="flex items-center justify-center min-h-screen">
          <LeafInlineLoader />
        </div>
      );
  }

  return (
    <div className="h-full flex flex-col p-6 space-y-5">
      {/* Header - Liquid Glass */}
      <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] p-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/5 to-transparent rounded-b-[2rem] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#066f48]/5 via-transparent to-cyan-400/5 rounded-[2rem] pointer-events-none" />
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-white/30 to-transparent blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-gradient-to-tl from-[#066f48]/10 to-transparent blur-2xl rounded-full pointer-events-none" />
        
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Staff Management
          </h1>
          <p className="text-gray-600">
            Manage staff members, approvals, and salaries
          </p>

          {/* Pending Approvals Alert */}
          {staff && staff.filter((s) => !s.isApproved).length > 0 && (
            <div className="mt-4 bg-amber-50/80 backdrop-blur-sm border-l-4 border-amber-400 p-4 rounded-r-xl">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-amber-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-amber-800">
                    <span className="font-semibold">
                      {staff?.filter((s) => !s.isApproved).length || 0} staff
                      member(s)
                    </span>{" "}
                    waiting for approval.
                    <button
                      onClick={() => setFilterApproval("pending")}
                      className="ml-2 font-medium underline hover:text-amber-900"
                    >
                      View pending approvals →
                    </button>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50/90 backdrop-blur-sm border border-red-200/50 rounded-[1.5rem] p-4 flex items-start shadow-sm">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm text-red-800 font-medium">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="ml-3 flex-shrink-0 text-red-500 hover:text-red-700"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Actions Bar - Liquid Glass */}
      <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] p-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/5 to-transparent rounded-b-[2rem] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#066f48]/5 via-transparent to-cyan-400/5 rounded-[2rem] pointer-events-none" />
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-white/30 to-transparent blur-3xl rounded-full pointer-events-none" />
        
        <div className="flex flex-col md:flex-row gap-4 relative z-10">
          {/* Search */}
          <div className="flex-1">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search by name, phone, or employee ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 px-4 py-2.5 bg-white/40 backdrop-blur-md border border-white/50 rounded-xl focus:ring-2 focus:ring-[#066f48]/30 focus:outline-none focus:bg-white/50 transition-all text-gray-800 placeholder-gray-500"
              />
              <button
                onClick={handleSearch}
                className="px-6 py-2.5 bg-[#066f48] text-white rounded-xl hover:bg-[#055a3a] transition-all shadow-lg"
              >
                Search
              </button>
            </div>
          </div>

          {/* Filters */}
          <select
            value={filterApproval}
            onChange={(e) => setFilterApproval(e.target.value)}
            className="px-4 py-2.5 bg-white/40 backdrop-blur-md border border-white/50 rounded-xl focus:ring-2 focus:ring-[#066f48]/30 focus:outline-none focus:bg-white/50 transition-all text-gray-800"
          >
            <option value="all">All Approvals</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 bg-white/40 backdrop-blur-md border border-white/50 rounded-xl focus:ring-2 focus:ring-[#066f48]/30 focus:outline-none focus:bg-white/50 transition-all text-gray-800"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Register Button */}
          <button
            onClick={() => setShowRegisterModal(true)}
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all whitespace-nowrap shadow-lg"
          >
            + Register Staff
          </button>
        </div>
      </div>

      {/* Stats Cards - Liquid Glass */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-[1.5rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] p-4 relative overflow-hidden hover:bg-white/15 transition-all">
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[1.5rem] pointer-events-none" />
          <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-white/25 blur-2xl rounded-full pointer-events-none" />
          <div className="relative z-10">
            <div className="text-sm text-gray-600 mb-1">Total Staff</div>
            <div className="text-3xl font-bold text-gray-800">
              {staff?.length || 0}
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-[1.5rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] p-4 relative overflow-hidden hover:bg-white/15 transition-all">
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[1.5rem] pointer-events-none" />
          <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-white/25 blur-2xl rounded-full pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm text-gray-600">Active</div>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
            <div className="text-3xl font-bold text-green-600">
              {staff?.filter((s) => s.isActive && s.isApproved).length || 0}
            </div>
          </div>
        </div>

        <div
          className="bg-white/10 backdrop-blur-xl rounded-[1.5rem] border border-amber-200/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] p-4 cursor-pointer hover:bg-white/15 transition-all relative overflow-hidden"
          onClick={() => setFilterApproval("pending")}
        >
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[1.5rem] pointer-events-none" />
          <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-white/25 blur-2xl rounded-full pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm text-gray-600">Pending Approval</div>
              {staff && staff.filter((s) => !s.isApproved).length > 0 && (
                <span className="flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              )}
            </div>
            <div className="text-3xl font-bold text-amber-600">
              {staff?.filter((s) => !s.isApproved).length || 0}
            </div>
            {staff && staff.filter((s) => !s.isApproved).length > 0 && (
              <div className="text-xs text-amber-700 mt-1 font-medium">
                Click to view →
              </div>
            )}
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-[1.5rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] p-4 relative overflow-hidden hover:bg-white/15 transition-all">
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[1.5rem] pointer-events-none" />
          <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-white/25 blur-2xl rounded-full pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm text-gray-600">Deactivated</div>
              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
            </div>
            <div className="text-3xl font-bold text-gray-600">
              {staff?.filter((s) => !s.isActive && s.isApproved).length || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Staff Table - Liquid Glass */}
      <div className="flex-1 flex flex-col bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] overflow-hidden min-h-0 relative">
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/5 to-transparent rounded-b-[2rem] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#066f48]/5 via-transparent to-cyan-400/5 rounded-[2rem] pointer-events-none" />
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-white/30 to-transparent blur-3xl rounded-full pointer-events-none" />
        
        <div className="flex-1 overflow-x-auto overflow-y-auto relative z-10">
          <table className="min-w-full divide-y divide-white/15">
            <thead className="bg-white/20 backdrop-blur-md">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Role & Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Monthly Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Pension
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/15">
              {staff?.map((member) => (
                <tr key={member.id} className="hover:bg-white/10 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-800">
                        {member.fullName}
                      </div>
                      <div className="text-sm text-gray-600">
                        {member.employeeId}
                      </div>
                      <div className="text-sm text-gray-600">
                        {member.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-800">{member.role}</div>
                    <div className="text-sm text-gray-600">
                      {member.department}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {formatCurrency(member.monthlySalary)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {formatCurrency(member.pensionContributions)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(member)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setSelectedStaff(member);
                          setShowDetailsModal(true);
                        }}
                        className="text-emerald-600 hover:text-emerald-800 font-medium"
                        title="View Details"
                      >
                        View
                      </button>
                      {!member.isApproved && (
                        <button
                          onClick={() => handleApprove(member)}
                          className="text-green-600 hover:text-green-800 font-medium"
                          title="Approve Staff"
                        >
                          Approve
                        </button>
                      )}
                      {member.isApproved && member.isActive && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedStaff(member);
                              setShowEditModal(true);
                            }}
                            className="text-amber-600 hover:text-amber-800 font-medium"
                            title="Edit Staff"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setSelectedStaff(member);
                              setShowDeactivateModal(true);
                            }}
                            className="text-red-600 hover:text-red-800 font-medium"
                            title="Deactivate Staff"
                          >
                            Deactivate
                          </button>
                        </>
                      )}
                      {member.isApproved && !member.isActive && (
                        <button
                          onClick={() => handleReactivate(member.id)}
                          className="text-green-600 hover:text-green-800 font-medium"
                          title="Reactivate Staff"
                        >
                          Reactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination - Sticky at bottom */}
        <div className="flex-shrink-0 bg-white/20 backdrop-blur-md px-4 py-3 flex items-center justify-between border-t border-white/30 sm:px-6 relative z-10">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-white/50 text-sm font-medium rounded-xl text-gray-700 bg-white/25 hover:bg-white/35 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-white/50 text-sm font-medium rounded-xl text-gray-700 bg-white/25 hover:bg-white/35 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Page <span className="font-medium">{page}</span> of{" "}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-xl shadow-sm -space-x-px">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-4 py-2 rounded-l-xl border border-white/50 bg-white/25 text-sm font-medium text-gray-700 hover:bg-white/35 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="relative inline-flex items-center px-4 py-2 rounded-r-xl border border-white/50 bg-white/25 text-sm font-medium text-gray-700 hover:bg-white/35 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showDetailsModal && selectedStaff && (
        <StaffDetailsModal
          staff={selectedStaff}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedStaff(null);
          }}
        />
      )}

      {showRegisterModal && (
        <RegisterStaffModal
          onClose={() => setShowRegisterModal(false)}
          onSubmit={handleRegister}
        />
      )}

      {showEditModal && selectedStaff && (
        <EditStaffModal
          staff={selectedStaff}
          onClose={() => {
            setShowEditModal(false);
            setSelectedStaff(null);
          }}
          onSubmit={(data) => handleUpdate(selectedStaff.id, data)}
        />
      )}

      {showDeactivateModal && selectedStaff && (
        <DeactivateStaffModal
          staff={selectedStaff}
          onClose={() => {
            setShowDeactivateModal(false);
            setSelectedStaff(null);
          }}
          onSubmit={(reason) => handleDeactivate(selectedStaff.id, reason)}
        />
      )}

      {showApproveModal && selectedStaff && (
        <ApproveStaffModal
          staff={selectedStaff}
          adminId={adminId}
          onClose={() => {
            setShowApproveModal(false);
            setSelectedStaff(null);
          }}
          onApprove={() => {
            setShowApproveModal(false);
            setSelectedStaff(null);
            setSuccessMessage("Staff approved successfully!");
            setShowSuccessModal(true);
            fetchStaff();
          }}
          onError={(error) => setError(error)}
        />
      )}

      {showSuccessModal && (
        <SuccessModal
          isOpen={showSuccessModal}
          message={successMessage}
          onClose={() => setShowSuccessModal(false)}
        />
      )}
    </div>
  );
};

// Staff Details Modal - Enhanced Glass
const StaffDetailsModal: React.FC<{ staff: Staff; onClose: () => void }> = ({
  staff,
  onClose,
}) => {
  const formatCurrency = (amount: number) => {
    return `₦${(amount / 100).toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white/80 backdrop-blur-2xl rounded-[2rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/60 relative my-auto">
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none rounded-[2rem]" />
        
        <div className="px-6 py-4 border-b border-white/40 bg-gradient-to-r from-[#066f48]/15 to-cyan-400/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1/2 h-full bg-white/20 blur-xl rounded-full pointer-events-none" />
          <div className="flex justify-between items-start relative z-10">
            <h2 className="text-2xl font-bold text-[#066f48]">Staff Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 hover:bg-white/50 rounded-lg transition-all"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 relative z-10">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Personal Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Full Name</label>
                <p className="text-sm font-medium text-gray-800">
                  {staff.fullName}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Employee ID</label>
                <p className="text-sm font-medium text-gray-800">
                  {staff.employeeId}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Phone</label>
                <p className="text-sm font-medium text-gray-800">
                  {staff.phone}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">LGA</label>
                <p className="text-sm font-medium text-gray-800">
                  {staff.lga}
                </p>
              </div>
            </div>
          </div>

          {/* Identity Documents */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Identity Documents
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">NIN</label>
                {staff.nin ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100/90 text-green-800 border border-green-200/50">
                      Uploaded
                    </span>
                    <a
                      href={staff.nin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-700 hover:text-green-900 text-sm underline"
                    >
                      View Document
                    </a>
                  </div>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100/90 text-gray-700 border border-gray-200/50">
                    Not Uploaded
                  </span>
                )}
              </div>
              <div>
                <label className="text-sm text-gray-600">BVN</label>
                {staff.bvn ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100/90 text-green-800 border border-green-200/50">
                      Verified
                    </span>
                    <span className="text-sm font-medium text-gray-800">
                      {staff.bvn.substring(0, 3)}****{staff.bvn.substring(7)}
                    </span>
                  </div>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100/90 text-gray-700 border border-gray-200/50">
                    Not Provided
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Employment Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Employment Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Role</label>
                <p className="text-sm font-medium text-gray-800">
                  {staff.role}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Department</label>
                <p className="text-sm font-medium text-gray-800">
                  {staff.department}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Status</label>
                <p className="text-sm font-medium text-gray-800">
                  {staff.isActive ? "Active" : "Inactive"}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">
                  Approval Status
                </label>
                <p className="text-sm font-medium text-gray-800">
                  {staff.isApproved ? "Approved" : "Pending"}
                </p>
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Financial Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">
                  Monthly Salary
                </label>
                <p className="text-sm font-medium text-gray-800">
                  {formatCurrency(staff.monthlySalary)}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">
                  Total Salary Paid
                </label>
                <p className="text-sm font-medium text-gray-800">
                  {formatCurrency(staff.totalSalaryPaid)}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">
                  Pension Contributions
                </label>
                <p className="text-sm font-medium text-gray-800">
                  {formatCurrency(staff.pensionContributions)}
                </p>
              </div>
              {staff.wallet && (
                <>
                  <div>
                    <label className="text-sm text-gray-600">
                      Wallet Balance
                    </label>
                    <p className="text-sm font-medium text-gray-800">
                      {formatCurrency(staff.wallet.balance)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">
                      Pension Balance
                    </label>
                    <p className="text-sm font-medium text-gray-800">
                      {formatCurrency(staff.wallet.pensionBalance)}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {staff.deactivationReason && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Deactivation Details
              </h3>
              <div>
                <label className="text-sm text-gray-600">Reason</label>
                <p className="text-sm font-medium text-gray-800">
                  {staff.deactivationReason}
                </p>
              </div>
              {staff.deactivatedAt && (
                <div className="mt-2">
                  <label className="text-sm text-gray-600">
                    Deactivated At
                  </label>
                  <p className="text-sm font-medium text-gray-800">
                    {new Date(staff.deactivatedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end p-6 border-t border-white/30 relative z-10">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white/40 backdrop-blur-md border border-white/60 text-gray-800 rounded-xl hover:bg-white/50 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Register Staff Modal - Enhanced Glass
const RegisterStaffModal: React.FC<{
  onClose: () => void;
  onSubmit: (data: RegisterStaffDto) => void;
}> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState<RegisterStaffDto>({
    phone: "",
    firstName: "",
    lastName: "",
    lga: "",
    role: "",
    department: "",
    monthlySalary: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white/80 backdrop-blur-2xl rounded-[2rem] max-w-md w-full shadow-2xl border border-white/60 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none rounded-[2rem]" />
        
        <div className="px-6 py-4 border-b border-white/40 bg-gradient-to-r from-[#066f48]/15 to-cyan-400/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1/2 h-full bg-white/20 blur-xl rounded-full pointer-events-none" />
          <div className="flex justify-between items-start relative z-10">
            <h2 className="text-2xl font-bold text-[#066f48]">
              Register New Staff
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 hover:bg-white/50 rounded-lg transition-all"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 relative z-10">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                className="w-full px-3 py-2 bg-white/40 backdrop-blur-md border border-white/50 rounded-xl focus:ring-2 focus:ring-[#066f48]/30 focus:outline-none focus:bg-white/50 transition-all text-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                className="w-full px-3 py-2 bg-white/40 backdrop-blur-md border border-white/50 rounded-xl focus:ring-2 focus:ring-[#066f48]/30 focus:outline-none focus:bg-white/50 transition-all text-gray-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="08012345678"
              className="w-full px-3 py-2 bg-white/40 backdrop-blur-md border border-white/50 rounded-xl focus:ring-2 focus:ring-[#066f48]/30 focus:outline-none focus:bg-white/50 transition-all text-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              LGA
            </label>
            <input
              type="text"
              required
              value={formData.lga}
              onChange={(e) =>
                setFormData({ ...formData, lga: e.target.value })
              }
              className="w-full px-3 py-2 bg-white/40 backdrop-blur-md border border-white/50 rounded-xl focus:ring-2 focus:ring-[#066f48]/30 focus:outline-none focus:bg-white/50 transition-all text-gray-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                required
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                className="w-full px-3 py-2 bg-white/40 backdrop-blur-md border border-white/50 rounded-xl focus:ring-2 focus:ring-[#066f48]/30 focus:outline-none focus:bg-white/50 transition-all text-gray-800"
              >
                <option value="">Select role</option>
                <option value="Field Officer">Field Officer</option>
                <option value="Manager">Manager</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Admin Staff">Admin Staff</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <select
                required
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
                className="w-full px-3 py-2 bg-white/40 backdrop-blur-md border border-white/50 rounded-xl focus:ring-2 focus:ring-[#066f48]/30 focus:outline-none focus:bg-white/50 transition-all text-gray-800"
              >
                <option value="">Select department</option>
                <option value="Operations">Operations</option>
                <option value="Finance">Finance</option>
                <option value="Logistics">Logistics</option>
                <option value="IT">IT</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monthly Salary (₦)
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.monthlySalary / 100}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  monthlySalary: parseFloat(e.target.value) * 100,
                })
              }
              className="w-full px-3 py-2 bg-white/40 backdrop-blur-md border border-white/50 rounded-xl focus:ring-2 focus:ring-[#066f48]/30 focus:outline-none focus:bg-white/50 transition-all text-gray-800"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white/40 backdrop-blur-md border border-white/60 text-gray-700 rounded-xl hover:bg-white/50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-lg"
            >
              Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Staff Modal - Enhanced Glass
const EditStaffModal: React.FC<{
  staff: Staff;
  onClose: () => void;
  onSubmit: (data: UpdateStaffDto) => void;
}> = ({ staff, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<UpdateStaffDto>({
    firstName: staff.firstName,
    lastName: staff.lastName,
    lga: staff.lga,
    role: staff.role,
    department: staff.department,
    monthlySalary: staff.monthlySalary,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white/80 backdrop-blur-2xl rounded-[2rem] max-w-md w-full shadow-2xl border border-white/60 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none rounded-[2rem]" />
        
        <div className="px-6 py-4 border-b border-white/40 bg-gradient-to-r from-[#066f48]/15 to-cyan-400/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1/2 h-full bg-white/20 blur-xl rounded-full pointer-events-none" />
          <div className="flex justify-between items-start relative z-10">
            <h2 className="text-2xl font-bold text-[#066f48]">Edit Staff</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 hover:bg-white/50 rounded-lg transition-all"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 relative z-10">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                className="w-full px-3 py-2 bg-white/40 backdrop-blur-md border border-white/50 rounded-xl focus:ring-2 focus:ring-[#066f48]/30 focus:outline-none focus:bg-white/50 transition-all text-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                className="w-full px-3 py-2 bg-white/40 backdrop-blur-md border border-white/50 rounded-xl focus:ring-2 focus:ring-[#066f48]/30 focus:outline-none focus:bg-white/50 transition-all text-gray-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              LGA
            </label>
            <input
              type="text"
              value={formData.lga}
              onChange={(e) =>
                setFormData({ ...formData, lga: e.target.value })
              }
              className="w-full px-3 py-2 bg-white/40 backdrop-blur-md border border-white/50 rounded-xl focus:ring-2 focus:ring-[#066f48]/30 focus:outline-none focus:bg-white/50 transition-all text-gray-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                className="w-full px-3 py-2 bg-white/40 backdrop-blur-md border border-white/50 rounded-xl focus:ring-2 focus:ring-[#066f48]/30 focus:outline-none focus:bg-white/50 transition-all text-gray-800"
              >
                <option value="Field Officer">Field Officer</option>
                <option value="Manager">Manager</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Admin Staff">Admin Staff</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <select
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
                className="w-full px-3 py-2 bg-white/40 backdrop-blur-md border border-white/50 rounded-xl focus:ring-2 focus:ring-[#066f48]/30 focus:outline-none focus:bg-white/50 transition-all text-gray-800"
              >
                <option value="Operations">Operations</option>
                <option value="Finance">Finance</option>
                <option value="Logistics">Logistics</option>
                <option value="IT">IT</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monthly Salary (₦)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={(formData.monthlySalary || 0) / 100}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  monthlySalary: parseFloat(e.target.value) * 100,
                })
              }
              className="w-full px-3 py-2 bg-white/40 backdrop-blur-md border border-white/50 rounded-xl focus:ring-2 focus:ring-[#066f48]/30 focus:outline-none focus:bg-white/50 transition-all text-gray-800"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white/40 backdrop-blur-md border border-white/60 text-gray-700 rounded-xl hover:bg-white/50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-lg"
            >
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Deactivate Staff Modal - Enhanced Glass
const DeactivateStaffModal: React.FC<{
  staff: Staff;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}> = ({ staff, onClose, onSubmit }) => {
  const [reason, setReason] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(reason);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white/80 backdrop-blur-2xl rounded-[2rem] max-w-md w-full shadow-2xl border border-white/60 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none rounded-[2rem]" />
        
        <div className="px-6 py-4 border-b border-white/40 bg-gradient-to-r from-red-500/15 to-red-400/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1/2 h-full bg-white/20 blur-xl rounded-full pointer-events-none" />
          <div className="flex justify-between items-start relative z-10">
            <h2 className="text-2xl font-bold text-red-700">
              Deactivate Staff
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 hover:bg-white/50 rounded-lg transition-all"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 relative z-10">
          <p className="text-sm text-gray-700 mb-4">
            You are about to deactivate <strong>{staff.fullName}</strong>.
            Please provide a reason.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Deactivation
              </label>
              <textarea
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 bg-white/40 backdrop-blur-md border border-white/50 rounded-xl focus:ring-2 focus:ring-red-500/30 focus:outline-none focus:bg-white/50 transition-all text-gray-800"
                placeholder="Enter reason for deactivation..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-white/40 backdrop-blur-md border border-white/60 text-gray-700 rounded-xl hover:bg-white/50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all shadow-lg"
              >
                Deactivate
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Approve Staff Modal - Enhanced Glass
interface ApproveStaffModalProps {
  staff: Staff;
  adminId: string;
  onClose: () => void;
  onApprove: () => void;
  onError: (error: string) => void;
}

const ApproveStaffModal: React.FC<ApproveStaffModalProps> = ({
  staff,
  adminId,
  onClose,
  onApprove,
  onError,
}) => {
  const [monthlySalary, setMonthlySalary] = useState(staff.monthlySalary || 0);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(
    null
  );
  const [profilePicturePreview, setProfilePicturePreview] = useState<string>(
    staff.profilePicture || ""
  );
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        onError("Please select a valid image file");
        return;
      }
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        onError("Image size must be less than 5MB");
        return;
      }
      setProfilePictureFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let profilePictureUrl = staff.profilePicture || "";

      // Upload profile picture if provided
      if (profilePictureFile) {
        setUploading(true);
        const uploadResult = await uploadProfilePicture(profilePictureFile);
        profilePictureUrl = uploadResult.url;
        setUploading(false);
      }

      // Approve staff with all details (approved_by is automatically set from authenticated user)
      const approveData: ApproveStaffDto = {
        monthly_salary: monthlySalary * 100, // Convert to kobo
        profile_picture: profilePictureUrl || undefined,
        notes: notes || undefined,
      };

      await approveStaff(staff.id, approveData);
      onApprove();
    } catch (err: any) {
      onError(err.message || "Failed to approve staff");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white/80 backdrop-blur-2xl rounded-[2rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/60 relative my-auto">
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none rounded-[2rem]" />
        
        <div className="px-6 py-4 border-b border-white/40 bg-gradient-to-r from-[#066f48]/15 to-cyan-400/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1/2 h-full bg-white/20 blur-xl rounded-full pointer-events-none" />
          <div className="flex justify-between items-center relative z-10">
            <h2 className="text-2xl font-bold text-[#066f48]">Approve Staff</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 hover:bg-white/50 rounded-lg transition-all"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 relative z-10">
          <div className="mb-6 p-4 bg-emerald-50/80 backdrop-blur-sm rounded-xl">
            <h3 className="font-semibold text-gray-800 mb-2">
              {staff.fullName}
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
              <div>
                <span className="font-medium">Phone:</span> {staff.phone}
              </div>
              <div>
                <span className="font-medium">Employee ID:</span>{" "}
                {staff.employeeId}
              </div>
              <div>
                <span className="font-medium">Role:</span> {staff.role}
              </div>
              <div>
                <span className="font-medium">Department:</span>{" "}
                {staff.department}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Picture Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Picture
              </label>
              <div className="flex items-start gap-4">
                {profilePicturePreview && (
                  <div className="flex-shrink-0">
                    <img
                      src={profilePicturePreview}
                      alt="Profile preview"
                      className="w-24 h-24 rounded-full object-cover border-2 border-white/50"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50/90 file:text-green-700 hover:file:bg-green-100/90"
                  />
                  <p className="mt-1 text-xs text-gray-600">
                    PNG, JPG, WEBP up to 5MB
                  </p>
                </div>
              </div>
            </div>

            {/* Monthly Salary */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Salary (₦)
              </label>
              <input
                type="number"
                required
                value={monthlySalary}
                onChange={(e) => setMonthlySalary(Number(e.target.value))}
                min="0"
                step="1000"
                className="w-full px-3 py-2 bg-white/40 backdrop-blur-md border border-white/50 rounded-xl focus:ring-2 focus:ring-[#066f48]/30 focus:outline-none focus:bg-white/50 transition-all text-gray-800"
                placeholder="Enter monthly salary"
              />
              <p className="mt-1 text-xs text-gray-600">
                Pension: Employee 8% (₦
                {Math.round(monthlySalary * 0.08).toLocaleString()}) + Employer
                10% (₦{Math.round(monthlySalary * 0.1).toLocaleString()})
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-white/40 backdrop-blur-md border border-white/50 rounded-xl focus:ring-2 focus:ring-[#066f48]/30 focus:outline-none focus:bg-white/50 transition-all text-gray-800"
                placeholder="Add any notes about the approval..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting || uploading}
                className="flex-1 px-4 py-2 bg-white/40 backdrop-blur-md border border-white/60 text-gray-700 rounded-xl hover:bg-white/50 disabled:opacity-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || uploading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                {uploading && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                )}
                {uploading
                  ? "Uploading..."
                  : submitting
                  ? "Approving..."
                  : "Approve Staff"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StaffManagementView;