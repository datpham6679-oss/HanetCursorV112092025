# Hanet Attendance Management System v1.1

Hệ thống quản lý chấm công Hanet với tính năng tự động tính toán và hỗ trợ tiếng Việt đầy đủ.

## 🚀 Tính năng mới v1.1

### ✅ **Hệ thống tự động tính toán**
- **Real-time processing**: Xử lý chấm công tự động khi có event mới
- **Auto-update**: Cập nhật giờ ra tự động với checkout mới nhất
- **Smart calculation**: Tính toán thời gian làm việc chính xác
- **Webhook integration**: Tích hợp webhook Hanet tự động

### ✅ **Quản lý nhân viên CRUD**
- **Thêm nhân viên**: Form đầy đủ với validation
- **Chỉnh sửa**: Cập nhật thông tin nhân viên
- **Xóa nhân viên**: Với kiểm tra ràng buộc dữ liệu
- **Tìm kiếm**: Autocomplete search cho tên nhân viên

### ✅ **Giao diện tối ưu**
- **Dashboard đơn giản**: Giao diện thống nhất trong 1 file
- **Thông báo**: Hệ thống notification cho user feedback
- **Calendar widget**: Chọn ngày trực quan
- **Responsive design**: Tương thích mọi thiết bị

## 📁 Cấu trúc thư mục

```
HanetCursorV112092025/
├── SQL Server 2012/           # Tất cả file SQL và database
│   ├── database_structure.sql # Cấu trúc database hoàn chỉnh
│   ├── sample_data.sql        # Dữ liệu mẫu
│   ├── sp_XuLyChamCongMoi.sql # Stored procedure gốc
│   ├── sp_XuLyChamCongMoi_Auto.sql # Stored procedure tự động (MỚI)
│   └── README.md              # Hướng dẫn SQL
├── public/                    # Frontend files
│   └── dashboard-simple.html # Dashboard tối ưu (MỚI)
├── modules/                   # Backend modules
│   └── routes.js              # API routes và webhook
├── server.js                  # Main server file
├── db.js                      # Database connection
├── helpers.js                 # Utility functions
├── package.json               # Dependencies
└── README.md                  # Documentation
```

## 🏗️ Kiến trúc hệ thống

### **Backend Architecture**
- **`server.js`**: Main server entry point
- **`db.js`**: Database connection và configuration
- **`helpers.js`**: Utility functions cho backend
- **`modules/routes.js`**: API routes và webhook handlers với tự động tính toán

### **Database Architecture**
- **`sp_XuLyChamCongMoi_Auto`**: Stored procedure tự động xử lý chấm công
- **Real-time processing**: Xử lý dữ liệu ngay khi có event mới
- **Smart merge**: Cập nhật hoặc tạo mới bản ghi chấm công

### **Frontend Architecture**
- **Single file design**: `dashboard-simple.html` chứa tất cả
- **Modular JavaScript**: Code được tổ chức theo chức năng
- **Notification system**: Thông báo real-time cho user

## 📈 Changelog

### Version 1.1 - Automatic Attendance Calculation (Latest)
**Ngày:** 12/09/2025

#### **🔄 Major Features:**
- **Automatic Processing**: Hệ thống tự động tính toán chấm công
- **Real-time Updates**: Cập nhật giờ ra tự động với checkout mới
- **Employee Management**: CRUD operations cho nhân viên
- **Simplified Frontend**: Giao diện đơn giản hóa

#### **🆕 New Components:**
- **`sp_XuLyChamCongMoi_Auto`**: Stored procedure tự động
- **`dashboard-simple.html`**: Frontend tối ưu
- **Employee CRUD**: Quản lý nhân viên đầy đủ
- **Notification System**: Thông báo user feedback

#### **✨ Improvements:**
- ✅ **Auto-calculation**: Tự động tính toán khi có event mới
- ✅ **Real-time**: Cập nhật ngay lập tức
- ✅ **User-friendly**: Giao diện đơn giản, dễ sử dụng
- ✅ **Performance**: Tối ưu database queries
- ✅ **Reliability**: Xử lý lỗi và validation tốt hơn

### Version 1.0 - Initial Release
**Ngày:** 11/09/2025

#### **🚀 Core Features:**
- Webhook Hanet integration
- Dashboard với KPI và charts
- Reports system với Excel export
- Device monitoring
- Vietnamese language support

## 🚀 Tính năng chính

### **🔄 Tự động tính toán**
- **Webhook Hanet**: Tự động nhận và xử lý dữ liệu chấm công từ thiết bị Hanet
- **Real-time processing**: Xử lý ngay khi có event checkout mới
- **Smart calculation**: Tính toán thời gian làm việc chính xác
- **Auto-update**: Cập nhật giờ ra tự động với checkout mới nhất

### **👥 Quản lý nhân viên**
- **CRUD Operations**: Thêm, sửa, xóa nhân viên
- **Validation**: Kiểm tra dữ liệu đầu vào
- **Search**: Tìm kiếm nhân viên với autocomplete
- **Notifications**: Thông báo kết quả operations

### **📊 Dashboard & Reports**
- **Dashboard**: Giao diện quản lý trực quan với các tab chức năng
- **Báo cáo**: Xuất báo cáo Excel với nhiều định dạng
- **Chi tiết nhân viên**: Xem timeline chấm công của từng nhân viên
- **Calendar**: Chọn ngày trực quan

