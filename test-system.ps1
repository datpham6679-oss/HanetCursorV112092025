# Test Script cho Hanet Attendance Management System
# Script kiểm tra tất cả các chức năng của server

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   TEST HANET ATTENDANCE SYSTEM" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:1888"

# Test 1: Kiểm tra server status
Write-Host "🔍 Test 1: Kiểm tra trạng thái server..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/hanet-config" -Method GET
    Write-Host "✅ Server đang chạy" -ForegroundColor Green
} catch {
    Write-Host "❌ Server không phản hồi" -ForegroundColor Red
    exit 1
}

# Test 2: Kiểm tra cấu hình Hanet
Write-Host "🔍 Test 2: Kiểm tra cấu hình Hanet..." -ForegroundColor Yellow
try {
    $config = Invoke-RestMethod -Uri "$baseUrl/hanet-config" -Method GET
    if ($config.config.isConfigured) {
        Write-Host "✅ Cấu hình Hanet đã được thiết lập" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Cấu hình Hanet chưa đầy đủ" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Lỗi kiểm tra cấu hình Hanet" -ForegroundColor Red
}

# Test 3: Kiểm tra kết nối database - Dữ liệu chấm công
Write-Host "🔍 Test 3: Kiểm tra kết nối database (dữ liệu chấm công)..." -ForegroundColor Yellow
try {
    $attendance = Invoke-RestMethod -Uri "$baseUrl/attendance-data" -Method GET
    Write-Host "✅ Kết nối database thành công - Có $($attendance.Count) bản ghi chấm công" -ForegroundColor Green
} catch {
    Write-Host "❌ Lỗi kết nối database - Dữ liệu chấm công" -ForegroundColor Red
}

# Test 4: Kiểm tra kết nối database - Danh sách nhân viên
Write-Host "🔍 Test 4: Kiểm tra kết nối database (danh sách nhân viên)..." -ForegroundColor Yellow
try {
    $employees = Invoke-RestMethod -Uri "$baseUrl/employees" -Method GET
    Write-Host "✅ Kết nối database thành công - Có $($employees.Count) nhân viên" -ForegroundColor Green
} catch {
    Write-Host "❌ Lỗi kết nối database - Danh sách nhân viên" -ForegroundColor Red
}

# Test 5: Kiểm tra kết nối database - Danh sách thiết bị
Write-Host "🔍 Test 5: Kiểm tra kết nối database (danh sách thiết bị)..." -ForegroundColor Yellow
try {
    $devices = Invoke-RestMethod -Uri "$baseUrl/devices" -Method GET
    Write-Host "✅ Kết nối database thành công - Có $($devices.Count) thiết bị" -ForegroundColor Green
} catch {
    Write-Host "❌ Lỗi kết nối database - Danh sách thiết bị" -ForegroundColor Red
}

# Test 6: Kiểm tra webhook endpoint
Write-Host "🔍 Test 6: Kiểm tra webhook endpoint..." -ForegroundColor Yellow
try {
    $webhookTest = Invoke-RestMethod -Uri "$baseUrl/webhook-test" -Method GET
    Write-Host "✅ Webhook endpoint hoạt động - Có $($webhookTest.count) bản ghi webhook gần nhất" -ForegroundColor Green
} catch {
    Write-Host "❌ Lỗi webhook endpoint" -ForegroundColor Red
}

# Test 7: Kiểm tra dashboard
Write-Host "🔍 Test 7: Kiểm tra dashboard..." -ForegroundColor Yellow
try {
    $dashboard = Invoke-WebRequest -Uri "$baseUrl/dashboard" -Method GET
    if ($dashboard.StatusCode -eq 200) {
        Write-Host "✅ Dashboard hoạt động bình thường" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Dashboard có vấn đề (Status: $($dashboard.StatusCode))" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Lỗi truy cập dashboard" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   KẾT QUẢ TEST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 URLs có sẵn:" -ForegroundColor Cyan
Write-Host "   Dashboard: $baseUrl/dashboard" -ForegroundColor White
Write-Host "   Cấu hình Hanet: $baseUrl/hanet-config" -ForegroundColor White
Write-Host "   Webhook: $baseUrl/hanet-webhook" -ForegroundColor White
Write-Host "   Dữ liệu chấm công: $baseUrl/attendance-data" -ForegroundColor White
Write-Host "   Danh sách nhân viên: $baseUrl/employees" -ForegroundColor White
Write-Host "   Danh sách thiết bị: $baseUrl/devices" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Test hoàn thành!" -ForegroundColor Green
