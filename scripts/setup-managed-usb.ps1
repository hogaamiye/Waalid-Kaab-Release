#requires -Version 5.1
[CmdletBinding()]
param(
    [string]$Serial,
    [string]$AdbPath = "$env:LOCALAPPDATA/Android/sdk/platform-tools/adb.exe",
    [string]$ApkPath,
    [ValidatePattern('^$|^[A-Fa-f0-9]{64}$')]
    [string]$ExpectedSha256,
    [switch]$Enroll
)

$ErrorActionPreference = 'Stop'
$package = 'com.nidaam.family.child_app'
$component = "$package/com.nidaam.child_control.FamilyAdminReceiver"
if (-not (Test-Path -LiteralPath $AdbPath -PathType Leaf)) { throw 'ADB was not found. Supply -AdbPath with the Android SDK platform-tools adb.exe path.' }
if ($ExpectedSha256 -and -not $ApkPath) { throw 'Use -ExpectedSha256 together with -ApkPath for a local APK.' }
$temporaryDirectory = $null

try {

    $previousErrorAction = $ErrorActionPreference
    try {
        # Windows PowerShell 5.1 treats normal native stderr as PowerShell errors.
        $ErrorActionPreference = 'Continue'
        $inventory = & $AdbPath devices -l 2>&1
        $inventoryExitCode = $LASTEXITCODE
    } finally { $ErrorActionPreference = $previousErrorAction }
    if ($inventoryExitCode -ne 0) { throw 'ADB could not list connected phones.' }
    $devices = @($inventory | ForEach-Object {
        if ("$_" -match '^(\S+)\s+(device|unauthorized|offline)(?:\s|$)') {
            [pscustomobject]@{ Serial = $Matches[1]; State = $Matches[2] }
        }
    })
    if ($Serial) { $devices = @($devices | Where-Object { $_.Serial -eq $Serial }) }
    if ($devices.Count -eq 0) { throw 'No matching phone is connected. Connect a USB data cable, unlock the phone, and enable USB debugging.' }
    if ($devices.Count -ne 1) { throw 'More than one device is connected. Supply -Serial to select the child phone explicitly.' }
    if ($devices[0].State -ne 'device') { throw 'The phone is offline or has not authorized this computer. Approve its USB debugging prompt first.' }
    $deviceSerial = $devices[0].Serial

    function Invoke-PhoneAdb {
        param([Parameter(Mandatory)][string[]]$Arguments)
        $previousNativeErrorAction = $ErrorActionPreference
        try {
            $ErrorActionPreference = 'Continue'
            $output = & $AdbPath -s $deviceSerial @Arguments 2>&1
            $nativeExitCode = $LASTEXITCODE
        } finally { $ErrorActionPreference = $previousNativeErrorAction }
        if ($nativeExitCode -ne 0) {
            if ($Arguments -contains 'account') { throw 'Android account inspection failed. No account details have been printed.' }
            throw "ADB command failed: $($Arguments -join ' '). $($output -join ' ')"
        }
        return ($output -join "`n").Trim()
    }

    $model = Invoke-PhoneAdb -Arguments @('shell', 'getprop', 'ro.product.model')
    $emulator = Invoke-PhoneAdb -Arguments @('shell', 'getprop', 'ro.kernel.qemu')
    if ($emulator -eq '1') { throw 'This procedure targets the physical child phone; an emulator was selected. Connect the phone and supply -Serial.' }
    $api = Invoke-PhoneAdb -Arguments @('shell', 'getprop', 'ro.build.version.sdk')
    if ($api -notmatch '^\d+$' -or [int]$api -lt 26) { throw 'This companion requires Android 8 or later.' }
    $primaryUser = Invoke-PhoneAdb -Arguments @('shell', 'am', 'get-current-user')
    if ($primaryUser -ne '0') { throw 'Switch to the phone primary user before setting up whole-device management.' }
    $policyState = Invoke-PhoneAdb -Arguments @('shell', 'dumpsys', 'device_policy')
    if ([string]::IsNullOrWhiteSpace($policyState)) { throw 'Android management state could not be read. Stop and inspect the phone manually.' }
    $ownerSection = [regex]::Match($policyState, '(?is)Device\s+Owner(?:\s*\([^)]*\))?:\s*(.{0,1800})')
    $alreadyManaged = $false
    if ($ownerSection.Success) {
        $ownerComponent = [regex]::Match($ownerSection.Groups[1].Value, 'ComponentInfo\{([^}]+)\}')
        if (-not $ownerComponent.Success) { throw 'Android reports a device owner whose identity could not be read. No changes will be made.' }
        if ($ownerComponent.Groups[1].Value -ne $component) { throw 'Another device owner already manages this phone. This script does not remove or replace it.' }
        $alreadyManaged = $true
    }
    if (-not $alreadyManaged) {
        if ($policyState -match '(?im)^\s*Profile\s+Owner\b') { throw 'A managed profile already exists. Resolve enrollment with its administrator before continuing.' }
        $users = Invoke-PhoneAdb -Arguments @('shell', 'pm', 'list', 'users')
        if ([regex]::Matches($users, 'UserInfo\{').Count -ne 1) { throw 'The phone does not have exactly one Android user. Review its users/profiles manually; this script does not delete them.' }
        # Account details stay in memory and are never printed or written to disk.
        $accounts = Invoke-PhoneAdb -Arguments @('shell', 'dumpsys', 'account')
        $accountCounts = [regex]::Matches($accounts, '(?im)^\s*Accounts:\s*(\d+)\s*$')
        if ($accountCounts.Count -eq 0) { throw 'The account inventory could not be interpreted safely. No setup changes will be made.' }
        if (@($accountCounts | Where-Object { [int]$_.Groups[1].Value -gt 0 }).Count -gt 0) { throw 'Android accounts are present and can prevent Device Owner setup. Review them with the parent first; this script does not remove accounts or reset the phone.' }
        $accounts = $null
    }

    if ($ApkPath) {
        if (-not (Test-Path -LiteralPath $ApkPath -PathType Leaf)) { throw 'The managed companion APK was not found.' }
        $ApkPath = (Resolve-Path -LiteralPath $ApkPath).Path
        $expectedHash = if ($ExpectedSha256) { $ExpectedSha256 } else { 'F59A9B46D68B876ADAA64CC5E236ED728CA49175A978A4405A075366EC9898C0' }
    } else {
        [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
        $repository = 'hogaamiye/Waalid-Kaab-Release'
        $release = Invoke-RestMethod -Uri "https://api.github.com/repos/$repository/releases/latest" -Headers @{
            Accept = 'application/vnd.github+json'
            'X-GitHub-Api-Version' = '2022-11-28'
        } -TimeoutSec 30
        if ($release.draft -or $release.prerelease) { throw 'The latest public release is not a stable published release.' }
        $candidates = @($release.assets | Where-Object {
            $_.name -match '^waalid-kaab-companion-build-([1-9][0-9]{0,8})\.apk$' -and $_.state -eq 'uploaded'
        } | Sort-Object { [long]([regex]::Match($_.name, 'build-([0-9]+)').Groups[1].Value) } -Descending)
        if ($candidates.Count -eq 0) { throw 'The latest public release has no Companion APK.' }
        $asset = $candidates[0]
        if ($asset.digest -notmatch '^sha256:([a-f0-9]{64})$') { throw 'GitHub did not provide a SHA-256 for the latest Companion APK.' }
        $expectedHash = $Matches[1]
        if ($asset.size -le 0 -or $asset.size -gt 314572800) { throw 'The published APK size is invalid.' }
        $download = [Uri]$asset.browser_download_url
        if ($download.Scheme -ne 'https' -or $download.Host -ne 'github.com' -or $download.UserInfo -or
            -not $download.IsDefaultPort -or $download.Query -or $download.Fragment -or
            -not $download.AbsolutePath.StartsWith("/$repository/releases/download/", [StringComparison]::Ordinal) -or
            -not $download.AbsolutePath.EndsWith("/$($asset.name)", [StringComparison]::Ordinal)) {
            throw 'The published APK download address is invalid.'
        }
        $temporaryDirectory = Join-Path ([IO.Path]::GetTempPath()) ('WaalidKaab-' + [Guid]::NewGuid().ToString('N'))
        New-Item -ItemType Directory -Path $temporaryDirectory | Out-Null
        $ApkPath = Join-Path $temporaryDirectory $asset.name
        Write-Output "Downloading $($release.tag_name): $($asset.name)"
        $previousProgress = $ProgressPreference
        try {
            $ProgressPreference = 'SilentlyContinue'
            Invoke-WebRequest -UseBasicParsing -Uri $download.AbsoluteUri -OutFile $ApkPath -TimeoutSec 600
        } finally { $ProgressPreference = $previousProgress }
        if ((Get-Item -LiteralPath $ApkPath).Length -ne $asset.size) { throw 'The APK download size does not match the public release.' }
    }
    if ((Get-FileHash -LiteralPath $ApkPath -Algorithm SHA256).Hash -ne $expectedHash) {
        throw 'APK checksum mismatch. For a local APK, supply its verified public release digest using -ExpectedSha256.'
    }
    Write-Output "Phone: $model (Android API $api)"
    Write-Output "Companion already owns this device: $alreadyManaged"
    Write-Output 'APK identity and preliminary checks passed. Android may still reject Device Owner assignment.'
    if (-not $Enroll) {
        Write-Output 'Inspection only. To attempt USB enrollment, run this script again with -Enroll.'
        return
    }

    Write-Output 'APK SHA-256 verified.'
    $installation = Invoke-PhoneAdb -Arguments @('install', '-r', $ApkPath)
    if ($installation -notmatch '(?m)^Success\s*$') { throw 'Android did not confirm installation. Stop here; do not uninstall the current companion to resolve a signing conflict.' }
    if (-not $alreadyManaged) {
        $assignment = Invoke-PhoneAdb -Arguments @('shell', 'dpm', 'set-device-owner', $component)
        if ($assignment -notmatch '(?i)success') { throw 'Android did not confirm Device Owner assignment. Review the Android error; this script will not bypass eligibility checks.' }
    }
    Write-Output 'Managed companion installed. Android confirmed Device Owner assignment (or it was already assigned).'
    Write-Output 'Open Companion on the phone. Managed protection disables USB debugging, so ADB may disconnect automatically.'
    Write-Output 'Finish pairing and parent PIN setup, then open Parent settings > Check uninstall protection and confirm the actual Android checks.'
    Write-Output 'No accounts were removed and no factory reset was requested.'
} finally {
    if ($temporaryDirectory -and (Test-Path -LiteralPath $temporaryDirectory)) {
        $temporaryRoot = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
        $resolvedTemporary = (Resolve-Path -LiteralPath $temporaryDirectory).Path
        if (-not $resolvedTemporary.StartsWith($temporaryRoot, [StringComparison]::OrdinalIgnoreCase) -or
            (Split-Path -Leaf $resolvedTemporary) -notmatch '^WaalidKaab-[a-f0-9]{32}$') {
            throw 'The temporary download directory could not be verified for cleanup.'
        }
        Remove-Item -LiteralPath $resolvedTemporary -Recurse -Force
    }
}
