# Matter Opening Workflow

After a matter is opened, the related instruction record must be updated. The `importInstructionData` function handles these updates.

1. Submit the matter data to `importInstructionData` via an HTTP `POST` request.
2. The function sets the instruction **Stage** to `Client` and records the provided `ClientId`, `RelatedClientId` and `MatterId`.
   - When multiple contacts are created, pass a comma-separated list of IDs for `RelatedClientId` (e.g. `12345,67890`).
3. When a `matter` object is included in the payload it is inserted into the `Matters` table created by `create_matters_table.sql`.

Use this workflow to synchronise instruction records after the "Submit Matter" button is pressed.