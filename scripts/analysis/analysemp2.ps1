$git = git --no-pager diff -- docs/master-plan-planetls.md
$lines = $git.Split([Environment]::NewLine, [StringSplitOptions]::RemoveEmptyEntries)
$stats = @{ plusTables=0; plusNT=0; minusTables=0; minusNT=0; plusAll=@(); minusAll=@() }
foreach ($l in $lines) {
  if ($l.StartsWith('@@')) { continue }
  if ($l.StartsWith('+') -and !$l.StartsWith('+++') -and !$l.StartsWith('|+')) {
    if ($l.StartsWith('|')) { $stats.plusTables++ } else { $stats.plusNT++ }
    $stats.plusAll += $l.SubString(1)
  }
  if ($l.StartsWith('-') -and !$l.StartsWith('---') -and !$l.StartsWith('|-')) {
    if ($l.StartsWith('|')) { $stats.minusTables++ } else { $stats.minusNT++ }
    $stats.minusAll += $l.SubString(1)
  }
}
$stats | ConvertTo-Json -Compress | Out-File -FilePath 'C:\Users\ADMIN\Desktop\planetls-beta\scripts\analysis\mpstats2.json' -Encoding UTF8
$stats.plusAll | Select-Object -Skip 58 | Out-File -FilePath 'C:\Users\ADMIN\Desktop\planetls-beta\scripts\analysis\additions_after_sec006.txt' -Encoding UTF8
$stats.minusAll | Out-File -FilePath 'C:\Users\ADMIN\Desktop\planetls-beta\scripts\analysis\removals_all.txt' -Encoding UTF8
"`nDONE" >> 'C:\Users\ADMIN\Desktop\planetls-beta\scripts\analysis\done.log'
