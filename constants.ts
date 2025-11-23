import { Farmer, Purchase, Loan, USSDSession, TransactionStatus, LoanStatus, NetworkOperator } from './types';

export const PRICE_PER_KG = 120; // Nigerian Naira or local currency unit

export const MOCK_FARMERS: Farmer[] = [
  { id: 'F001', name: 'Amara Nnadi', phone: '+2348012345678', branch: 'Lagos North', nationalId: 'NIN1029384756', walletNumber: '2039485761', walletBalance: 45000, status: 'Active', registrationDate: '2023-11-12' },
  { id: 'F002', name: 'Babatunde Okafor', phone: '+2348023456789', branch: 'Ogun East', nationalId: 'NIN5647382910', walletNumber: '1029384756', walletBalance: 12500, status: 'Active', registrationDate: '2023-12-05' },
  { id: 'F003', name: 'Chioma Adebayo', phone: '+2348034567890', branch: 'Lagos North', nationalId: 'NIN9182736450', walletNumber: '3049586712', walletBalance: 89000, status: 'Active', registrationDate: '2024-01-15' },
  { id: 'F004', name: 'David Ibrahim', phone: '+2348045678901', branch: 'Ogun East', nationalId: 'NIN0192837465', walletNumber: '4059687123', walletBalance: 0, status: 'Inactive', registrationDate: '2024-02-20' },
  { id: 'F005', name: 'Efe Omoregie', phone: '+2348056789012', branch: 'Benin Central', nationalId: 'NIN1928374650', walletNumber: '5069788234', walletBalance: 32000, status: 'Active', registrationDate: '2024-03-10' },
];

export const MOCK_PURCHASES: Purchase[] = [
  { id: 'P1001', farmerId: 'F001', farmerName: 'Amara Nnadi', weightKg: 500, pricePerKg: 120, totalAmount: 60000, status: TransactionStatus.SUCCESS, timestamp: '2024-05-18T09:30:00', recordedBy: 'Admin A' },
  { id: 'P1002', farmerId: 'F003', farmerName: 'Chioma Adebayo', weightKg: 1200, pricePerKg: 120, totalAmount: 144000, status: TransactionStatus.SUCCESS, timestamp: '2024-05-18T10:15:00', recordedBy: 'Admin A' },
  { id: 'P1003', farmerId: 'F002', farmerName: 'Babatunde Okafor', weightKg: 350, pricePerKg: 120, totalAmount: 42000, status: TransactionStatus.PENDING, timestamp: '2024-05-18T11:00:00', recordedBy: 'Admin B' },
  { id: 'P1004', farmerId: 'F005', farmerName: 'Efe Omoregie', weightKg: 2000, pricePerKg: 120, totalAmount: 240000, status: TransactionStatus.SUCCESS, timestamp: '2024-05-17T14:45:00', recordedBy: 'Admin A' },
  { id: 'P1005', farmerId: 'F001', farmerName: 'Amara Nnadi', weightKg: 450, pricePerKg: 115, totalAmount: 51750, status: TransactionStatus.SUCCESS, timestamp: '2024-05-17T16:20:00', recordedBy: 'Admin B' },
];

export const MOCK_LOANS: Loan[] = [
  { id: 'L5001', farmerId: 'F002', farmerName: 'Babatunde Okafor', principal: 50000, outstandingBalance: 25000, type: 'Input Credit', status: LoanStatus.ACTIVE, dueDate: '2024-08-01' },
  { id: 'L5002', farmerId: 'F004', farmerName: 'David Ibrahim', principal: 100000, outstandingBalance: 100000, type: 'Cash Loan', status: LoanStatus.DEFAULTED, dueDate: '2024-04-01' },
  { id: 'L5003', farmerId: 'F005', farmerName: 'Efe Omoregie', principal: 150000, outstandingBalance: 0, type: 'Input Credit', status: LoanStatus.PAID, dueDate: '2024-06-15' },
];

export const MOCK_USSD_SESSIONS: USSDSession[] = [
  { id: 'S9001', msisdn: '***5678', network: NetworkOperator.MTN, status: 'Success', duration: 45, timestamp: '2024-05-18T09:00:00', action: 'Check Balance' },
  { id: 'S9002', msisdn: '***8901', network: NetworkOperator.AIRTEL, status: 'Failed', duration: 10, timestamp: '2024-05-18T09:05:00', action: 'Loan Request' },
  { id: 'S9003', msisdn: '***2345', network: NetworkOperator.GLO, status: 'Success', duration: 30, timestamp: '2024-05-18T09:12:00', action: 'Mini Statement' },
  { id: 'S9004', msisdn: '***6789', network: NetworkOperator.MTN, status: 'Success', duration: 25, timestamp: '2024-05-18T09:20:00', action: 'Check Balance' },
  { id: 'S9005', msisdn: '***1234', network: NetworkOperator.NMOBILE, status: 'Timeout', duration: 60, timestamp: '2024-05-18T09:30:00', action: 'Loan Request' },
];