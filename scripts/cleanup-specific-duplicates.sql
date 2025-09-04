-- Cleanup script for specific duplicate deals identified in cc.json
-- This script removes the duplicate deals while keeping the ones with actual amounts (not placeholders)

-- First, let's see what we're about to delete and what we're keeping
SELECT 'Current deals analysis:' as Info;

-- Show all deals with their amounts to identify which ones to keep
SELECT DealId, ProspectId, ServiceDescription, Amount, PitchedDate, PitchedTime, Passcode
FROM Deals 
WHERE (ProspectId IS NULL OR ProspectId IN (27367, 27570))
  AND (ServiceDescription LIKE '%Placeholder%' OR ServiceDescription LIKE '%Automated capture%')
ORDER BY ProspectId, ServiceDescription, Amount DESC, DealId;

-- Show deals to be removed (keeping those with non-zero amounts when possible)
SELECT 'Deals to be removed:' as Info;
SELECT DealId, ProspectId, ServiceDescription, Amount, PitchedDate, PitchedTime, Passcode
FROM Deals 
WHERE DealId IN (
    -- For placeholder deals, prioritize keeping ones with actual amounts
    -- ProspectId null deals - need to check which ones have real amounts vs placeholders
    -- ProspectId 27367 deals - same logic
    -- Will need to update these IDs based on which ones have real amounts
    
    -- PLACEHOLDER: Update these lists after reviewing the amounts
    -- Remove placeholder/zero amount duplicates, keep the ones with real amounts
    114, 111, 104, 102, 109, 110, 107, 112, 113, 115, 116, 117, 118,
    135, 139, 121, 122, 140, 137, 138, 134, 126, 124, 120, 142, 143, 144, 132,
    148, 151, 152, 128, 129, 130
)
ORDER BY ProspectId, ServiceDescription, DealId;

-- Show what we should keep (deals with actual amounts, not placeholders)
SELECT 'Deals that should be kept (non-zero amounts or actual deals):' as Info;
WITH RankedDeals AS (
    SELECT DealId, ProspectId, ServiceDescription, Amount, PitchedDate, PitchedTime, Passcode,
           ROW_NUMBER() OVER (
               PARTITION BY ProspectId, ServiceDescription, PitchedDate 
               ORDER BY 
                   CASE WHEN Amount > 0 THEN 0 ELSE 1 END,  -- Prioritize non-zero amounts
                   CASE WHEN ServiceDescription NOT LIKE '%Placeholder%' AND ServiceDescription NOT LIKE '%Automated%' THEN 0 ELSE 1 END, -- Then non-placeholder descriptions
                   DealId DESC  -- Finally, most recent deal if amounts are equal
           ) as Priority
    FROM Deals 
    WHERE (ProspectId IS NULL OR ProspectId IN (27367, 27570))
      AND (ServiceDescription LIKE '%Placeholder%' OR ServiceDescription LIKE '%Automated capture%')
)
SELECT DealId, ProspectId, ServiceDescription, Amount, PitchedDate, PitchedTime, Passcode
FROM RankedDeals 
WHERE Priority = 1
ORDER BY ProspectId, ServiceDescription;

-- Uncomment the following lines to actually perform the cleanup:

/*
-- First, remove any DealJointClients records for deals we're about to delete
DELETE FROM DealJointClients 
WHERE DealId IN (
    114, 111, 104, 102, 109, 110, 107, 112, 113, 115, 116, 117, 118,
    135, 139, 121, 122, 140, 137, 138, 134, 126, 124, 120, 142, 143, 144, 132,
    148, 151, 152, 128, 129, 130
);

-- Then remove the duplicate deals
DELETE FROM Deals 
WHERE DealId IN (
    114, 111, 104, 102, 109, 110, 107, 112, 113, 115, 116, 117, 118,
    135, 139, 121, 122, 140, 137, 138, 134, 126, 124, 120, 142, 143, 144, 132,
    148, 151, 152, 128, 129, 130
);

-- Verify the cleanup
SELECT 'After cleanup - remaining deals:' as Info;
SELECT ProspectId, ServiceDescription, COUNT(*) as Count, STRING_AGG(CAST(DealId as VARCHAR), ', ') as DealIds
FROM Deals 
WHERE ProspectId IS NULL OR ProspectId IN (27367, 27570)
GROUP BY ProspectId, ServiceDescription
ORDER BY ProspectId, ServiceDescription;
*/
