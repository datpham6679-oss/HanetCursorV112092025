# SQL Server 2012 - Database Files

Thư mục này chứa tất cả các file SQL liên quan đến database của hệ thống Hanet Attendance Management.

## 📁 Danh sách files

### 1. `database_structure.sql`
- **Mục đích**: Tạo cấu trúc database hoàn chỉnh
- **Nội dung**: 
  - Tạo database `hanet`
  - Tạo 4 bảng chính: CaLamViec, NhanVien, dulieutho, ChamCongDaXuLyMoi
  - Tạo indexes để tối ưu hiệu suất
  - Tạo foreign key constraints
- **Cách sử dụng**: Chạy đầu tiên để tạo cấu trúc database

### 2. `sample_data.sql`
- **Mục đích**: Thêm dữ liệu mẫu để test và demo
- **Nội dung**:
  - 4 ca làm việc: HC, SC, VHCN, VHCD
  - 4 nhân viên mẫu
  - Dữ liệu chấm công mẫu
- **Cách sử dụng**: Chạy sau khi tạo cấu trúc database

### 3. `sp_XuLyChamCongMoi.sql`
- **Mục đích**: Stored procedure chính xử lý dữ liệu chấm công
- **Nội dung**:
  - Logic xử lý dữ liệu thô từ webhook
  - Tính toán thời gian làm việc
  - Xác định trạng thái chấm công
  - Lưu địa điểm vào/ra
- **Cách sử dụng**: Chạy để tạo stored procedure

### 4. `create_calamviec_table.sql`
- **Mục đích**: Tạo bảng ca làm việc riêng biệt
- **Nội dung**: Script tạo bảng CaLamViec với dữ liệu mẫu
- **Cách sử dụng**: Có thể chạy riêng nếu chỉ cần tạo bảng ca làm việc

### 5. `manage_employee_shifts.sql`
- **Mục đích**: Quản lý ca làm việc cho nhân viên
- **Nội dung**: Scripts để gán ca làm việc cho nhân viên
- **Cách sử dụng**: Chạy để cập nhật ca làm việc cho nhân viên

## 🚀 Hướng dẫn sử dụng

### Cài đặt database từ đầu:
```sql
-- Bước 1: Tạo cấu trúc database
sqlcmd -S localhost -U sa -P Admin@123 -i "database_structure.sql"

-- Bước 2: Thêm dữ liệu mẫu
sqlcmd -S localhost -U sa -P Admin@123 -i "sample_data.sql"

-- Bước 3: Tạo stored procedure
sqlcmd -S localhost -U sa -P Admin@123 -i "sp_XuLyChamCongMoi.sql"
```

### Chỉ tạo bảng ca làm việc:
```sql
sqlcmd -S localhost -U sa -P Admin@123 -i "create_calamviec_table.sql"
```

### Quản lý ca làm việc nhân viên:
```sql
sqlcmd -S localhost -U sa -P Admin@123 -i "manage_employee_shifts.sql"
```

## 📊 Cấu trúc Database

### Bảng CaLamViec
- **MaCa**: Mã ca làm việc (HC, SC, VHCN, VHCD)
- **TenCa**: Tên ca làm việc
- **ThuBatDau/ThuKetThuc**: Thứ bắt đầu/kết thúc (2-7)
- **GioBatDau/GioKetThuc**: Giờ bắt đầu/kết thúc

### Bảng NhanVien
- **MaNhanVienNoiBo**: Mã nhân viên nội bộ
- **MaNhanVienHANET**: Mã nhân viên từ Hanet
- **HoTen**: Họ tên nhân viên
- **CaLamViec**: Ca làm việc được gán

### Bảng dulieutho
- **event_id**: ID sự kiện từ Hanet
- **person_id**: ID nhân viên từ Hanet
- **device_name**: Tên thiết bị
- **event_type**: Loại sự kiện (checkin/checkout)
- **ts_vn**: Thời gian Việt Nam
- **DaXuLy**: Đã xử lý hay chưa

### Bảng ChamCongDaXuLyMoi
- **MaNhanVienNoiBo**: Mã nhân viên nội bộ
- **NgayVao/GioVao**: Ngày/giờ vào
- **NgayRa/GioRa**: Ngày/giờ ra
- **NgayChamCong**: Ngày chấm công
- **ThoiGianLamViec**: Thời gian làm việc (giờ)
- **TrangThai**: Trạng thái (Đúng giờ, Đi trễ, Về sớm)
- **DiaDiemVao/DiaDiemRa**: Địa điểm vào/ra

## ⚠️ Lưu ý quan trọng

1. **Thứ tự chạy**: Luôn chạy `database_structure.sql` trước
2. **Backup**: Nên backup database trước khi chạy scripts
3. **Permissions**: Đảm bảo user có quyền tạo database và tables
4. **Collation**: Database nên sử dụng collation `Vietnamese_CI_AS` để hỗ trợ tiếng Việt

## 🔧 Troubleshooting

### Lỗi collation:
```sql
ALTER DATABASE hanet COLLATE Vietnamese_CI_AS;
```

### Lỗi foreign key:
```sql
-- Kiểm tra dữ liệu trước khi tạo foreign key
SELECT * FROM NhanVien WHERE CaLamViec NOT IN (SELECT MaCa FROM CaLamViec);
```

### Lỗi stored procedure:
```sql
-- Xóa và tạo lại stored procedure
DROP PROCEDURE IF EXISTS sp_XuLyChamCongMoi;
-- Sau đó chạy lại sp_XuLyChamCongMoi.sql
```
