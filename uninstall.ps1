$ErrorActionPreference = "Stop"

$extensionName = "novaplayer.js"

if (-not (Get-Command spicetify -ErrorAction SilentlyContinue)) {
	throw "spicetify was not found in PATH"
}

$extensionRoot = (& spicetify path -e root | Select-Object -First 1).Trim()
if (-not $extensionRoot) {
	$extensionRoot = Join-Path $env:APPDATA "spicetify\Extensions"
}

$installedFile = Join-Path $extensionRoot $extensionName
if (Test-Path -LiteralPath $installedFile) {
	Remove-Item -LiteralPath $installedFile -Force
}

& spicetify config extensions "$extensionName-"
& spicetify apply

Write-Host "Removed $extensionName"
