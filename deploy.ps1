 # deploy.ps1 – автокоммит и автодеплой для CMS
 
 cd "C:\Users\79184.WIN-OOR1JAM5834\carshop-bot\CMS"
 
 # Добавляем все изменения
 git add .
 
 # Пытаемся сделать обычный коммит
 git commit -m "auto: обновление CMS и автодеплой" 2>$null
 if ($LASTEXITCODE -ne 0) {
     Write-Host "Нет изменений для основного коммита (nothing to commit)" -ForegroundColor Yellow
 } else {
     Write-Host "✅ Создан коммит: auto: обновление CMS и автодеплой" -ForegroundColor Green
     git push origin main
 }
 
# Пустой коммит для гарантированного триггера деплоя
git commit --allow-empty -m "deploy: auto-trigger" | Out-Null
git push origin main

Write-Host ""
Write-Host "Коммиты отправлены, деплой запущен!" -ForegroundColor Green
Write-Host "Статус деплоя: https://github.com/jfsagro-glitch/CMS/actions" -ForegroundColor Cyan

