import { useQuery, useMutation, gql } from '@apollo/client';
import { useState, useEffect } from 'react';
import './App.css'

const GET_LOANS_WITH_PAYMENTS = gql`
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

const CREATE_LOAN_PAYMENT = gql`
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

interface LoanPayment {
    id?: number | null;
    loanId?: number | null;
    paymentDate?: string | null;
}

interface Loan {
    id: number;
    name: string;
    principal: number;
    interestRate: number;
    dueDate: string;
    payments: LoanPayment[];
}

interface CategorizedLoan {
    id: number;
    name: string;
    interestRate: number;
    principal: number;
    dueDate: string;
    paymentDate: string | null;
    status: PaymentStatus;
}
  
type PaymentStatus = 'On Time' | 'Late' | 'Defaulted' | 'Unpaid';

/**
 * Calculates the difference in days between two dates (midnight-normalized).
 */
function getDaysDifference(date1: Date, date2: Date): number {
    const normalizedDate1 = new Date(date1);
    const normalizedDate2 = new Date(date2);
    
    normalizedDate1.setHours(0, 0, 0, 0);
    normalizedDate2.setHours(0, 0, 0, 0);
    
    const diffTime = normalizedDate1.getTime() - normalizedDate2.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}


/**
 * Determines payment status based on payment date and due date.
 */
function determinePaymentStatus(paymentDate: string | null, dueDate: string ): PaymentStatus {
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
function getLatestPayment(payments: Array<LoanPayment | null>): LoanPayment | null {
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
function categorizeLoans(loans: Array<Loan | null>): CategorizedLoan[] {
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
  

interface LoanCardProps {
    loan: CategorizedLoan;
}

interface AddPaymentFormProps {
    loanId: number;
}

const AddPaymentForm = ({ loanId }: AddPaymentFormProps) => {
    const [paymentDate, setPaymentDate] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const [createLoanPayment, { loading }] = useMutation(CREATE_LOAN_PAYMENT, {
        refetchQueries: [{ query: GET_LOANS_WITH_PAYMENTS }],
        onCompleted: () => {
            setSuccess(true);
            setError(null);
            setPaymentDate('');
            setTimeout(() => {
                setSuccess(false);
                setShowModal(false);
            }, 2000);
        },
        onError: (err) => {
            setError(err.message);
            setSuccess(false);
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        if (!paymentDate) {
            setError('Please enter a payment date');
            return;
        }

        createLoanPayment({
            variables: {
                input: {
                    loanId: loanId,
                    paymentDate: paymentDate
                }
            }
        });
    };

    const handleClose = () => {
        if (!loading) {
            setShowModal(false);
            setError(null);
            setPaymentDate('');
        }
    };

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && showModal && !loading) {
                handleClose();
            }
        };

        if (showModal) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [showModal, loading]);

    return (
        <>
            <button 
                type="button"
                className="add-payment-button"
                onClick={() => setShowModal(true)}
            >
                Add Payment
            </button>

            {showModal && (
                <div className="modal-overlay" onClick={handleBackdropClick}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add Payment for loan {loanId}</h2>
                            <button 
                                type="button"
                                className="modal-close-button"
                                onClick={handleClose}
                                disabled={loading}
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>
                        <form className="modal-form" onSubmit={handleSubmit}>
                            <div className="form-field">
                                <label htmlFor={`payment-date-${loanId}`}>Payment Date</label>
                                <input
                                    id={`payment-date-${loanId}`}
                                    name="payment-date"
                                    type="date"
                                    value={paymentDate}
                                    onChange={(e) => setPaymentDate(e.target.value)}
                                    disabled={loading}
                                />
                            </div>

                            {error && (
                                <div className="form-message form-error">
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div className="form-message form-success">
                                    Payment added successfully!
                                </div>
                            )}

                            <div className="modal-actions">
                                <button 
                                    type="button" 
                                    className="cancel-button"
                                    onClick={handleClose}
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="submit-button" disabled={loading}>
                                    {loading ? 'Adding...' : 'Add Payment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

const getStatusColor = (status: PaymentStatus): string => {
    switch (status) {
        case 'On Time':
            return '#4caf50'; // GREEN
        case 'Late':
            return '#ff9800'; // ORANGE
        case 'Defaulted':
            return '#f44336'; // RED
        case 'Unpaid':
            return '#9e9e9e'; // GREY
        default:
            return '#9e9e9e'; // GREY
    }
};

const LoanCard = ({ loan }: LoanCardProps) => {
  const statusColor = getStatusColor(loan.status);

  return (
    <li className="loan-item">
      <div className="loan-item-content">
        <div className="loan-item-header">
          <div className="loan-avatar">
            {loan.id}
          </div>
          <div className="loan-info">
            <h3 className="loan-name">{loan.name}</h3>
            <p className="loan-details">
              {loan.interestRate}% interest • Due {loan.dueDate}
              {loan.paymentDate && ` • Paid ${loan.paymentDate}`}
            </p>
          </div>
        </div>
        <div className="loan-item-right">
          <div className="loan-amount">
            ${loan.principal?.toLocaleString() || '0'}
          </div>
          <div 
            className="payment-status" 
            style={{ 
              color: statusColor,
              fontWeight: 600,
              fontSize: '0.9rem'
            }}
          >
            {loan.status}
          </div>
          {loan.status === 'Unpaid' && <AddPaymentForm loanId={loan.id} />}
        </div>
      </div>
    </li>
  );
};


function App() {
    const { loading, error, data } = useQuery<{ loans?: Array<Loan | null> | null }>(GET_LOANS_WITH_PAYMENTS);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error.message}</p>;

    const loans = data?.loans || [];
    const CategorizedLoans = categorizeLoans(loans);

    return (
        <>
            <div className="app-container">
                <h1>Existing Loans & Payments</h1>
                <ul className="loans-list">
                    {CategorizedLoans.map((loan) => {
                        return <LoanCard key={loan.id} loan={loan} />;
                    })}
                </ul>
            </div>
        </>
    )
}

export default App