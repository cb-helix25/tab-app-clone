-- Fix the specific deal issue: Keep the real deal (149) and remove the placeholder (148)

-- Show current state
SELECT 'Current state - showing both deals:' as Info;
SELECT DealId, ProspectId, ServiceDescription, Amount, Passcode, InstructionRef
FROM Deals 
WHERE DealId IN (148, 149)
ORDER BY DealId;

-- Remove the placeholder deal (148) and keep the real one (149)
DELETE FROM DealJointClients WHERE DealId = 148;
DELETE FROM Deals WHERE DealId = 148;

-- Verify the fix - should only show deal 149 now
SELECT 'After fix - should only show the real deal:' as Info;
SELECT DealId, ProspectId, ServiceDescription, Amount, Passcode, InstructionRef
FROM Deals 
WHERE DealId IN (148, 149)
ORDER BY DealId;
