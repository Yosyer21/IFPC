$ErrorActionPreference = 'Continue'
$base = 'http://localhost:3000'
cd C:\Users\ruis\Documents\proyect2
Remove-Item p.txt -Force -ErrorAction SilentlyContinue

$lines = @()
$j = curl.exe -s -c p.txt "$base/api/auth/csrf"
$csrf = ($j | ConvertFrom-Json).csrfToken
curl.exe -s -o NUL -b p.txt -c p.txt -X POST "$base/api/auth/callback/credentials" --data-urlencode "csrfToken=$csrf" --data-urlencode "email=player@demo.com" --data-urlencode "password=player123" --data-urlencode "callbackUrl=$base/dashboard"

curl.exe -s -b p.txt "$base/dashboard/player" -o dash.html
$hasRadar = Select-String -Path dash.html -Pattern 'fb-poly' -Quiet
$hasRing = Select-String -Path dash.html -Pattern 'fb-ring' -Quiet
$hasStat = Select-String -Path dash.html -Pattern 'Vídeos' -Quiet
$hasActivity = Select-String -Path dash.html -Pattern 'Actividad reciente' -Quiet

curl.exe -s -b p.txt "$base/dashboard/player/development/progress" -o prog.html
$hasLine = Select-String -Path prog.html -Pattern 'fb-line' -Quiet
$hasBars = Select-String -Path prog.html -Pattern 'fb-bar' -Quiet
$hasRadar2 = Select-String -Path prog.html -Pattern 'fb-poly' -Quiet
$hasRing2 = Select-String -Path prog.html -Pattern 'fb-ring' -Quiet

curl.exe -s -b p.txt "$base/dashboard/player/profile" -o prof.html
$hasProfileRing = Select-String -Path prof.html -Pattern 'fb-ring' -Quiet
$hasSubLinks = Select-String -Path prof.html -Pattern 'Mi ficha' -Quiet

$lines += "dash: radar=$hasRadar ring=$hasRing stat=$hasStat actividad=$hasActivity"
$lines += "progress: linea=$hasLine barras=$hasBars radar=$hasRadar2 ring=$hasRing2"
$lines += "profile: ring=$hasProfileRing fichas=$hasSubLinks"
$lines | Out-File -FilePath 'verify2.txt' -Encoding utf8
Remove-Item p.txt, dash.html, prog.html, prof.html -Force -ErrorAction SilentlyContinue
