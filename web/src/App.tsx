import { useQuery, useMutation, gql } from '@apollo/client';
import { useState } from 'react';
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
  id?: number | null;
  name?: string | null;
  interestRate?: number | null;
  principal?: number | null;
  dueDate?: string | null;
  payments?: Array<LoanPayment | null> | null;
}

interface CategorizedPayment {
  id?: number | null;
  name?: string | null;
  interestRate?: number | null;
  principal?: number | null;
  dueDate?: string | null;
  paymentDate?: string | null;
  status: 'On Time' | 'Late' | 'Defaulted' | 'Unpaid';
}

type PaymentStatus = 'On Time' | 'Late' | 'Defaulted' | 'Unpaid';

/**
 * Categorizes loan payments based on the due date and payment date.
 * Returns an array where each loan is combined with its payment information and status.
 */
function categorizeLoanPayments(loans: Array<Loan | null>): CategorizedPayment[] {
  return loans
    .filter((loan): loan is Loan => loan !== null)
    .map((loan) => {
      // Find the most recent payment for this loan
      const payments = loan.payments?.filter((p): p is LoanPayment => p !== null) || [];
      const latestPayment = payments.length > 0 
        ? payments.reduce((latest, current) => {
            if (!current.paymentDate) return latest;
            if (!latest?.paymentDate) return current;
            return new Date(current.paymentDate) > new Date(latest.paymentDate) ? current : latest;
          })
        : null;

      const paymentDate = latestPayment?.paymentDate || null;
      const dueDate = loan.dueDate;

      let status: PaymentStatus;

      if (!paymentDate) {
        status = 'Unpaid';
      } else if (!dueDate) {
        // If no due date, can't determine status, default to Unpaid
        status = 'Unpaid';
      } else {
        // Calculate the difference in days between payment date and due date
        const dueDateObj = new Date(dueDate);
        const paymentDateObj = new Date(paymentDate);
        
        // Set time to midnight to compare dates only
        dueDateObj.setHours(0, 0, 0, 0);
        paymentDateObj.setHours(0, 0, 0, 0);
        
        const diffTime = paymentDateObj.getTime() - dueDateObj.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 5 && diffDays >= 0) {
          status = 'On Time';
        } else if (diffDays > 5 && diffDays <= 30) {
          status = 'Late';
        } else if (diffDays > 30) {
          status = 'Defaulted';
        } else {
          // Payment made before due date is considered "On Time"
          status = 'On Time';
        }
      }

      return {
        id: loan.id,
        name: loan.name,
        interestRate: loan.interestRate,
        principal: loan.principal,
        dueDate: loan.dueDate,
        paymentDate: paymentDate,
        status: status
      };
    });
}

interface LoanCardProps {
  payment: CategorizedPayment;
}

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
      return '#9e9e9e';
  }
};

const LoanCard = ({ payment }: LoanCardProps) => {
  const statusColor = getStatusColor(payment.status);

  return (
    <li className="loan-item">
      <div className="loan-item-content">
        <div className="loan-item-header">
          <div className="loan-avatar">
            {payment.name?.[0]?.toUpperCase() || 'L'}
          </div>
          <div className="loan-info">
            <h3 className="loan-name">{payment.name}</h3>
            <p className="loan-details">
              {payment.interestRate}% interest • Due {payment.dueDate}
              {payment.paymentDate && ` • Paid ${payment.paymentDate}`}
            </p>
          </div>
        </div>
        <div className="loan-item-right">
          <div className="loan-amount">
            ${payment.principal?.toLocaleString() || '0'}
          </div>
          <div 
            className="payment-status" 
            style={{ 
              color: statusColor,
              fontWeight: 600,
              fontSize: '0.9rem'
            }}
          >
            {payment.status}
          </div>
        </div>
      </div>
    </li>
  );
};

const AddNewPayment = () => {
    const [loanId, setLoanId] = useState('');
    const [paymentDate, setPaymentDate] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [createLoanPayment, { loading }] = useMutation(CREATE_LOAN_PAYMENT, {
        refetchQueries: [{ query: GET_LOANS_WITH_PAYMENTS }],
        onCompleted: () => {
            setSuccess(true);
            setError(null);
            setLoanId('');
            setPaymentDate('');
            setTimeout(() => setSuccess(false), 3000);
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

        if (!loanId || !paymentDate) {
            setError('Please fill in all fields');
            return;
        }

        const loanIdNum = parseInt(loanId, 10);
        if (isNaN(loanIdNum)) {
            setError('Loan ID must be a valid number');
            return;
        }

        createLoanPayment({
            variables: {
                input: {
                    loanId: loanIdNum,
                    paymentDate: paymentDate
                }
            }
        });
    };

    return (
        <div className="add-payment-form-container">
            <form className="add-payment-form" onSubmit={handleSubmit}>
                <div className="form-field">
                    <label htmlFor="loan-id">Loan ID</label>
                    <input
                        id="loan-id"
                        name="loan-id"
                        type="number"
                        value={loanId}
                        onChange={(e) => setLoanId(e.target.value)}
                        disabled={loading}
                        placeholder=""
                    />
                </div>

                <div className="form-field">
                    <label htmlFor="payment-date">Payment Date</label>
                    <input
                        id="payment-date"
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

                <button type="submit" className="submit-button" disabled={loading}>
                    {loading ? 'Adding...' : 'Add Payment'}
                </button>
            </form>
        </div>
    )
}

function App() {
    const { loading, error, data } = useQuery<{ loans?: Array<Loan | null> | null }>(GET_LOANS_WITH_PAYMENTS);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error.message}</p>;

    const loans = data?.loans || [];
    const categorizedPayments = categorizeLoanPayments(loans);

    return (
        <>
            <div className="app-container">
                <h1>Existing Loans & Payments</h1>
                <ul className="loans-list">
                    {categorizedPayments.map((payment) => {
                        return <LoanCard key={payment.id} payment={payment} />;
                    })}
                </ul>

                <h1>Add New Payment</h1>
                <AddNewPayment />
            </div>
        </>
    )
}

export default App