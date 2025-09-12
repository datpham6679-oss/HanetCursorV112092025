# Hanet Attendance Management System

Hệ thống quản lý chấm công Hanet với hỗ trợ tiếng Việt và tính năng báo cáo đầy đủ.

## 🚀 Tính năng chính

- **Webhook Hanet**: Tự động nhận và xử lý dữ liệu chấm công từ thiết bị Hanet
- **Dashboard**: Giao diện quản lý trực quan với các tab chức năng
- **Báo cáo**: Xuất báo cáo Excel với nhiều định dạng (tổng hợp, theo tên, theo mã nhân viên, theo phòng ban, theo tháng)
- **Quản lý thiết bị**: Monitor trạng thái online/offline của các thiết bị
- **Ca làm việc**: Hệ thống ca linh hoạt (Hành chính, Sửa chữa, Vận hành ca ngày, Vận hành ca đêm)
- **Hỗ trợ tiếng Việt**: Font encoding và diacritics đầy đủ

## 📋 Yêu cầu hệ thống

- **Node.js**: v14 trở lên
- **SQL Server**: Express hoặc Standard
- **Hanet Device**: Thiết bị chấm công Hanet

## 🛠️ Cài đặt

### 1. Clone repository
```bash
git clone https://github.com/datpham6679-oss/HanetCursorV112092025.git
cd HanetCursorV112092025
```

### 2. Cài đặt dependencies
```bash
npm install
```

### 3. Cấu hình database
- Tạo database `hanet` trong SQL Server
- Chạy file `database_structure.sql` để tạo cấu trúc bảng
- Chạy file `sample_data.sql` để thêm dữ liệu mẫu
- Chạy file `sp_XuLyChamCongMoi.sql` để tạo stored procedure

### 4. Cấu hình environment
Tạo file `.env` với nội dung:
```env
DB_SERVER=localhost
DB_USER=sa
DB_PASSWORD=Admin@123
DB_DATABASE=hanet
PORT=1888
```

### 5. Khởi động server
```bash
node server.js
```

## 📊 Cấu trúc Database

### Bảng chính:
- **CaLamViec**: Định nghĩa các ca làm việc
- **NhanVien**: Thông tin nhân viên
- **dulieutho**: Dữ liệu thô từ Hanet webhook
- **ChamCongDaXuLyMoi**: Dữ liệu chấm công đã xử lý

### Stored Procedures:
- **sp_XuLyChamCongMoi**: Xử lý dữ liệu chấm công tự động

## 🔧 API Endpoints

- `POST /hanet-webhook`: Nhận dữ liệu từ Hanet
- `GET /attendance-data`: Lấy dữ liệu chấm công
- `GET /devices`: Lấy danh sách thiết bị
- `GET /export/report`: Xuất báo cáo Excel
- `POST /add-employee`: Thêm nhân viên mới

## 📱 Giao diện

Truy cập `http://localhost:1888` để sử dụng dashboard với các tab:
- **Dashboard**: Tổng quan và thống kê
- **Hoạt động**: Danh sách chấm công
- **Thiết bị**: Quản lý thiết bị
- **Báo cáo**: Xuất báo cáo Excel

## 🔄 Ca làm việc

Hệ thống hỗ trợ 4 loại ca:
- **HC (Hành chính)**: Thứ 2-6, 6h-18h
- **SC (Sửa chữa)**: Thứ 2-6, 6h-18h  
- **VHCN (Vận hành ca ngày)**: Thứ 2-CN, 6h-20h
- **VHCD (Vận hành ca đêm)**: Thứ 2-CN, 18h-8h (ngày hôm sau)

## 📈 Báo cáo

Hệ thống hỗ trợ xuất báo cáo Excel với các định dạng:
- Tổng hợp chung
- Theo tên nhân viên
- Theo mã nhân viên nội bộ
- Theo phòng ban
- Theo tháng

## 🚨 Xử lý sự cố

### Lỗi kết nối database:
- Kiểm tra SQL Server đang chạy
- Kiểm tra thông tin đăng nhập trong `.env`
- Kiểm tra database `hanet` đã được tạo

### Lỗi webhook:
- Kiểm tra URL webhook: `http://your-server:1888/hanet-webhook`
- Kiểm tra format JSON từ Hanet
- Kiểm tra logs trong console

### Lỗi font tiếng Việt:
- Đảm bảo collation database là `Vietnamese_CI_AS`
- Kiểm tra encoding trong SQL Server

## 📝 Changelog

### Version 1.0.0 (2025-09-13)
- ✅ Hệ thống webhook Hanet hoàn chỉnh
- ✅ Dashboard với 4 tab chức năng
- ✅ Hỗ trợ 4 loại ca làm việc
- ✅ Xuất báo cáo Excel đa định dạng
- ✅ Quản lý thiết bị online/offline
- ✅ Hỗ trợ tiếng Việt đầy đủ
- ✅ Stored procedure xử lý tự động

## 👥 Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng tạo issue hoặc pull request.

## 📄 License

Dự án này được phát hành dưới giấy phép MIT.

## 📞 Liên hệ

- **GitHub**: [datpham6679-oss](https://github.com/datpham6679-oss)
- **Repository**: [HanetCursorV112092025](https://github.com/datpham6679-oss/HanetCursorV112092025)

---

**Lưu ý**: Đây là hệ thống quản lý chấm công chuyên nghiệp với khả năng xử lý dữ liệu thời gian thực từ thiết bị Hanet.
