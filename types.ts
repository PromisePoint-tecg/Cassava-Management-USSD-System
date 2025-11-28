
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
  REQUESTED = 'requested',
  APPROVED = 'approved', 
  ACTIVE = 'active',
  COMPLETED = 'completed',
  DEFAULTED = 'defaulted',
}

export enum NetworkOperator {
  MTN = 'MTN',
  AIRTEL = 'AIRTEL',
  GLO = 'GLO',
  NMOBILE = '9MOBILE',
}

export interface SystemSettings {
  cassavaPricePerKg: number;
  cassavaPricePerTon: number;
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
  farmer_id: string;
  farmer_name: string;
  farmer_phone: string;
  loan_type_name: string;
  principal_amount: number; // in naira
  interest_rate: number;
  interest_amount: number; // in naira
  total_repayment: number; // in naira
  purpose: string;
  duration_months: number;
  monthly_payment: number; // in naira
  amount_paid: number; // in naira
  amount_outstanding: number; // in naira
  status: LoanStatus;
  reference: string;
  pickup_date?: Date;
  pickup_location?: string;
  approved_at?: Date;
  disbursed_at?: Date;
  due_date: Date;
  completed_at?: Date;
  defaulted_at?: Date;
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    description?: string;
  }>;
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
