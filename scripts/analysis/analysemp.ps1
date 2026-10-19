<# Analyse du diff MP en UTF-16LE #>
$path = 'C:\Users\ADMIN\AppData\Local\Temp\mpdiff2.txt'
$content = Get-Content $path -Raw
$iso = [Text.Encoding]::UTF8
$bytes = [Text.Encoding]::UTF16LE.GetBytes($content)
$text = [Text.Encoding]::UTF8.GetString($bytes)
$lines = $text.Split([Environment]::NewLine, [StringSplitOptions]::RemoveEmptyEntries)
$plusTables = 0; $plusNT = 0; $minusTables = 0; $minusNT = 0
$plusAll = @(); $minusAll = @()
foreach ($l in $lines) {
  if ($l.StartsWith('@@')) { continue }
  if ($l.StartsWith('+') -and !$l.StartsWith('+++') -and !$l.StartsWith('|+')) {
    if ($l.StartsWith('|')) { $plusTables++ } else { $plusNT++ }
    $plusAll += $l.SubString(1)
  }
  if ($l.StartsWith('-') -and !$l.StartsWith('---') -and !$l.StartsWith('|-')) {
    if ($l.StartsWith('|')) { $minusTables++ } else { $minusNT++ }
    $minusAll += $l.SubString(1)
  }
}
$out = @{}
$out.'plusTables' = $plusTables
$out.'plusNT' = $plusNT
$out.'minusTables' = $minusTables
$out.'minusNT' = $minusNT
$out.'plusCount' = $plusAll.Count
$out.'minusCount' = $minusAll.Count
$out | ConvertTo-Json -Compress > 'C:\Users\ADMIN\Desktop\planetls-beta\scripts\analysis\mpstats.json'
$plusAll | Select-Object -Skip 58 | Out-File -FilePath 'C:\Users\ADMIN\Desktop\planetls-beta\scripts\analysis\additions_after_sec006.txt' -Width 200
$minusAll | Out-File -FilePath 'C:\Users\ADMIN\Desktop\planetls-beta\scripts\analysis\removals_all.txt' -Width 200
"`nDONE" >> 'C:\Users\ADMIN\Desktop\planetls-beta\scripts\analysis\done.log'
