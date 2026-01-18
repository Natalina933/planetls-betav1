# Script de correction automatique des imports SCSS - VERSION SIMPLIFIÉE
# Enregistrez ce fichier comme fix-imports.ps1 à la racine du projet

Write-Host "🔧 Correction des imports SCSS..." -ForegroundColor Cyan
Write-Host ""

$totalFiles = 0
$fixedFiles = 0

# Fonction pour corriger un fichier
function Repair-ScssImports {
    param([string]$FilePath)
    
    try {
        $content = Get-Content $FilePath -Raw -Encoding UTF8
        $originalContent = $content
        
        # Corrections simples
        $content = $content.Replace('@use "src/app/styles/abstracts/_mixins.scss"', '@use "app/styles/abstracts/mixins"')
        $content = $content.Replace('@use "src/app/styles/abstracts/_variables"', '@use "app/styles/abstracts/variables"')
        $content = $content.Replace('@use "@/app/styles/abstracts/variables"', '@use "app/styles/abstracts/variables"')
        $content = $content.Replace('@use "@/app/styles/abstracts/mixins"', '@use "app/styles/abstracts/mixins"')
        $content = $content.Replace('@use "./variables" as *', '@use "app/styles/abstracts/variables" as *')
        $content = $content.Replace('@use "./variables"', '@use "app/styles/abstracts/variables"')
        $content = $content.Replace('@use "./mixins" as *', '@use "app/styles/abstracts/mixins" as *')
        $content = $content.Replace('@use "./mixins"', '@use "app/styles/abstracts/mixins"')
        
        if ($content -ne $originalContent) {
            Set-Content -Path $FilePath -Value $content -Encoding UTF8 -NoNewline
            $relativePath = $FilePath.Replace((Get-Location).Path + "\", "")
            Write-Host "  ✓ $relativePath" -ForegroundColor Green
            return $true
        }
        return $false
    }
    catch {
        Write-Host "  ✗ Erreur: $($_.Name) - $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Trouver et corriger tous les fichiers SCSS
Write-Host "Recherche des fichiers SCSS..." -ForegroundColor Yellow
$scssFiles = Get-ChildItem -Path "src" -Filter "*.scss" -Recurse -File

Write-Host "Fichiers trouvés: $($scssFiles.Count)" -ForegroundColor Yellow
Write-Host ""

foreach ($file in $scssFiles) {
    $totalFiles++
    if (Repair-ScssImports -FilePath $file.FullName) {
        $fixedFiles++
    }
}

# Résumé
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 Résumé:" -ForegroundColor Cyan
Write-Host "  Total de fichiers analysés: $totalFiles" -ForegroundColor White
Write-Host "  Fichiers corrigés: $fixedFiles" -ForegroundColor Green
Write-Host "  Fichiers inchangés: $($totalFiles - $fixedFiles)" -ForegroundColor Gray
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Supprimer le cache
if (Test-Path ".next") {
    Write-Host "🗑️  Suppression du cache Next.js..." -ForegroundColor Yellow
    try {
        Remove-Item -Path ".next" -Recurse -Force -ErrorAction Stop
        Write-Host "  ✓ Cache supprimé avec succès" -ForegroundColor Green
    }
    catch {
        Write-Host "  ⚠️  Impossible de supprimer le cache" -ForegroundColor Red
        Write-Host "     Fermez votre serveur et réessayez" -ForegroundColor Yellow
    }
}
else {
    Write-Host "  ℹ️  Pas de cache à supprimer" -ForegroundColor Gray
}

Write-Host ""
Write-Host "✨ Terminé!" -ForegroundColor Green
Write-Host "Redémarrez votre serveur avec: npm run dev" -ForegroundColor Cyan
Write-Host ""