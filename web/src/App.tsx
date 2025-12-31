import './App.css'

const AddNewPayment = () => {
    return (
        <div>
            <form
                onSubmit={(e) => {
                    e.preventDefault()
                }}
            >
                <p>
                    <label>Payment Loan Id</label>
                    <input name="loan-id" onChange={() => {}} />
                </p>

                <p>
                    <label>Payment Amount</label>
                    <input
                        name="payment-amount"
                        type="number"
                        onChange={() => {}}
                    />
                </p>
                <p>
                    <button type="submit">Add Payment</button>
                </p>
            </form>
        </div>
    )
}

function App() {
    return (
        <>
            <div>
                <h1>Existing Loans & Payments</h1>
                <ul></ul>

                <h1>Add New Payment</h1>
                <AddNewPayment />
            </div>
        </>
    )
}

export default App
