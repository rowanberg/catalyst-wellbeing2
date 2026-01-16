$files = @(
    "src\app\api\webhooks\[id]\test\route.ts",
    "src\app\api\webhooks\[id]\deliveries\route.ts",
    "src\app\api\v1\timetable\student\[id]\route.ts",
    "src\app\api\v1\schools\[id]\route.ts",
    "src\app\api\v1\students\[id]\route.ts",
    "src\app\api\v1\students\[id]\marks\route.ts",
    "src\app\api\v1\messages\[id]\status\route.ts",
    "src\app\api\v1\classes\[id]\route.ts",
    "src\app\api\v1\attendance\student\[id]\route.ts",
    "src\app\api\applications\[id]\webhooks\route.ts",
    "src\app\api\applications\[id]\submit\route.ts",
    "src\app\api\applications\[id]\credentials\route.ts"
)

$updated = 0

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Updating: $file" -ForegroundColor Cyan
        $content = Get-Content $file -Raw
        
        # Fix params type
        $content = $content -replace 'params \}: \{ params: \{ id: string \}', 'params }: { params: Promise<{ id: string }>'
        
        # Fix params usage  
        $content = $content -replace 'const \{ id \} = params', 'const { id } = await params'
        
        Set-Content $file $content -NoNewline
        $updated++
        Write-Host "  Updated" -ForegroundColor Green
    }
}

Write-Host "`nUpdated $updated files" -ForegroundColor Green
