export type PaymentStatus = 'On Time' | 'Late' | 'Defaulted' | 'Unpaid';

export interface LoanPayment {
    id: number;
    loanId: number;
    paymentDate: string;
}

export interface Loan {
    id: number;
    name: string;
    principal: number;
    interestRate: number;
    dueDate: string;
    payments: LoanPayment[];
}

export interface CategorizedLoan {
    id: number;
    name: string;
    interestRate: number;
    principal: number;
    dueDate: string;
    paymentDate: string | null;
    status: PaymentStatus;
}