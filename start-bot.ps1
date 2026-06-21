$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

if (Test-Path ".\config.env") {
    python .\bot.py
} else {
    Write-Host "Сначала создай config.env из config.env.example и вставь токен от BotFather."
    exit 1
}
