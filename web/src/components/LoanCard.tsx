import { AddPaymentForm } from './AddPaymentForm';
import { CategorizedLoan, PaymentStatus } from '../types/loan';

interface LoanCardProps {
    loan: CategorizedLoan;
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
            return '#9e9e9e'; // GREY
    }
};

export const LoanCard = ({ loan }: LoanCardProps) => {
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