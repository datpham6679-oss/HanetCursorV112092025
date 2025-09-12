-- =============================================
-- Script quản lý ca làm việc cho nhân viên
-- =============================================

-- 1. Xem danh sách nhân viên và ca làm việc hiện tại
SELECT 
    nv.MaNhanVienNoiBo,
    nv.HoTen,
    nv.PhongBan,
    nv.CaLamViec,
    cv.TenCa,
    cv.GioCheckinBatDau,
    cv.GioCheckinKetThuc,
    cv.GioCheckoutBatDau,
    cv.GioCheckoutKetThuc,
    cv.MoTa
FROM NhanVien nv
LEFT JOIN CaLamViec cv ON nv.CaLamViec = cv.MaCa
ORDER BY nv.MaNhanVienNoiBo;

-- 2. Xem danh sách ca làm việc có sẵn
SELECT * FROM CaLamViec ORDER BY MaCa;

-- 3. Cập nhật ca làm việc cho nhân viên
-- Ví dụ: Gán ca Hành chính cho nhân viên có mã 300029
-- UPDATE NhanVien SET CaLamViec = 'HC' WHERE MaNhanVienNoiBo = '300029';

-- Ví dụ: Gán ca Sửa chữa cho nhân viên có mã 300030
-- UPDATE NhanVien SET CaLamViec = 'SC' WHERE MaNhanVienNoiBo = '300030';

-- Ví dụ: Gán ca Vận hành ca ngày cho nhân viên có mã 300031
-- UPDATE NhanVien SET CaLamViec = 'VHCN' WHERE MaNhanVienNoiBo = '300031';

-- Ví dụ: Gán ca Vận hành ca đêm cho nhân viên có mã 300032
-- UPDATE NhanVien SET CaLamViec = 'VHCD' WHERE MaNhanVienNoiBo = '300032';

-- 4. Thêm nhân viên mới với ca làm việc
-- Ví dụ: Thêm nhân viên mới
-- INSERT INTO NhanVien (MaNhanVienNoiBo, HoTen, GioiTinh, PhongBan, ChucVu, CaLamViec, MaNhanVienHANET)
-- VALUES ('300033', N'Nguyễn Văn A', N'Nam', N'IT', N'Nhân viên', 'HC', 'HANET_ID_300033');

-- 5. Thống kê nhân viên theo ca làm việc
SELECT 
    cv.MaCa,
    cv.TenCa,
    COUNT(nv.MaNhanVienNoiBo) AS SoNhanVien
FROM CaLamViec cv
LEFT JOIN NhanVien nv ON cv.MaCa = nv.CaLamViec
GROUP BY cv.MaCa, cv.TenCa
ORDER BY cv.MaCa;
