
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  FINANCE_OFFICER = 'FINANCE_OFFICER',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export enum LoanStatus {
  ACTIVE = 'ACTIVE',
  PAID = 'PAID',
  DEFAULTED = 'DEFAULTED',
}

export enum NetworkOperator {
  MTN = 'MTN',
  AIRTEL = 'AIRTEL',
  GLO = 'GLO',
  NMOBILE = '9MOBILE',
}

export interface SystemSettings {
  pricePerKg: number;
  transactionFeePercent: number;
  smsNotifications: boolean;
  emailAlerts: boolean;
  autoApproveLoansUnder: number;
  maintenanceMode: boolean;
}

export interface Farmer {
  id: string;
  name: string;
  phone: string;
  branch: string;
  nationalId: string;
  walletNumber: string;
  walletBalance: number;
  status: 'Active' | 'Inactive';
  registrationDate: string;
}

export interface Purchase {
  id: string;
  farmerId: string;
  farmerName: string;
  weightKg: number;
  pricePerKg: number;
  totalAmount: number;
  status: TransactionStatus;
  timestamp: string;
  recordedBy: string;
}

export interface Loan {
  id: string;
  farmerId: string;
  farmerName: string;
  principal: number;
  outstandingBalance: number;
  type: 'Input Credit' | 'Cash Loan';
  status: LoanStatus;
  dueDate: string;
}

export interface USSDSession {
  id: string;
  msisdn: string;
  network: NetworkOperator;
  status: 'Success' | 'Failed' | 'Timeout';
  duration: number; // seconds
  timestamp: string;
  action: 'Check Balance' | 'Loan Request' | 'Mini Statement';
}

export interface KPIData {
  totalWeight: number;
  totalPaid: number;
  activeFarmers: number;
  outstandingLoans: number;
}
