interface LoanCalculatorProps {
    principal: number;
    rate: number;
    months: number;
}

export const LoanCalculator = ({ principal, rate, months }: LoanCalculatorProps) => {
    if (!principal || !rate || months <= 0) {
        return null;
    }

    const interest = (principal * rate * months) / 100;

    return (
        <div className="loan-calculator">
            <h3>Calculated Interest: KES {interest.toFixed(2)}</h3>
            <p className="calculator-details">
                Based on {months} month{months !== 1 ? 's' : ''} at {rate}% monthly rate
            </p>
        </div>
    );
}