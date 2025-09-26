# Helix Hub - Redundant File Cleanup Script
# This script removes temporary, backup, and clearly unused files from the workspace

Write-Host "🧹 Starting Helix Hub redundant file cleanup..." -ForegroundColor Green
Write-Host ""

# Define file categories for cleanup
$tempFiles = @(
    "temp_old_home.tsx",
    "temp_old_weeklyview.tsx",
    "prev_FlatMatterOpening_69eec58.tsx",
    "team.tmp.json",
    "xxxxx.json",
    "xxxx.json",
    "func_7072.log",
    "patch.diff",
    "ideas.txt",
    "diff_tmp.txt",
    "diff_email.txt",
    "diff_editor.txt"
)

$backupFiles = @(
    "src\tabs\instructions\InstructionCard.tsx.backup",
    "src\tabs\instructions\InstructionCard.backup.tsx",
    "src\tabs\instructions\DealCard.tsx.backup",
    "src\tabs\enquiries\pitch-builder\EditorAndTemplateBlocks.tsx.backup",
    "src\tabs\enquiries\pitch-builder\EditorAndTemplateBlocks_backup.tsx"
    # NOTE: Excluding instruct-pitch sub-module files per user request
)

$buildArtifacts = @(
    "__azurite_db_blob__.json",
    "__azurite_db_blob_extent__.json",
    "__azurite_db_queue__.json",
    "__azurite_db_queue_extent__.json",
    "__azurite_db_table__.json",
    "api\tsconfig.tsbuildinfo"
)

# Function to safely remove files with logging
function Remove-FilesSafely {
    param(
        [string[]]$FileList,
        [string]$Category
    )
    
    Write-Host "📁 Cleaning $Category..." -ForegroundColor Yellow
    $removed = 0
    $notFound = 0
    
    foreach ($file in $FileList) {
        $fullPath = Join-Path $PWD $file
        if (Test-Path $fullPath) {
            try {
                Remove-Item $fullPath -Force
                Write-Host "  ✅ Removed: $file" -ForegroundColor Green
                $removed++
            }
            catch {
                Write-Host "  ❌ Failed to remove: $file - $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        else {
            Write-Host "  ⚠️  Not found: $file" -ForegroundColor Gray
            $notFound++
        }
    }
    
    Write-Host "  Summary - $Category : $removed removed, $notFound not found" -ForegroundColor Cyan
    Write-Host ""
}

# Function to remove directories safely
function Remove-DirectoriesSafely {
    param(
        [string[]]$DirectoryList,
        [string]$Category
    )
    
    Write-Host "📂 Cleaning $Category directories..." -ForegroundColor Yellow
    $removed = 0
    $notFound = 0
    
    foreach ($dir in $DirectoryList) {
        $fullPath = Join-Path $PWD $dir
        if (Test-Path $fullPath -PathType Container) {
            try {
                Remove-Item $fullPath -Recurse -Force
                Write-Host "  ✅ Removed directory: $dir" -ForegroundColor Green
                $removed++
            }
            catch {
                Write-Host "  ❌ Failed to remove directory: $dir - $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        else {
            Write-Host "  ⚠️  Directory not found: $dir" -ForegroundColor Gray
            $notFound++
        }
    }
    
    Write-Host "  Summary - $Category directories: $removed removed, $notFound not found" -ForegroundColor Cyan
    Write-Host ""
}

# Start cleanup process
Write-Host "🎯 Target workspace: $PWD" -ForegroundColor Magenta
Write-Host ""

# Clean temp files
Remove-FilesSafely -FileList $tempFiles -Category "Temporary Files"

# Clean backup files
Remove-FilesSafely -FileList $backupFiles -Category "Backup Files"

# Clean build artifacts
Remove-FilesSafely -FileList $buildArtifacts -Category "Build Artifacts"

# Clean build artifact directories (these regenerate automatically)
$buildDirectories = @(
    "__blobstorage__",
    "__queuestorage__"
)

Remove-DirectoriesSafely -DirectoryList $buildDirectories -Category "Build Artifact"

Write-Host "✨ Cleanup completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Cyan
Write-Host "• Removed temporary files that were cluttering the workspace" -ForegroundColor White
Write-Host "• Removed backup files that are no longer needed" -ForegroundColor White
Write-Host "• Removed build artifacts that regenerate automatically" -ForegroundColor White
Write-Host "• EXCLUDED: instruct-pitch sub-module (preserved per user request)" -ForegroundColor White
Write-Host ""
Write-Host "🔄 Next steps:" -ForegroundColor Yellow
Write-Host "• Run 'npm run build' to verify everything still works" -ForegroundColor White
Write-Host "• Consider running file usage analysis for deeper cleanup" -ForegroundColor White
Write-Host ""