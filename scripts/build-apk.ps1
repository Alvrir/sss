param(
    [string]$BuildDirectory,
    [string]$SdkDirectory = $env:ANDROID_HOME,
    [string]$JavaDirectory = $env:JAVA_HOME
)
$ErrorActionPreference = 'Stop'
$sourceDirectory = Split-Path $PSScriptRoot -Parent
if (!$SdkDirectory) { $SdkDirectory = Join-Path $env:LOCALAPPDATA 'Android\Sdk' }
if (!$JavaDirectory) { $JavaDirectory = Join-Path $env:ProgramFiles 'Android\Android Studio\jbr' }
if (!(Test-Path -LiteralPath (Join-Path $JavaDirectory 'bin\java.exe'))) { throw 'No se encontro Java. Indica -JavaDirectory con un JDK 17 o 21.' }
if (!(Test-Path -LiteralPath $SdkDirectory)) { throw 'No se encontro el SDK Android. Indica -SdkDirectory.' }

function Invoke-Checked([string]$Command, [string[]]$Arguments) {
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Command termino con codigo $LASTEXITCODE" }
}

$env:JAVA_HOME = $JavaDirectory
$env:ANDROID_HOME = $SdkDirectory
$env:ANDROID_SDK_ROOT = $SdkDirectory
$env:PATH = "$JavaDirectory\bin;$SdkDirectory\platform-tools;$env:PATH"
$env:NODE_ENV = 'production'
$workingDirectory = $sourceDirectory
if ($BuildDirectory) {
    $workingDirectory = [IO.Path]::GetFullPath($BuildDirectory)
    if ($workingDirectory -ne $sourceDirectory) {
        New-Item -ItemType Directory -Force -Path $workingDirectory | Out-Null
        & robocopy.exe $sourceDirectory $workingDirectory /E /XD node_modules android ios dist .git .expo /NFL /NDL /NJH /NJS /NP
        if ($LASTEXITCODE -ge 8) { throw 'No se pudo copiar el proyecto a la carpeta de compilacion.' }
    }
}
if ($workingDirectory -match '[^\x00-\x7F]') { throw 'Usa -BuildDirectory con una ruta sin tildes, por ejemplo D:\CodexBuilds\match-roulette.' }
Push-Location $workingDirectory
try {
    Invoke-Checked 'npm.cmd' @('ci', '--include=dev')
    Invoke-Checked 'npm.cmd' @('run', 'check')
    Invoke-Checked 'npx.cmd' @('expo', 'prebuild', '--platform', 'android', '--no-install')
    Push-Location android
    try { Invoke-Checked '.\gradlew.bat' @('assembleRelease', '--no-daemon', '--max-workers=2') }
    finally { Pop-Location }
    $outputDirectory = Join-Path $sourceDirectory 'dist'
    New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null
    Copy-Item -LiteralPath 'android\app\build\outputs\apk\release\app-release.apk' -Destination (Join-Path $outputDirectory 'match-roulette.apk')
    Write-Output "APK: $outputDirectory\match-roulette.apk"
} finally { Pop-Location }
