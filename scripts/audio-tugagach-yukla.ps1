# Bepul audio yaratish (kokoro-build) tugashini kutadi, so'ng hammasini saytga yuklaydi.
# Har 20 daqiqada ham tayyor bo'lganlarini yuklab turadi — shunda yaqin kunlar darhol ishlaydi.
$ErrorActionPreference = "Continue"
$env:Path = "C:\Program Files\nodejs;$env:Path"
Set-Location "C:\Users\user\OneDrive\Desktop\Odev"

function Yukla {
  node --env-file=.env.local scripts/load-lessons.mjs materiallar/beginner Beginner --refresh
}

while ($true) {
  $ishlayapti = Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
    Where-Object { $_.CommandLine -like "*kokoro-build.mjs*" }
  Yukla
  if (-not $ishlayapti) { break }
  Start-Sleep -Seconds 1200
}
"Audio yuklash tugadi: $(Get-Date)"
