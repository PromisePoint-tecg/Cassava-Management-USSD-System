import React, { useState } from "react";
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  onLogout,
  isCollapsed,
  onToggleCollapse,
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
        bg-white border-r border-gray-200 h-screen fixed left-0 top-0 flex flex-col z-50
        transform transition-all duration-300 ease-in-out
        lg:translate-x-0
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        ${isCollapsed ? "w-20" : "w-64"}
      `}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
          <div className={`flex items-center ${isCollapsed ? "justify-center w-full" : ""}`}>
            <img 
              src="https://res.cloudinary.com/dt9unisic/image/upload/v1768578156/Screenshot_2026-01-16_at_4.41.39_pm_x5zzrb.png" 
              alt="Promise Point Agritech Logo" 
              className={`transition-all duration-300 ${isCollapsed ? "h-10 w-auto" : "h-14 w-auto"}`}
            />
          </div>
          {!isCollapsed && (
            <button
              onClick={onClose}
              className="lg:hidden text-gray-400 hover:text-gray-600"
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Collapse button - desktop only */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex items-center justify-center h-10 mx-2 mt-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors focus:outline-none"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>

        <nav className="flex-1 overflow-y-auto py-6">
          <div className={`${isCollapsed ? "px-2" : "px-4"} space-y-1`}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === `/${item.id}`;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full flex items-center ${isCollapsed ? "justify-center px-2" : "px-4"} py-3 text-sm font-medium rounded-lg transition-colors duration-150 focus:outline-none ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  title={isCollapsed ? item.label : ""}
                >
                  <Icon
                    className={`${isCollapsed ? "" : "mr-3"} w-5 h-5 ${
                      isActive ? "text-emerald-600" : "text-gray-400"
                    }`}
                  />
                  {!isCollapsed && item.label}
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
