# Hanet Attendance Management System

Hệ thống quản lý chấm công Hanet với hỗ trợ tiếng Việt và tích hợp SQL Server.

## 🚀 Trạng thái hiện tại

✅ **Server đã được khắc phục và chạy thành công!**

- **Port**: 1888
- **PID**: 27584
- **Trạng thái**: Đang chạy
- **URL**: http://localhost:1888

## 🔧 Các lỗi đã được khắc phục

### 1. Lỗi Port đã được sử dụng (EADDRINUSE)
- **Nguyên nhân**: Process cũ vẫn đang chạy trên port 1888
- **Giải pháp**: Đã dừng process cũ (PID: 22092) và thêm xử lý lỗi graceful

### 2. Lỗi cấu hình Hanet thiếu
- **Nguyên nhân**: Thiếu file .env và các thông tin cấu hình Hanet
- **Giải pháp**: 
  - Tạo file .env với template cấu hình
  - Thêm kiểm tra cấu hình và cảnh báo thân thiện
  - Server vẫn chạy được mà không cần cấu hình Hanet đầy đủ

## 📋 Các tính năng chính

### 🌐 Web Interface
- **Dashboard**: http://localhost:1888/dashboard
- **Cấu hình Hanet**: http://localhost:1888/hanet-config
- **Webhook**: http://localhost:1888/hanet-webhook

### 🔌 API Endpoints
- `GET /hanet-config` - Xem cấu hình Hanet
- `POST /hanet-config` - Cập nhật cấu hình Hanet
- `GET /hanet-test` - Test kết nối Hanet API
- `GET /attendance-data` - Lấy dữ liệu chấm công
- `GET /employees` - Quản lý nhân viên
- `GET /devices` - Danh sách thiết bị
- `GET /export/report` - Xuất báo cáo Excel

### 🗄️ Database
- **SQL Server**: localhost:1433
- **Database**: hanet
- **User**: sa
- **Password**: Admin@123

## ⚙️ Cấu hình Hanet

Để sử dụng đầy đủ tính năng, cần cấu hình thông tin Hanet:

1. **Truy cập**: https://partner.hanet.ai/
2. **Đăng nhập** với tài khoản Hanet
3. **Tạo ứng dụng mới** (Create New App)
4. **Lấy thông tin**:
   - Client ID
   - Client Secret
   - Access Token

### Cách cấu hình:

**Phương pháp 1: Cập nhật file .env**
```bash
HANET_CLIENT_ID=your_actual_client_id
HANET_CLIENT_SECRET=your_actual_client_secret
HANET_ACCESS_TOKEN=your_actual_access_token
```

**Phương pháp 2: Sử dụng API**
```bash
curl -X POST http://localhost:1888/hanet-config \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "your_client_id",
    "clientSecret": "your_client_secret", 
    "accessToken": "your_access_token"
  }'
```

## 🛠️ Quản lý Server

### Khởi động Server
```bash
node server.js
```

### Dừng Server
```bash
# Tìm PID của process
netstat -ano | findstr :1888

# Dừng process
taskkill /PID <PID> /F
```

### Kiểm tra trạng thái
```bash
# Kiểm tra port
netstat -ano | findstr :1888

# Test API
curl http://localhost:1888/hanet-config
```

## 📁 Cấu trúc thư mục

```
├── server.js              # File chính của server
├── modules/
│   └── routes.js          # API routes và logic xử lý
├── public/
│   ├── dashboard.html     # Giao diện dashboard
│   ├── css/               # Stylesheets
│   └── js/                # JavaScript files
├── HANET_CONFIG/          # Scripts cấu hình Hanet
├── .env                   # File cấu hình environment
├── db.js                  # Cấu hình database
├── helpers.js             # Các hàm helper
└── package.json           # Dependencies
```

## 🔍 Troubleshooting

### Server không khởi động được
1. **Kiểm tra port**: `netstat -ano | findstr :1888`
2. **Dừng process cũ**: `taskkill /PID <PID> /F`
3. **Kiểm tra dependencies**: `npm install`

### Lỗi kết nối database
1. **Kiểm tra SQL Server** đang chạy
2. **Kiểm tra thông tin kết nối** trong db.js
3. **Kiểm tra firewall** và network

### Lỗi cấu hình Hanet
1. **Kiểm tra file .env** có tồn tại không
2. **Cập nhật thông tin** từ Hanet Portal
3. **Test kết nối**: `curl http://localhost:1888/hanet-test`

## 📞 Hỗ trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra logs của server
2. Kiểm tra trạng thái database
3. Kiểm tra cấu hình Hanet
4. Liên hệ admin để được hỗ trợ

---

**🎉 Server đã sẵn sàng sử dụng!**
