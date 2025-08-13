# Instructions App Integration Tasks

The pitch builder now generates a prospect link for document submission and ID verification using a path-based format. The link is constructed as:

```
${process.env.REACT_APP_INSTRUCTIONS_URL}/pitch/<enquiryId>-<passcode>
```

### Required work in the instructions VNET

1. **Validate access tokens**
   - Implement a route handler for `GET /pitch/:compound` where `:compound` is `<enquiryId>-<passcode>`.
   - Parse and validate the compound token, confirm that the passcode matches the persisted deal/enquiry records.

2. **Document & ID upload**
   - Provide a page that allows prospects to upload proof of ID and supporting documents.
   - Store uploaded files against the deal ID in secure storage (e.g., Blob Storage).

3. **Status tracking**
   - Record completion status for proof-of-ID and each uploaded document so that the back office can check progress.

4. **Payments**
   - Payments remain disabled. Ensure no payment prompts or validations are enforced even if the amount is `0`.

5. **Error handling**
   - The endpoint should respond gracefully if the deal is missing or the token is invalid to avoid breaking the pitch builder flow.

These tasks complete the end-to-end flow for prospects to provide verification and documents after receiving a pitch email.
