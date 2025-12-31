import unittest
import json
import datetime
from app import app, loans, loan_payments


class GraphQLTestCase(unittest.TestCase):
    """Test cases for GraphQL endpoints"""

    def setUp(self):
        """Set up test client and reset data before each test"""
        self.client = app.test_client()
        self.app_context = app.app_context()
        self.app_context.push()
        
        # Backup original data
        self.original_loans = loans.copy()
        self.original_payments = loan_payments.copy()
        
        # Clear data for clean tests
        loans.clear()
        loan_payments.clear()
        
        # Add test data
        loans.extend([
            {
                "id": 1,
                "name": "Test Loan 1",
                "interest_rate": 5.0,
                "principal": 10000,
                "due_date": datetime.date(2025, 4, 1),
            },
            {
                "id": 2,
                "name": "Test Loan 2",
                "interest_rate": 3.5,
                "principal": 50000,
                "due_date": datetime.date(2025, 5, 1),
            },
        ])
        
        loan_payments.extend([
            {
                "id": 1,
                "loan_id": 1,
                "payment_date": datetime.date(2025, 4, 5),
            },
            {
                "id": 2,
                "loan_id": 1,
                "payment_date": datetime.date(2025, 4, 10),
            },
        ])

    def tearDown(self):
        """Restore original data after each test"""
        loans.clear()
        loan_payments.clear()
        loans.extend(self.original_loans)
        loan_payments.extend(self.original_payments)
        self.app_context.pop()

    def _graphql_query(self, query, variables=None):
        """Helper method to make GraphQL queries"""
        payload = {
            "query": query
        }
        if variables:
            payload["variables"] = variables
            
        response = self.client.post(
            "/graphql",
            data=json.dumps(payload),
            content_type="application/json"
        )
        try:
            data = json.loads(response.data.decode('utf-8'))
        except (json.JSONDecodeError, UnicodeDecodeError):
            # If JSON parsing fails, return error structure
            data = {"errors": [{"message": response.data.decode('utf-8', errors='replace')}]}
        return response, data

    def test_query_loans(self):
        """Test querying all loans"""
        query = """
        query {
            loans {
                id
                name
                interestRate
                principal
                dueDate
            }
        }
        """
        response, data = self._graphql_query(query)
        
        self.assertEqual(response.status_code, 200)
        self.assertIn("data", data)
        self.assertIn("loans", data["data"])
        self.assertEqual(len(data["data"]["loans"]), 2)
        self.assertEqual(data["data"]["loans"][0]["id"], 1)
        self.assertEqual(data["data"]["loans"][0]["name"], "Test Loan 1")
        self.assertEqual(data["data"]["loans"][0]["interestRate"], 5.0)
        self.assertEqual(data["data"]["loans"][0]["principal"], 10000)

    def test_query_loan_by_id(self):
        """Test querying a single loan by ID"""
        query = """
        query {
            loan(id: 1) {
                id
                name
                interestRate
                principal
                dueDate
            }
        }
        """
        response, data = self._graphql_query(query)
        
        self.assertEqual(response.status_code, 200)
        self.assertIn("data", data)
        self.assertIn("loan", data["data"])
        self.assertEqual(data["data"]["loan"]["id"], 1)
        self.assertEqual(data["data"]["loan"]["name"], "Test Loan 1")

    def test_query_loan_by_id_not_found(self):
        """Test querying a non-existent loan"""
        query = """
        query {
            loan(id: 999) {
                id
                name
            }
        }
        """
        response, data = self._graphql_query(query)
        
        self.assertEqual(response.status_code, 200)
        self.assertIn("data", data)
        self.assertIsNone(data["data"]["loan"])

    def test_query_loan_with_payments(self):
        """Test querying a loan with its payments"""
        query = """
        query {
            loan(id: 1) {
                id
                name
                payments {
                    id
                    loanId
                    paymentDate
                }
            }
        }
        """
        response, data = self._graphql_query(query)
        
        self.assertEqual(response.status_code, 200)
        self.assertIn("data", data)
        self.assertIn("loan", data["data"])
        self.assertIn("payments", data["data"]["loan"])
        self.assertEqual(len(data["data"]["loan"]["payments"]), 2)
        self.assertEqual(data["data"]["loan"]["payments"][0]["loanId"], 1)

    def test_query_loan_payments(self):
        """Test querying all loan payments"""
        query = """
        query {
            loanPayments {
                id
                loanId
                paymentDate
            }
        }
        """
        response, data = self._graphql_query(query)
        
        self.assertEqual(response.status_code, 200)
        self.assertIn("data", data)
        self.assertIn("loanPayments", data["data"])
        self.assertEqual(len(data["data"]["loanPayments"]), 2)
        self.assertEqual(data["data"]["loanPayments"][0]["id"], 1)
        self.assertEqual(data["data"]["loanPayments"][0]["loanId"], 1)

    def test_mutation_create_loan(self):
        """Test creating a new loan"""
        mutation = """
        mutation {
            createLoan(input: {
                name: "New Test Loan"
                interestRate: 4.0
                principal: 25000
                dueDate: "2025-06-01"
            }) {
                loan {
                    id
                    name
                    interestRate
                    principal
                    dueDate
                }
            }
        }
        """
        response, data = self._graphql_query(mutation)
        
        self.assertEqual(response.status_code, 200)
        self.assertIn("data", data)
        self.assertIn("createLoan", data["data"])
        self.assertIn("loan", data["data"]["createLoan"])
        self.assertEqual(data["data"]["createLoan"]["loan"]["name"], "New Test Loan")
        self.assertEqual(data["data"]["createLoan"]["loan"]["interestRate"], 4.0)
        self.assertEqual(data["data"]["createLoan"]["loan"]["principal"], 25000)
        self.assertEqual(data["data"]["createLoan"]["loan"]["id"], 3)  # Should be next ID
        
        # Verify loan was added to the list
        query = """
        query {
            loans {
                id
                name
            }
        }
        """
        _, query_data = self._graphql_query(query)
        self.assertEqual(len(query_data["data"]["loans"]), 3)

    def test_mutation_create_loan_invalid_payload(self):
        """Test creating a loan with missing required fields"""
        mutation = """
        mutation {
            createLoan(input: {
                name: "New Loan"
                principal: 20000
            }) {
                loan {
                    id
                    name
                }
            }
        }
        """
        response, data = self._graphql_query(mutation)

        self.assertEqual(response.status_code, 200)
        # Check that we have errors in the response
        self.assertIn("errors", data, f"Expected 'errors' in response. Status: {response.status_code}, Data: {data}")
        self.assertGreater(len(data["errors"]), 0, f"No errors found: {data}")
        
        # Check that error message mentions missing fields
        error_message = data["errors"][0]["message"]
        self.assertIn("interestRate", error_message, f"Error message should mention interestRate: {error_message}")
        self.assertIn("dueDate", error_message, f"Error message should mention dueDate: {error_message}")
        
        # Verify no loan was created, should still have original 2 loans
        query = """
        query {
            loans {
                id
                name
            }
        }
        """
        _, query_data = self._graphql_query(query)
        self.assertEqual(len(query_data["data"]["loans"]), 2)

    def test_mutation_create_loan_payment(self):
        """Test creating a new loan payment"""
        mutation = """
        mutation {
            createLoanPayment(input: {
                loanId: 2
                paymentDate: "2025-05-05"
            }) {
                payment {
                    id
                    loanId
                    paymentDate
                }
            }
        }
        """
        response, data = self._graphql_query(mutation)
        
        self.assertEqual(response.status_code, 200)
        self.assertIn("data", data)
        self.assertIn("createLoanPayment", data["data"])
        self.assertIn("payment", data["data"]["createLoanPayment"])
        self.assertEqual(data["data"]["createLoanPayment"]["payment"]["loanId"], 2)
        self.assertEqual(data["data"]["createLoanPayment"]["payment"]["paymentDate"], "2025-05-05")
        
        # Verify payment was added
        query = """
        query {
            loanPayments {
                id
                loanId
            }
        }
        """
        _, query_data = self._graphql_query(query)
        self.assertEqual(len(query_data["data"]["loanPayments"]), 3)

    def test_mutation_create_loan_payment_invalid_loan(self):
        """Test creating a payment for a non-existent loan"""
        mutation = """
        mutation {
            createLoanPayment(input: {
                loanId: 999
                paymentDate: "2025-05-05"
            }) {
                payment {
                    id
                }
            }
        }
        """
        response, data = self._graphql_query(mutation)
        
        self.assertEqual(response.status_code, 200)
        self.assertIn("errors", data)
        self.assertTrue(
            any("not found" in error.get("message", "").lower() for error in data["errors"]),
            f"Expected 'not found' error message, got: {data.get('errors', [])}"
        )

    def test_loans_with_payments_relationship(self):
        """Test that loans correctly return their associated payments"""
        query = """
        query {
            loans {
                id
                name
                payments {
                    id
                    loanId
                    paymentDate
                }
            }
        }
        """
        response, data = self._graphql_query(query)
        
        self.assertEqual(response.status_code, 200)
        self.assertIn("data", data)
        
        # Loan 1 should have 2 payments
        loan1 = next(loan for loan in data["data"]["loans"] if loan["id"] == 1)
        self.assertEqual(len(loan1["payments"]), 2)
        
        # Loan 2 should have 0 payments
        loan2 = next(loan for loan in data["data"]["loans"] if loan["id"] == 2)
        self.assertEqual(len(loan2["payments"]), 0)


if __name__ == "__main__":
    unittest.main()

