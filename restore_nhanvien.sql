-- Script khôi phục dữ liệu bảng NhanVien từ backup
-- Sử dụng khi có lỗi mất dữ liệu nhân viên

-- Kiểm tra bảng backup có tồn tại không
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'NhanVien_Backup')
BEGIN
    PRINT 'Bảng NhanVien_Backup tồn tại. Bắt đầu khôi phục...'
    
    -- Xóa dữ liệu hiện tại trong bảng NhanVien
    DELETE FROM NhanVien;
    PRINT 'Đã xóa dữ liệu cũ trong bảng NhanVien'
    
    -- Khôi phục dữ liệu từ backup
    INSERT INTO NhanVien (HoTen, NamSinh, ChucVu, PhongBan, CaLamViec, MaNhanVienNoiBo, MaNhanVienHANET, NgayCapNhat)
    SELECT HoTen, NamSinh, ChucVu, PhongBan, CaLamViec, MaNhanVienNoiBo, MaNhanVienHANET, NgayCapNhat
    FROM NhanVien_Backup;
    
    PRINT 'Đã khôi phục ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' nhân viên từ backup'
    PRINT 'Khôi phục hoàn tất!'
END
ELSE
BEGIN
    PRINT 'LỖI: Bảng NhanVien_Backup không tồn tại!'
    PRINT 'Vui lòng tạo backup trước khi khôi phục'
END

-- Hiển thị số lượng nhân viên hiện tại
SELECT COUNT(*) AS SoLuongNhanVien FROM NhanVien;
