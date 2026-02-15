import React from "react";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
  userRole?: string;
  requiredPermissions: string[];
}

// Role-based access control mapping
const ROLE_PERMISSIONS = {
  super_admin: [
    "dashboard",
    "farmers",
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
    "ussd",
    "purchases",
    "products",
    "pickup-delivery",
  ],
  verifier: [
    "dashboard",
    "farmers",
    "products",
    "purchases",
    "loans",
    "pickup-delivery",
  ],
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  userRole = "support",
  requiredPermissions,
}) => {
  const allowedPages = ROLE_PERMISSIONS[userRole.toLowerCase() as keyof typeof ROLE_PERMISSIONS] || ROLE_PERMISSIONS.support;
  
  // Check if user has permission to access any of the required pages
  const hasPermission = requiredPermissions.some(permission => 
    allowedPages.includes(permission)
  );

  if (!hasPermission) {
    // Redirect to dashboard if user doesn't have permission
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
