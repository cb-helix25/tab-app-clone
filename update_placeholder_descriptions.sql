-- Option 1: Simple placeholder text
UPDATE Deals 
SET ServiceDescription = 'Skipped during creation - placeholder'
WHERE ServiceDescription IN (
    'Placeholder deal capture (phased out)',
    'Automated capture — appears turned off, processing continues under the hood'
);

-- Option 2: More descriptive placeholder
UPDATE Deals 
SET ServiceDescription = 'Service description not captured during initial creation'
WHERE ServiceDescription IN (
    'Placeholder deal capture (phased out)',
    'Automated capture — appears turned off, processing continues under the hood'
);

-- Option 3: System-generated placeholder
UPDATE Deals 
SET ServiceDescription = 'System placeholder - description pending'
WHERE ServiceDescription IN (
    'Placeholder deal capture (phased out)',
    'Automated capture — appears turned off, processing continues under the hood'
);

-- Option 4: Legacy system indicator
UPDATE Deals 
SET ServiceDescription = 'Legacy system entry - description unavailable'
WHERE ServiceDescription IN (
    'Placeholder deal capture (phased out)',
    'Automated capture — appears turned off, processing continues under the hood'
);

-- Option 5: To be updated placeholder
UPDATE Deals 
SET ServiceDescription = 'TBD - Service description to be updated'
WHERE ServiceDescription IN (
    'Placeholder deal capture (phased out)',
    'Automated capture — appears turned off, processing continues under the hood'
);

-- BONUS: Also update other generic placeholders
UPDATE Deals 
SET ServiceDescription = 'Service description not provided'
WHERE ServiceDescription IN (
    'not known',
    'n/a',
    'N/A',
    ''
);