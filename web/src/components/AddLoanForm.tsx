import { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { LoanCalculator } from './LoanCalculator';
import { calculateMonthsUntilDue } from '../utils/dateUtils';
import { GET_LOANS_WITH_PAYMENTS, CREATE_LOAN } from '../graphql/queries';

interface AddLoanFormProps {}

export const AddLoanForm = ({}: AddLoanFormProps) => {
    const [name, setName] = useState('');
    const [principal, setPrincipal] = useState('');
    const [interestRate, setInterestRate] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const [createLoan, { loading }] = useMutation(CREATE_LOAN, {
        refetchQueries: [{ query: GET_LOANS_WITH_PAYMENTS }],
        onCompleted: () => {
            setSuccess(true);
            setError(null);
            setName('');
            setPrincipal('');
            setInterestRate('');
            setDueDate('');
            setTimeout(() => {
                setSuccess(false);
                setShowModal(false);
            }, 1000);
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

        if (!name || !principal || !interestRate || !dueDate) {
            setError('Please fill in all fields');
            return;
        }

        const principalNum = parseFloat(principal);
        const rateNum = parseFloat(interestRate);

        if (isNaN(principalNum) || principalNum <= 0) {
            setError('Principal must be a positive number');
            return;
        }

        if (isNaN(rateNum) || rateNum <= 0) {
            setError('Interest rate must be a positive number');
            return;
        }

        createLoan({
            variables: {
                input: {
                    name: name,
                    principal: Math.round(principalNum),
                    interestRate: rateNum,
                    dueDate: dueDate
                }
            }
        });
    };

    const handleClose = () => {
        if (!loading) {
            setShowModal(false);
            setError(null);
            setName('');
            setPrincipal('');
            setInterestRate('');
            setDueDate('');
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

    const principalNum = principal ? parseFloat(principal) : 0;
    const rateNum = interestRate ? parseFloat(interestRate) : 0;
    const months = dueDate ? calculateMonthsUntilDue(dueDate) : 0;
    const showCalculator = principalNum > 0 && rateNum > 0 && dueDate !== '';

    return (
        <>
            <button 
                type="button"
                className="add-loan-button"
                onClick={() => setShowModal(true)}
            >
                Add New Loan
            </button>

            {showModal && (
                <div className="modal-overlay" onClick={handleBackdropClick}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add New Loan</h2>
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
                                <label htmlFor="loan-name">Loan Name</label>
                                <input
                                    id="loan-name"
                                    name="loan-name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={loading}
                                    placeholder="Enter loan name"
                                />
                            </div>

                            <div className="form-field">
                                <label htmlFor="loan-principal">Principal (KES)</label>
                                <input
                                    id="loan-principal"
                                    name="loan-principal"
                                    type="number"
                                    value={principal}
                                    onChange={(e) => setPrincipal(e.target.value)}
                                    disabled={loading}
                                    placeholder="Enter principal amount"
                                    min="0"
                                    step="0.01"
                                />
                            </div>

                            <div className="form-field">
                                <label htmlFor="loan-interest-rate">Monthly Interest Rate (%)</label>
                                <input
                                    id="loan-interest-rate"
                                    name="loan-interest-rate"
                                    type="number"
                                    value={interestRate}
                                    onChange={(e) => setInterestRate(e.target.value)}
                                    disabled={loading}
                                    placeholder="Enter annual interest rate"
                                    min="0"
                                    step="0.1"
                                />
                            </div>

                            <div className="form-field">
                                <label htmlFor="loan-due-date">Due Date</label>
                                <input
                                    id="loan-due-date"
                                    name="loan-due-date"
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    disabled={loading}
                                />
                            </div>

                            {showCalculator && (
                                <LoanCalculator 
                                    principal={principalNum} 
                                    rate={rateNum} 
                                    months={months}
                                />
                            )}

                            {error && (
                                <div className="form-message form-error">
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div className="form-message form-success">
                                    Loan created successfully!
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
                                    {loading ? 'Creating...' : 'Create Loan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};