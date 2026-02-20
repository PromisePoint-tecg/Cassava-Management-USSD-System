import { apiClient } from "./client";

export interface USSDSession {
  id: string;
  msisdn: string;
  phoneNumber?: string;
  network?: string;
  networkOperator?: "MTN" | "AIRTEL" | "GLO" | "9MOBILE" | "NMOBILE";
  status:
    | "Success"
    | "Failed"
    | "Timeout"
    | "success"
    | "failed"
    | "timeout"
    | "pending"
    | "completed";
  duration?: number; // seconds
  timestamp: string;
  createdAt?: string;
  action?: string;
  menuOption?: string;
  responseCode?: string;
  errorMessage?: string;
}

export interface USSDStats {
  totalSessions: number;
  successfulSessions: number;
  failedSessions: number;
  timeoutSessions: number;
  averageDuration: number;
  byNetwork: {
    MTN: number;
    AIRTEL: number;
    GLO: number;
    "9MOBILE": number;
  };
  byAction: {
    [key: string]: number;
  };
}

export interface GetUSSDAnalyticsParams {
  startDate?: string;
  endDate?: string;
  timeRange?: "realtime" | "today" | "week" | "month";
}

export interface USSDAnalytics {
  totalSessions: number;
  successRate: number;
  avgDuration: number;
  failedSessions: number;
  activeSessions: number;
  networkTraffic: {
    network: string;
    sessions: number;
    percentage: number;
  }[];
  sessionStatus: {
    status: string;
    count: number;
    percentage: number;
  }[];
  topActions: {
    action: string;
    count: number;
    percentage: number;
  }[];
  recentSessions: {
    sessionId: string;
    phoneNumber: string;
    network: string;
    status: string;
    action: string;
    startTime: string;
    duration: number;
  }[];
  refreshedAt: string;
}

export interface USSDSessionsResponse {
  sessions: USSDSession[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetUSSDSessionsParams {
  page?: number;
  limit?: number;
  network?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const ussdApi = {
  /**
   * Get all USSD sessions with pagination and filters
   */
  async getAllSessions(
    params: GetUSSDSessionsParams = {}
  ): Promise<USSDSessionsResponse> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    });

    try {
      // Try different possible endpoints
      const endpoints = [
        "/admins/ussd/sessions",
        "/ussd/sessions",
        "/admin/ussd/sessions",
        "/ussd",
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await apiClient.get<any>(
            `${endpoint}${
              searchParams.toString() ? `?${searchParams.toString()}` : ""
            }`
          );
          // Check if response has sessions or data.sessions
          if (response.sessions || response.data?.sessions) {
            return {
              sessions: response.sessions || response.data.sessions || [],
              total: response.total || response.data?.total || 0,
              page: response.page || response.data?.page || 1,
              limit: response.limit || response.data?.limit || 10,
              totalPages: response.totalPages || response.data?.totalPages || 1,
            };
          }
        } catch (e) {
          // Try next endpoint
          continue;
        }
      }
      throw new Error("USSD sessions endpoint not found");
    } catch (error) {
      console.error("API Error in getAllSessions:", error);
      // Return empty response instead of throwing
      return {
        sessions: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };
    }
  },

  /**
   * Get USSD analytics data
   */
  async getUSSDAnalytics(
    params: GetUSSDAnalyticsParams = {}
  ): Promise<USSDAnalytics | null> {
    try {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          searchParams.append(key, String(value));
        }
      });

      const endpoint = `/ussd/analytics${
        searchParams.toString() ? `?${searchParams.toString()}` : ""
      }`;
      const response = await apiClient.get<USSDAnalytics>(endpoint);
      return response;
    } catch (error) {
      console.error("API Error in getUSSDAnalytics:", error);
      return null;
    }
  },
};
