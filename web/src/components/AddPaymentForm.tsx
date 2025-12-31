import { useState, useEffect } from 'react';
import { createLoanPayment } from '../api/loanPaymentApi';

interface AddPaymentFormProps {
    loanId: number;
    onSuccess?: () => void;
}

export const AddPaymentForm = ({ loanId, onSuccess }: AddPaymentFormProps) => {
    const [paymentDate, setPaymentDate] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        if (!paymentDate) {
            setError('Please enter a payment date');
            return;
        }

        setLoading(true);

        try {
            await createLoanPayment({
                loan_id: loanId,
                payment_date: paymentDate
            });

            setSuccess(true);
            setError(null);
            setPaymentDate('');
            
            // Call onSuccess callback if provided (for refetching data)
            if (onSuccess) {
                onSuccess();
            }

            setTimeout(() => {
                setSuccess(false);
                setShowModal(false);
            }, 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            setSuccess(false);
        } finally {
            setLoading(false);
        }
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

