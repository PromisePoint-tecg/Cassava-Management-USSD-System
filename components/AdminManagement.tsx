import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit2, 
  Trash2, 
  UserCheck, 
  UserX, 
  AlertTriangle,
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  MoreVertical,
  X,
  Loader
} from 'lucide-react';

// Import API functions and types
import {
  AdminUser,
  AdminRole,
  AdminStatus,
  Permission,
  CreateAdminRequest,
  UpdateAdminRequest,
  AdminListQuery,
  getAllAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  activateAdmin,
  suspendAdmin,
  getRoleDisplayName,
  getStatusInfo,
  getPermissionsForRole
} from '../api/admins';

// Success modal component import
import { SuccessModal } from './SuccessModal';

// Form interfaces
interface CreateAdminFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role: AdminRole;
}

interface UpdateAdminFormData {
  firstName: string;
  lastName: string;
  role: AdminRole;
  status: AdminStatus;
  customPermissions?: Permission[];
}

// Loading states interface
interface LoadingState {
  list: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
  action: boolean;
}

// Error state interface
interface ErrorState {
  message: string;
  field?: string;
}

// Success state interface
interface SuccessState {
  show: boolean;
  title: string;
  message: string;
}

// Filter state interface
interface FilterState {
  role: AdminRole | '';
  status: AdminStatus | '';
  search: string;
}

// Utility functions for styling
const getRoleColor = (role: AdminRole): string => {
  switch (role) {
    case AdminRole.SUPER_ADMIN:
      return 'bg-red-100 text-red-700 border-red-200';
    case AdminRole.ADMIN:
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case AdminRole.FINANCE:
      return 'bg-green-100 text-green-700 border-green-200';
    case AdminRole.SUPPORT:
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case AdminRole.VIEWER:
      return 'bg-gray-100 text-gray-700 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const getStatusColor = (status: AdminStatus): string => {
  const info = getStatusInfo(status);
  switch (info.color) {
    case 'green':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'red':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'yellow':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

// Validation function
const validateCreateForm = (formData: CreateAdminFormData): string | null => {
  if (!formData.email.trim()) return 'Email is required';
  if (!formData.firstName.trim()) return 'First name is required';
  if (!formData.lastName.trim()) return 'Last name is required';
  if (!formData.password.trim()) return 'Password is required';
  if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
  if (formData.password.length < 8) return 'Password must be at least 8 characters';
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(formData.email)) return 'Please enter a valid email address';
  
  return null;
};
  }
};

// Success Modal Component
interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

// Create Admin Modal Component
interface CreateAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAdminFormData) => void;
  loading: boolean;
  error: ErrorState | null;
}

