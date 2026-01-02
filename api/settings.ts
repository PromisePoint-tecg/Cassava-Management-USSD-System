import { ApiClient } from "./client";
import { SystemSettings } from "../types";

export interface SettingsResponse {
  success: boolean;
  message: string;
  data?: SystemSettings & {
    lastUpdated: string;
    updatedBy: string;
    createdAt: string;
    updatedAt: string;
  };
}

export class SettingsApi {
  private client: ApiClient;

  constructor() {
    this.client = new ApiClient();
  }

  async getSettings(): Promise<SystemSettings> {
    const response = await this.client.get<{
      success: boolean;
      data: SystemSettings & {
        lastUpdated: string;
        updatedBy: string;
        createdAt: string;
        updatedAt: string;
      };
    }>("/settings");
    // Extract only the SystemSettings fields
    const { lastUpdated, updatedBy, createdAt, updatedAt, ...settings } =
      response.data;
    return settings;
  }

  async updateSettings(settings: SystemSettings): Promise<SettingsResponse> {
    const response = await this.client.patch<SettingsResponse>(
      "/settings",
      settings
    );
    return response;
  }

  async getCassavaPricing(): Promise<{
    pricePerKg: number;
    pricePerTon: number;
  }> {
    const response = await this.client.get<{
      success: boolean;
      data: { cassavaPricePerKg: number; cassavaPricePerTon: number };
    }>("/settings/cassava-pricing");
    return {
      pricePerKg: response.data.cassavaPricePerKg,
      pricePerTon: response.data.cassavaPricePerTon,
    };
  }
}

export const settingsApi = new SettingsApi();
