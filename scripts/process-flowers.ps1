# Processes hibiscus JPEGs: removes light checkerboard background -> transparent PNG, autocrops.
# Writes results into client/public/assets/flowers/ and prints stats per image.
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$srcDir = "C:\Users\Roshan\AppData\Local\Temp\flowers-zip"
$outDir = "C:\Users\Roshan\Desktop\dateinvitation\client\public\assets\flowers"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$files = Get-ChildItem -Path $srcDir -Filter *.jpeg | Sort-Object Name
$index = 0
$results = @()

foreach ($f in $files) {
  $index++
  $bmp = [System.Drawing.Bitmap]::new($f.FullName)
  $w = $bmp.Width; $h = $bmp.Height

  # to 32bpp ARGB
  $argb = [System.Drawing.Bitmap]::new($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($argb)
  $g.DrawImage($bmp, 0, 0, $w, $h)
  $g.Dispose(); $bmp.Dispose()

  $rect = [System.Drawing.Rectangle]::new(0, 0, $w, $h)
  $data = $argb.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadWrite, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $bytes = [byte[]]::new($data.Stride * $h)
  [System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $bytes, 0, $bytes.Length)

  $bgFlags = [bool[]]::new($w * $h)
  $cleared = 0
  $opaqueRed = 0

  # pass 1: obvious background (light + low saturation)
  for ($y = 0; $y -lt $h; $y++) {
    $row = $y * $data.Stride
    for ($x = 0; $x -lt $w; $x++) {
      $i = $row + $x * 4
      $b = $bytes[$i]; $gg = $bytes[$i + 1]; $r = $bytes[$i + 2]
      $lum = ($r * 299 + $gg * 587 + $b * 114) / 1000
      $mx = [Math]::Max($r, [Math]::Max($gg, $b))
      $mn = [Math]::Min($r, [Math]::Min($gg, $b))
      if ($lum -ge 195 -and ($mx - $mn) -le 28) {
        $bytes[$i + 3] = 0
        $bgFlags[$y * $w + $x] = $true
        $cleared++
      }
    }
  }

  # pass 2/3: eat the halo around cleared pixels (dilation of the bg mask)
  for ($pass = 0; $pass -lt 2; $pass++) {
    $newClear = @()
    for ($y = 0; $y -lt $h; $y++) {
      $row = $y * $data.Stride
      for ($x = 0; $x -lt $w; $x++) {
        $p = $y * $w + $x
        if ($bgFlags[$p]) { continue }
        $i = $row + $x * 4
        if ($bytes[$i + 3] -eq 0) { continue }
        $b = $bytes[$i]; $gg = $bytes[$i + 1]; $r = $bytes[$i + 2]
        $lum = ($r * 299 + $gg * 587 + $b * 114) / 1000
        $mx = [Math]::Max($r, [Math]::Max($gg, $b))
        $mn = [Math]::Min($r, [Math]::Min($gg, $b))
        if ($lum -lt 160 -or ($mx - $mn) -gt 45) { continue }
        $near = $false
        if ($x -gt 0 -and $bgFlags[$p - 1]) { $near = $true }
        elseif ($x -lt $w - 1 -and $bgFlags[$p + 1]) { $near = $true }
        elseif ($y -gt 0 -and $bgFlags[$p - $w]) { $near = $true }
        elseif ($y -lt $h - 1 -and $bgFlags[$p + $w]) { $near = $true }
        if ($near) {
          $bytes[$i + 3] = 0
          $newClear += $p
          $cleared++
        }
      }
    }
    foreach ($p in $newClear) { $bgFlags[$p] = $true }
    if ($newClear.Count -eq 0) { break }
  }

  # stats: red coverage among remaining opaque pixels
  for ($y = 0; $y -lt $h; $y++) {
    $row = $y * $data.Stride
    for ($x = 0; $x -lt $w; $x++) {
      $i = $row + $x * 4
      if ($bytes[$i + 3] -eq 0) { continue }
      $b = $bytes[$i]; $gg = $bytes[$i + 1]; $r = $bytes[$i + 2]
      if ($r -gt 90 -and $r -gt $gg * 1.5 -and $r -gt $b * 1.5) { $opaqueRed++ }
    }
  }

  [System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $data.Scan0, $bytes.Length)
  $argb.UnlockBits($data)

  # autocrop to the opaque bounding box
  $minX = $w; $minY = $h; $maxX = -1; $maxY = -1
  for ($y = 0; $y -lt $h; $y++) {
    $row = $y * $data.Stride
    for ($x = 0; $x -lt $w; $x++) {
      if ($bytes[$row + $x * 4 + 3] -ne 0) {
        if ($x -lt $minX) { $minX = $x }
        if ($x -gt $maxX) { $maxX = $x }
        if ($y -lt $minY) { $minY = $y }
        if ($y -gt $maxY) { $maxY = $y }
      }
    }
  }

  $name = "cherry-red-hibiscus-$index.png"
  if ($maxX -ge 0) {
    $cropRect = [System.Drawing.Rectangle]::new($minX, $minY, $maxX - $minX + 1, $maxY - $minY + 1)
    $cropped = $argb.Clone($cropRect, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $cropped.Save("$outDir\$name", [System.Drawing.Imaging.ImageFormat]::Png)
    $cw = $cropped.Width; $ch = $cropped.Height
    $cropped.Dispose()
    $results += [pscustomobject]@{
      name = $f.Name; out = $name; src = "$($w)x$($h)"; cropped = "${cw}x${ch}"
      bgPct = [math]::Round(100 * $cleared / ($w * $h), 1)
      redPct = [math]::Round(100 * $opaqueRed / [Math]::Max(1, ($w * $h - $cleared)), 1)
    }
  } else {
    $results += [pscustomobject]@{ name = $f.Name; out = $name; src = "$($w)x$($h)"; cropped = "EMPTY"; bgPct = 0; redPct = 0 }
  }
  $argb.Dispose()
}

$results | Format-Table -AutoSize | Out-String -Width 200
