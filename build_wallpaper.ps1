param(
    [Parameter(Mandatory)]
    [string]$SourceImage
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$output = Join-Path $PSScriptRoot 'theme/images/bliss.png'
$null = New-Item -ItemType Directory -Path (Split-Path -Parent $output) -Force
$photo = [Drawing.Image]::FromFile((Resolve-Path -LiteralPath $SourceImage).Path)
try {
    $width = 1920
    $height = [int][Math]::Round($photo.Height * $width / $photo.Width)
    $canvas = [Drawing.Bitmap]::new($width, $height, [Drawing.Imaging.PixelFormat]::Format24bppRgb)
    try {
        $graphics = [Drawing.Graphics]::FromImage($canvas)
        try {
            $graphics.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $graphics.DrawImage($photo, 0, 0, $width, $height)
        } finally {
            $graphics.Dispose()
        }
        $canvas.Save($output, [Drawing.Imaging.ImageFormat]::Png)
    } finally {
        $canvas.Dispose()
    }
} finally {
    $photo.Dispose()
}
