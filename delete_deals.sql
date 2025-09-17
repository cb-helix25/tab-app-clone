-- Delete specific deals by 5-digit suffix
-- Safety: run the SELECT first to preview affected rows, then run DELETE.
-- Wrap in an explicit transaction for easy rollback if needed.

BEGIN TRAN;

-- Preview
SELECT DealId
FROM Deals
WHERE RIGHT(DealId, 5) IN (
    '67777','67386','63218','43108','40631','71481','80043','24349','44236','25458','84837','38763','18162','43618','75673','30021','68793','85653','30545','16895','98376','71967'
);

-- Delete
DELETE FROM Deals
WHERE RIGHT(DealId, 5) IN (
    '67777','67386','63218','43108','40631','71481','80043','24349','44236','25458','84837','38763','18162','43618','75673','30021','68793','85653','30545','16895','98376','71967'
);

COMMIT;

-- If anything looks wrong after the SELECT, run ROLLBACK instead of COMMIT.