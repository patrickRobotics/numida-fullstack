import { useEffect, useState } from 'react'

// SECTION 4 Debugging & Code Refactoring
export const LoanCalculator = ({ principal, rate, months }) => {
    const [interest, setInterest] = useState(0)

    useEffect(() => {
        setInterest((principal * rate * months) / 100)
    }, [])

    return (
        <div>
            <h3>Loan Interest: {interest}</h3>
        </div>
    )
}
