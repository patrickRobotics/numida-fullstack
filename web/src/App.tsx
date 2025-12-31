import { useQuery } from '@apollo/client';
import { AddLoanForm } from './components/AddLoanForm';
import { LoanCard } from './components/LoanCard';
import { categorizeLoans } from './utils/loanUtils';
import { Loan } from './types/loan';
import { GET_LOANS_WITH_PAYMENTS } from './graphql/queries';
import './App.css';

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
                <div style={{ marginTop: '2rem' }}>
                    <AddLoanForm />
                </div>
            </div>
        </>
    )
}

export default App