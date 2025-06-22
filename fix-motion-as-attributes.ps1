# Fix motion component as attributes
$componentsPath = "c:\Users\HOME\.trae\rules\components"

Get-ChildItem -Path $componentsPath -Recurse -Filter "*.tsx" | ForEach-Object {
    $filePath = $_.FullName
    $content = Get-Content $filePath -Raw

    # Remove as="div", as="span", as="button" attributes
    $newContent = $content -replace '\s*as="(div|span|button)"', ''

    if ($content -ne $newContent) {
        Set-Content -Path $filePath -Value $newContent -NoNewline
        Write-Host "Fixed: $filePath"
    }
}

Write-Host "Motion component as attributes cleanup completed."
