# Hướng dẫn quản lý dữ liệu bảng NhanVien

## Tổng quan
Bảng `NhanVien` có tính năng tự động cập nhật từ webhook và được bảo vệ bằng hệ thống backup để tránh mất dữ liệu.

## Các tính năng hiện tại

### 1. Tự động cập nhật ✅
- **Tự động tạo/cập nhật** nhân viên từ webhook Hanet
- **Cập nhật thông tin** khi có dữ liệu mới từ camera
- **Tạo nhân viên mới** khi có người chưa có trong hệ thống

### 2. Hệ thống backup 🛡️
- **Bảng backup**: `NhanVien_Backup`
- **API endpoints** để quản lý backup/restore
- **Script SQL** để backup/restore thủ công

#### Tạo backup mới
```bash
POST http://localhost:1888/backup-nhanvien
```
**Response:**
```json
{
  "success": true,
  "message": "Đã tạo backup với 16 nhân viên",
  "backupCount": 16
}
```

#### Khôi phục từ backup
```bash
POST http://localhost:1888/restore-nhanvien
```
**Response:**
```json
{
  "success": true,
  "message": "Đã khôi phục 16 nhân viên từ backup",
  "restoredCount": 16
}
```

### 3. Script SQL

#### Backup thủ công
```sql
-- Chạy file: backup_nhanvien.sql
sqlcmd -S localhost -d hanet -E -i backup_nhanvien.sql
```

#### Khôi phục thủ công
```sql
-- Chạy file: restore_nhanvien.sql
sqlcmd -S localhost -d hanet -E -i restore_nhanvien.sql
```

## Các thay đổi đã thực hiện

### 1. Tự động cập nhật ✅
- ✅ **Bật lại** tính năng tự động tạo/cập nhật nhân viên từ webhook
- ✅ **Cập nhật thông tin** nhân viên khi có dữ liệu mới
- ✅ **Tạo nhân viên mới** khi có người chưa có trong hệ thống

### 2. Hệ thống backup 🛡️
- ✅ **Bảng backup**: `NhanVien_Backup` với dữ liệu hiện tại
- ✅ **API endpoints** để quản lý backup/restore
- ✅ **Script SQL** để backup/restore thủ công

### 3. Bảo vệ dữ liệu
- ✅ **Backup tự động** khi cần thiết
- ✅ **Khôi phục nhanh** khi có sự cố
- ✅ **Dữ liệu nhân viên** được đồng bộ với webhook

## Hướng dẫn sử dụng

### Khi cần backup định kỳ
```bash
# Sử dụng API
curl -X POST http://localhost:1888/backup-nhanvien

# Hoặc sử dụng SQL
sqlcmd -S localhost -d hanet -E -i backup_nhanvien.sql
```

### Khi cần khôi phục dữ liệu
```bash
# Sử dụng API
curl -X POST http://localhost:1888/restore-nhanvien

# Hoặc sử dụng SQL
sqlcmd -S localhost -d hanet -E -i restore_nhanvien.sql
```

### Khi cần thêm nhân viên mới
1. **Tự động tạo** khi có webhook từ camera Hanet
2. **Thêm thủ công** vào bảng `NhanVien` qua dashboard (nếu cần)
3. **Tạo backup mới** sau khi có thay đổi
4. **Đồng bộ tự động** với dữ liệu từ webhook

## Lợi ích

### 1. Tự động đồng bộ
- ✅ **Tự động cập nhật** nhân viên từ webhook Hanet
- ✅ **Tạo nhân viên mới** khi có người chưa có trong hệ thống
- ✅ **Cập nhật thông tin** khi có dữ liệu mới từ camera

### 2. Bảo vệ dữ liệu
- ✅ **Backup tự động** để bảo vệ dữ liệu
- ✅ **Khôi phục nhanh** khi có sự cố
- ✅ **Dữ liệu đáng tin cậy** và được đồng bộ

### 3. Quản lý dễ dàng
- ✅ **API endpoints** để quản lý backup/restore
- ✅ **Script SQL** để thao tác thủ công
- ✅ **Dashboard** hoạt động ổn định

### 4. An toàn
- ✅ **Backup tự động** để bảo vệ dữ liệu
- ✅ **Khôi phục nhanh** khi có sự cố
- ✅ **Đồng bộ dữ liệu** với webhook Hanet

## Lưu ý quan trọng

✅ **Tự động cập nhật**: Bảng `NhanVien` sẽ tự động cập nhật từ webhook
✅ **Backup định kỳ**: Nên tạo backup định kỳ để bảo vệ dữ liệu
✅ **Đồng bộ tự động**: Nhân viên mới sẽ được tạo tự động từ webhook

## Trạng thái hiện tại
- ✅ **Server đang chạy** tại `http://localhost:1888`
- ✅ **Dashboard** hoạt động bình thường
- ✅ **Backup** đã được tạo với 16 nhân viên
- ✅ **API endpoints** sẵn sàng sử dụng
- ✅ **Script SQL** đã được tạo

**Hệ thống đã được bật lại với tính năng tự động cập nhật và bảo vệ dữ liệu!** 🚀🛡️
