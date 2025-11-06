# Deploy both Edge Functions for homework helper
Write-Host "Deploying intelligent-ai-router..." -ForegroundColor Yellow
supabase functions deploy intelligent-ai-router

Write-Host "`nDeploying ai-homework-chat..." -ForegroundColor Yellow
supabase functions deploy ai-homework-chat

Write-Host "`nDeployment complete! Test at http://localhost:3000/student/homework" -ForegroundColor Green
