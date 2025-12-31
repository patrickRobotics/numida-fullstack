const API_BASE_URL = 'http://localhost:2024';

export interface CreateLoanPaymentRequest {
    loan_id: number;
    payment_date: string; // YYYY-MM-DD format
}

export interface CreateLoanPaymentResponse {
    id: number;
    loan_id: number;
    payment_date: string;
}

export interface ApiError {
    error: string;
}

/**
 * Creates a new loan payment via REST API
 * @param paymentData - The payment data containing loan_id and payment_date
 * @returns Promise resolving to the created payment
 * @throws Error if the API request fails
 */
export async function createLoanPayment(
    paymentData: CreateLoanPaymentRequest
): Promise<CreateLoanPaymentResponse> {
    const response = await fetch(`${API_BASE_URL}/loan-payments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
    });

    const data: CreateLoanPaymentResponse | ApiError = await response.json();

    if (!response.ok) {
        const errorMessage = 'error' in data ? data.error : 'Failed to create payment';
        throw new Error(errorMessage);
    }

    return data as CreateLoanPaymentResponse;
}

