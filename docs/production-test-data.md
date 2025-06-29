# Production Test Dataset

This script populates the core tables used by the Instructions dashboard with deterministic values.  
Run the SQL found in `infra/sql/insert_production_test_data.sql` on a clean database to seed deals, instructions, joint clients, documents and ID verification records.

The dataset mirrors the sample JSON shipped with the project so the front end displays complete information for each stage:

- **Deals** – three deals covering pitched and closed scenarios
- **Instructions** – full range from initialised to completed with representative client details
- **Documents** – file references for one instruction to exercise the document tab
- **IDVerifications** – a mix of lead and joint client checks including long form raw responses

Risk assessments intentionally remain empty.  Future agents can extend the script with inserts once those records are required.

After running the SQL you can start the app using `REACT_APP_USE_LOCAL_DATA=false` to verify the dashboard renders correctly against the test database.