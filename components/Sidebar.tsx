import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Scale,
  CreditCard,
  Smartphone,
  Settings,
  LogOut,
  X,
  Receipt,
  Shield,
  UserCog,
  Briefcase,
  DollarSign,
  PiggyBank,
  Package,
  ShoppingCart,
  Gift,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  onLogout,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "farmers", label: "Farmers", icon: Users },
    { id: "products", label: "Products", icon: Package },
    { id: "purchases", label: "Purchases", icon: ShoppingCart },
    { id: "loans", label: "Loans", icon: CreditCard },
    { id: "transactions", label: "Transactions", icon: Receipt },
    { id: "admins", label: "Admin Management", icon: Shield },
    { id: "staff-management", label: "Staff Management", icon: UserCog },
    { id: "payroll", label: "Payroll", icon: DollarSign },
    { id: "bonus", label: "Staff Bonus", icon: Gift },
    { id: "pension", label: "Pension", icon: PiggyBank },
    { id: "ussd", label: "USSD Logs", icon: Smartphone },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const handleItemClick = (id: string) => {
    navigate(`/${id}`);
    // Close sidebar on mobile after selection
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 flex flex-col z-50
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-xl font-bold text-gray-800 tracking-tight">
              Promise Point <span className="text-emerald-600">Agrictech</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-gray-600"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6">
          <div className="px-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === `/${item.id}`;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-150 ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 mr-3 ${
                      isActive ? "text-emerald-600" : "text-gray-400"
                    }`}
                  />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={onLogout}
            className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
};
