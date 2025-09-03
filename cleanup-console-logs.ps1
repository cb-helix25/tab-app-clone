# PowerShell script to remove verbose debug console logs
$filePath = "src/index.tsx"
$content = Get-Content $filePath -Raw

# Remove specific debug console logs that flood the browser console
$debugPatterns = @(
    "console\.log\('🚀 FETCHENQUIRIES CALLED WITH:'\);",
    "console\.log\('   📧 email:', email\);",
    "console\.log\('   📅 dateFrom:', dateFrom\);",
    "console\.log\('   📅 dateTo:', dateTo\);",
    "console\.log\('   🏢 userAow:', userAow\);",
    "console\.log\('   👤 userInitials:', userInitials\);",
    "console\.log\('📦 Returning cached data:', cached\.length\);",
    "console\.log\('✅ Successfully fetched and filtered NEW enquiries data:', newEnquiries\.length\);",
    "console\.log\('📊 NEW ENQUIRIES SAMPLE:', newEnquiries\.slice\(0, 2\)\);",
    "console\.log\('📊 Raw LEGACY enquiries before filtering:', rawLegacyEnquiries\.length\);",
    "console\.log\('✅ Successfully fetched and filtered LEGACY enquiries data:', legacyEnquiries\.length\);",
    "console\.log\('🎯 FINAL ENQUIRIES SUMMARY:'\);",
    "console\.log\('   Total before AOW filtering:', enquiries\.length\);",
    "console\.log\('   Total after AOW filtering:', filteredEnquiries\.length\);",
    "console\.log\('   User AOW:', userAow\);",
    "console\.log\('   📊 FINAL ENQUIRIES SAMPLE:', filteredEnquiries\.slice\(0, 2\)\);",
    "console\.log\('🔍 Fetching ALL matters from:', getAllMattersUrl\.replace\(/code=\[\^\&\]\+/, 'code=\*\*\*'\)\);",
    "console\.log\('✅ Successfully fetched ALL matters, count:', allMatters\.length\);",
    "console\.log\('✅ VNet matters fetch successful:', \{[^}]+\}\);",
    "console\.log\('🔍 Fetching matters from all sources for:', fullName\);",
    "console\.log\('📊 Matter sources fetched \(post-separation\):', \{[^}]+\}\);",
    "console\.log\('✅ Normalized matters total:', normalizedMatters\.length\);",
    "console\.log\('✅ Enquiries refreshed successfully'\);",
    "console\.log\(`✅ Fetched \$\{enquiriesRes\.length\} enquiries for switched user`\);",
    "console\.log\('🔍 ATTEMPTING LOCAL DEV API CALLS\.\.\.'\);",
    "console\.log\('   📅 dateFrom:', dateFrom\);",
    "console\.log\('   📅 dateTo:', dateTo\);",
    "console\.log\('   👤 fullName:', fullName\);",
    "console\.log\('✅ Enquiries API call successful:', enquiriesRes\?\.length \|\| 0\);",
    "console\.log\('✅ Normalized matters fetch successful:', normalizedMatters\?\.length \|\| 0\);",
    "console\.log\('🚀 About to call fetchAllMatters\.\.\.'\);",
    "console\.log\('✅ ALL Matters API call successful:', allMattersRes\?\.length \|\| 0\);"
)

foreach ($pattern in $debugPatterns) {
    $content = $content -replace $pattern, ""
}

# Remove empty lines that result from log removal
$content = $content -replace "\n\s*\n\s*\n", "`n`n"

# Write the cleaned content back
Set-Content $filePath $content -NoNewline

Write-Host "Console log cleanup completed. Removed debug logs from $filePath"