const CreateAdminModal: React.FC<CreateAdminModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  loading,
  error
}) => {
  const [formData, setFormData] = useState<CreateAdminFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: AdminRole.VIEWER,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});
    
    // Validate form
    const validationError = validateCreateForm(formData);
    if (validationError) {
      setErrors({ general: validationError });
      return;
    }
    
    onSubmit(formData);
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      role: AdminRole.VIEWER,
    });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Create New Admin</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-1"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {(error || errors.general) && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {error?.message || errors.general}
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address*
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="admin@farmconnect.com"
              disabled={loading}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name*
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="John"
                disabled={loading}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name*
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Doe"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password*
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="••••••••"
              disabled={loading}
              required
              minLength={8}
            />
            <p className="text-xs text-gray-500 mt-1">
              Password must be at least 8 characters long
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password*
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="••••••••"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role*
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as AdminRole })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              disabled={loading}
              required
            >
              {Object.values(AdminRole).map((role) => (
                <option key={role} value={role}>
                  {getRoleDisplayName(role)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              {loading ? 'Creating...' : 'Create Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                errors.password ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Minimum 8 characters"
              disabled={loading}
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name*
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                  errors.firstName ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="John"
                disabled={loading}
              />
              {errors.firstName && (
                <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name*
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                  errors.lastName ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Doe"
                disabled={loading}
              />
              {errors.lastName && (
                <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role*
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as AdminRole })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              disabled={loading}
            >
              <option value={AdminRole.VIEWER}>Viewer</option>
              <option value={AdminRole.SUPPORT}>Support</option>
              <option value={AdminRole.FINANCE}>Finance</option>
              <option value={AdminRole.ADMIN}>Admin</option>
              <option value={AdminRole.SUPER_ADMIN}>Super Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                errors.phone ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="+2348012345678"
              disabled={loading}
            />
            {errors.phone && (
              <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Optional notes about this admin..."
              disabled={loading}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              disabled={loading}
            >
              {loading && (
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              Create Admin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main AdminManagement Component
export const AdminManagement: React.FC = () => {
  // State management
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState<LoadingState>({
    list: true,
    create: false,
    update: false,
    delete: false,
    action: false,
  });
  const [error, setError] = useState<ErrorState | null>(null);
  const [success, setSuccess] = useState<SuccessState>({
    show: false,
    title: '',
    message: '',
  });
  
  // Filter and search state
  const [filters, setFilters] = useState<FilterState>({
    role: '',
    status: '',
    search: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
  });

  // Load admins on component mount and when filters/pagination change
  useEffect(() => {
    loadAdmins();
  }, [filters, pagination.currentPage]);

  // Load admins from API
  const loadAdmins = async () => {
    try {
      setLoading(prev => ({ ...prev, list: true }));
      setError(null);
      
      const query: AdminListQuery = {
        page: pagination.currentPage,
        limit: pagination.limit,
        ...(filters.role && { role: filters.role as AdminRole }),
        ...(filters.status && { status: filters.status as AdminStatus }),
        ...(filters.search && { search: filters.search }),
      };
      
      const response = await getAllAdmins(query);
      
      setAdmins(response.data);
      setPagination(prev => ({
        ...prev,
        totalCount: response.totalCount,
        totalPages: response.totalPages,
      }));
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : 'Failed to load admins',
      });
    } finally {
      setLoading(prev => ({ ...prev, list: false }));
    }
  };

  // Handle create admin
  const handleCreateAdmin = async (formData: CreateAdminFormData) => {
    try {
      setLoading(prev => ({ ...prev, create: true }));
      setError(null);
      
      // Validate form
      const validationError = validateCreateForm(formData);
      if (validationError) {
        setError({ message: validationError });
        return;
      }
      
      // Prepare API request
      const createRequest: CreateAdminRequest = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
      };
      
      const response = await createAdmin(createRequest);
      
      if (response.success) {
        setSuccess({
          show: true,
          title: 'Admin Created Successfully',
          message: `Admin ${formData.firstName} ${formData.lastName} has been created successfully.`,
        });
        
        setCreateModalOpen(false);
        await loadAdmins(); // Refresh the list
      } else {
        setError({ message: response.message || 'Failed to create admin' });
      }
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : 'Failed to create admin',
      });
    } finally {
      setLoading(prev => ({ ...prev, create: false }));
    }
  };

  // Handle admin status change
  const handleStatusChange = async (admin: AdminUser, newStatus: AdminStatus) => {
    try {
      setLoading(prev => ({ ...prev, action: true }));
      setError(null);
      
      let response;
      if (newStatus === AdminStatus.ACTIVE) {
        response = await activateAdmin(admin.id);
      } else if (newStatus === AdminStatus.SUSPENDED) {
        response = await suspendAdmin(admin.id);
      }
      
      if (response?.success) {
        setSuccess({
          show: true,
          title: 'Status Updated',
          message: `${admin.firstName} ${admin.lastName}'s status has been updated to ${getStatusInfo(newStatus).label}.`,
        });
        
        await loadAdmins(); // Refresh the list
      }
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : 'Failed to update admin status',
      });
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  // Handle delete admin
  const handleDeleteAdmin = async (admin: AdminUser) => {
    if (!confirm(`Are you sure you want to delete ${admin.firstName} ${admin.lastName}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setLoading(prev => ({ ...prev, delete: true }));
      setError(null);
      
      const response = await deleteAdmin(admin.id);
      
      if (response.success) {
        setSuccess({
          show: true,
          title: 'Admin Deleted',
          message: `${admin.firstName} ${admin.lastName} has been deleted successfully.`,
        });
        
        await loadAdmins(); // Refresh the list
      }
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : 'Failed to delete admin',
      });
    } finally {
      setLoading(prev => ({ ...prev, delete: false }));
    }
  };

  // Filter admins based on search and filters
  const filteredAdmins = admins; // API handles filtering, so we use the data as-is

  // Handle search
  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page
  };

  // Handle filter change
  const handleFilterChange = (filterType: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      role: '',
      status: '',
      search: '',
    });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Admin Management</h1>
          <p className="text-gray-600 mt-1">
            Manage admin users and their permissions
          </p>
        </div>
        
        <button
          onClick={() => setCreateModalOpen(true)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
          disabled={loading.create}
        >
          <Plus className="w-4 h-4" />
          Create Admin
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error.message}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search admins by name, email..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Role Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={filters.role}
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">All Roles</option>
                  {Object.values(AdminRole).map((role) => (
                    <option key={role} value={role}>
                      {getRoleDisplayName(role)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  {Object.values(AdminStatus).map((status) => (
                    <option key={status} value={status}>
                      {getStatusInfo(status).label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Admins Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        {loading.list ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-6 h-6 animate-spin text-emerald-600" />
            <span className="ml-2 text-gray-600">Loading admins...</span>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Admin
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAdmins.length > 0 ? (
                    filteredAdmins.map((admin) => (
                      <tr key={admin.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 w-10 h-10">
                              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                <User className="w-5 h-5 text-emerald-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {admin.firstName} {admin.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {admin.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getRoleColor(admin.role)}`}>
                            {getRoleDisplayName(admin.role)}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(admin.status)}`}>
                            {getStatusInfo(admin.status).label}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500">
                          {admin.lastLogin 
                            ? new Date(admin.lastLogin).toLocaleDateString() 
                            : 'Never'
                          }
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500">
                          {new Date(admin.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4 text-sm font-medium">
                          <div className="flex items-center gap-2">
                            {/* Status Toggle */}
                            {admin.status === AdminStatus.ACTIVE ? (
                              <button
                                onClick={() => handleStatusChange(admin, AdminStatus.SUSPENDED)}
                                className="text-orange-600 hover:text-orange-700 p-1 rounded"
                                disabled={loading.action}
                                title="Suspend Admin"
                              >
                                <UserX className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStatusChange(admin, AdminStatus.ACTIVE)}
                                className="text-green-600 hover:text-green-700 p-1 rounded"
                                disabled={loading.action}
                                title="Activate Admin"
                              >
                                <UserCheck className="w-4 h-4" />
                              </button>
                            )}
                            
                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteAdmin(admin)}
                              className="text-red-600 hover:text-red-700 p-1 rounded"
                              disabled={loading.delete}
                              title="Delete Admin"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        No admins found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of{' '}
                  {pagination.totalCount} results
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                    disabled={pagination.currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Admin Modal */}
      <CreateAdminModal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setError(null);
        }}
        onSubmit={handleCreateAdmin}
        loading={loading.create}
        error={error}
      />

      {/* Success Modal */}
      {success.show && (
        <SuccessModal
          isOpen={success.show}
          onClose={() => setSuccess({ show: false, title: '', message: '' })}
          title={success.title}
          message={success.message}
        />
      )}
    </div>
  );
};
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setAdmins(prev => [newAdmin, ...prev]);
      setCreateModalOpen(false);
      setSuccessModal({
        isOpen: true,
        title: 'Admin Created Successfully',
        message: `New admin account created for ${formData.firstName} ${formData.lastName}. Login credentials have been sent via email.`,
      });
    } catch (error) {
      console.error('Failed to create admin:', error);
      alert('Failed to create admin. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleStatusChange = async (adminId: string, newStatus: AdminStatus) => {
    try {
      // TODO: Replace with actual API call
      setAdmins(prev => 
        prev.map(admin => 
          admin.id === adminId 
            ? { ...admin, status: newStatus, updatedAt: new Date() }
            : admin
        )
      );
      
      setSuccessModal({
        isOpen: true,
        title: 'Status Updated',
        message: `Admin status has been updated to ${newStatus}.`,
      });
    } catch (error) {
      console.error('Failed to update admin status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    if (!confirm('Are you sure you want to delete this admin? This action cannot be undone.')) {
      return;
    }

    try {
      // TODO: Replace with actual API call
      setAdmins(prev => prev.filter(admin => admin.id !== adminId));
      
      setSuccessModal({
        isOpen: true,
        title: 'Admin Deleted',
        message: 'Admin account has been successfully deleted.',
      });
    } catch (error) {
      console.error('Failed to delete admin:', error);
      alert('Failed to delete admin. Please try again.');
    }
  };

  // Filter admins based on search and filters
  const filteredAdmins = admins.filter(admin => {
    const matchesSearch = 
      admin.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = !roleFilter || admin.role === roleFilter;
    const matchesStatus = !statusFilter || admin.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Admin Management</h2>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
          
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Admin
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as AdminRole | '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">All Roles</option>
                <option value={AdminRole.SUPER_ADMIN}>Super Admin</option>
                <option value={AdminRole.ADMIN}>Admin</option>
                <option value={AdminRole.FINANCE}>Finance</option>
                <option value={AdminRole.SUPPORT}>Support</option>
                <option value={AdminRole.VIEWER}>Viewer</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as AdminStatus | '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value={AdminStatus.ACTIVE}>Active</option>
                <option value={AdminStatus.INACTIVE}>Inactive</option>
                <option value={AdminStatus.SUSPENDED}>Suspended</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Admins Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-4"></div>
            <p className="text-gray-600">Loading admins...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Admin
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAdmins.length > 0 ? (
                    filteredAdmins.map((admin) => (
                      <tr key={admin.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium">
                              <User className="w-5 h-5" />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-800">{admin.fullName}</div>
                              <div className="text-sm text-gray-500 flex items-center">
                                <Mail className="w-3 h-3 mr-1" />
                                {admin.email}
                              </div>
                              {admin.phone && (
                                <div className="text-sm text-gray-500 flex items-center">
                                  <Phone className="w-3 h-3 mr-1" />
                                  {admin.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(admin.role)}`}>
                            <Shield className="w-3 h-3 mr-1" />
                            {getRoleDisplayName(admin.role)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(admin.status)}`}>
                            {admin.status.charAt(0).toUpperCase() + admin.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-800">
                            {admin.lastLogin ? (
                              <div className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                                {admin.lastLogin.toLocaleDateString()}
                              </div>
                            ) : (
                              <span className="text-gray-500">Never</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-800">
                            <div className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                              {admin.createdAt.toLocaleDateString()}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            {admin.status === AdminStatus.ACTIVE ? (
                              <button
                                onClick={() => handleStatusChange(admin.id, AdminStatus.SUSPENDED)}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium text-orange-700 bg-orange-100 rounded hover:bg-orange-200 transition-colors"
                                title="Suspend Admin"
                              >
                                <UserX className="w-3 h-3 mr-1" />
                                Suspend
                              </button>
                            ) : admin.status === AdminStatus.SUSPENDED ? (
                              <button
                                onClick={() => handleStatusChange(admin.id, AdminStatus.ACTIVE)}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200 transition-colors"
                                title="Activate Admin"
                              >
                                <UserCheck className="w-3 h-3 mr-1" />
                                Activate
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStatusChange(admin.id, AdminStatus.ACTIVE)}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200 transition-colors"
                                title="Activate Admin"
                              >
                                <UserCheck className="w-3 h-3 mr-1" />
                                Activate
                              </button>
                            )}

                            <button
                              className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
                              title="Edit Admin"
                            >
                              <Edit2 className="w-3 h-3 mr-1" />
                              Edit
                            </button>

                            <button
                              onClick={() => handleDeleteAdmin(admin.id)}
                              className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded hover:bg-red-200 transition-colors"
                              title="Delete Admin"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        No admins found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <CreateAdminModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateAdmin}
        loading={createLoading}
      />

      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal({ isOpen: false, title: '', message: '' })}
        title={successModal.title}
        message={successModal.message}
      />
    </div>
  );
};