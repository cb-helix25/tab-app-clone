-- Delete annual leave record by request ID
-- This statement removes a specific annual leave request from the database
-- Parameter: @requestId - The unique identifier for the annual leave request

DELETE FROM dbo.annualLeave 
WHERE request_id = @requestId;

-- Alternative version if using positional parameters:
-- DELETE FROM dbo.annualLeave 
-- WHERE request_id = ?;

-- For direct value substitution (less secure, not recommended for production):
-- DELETE FROM dbo.annualLeave 
-- WHERE request_id = {requestId};

-- Example usage with specific value:
-- DELETE FROM dbo.annualLeave 
-- WHERE request_id = 12345;