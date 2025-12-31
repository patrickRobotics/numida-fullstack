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

interface LoanCardProps {
  loan: Loan;
}

const LoanCard = ({ loan }: LoanCardProps) => {
  return (
    <li className="loan-item">
      <div className="loan-item-content">
        <div className="loan-item-header">
          <div className="loan-avatar">
            {loan.name?.[0]?.toUpperCase() || 'L'}
          </div>
          <div className="loan-info">
            <h3 className="loan-name">{loan.name}</h3>
            <p className="loan-details">
              {loan.interestRate}% interest • Due {loan.dueDate}
            </p>
          </div>
        </div>
        <div className="loan-amount">
          ${loan.principal?.toLocaleString() || '0'}
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
        <div>
            <form onSubmit={handleSubmit}>
                <p>
                    <label htmlFor="loan-id">Loan ID</label>
                    <input
                        id="loan-id"
                        name="loan-id"
                        type="number"
                        value={loanId}
                        onChange={(e) => setLoanId(e.target.value)}
                        disabled={loading}
                    />
                </p>

                <p>
                    <label htmlFor="payment-date">Payment Date</label>
                    <input
                        id="payment-date"
                        name="payment-date"
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        disabled={loading}
                    />
                </p>
                {error && (
                    <p style={{ color: 'red', marginTop: '0.5rem' }}>
                        {error}
                    </p>
                )}
                {success && (
                    <p style={{ color: 'green', marginTop: '0.5rem' }}>
                        Payment added successfully!
                    </p>
                )}
                <p>
                    <button type="submit" disabled={loading}>
                        {loading ? 'Adding...' : 'Add Payment'}
                    </button>
                </p>
            </form>
        </div>
    )
}

function App() {
    const { loading, error, data } = useQuery<{ loans?: Array<Loan | null> | null }>(GET_LOANS_WITH_PAYMENTS);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error.message}</p>;

    const loans = data?.loans || [];

    return (
        <>
            <div className="app-container">
                <h1>Existing Loans & Payments</h1>
                <ul className="loans-list">
                    {loans.map((loan) => {
                        if (!loan) return null;
                        return <LoanCard key={loan.id} loan={loan} />;
                    })}
                </ul>

                <h1>Add New Payment</h1>
                <AddNewPayment />
            </div>
        </>
    )
}

export default App