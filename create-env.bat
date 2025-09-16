@echo off
REM Script tạo file .env cho Hanet Configuration Manager

echo ========================================
echo    TẠO FILE CẤU HÌNH .ENV
echo ========================================
echo.

REM Kiểm tra xem file .env đã tồn tại chưa
if exist .env (
    echo File .env đã tồn tại!
    set /p overwrite="Bạn có muốn ghi đè không? (y/n): "
    if /i not "%overwrite%"=="y" (
        echo Hủy bỏ tạo file .env
        pause
        exit /b
    )
)

echo Đang tạo file .env...

REM Tạo nội dung file .env
(
echo # HANET CONFIGURATION MANAGER
echo # File cấu hình tập trung cho Hanet Developer
echo.
echo # ========================================
echo # HANET DEVELOPER CONFIGURATION
echo # ========================================
echo # Để lấy thông tin này, truy cập: https://partner.hanet.ai/
echo # 1. Đăng nhập với tài khoản Hanet
echo # 2. Tạo ứng dụng mới ^(Create New App^)
echo # 3. Lấy các thông tin dưới đây
echo.
echo # Client ID từ Hanet Developer Portal
echo HANET_CLIENT_ID=your_client_id_here
echo.
echo # Client Secret từ Hanet Developer Portal
echo HANET_CLIENT_SECRET=your_client_secret_here
echo.
echo # Access Token để truy cập API Hanet
echo HANET_ACCESS_TOKEN=your_access_token_here
echo.
echo # Webhook URL của server này ^(cần đăng ký với Hanet^)
echo WEBHOOK_URL=http://117.2.136.172:1888/hanet-webhook
echo.
echo # ========================================
echo # DATABASE CONFIGURATION
echo # ========================================
echo DB_SERVER=localhost
echo DB_NAME=hanet
echo DB_USER=sa
echo DB_PASSWORD=Admin@123
echo DB_PORT=1433
echo.
echo # ========================================
echo # SERVER CONFIGURATION
echo # ========================================
echo PORT=1888
echo HOST=0.0.0.0
echo.
echo # ========================================
echo # HƯỚNG DẪN SỬ DỤNG
echo # ========================================
echo # 1. Cập nhật các giá trị HANET_* với thông tin thực từ Hanet Portal
echo # 2. Lưu file này
echo # 3. Restart server để áp dụng cấu hình
echo # 4. Hoặc sử dụng API endpoints để cập nhật:
echo #    - GET /hanet-config ^(xem cấu hình hiện tại^)
echo #    - POST /hanet-config ^(cập nhật cấu hình^)
echo #    - DELETE /hanet-config ^(xóa cấu hình^)
echo #    - GET /hanet-test ^(test kết nối^)
) > .env

echo ✅ Đã tạo file .env thành công!
echo.
echo 📝 Bước tiếp theo:
echo 1. Mở file .env và cập nhật các giá trị HANET_* với thông tin thực
echo 2. Truy cập https://partner.hanet.ai/ để lấy thông tin cấu hình
echo 3. Restart server để áp dụng cấu hình
echo.
pause
