## Tests
Added backend unit tests for graphql and REST endpoints

To run unit tests for the server:

```bash
docker compose --profile test run --rm test
```

This will:
1. Build the Docker image (if not already built)
2. Run all unit tests using Python's built-in unittest module
3. Display test results and exit

Couldn't create web tests since TS would require additional libraries to compile

## Improvements & Assummptions
1. I changed the repayment and loan creation forms to use dialogs to maintain a cleean ui. 
2. I refactored payment form to be specific to a loan record to reduce human errors entering loan ids - also improves user experience by reducing the information overload.
3. Added payment button to only unpaid loans to reduce cluttering the UI with action buttons for each loan, especially after moving the button to loan level.


1. I worked with assumption that a loan payment implies clearing the loan - although the loan model allows more than one payments.

