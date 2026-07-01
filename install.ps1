$ErrorActionPreference = "Stop"

$extensionName = "novaplayer.js"
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$source = Join-Path $projectRoot $extensionName

if (-not (Test-Path -LiteralPath $source)) {
	throw "Missing $extensionName in $projectRoot"
}

if (-not (Get-Command spicetify -ErrorAction SilentlyContinue)) {
	throw "spicetify was not found in PATH"
}

$extensionRoot = (& spicetify path -e root | Select-Object -First 1).Trim()
if (-not $extensionRoot) {
	$extensionRoot = Join-Path $env:APPDATA "spicetify\Extensions"
}

New-Item -ItemType Directory -Force -Path $extensionRoot | Out-Null
Copy-Item -LiteralPath $source -Destination (Join-Path $extensionRoot $extensionName) -Force

$configuredExtensions = (& spicetify config extensions 2>$null) -join " "
if ($configuredExtensions -notmatch [regex]::Escape($extensionName)) {
	& spicetify config extensions $extensionName
}

& spicetify apply

Write-Host "Installed $extensionName to $extensionRoot"
