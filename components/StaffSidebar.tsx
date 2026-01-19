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
      {/* Glossy Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-white/30 backdrop-blur-md z-40 lg:hidden transition-all duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Glassmorphic Sidebar */}
      <div
        className={`
          fixed left-4 top-4 bottom-4 z-50 flex flex-col
          bg-white/10 backdrop-blur-xl transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)]
          rounded-[2rem] border border-white/40 
          shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset]
          lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-[120%] lg:translate-x-0"}
          ${isCollapsed ? "w-20" : "w-64"}
        `}
      >
        {/* Glossy Reflection Highlight */}
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
        
        {/* Bottom Shadow */}
        <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/5 to-transparent rounded-b-[2rem] pointer-events-none" />
        
        {/* Subtle Inner Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#066f48]/5 via-transparent to-cyan-400/5 rounded-[2rem] pointer-events-none" />
        
        {/* Blur Orb Top Left */}
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-white/30 to-transparent blur-3xl rounded-full pointer-events-none" />
        
        {/* Blur Orb Bottom Right */}
        <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-gradient-to-tl from-[#066f48]/10 to-transparent blur-2xl rounded-full pointer-events-none" />

        {/* Logo Section */}
        <div className="h-16 flex items-center justify-between px-4 relative">
          <div className={`flex items-center ${isCollapsed ? "justify-center w-full" : ""}`}>
            <div className="relative group">
              {/* Animated glow on hover */}
              <div className="absolute -inset-3 bg-gradient-to-r from-emerald-400/30 via-emerald-300/20 to-cyan-400/30 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700" />
              <img 
                src="/logo.png" 
                alt="Promise Point Agritech Logo" 
                className={`relative transition-all duration-300 ${isCollapsed ? "h-10 w-auto" : "h-[80px] w-auto mt-5"}`}
              />
            </div>
          </div>
          {!isCollapsed && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-white/20 transition-all duration-300"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Floating Toggle Button */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex absolute -right-3 top-16 w-8 h-8 bg-white/80 backdrop-blur-xl border border-white/60 rounded-full items-center justify-center text-emerald-600 shadow-lg hover:shadow-emerald-200/50 hover:scale-110 hover:bg-emerald-50/80 transition-all duration-300 z-50 group"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700 rounded-full" />
            
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 relative z-10 group-hover:translate-x-0.5 transition-transform" />
            ) : (
              <ChevronLeft className="w-4 h-4 relative z-10 group-hover:-translate-x-0.5 transition-transform" />
            )}
          </button>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar relative">
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
                  w-full group relative flex items-center rounded-xl py-3 transition-all duration-500 overflow-hidden
                  ${isCollapsed ? "justify-center px-2" : "px-4"}
                  ${isActive 
                    ? "bg-white/25 shadow-[0_4px_16px_rgba(6,111,72,0.2),0_1px_2px_rgba(255,255,255,0.4)_inset] backdrop-blur-xl scale-[1.02]" 
                    : "text-slate-500 hover:text-slate-700 hover:bg-white/15 border border-transparent"}
                `}
                title={isCollapsed ? item.label : ""}
              >
                {/* Glossy Active Glow */}
                {isActive && (
                  <>
                    {/* Animated gradient border */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#066f48]/20 via-[#09a066]/15 to-[#066f48]/20 animate-border-flow" />
                    
                    {/* Inner glow gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#066f48]/10 via-white/10 to-[#09a066]/10 rounded-xl pointer-events-none" />
                    
                    {/* Top glass shine */}
                    <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent rounded-t-xl pointer-events-none" />
                  </>
                )}
                
                {/* Minimal hover - just slight background */}
                {!isActive && (
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/15 rounded-xl transition-all duration-300" />
                )}
                
                <item.icon
                  className={`
                    shrink-0 transition-all duration-300 relative z-10
                    ${isCollapsed ? "w-5 h-5" : "w-5 h-5 mr-3"}
                    ${isActive 
                      ? "text-[#066f48]" 
                      : "text-slate-400 group-hover:text-slate-600"}
                  `}
                />
                
                {!isCollapsed && (
                  <span className={`text-sm font-medium tracking-tight relative z-10 transition-all duration-300 ${isActive ? "text-[#066f48]" : "text-slate-500 group-hover:text-slate-700"}`}>
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Premium Footer */}
        <div className="p-4 relative">
          {/* Glass container */}
          <div className="bg-white/20 border border-white/50 rounded-[1.5rem] p-2 backdrop-blur-lg shadow-[inset_0_2px_4px_rgba(255,255,255,0.5)] relative overflow-hidden">
            {/* Gradient overlay */}
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-[1.5rem] pointer-events-none" />
            
            {/* Blur orb */}
            <div className="absolute top-0 left-0 w-1/2 h-full bg-white/20 blur-xl rounded-full pointer-events-none" />
            
            <button
              onClick={onLogout}
              className={`
                w-full flex items-center py-3 rounded-[1rem] transition-all duration-300 group relative overflow-hidden
                text-slate-600 hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 hover:text-white hover:shadow-lg hover:shadow-red-300/40
                ${isCollapsed ? "justify-center px-2" : "px-4"}
              `}
              title={isCollapsed ? "Sign Out" : ""}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
              
              <LogOut className={`w-5 h-5 ${isCollapsed ? "" : "mr-3"} relative z-10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`} />
              {!isCollapsed && <span className="text-sm font-bold relative z-10">Sign Out</span>}
            </button>
          </div>
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
        
        @keyframes border-flow {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        .animate-border-flow {
          background-size: 200% 200%;
          animation: border-flow 3s ease infinite;
        }
      `}</style>
    </>
  );
};