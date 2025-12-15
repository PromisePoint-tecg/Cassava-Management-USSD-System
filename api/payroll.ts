/**
 * Payroll Management API functions
 */

import { apiClient } from './client';

export interface Payroll {
    id: string;
    periodStart: string;
    periodEnd: string;
    periodLabel: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    totalStaffCount: number;
    processedCount: number;
    failedCount: number;
    // Alias fields for frontend compatibility
    processedStaffCount?: number;
    failedStaffCount?: number;
    totalGrossAmount: number;
    totalNetAmount: number;
    totalPensionEmployee: number;
    totalPensionEmployer: number;
    // Alias fields for frontend compatibility
    totalPensionAmount?: number;
    totalTaxDeducted: number;
    // Alias field for frontend compatibility
    totalTaxAmount?: number;
    isAutomated: boolean;
    initiatedBy?: string;
    processedAt?: string;
    completedAt?: string;
    failedReason?: string;
    errorLogs: string[];
    notes?: string;
    createdAt: string;
}


export interface PayrollTransaction {
    id: string;
    payrollId: string;
    staffId: string;
    userId: string;
    employeeId: string;
    staffName: string;
    // Alias fields for frontend compatibility
    staffFullName?: string;
    staffEmployeeId?: string;
    department: string;
    role: string;
    grossSalary: number;
    pensionEmployeeContribution: number;
    pensionEmployerContribution: number;
    // Alias fields for frontend compatibility
    employeePensionContribution?: number;
    employerPensionContribution?: number;
    totalPensionContribution: number;
    taxDeduction: number;
    otherDeductions: number;
    totalDeductions: number;
    netSalary: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    // Alias field for frontend compatibility
    paymentStatus?: 'pending' | 'processing' | 'completed' | 'failed';
    paymentReference?: string;
    paidAt?: string;
    // Alias fields for frontend compatibility
    paymentDate?: string;
    payrollPeriodLabel?: string;
    failedReason?: string;
    retryCount: number;
}

export interface CreatePayrollDto {
    period_start: string;
    period_end: string;
    notes?: string;
}

export interface PaginatedPayrollResponse {
    payrolls: Payroll[];
    total: number;
    page: number;
    pages: number;
}

export interface PaginatedTransactionResponse {
    transactions: PayrollTransaction[];
    total: number;
    page: number;
    pages: number;
    totalPages?: number;
}

export interface ProcessPayrollResponse {
    success: boolean;
    processed: number;
    failed: number;
    message: string;
}

export interface PayrollStatistics {
    total: number;
    completed: number;
    failed: number;
    pending: number;
}

/**
 * Get all payrolls
 */
export const getAllPayrolls = async (params?: {
    page?: number;
    limit?: number;
    status?: string;
}): Promise<PaginatedPayrollResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);

    const response: any = await apiClient.get<PaginatedPayrollResponse>(`/payroll?${queryParams.toString()}`);

    // Helper to normalize payroll object - converts snake_case to camelCase and handles MongoDB _id
    const normalizePayroll = (p: any): Payroll => ({
        // Map _id to id (MongoDB uses _id)
        id: p.id || p._id?.toString() || p._id,
        // Date fields
        periodStart: p.periodStart || p.period_start,
        periodEnd: p.periodEnd || p.period_end,
        periodLabel: p.periodLabel || p.period_label,
        // Status
        status: p.status,
        // Staff counts
        totalStaffCount: p.totalStaffCount || p.total_staff_count || 0,
        processedCount: p.processedCount || p.processed_count || 0,
        failedCount: p.failedCount || p.failed_count || 0,
        processedStaffCount: p.processedStaffCount || p.processed_count || p.processedCount || 0,
        failedStaffCount: p.failedStaffCount || p.failed_count || p.failedCount || 0,
        // Financial amounts
        totalGrossAmount: p.totalGrossAmount || p.total_gross_amount || 0,
        totalNetAmount: p.totalNetAmount || p.total_net_amount || 0,
        totalPensionEmployee: p.totalPensionEmployee || p.total_pension_employee || 0,
        totalPensionEmployer: p.totalPensionEmployer || p.total_pension_employer || 0,
        totalPensionAmount: p.totalPensionAmount || (p.total_pension_employee || 0) + (p.total_pension_employer || 0) || (p.totalPensionEmployee || 0) + (p.totalPensionEmployer || 0),
        totalTaxDeducted: p.totalTaxDeducted || p.total_tax_deducted || 0,
        totalTaxAmount: p.totalTaxAmount || p.total_tax_deducted || p.totalTaxDeducted || 0,
        // Metadata
        isAutomated: p.isAutomated !== undefined ? p.isAutomated : p.is_automated,
        initiatedBy: p.initiatedBy || p.initiated_by,
        processedAt: p.processedAt || p.processed_at,
        completedAt: p.completedAt || p.completed_at,
        failedReason: p.failedReason || p.failed_reason,
        errorLogs: p.errorLogs || p.error_logs || [],
        notes: p.notes,
        createdAt: p.createdAt,
    });

    // Handle nested response structure - backend returns { success, data: { payrolls, ... } }
    const responseData = response.data?.data || response.data || response;

    console.log('Payroll API raw response:', responseData);

    if (responseData && responseData.payrolls) {
        const normalizedPayrolls = responseData.payrolls.map(normalizePayroll);
        console.log('Normalized payrolls:', normalizedPayrolls);
        return {
            payrolls: normalizedPayrolls,
            total: responseData.total,
            page: responseData.page,
            pages: responseData.totalPages || responseData.pages || 1,
        };
    }

    return {
        payrolls: [],
        total: 0,
        page: 1,
        pages: 1,
    };
};

