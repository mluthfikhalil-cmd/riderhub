Start-Sleep -Seconds 4
$r = Invoke-WebRequest -Uri 'https://riderhub-ten.vercel.app' -UseBasicParsing
$bundle = [regex]::Match($r.Content, 'index-[a-f0-9]+\.js').Value
Invoke-WebRequest -Uri "https://riderhub-ten.vercel.app/_expo/static/js/web/$bundle" -OutFile '.tmp_b.js' -UseBasicParsing
$content = Get-Content '.tmp_b.js' -Raw
$size = [math]::Round((Get-Item '.tmp_b.js').Length / 1MB, 2)
Write-Host "Live: $bundle ($size MB)"
Write-Host ("  Supabase URL: {0}" -f ($content -match 'wqnpyzjixjkjygeulfvo'))
Write-Host ("  Anon key:     {0}" -f ($content -match 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxbnB5emppeGpranlnZXVsZnZv'))
Write-Host ("  Configurator: {0}" -f ($content -match 'ConfiguratorScreen'))
Write-Host ("  THREE:        {0}" -f ($content -match 'THREE'))
Write-Host ("  ServiceTrack: {0}" -f ($content -match 'ServiceTrackerScreen'))
Write-Host ("  RideSummary:  {0}" -f ($content -match 'RideSummaryScreen'))
Write-Host ("  Shopee:       {0}" -f ($content -match 'buildShopeeUrl'))
Write-Host ("  PWA:          {0}" -f ($content -match 'initPWA'))
Write-Host ("  FeatureCard:  {0}" -f ($content -match 'compactCard|heroCard|standardCard'))
Remove-Item '.tmp_b.js' -Force

# Check PWA assets
$manifest = (Invoke-WebRequest -Uri 'https://riderhub-ten.vercel.app/manifest.json' -UseBasicParsing -Method Head).StatusCode
$sw = (Invoke-WebRequest -Uri 'https://riderhub-ten.vercel.app/sw.js' -UseBasicParsing -Method Head).StatusCode
Write-Host "`n  manifest.json: $manifest"
Write-Host "  sw.js:         $sw"
