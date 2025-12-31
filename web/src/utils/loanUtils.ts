import { getDaysDifference } from './dateUtils';
import { PaymentStatus, LoanPayment, Loan, CategorizedLoan } from '../types/loan';

export type { PaymentStatus, CategorizedLoan };

/**
 * Determines payment status based on payment date and due date.
 */
export function determinePaymentStatus(paymentDate: string | null, dueDate: string): PaymentStatus {
    // No payment made
    if (!paymentDate) {
        return 'Unpaid';
    }
  
    // No due date - cannot determine proper status
    if (!dueDate) {
        return 'On Time';
    }
  
    const daysOverdue = getDaysDifference(new Date(paymentDate), new Date(dueDate));
  
    // Payment before due date
    if (daysOverdue <= 5) {
        return 'On Time';
    }

    if (daysOverdue <= 30) {
        return 'Late';
    }
  
    return 'Defaulted';
}

/**
 * Finds the most recent payment for a loan.
 */
export function getLatestPayment(payments: Array<LoanPayment | null>): LoanPayment | null {
    const validPayments = payments.filter(
        (p): p is LoanPayment => p !== null && p.paymentDate !== null
    );
    
    if (validPayments.length === 0) return null;
    
    return validPayments.reduce((latest, current) => {
        return new Date(current.paymentDate!) > new Date(latest.paymentDate!) 
            ? current 
            : latest;
    });
}

/**
 * Categorizes loans based on the due date and payment date.
 * Returns an array where each loan is combined with its payment information and status.
 * 
 * @param loans - Array of loans to categorize
 * @returns Array of categorized loans with status information
 */
export function categorizeLoans(loans: Array<Loan | null>): CategorizedLoan[] {
    return loans
        .filter((loan): loan is Loan => {
            return loan !== null && 
                typeof loan.id === 'number' &&
                typeof loan.name === 'string' &&
                loan.dueDate !== null &&
                loan.dueDate !== undefined;
        })
        .map((loan): CategorizedLoan => {
            const latestPayment = getLatestPayment(loan.payments || []);
            const paymentDate = latestPayment?.paymentDate ?? null;
            
            const status = determinePaymentStatus(paymentDate, loan.dueDate);
    
            return {
                id: loan.id!,
                name: loan.name!,
                interestRate: loan.interestRate ?? 0,
                principal: loan.principal ?? 0,
                dueDate: loan.dueDate!,
                paymentDate,
                status,
            };
        });
}