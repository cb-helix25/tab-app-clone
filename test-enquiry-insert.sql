-- Test enquiry insert for claim functionality testing
-- This creates an unclaimed enquiry that can be claimed by any user

INSERT INTO [dbo].[enquiries] (
    [ID],
    [First_Name],
    [Last_Name],
    [Email],
    [Phone_Number],  -- Fixed: was 'Phone'
    [Company],
    [Area_of_Work],
    [Value],
    [Initial_first_call_notes],
    [Point_of_Contact],
    [Date_Created],  -- Fixed: was 'Created_Date'
    [Touchpoint_Date],  -- Using this instead of Created_Time
    [Rating],
    [Ultimate_Source]  -- Fixed: was 'Source'
) VALUES (
    'TEST-CLAIM-' + CAST(NEWID() AS NVARCHAR(36)),  -- Unique ID with timestamp
    'John',
    'Test-Claimer',
    'john.testclaimer@example.com',
    '+44 7123 456789',
    'Test Company Ltd',
    'Commercial',
    '£25,000',
    'Test enquiry for claim functionality. Client needs advice on commercial contract review. This is a dummy enquiry created for testing the claim button functionality in the enquiries system.',
    'team@helix-law.com',  -- UNCLAIMED - this is the key field for testing
    CAST(GETDATE() AS DATE),
    CAST(GETDATE() AS DATE),  -- Using same date for touchpoint
    NULL,  -- No rating yet
    'Website'
);

-- Alternative with specific ID for easy identification:
/*
INSERT INTO [dbo].[enquiries] (
    [ID],
    [First_Name],
    [Last_Name],
    [Email],
    [Phone_Number],
    [Company],
    [Area_of_Work],
    [Value],
    [Initial_first_call_notes],
    [Point_of_Contact],
    [Date_Created],
    [Touchpoint_Date],
    [Rating],
    [Ultimate_Source]
) VALUES (
    'CLAIM-TEST-001',
    'Sarah',
    'Test-Client',
    'sarah.testclient@example.com',
    '+44 7987 654321',
    'Another Test Co',
    'Property',
    '£50,000',
    'Property purchase enquiry - needs conveyancing advice. Completion date in 6 weeks. First time buyer, some complications with chain.',
    'team@helix-law.com',
    CAST(GETDATE() AS DATE),
    CAST(GETDATE() AS DATE),
    NULL,
    'Referral'
);
*/

-- Check the insert worked and see unclaimed enquiries:
-- SELECT * FROM [dbo].[enquiries] WHERE [Point_of_Contact] = 'team@helix-law.com' ORDER BY [Created_Date] DESC;
