# Hanet Server Management Script
param(
    [Parameter(Position=0)]
    [ValidateSet("start", "stop", "restart", "status", "config")]
    [string]$Action = "status"
)

$ServerName = "Hanet Attendance Management"
$Port = 1888
$ProcessName = "node"

function Get-ServerProcess {
    $processes = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue | Where-Object {
        $_.CommandLine -like "*server.js*" -or 
        (Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Where-Object { $_.OwningProcess -eq $_.Id })
    }
    return $processes
}

function Get-ServerStatus {
    $processes = Get-ServerProcess
    $portStatus = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    
    if ($processes -and $portStatus) {
        return @{
            Status = "Running"
            PID = $processes[0].Id
            Port = $Port
            ProcessName = $processes[0].ProcessName
        }
    } else {
        return @{
            Status = "Stopped"
            PID = $null
            Port = $Port
            ProcessName = $null
        }
    }
}

function Start-Server {
    $status = Get-ServerStatus
    
    if ($status.Status -eq "Running") {
        Write-Host "⚠️  Server đã đang chạy (PID: $($status.PID))" -ForegroundColor Yellow
        return
    }
    
    Write-Host "🚀 Đang khởi động $ServerName..." -ForegroundColor Green
    
    # Kiểm tra xem có process nào đang sử dụng port không
    $portProcess = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($portProcess) {
        Write-Host "⚠️  Port $Port đang được sử dụng bởi process khác (PID: $($portProcess.OwningProcess))" -ForegroundColor Yellow
        $kill = Read-Host "Bạn có muốn dừng process đó không? (y/n)"
        if ($kill -eq "y" -or $kill -eq "Y") {
            Stop-Process -Id $portProcess.OwningProcess -Force
            Write-Host "✅ Đã dừng process cũ" -ForegroundColor Green
        } else {
            Write-Host "❌ Không thể khởi động server" -ForegroundColor Red
            return
        }
    }
    
    # Khởi động server
    Start-Process -FilePath "node" -ArgumentList "server.js" -WindowStyle Hidden
    Start-Sleep -Seconds 3
    
    $newStatus = Get-ServerStatus
    if ($newStatus.Status -eq "Running") {
        Write-Host "✅ Server đã khởi động thành công!" -ForegroundColor Green
        Write-Host "   PID: $($newStatus.PID)" -ForegroundColor Cyan
        Write-Host "   Port: $($newStatus.Port)" -ForegroundColor Cyan
        Write-Host "   URL: http://localhost:$Port" -ForegroundColor Cyan
        Write-Host "   Dashboard: http://localhost:$Port/dashboard" -ForegroundColor Cyan
        Write-Host "   Config: http://localhost:$Port/hanet-config" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Không thể khởi động server" -ForegroundColor Red
    }
}

function Stop-Server {
    $status = Get-ServerStatus
    
    if ($status.Status -eq "Stopped") {
        Write-Host "⚠️  Server đã dừng" -ForegroundColor Yellow
        return
    }
    
    Write-Host "🛑 Đang dừng $ServerName..." -ForegroundColor Red
    
    $processes = Get-ServerProcess
    foreach ($process in $processes) {
        Stop-Process -Id $process.Id -Force
        Write-Host "✅ Đã dừng process (PID: $($process.Id))" -ForegroundColor Green
    }
    
    Start-Sleep -Seconds 2
    $newStatus = Get-ServerStatus
    if ($newStatus.Status -eq "Stopped") {
        Write-Host "✅ Server đã dừng thành công!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Server có thể vẫn đang chạy" -ForegroundColor Yellow
    }
}

function Restart-Server {
    Write-Host "🔄 Đang khởi động lại $ServerName..." -ForegroundColor Yellow
    Stop-Server
    Start-Sleep -Seconds 2
    Start-Server
}

function Show-Status {
    $status = Get-ServerStatus
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "   TRẠNG THÁI SERVER HANET" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    if ($status.Status -eq "Running") {
        Write-Host "✅ Trạng thái: Đang chạy" -ForegroundColor Green
        Write-Host "   PID: $($status.PID)" -ForegroundColor White
        Write-Host "   Port: $($status.Port)" -ForegroundColor White
        Write-Host "   Process: $($status.ProcessName)" -ForegroundColor White
        Write-Host ""
        Write-Host "🌐 URLs:" -ForegroundColor Cyan
        Write-Host "   Server: http://localhost:$Port" -ForegroundColor White
        Write-Host "   Dashboard: http://localhost:$Port/dashboard" -ForegroundColor White
        Write-Host "   Config: http://localhost:$Port/hanet-config" -ForegroundColor White
        Write-Host "   Webhook: http://localhost:$Port/hanet-webhook" -ForegroundColor White
    } else {
        Write-Host "❌ Trạng thái: Đã dừng" -ForegroundColor Red
        Write-Host "   Port: $($status.Port)" -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "📋 Các lệnh có sẵn:" -ForegroundColor Cyan
    Write-Host "   .\server-manager.ps1 start    - Khởi động server" -ForegroundColor White
    Write-Host "   .\server-manager.ps1 stop     - Dừng server" -ForegroundColor White
    Write-Host "   .\server-manager.ps1 restart  - Khởi động lại server" -ForegroundColor White
    Write-Host "   .\server-manager.ps1 status   - Xem trạng thái" -ForegroundColor White
    Write-Host "   .\server-manager.ps1 config   - Xem cấu hình Hanet" -ForegroundColor White
}

function Show-Config {
    $status = Get-ServerStatus
    
    if ($status.Status -ne "Running") {
        Write-Host "❌ Server chưa chạy. Vui lòng khởi động server trước." -ForegroundColor Red
        return
    }
    
    Write-Host "⚙️  Đang lấy cấu hình Hanet..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:$Port/hanet-config" -Method GET
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "   CẤU HÌNH HANET" -ForegroundColor Cyan
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Client ID: $($response.config.clientId)" -ForegroundColor White
        Write-Host "Client Secret: $($response.config.clientSecret)" -ForegroundColor White
        Write-Host "Access Token: $($response.config.accessToken)" -ForegroundColor White
        Write-Host "API Base URL: $($response.config.apiBaseUrl)" -ForegroundColor White
        Write-Host "Webhook URL: $($response.config.webhookUrl)" -ForegroundColor White
        Write-Host "Đã cấu hình: $($response.config.isConfigured)" -ForegroundColor White
        
        if (-not $response.config.isConfigured) {
            Write-Host ""
            Write-Host "⚠️  Cấu hình chưa đầy đủ!" -ForegroundColor Yellow
            Write-Host "📝 Vui lòng cập nhật file .env hoặc sử dụng API để cấu hình" -ForegroundColor Yellow
            Write-Host "🌐 Truy cập https://partner.hanet.ai/ để lấy thông tin" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Không thể lấy cấu hình: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Main execution
switch ($Action) {
    "start" { Start-Server }
    "stop" { Stop-Server }
    "restart" { Restart-Server }
    "status" { Show-Status }
    "config" { Show-Config }
    default { Show-Status }
}
