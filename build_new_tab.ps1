$ErrorActionPreference = 'Stop'
$dest = Join-Path $PSScriptRoot 'dist/new-tab'
$images = Join-Path $dest 'images'
$null = New-Item -ItemType Directory -Path $images -Force
$source = Join-Path $PSScriptRoot 'new-tab'
foreach ($name in @(
    'manifest.json', 'index.html', 'luna.css', 'new-tab.js', 'shortcuts.js',
    'google-search.js', 'google-search.css'
)) {
    Copy-Item -LiteralPath (Join-Path $source $name) -Destination $dest
}
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'theme/images/bliss.png') -Destination $images
Copy-Item -LiteralPath (Join-Path $source 'icons') -Destination $dest -Recurse -Force
Write-Output "Load unpacked from $dest"
