import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  MoreVertical,
  UserCheck,
  UserX,
  Trash2,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react';
import { adminApi, Admin, AdminRole, AdminFilters, CreateAdminData } from '../api/admin';
import { SuccessModal } from './SuccessModal';

interface ViewAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  admin: Admin | null;
}

const ViewAdminModal: React.FC<ViewAdminModalProps> = ({ isOpen, onClose, admin }) => {
  if (!isOpen || !admin) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleDisplayName = (role: AdminRole): string => {
    switch (role) {
      case AdminRole.SUPER_ADMIN:
        return 'Super Admin';
      case AdminRole.SUPPORT:
        return 'Support';
      case AdminRole.VERIFIER:
        return 'Verifier';
      case AdminRole.FINANCE:
        return 'Finance';
      default:
        return role;
    }
  };

  const getRoleColor = (role: AdminRole): string => {
    switch (role) {
      case AdminRole.SUPER_ADMIN:
        return 'bg-green-200 text-green-900';
      case AdminRole.SUPPORT:
        return 'bg-green-100 text-green-800';
      case AdminRole.VERIFIER:
        return 'bg-green-100 text-green-800';
      case AdminRole.FINANCE:
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Admin Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* Admin Avatar and Basic Info */}
          <div className="flex items-center space-x-4 pb-4 border-b border-gray-200">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h4 className="text-lg font-medium text-gray-900">{admin.fullName}</h4>
              <p className="text-sm text-gray-500">{admin.email}</p>
              <div className="flex items-center space-x-2 mt-2">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  getRoleColor(admin.role)
                }`}>
                  {getRoleDisplayName(admin.role)}
                </span>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  admin.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {admin.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Admin Details */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{admin.firstName}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{admin.lastName}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{admin.email}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Admin ID</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded font-mono">{admin.id}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Created At</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{formatDate(admin.createdAt)}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Updated</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{formatDate(admin.updatedAt)}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

interface CreateAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (admin: Admin) => void;
}

const CreateAdminModal: React.FC<CreateAdminModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<CreateAdminData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: AdminRole.SUPPORT,
    permissions: [],
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const admin = await adminApi.createAdmin(formData);
      onSuccess(admin);
      onClose();
      // Reset form
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: AdminRole.SUPPORT,
        permissions: [],
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create admin');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Create New Admin</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="admin@promisepoint.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Minimum 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as AdminRole })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value={AdminRole.SUPPORT}>Support</option>
              <option value={AdminRole.VERIFIER}>Verifier</option>
              <option value={AdminRole.FINANCE}>Finance</option>
              <option value={AdminRole.SUPER_ADMIN}>Super Admin</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface AdminActionsMenuProps {
  admin: Admin;
  onAction: (action: 'activate' | 'deactivate' | 'delete' | 'view', admin: Admin) => void;
}

const AdminActionsMenu: React.FC<AdminActionsMenuProps> = ({ admin, onAction }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[150px] transform -translate-x-2">
            <button
              onClick={() => {
                onAction('view', admin);
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 flex items-center"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </button>
            {admin.isActive ? (
              <button
                onClick={() => {
                  onAction('deactivate', admin);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 flex items-center"
              >
                <UserX className="w-4 h-4 mr-2" />
                Deactivate
              </button>
            ) : (
              <button
                onClick={() => {
                  onAction('activate', admin);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 flex items-center"
              >
                <UserCheck className="w-4 h-4 mr-2" />
                Activate
              </button>
            )}
            <button
              onClick={() => {
                onAction('delete', admin);
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-green-700 hover:bg-green-50 flex items-center"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export const AdminManagementView: React.FC = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<AdminFilters>({
    page: 1,
    limit: 20,
    search: '',
    role: '',
    status: 'all',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({ isOpen: false, title: '', message: '' });

  useEffect(() => {
    loadAdmins();
  }, [filters]);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminApi.getAllAdmins(filters);
      setAdmins(response.admins);
      setPagination({
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof AdminFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value, // Reset to first page when filtering
    }));
  };

  const handleCreateSuccess = (admin: Admin) => {
    setAdmins(prev => [admin, ...prev]);
    setSuccessModal({
      isOpen: true,
      title: 'Admin Created!',
      message: `Admin account for ${admin.fullName} has been created successfully.`,
    });
    // Reload to get updated pagination
    loadAdmins();
  };

  const handleAdminAction = async (
    action: 'activate' | 'deactivate' | 'delete' | 'view',
    admin: Admin
  ) => {
    if (action === 'view') {
      setSelectedAdmin(admin);
      setViewModalOpen(true);
      return;
    }

    if (!confirm(`Are you sure you want to ${action} ${admin.fullName}?`)) {
      return;
    }

    try {
      setActionLoading(admin.id);
      
      if (action === 'activate') {
        const response = await adminApi.activateAdmin(admin.id, {
          reason: 'Activated via admin panel',
        });
        setSuccessModal({
          isOpen: true,
          title: 'Admin Activated!',
          message: response.message,
        });
      } else if (action === 'deactivate') {
        const response = await adminApi.deactivateAdmin(admin.id, {
          reason: 'Deactivated via admin panel',
        });
        setSuccessModal({
          isOpen: true,
          title: 'Admin Deactivated!',
          message: response.message,
        });
      } else if (action === 'delete') {
        await adminApi.deleteAdmin(admin.id);
        setSuccessModal({
          isOpen: true,
          title: 'Admin Deleted!',
          message: `Admin account for ${admin.fullName} has been deleted successfully.`,
        });
      }

      // Reload admins
      loadAdmins();
    } catch (err: any) {
      alert(`Failed to ${action} admin: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center">
            <Shield className="w-6 h-6 mr-2 text-emerald-600" />
            Admin Management
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Manage admin accounts, roles, and permissions
          </p>
        </div>
        
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
            className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Admin
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">Total Admins</div>
          <div className="text-2xl font-bold text-gray-800">{pagination.total}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">Active</div>
          <div className="text-2xl font-bold text-green-600">
            {admins.filter(admin => admin.isActive).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">Inactive</div>
          <div className="text-2xl font-bold text-red-600">
            {admins.filter(admin => !admin.isActive).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">Super Admins</div>
          <div className="text-2xl font-bold text-purple-600">
            {admins.filter(admin => admin.role === AdminRole.SUPER_ADMIN).length}
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={filters.role || ''}
                onChange={(e) => handleFilterChange('role', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">All Roles</option>
                <option value={AdminRole.SUPER_ADMIN}>Super Admin</option>
                <option value={AdminRole.SUPPORT}>Support</option>
                <option value={AdminRole.VERIFIER}>Verifier</option>
                <option value={AdminRole.FINANCE}>Finance</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status || 'all'}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilters({
                    page: 1,
                    limit: 20,
                    search: '',
                    role: '',
                    status: 'all',
                  });
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-visible">
        {error && (
          <div className="p-4 bg-green-50 border-b border-green-200">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-4"></div>
            <p className="text-gray-600">Loading admins...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto overflow-y-visible">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Admin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {admins.length > 0 ? (
                    admins.map((admin) => (
                      <tr key={admin.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                              <Users className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {admin.fullName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {admin.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            adminApi.getRoleColor(admin.role)
                          }`}>
                            {adminApi.getRoleDisplayName(admin.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            admin.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {admin.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(admin.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {actionLoading === admin.id ? (
                            <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                          ) : (
                            <AdminActionsMenu
                              admin={admin}
                              onAction={handleAdminAction}
                            />
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        No admins found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} admins
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleFilterChange('page', pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 rounded border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => handleFilterChange('page', page)}
                        className={`px-3 py-1 rounded text-sm ${
                          page === pagination.page
                            ? 'bg-emerald-500 text-white'
                            : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => handleFilterChange('page', pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-1 rounded border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <CreateAdminModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <ViewAdminModal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedAdmin(null);
        }}
        admin={selectedAdmin}
      />

      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal({ ...successModal, isOpen: false })}
        title={successModal.title}
        message={successModal.message}
      />
    </div>
  );
};