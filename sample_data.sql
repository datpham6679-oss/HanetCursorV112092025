-- =============================================
-- Sample Data for Hanet Attendance System
-- Created: 2025-09-13
-- Description: Sample data for testing and demonstration
-- =============================================

USE hanet;
GO

-- =============================================
-- Sample Data: CaLamViec (Work Shifts)
-- =============================================
INSERT INTO CaLamViec (MaCa, TenCa, ThuBatDau, ThuKetThuc, GioBatDau, GioKetThuc, MoTa) VALUES
('HC', N'Hành chính', 2, 6, '06:00:00', '18:00:00', N'Ca hành chính từ thứ 2 đến thứ 6'),
('SC', N'Sửa chữa', 2, 6, '06:00:00', '18:00:00', N'Ca sửa chữa từ thứ 2 đến thứ 6'),
('VHCN', N'Vận hành ca ngày', 2, 7, '06:00:00', '20:00:00', N'Ca vận hành ngày từ thứ 2 đến chủ nhật'),
('VHCD', N'Vận hành ca đêm', 2, 7, '18:00:00', '08:00:00', N'Ca vận hành đêm từ thứ 2 đến chủ nhật, checkout ngày hôm sau');
GO

-- =============================================
-- Sample Data: NhanVien (Employees)
-- =============================================
INSERT INTO NhanVien (MaNhanVienNoiBo, MaNhanVienHANET, HoTen, CaLamViec, PhongBan, ChucVu, TrangThai) VALUES
('300029', '3047050104709054464', N'Phạm Quốc Đạt', 'HC', N'Tổ Thông tin', N'Nhân viên', N'Hoạt động'),
('060706', '060706', N'Hà Văn Quý', 'VH', N'Tổ Vận hành', N'Nhân viên', N'Hoạt động'),
('060707', '060707', N'Phạm Ngọc Doan', 'VH', N'Tổ Vận hành', N'Nhân viên', N'Hoạt động'),
('300001', '300001', N'Nguyễn Văn A', 'SC', N'Tổ Sửa chữa', N'Nhân viên', N'Hoạt động');
GO

-- =============================================
-- Sample Data: dulieutho (Raw Data) - Example records
-- =============================================
-- Note: This is just an example structure. In production, data comes from Hanet webhook
INSERT INTO dulieutho (event_id, person_id, employee_name, device_name, event_type, ts_vn, DaXuLy) VALUES
('SAMPLE_001', '3047050104709054464', N'Phạm Quốc Đạt', N'Tổ Thông tin_IN', 'checkin', '2025-09-13 08:00:00', 1),
('SAMPLE_002', '3047050104709054464', N'Phạm Quốc Đạt', N'Tổ Thông tin_OUT', 'checkout', '2025-09-13 17:00:00', 1),
('SAMPLE_003', '060706', N'Hà Văn Quý', N'Tổ Vận hành_IN', 'checkin', '2025-09-13 18:00:00', 1),
('SAMPLE_004', '060706', N'Hà Văn Quý', N'Tổ Vận hành_OUT', 'checkout', '2025-09-14 07:00:00', 1);
GO

-- =============================================
-- Sample Data: ChamCongDaXuLyMoi (Processed Attendance) - Example records
-- =============================================
INSERT INTO ChamCongDaXuLyMoi (MaNhanVienNoiBo, TenNhanVien, NgayVao, GioVao, NgayRa, GioRa, NgayChamCong, ThoiGianLamViec, TrangThai, DiaDiemVao, DiaDiemRa, CaLamViec) VALUES
('300029', N'Phạm Quốc Đạt', '2025-09-13', '2025-09-13 08:00:00', '2025-09-13', '2025-09-13 17:00:00', '2025-09-13', 9.0, N'Đúng giờ', N'Tổ Thông tin_IN', N'Tổ Thông tin_OUT', 'HC'),
('060706', N'Hà Văn Quý', '2025-09-13', '2025-09-13 18:00:00', '2025-09-14', '2025-09-14 07:00:00', '2025-09-13', 13.0, N'Đúng giờ', N'Tổ Vận hành_IN', N'Tổ Vận hành_OUT', 'VHCD');
GO

PRINT 'Sample data inserted successfully!';
GO
