# Qolgan grammatika mavzularini yaratadi (tayyorlari o'tkazib yuboriladi) va saytga yuklaydi.
# Bir martalik vazifa sifatida ishga tushadi; qo'lda ham ishlatsa bo'ladi.
$ErrorActionPreference = "Continue"
$env:Path = "C:\Program Files\nodejs;$env:Path"
Set-Location "C:\Users\user\OneDrive\Desktop\Odev"
$log = "C:\Users\user\OneDrive\Desktop\Odev\materiallar\beginner\grammar\yakunlash.log"
"=== $(Get-Date) ===" | Out-File -Append -Encoding utf8 $log
$env:GEN_MODELS = "gemini-3-flash-preview,gemini-3.5-flash-lite"
foreach ($i in 1..2) {
  node --env-file=.env.local materiallar/beginner/grammar/gen-grammar.mjs 2>&1 | Out-File -Append -Encoding utf8 $log
}
node --env-file=.env.local scripts/load-practice.mjs 2>&1 | Out-File -Append -Encoding utf8 $log
"=== tugadi $(Get-Date) ===" | Out-File -Append -Encoding utf8 $log
