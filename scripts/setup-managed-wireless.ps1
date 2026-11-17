#requires -Version 5.1
[CmdletBinding()]
param(
    [string]$AdbPath = "$env:LOCALAPPDATA/Android/sdk/platform-tools/adb.exe",
    [string]$PairingEndpoint,
    [string]$ConnectionEndpoint,
    [switch]$SkipPairing,
    [string]$ApkPath,
    [ValidatePattern('^$|^[A-Fa-f0-9]{64}$')]
    [string]$ExpectedSha256,
    [switch]$Enroll
)

$ErrorActionPreference = 'Stop'
$setup = Join-Path $PSScriptRoot 'setup-managed-usb.ps1'
if (-not (Test-Path -LiteralPath $AdbPath -PathType Leaf)) { throw 'ADB was not found. Install Android SDK Platform-Tools and supply -AdbPath with its adb.exe path.' }
if (-not (Test-Path -LiteralPath $setup -PathType Leaf)) { throw 'Keep setup-managed-usb.ps1 in the same folder as this wireless setup script.' }

function Read-Endpoint {
    param([string]$Value, [string]$Label)
    if (-not $Value) { $Value = Read-Host $Label }
    if ($Value -notmatch '^(?<address>(?:[0-9]{1,3}\.){3}[0-9]{1,3}|\[[0-9a-fA-F:.%]+\]):(?<port>[1-9][0-9]{0,4})$') {
        throw 'Use the phone IP address and port shown in Wireless debugging, for example 192.168.1.20:37123. Hostnames, URLs and commands are not accepted.'
    }
    $address = $null
    if ([int]$Matches.port -gt 65535 -or -not [Net.IPAddress]::TryParse($Matches.address.Trim('[', ']'), [ref]$address)) { throw 'The phone IP address or port is invalid.' }
    return [pscustomobject]@{ Endpoint = $Value; Address = $address }
}

function Invoke-WirelessAdb {
    param([string[]]$Arguments, [string]$InputCode)
    $previousErrorAction = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        if ($InputCode) { $output = $InputCode | & $AdbPath @Arguments 2>&1 }
        else { $output = & $AdbPath @Arguments 2>&1 }
        $nativeExitCode = $LASTEXITCODE
    } finally { $ErrorActionPreference = $previousErrorAction }
    if ($nativeExitCode -ne 0) { throw 'Wireless ADB failed. Check the phone IP, current port, pairing code and Wi-Fi connection, then try again. No pairing code has been logged.' }
    return ($output -join "`n").Trim()
}

Write-Output 'Wireless managed setup: Android 11 or later, with phone and Windows computer on the same Wi-Fi.'
Write-Output 'On the phone, open Developer options > Wireless debugging. Keep the phone unlocked.'
$connection = Read-Endpoint $ConnectionEndpoint 'Connection IP:port from the main Wireless debugging screen'
if (-not $SkipPairing) {
    Write-Output 'Tap Pair device with pairing code. Its pairing port can differ from the connection port.'
    $pairing = Read-Endpoint $PairingEndpoint 'Pairing IP:port from the pairing-code dialog'
    if (-not $connection.Address.Equals($pairing.Address)) { throw 'Pairing and connection addresses must identify the same phone.' }
    $secret = Read-Host 'Six-digit pairing code (hidden)' -AsSecureString
    $pointer = [IntPtr]::Zero
    try {
        $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
        $code = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
        if ($code -notmatch '^[0-9]{6}$') { throw 'The wireless pairing code must contain six digits.' }
        $result = Invoke-WirelessAdb -Arguments @('pair', $pairing.Endpoint) -InputCode $code
        if ($result -notmatch '(?i)Successfully paired') { throw 'Android did not confirm pairing. Generate a new pairing code on the phone and try again.' }
    } finally {
        $code = $null
        $result = $null
        if ($pointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
        if ($secret) { $secret.Dispose() }
    }
}
$connected = Invoke-WirelessAdb -Arguments @('connect', $connection.Endpoint)
if ($connected -notmatch '(?i)(?:already )?connected to') { throw 'The phone did not connect. Use the connection port from the main Wireless debugging screen, not its pairing port.' }
$api = Invoke-WirelessAdb -Arguments @('-s', $connection.Endpoint, 'shell', 'getprop', 'ro.build.version.sdk')
if ($api -notmatch '^[0-9]+$' -or [int]$api -lt 30) { throw 'Cable-free pairing requires Android 11 or later. Use USB setup for older supported phones.' }

Write-Output 'Wireless connection established. Checking Device Owner eligibility and the verified Companion APK.'
$options = @{ AdbPath = $AdbPath; Serial = $connection.Endpoint; Enroll = $Enroll }
if ($ApkPath) { $options.ApkPath = $ApkPath }
if ($ExpectedSha256) { $options.ExpectedSha256 = $ExpectedSha256 }
& $setup @options
Write-Output 'When setup is finished, turn Wireless debugging off and forget this computer on the phone if Android has not already disabled debugging.'
