-- Delete specific deals by ID
DELETE FROM Deals 
WHERE DealId IN (
    'HLX-27570-65647',
    'HLX-27570-77657',
    'HLX-27570-75811'
);