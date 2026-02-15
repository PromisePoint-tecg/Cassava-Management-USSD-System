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
  Truck,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  userRole?: string; // Add user role prop
}

// Role-based access control mapping
const ROLE_PERMISSIONS = {
  super_admin: [
    "dashboard",
    "farmers",
    "student-farmers",
    "products",
    "purchases",
    "loans",
    "pickup-delivery",
    "transactions",
    "finance",
    "admins",
    "staff-management",
    "payroll",
    "bonus",
    "pension",
    "ussd",
    "settings",
  ],
  finance: [
    "dashboard",
    "transactions",
    "finance",
    "payroll",
    "bonus",
    "pension",
    "staff-management",
    "products",
    "purchases",
  ],
  support: [
    "dashboard",
    "farmers",
    "student-farmers",
    "ussd",
    "purchases",
    "products",
    "pickup-delivery",
  ],
  verifier: [
    "dashboard",
    "farmers",
    "student-farmers",
    "products",
    "purchases",
    "loans",
    "pickup-delivery",
  ],
};

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  onLogout,
  isCollapsed,
  onToggleCollapse,
  userRole = "support", // Default to support if no role provided
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const allMenuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "farmers", label: "Farmers Network", icon: Users },
    { id: "student-farmers", label: "Student Farmers", icon: GraduationCap },
    { id: "products", label: "Inventory", icon: Package },
    { id: "purchases", label: "Purchases", icon: ShoppingCart },
    { id: "loans", label: "Credit Control", icon: CreditCard },
    { id: "pickup-delivery", label: "Pickup & Delivery", icon: Truck },
    { id: "transactions", label: "Ledger", icon: Receipt },
    { id: "finance", label: "Finance Ops", icon: Briefcase },
    { id: "admins", label: "Admin Management", icon: Shield },
    { id: "staff-management", label: "Staff Hub", icon: UserCog },
    { id: "payroll", label: "Payroll", icon: DollarSign },
    { id: "bonus", label: "Staff Bonus", icon: Gift },
    { id: "pension", label: "Pension", icon: PiggyBank },
    { id: "ussd", label: "USSD Logs", icon: Smartphone },
    { id: "settings", label: "Config", icon: Settings },
  ];

  // Filter menu items based on user role
  const allowedPages = ROLE_PERMISSIONS[userRole.toLowerCase() as keyof typeof ROLE_PERMISSIONS] || ROLE_PERMISSIONS.support;
  const menuItems = allMenuItems.filter(item => allowedPages.includes(item.id));

  const handleItemClick = (id: string) => {
    navigate(`/${id}`);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden transition-all duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed lg:left-0 left-0 top-0 bottom-0 z-50 flex flex-col
        bg-white transition-all duration-300
        border-r border-gray-200
        shadow-sm
        lg:translate-x-0
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        ${isCollapsed ? "w-20" : "w-64"}
      `}
      >

        {/* Logo Section */}
        <div className="h-20 flex items-center justify-left px-4 border-b border-gray-100">
          <img 
            src="/logo.png" 
            alt="Promise Point Agritech Logo" 
            className={`transition-all duration-300 object-contain ${isCollapsed ? "h-9" : "h-16"}`}
          />
        </div>

        {/* Toggle Button */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex absolute -right-3 top-16 w-8 h-8 bg-white border border-gray-200 rounded-full items-center justify-center text-[#066f48] shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200 z-50"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 space-y-1.5 py-4 custom-scrollbar relative">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === `/${item.id}`;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`
                  w-full flex items-center rounded-lg py-2.5 transition-all duration-200
                  ${isCollapsed ? "justify-center px-2" : "px-3"}
                  ${isActive 
                    ? "bg-[#066f48] text-white" 
                    : "text-gray-600 hover:bg-gray-100"}
                `}
                title={isCollapsed ? item.label : ""}
              >
                <Icon
                  className={`
                    shrink-0 transition-all duration-200
                    ${isCollapsed ? "w-5 h-5" : "w-5 h-5 mr-3"}
                  `}
                />
                
                {!isCollapsed && (
                  <span className="text-sm font-medium">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={onLogout}
            className={`
              w-full flex items-center py-2.5 rounded-lg transition-all duration-200
              text-gray-600 hover:bg-red-50 hover:text-red-600
              ${isCollapsed ? "justify-center px-2" : "px-3"}
            `}
            title={isCollapsed ? "Sign Out" : ""}
          >
            <LogOut className={`w-5 h-5 ${isCollapsed ? "" : "mr-3"}`} />
            {!isCollapsed && <span className="text-sm font-medium">Sign Out</span>}
          </button>
        </div>
      </div>

      {/* Custom Scrollbar */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.5);
        }
      `}</style>
    </>
  );
};
