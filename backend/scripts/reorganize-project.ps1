# Project Reorganization Script
# This script reorganizes the project into frontend and backend folders

Write-Host "🔄 Starting Project Reorganization..." -ForegroundColor Cyan
Write-Host ""

$baseDir = Get-Location
Write-Host "Base Directory: $baseDir"

# Create additional directories
Write-Host "📁 Creating directory structure..." -ForegroundColor Yellow

$directories = @(
    "frontend\app\(auth)\sign-in",
    "frontend\app\(auth)\sign-up",
    "frontend\app\(protected)\admin",
    "frontend\app\(protected)\dice-demo",
    "frontend\components\ui",
    "frontend\hooks",
    "frontend\styles",
    "backend\api\auth",
    "backend\api\achievements",
    "backend\api\admin",
    "backend\api\main-api",
    "backend\lib",
    "backend\database\migrations",
    "backend\database\schemas",
    "backend\scripts\setup-scripts",
    "backend\scripts\check-scripts",
    "backend\scripts\fix-scripts",
    "backend\scripts\test-scripts",
    "config",
    "docs\guides",
    "docs\features"
)

foreach ($dir in $directories) {
    $fullPath = Join-Path $baseDir $dir
    if (-not (Test-Path $fullPath)) {
        New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
        Write-Host "  ✓ Created: $dir" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "📦 Copying Frontend Files..." -ForegroundColor Yellow

# Copy UI Components
if (Test-Path "components\ui") {
    Copy-Item -Path "components\ui\*" -Destination "frontend\components\ui\" -Recurse -Force
    Write-Host "  ✓ Copied: components/ui/" -ForegroundColor Green
}

# Copy Hooks
if (Test-Path "hooks") {
    Copy-Item -Path "hooks\*" -Destination "frontend\hooks\" -Recurse -Force
    Write-Host "  ✓ Copied: hooks/" -ForegroundColor Green
}

# Copy App Files
$appFiles = @("page.js", "layout.js", "globals.css")
foreach ($file in $appFiles) {
    $sourcePath = "app\$file"
    if (Test-Path $sourcePath) {
        Copy-Item -Path $sourcePath -Destination "frontend\app\$file" -Force
        Write-Host "  ✓ Copied: app/$file" -ForegroundColor Green
    }
}

# Copy App Directories
if (Test-Path "app\dice-demo") {
    Copy-Item -Path "app\dice-demo\*" -Destination "frontend\app\(protected)\dice-demo\" -Recurse -Force
    Write-Host "  ✓ Copied: app/dice-demo/" -ForegroundColor Green
}

if (Test-Path "app\sign-in") {
    Copy-Item -Path "app\sign-in\*" -Destination "frontend\app\(auth)\sign-in\" -Recurse -Force
    Write-Host "  ✓ Copied: app/sign-in/" -ForegroundColor Green
}

if (Test-Path "app\sign-up") {
    Copy-Item -Path "app\sign-up\*" -Destination "frontend\app\(auth)\sign-up\" -Recurse -Force
    Write-Host "  ✓ Copied: app/sign-up/" -ForegroundColor Green
}

if (Test-Path "app\admin") {
    Copy-Item -Path "app\admin\*" -Destination "frontend\app\(protected)\admin\" -Recurse -Force
    Write-Host "  ✓ Copied: app/admin/" -ForegroundColor Green
}

Write-Host ""
Write-Host "🔧 Copying Backend Files..." -ForegroundColor Yellow

# Copy API Routes
if (Test-Path "app\api\achievements\route.js") {
    Copy-Item -Path "app\api\achievements\route.js" -Destination "backend\api\achievements\route.js" -Force
    Write-Host "  ✓ Copied: API achievements route" -ForegroundColor Green
}

if (Test-Path "app\api\[[...path]]\route.js") {
    Copy-Item -Path "app\api\[[...path]]\route.js" -Destination "backend\api\main-api\route.js" -Force
    Write-Host "  ✓ Copied: API main route" -ForegroundColor Green
}

# Copy lib files
if (Test-Path "lib\utils.js") {
    Copy-Item -Path "lib\utils.js" -Destination "backend\lib\utils.js" -Force
    Write-Host "  ✓ Copied: lib/utils.js" -ForegroundColor Green
}

Write-Host ""
Write-Host "🗄️ Copying Database Files..." -ForegroundColor Yellow

# Copy SQL migration files
$sqlFiles = Get-ChildItem -Path $baseDir -Filter "*.sql" -File
$migrationCounter = 1
foreach ($file in $sqlFiles) {
    $newName = "{0:D3}-{1}" -f $migrationCounter, $file.Name
    Copy-Item -Path $file.FullName -Destination "backend\database\migrations\$newName" -Force
    Write-Host "  ✓ Copied: $($file.Name) → migrations/$newName" -ForegroundColor Green
    $migrationCounter++
}

Write-Host ""
Write-Host "📝 Copying Utility Scripts..." -ForegroundColor Yellow

# Setup Scripts
$setupScripts = @(
    "setup-database.js",
    "create-achievements-table.sql",
    "create-banned-users-table.js",
    "create-events-table.sql",
    "create-warnings-table.js",
    "setup-dice-feature.sql",
    "setup-event-photos-bucket.sql",
    "setup-leaderboard-columns.sql",
    "setup-storage-bucket.sql"
)

foreach ($script in $setupScripts) {
    if (Test-Path $script) {
        Copy-Item -Path $script -Destination "backend\scripts\setup-scripts\$script" -Force
        Write-Host "  ✓ Moved: $script" -ForegroundColor Green
    }
}

# Check Scripts
$checkScripts = Get-ChildItem -Path $baseDir -Filter "check-*.js" -File
foreach ($script in $checkScripts) {
    Copy-Item -Path $script.FullName -Destination "backend\scripts\check-scripts\$($script.Name)" -Force
    Write-Host "  ✓ Moved: $($script.Name)" -ForegroundColor Green
}

# Fix Scripts
$fixScripts = Get-ChildItem -Path $baseDir -Filter "fix-*.js" -File
foreach ($script in $fixScripts) {
    Copy-Item -Path $script.FullName -Destination "backend\scripts\fix-scripts\$($script.Name)" -Force
    Write-Host "  ✓ Moved: $($script.Name)" -ForegroundColor Green
}

# Test Scripts
$testScripts = Get-ChildItem -Path $baseDir -Filter "test-*.js" -File
foreach ($script in $testScripts) {
    Copy-Item -Path $script.FullName -Destination "backend\scripts\test-scripts\$($script.Name)" -Force
    Write-Host "  ✓ Moved: $($script.Name)" -ForegroundColor Green
}

# Other utility scripts
$utilityScripts = @("list-users.js", "make-friends.js")
foreach ($script in $utilityScripts) {
    if (Test-Path $script) {
        Copy-Item -Path $script -Destination "backend\scripts\$script" -Force
        Write-Host "  ✓ Moved: $script" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "📚 Organizing Documentation..." -ForegroundColor Yellow

# Move documentation files
$docFiles = Get-ChildItem -Path $baseDir -Filter "*.md" -File
foreach ($doc in $docFiles) {
    if ($doc.Name -match "(GUIDE|FEATURE|README|FIX|OPTIMIZATION)") {
        Copy-Item -Path $doc.FullName -Destination "docs\guides\$($doc.Name)" -Force
        Write-Host "  ✓ Moved: $($doc.Name)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "✅ Reorganization Complete!" -ForegroundColor Green