/**
 * Get payroll by ID
 */
export const getPayrollById = async (payrollId: string): Promise<Payroll> => {
    const response: any = await apiClient.get<Payroll>(`/payroll/${payrollId}`);
    return response.data || response;
};

/**
 * Create new payroll period
 */
export const createPayroll = async (data: CreatePayrollDto): Promise<Payroll> => {
    const response: any = await apiClient.post<Payroll>('/payroll', data);
    return response.data || response;
};

/**
 * Process payroll (disburse salaries)
 */
export const processPayroll = async (payrollId: string): Promise<ProcessPayrollResponse> => {
    const response: any = await apiClient.post<ProcessPayrollResponse>(`/payroll/${payrollId}/process`);
    return response.data || response;
};

/**
 * Get payroll transactions
 */
export const getPayrollTransactions = async (
    payrollId: string,
    params?: {
        page?: number;
        limit?: number;
        status?: string;
    }
): Promise<PaginatedTransactionResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);

    const response: any = await apiClient.get<PaginatedTransactionResponse>(
        `/payroll/${payrollId}/transactions?${queryParams.toString()}`
    );
    const rawData = response.data?.data || response.data || response;

    // Helper to normalize transaction - converts snake_case to camelCase
    const normalizeTransaction = (t: any): PayrollTransaction => ({
        id: t.id || t._id?.toString() || t._id,
        payrollId: t.payrollId || t.payroll_id?._id || t.payroll_id,
        staffId: t.staffId || t.staff_id?._id || t.staff_id,
        userId: t.userId || t.user_id,
        employeeId: t.employeeId || t.employee_id || t.staff_id?.employee_id || '',
        staffName: t.staffName || t.staff_name || `${t.staff_id?.first_name || ''} ${t.staff_id?.last_name || ''}`.trim(),
        staffFullName: t.staffFullName || t.staff_name || `${t.staff_id?.first_name || ''} ${t.staff_id?.last_name || ''}`.trim() || 'Unknown',
        staffEmployeeId: t.staffEmployeeId || t.employee_id || t.staff_id?.employee_id || 'N/A',
        department: t.department || t.staff_id?.department || 'N/A',
        role: t.role || t.staff_id?.role || 'N/A',
        grossSalary: t.grossSalary || t.gross_salary || 0,
        pensionEmployeeContribution: t.pensionEmployeeContribution || t.pension_employee_contribution || 0,
        pensionEmployerContribution: t.pensionEmployerContribution || t.pension_employer_contribution || 0,
        employeePensionContribution: t.employeePensionContribution || t.pension_employee_contribution || t.pensionEmployeeContribution || 0,
        employerPensionContribution: t.employerPensionContribution || t.pension_employer_contribution || t.pensionEmployerContribution || 0,
        totalPensionContribution: t.totalPensionContribution || t.total_pension_contribution || 0,
        taxDeduction: t.taxDeduction || t.tax_deduction || 0,
        otherDeductions: t.otherDeductions || t.other_deductions || 0,
        totalDeductions: t.totalDeductions || t.total_deductions || 0,
        netSalary: t.netSalary || t.net_salary || 0,
        status: t.status || 'pending',
        paymentStatus: t.paymentStatus || t.status || 'pending',
        paymentReference: t.paymentReference || t.payment_reference,
        paidAt: t.paidAt || t.paid_at,
        paymentDate: t.paymentDate || t.paid_at || t.paidAt,
        payrollPeriodLabel: t.payrollPeriodLabel || t.payroll_id?.period_label || 'N/A',
        failedReason: t.failedReason || t.failed_reason,
        retryCount: t.retryCount || t.retry_count || 0,
    });

    // Normalize response to include totalPages and transform transactions
    const transactions = (rawData.transactions || []).map(normalizeTransaction);

    console.log('Normalized transactions:', transactions);

    return {
        transactions,
        total: rawData.total || transactions.length,
        page: rawData.page || 1,
        pages: rawData.pages || 1,
        totalPages: rawData.totalPages || rawData.pages || 1,
    };
};

