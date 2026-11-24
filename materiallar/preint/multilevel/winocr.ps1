# Windows'ning o'zidagi OCR (internetsiz): papkadagi pNNN.jpg rasmlarni pNNN.txt matnga aylantiradi.
#   powershell -File winocr.ps1 <rasmlar papkasi> <natija papkasi>
# Har bir qator koordinatasi bilan yoziladi (mashq sarlavhalarini topish va qirqish uchun).
param([string]$ImgDir, [string]$OutDir)

Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime]
$null = [Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]
$null = [Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType = WindowsRuntime]
$null = [Windows.Globalization.Language, Windows.Globalization, ContentType = WindowsRuntime]

$asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
})[0]
function Wait-Op($op, [Type]$type) {
    $task = $asTask.MakeGenericMethod($type).Invoke($null, @($op))
    $task.Wait() | Out-Null
    $task.Result
}

$lang = New-Object Windows.Globalization.Language 'en-US'
$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage($lang)
if (-not $engine) { throw "OCR engine yaratilmadi" }
New-Item -ItemType Directory -Force $OutDir | Out-Null

Get-ChildItem -Path $ImgDir -Filter 'p*.jpg' | Sort-Object Name | ForEach-Object {
    $out = Join-Path $OutDir ($_.BaseName + '.txt')
    if (Test-Path $out) { return }
    $file = Wait-Op ([Windows.Storage.StorageFile]::GetFileFromPathAsync($_.FullName)) ([Windows.Storage.StorageFile])
    $stream = Wait-Op ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
    $decoder = Wait-Op ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
    $bitmap = Wait-Op ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
    $result = Wait-Op ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])

    $sb = New-Object System.Text.StringBuilder
    $prevBottom = -1
    foreach ($line in $result.Lines) {
        $rects = $line.Words | ForEach-Object { $_.BoundingRect }
        $top = ($rects | Measure-Object -Property Y -Minimum).Minimum
        $h = ($rects | Measure-Object -Property Height -Maximum).Maximum
        $left = ($rects | Measure-Object -Property X -Minimum).Minimum
        # Har bir qator: yuqori(y)<TAB>balandlik<TAB>chap(x)<TAB>matn — mashqlarni qirqish uchun.
        [void]$sb.AppendLine(('{0}`t{1}`t{2}`t{3}' -f [int]$top, [int]$h, [int]$left, $line.Text))
        $prevBottom = $top + $h
    }
    [System.IO.File]::WriteAllText($out, $sb.ToString(), [System.Text.Encoding]::UTF8)
    $stream.Dispose()
}
Write-Output ('done: ' + (Get-ChildItem $OutDir -Filter '*.txt').Count)
