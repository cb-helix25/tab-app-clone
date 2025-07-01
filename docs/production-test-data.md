# Production Test Dataset

This script populates the core tables used by the Instructions dashboard with deterministic values.  
Run the SQL found in `infra/sql/insert_production_test_data.sql` on a clean database to seed deals, instructions, joint clients, documents and ID verification records.
Before executing the script on an existing database, delete any old rows or truncate the tables to avoid conflicts.

```sql
TRUNCATE TABLE dbo.Deals;
TRUNCATE TABLE dbo.Instructions;
TRUNCATE TABLE dbo.Documents;
TRUNCATE TABLE dbo.IDVerifications;
```


The dataset mirrors the sample JSON shipped with the project so the front end displays complete information for each stage:

- **Deals** – six deals covering pitched and closed scenarios
- **Instructions** – records for every stage with representative client details
- **Documents** – file references for multiple instructions so the document tab renders complete rows
- **IDVerifications** – five example checks with full metadata and raw responses
- **RiskAssessment** – baseline entries for two instructions

The dataset now mirrors the expanded local JSON files so the dashboard shows all available fields. Future agents can add more scenarios as needed.

After running the SQL you can start the app using `REACT_APP_USE_LOCAL_DATA=false` to verify the dashboard renders correctly against the test database.