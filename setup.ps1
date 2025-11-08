# DAM React SDK - Automatic Setup Script
# Run this in PowerShell from D:\ecospace\DAM\sdks\react

Write-Host "🚀 DAM React SDK - Automatic Setup" -ForegroundColor Cyan
Write-Host "==================================`n" -ForegroundColor Cyan

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found!" -ForegroundColor Red
    Write-Host "Please run this script from D:\ecospace\DAM\sdks\react" -ForegroundColor Yellow
    exit 1
}

Write-Host "📦 Step 1: Installing dependencies..." -ForegroundColor Green
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Dependencies installed successfully!`n" -ForegroundColor Green

Write-Host "🔨 Step 2: Building SDK..." -ForegroundColor Green
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ SDK built successfully!`n" -ForegroundColor Green

Write-Host "📋 Step 3: Running linter..." -ForegroundColor Green
npm run lint -- --fix 2>&1 | Out-Null

Write-Host "`n✅ Linting complete!`n" -ForegroundColor Green

Write-Host "==================================`n" -ForegroundColor Cyan
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "`nYour React SDK is ready to use!`n" -ForegroundColor Cyan

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Create a test app:" -ForegroundColor White
Write-Host "   cd ..\.." -ForegroundColor Gray
Write-Host "   npx create-react-app react-test-app" -ForegroundColor Gray
Write-Host "   cd react-test-app" -ForegroundColor Gray
Write-Host "   npm install ..\sdks\react`n" -ForegroundColor Gray

Write-Host "2. Update your API configuration in src/App.js:" -ForegroundColor White
Write-Host "   apiUrl: 'http://localhost:5000'" -ForegroundColor Gray
Write-Host "   keyId: 'your-api-key-id'" -ForegroundColor Gray
Write-Host "   keySecret: 'your-api-key-secret'`n" -ForegroundColor Gray

Write-Host "3. Start the test app:" -ForegroundColor White
Write-Host "   npm start`n" -ForegroundColor Gray

Write-Host "📖 For more info, see REACT_SDK_SETUP_GUIDE.md" -ForegroundColor Cyan