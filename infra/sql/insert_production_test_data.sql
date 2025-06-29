-- Insert data for Deals table
DELETE FROM dbo.Deals;
INSERT INTO dbo.Deals
    (DealId, InstructionRef, ProspectId, Passcode, ServiceDescription, Amount, AreaOfWork, PitchedBy, PitchedDate, PitchedTime, PitchValidUntil, Status, IsMultiClient, LeadClientId, LeadClientEmail, CloseDate, CloseTime)
VALUES
    (5, 'HLX-1-PRE', 1, 'P1', 'test item', 1.00, 'testing', 'AB', '2025-01-01', '09:00:00', '2025-12-31', 'pitched', 0, 1, 'test@example.com', NULL, NULL),
    (6, 'HLX-2-START', 2, 'P2', 'test item', 1.00, 'testing', 'AB', '2025-01-01', '09:00:00', '2025-12-31', 'pitched', 0, 2, 'test@example.com', NULL, NULL),
    (1, 'HLX-3-OPTDOC', 3, 'P3', 'test item', 1.00, 'testing', 'AB', '2025-01-01', '09:00:00', '2025-12-31', 'closed', 0, 3, 'test@example.com', '2025-02-01', '10:00:00'),
    (2, 'HLX-4-REVIEWOK', 4, 'P4', 'test item', 1.00, 'testing', 'AB', '2025-01-01', '09:00:00', '2025-12-31', 'closed', 0, 4, 'test@example.com', '2025-02-01', '10:00:00'),
    (3, 'HLX-5-REVIEWFAIL', 5, 'P5', 'test item', 1.00, 'testing', 'AB', '2025-01-01', '09:00:00', '2025-12-31', 'closed', 0, 5, 'test@example.com', '2025-02-01', '10:00:00'),
    (4, 'HLX-6-ALLGOOD', 6, 'P6', 'test item', 1.00, 'testing', 'AB', '2025-01-01', '09:00:00', '2025-12-31', 'closed', 0, 6, 'test@example.com', '2025-02-01', '10:00:00');

-- Insert data for DealJointClients table
DELETE FROM dbo.DealJointClients;
INSERT INTO dbo.DealJointClients
    (DealJointClientId, DealId, ClientEmail, HasSubmitted, SubmissionDateTime)
VALUES
    (30, 7, '001@helix-law.com', 0, NULL),
    (31, 7, '002@helix-law.com', 0, NULL);
    
-- Insert data for Instructions table
DELETE FROM dbo.Instructions;
INSERT INTO dbo.Instructions
    (
    InstructionRef, Stage, ClientType, HelixContact, ConsentGiven, InternalStatus, SubmissionDate, SubmissionTime, LastUpdated, ClientId, RelatedClientId, MatterId, Title, FirstName, LastName, Nationality, NationalityAlpha2, DOB, Gender, Phone, Email, PassportNumber, DriversLicenseNumber, IdType, HouseNumber, Street, City, County, Postcode, Country, CountryCode, CompanyName, CompanyNumber, CompanyHouseNumber, CompanyStreet, CompanyCity, CompanyCounty, CompanyPostcode, CompanyCountry, CompanyCountryCode, Notes, PaymentMethod, PaymentResult, PaymentAmount, PaymentProduct, AliasId, OrderId, SHASign, PaymentTimestamp)
VALUES
    ('HLX-1-PRE', 'initialised', 'Individual', 'AB', 1, 'poid', '2025-01-01', '12:00:00', '2025-01-01T12:00:00', NULL, NULL, NULL, 'Mx', 'TestA', 'User', 'United Kingdom', 'GB', '1990-01-01', 'Other', '0000000000', 'test@example.com', NULL, NULL, 'passport', '1', 'Test Street', 'Test City', 'Test County', 'TE5 7ST', 'United Kingdom', 'GB', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'card', NULL, 0.00, 'test item', NULL, NULL, NULL, NULL),
    ('HLX-2-START', 'poid', 'Individual', 'AB', 1, 'poid', '2025-01-01', '12:05:00', '2025-01-01T12:05:00', NULL, NULL, NULL, 'Mx', 'TestB', 'User', 'United Kingdom', 'GB', '1990-01-01', 'Other', '0000000000', 'test@example.com', 'AA1234567', NULL, 'passport', '1', 'Test Street', 'Test City', 'Test County', 'TE5 7ST', 'United Kingdom', 'GB', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'card', NULL, 0.00, 'test item', NULL, NULL, NULL, NULL),
    ('HLX-3-OPTDOC', 'completed', 'Individual', 'AB', 1, 'paid', '2025-01-01', '12:10:00', '2025-01-01T12:10:00', NULL, NULL, NULL, 'Mx', 'TestC', 'User', 'United Kingdom', 'GB', '1990-01-01', 'Other', '0000000000', 'test@example.com', 'BB1234567', NULL, 'passport', '1', 'Test Street', 'Test City', 'Test County', 'TE5 7ST', 'United Kingdom', 'GB', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'card', 'successful', 1.00, 'test item', NULL, NULL, NULL, NULL),
    ('HLX-4-REVIEWOK', 'completed', 'Individual', 'AB', 1, 'paid', '2025-01-01', '12:15:00', '2025-01-01T12:15:00', NULL, NULL, NULL, 'Mx', 'TestD', 'User', 'United Kingdom', 'GB', '1990-01-01', 'Other', '0000000000', 'test@example.com', 'CC1234567', NULL, 'passport', '1', 'Test Street', 'Test City', 'Test County', 'TE5 7ST', 'United Kingdom', 'GB', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'card', 'successful', 1.00, 'test item', NULL, NULL, NULL, NULL),
    ('HLX-5-REVIEWFAIL', 'completed', 'Individual', 'AB', 1, 'paid', '2025-01-01', '12:20:00', '2025-01-01T12:20:00', NULL, NULL, NULL, 'Mx', 'TestE', 'User', 'United Kingdom', 'GB', '1990-01-01', 'Other', '0000000000', 'test@example.com', 'DD1234567', NULL, 'passport', '1', 'Test Street', 'Test City', 'Test County', 'TE5 7ST', 'United Kingdom', 'GB', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'card', 'failed', 1.00, 'test item', NULL, NULL, NULL, NULL),
    ('HLX-6-ALLGOOD', 'completed', 'Individual', 'AB', 1, 'paid', '2025-01-01', '12:25:00', '2025-01-01T12:25:00', NULL, NULL, NULL, 'Mx', 'TestF', 'User', 'United Kingdom', 'GB', '1990-01-01', 'Other', '0000000000', 'test@example.com', 'EE1234567', NULL, 'passport', '1', 'Test Street', 'Test City', 'Test County', 'TE5 7ST', 'United Kingdom', 'GB', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'card', 'successful', 1.00, 'test item', NULL, NULL, NULL, NULL);

-- Insert data for Documents table
DELETE FROM dbo.Documents;
INSERT INTO dbo.Documents
    (DocumentId, InstructionRef, DocumentType, FileName, BlobUrl, FileSizeBytes, UploadedBy, UploadedAt, Notes)
VALUES
    (4, 'HLX-3-OPTDOC', NULL, 'doc.pdf', 'https://example.com/doc4.pdf', NULL, NULL, '2025-01-02T10:00:00', NULL),
    (2, 'HLX-6-ALLGOOD', NULL, 'doc.pdf', 'https://example.com/doc2.pdf', NULL, NULL, '2025-01-02T11:00:00', NULL);

-- Insert data for IDVerifications table
DELETE FROM dbo.IDVerifications;
-- No ID verification records for local test data

-- RiskAssessment table currently has no data.
