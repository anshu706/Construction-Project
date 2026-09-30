$base = "d:\0.PROJECTS\Construction-Project\brag-output\composition\assets"
$musicDir = Join-Path $base "music"
$casinoDir = Join-Path $base "sfx\casino"
$interfaceDir = Join-Path $base "sfx\interface"
$impactDir = Join-Path $base "sfx\impact"

New-Item -ItemType Directory -Force -Path $musicDir, $casinoDir, $interfaceDir, $impactDir | Out-Null

$skillAssets = "C:\Users\DELL\.gemini\config\skills\brag\assets"

Copy-Item "$skillAssets\music\happy-beats-business-moves-vol-1-by-ende-dot-app.mp3" "$musicDir\" -Force
Copy-Item "$skillAssets\sfx\casino\card-place-1.ogg" "$casinoDir\" -Force
Copy-Item "$skillAssets\sfx\casino\card-place-2.ogg" "$casinoDir\" -Force
Copy-Item "$skillAssets\sfx\casino\card-place-3.ogg" "$casinoDir\" -Force
Copy-Item "$skillAssets\sfx\interface\switch_001.ogg" "$interfaceDir\" -Force
Copy-Item "$skillAssets\sfx\interface\click_001.ogg" "$interfaceDir\" -Force
Copy-Item "$skillAssets\sfx\impact\impactPlate_light_000.ogg" "$impactDir\" -Force
Copy-Item "$skillAssets\sfx\impact\impactBell_heavy_000.ogg" "$impactDir\" -Force

Write-Host "Assets copied successfully!"
