# PowerShell script to update the Mind Gems card in student dashboard

$filePath = "c:\projects\kids\catalyst\src\app\(dashboard)\student\page.tsx"
$content = Get-Content $filePath -Raw

# Update the className to add relative
$content = $content -replace 'onClick=\{\(\) => router\.push\(''/student/wallet''\)\}\s*>\s*<div className="text-center">', 'onClick={() => router.push(''/student/wallet'')}
          >
            <div className="text-center relative">'

# Add the hover badge before the closing </div> of the Mind Gems card
$pattern = '(<div className="text-xs text-pink-700 font-semibold uppercase tracking-wide">Mind Gems</div>)\s*(</div>\s*</FloatingCard>\s*<FloatingCard delay=\{0\.3\})'
$replacement = '$1
              <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                  <span>Open Wallet</span>
                  <ChevronRight className="h-3 w-3" />
                </div>
              </div>
            $2'

$content = $content -replace $pattern, $replacement

# Write back to file
Set-Content $filePath $content -NoNewline

Write-Host "Successfully updated the Mind Gems card with wallet link!" -ForegroundColor Green
