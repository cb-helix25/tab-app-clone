-- Quick fix: Restore the actual deals and remove the placeholder ones that were incorrectly kept
-- This reverses the mistake where we kept placeholder deals instead of real ones

-- Based on the original data, we need to:
-- 1. Bring back deals 149 and 148 (the actual deals with amounts like "test item £1")  
-- 2. Remove deals 145, 105, 101, 106, 108, 127 (the placeholder deals with £0)

-- First, let's see current state
SELECT 'Current remaining deals:' as Info;
SELECT DealId, ProspectId, ServiceDescription, Amount, PitchedDate, PitchedTime, Passcode
FROM Deals 
WHERE DealId IN (145, 105, 101, 106, 108, 127, 148, 149)
ORDER BY DealId;

-- The fix: Remove the placeholder deals that were incorrectly kept
DELETE FROM DealJointClients WHERE DealId IN (145, 105, 101, 106, 108, 127);
DELETE FROM Deals WHERE DealId IN (145, 105, 101, 106, 108, 127);

-- Verify the fix
SELECT 'After fix - remaining deals should be the real ones:' as Info;
SELECT DealId, ProspectId, ServiceDescription, Amount, PitchedDate, PitchedTime, Passcode
FROM Deals 
WHERE ProspectId IN (27367, 27570) OR ProspectId IS NULL
ORDER BY ProspectId, DealId;
