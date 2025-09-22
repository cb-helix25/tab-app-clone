# PowerShell script to delete test matters
# Replace the test data entries we identified

# List of test matter IDs to delete
$testMatterIds = @(
    "049f6a74-9c25-4c62-9684-bc2af8b5a58a",
    "09031ba4-648d-42ff-a313-9a8aba014292", 
    "0e116ea8-7260-4b03-8632-fb07265e60d6",
    "14453e48-ead7-45ce-b0ab-1113b2c033e4",
    "1c941861-3850-4c7b-a55d-4fb7424f113d",
    "27fe8ace-4355-41c7-9a4f-3e433c9bc806",
    "31a7c813-756f-4e00-8bae-961883d445a6",
    "3cee5d4d-43ff-4062-9fb9-3d4aa1707440",
    "403be7be-a67b-4917-918d-ac056e5a2b1a",
    "40d6adfd-7db6-49f6-8b5e-a6b320e81438",
    "4a6a50b2-4941-44ab-8763-c191872185ac",
    "50c02409-4de9-43e6-86d6-0c6f268ecdcd",
    "718a206e-751e-4893-8c94-d769fb439cd6",
    "891dc01f-8e1b-4afb-ae1b-3000ea1968a8",
    "919bc120-55b2-4b39-98ee-708b5c4f9bd6",
    "9a9566e0-338e-4c6a-9cad-43f9610d5767",
    "9d54e9ef-e027-4e6a-ae95-ca9b9af59405",
    "a0266f8a-58e5-4749-85d3-0a61b57a1dc4",
    "a8e41156-abd2-4e7f-9aac-6ebe3406ed13",
    "bae7a469-8cb9-4dba-b58c-116a15cfcb2e",
    "bf2117ea-93ce-4b22-ae97-d221dfab0610",
    "bfc046dc-5367-4da7-9ce6-6c6337266bef",
    "c0e9b4ac-3a13-4d88-9d01-7fe55742b538",
    "d525af13-a849-4c37-a6ef-81c2905aaf7e",
    "e110844d-8928-4127-bd2a-61f9e4e8039e",
    "e45cb4e6-8891-40ea-b990-994111ad325d",
    "e48712e2-5e67-4b4d-ab97-3545d17549e5",
    "e6b89080-5db5-4154-90d9-dd4a940de15a",
    "ff50eb8f-82d0-4d24-a304-37ce4f1b5211"
)

Write-Host "🗑️  Deleting $($testMatterIds.Count) test matters..." -ForegroundColor Yellow

# Option 1: If there's a delete API endpoint
function Delete-ViaAPI {
    $deletedCount = 0
    foreach ($matterId in $testMatterIds) {
        try {
            # Try DELETE method first
            $response = Invoke-WebRequest -Uri "http://localhost:3000/api/deleteMatters" -Method DELETE -ContentType "application/json" -Body (@{matterId = $matterId} | ConvertTo-Json) -ErrorAction Stop
            Write-Host "✅ Deleted matter: $matterId" -ForegroundColor Green
            $deletedCount++
        }
        catch {
            Write-Host "❌ Failed to delete matter $matterId : $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    Write-Host "🎉 Deleted $deletedCount out of $($testMatterIds.Count) test matters" -ForegroundColor Green
}

Write-Host "Option 1: Attempting to delete via API..." -ForegroundColor Cyan
Delete-ViaAPI