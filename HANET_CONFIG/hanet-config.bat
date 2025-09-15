@echo off
REM HANET CONFIGURATION MANAGER - Batch Script
REM Để quản lý cấu hình Hanet một cách dễ dàng

echo ========================================
echo    HANET CONFIGURATION MANAGER
echo ========================================
echo.

:menu
echo Chọn một tùy chọn:
echo 1. Xem trạng thái cấu hình
echo 2. Test kết nối Hanet API
echo 3. Cập nhật cấu hình Hanet
echo 4. Xóa cấu hình Hanet
echo 5. Mở file cấu hình để chỉnh sửa
echo 6. Hiển thị hướng dẫn
echo 7. Thoát
echo.

set /p choice="Nhập lựa chọn (1-7): "

if "%choice%"=="1" goto status
if "%choice%"=="2" goto test
if "%choice%"=="3" goto set
if "%choice%"=="4" goto clear
if "%choice%"=="5" goto edit
if "%choice%"=="6" goto help
if "%choice%"=="7" goto exit
goto invalid

:status
echo.
echo Đang kiểm tra trạng thái cấu hình...
powershell -ExecutionPolicy Bypass -File "hanet-config.ps1" -Action status
echo.
goto menu

:test
echo.
echo Đang test kết nối Hanet API...
powershell -ExecutionPolicy Bypass -File "hanet-config.ps1" -Action test
echo.
goto menu

:set
echo.
echo === CẬP NHẬT CẤU HÌNH HANET ===
echo.
set /p clientId="Nhập Client ID: "
set /p clientSecret="Nhập Client Secret: "
set /p accessToken="Nhập Access Token: "
set /p webhookUrl="Nhập Webhook URL (mặc định: http://117.2.136.172:1888/hanet-webhook): "

if "%webhookUrl%"=="" set webhookUrl=http://117.2.136.172:1888/hanet-webhook

echo.
echo Đang cập nhật cấu hình...
powershell -ExecutionPolicy Bypass -File "hanet-config.ps1" -Action set -ClientId "%clientId%" -ClientSecret "%clientSecret%" -AccessToken "%accessToken%" -WebhookUrl "%webhookUrl%"
echo.
goto menu

:clear
echo.
echo Bạn có chắc chắn muốn xóa tất cả cấu hình Hanet? (y/n)
set /p confirm=
if /i "%confirm%"=="y" (
    echo Đang xóa cấu hình...
    powershell -ExecutionPolicy Bypass -File "hanet-config.ps1" -Action clear
) else (
    echo Hủy bỏ xóa cấu hình.
)
echo.
goto menu

:edit
echo.
echo Đang mở file cấu hình...
powershell -ExecutionPolicy Bypass -File "hanet-config.ps1" -Action edit
echo.
goto menu

:help
echo.
powershell -ExecutionPolicy Bypass -File "hanet-config.ps1" -Action help
echo.
goto menu

:invalid
echo.
echo Lựa chọn không hợp lệ! Vui lòng chọn từ 1-7.
echo.
goto menu

:exit
echo.
echo Cảm ơn bạn đã sử dụng Hanet Configuration Manager!
echo.
pause
