import { gql } from '@apollo/client';

export const GET_LOANS_WITH_PAYMENTS = gql`
    query GetLoans {
        loans {
        id
        name
        interestRate
        principal
        dueDate
        payments {
            id
            loanId
            paymentDate
        }
        }
    }
`;

export const CREATE_LOAN = gql`
    mutation CreateLoan($input: CreateLoanInput!) {
        createLoan(input: $input) {
            loan {
                id
                name
                interestRate
                principal
                dueDate
            }
        }
    }
`;

export const CREATE_LOAN_PAYMENT = gql`
    mutation CreateLoanPayment($input: CreateLoanPaymentInput!) {
        createLoanPayment(input: $input) {
        payment {
            id
            loanId
            paymentDate
        }
        }
    }
`;