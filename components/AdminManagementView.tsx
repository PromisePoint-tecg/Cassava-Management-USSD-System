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
import { adminApi, Admin, AdminRole, AdminFilters, CreateAdminData } from '../services/admin';
import { SuccessModal } from './SuccessModal';
import LeafButtonLoader from './Loader';

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
        return 'bg-green-200/90 text-green-900 border border-green-300/50';
      case AdminRole.SUPPORT:
        return 'bg-green-100/90 text-green-800 border border-green-200/50';
      case AdminRole.VERIFIER:
        return 'bg-green-100/90 text-green-800 border border-green-200/50';
      case AdminRole.FINANCE:
        return 'bg-green-100/90 text-green-700 border border-green-200/50';
      default:
        return 'bg-gray-100/90 text-gray-800 border border-gray-200/50';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50">
      <div className="bg-white/80 backdrop-blur-2xl rounded-[2rem] shadow-2xl max-w-md w-full mx-4 border border-white/60 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none rounded-[2rem]" />
        
        <div className="bg-gradient-to-r from-[#066f48]/15 to-cyan-400/10 border-b border-white/40 px-6 py-4 relative overflow-hidden rounded-t-[2rem]">
          <div className="absolute top-0 left-0 w-1/2 h-full bg-white/20 blur-xl rounded-full pointer-events-none" />
          <div className="flex justify-between items-center relative z-10">
            <h3 className="text-lg font-semibold text-[#066f48]">Admin Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 hover:bg-white/50 rounded-lg transition-all"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4 relative z-10">
          {/* Admin Avatar and Basic Info */}
          <div className="flex items-center space-x-4 pb-4 border-b border-white/30">
            <div className="w-16 h-16 bg-[#066f48]/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/50">
              <Users className="w-8 h-8 text-[#066f48]" />
            </div>
            <div>
              <h4 className="text-lg font-medium text-gray-900">{admin.fullName}</h4>
              <p className="text-sm text-gray-600">{admin.email}</p>
              <div className="flex items-center space-x-2 mt-2">
                <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-lg backdrop-blur-sm ${getRoleColor(admin.role)}`}>
                  {getRoleDisplayName(admin.role)}
                </span>
                <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-lg backdrop-blur-sm border ${
                  admin.isActive
                    ? 'bg-green-100/90 text-green-800 border-green-200/50'
                    : 'bg-gray-100/90 text-gray-800 border-gray-200/50'
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
              <p className="text-sm text-gray-900 bg-white/40 backdrop-blur-sm p-2 rounded-xl border border-white/50">{admin.firstName}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <p className="text-sm text-gray-900 bg-white/40 backdrop-blur-sm p-2 rounded-xl border border-white/50">{admin.lastName}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <p className="text-sm text-gray-900 bg-white/40 backdrop-blur-sm p-2 rounded-xl border border-white/50">{admin.email}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Admin ID</label>
              <p className="text-sm text-gray-900 bg-white/40 backdrop-blur-sm p-2 rounded-xl border border-white/50 font-mono">{admin.id}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Created At</label>
              <p className="text-sm text-gray-900 bg-white/40 backdrop-blur-sm p-2 rounded-xl border border-white/50">{formatDate(admin.createdAt)}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Updated</label>
              <p className="text-sm text-gray-900 bg-white/40 backdrop-blur-sm p-2 rounded-xl border border-white/50">{formatDate(admin.updatedAt)}</p>
            </div>
          </div>
        </div>

        <div className="p-6 pt-0 flex justify-end relative z-10">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/40 backdrop-blur-md border border-white/60 rounded-xl hover:bg-white/50 text-gray-700 transition-all"
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50">
      <div className="bg-white/80 backdrop-blur-2xl rounded-[2rem] shadow-2xl max-w-md w-full mx-4 border border-white/60 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none rounded-[2rem]" />
        
        <div className="bg-gradient-to-r from-[#066f48]/15 to-cyan-400/10 border-b border-white/40 px-6 py-4 relative overflow-hidden rounded-t-[2rem]">
          <div className="absolute top-0 left-0 w-1/2 h-full bg-white/20 blur-xl rounded-full pointer-events-none" />
          <div className="flex justify-between items-center relative z-10">
            <h3 className="text-lg font-semibold text-[#066f48]">Create New Admin</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 hover:bg-white/50 rounded-lg transition-all"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 relative z-10">
          {error && (
            <div className="p-3 bg-red-50/90 backdrop-blur-sm border border-red-200/50 rounded-xl">
              <p className="text-red-800 text-sm">{error}</p>
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
                className="w-full px-3 py-2 bg-white/40 backdrop-blur-md border border-white/50 rounded-xl focus:ring-2 focus:ring-[#066f48]/30 focus:outline-none focus:bg-white/50 transition-all"
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
                className="w-full px-3 py-2 bg-white/40 backdrop-blur-md border border-white/50 rounded-xl focus:ring-2 focus:ring-[#066f48]/30 focus:outline-none focus:bg-white/50 transition-all"
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
              className="w-full px-3 py-2 bg-white/40 backdrop-blur-md border border-white/50 rounded-xl focus:ring-2 focus:ring-[#066f48]/30 focus:outline-none focus:bg-white/50 transition-all"
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
                className="w-full px-3 py-2 pr-10 bg-white/40 backdrop-blur-md border border-white/50 rounded-xl focus:ring-2 focus:ring-[#066f48]/30 focus:outline-none focus:bg-white/50 transition-all"
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
              className="w-full px-3 py-2 bg-white/40 backdrop-blur-md border border-white/50 rounded-xl focus:ring-2 focus:ring-[#066f48]/30 focus:outline-none focus:bg-white/50 transition-all"
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
              className="flex-1 px-4 py-2 bg-white/40 backdrop-blur-md border border-white/60 rounded-xl hover:bg-white/50 text-gray-700 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-[#066f48] text-white rounded-xl hover:bg-[#055a3a] disabled:opacity-50 shadow-lg transition-all"
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
        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white/20 backdrop-blur-sm transition-all"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-8 z-20 bg-white/90 backdrop-blur-xl border border-white/60 rounded-xl shadow-2xl py-1 min-w-[150px] transform -translate-x-2 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
            <button
              onClick={() => {
                onAction('view', admin);
                setIsOpen(false);
              }}
              className="relative w-full px-4 py-2 text-left text-sm text-[#066f48] hover:bg-white/40 flex items-center transition-all"
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
                className="relative w-full px-4 py-2 text-left text-sm text-[#066f48] hover:bg-white/40 flex items-center transition-all"
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
                className="relative w-full px-4 py-2 text-left text-sm text-[#066f48] hover:bg-white/40 flex items-center transition-all"
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
              className="relative w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-white/40 flex items-center transition-all"
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
      page: key !== 'page' ? 1 : value,
    }));
  };

  const handleCreateSuccess = (admin: Admin) => {
    setAdmins(prev => [admin, ...prev]);
    setSuccessModal({
      isOpen: true,
      title: 'Admin Created!',
      message: `Admin account for ${admin.fullName} has been created successfully.`,
    });
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

      loadAdmins();
    } catch (err: any) {
      alert(`Failed to ${action} admin: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header - Liquid Glass */}
      <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] p-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/5 to-transparent rounded-b-[2rem] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#066f48]/5 via-transparent to-cyan-400/5 rounded-[2rem] pointer-events-none" />
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-white/30 to-transparent blur-3xl rounded-full pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center">
              <div className="p-2 rounded-xl bg-[#066f48] mr-3 shadow-lg">
                <Shield className="w-5 h-5 text-white" />
              </div>
              Admin Management
            </h2>
            <p className="text-gray-600 text-sm mt-1 ml-12">
              Manage admin accounts, roles, and permissions
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 bg-white/25 backdrop-blur-md border border-white/50 rounded-xl text-sm font-medium text-gray-700 hover:bg-white/35 transition-all"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </button>
            
            <button
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-[#066f48] text-white rounded-xl text-sm font-medium hover:bg-[#055a3a] shadow-lg transition-all"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Admin
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Admins', value: pagination.total, color: 'gray' },
          { label: 'Active', value: admins.filter(admin => admin.isActive).length, color: 'green' },
          { label: 'Inactive', value: admins.filter(admin => !admin.isActive).length, color: 'red' },
          { label: 'Super Admins', value: admins.filter(admin => admin.role === AdminRole.SUPER_ADMIN).length, color: 'purple' },
        ].map((stat, index) => (
          <div key={index} className="bg-gradient-to-br from-white/22 via-white/18 to-white/20 backdrop-blur-2xl rounded-[2rem] border border-white/30 shadow-[0_8px_32px_0_rgba(31,38,135,0.15),0_1px_3px_0_rgba(255,255,255,0.8)_inset] p-5 relative overflow-hidden hover:from-white/25 hover:via-white/22 hover:to-white/23 transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-2/5 bg-gradient-to-b from-white/25 via-white/8 to-transparent rounded-t-[2rem] pointer-events-none blur-[1px]" />
            <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/2 via-black/1 to-transparent rounded-b-[2rem] pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#066f48]/2 via-transparent to-cyan-400/2 rounded-[2rem] pointer-events-none" />
            <div className="absolute top-0 left-0 w-2/3 h-2/3 bg-gradient-to-br from-white/15 via-white/5 to-transparent blur-3xl rounded-full pointer-events-none" />
            <div className="relative z-10">
              <div className="text-sm text-gray-600">{stat.label}</div>
              <div className={`text-2xl font-bold ${
                stat.color === 'green' ? 'text-green-600' : 
                stat.color === 'red' ? 'text-red-600' : 
                stat.color === 'purple' ? 'text-purple-600' : 
                'text-gray-800'
              }`}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Panel - Liquid Glass */}
      {showFilters && (
        <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
          <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-white/30 to-transparent blur-3xl rounded-full pointer-events-none" />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10 pr-3 py-2 bg-white/40 backdrop-blur-md border border-white/50 rounded-xl text-sm w-full focus:ring-2 focus:ring-[#066f48]/30 focus:outline-none focus:bg-white/50 transition-all"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={filters.role || ''}
                onChange={(e) => handleFilterChange('role', e.target.value)}
                className="w-full px-3 py-2 bg-white/40 backdrop-blur-md border border-white/50 rounded-xl text-sm focus:ring-2 focus:ring-[#066f48]/30 focus:outline-none focus:bg-white/50 transition-all"
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
                className="w-full px-3 py-2 bg-white/40 backdrop-blur-md border border-white/50 rounded-xl text-sm focus:ring-2 focus:ring-[#066f48]/30 focus:outline-none focus:bg-white/50 transition-all"
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
                className="w-full px-4 py-2 bg-white/25 backdrop-blur-md border border-white/50 rounded-xl text-sm hover:bg-white/35 text-gray-700 transition-all"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Table - Liquid Glass */}
      <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/5 to-transparent rounded-b-[2rem] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#066f48]/5 via-transparent to-cyan-400/5 rounded-[2rem] pointer-events-none" />
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-white/30 to-transparent blur-3xl rounded-full pointer-events-none" />
        
        {error && (
          <div className="p-4 bg-red-50/90 backdrop-blur-sm border-b border-red-200/50 relative z-10">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
        
        {loading ? (
          <div className="p-8 text-center relative z-10">
                  <LeafButtonLoader />
            <p className="text-gray-600">Loading admins...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto relative z-10">
              <table className="min-w-full">
                <thead className="bg-white/20 backdrop-blur-md border-b border-white/30">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Admin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {admins.length > 0 ? (
                    admins.map((admin) => (
                      <tr key={admin.id} className="hover:bg-white/10 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-[#066f48]/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/50">
                              <Users className="w-5 h-5 text-[#066f48]" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {admin.fullName}
                              </div>
                              <div className="text-sm text-gray-600">
                                {admin.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-lg backdrop-blur-sm ${
                            adminApi.getRoleColor(admin.role)
                          }`}>
                            {adminApi.getRoleDisplayName(admin.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-lg backdrop-blur-sm border ${
                            admin.isActive
                              ? 'bg-green-100/90 text-green-800 border-green-200/50'
                              : 'bg-gray-100/90 text-gray-800 border-gray-200/50'
                          }`}>
                            {admin.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(admin.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {actionLoading === admin.id ? (
                            <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-[#066f48]"></div>
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
              <div className="px-6 py-3 bg-white/20 backdrop-blur-md border-t border-white/30 flex items-center justify-between relative z-10">
                <div className="text-sm text-gray-700">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} admins
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleFilterChange('page', pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 bg-white/25 backdrop-blur-md border border-white/50 rounded-xl text-sm text-gray-700 hover:bg-white/35 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => handleFilterChange('page', page)}
                        className={`px-4 py-2 rounded-xl text-sm transition-all ${
                          page === pagination.page
                            ? 'bg-[#066f48] text-white shadow-lg'
                            : 'bg-white/25 backdrop-blur-md border border-white/50 text-gray-700 hover:bg-white/35'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => handleFilterChange('page', pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-4 py-2 bg-white/25 backdrop-blur-md border border-white/50 rounded-xl text-sm text-gray-700 hover:bg-white/35 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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