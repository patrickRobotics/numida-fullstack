import datetime
from flask import Flask, request, jsonify
from werkzeug.exceptions import BadRequest
from flask_graphql import GraphQLView
from flask_cors import CORS
import graphene


app = Flask(__name__)
# Allow CORS for all routes and origins (for development)
CORS(app, resources={r"/*": {"origins": "*", "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]}})

loans = [
    {
        "id": 1,
        "name": "Tom's Loan",
        "interest_rate": 5.0,
        "principal": 10000,
        "due_date": datetime.date(2025, 3, 1),
    },
    {
        "id": 2,
        "name": "Chris Wailaka",
        "interest_rate": 3.5,
        "principal": 500000,
        "due_date": datetime.date(2025, 3, 1),
    },
    {
        "id": 3,
        "name": "NP Mobile Money",
        "interest_rate": 4.5,
        "principal": 30000,
        "due_date": datetime.date(2025, 3, 1),
    },
    {
        "id": 4,
        "name": "Esther's Autoparts",
        "interest_rate": 1.5,
        "principal": 40000,
        "due_date": datetime.date(2025, 3, 1),
    },
]

loan_payments = [
    {"id": 1, "loan_id": 1, "payment_date": datetime.date(2024, 3, 4)},
    {"id": 2, "loan_id": 2, "payment_date": datetime.date(2024, 3, 15)},
    {"id": 3, "loan_id": 3, "payment_date": datetime.date(2024, 4, 5)},
]


class LoanPayment(graphene.ObjectType):
    id = graphene.Int()
    loan_id = graphene.Int()
    payment_date = graphene.Date()


class ExistingLoans(graphene.ObjectType):
    id = graphene.Int()
    name = graphene.String()
    interest_rate = graphene.Float()
    principal = graphene.Int()
    due_date = graphene.Date()
    payments = graphene.List(LoanPayment)

    def resolve_payments(self, info):
        if isinstance(self, dict):
            loan_id = self.get("id")
        else:
            loan_id = getattr(self, "id", None)
        return [payment for payment in loan_payments if payment.get("loan_id") == loan_id]


class CreateLoanInput(graphene.InputObjectType):
    name = graphene.String(required=True)
    interest_rate = graphene.Float(required=True)
    principal = graphene.Int(required=True)
    due_date = graphene.Date(required=True)


class CreateLoanPaymentInput(graphene.InputObjectType):
    loan_id = graphene.Int(required=True)
    payment_date = graphene.Date(required=True)


class CreateLoan(graphene.Mutation):
    class Arguments:
        input = CreateLoanInput(required=True)

    loan = graphene.Field(ExistingLoans)

    def mutate(self, info, input):
        # Generate new ID
        new_id = max([loan.get("id") for loan in loans], default=0) + 1
        
        new_loan = {
            "id": new_id,
            "name": input.name,
            "interest_rate": input.interest_rate,
            "principal": input.principal,
            "due_date": input.due_date,
        }
        loans.append(new_loan)
        return CreateLoan(loan=new_loan)


class CreateLoanPayment(graphene.Mutation):
    class Arguments:
        input = CreateLoanPaymentInput(required=True)

    payment = graphene.Field(LoanPayment)

    def mutate(self, info, input):
        # Validate that loan exists
        if not any(loan.get("id") == input.loan_id for loan in loans):
            raise Exception(f"Loan with id {input.loan_id} not found")
        
        # Generate new ID
        new_id = max([payment.get("id") for payment in loan_payments], default=0) + 1
        
        new_payment = {
            "id": new_id,
            "loan_id": input.loan_id,
            "payment_date": input.payment_date,
        }
        loan_payments.append(new_payment)
        return CreateLoanPayment(payment=new_payment)


class Mutation(graphene.ObjectType):
    create_loan = CreateLoan.Field()
    create_loan_payment = CreateLoanPayment.Field()


class Query(graphene.ObjectType):
    loans = graphene.List(ExistingLoans)
    loan = graphene.Field(ExistingLoans, id=graphene.Int(required=True))
    loan_payments = graphene.List(LoanPayment)

    def resolve_loans(self, info):
        return loans

    def resolve_loan(self, info, id):
        loan = next((loan for loan in loans if loan.get("id") == id), None)
        return loan

    def resolve_loan_payments(self, info):
        return loan_payments


schema = graphene.Schema(query=Query, mutation=Mutation)


app.add_url_rule(
    "/graphql", view_func=GraphQLView.as_view("graphql", schema=schema, graphiql=True)
)


@app.route("/loan-payments", methods=["POST"])
def create_loan_payment():
    """Create a new loan payment via REST API"""
    try:
        try:
            data = request.get_json()
        except BadRequest:
            return jsonify({"error": "Request body must be JSON"}), 400
        
        # Validations - check if JSON parsing failed (returns None) or if it's an empty dict
        if data is None:
            return jsonify({"error": "Request body must be JSON"}), 400
        
        if "loan_id" not in data:
            return jsonify({"error": "loan_id is required"}), 400
        
        if "payment_date" not in data:
            return jsonify({"error": "payment_date is required"}), 400
        
        loan_id = data["loan_id"]
        payment_date_str = data["payment_date"]
        
        try:
            loan_id = int(loan_id)
        except (ValueError, TypeError):
            return jsonify({"error": "loan_id must be an integer"}), 400
        
        # ValidCheckate if loan exists
        if not any(loan.get("id") == loan_id for loan in loans):
            return jsonify({"error": f"Loan with id {loan_id} not found"}), 404
        
        # Parse payment_date
        try:
            payment_date = datetime.datetime.strptime(payment_date_str, "%Y-%m-%d").date()
        except (ValueError, TypeError):
            return jsonify({"error": "payment_date must be in YYYY-MM-DD format"}), 400
        
        new_id = max([payment.get("id") for payment in loan_payments], default=0) + 1
        
        new_payment = {
            "id": new_id,
            "loan_id": loan_id,
            "payment_date": payment_date,
        }
        loan_payments.append(new_payment)
        
        # Return the created payment
        return jsonify({
            "id": new_payment["id"],
            "loan_id": new_payment["loan_id"],
            "payment_date": new_payment["payment_date"].isoformat(),
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/")
def home():
    return "Welcome to the Loan Application API"


if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True)