### **🏢 Quản lý hệ thống**
- **Thiết bị**: Monitor trạng thái online/offline của các thiết bị
- **Ca làm việc**: Hệ thống ca linh hoạt (HC, SC, VH)
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
- Chạy file `SQL Server 2012/database_structure.sql` để tạo cấu trúc bảng
- Chạy file `SQL Server 2012/sample_data.sql` để thêm dữ liệu mẫu
- Chạy file `SQL Server 2012/sp_XuLyChamCongMoi_Auto.sql` để tạo stored procedure tự động

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
- **sp_XuLyChamCongMoi**: Xử lý dữ liệu chấm công gốc
- **sp_XuLyChamCongMoi_Auto**: Xử lý tự động với real-time updates

## 🔧 API Endpoints

### **Webhook & Processing**
- `POST /hanet-webhook`: Nhận dữ liệu từ Hanet và tự động xử lý

### **Data Retrieval**
- `GET /attendance-data`: Lấy dữ liệu chấm công
- `GET /devices`: Lấy danh sách thiết bị
- `GET /raw-events`: Lấy dữ liệu thô cho chi tiết nhân viên

### **Employee Management**
- `GET /employees`: Lấy danh sách nhân viên
- `GET /employees/:id`: Lấy thông tin nhân viên cụ thể
- `POST /add-employee`: Thêm nhân viên mới
- `PUT /employees/:id`: Cập nhật thông tin nhân viên
- `DELETE /employees/:id`: Xóa nhân viên

### **Reports & Export**
- `GET /export/report`: Xuất báo cáo Excel
- `GET /departments`: Lấy danh sách phòng ban

## 📱 Giao diện

Truy cập `http://192.168.11.114:1888/dashboard` để sử dụng dashboard với các tab:

### **🏠 Dashboard**
- Tổng quan KPI và thống kê
- Charts và biểu đồ trực quan
- Refresh button để cập nhật dữ liệu

### **📋 Hoạt động**
- Danh sách chấm công với filter
- Tìm kiếm theo tên nhân viên
- Pagination và sorting

### **📊 Báo cáo**
- Xuất báo cáo Excel đa định dạng
- Filter theo ngày, phòng ban, nhân viên
- Calendar widget để chọn ngày

### **👤 Chi tiết NV**
- Xem timeline chấm công của nhân viên
- Summary cards với thống kê
- Tìm kiếm nhân viên với autocomplete

### **👥 Quản lý NV**
- CRUD operations cho nhân viên
- Form validation và notifications
- Table với actions (edit/delete)

### **📱 Thiết bị**
- Monitor trạng thái online/offline
- Filter theo trạng thái
- Refresh để cập nhật

## 🔄 Ca làm việc

Hệ thống hỗ trợ 3 loại ca chính:

### **HC (Hành chính)**
- **Thời gian**: Thứ 2-6, 6h-18h
- **Check-in**: 6h-7h30
- **Check-out**: 17h-18h

### **SC (Sửa chữa)**
- **Thời gian**: Thứ 2-6, 6h-18h
- **Check-in**: 6h-8h
- **Check-out**: 16h-18h

### **VH (Vận hành)**
- **VHCN (Ca ngày)**: Thứ 2-CN, 6h-20h
- **VHCD (Ca đêm)**: Thứ 2-CN, 18h-8h (ngày hôm sau)
- **Tự động phát hiện**: Dựa trên giờ check-in thực tế

## 📈 Báo cáo

Hệ thống hỗ trợ xuất báo cáo Excel với các định dạng:
- **Tổng hợp**: Tất cả dữ liệu
- **Theo tên**: Filter theo tên nhân viên
- **Theo mã NV**: Filter theo mã nhân viên nội bộ
- **Theo phòng ban**: Filter theo phòng ban
- **Theo tháng**: Filter theo tháng cụ thể

## 🚨 Xử lý sự cố

### **Lỗi kết nối database:**
- Kiểm tra SQL Server đang chạy
- Kiểm tra thông tin đăng nhập trong `.env`
- Kiểm tra database `hanet` đã được tạo

### **Lỗi webhook:**
- Kiểm tra URL webhook: `http://your-server:1888/hanet-webhook`
- Kiểm tra format JSON từ Hanet
- Kiểm tra logs trong console

### **Lỗi tự động tính toán:**
- Kiểm tra stored procedure `sp_XuLyChamCongMoi_Auto` đã được tạo
- Kiểm tra webhook có gọi stored procedure
- Kiểm tra dữ liệu trong bảng `dulieutho`

### **Lỗi font tiếng Việt:**
- Đảm bảo collation database là `Vietnamese_CI_AS`
- Kiểm tra encoding trong SQL Server

## 🏷️ Tags & Releases

- **v1.0-phase1**: Phiên bản đầu tiên với tính năng cơ bản
- **v1.1-auto-attendance**: Phiên bản tự động tính toán (Latest)

## 👥 Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng tạo issue hoặc pull request.

## 📄 License

Dự án này được phát hành dưới giấy phép MIT.

## 📞 Liên hệ

- **GitHub**: [datpham6679-oss](https://github.com/datpham6679-oss)
- **Repository**: [HanetCursorV112092025](https://github.com/datpham6679-oss/HanetCursorV112092025)

---

**Lưu ý**: Đây là hệ thống quản lý chấm công chuyên nghiệp với khả năng xử lý dữ liệu thời gian thực và tự động tính toán từ thiết bị Hanet.