/**
 * Get staff payroll history
 */
export const getStaffPayrollHistory = async (
    staffId: string,
    params?: {
        page?: number;
        limit?: number;
    }
): Promise<PaginatedTransactionResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response: any = await apiClient.get<PaginatedTransactionResponse>(
        `/payroll/staff/${staffId}/history?${queryParams.toString()}`
    );
    const rawData = response.data?.data || response.data || response;

    // Helper to normalize transaction - converts snake_case to camelCase
    const normalizeTransaction = (t: any): PayrollTransaction => {
        // Try to get period label from populated payroll_id
        const payrollData = t.payroll_id;
        const periodLabel = typeof payrollData === 'object'
            ? (payrollData?.period_label || payrollData?.periodLabel)
            : undefined;

        return {
            id: t.id || t._id?.toString() || t._id,
            payrollId: t.payrollId || (typeof t.payroll_id === 'object' ? t.payroll_id?._id : t.payroll_id),
            staffId: t.staffId || t.staff_id,
            userId: t.userId || t.user_id,
            employeeId: t.employeeId || t.employee_id,
            staffName: t.staffName || t.staff_name,
            staffFullName: t.staffFullName || t.staff_name,
            staffEmployeeId: t.staffEmployeeId || t.employee_id,
            department: t.department,
            role: t.role,
            grossSalary: t.grossSalary || t.gross_salary || 0,
            pensionEmployeeContribution: t.pensionEmployeeContribution || t.pension_employee_contribution || 0,
            pensionEmployerContribution: t.pensionEmployerContribution || t.pension_employer_contribution || 0,
            employeePensionContribution: t.employeePensionContribution || t.pension_employee_contribution || t.pensionEmployeeContribution || 0,
            employerPensionContribution: t.employerPensionContribution || t.pension_employer_contribution || t.pensionEmployerContribution || 0,
            totalPensionContribution: t.totalPensionContribution || t.total_pension_contribution || 0,
            taxDeduction: t.taxDeduction || t.tax_deduction || 0,
            otherDeductions: t.otherDeductions || t.other_deductions || 0,
            totalDeductions: t.totalDeductions || t.total_deductions || 0,
            netSalary: t.netSalary || t.net_salary || 0,
            status: t.status,
            paymentStatus: t.paymentStatus || t.status,
            paymentReference: t.paymentReference || t.payment_reference,
            paidAt: t.paidAt || t.paid_at,
            paymentDate: t.paymentDate || t.paid_at || t.paidAt,
            payrollPeriodLabel: t.payrollPeriodLabel || periodLabel || 'N/A',
            failedReason: t.failedReason || t.failed_reason,
            retryCount: t.retryCount || t.retry_count || 0,
        };
    };

    // Normalize response to include totalPages and transform transactions
    const transactions = (rawData.transactions || []).map(normalizeTransaction);

    return {
        transactions,
        total: rawData.total || transactions.length,
        page: rawData.page || 1,
        pages: rawData.pages || 1,
        totalPages: rawData.totalPages || rawData.pages || 1,
    };
};

/**
 * Retry failed transaction
 */
export const retryFailedTransaction = async (transactionId: string): Promise<{
    success: boolean;
    message: string;
}> => {
    const response: any = await apiClient.post(`/payroll/transaction/${transactionId}/retry`);
    return response.data || response;
};

/**
 * Get payroll statistics
 */
export const getPayrollStatistics = async (payrollId: string): Promise<PayrollStatistics> => {
    const response: any = await apiClient.get<PayrollStatistics>(`/payroll/${payrollId}/statistics`);
    return response.data || response;
};

/**
 * Get organization wallet
 */
export const getOrganizationWallet = async (): Promise<{
    balance: number;
    organizationName: string;
}> => {
    const response: any = await apiClient.get('/admin/wallet/organization');
    return response.data || response;
};

/**
 * Create organization wallet
 */
export const createOrganizationWallet = async (organizationName: string): Promise<any> => {
    const response: any = await apiClient.post('/admin/wallet/organization/create', { organization_name: organizationName });
    return response.data || response;
};
