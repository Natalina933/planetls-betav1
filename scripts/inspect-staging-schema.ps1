# Read-only inspection of the explicitly identified staging; never use the linked project.
$ErrorActionPreference = 'Stop'
$stagingRef = 'rhvyvpuqnsgrgacbwwqf'
Add-Type @'
using System;
using System.Runtime.InteropServices;
public static class SupabaseCredential {
  [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]
  public struct Credential {
    public uint Flags; public uint Type; public string TargetName; public string Comment;
    public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
    public uint CredentialBlobSize; public IntPtr CredentialBlob; public uint Persist;
    public uint AttributeCount; public IntPtr Attributes; public string TargetAlias; public string UserName;
  }
  [DllImport("advapi32.dll", EntryPoint="CredReadW", CharSet=CharSet.Unicode, SetLastError=true)]
  public static extern bool Read(string target, uint type, uint flags, out IntPtr credential);
  [DllImport("advapi32.dll")] public static extern void CredFree(IntPtr credential);
}
'@
$pointer = [IntPtr]::Zero
if (-not [SupabaseCredential]::Read('Supabase CLI:supabase', 1, 0, [ref]$pointer)) { throw 'Connexion Supabase CLI absente.' }
try {
  $credential = [Runtime.InteropServices.Marshal]::PtrToStructure($pointer, [type][SupabaseCredential+Credential])
  $bytes = New-Object byte[] $credential.CredentialBlobSize
  [Runtime.InteropServices.Marshal]::Copy($credential.CredentialBlob, $bytes, 0, $bytes.Length)
  $accessToken = [Text.Encoding]::UTF8.GetString($bytes).Replace([string][char]0, '')
} finally { [SupabaseCredential]::CredFree($pointer) }
if ($accessToken -notmatch '^sbp_[A-Za-z0-9_]+$') { throw 'Format de connexion non reconnu ; aucune requête envoyée.' }
$headers = @{ Authorization = "Bearer $accessToken" }
$project = Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/$stagingRef" -Headers $headers -TimeoutSec 30
if ($project.id -ne $stagingRef -or $project.name -ne 'planetls-staging') { throw 'Identité staging non confirmée.' }
$query = @'
SELECT json_build_object(
  'tables', (SELECT coalesce(json_agg(t), '[]') FROM (
    SELECT c.relname AS name, c.relrowsecurity AS rls_enabled
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind='r' ORDER BY c.relname
  ) t),
  'policies', (SELECT coalesce(json_agg(p), '[]') FROM (
    SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
    FROM pg_policies WHERE schemaname IN ('public','storage') ORDER BY schemaname,tablename,policyname
  ) p),
  'profile_columns', (SELECT coalesce(json_agg(c), '[]') FROM (
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' ORDER BY ordinal_position
  ) c)
) AS inspection;
'@
$result = Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/$stagingRef/database/query/read-only" -Method Post -Headers $headers -ContentType 'application/json' -Body (@{ query=$query } | ConvertTo-Json) -TimeoutSec 60
$report = @{ date=[DateTime]::UtcNow.ToString('o'); project=$stagingRef; name=$project.name; mode='read-only'; result=$result }
$reportPath = Join-Path (Get-Location) 'test-results/staging-schema.json'
[IO.File]::WriteAllText($reportPath, ($report | ConvertTo-Json -Depth 30), (New-Object Text.UTF8Encoding($false)))
Write-Output "Staging confirmé ; inspection enregistrée dans test-results/staging-schema.json."
