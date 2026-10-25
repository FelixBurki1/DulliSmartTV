<#
.SYNOPSIS
    Baut, signiert, installiert und startet DulliSmartTV auf dem Samsung-TV.

.EXAMPLE
    .\tools\tv.ps1 -TvIp 192.168.178.50 -Profil DulliTV
    .\tools\tv.ps1 -Aktion paket -Profil DulliTV
    .\tools\tv.ps1 -Aktion start -TvIp 192.168.178.50

.NOTES
    Braucht Tizen Studio mit TV-Erweiterung und ein Samsung-Zertifikatsprofil,
    siehe docs\einrichtung.md.
#>
param(
    [ValidateSet('alles', 'paket', 'installieren', 'start', 'verbinden')]
    [string]$Aktion = 'alles',
    [string]$TvIp,
    [string]$Profil = 'DulliTV',
    [string]$TizenStudio = 'C:\tizen-studio'
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$app = Join-Path $root 'app'
$build = Join-Path $app '.buildResult'
$tizen = Join-Path $TizenStudio 'tools\ide\bin\tizen.bat'
$sdb = Join-Path $TizenStudio 'tools\sdb.exe'
$appId = 'DulliTV001.DulliSmartTV'
$wgtName = 'DulliSmartTV.wgt'

foreach ($tool in @($tizen, $sdb)) {
    if (-not (Test-Path $tool)) {
        throw "Nicht gefunden: $tool. Tizen Studio installiert? Sonst -TizenStudio <Pfad> angeben."
    }
}

function Need-Ip {
    if (-not $TvIp) { throw 'Bitte -TvIp <IP des Fernsehers> angeben.' }
}

function Verbinden {
    Need-Ip
    & $sdb connect "$($TvIp):26101"
    $devices = & $sdb devices
    $devices | Write-Host
    if (-not ($devices -match [regex]::Escape($TvIp))) {
        throw 'TV nicht verbunden. Ist der Entwicklermodus an und steht die IP dieses PCs darin?'
    }
}

function Paket {
    if (Test-Path $build) { Remove-Item -Recurse -Force $build }
    & $tizen build-web -- $app
    if ($LASTEXITCODE -ne 0) { throw 'build-web fehlgeschlagen' }
    & $tizen package -t wgt -s $Profil -- $build
    if ($LASTEXITCODE -ne 0) { throw "Signieren fehlgeschlagen. Gibt es das Zertifikatsprofil '$Profil'?" }
    $wgt = Join-Path $build $wgtName
    if (-not (Test-Path $wgt)) { throw "Paket nicht gefunden: $wgt" }
    Copy-Item $wgt (Join-Path $root $wgtName) -Force
    Write-Host "Paket: $(Join-Path $root $wgtName)"
}

function Installieren {
    Need-Ip
    & $tizen install -n $wgtName -s "$($TvIp):26101" -- $root
    if ($LASTEXITCODE -ne 0) { throw 'Installation fehlgeschlagen' }
}

function Starten {
    Need-Ip
    & $tizen run -p $appId -s "$($TvIp):26101"
}

switch ($Aktion) {
    'verbinden'    { Verbinden }
    'paket'        { Paket }
    'installieren' { Verbinden; Installieren }
    'start'        { Verbinden; Starten }
    'alles'        { Verbinden; Paket; Installieren; Starten }
}
