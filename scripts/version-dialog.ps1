# Script rapido para selecionar tipo de versao
param(
    [string]$GitDir = ".git"
)

$ErrorActionPreference = "SilentlyContinue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Converter para caminho absoluto
if (-not [System.IO.Path]::IsPathRooted($GitDir)) {
    $GitDir = Join-Path (Get-Location) $GitDir
}

# Ler versão atual do package.json
$packageJsonPath = Join-Path (Get-Location) "package.json"
$currentVersion = "1.1.15"
if (Test-Path $packageJsonPath) {
    $packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json -ErrorAction SilentlyContinue
    if ($packageJson.version) {
        $currentVersion = $packageJson.version
    }
}

# Calcular próximas versões
$versionParts = $currentVersion -split '\.'
$major = [int]$versionParts[0]
$minor = [int]$versionParts[1]
$patch = [int]$versionParts[2]

$hotfixVersion = "$major.$minor.$($patch + 1)"
$featureVersion = "$major.$($minor + 1).0"
$releaseVersion = "$($major + 1).0.0"

Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.Application]::EnableVisualStyles()

$form = New-Object System.Windows.Forms.Form
$form.Text = "Gerenciador de Versao"
$form.Width = 500
$form.Height = 320
$form.StartPosition = [System.Windows.Forms.FormStartPosition]::CenterScreen
$form.TopMost = $true
$form.ShowIcon = $false
$form.FormBorderStyle = [System.Windows.Forms.FormBorderStyle]::FixedDialog
$form.MaximizeBox = $false
$form.MinimizeBox = $false

$label = New-Object System.Windows.Forms.Label
$label.Text = "Qual tipo de alteracao?"
$label.Font = New-Object System.Drawing.Font("Segoe UI", 10)
$label.AutoSize = $true
$label.Location = New-Object System.Drawing.Point(20, 15)
$form.Controls.Add($label) | Out-Null

$groupBox = New-Object System.Windows.Forms.GroupBox
$groupBox.Text = "Selecione"
$groupBox.Location = New-Object System.Drawing.Point(15, 45)
$groupBox.Size = New-Object System.Drawing.Size(450, 155)
$groupBox.Font = New-Object System.Drawing.Font("Segoe UI", 9)

$radio1 = New-Object System.Windows.Forms.RadioButton
$radio1.Text = "hotfix  - patch ($currentVersion → $hotfixVersion)"
$radio1.Location = New-Object System.Drawing.Point(15, 25)
$radio1.AutoSize = $true
$radio1.Checked = $false
$groupBox.Controls.Add($radio1) | Out-Null

$radio2 = New-Object System.Windows.Forms.RadioButton
$radio2.Text = "feature - minor ($currentVersion → $featureVersion)"
$radio2.Location = New-Object System.Drawing.Point(15, 55)
$radio2.AutoSize = $true
$groupBox.Controls.Add($radio2) | Out-Null

$radio3 = New-Object System.Windows.Forms.RadioButton
$radio3.Text = "release - major ($currentVersion → $releaseVersion)"
$radio3.Location = New-Object System.Drawing.Point(15, 85)
$radio3.AutoSize = $true
$groupBox.Controls.Add($radio3) | Out-Null

$radio4 = New-Object System.Windows.Forms.RadioButton
$radio4.Text = "apenas enviar - sem alterar versão ($currentVersion)"
$radio4.Location = New-Object System.Drawing.Point(15, 115)
$radio4.AutoSize = $true
$radio4.Checked = $true
$groupBox.Controls.Add($radio4) | Out-Null

$form.Controls.Add($groupBox) | Out-Null

$okButton = New-Object System.Windows.Forms.Button
$okButton.Text = "OK"
$okButton.Location = New-Object System.Drawing.Point(150, 215)
$okButton.Size = New-Object System.Drawing.Size(90, 35)
$okButton.DialogResult = [System.Windows.Forms.DialogResult]::OK
$form.AcceptButton = $okButton
$form.Controls.Add($okButton) | Out-Null

$cancelButton = New-Object System.Windows.Forms.Button
$cancelButton.Text = "Cancelar"
$cancelButton.Location = New-Object System.Drawing.Point(260, 215)
$cancelButton.Size = New-Object System.Drawing.Size(90, 35)
$cancelButton.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
$form.CancelButton = $cancelButton
$form.Controls.Add($cancelButton) | Out-Null

$result = $form.ShowDialog()
$form.Dispose()

if ($result -ne [System.Windows.Forms.DialogResult]::OK) {
    exit 1
}

$option = "1"
if ($radio1.Checked) { $option = "1" }
elseif ($radio2.Checked) { $option = "2" }
elseif ($radio3.Checked) { $option = "3" }
else { $option = "4" }

# Escrever arquivo com caminho absoluto
$filePath = Join-Path $GitDir "GIT_VERSION_TYPE"

# Garantir que o diretório existe
if (-not (Test-Path $GitDir)) {
    exit 1
}

$utf8 = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($filePath, $option, $utf8)

# Pequeno delay para garantir que foi escrito
Start-Sleep -Milliseconds 100

# Verificar que o arquivo foi criado e tem conteúdo
if ((Test-Path $filePath) -and ((Get-Content $filePath | Measure-Object -Character).Characters -gt 0)) {
    exit 0
} else {
    exit 1
}