# HƯỚNG DẪN CẤU HÌNH HANET DEVELOPER

## 📋 Thông tin cần thiết

Để nhận dữ liệu check-in/out từ camera Hanet, bạn cần cấu hình các thông tin sau:

### 1. **Client ID**
- Lấy từ Hanet Developer Portal
- Dùng để xác thực ứng dụng

### 2. **Client Secret** 
- Lấy từ Hanet Developer Portal
- Dùng để xác thực ứng dụng

### 3. **Access Token**
- Token để truy cập API Hanet
- Có thời hạn sử dụng

### 4. **Refresh Token**
- Token để làm mới Access Token
- Khi Access Token hết hạn

## 🔧 Các bước cấu hình

### Bước 1: Truy cập Hanet Developer Portal
```
https://partner.hanet.ai/
```

### Bước 2: Đăng nhập và tạo ứng dụng
1. Đăng nhập với tài khoản Hanet
2. Tạo ứng dụng mới (Create New App)
3. Điền thông tin ứng dụng

### Bước 3: Lấy thông tin cấu hình
1. **Client ID**: Copy từ trang ứng dụng
2. **Client Secret**: Copy từ trang ứng dụng
3. **Access Token**: Lấy từ API hoặc trang ứng dụng
4. **Refresh Token**: Lấy từ API hoặc trang ứng dụng

### Bước 4: Cấu hình Webhook
1. Trong ứng dụng Hanet, thêm Webhook URL:
   ```
   http://192.168.11.114:1888/hanet-webhook
   ```
2. Đảm bảo server có thể truy cập từ internet

### Bước 5: Cập nhật file .env
Tạo file `.env` trong thư mục gốc với nội dung:

```env
# Hanet Configuration
HANET_CLIENT_ID=your_client_id_here
HANET_CLIENT_SECRET=your_client_secret_here
HANET_ACCESS_TOKEN=your_access_token_here
HANET_REFRESH_TOKEN=your_refresh_token_here
WEBHOOK_URL=http://192.168.11.114:1888/hanet-webhook

# Database Configuration
DB_SERVER=localhost
DB_USER=sa
DB_PASSWORD=Admin@123
DB_DATABASE=hanet
PORT=1888
```

### Bước 6: Restart server
```bash
node server.js
```

### Bước 7: Test kết nối
Truy cập: `http://192.168.11.114:1888/hanet-test`

## 🔍 Kiểm tra cấu hình

### API Endpoints để kiểm tra:

1. **Kiểm tra cấu hình**: `GET /hanet-config`
2. **Test kết nối**: `GET /hanet-test`

### Logs server sẽ hiển thị:
- ✅ `Cấu hình Hanet đã được thiết lập` - Nếu cấu hình đúng
- ⚠️ `Cấu hình Hanet chưa đầy đủ` - Nếu thiếu thông tin

## 🚨 Xử lý sự cố

### Không nhận được dữ liệu check-in/out:
1. Kiểm tra Webhook URL có đúng không
2. Kiểm tra server có thể truy cập từ internet không
3. Kiểm tra Access Token có hợp lệ không
4. Kiểm tra camera có được cấu hình đúng không

### Lỗi kết nối API:
1. Kiểm tra Client ID và Client Secret
2. Kiểm tra Access Token có hết hạn không
3. Kiểm tra Refresh Token có hợp lệ không

## 📞 Hỗ trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra logs server
2. Test các API endpoints
3. Liên hệ Hanet support nếu cần thiết
