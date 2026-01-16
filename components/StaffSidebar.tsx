import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X, LayoutDashboard, User, FileText, LogOut, ChevronLeft, ChevronRight } from "lucide-react";

interface StaffSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  onLogout: () => void;
  currentPath: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const StaffSidebar: React.FC<StaffSidebarProps> = ({
  sidebarOpen,
  setSidebarOpen,
  onLogout,
  currentPath,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const navigate = useNavigate();

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/staff/dashboard",
    },
    {
      id: "profile",
      label: "My Profile",
      icon: User,
      path: "/staff/profile",
    },
    {
      id: "balances",
      label: "Balances",
      icon: FileText,
      path: "/staff/balances",
    },
    {
      id: "documents",
      label: "Documents",
      icon: FileText,
      path: "/staff/documents",
    },
  ];

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transform flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          <div className={`flex items-center ${isCollapsed ? "justify-center w-full" : ""}`}>
            <img 
              src="https://res.cloudinary.com/dt9unisic/image/upload/v1768578156/Screenshot_2026-01-16_at_4.41.39_pm_x5zzrb.png" 
              alt="Promise Point Agritech Logo" 
              className={`transition-all duration-300 ${isCollapsed ? "h-10 w-auto" : "h-14 w-auto"}`}
            />
          </div>
          {!isCollapsed && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Collapse button - desktop only */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex items-center justify-center h-10 mx-2 mt-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors focus:outline-none"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        )}

        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                navigate(item.path);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center ${isCollapsed ? "justify-center px-2" : "px-4"} py-3 text-sm font-medium rounded-lg transition-colors focus:outline-none ${
                currentPath === item.path
                  ? "bg-green-100 text-green-700 border-r-2 border-green-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
              title={isCollapsed ? item.label : ""}
            >
              <item.icon className={`${isCollapsed ? "" : "mr-3"} w-5 h-5`} />
              {!isCollapsed && item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t mt-auto">
          <button
            onClick={onLogout}
            className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
};
