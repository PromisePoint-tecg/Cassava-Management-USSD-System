/**
 * Cookie utility functions for managing authentication tokens
 */

export const setCookie = (name: string, value: string, days: number = 1) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
};

export const getCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

export const deleteCookie = (name: string) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

export const getAuthToken = (): string | null => {
  return getCookie("admin_token");
};

export const setAuthToken = (token: string, days: number = 1) => {
  setCookie("admin_token", token, days);
};

export const clearAuthToken = () => {
  deleteCookie("admin_token");
};

// Staff token functions
export const getStaffAuthToken = (): string | null => {
  return getCookie("authToken");
};

export const setStaffAuthToken = (token: string, days: number = 1) => {
  setCookie("authToken", token, days);
};

export const clearStaffAuthToken = () => {
  deleteCookie("authToken");
};
