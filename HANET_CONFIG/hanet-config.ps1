# HANET CONFIGURATION MANAGER
# Script PowerShell để quản lý cấu hình Hanet

param(
    [Parameter(Mandatory=$false)]
    [string]$Action = "help",
    
    [Parameter(Mandatory=$false)]
    [string]$ClientId = "",
    
    [Parameter(Mandatory=$false)]
    [string]$ClientSecret = "",
    
    [Parameter(Mandatory=$false)]
    [string]$AccessToken = "",
    
    [Parameter(Mandatory=$false)]
    [string]$WebhookUrl = "http://117.2.136.172:1888/hanet-webhook"
)

$ServerUrl = "http://localhost:1888"

function Show-Help {
    Write-Host "=== HANET CONFIGURATION MANAGER ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "Cách sử dụng:" -ForegroundColor Yellow
    Write-Host "  .\hanet-config.ps1 -Action <action> [options]" -ForegroundColor White
    Write-Host ""
    Write-Host "Các lệnh có sẵn:" -ForegroundColor Yellow
    Write-Host "  help     - Hiển thị hướng dẫn này" -ForegroundColor White
    Write-Host "  status   - Xem trạng thái cấu hình hiện tại" -ForegroundColor White
    Write-Host "  test     - Test kết nối với Hanet API" -ForegroundColor White
    Write-Host "  set      - Cập nhật cấu hình Hanet" -ForegroundColor White
    Write-Host "  clear    - Xóa tất cả cấu hình" -ForegroundColor White
    Write-Host "  edit     - Mở file cấu hình để chỉnh sửa" -ForegroundColor White
    Write-Host ""
    Write-Host "Ví dụ:" -ForegroundColor Yellow
    Write-Host "  .\hanet-config.ps1 -Action status" -ForegroundColor White
    Write-Host "  .\hanet-config.ps1 -Action set -ClientId 'abc123' -ClientSecret 'def456' -AccessToken 'ghi789'" -ForegroundColor White
    Write-Host "  .\hanet-config.ps1 -Action test" -ForegroundColor White
    Write-Host ""
}

function Get-HanetStatus {
    try {
        Write-Host "Đang kiểm tra trạng thái cấu hình Hanet..." -ForegroundColor Yellow
        $response = Invoke-RestMethod -Uri "$ServerUrl/hanet-config" -Method GET
        
        Write-Host "=== TRẠNG THÁI CẤU HÌNH HANET ===" -ForegroundColor Green
        Write-Host "Client ID: $($response.config.clientId)" -ForegroundColor White
        Write-Host "Client Secret: $($response.config.clientSecret)" -ForegroundColor White
        Write-Host "Access Token: $($response.config.accessToken)" -ForegroundColor White
        Write-Host "API Base URL: $($response.config.apiBaseUrl)" -ForegroundColor White
        Write-Host "Webhook URL: $($response.config.webhookUrl)" -ForegroundColor White
        Write-Host "Đã cấu hình: $($response.config.isConfigured)" -ForegroundColor $(if($response.config.isConfigured) { "Green" } else { "Red" })
        
        if (-not $response.config.isConfigured) {
            Write-Host ""
            Write-Host "⚠️  Cấu hình chưa đầy đủ!" -ForegroundColor Red
            Write-Host "Sử dụng: .\hanet-config.ps1 -Action set -ClientId 'your_id' -ClientSecret 'your_secret' -AccessToken 'your_token'" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "❌ Lỗi kết nối server: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Đảm bảo server đang chạy trên port 1888" -ForegroundColor Yellow
    }
}

function Test-HanetConnection {
    try {
        Write-Host "Đang test kết nối với Hanet API..." -ForegroundColor Yellow
        $response = Invoke-RestMethod -Uri "$ServerUrl/hanet-test" -Method GET
        
        if ($response.success) {
            Write-Host "✅ Kết nối Hanet API thành công!" -ForegroundColor Green
            Write-Host "Số thiết bị: $($response.deviceCount)" -ForegroundColor White
            Write-Host "Webhook URL: $($response.webhookUrl)" -ForegroundColor White
        } else {
            Write-Host "❌ Lỗi kết nối: $($response.message)" -ForegroundColor Red
            if ($response.instructions) {
                Write-Host ""
                Write-Host "Hướng dẫn:" -ForegroundColor Yellow
                foreach ($instruction in $response.instructions) {
                    Write-Host "  $instruction" -ForegroundColor White
                }
            }
        }
    }
    catch {
        Write-Host "❌ Lỗi test kết nối: $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Set-HanetConfig {
    if (-not $ClientId -or -not $ClientSecret -or -not $AccessToken) {
        Write-Host "❌ Thiếu thông tin bắt buộc!" -ForegroundColor Red
        Write-Host "Cần có: ClientId, ClientSecret, AccessToken" -ForegroundColor Yellow
        Write-Host "Sử dụng: .\hanet-config.ps1 -Action set -ClientId 'your_id' -ClientSecret 'your_secret' -AccessToken 'your_token'" -ForegroundColor White
        return
    }
    
    try {
        Write-Host "Đang cập nhật cấu hình Hanet..." -ForegroundColor Yellow
        
        $body = @{
            clientId = $ClientId
            clientSecret = $ClientSecret
            accessToken = $AccessToken
            webhookUrl = $WebhookUrl
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "$ServerUrl/hanet-config" -Method POST -Body $body -ContentType "application/json"
        
        if ($response.success) {
            Write-Host "✅ Cấu hình đã được cập nhật thành công!" -ForegroundColor Green
            Write-Host "Đã lưu vào file .env: $($response.savedToEnv)" -ForegroundColor White
            Write-Host "Trạng thái cấu hình: $($response.config.isConfigured)" -ForegroundColor White
        } else {
            Write-Host "❌ Lỗi cập nhật: $($response.message)" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "❌ Lỗi cập nhật cấu hình: $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Clear-HanetConfig {
    try {
        Write-Host "Đang xóa cấu hình Hanet..." -ForegroundColor Yellow
        $response = Invoke-RestMethod -Uri "$ServerUrl/hanet-config" -Method DELETE
        
        if ($response.success) {
            Write-Host "✅ Cấu hình đã được xóa thành công!" -ForegroundColor Green
            Write-Host "Đã lưu vào file .env: $($response.savedToEnv)" -ForegroundColor White
        } else {
            Write-Host "❌ Lỗi xóa cấu hình: $($response.message)" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "❌ Lỗi xóa cấu hình: $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Edit-HanetConfig {
    $configFile = "hanet-config.env"
    if (Test-Path $configFile) {
        Write-Host "Đang mở file cấu hình: $configFile" -ForegroundColor Yellow
        notepad $configFile
    } else {
        Write-Host "❌ Không tìm thấy file cấu hình: $configFile" -ForegroundColor Red
    }
}

# Main execution
switch ($Action.ToLower()) {
    "help" { Show-Help }
    "status" { Get-HanetStatus }
    "test" { Test-HanetConnection }
    "set" { Set-HanetConfig }
    "clear" { Clear-HanetConfig }
    "edit" { Edit-HanetConfig }
    default { 
        Write-Host "❌ Lệnh không hợp lệ: $Action" -ForegroundColor Red
        Show-Help 
    }
}
