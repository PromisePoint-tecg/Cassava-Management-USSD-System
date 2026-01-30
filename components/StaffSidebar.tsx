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
      {/* Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden transition-all duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed left-0 top-0 bottom-0 z-50 flex flex-col
          bg-white transition-all duration-300
          border-r border-gray-200
          shadow-sm
          lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${isCollapsed ? "w-20" : "w-64"}
        `}
      >

        {/* Logo Section */}
        <div className="h-20 flex items-center justify-between px-4 border-b border-gray-100">
          <div className={`flex items-center ${isCollapsed ? "justify-center w-full" : ""}`}>
            <img 
              src="/logo.png" 
              alt="Promise Point Agritech Logo" 
              className={`transition-all duration-300 object-contain ${isCollapsed ? "h-9" : "h-16"}`}
            />
          </div>
          {!isCollapsed && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Toggle Button */}
        {onToggleCollapse && (
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
        )}

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 space-y-1.5 py-4 custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.id}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center rounded-lg py-2.5 transition-all duration-200
                  ${isCollapsed ? "justify-center px-2" : "px-3"}
                  ${isActive 
                    ? "bg-[#066f48] text-white" 
                    : "text-gray-600 hover:bg-gray-100"}
                `}
                title={isCollapsed ? item.label : ""}
              >
                <item.icon
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