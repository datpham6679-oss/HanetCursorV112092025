-- Script backup định kỳ bảng NhanVien
-- Chạy định kỳ để đảm bảo dữ liệu nhân viên được bảo vệ

-- Xóa bảng backup cũ nếu tồn tại
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'NhanVien_Backup')
BEGIN
    DROP TABLE NhanVien_Backup;
    PRINT 'Đã xóa bảng backup cũ'
END

-- Tạo bảng backup mới
SELECT * INTO NhanVien_Backup FROM NhanVien;

PRINT 'Đã tạo backup mới với ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' nhân viên'
PRINT 'Backup hoàn tất!'

-- Hiển thị thông tin backup
SELECT 
    COUNT(*) AS SoLuongNhanVien,
    MIN(NgayCapNhat) AS NgayCapNhatCuNhat,
    MAX(NgayCapNhat) AS NgayCapNhatMoiNhat
FROM NhanVien_Backup;
